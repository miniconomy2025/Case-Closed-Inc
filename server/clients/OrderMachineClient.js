import ThohClient from './RawMaterialsClient.js';
import BulkLogisticsClient from './BulkLogisticsClient.js';
import BankClient from './BankClient.js';
import logger from '../utils/logger.js';
import { updateShipmentReference } from '../daos/externalOrdersDao.js';

const OrderMachineClient = {
  async processOrderFlow(quantity) {
    try {
      // get machine price
      const machines = await ThohClient.getMachines();
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

      logger.info(`[OrderMachineCLient] Total machine cost: ${totalMaterialCost}`);
      logger.info(`[OrderMachineClient] Estimated logistics cost: ${logisticsCost}`);
      logger.info(`[OrderMachineClient] Available balance: ${balance}`);

      // TODO future enhancement: calculate affordable quantity
      if (totalCost > balance) {
        return;
      }

      // create raw material order
      const machineOrder = await ThohClient.createMachineOrder(quantity);

      // pay for material order
      const machinePayment = await BankClient.makePayment(machineOrder.bankAccount, machineOrder.totalPrice, machineOrder.orderId)
      logger.info(`[OrderRawMaterialsClient] Paid for raw material order: ${machinePayment}`);

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