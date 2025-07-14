// CancelUnpaidOrdersJob.js
import { getPendingOrders, updateCaseOrderStatus } from "../../daos/caseOrdersDao.js";
import { getOrderStatusByName } from "../../daos/orderStatusesDao.js";
import logger from "../../utils/logger.js";
import { BankClient } from "../../clients/index.js";

export default class CancelUnpaidOrdersJob {
    constructor(simulationTimer) {
        this.simulationTimer = simulationTimer;
    }

    async run() {
        try {
            const unpaidOrders = await getPendingOrders();
            const expiredOrders = [];

            for (const order of unpaidOrders) {
                if (this.simulationTimer.getDaysPassed(order.ordered_at) > 7) {
                    expiredOrders.push(order);
                }
            }

            if (expiredOrders.length === 0) {
                logger.info(`[CancelUnpaidOrdersJob]: No unpaid orders older than 7 days.`);
            } else {
                const cancelledStatus = await getOrderStatusByName('order_cancelled');

                for (const order of expiredOrders) {
                    await updateCaseOrderStatus(order.id, cancelledStatus.id);

                    // refund amount paid
                    if (order.amount_paid > 0 && order.account_number) {
                        await BankClient.makePayment(order.account_number, order.amount_paid * 0.8, `Order cancelled, refunding 80% of order ID: ${order.id}`)
                    }

                    logger.info(`[CancelUnpaidOrdersJob]: Order ${order.id} cancelled.`);
                }
            }

        } catch (error) {
            logger.error(`[CancelUnpaidOrdersJob]: Error cancelling orders - ${error.message}`);
        }
    }
}