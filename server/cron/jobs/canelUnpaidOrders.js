import { getUnpaidOrdersOlderThan, updateCaseOrderStatus } from "../../daos/caseOrdersDao.js";
import { getOrderStatusByName } from "../../daos/orderStatusesDao.js";
import logger from "../../utils/logger.js";

export default class CancelUnpaidOrdersJob {
    async run() {
        try {
            const unpaidOrders = await getUnpaidOrdersOlderThan(7);

            if (!unpaidOrders || unpaidOrders.length === 0) {
                logger.info(`[CancelUnpaidOrdersJob]: No unpaid orders older than 7 days.`);

            } else {
                const cancelledStatus = await getOrderStatusByName('order_cancelled');

                for (const order of unpaidOrders) {
                    await updateCaseOrderStatus(order.id, cancelledStatus.id);
                    logger.info(`[CancelUnpaidOrdersJob]: Order ${order.id} cancelled.`);
                }
            }

        } catch (error) {
            logger.error(`[CancelUnpaidOrdersJob]: Error cancelling orders - ${error.message}`);
        }
    }
}