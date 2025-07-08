import { StatusCodes } from 'http-status-codes';
import { getExternalOrderWithItems } from '../daos/externalOrdersDao.js';
import { decrementStockByName, incrementStockByName } from '../daos/stockDao.js';
import { getCaseOrderById, updateCaseOrderStatus, incrementQuantityDelivered } from '../daos/caseOrdersDao.js';
import { getOrderStatusByName } from '../daos/orderStatusesDao.js';

/**
 * KEY NOTE: ID is either:
 * 1. orderReference - external order
 * 2. id - case order
 */
export const handleLogistics = async (req, res, next) => {
    try {
        const { id, type, quantity } = req.body; 

        switch (type) {
            case 'DELIVERY':
                const deliveryOrder = await getExternalOrderWithItems(id);
                if (!deliveryOrder) {
                    return res
                        .status(StatusCodes.NOT_FOUND)
                        .json({ error: 'Delivery order not found' });
                };
                console.log(deliveryOrder);
                await incrementStockByName(deliveryOrder.stock_type_name, quantity);
                return res
                    .status(StatusCodes.OK)
                    .json({ message: 'Successfully received external order' });

            case 'PICKUP':
                const order = await getCaseOrderById(id);
                if (!order) {
                    return res
                        .status(StatusCodes.NOT_FOUND)
                        .json({ error: 'Order not found' });
                };
                const pickupPendingStatus = await getOrderStatusByName('pickup_pending');
                if (order.order_status_id !== pickupPendingStatus.id) {
                    return res
                        .status(StatusCodes.BAD_REQUEST)
                        .json({ error: 'Payment has not been received for order.' });
                };

                if (quantity + order.quantity_delivered > order.quantity) {
                    return res
                        .status(StatusCodes.BAD_REQUEST)
                        .json({ error: 'Requested quantity exceeded for order id. ' });
                }

                // revoke stock after pickup
                await decrementStockByName('case', quantity);
                const updatedOrder = await incrementQuantityDelivered(id, quantity)

                if (updatedOrder.quantity < updatedOrder.quantity_delivered) {
                    const completeStatus = await getOrderStatusByName('order_complete');
                    await updateCaseOrderStatus(id, completeStatus.id);
                }

                return res
                    .status(StatusCodes.OK)
                    .json({ message: 'Successfully notified of pickup' });
            default:
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ error: 'Unknown delivery type' });
        };
    } catch (error) {
        next(error);
    };
};

