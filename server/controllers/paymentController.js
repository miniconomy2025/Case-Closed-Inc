import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { getOrderStatusByName } from '../daos/orderStatusesDao.js';
import { getCaseOrderById, updateCaseOrderStatus, updateOrderPaymentAndAccount } from '../daos/caseOrdersDao.js';
import BankClient from '../clients/BankClient.js';

export const handlePayment = async (req, res, next) => {
    try {
        const { description, from, amount, status } = req.body;

        if (status == "success") {
            let order = await getCaseOrderById(description);

            if (!order) {
                return res
                    .status(StatusCodes.NOT_FOUND)
                    .json({ error: getReasonPhrase(StatusCodes.NOT_FOUND) });
            };

            const cancelledStatus = await getOrderStatusByName('order_cancelled');

            if (order.order_status_id === cancelledStatus) {
                await BankClient.makePayment(from, amount * 0.8, `Order already cancelled, refunding 80% of order ID: ${description}`);
                return res
                    .status(StatusCodes.OK)
                    .json({ message: 'Refund on cancelled order' });
            };

            await updateOrderPaymentAndAccount(description, amount, from);

            order = await getCaseOrderById(description);

            if (order.total_price <= order.amount_paid) {

                const pickupPendingStatus = await getOrderStatusByName('pickup_pending');

                await updateCaseOrderStatus(description, pickupPendingStatus.id);

                return res
                    .status(StatusCodes.OK)
                    .json({ message: 'Complete payment received' });
            };

            return res
                .status(StatusCodes.OK)
                .json({ message: 'Partial payment received' });
        }

        return res
            .status(StatusCodes.OK)
            .json({});


    } catch (error) {
        next(error);
    };
};