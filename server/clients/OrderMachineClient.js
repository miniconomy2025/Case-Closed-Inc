import ThohClient from './RawMaterialsClient.js';
import BulkLogisticsClient from './BulkLogisticsClient.js';
import BankClient from './BankClient.js';
import logger from '../utils/logger.js';
import { createExternalOrderWithItems } from '../daos/externalOrdersDao.js';
import simulationTimer from '../controllers/simulationController.js';
import { increaseOrderedUnitsByTypeId } from '../daos/stockDao.js';
import { getStockTypeIdByName } from '../daos/stockTypesDao.js';
import { enqueuePickupRequest } from '../utils/sqsClient.js';
import { updateCaseMachineWeight } from '../daos/equipmentParametersDao.js';

const OrderMachineClient = {
  async processOrderFlow(quantity) {
    try {
      // get machine price
      const { machines } = await ThohClient.getMachines();
      const machineInfo = machines.find((m) => m.machineName.toLowerCase() === "case_machine");

      if (!machineInfo) {
        throw new Error(`Case machine not found in market.`);
      }

      if (machineInfo.quantity < quantity) {
        quantity = machineInfo.quantity;
      }

      const pricePerUnit = parseFloat(machineInfo.price);
      const totalMachineCost = pricePerUnit * quantity;

      // estimate logistics cost with fake order
      const fakeItems = [{ itemName: "case_machine", quantity }];
      const pickupPreview = await BulkLogisticsClient.createPickupRequest(
        'preview-order',
        'thoh',
        fakeItems
      );

      const logisticsCost = parseFloat(pickupPreview.cost);
      const { balance } = await BankClient.getBalance();
      const totalCost = totalMachineCost + logisticsCost;

      logger.info(`[OrderMachineClient] Total machine cost: ${totalMachineCost}`);
      logger.info(`[OrderMachineClient] Estimated logistics cost: ${logisticsCost}`);
      logger.info(`[OrderMachineClient] Available balance: ${balance}`);

      if (totalCost > balance) {
        logger.warn(`[OrderMachineClient] Not enough balance to place order.`);
        return;
      }

      // create raw material order
      const machineOrder = await ThohClient.createMachineOrder(quantity);
      await updateCaseMachineWeight(machineOrder.unitWeight);

      // pay for material order
      const { status, transactionNumber, success } = await BankClient.handPayment(
        machineOrder.totalPrice,
        machineOrder.orderId
      );
      logger.info(`[OrderMachineClient] Paid for machine order: ${status}: ${transactionNumber}`);

      if (success) {
        // track order in db
        const stockId = await getStockTypeIdByName('machine');

        const externalOrderObj = {
          order_reference: machineOrder.orderId,
          total_cost: machineOrder.totalPrice,
          order_type_id: 2,
          ordered_at: simulationTimer.getDate(),
        };
        const externalOrderItemsObj = [{
          stock_type_id: stockId,
          ordered_units: machineOrder.quantity,
          per_unit_cost: machineOrder.totalPrice / machineOrder.quantity,
        }];

        await createExternalOrderWithItems(externalOrderObj, externalOrderItemsObj);
        await increaseOrderedUnitsByTypeId(stockId, quantity);

        // enqueue pickup request
        const items = [{ itemName: "case_machine", quantity: machineOrder.totalWeight }];
        await enqueuePickupRequest({
          originalExternalOrderId: machineOrder.orderId,
          originCompany: 'thoh',
          items,
        });

        logger.info(`[OrderMachineClient] Enqueued pickup request for machine order ${machineOrder.orderId}`);
      }

    } catch (err) {
      logger.error(`[OrderMachineClient] Error in order flow: ${err.message}`);
      throw err;
    }
  },
};

export default OrderMachineClient;
