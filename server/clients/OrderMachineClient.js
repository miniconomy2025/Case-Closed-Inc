import logger from "../utils/logger.js";
import ThohClient from "./ThohClient.js";

const OrderMachineClient = {
  async processMachineOrderFlow({ machineName, quantity }) {
    // 1. Get available machines from Thoh
    const { machines } = await ThohClient.getMachinesForSale();
    const found = machines.find(
      (m) => m.machineName.toLowerCase() === machineName.toLowerCase()
    );
    if (!found || found.quantity < quantity) {
      logger.error(
        `Not enough machines available for ${machineName}. Requested: ${quantity}, Available: ${
          found ? found.quantity : 0
        }`
      );
      return null;
    }
    logger.info(`Ordering ${quantity} of ${machineName} from Thoh.`);
    // 2. Place the order
    const orderRes = await ThohClient.purchaseMachine({
      machineName,
      quantity,
    });
    logger.info(`Machine order placed:`, orderRes);
    return orderRes;
  },
};

export default OrderMachineClient;
