import ThohClient from './RawMaterialsClient.js';
import RecyclerClient from './RecyclerClient.js';
import BulkLogisticsClient from './BulkLogisticsClient.js';
import BankClient from './BankClient.js';
import logger from '../utils/logger.js';
import { createExternalOrderWithItems } from '../daos/externalOrdersDao.js';
import simulationTimer from '../controllers/simulationController.js';
import { getStockTypeIdByName } from '../daos/stockTypesDao.js';
import { increaseOrderedUnitsByTypeId } from '../daos/stockDao.js';
import { enqueuePickupRequest } from '../utils/sqsClient.js';

const OrderRawMaterialsClient = {
  async processOrderFlow({ name, quantity }) {
    try {
      // fetch materials from vendors individually to handle failures
      let thohMaterials = [];
      let recyclerMaterials = [];

      try {
        thohMaterials = await ThohClient.getRawMaterials();
      } catch (err) {
        logger.warn(`[OrderRawMaterialsClient] Thoh unavailable: ${err.message}`);
      }

      try {
        recyclerMaterials = await RecyclerClient.getRawMaterials();
      } catch (err) {
        logger.warn(`[OrderRawMaterialsClient] Recycler unavailable: ${err.message}`);
      }

      // check if we have any available vendor
      if (!thohMaterials.length && !recyclerMaterials.length) {
        throw new Error('No vendors are available to supply the material.');
      }

      // find the material info from both vendors
      const thohMaterial = thohMaterials.find((m) => m.name.toLowerCase() === name.toLowerCase());
      const recyclerMaterial = recyclerMaterials.find((m) => m.name.toLowerCase() === name.toLowerCase());

      if (!thohMaterial && !recyclerMaterial) {
        throw new Error(`Material ${name} not found in market.`);
      }

      // choose vendor: must have stock, pick the cheaper one
      let vendor, materialInfo;
      if (thohMaterial && recyclerMaterial) {
        if (recyclerMaterial.pricePerKg < thohMaterial.pricePerKg && recyclerMaterial.quantityAvailable >= quantity) {
          vendor = 'recycler';
          materialInfo = recyclerMaterial;
        } else {
          vendor = 'thoh';
          materialInfo = thohMaterial;
        }
      } else if (thohMaterial) {
        vendor = 'thoh';
        materialInfo = thohMaterial;
      } else {
        vendor = 'recycler';
        materialInfo = recyclerMaterial;
      }

      // adjust quantity to available stock (in multiples of 1000)
      if (materialInfo.quantityAvailable < quantity) {
        quantity = Math.floor(materialInfo.quantityAvailable / 1000) * 1000;
        if (quantity <= 0) {
          logger.warn(`[OrderRawMaterialsClient] ${vendor} has insufficient stock for ${name}`);
          return;
        }
      }

      const pricePerUnit = materialInfo.pricePerKg;
      const totalMaterialCost = parseFloat(pricePerUnit * quantity);

      // prepare fake items for logistics cost estimation
      const fakeItems = [{ itemName: name, quantity }];
      const pickupPreview = await BulkLogisticsClient.createPickupRequest('preview-order', vendor, fakeItems);
      const logisticsCost = parseFloat(pickupPreview.cost);

      const { balance } = await BankClient.getBalance();
      const totalCost = totalMaterialCost + logisticsCost;

      logger.info(`[OrderRawMaterialsClient] Vendor: ${vendor}`);
      logger.info(`[OrderRawMaterialsClient] Total material cost: ${totalMaterialCost}`);
      logger.info(`[OrderRawMaterialsClient] Estimated logistics cost: ${logisticsCost}`);
      logger.info(`[OrderRawMaterialsClient] Available balance: ${balance}`);

      if (totalCost > balance) {
        console.log(`Too expensive to place order for ${name}: ${quantity}`);
        return;
      }

      // attempt to place order with selected vendor
      let rawOrder;
      try {
        if (vendor === 'thoh') {
          var { success } = await BankClient.handPayment(rawOrder.price, rawOrder.orderId);
        } else {
          rawOrder = await RecyclerClient.createRawMaterialsOrder('electronics_supplier', [
            { rawMaterialName: name, quantityInKg: quantity }
          ]);

          // use recycler’s account number for payment
          const toAccount = rawOrder.accountNumber;
          var { success } = await BankClient.makePayment(toAccount, rawOrder.total, rawOrder.orderNumber);
        }
      } catch (err) {
        logger.warn(`[OrderRawMaterialsClient] Failed to order from ${vendor}: ${err.message}`);
        // try the other vendor if available
        const fallbackVendor = vendor === 'thoh' ? 'recycler' : 'thoh';
        const fallbackMaterial = fallbackVendor === 'thoh' ? thohMaterial : recyclerMaterial;
        if (fallbackMaterial && fallbackMaterial.quantityAvailable >= quantity) {
          try {
            if (fallbackVendor === 'thoh') {
              rawOrder = await ThohClient.createRawMaterialsOrder(name, quantity);
              var { success } = await BankClient.handPayment(rawOrder.price, rawOrder.orderId);
            } else {
              rawOrder = await RecyclerClient.createRawMaterialsOrder('electronics_supplier', [
                { rawMaterialName: name, quantityInKg: quantity }
              ]);

              const toAccount = rawOrder.accountNumber;
              var { success } = await BankClient.makePayment(toAccount, rawOrder.total, rawOrder.orderNumber);
            }
            vendor = fallbackVendor; // switch vendor
          } catch (err2) {
            throw new Error(`Failed to order from both vendors: ${err2.message}`);
          }
        } else {
          throw new Error(`Failed to order from ${vendor} and fallback vendor unavailable or out of stock.`);
        }
      }

      if (success) {
        // track order in db
        const stockId = await getStockTypeIdByName(name);
        await createExternalOrderWithItems(
          {
            order_reference: rawOrder.orderId || rawOrder.orderNumber,
            total_cost: rawOrder.price || rawOrder.total,
            order_type_id: 1,
            ordered_at: simulationTimer.getDate(),
          },
          [{
            stock_type_id: stockId,
            ordered_units: quantity,
            per_unit_cost: (rawOrder.price || rawOrder.total) / quantity,
          }]
        );
        await increaseOrderedUnitsByTypeId(stockId, quantity);

        // enqueue pickup request
        await enqueuePickupRequest({
          originalExternalOrderId: rawOrder.orderId || rawOrder.orderNumber,
          originCompany: vendor,
          items: [{ itemName: name, quantity }],
        });
      }

    } catch (err) {
      logger.error(`[OrderRawMaterialsClient] Error in order flow: ${err.message}`);
      throw err;
    }
  },
};

export default OrderRawMaterialsClient;