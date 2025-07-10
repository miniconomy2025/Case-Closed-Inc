import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { getOrderStatusByName } from '../daos/orderStatusesDao.js';
import { getCaseOrderById, updateCaseOrderStatus, updateOrderPaymentAndAccount } from '../daos/caseOrdersDao.js';
import BankClient from '../clients/BankClient.js';
import MockBankClient from '../clients/MockBankClient.js';

export const handlePayment = async (req, res, next) => {
    try {
        const { referenceId, accountNumber, amount } = req.body;

        let order = await getCaseOrderById(referenceId);

        if (!order) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: getReasonPhrase(StatusCodes.NOT_FOUND) });
        };

        const cancelledStatus = await getOrderStatusByName('order_cancelled');

        if (order.order_status_id === cancelledStatus) {
            await BankClient.makePayment(accountNumber, amount * 0.8, `Order already cancelled, refunding 80% of order ID: ${referenceId}`);
            return res
                .status(StatusCodes.OK)
                .json({ message: 'Refund on cancelled order' });
        };

        await updateOrderPaymentAndAccount(referenceId, amount, accountNumber);

        order = await getCaseOrderById(referenceId);

        if (order.total_price <= order.amount_paid) {

            const pickupPendingStatus = await getOrderStatusByName('pickup_pending');

            await updateCaseOrderStatus(referenceId, pickupPendingStatus.id);

            return res
                .status(StatusCodes.OK)
                .json({ message: 'Complete payment received' });
        };

        return res
            .status(StatusCodes.OK)
            .json({ message: 'Partial payment received' });

    } catch (error) {
        next(error);
    };
};