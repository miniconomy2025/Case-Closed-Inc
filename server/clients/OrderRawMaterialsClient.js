import ThohClient from "./RawMaterialsClient.js";
import BulkLogisticsClient from "./BulkLogisticsClient.js";
import BankClient from "./BankClient.js";
import logger from "../utils/logger.js";
import {
  createExternalOrderWithItems,
  updateShipmentReference,
} from "../daos/externalOrdersDao.js";
import simulationTimer from "../controllers/simulationController.js";
import { getStockTypeIdByName } from "../daos/stockTypesDao.js";
import { increaseOrderedUnitsByTypeId } from "../daos/stockDao.js";
import { enqueuePickupRequest } from "../utils/sqsClient.js";
const PICKUP_QUEUE_URL = process.env.PICKUP_QUEUE_URL;

const OrderRawMaterialsClient = {
  async processOrderFlow({ name, quantity }) {
    try {
      // get material price
      const materials = await ThohClient.getRawMaterials();
      const materialInfo = materials.find(
        (m) => m.rawMaterialName.toLowerCase() === name.toLowerCase()
      );

      if (!materialInfo) {
        throw new Error(`Material ${name} not found in market.`);
      }

      if (materialInfo.quantityAvailable < quantity) {
        quantity = Math.floor(materialInfo.quantityAvailable / 1000) * 1000;
      }

      const pricePerUnit = materialInfo.pricePerKg;
      let totalMaterialCost = pricePerUnit * quantity;

      // estimate logistics cost with fake order
      const fakeItems = [{ itemName: name, quantity: quantity }];
      const pickupPreview = await BulkLogisticsClient.createPickupRequest(
        "preview-order",
        "thoh",
        fakeItems
      );

      const logisticsCost = pickupPreview.cost;
      const { balance } = await BankClient.getBalance();

      const totalCost = totalMaterialCost + logisticsCost;

      logger.info(
        `[OrderRawMaterialsClient] Total material cost: ${totalMaterialCost}`
      );
      logger.info(
        `[OrderRawMaterialsClient] Estimated logistics cost: ${logisticsCost}`
      );
      logger.info(`[OrderRawMaterialsClient] Available balance: ${balance}`);

      // TODO future enhancement: calculate affordable quantity
      if (totalCost > balance) {
        console.log(`To expensive to place order for ${name}: ${quantity}`);
        return;
      }

      // create raw material order
      const rawOrder = await ThohClient.createRawMaterialsOrder(name, quantity);

      const externalOrderObj = {
        order_reference: rawOrder.orderId,
        total_cost: rawOrder.price,
        order_type_id: 1,
        ordered_at: simulationTimer.getDate(),
      };

      const stockId = await getStockTypeIdByName(rawOrder.materialName);

      const externalOrderItemsObj = [
        {
          stock_type_id: stockId,
          ordered_units: rawOrder.weightQuantity,
          per_unit_cost: rawOrder.price / rawOrder.weightQuantity,
        },
      ];

      await createExternalOrderWithItems(
        externalOrderObj,
        externalOrderItemsObj
      );
      await increaseOrderedUnitsByTypeId(stockId, quantity);

      // pay for material order
      const materialPayment = await BankClient.makePayment(
        rawOrder.bankAccount,
        rawOrder.price,
        rawOrder.orderId
      );
      logger.info(
        `[OrderRawMaterialsClient] Paid for raw material order: ${materialPayment}`
      );

      try {
        await db.transaction(async (trx) => {
          // Try to create pickup request
          const pickupRequest = await BulkLogisticsClient.createPickupRequest(
            rawOrder.orderId,
            "thoh",
            [{ itemName: name, quantity }]
          );
          // Try to pay for pickup
          await BankClient.makePayment(
            pickupRequest.bulkLogisticsBankAccountNumber,
            pickupRequest.cost,
            pickupRequest.pickupRequestId
          );
          // If both succeed, update shipment reference, etc.
          await updateShipmentReference(
            rawOrder.orderId,
            pickupRequest.pickupRequestId,
            trx
          );
        });
      } catch (err) {
        // If either fails, enqueue for retry
        await enqueuePickupRequest(PICKUP_QUEUE_URL, {
          originalExternalOrderId: rawOrder.orderId,
          originCompanyId: "thoh",
          destinationCompanyId: "case-supplier",
          items: [{ itemName: name, quantity }],
        });
        logger.error(
          `[OrderRawMaterialsClient] Pickup/payment failed, enqueued for retry: ${err.message}`
        );
      }
    } catch (err) {
      logger.error(
        `[OrderRawMaterialsClient] Error in order flow: ${err.message}`
      );
      throw err;
    }
  },
};

export default OrderRawMaterialsClient;
