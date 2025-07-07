import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { getOrderStatusByName } from '../daos/orderStatusesDao.js';
import { getCaseOrderById, incrementAmountPaid, updateCaseOrderStatus } from '../daos/caseOrdersDao.js';

export const handlePayment = async (req, res, next) => {
    try {
        const { referenceId, amount } = req.body; // can add account number but we don't really care who pays for a persons order ...

        let order = await getCaseOrderById(referenceId);

        if (!order) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: getReasonPhrase(StatusCodes.NOT_FOUND) });
        };

        await incrementAmountPaid(referenceId, amount);

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