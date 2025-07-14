import ThohClient from './RawMaterialsClient.js';
import BulkLogisticsClient from './BulkLogisticsClient.js';
import BankClient from './BankClient.js';
import logger from '../utils/logger.js';
import { createExternalOrderWithItems, updateShipmentReference } from '../daos/externalOrdersDao.js';
import simulationTimer from '../controllers/simulationController.js';
import { getStockTypeIdByName } from '../daos/stockTypesDao.js';
import { increaseOrderedUnitsByTypeId } from '../daos/stockDao.js';
import { enqueuePickupRequest } from '../utils/sqsClient.js';

const OrderRawMaterialsClient = {
  async processOrderFlow({ name, quantity }) {
    try {
      // get material price
      const materials = await ThohClient.getRawMaterials();
      const materialInfo = materials.find((m) => m.rawMaterialName.toLowerCase() === name.toLowerCase());

      if (!materialInfo) {
        throw new Error(`Material ${name} not found in market.`);
      }

      if (materialInfo.quantityAvailable < quantity) {
        quantity = Math.floor(materialInfo.quantityAvailable / 1000) * 1000;
      }

      const pricePerUnit = materialInfo.pricePerKg;
      const totalMaterialCost = parseFloat(pricePerUnit * quantity);

      const fakeItems = [{ itemName: name, quantity }];
      const pickupPreview = await BulkLogisticsClient.createPickupRequest('preview-order', 'thoh', fakeItems);
      const logisticsCost = parseFloat(pickupPreview.cost);

      const { balance } = await BankClient.getBalance();
      const totalCost = totalMaterialCost + logisticsCost;

      logger.info(`[OrderRawMaterialsClient] Total material cost: ${totalMaterialCost}`);
      logger.info(`[OrderRawMaterialsClient] Estimated logistics cost: ${logisticsCost}`);
      logger.info(`[OrderRawMaterialsClient] Available balance: ${balance}`);

      if (totalCost > balance) {
        console.log(`Too expensive to place order for ${name}: ${quantity}`);
        return;
      }

      const rawOrder = await ThohClient.createRawMaterialsOrder(name, quantity);
      const { success } = await BankClient.handPayment(rawOrder.price, rawOrder.orderId);

      if (success) {
        // track order in db
        const stockId = await getStockTypeIdByName(rawOrder.materialName);
        await createExternalOrderWithItems(
          {
            order_reference: rawOrder.orderId,
            total_cost: rawOrder.price,
            order_type_id: 1,
            ordered_at: simulationTimer.getDate(),
          },
          [{
            stock_type_id: stockId,
            ordered_units: rawOrder.weightQuantity,
            per_unit_cost: rawOrder.price / rawOrder.weightQuantity,
          }]
        );
        await increaseOrderedUnitsByTypeId(stockId, quantity);

        // enqueue pickup request
        await enqueuePickupRequest({
          originalExternalOrderId: rawOrder.orderId,
          originCompany: 'thoh',
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