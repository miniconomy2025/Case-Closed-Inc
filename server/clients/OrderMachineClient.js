import ThohClient from './RawMaterialsClient.js';
import BulkLogisticsClient from './BulkLogisticsClient.js';
import BankClient from './BankClient.js';
import logger from '../utils/logger.js';
import { createExternalOrderWithItems, updateShipmentReference } from '../daos/externalOrdersDao.js';
import simulationTimer from '../controllers/simulationController.js';

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

      const pricePerUnit = machineInfo.price;
      let totalMachineCost = pricePerUnit * quantity;

      // estimate logistics cost with fake order
      const fakeItems = [{ materialName: "case_machine", weightQuantity: quantity }];
      const pickupPreview = await BulkLogisticsClient.createPickupRequest(
        'preview-order',
        'thoh',
        fakeItems
      );

      const logisticsCost = pickupPreview.cost;
      const { balance } = await BankClient.getBalance();

      const totalCost = totalMachineCost + logisticsCost;

      logger.info(`[OrderMachineCLient] Total machine cost: ${totalMachineCost}`);
      logger.info(`[OrderMachineClient] Estimated logistics cost: ${logisticsCost}`);
      logger.info(`[OrderMachineClient] Available balance: ${balance}`);

      // TODO future enhancement: calculate affordable quantity
      if (totalCost > balance) {
        return;
      }

      // create raw material order
      const machineOrder = await ThohClient.createMachineOrder(quantity);

      const externalOrderObj = {
        order_reference: machineOrder.orderId,
        total_cost: machineOrder.totalPrice,
        order_type_id: 2,
        ordered_at: simulationTimer.getDate()
      };

      const stockId = await getStockTypeIdByName(machineOrder.materialName);

      const externalOrderItemsObj = {
        stock_type_id: stockId,
        ordered_units: machineOrder.quantity,
        per_unit_cost: machineOrder.totalPrice / machineOrder.quantity
      };

      const response = await createExternalOrderWithItems(externalOrderObj, externalOrderItemsObj);
      console.log(response);

      // pay for material order
      const { status, transactionNumber }  = await BankClient.makePayment(machineOrder.bankAccount, machineOrder.totalPrice, machineOrder.orderId)
      logger.info(`[OrderMachineCLient] Paid for raw material order: ${status}: ${transactionNumber}`);

      // create pickup request
      const items = [{ materialName: "case_machine", weightQuantity: quantity }];
      const pickupRequest = await BulkLogisticsClient.createPickupRequest(
        machineOrder.orderId,
        'thoh',
        items
      );

      // pay for pickup request
      const pickupPayment = await BankClient.makePayment(pickupRequest.bulkLogisticsBankAccountNumber, pickupRequest.cost, pickupRequest.pickupRequestId)
      logger.info(`[OrderMachineCLient] Paid for raw material order: ${pickupPayment}`);

      await updateShipmentReference(machineOrder.orderId, pickupRequest.pickupRequestId)
  
    } catch (err) {
      logger.error(`[OrderMachineCLient] Error in order flow: ${err.message}`);
      throw err;
    }
  },
};

export default OrderMachineClient;