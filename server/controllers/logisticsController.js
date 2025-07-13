import { StatusCodes } from 'http-status-codes';
import { getExternalOrderWithItems } from '../daos/externalOrdersDao.js';
import { decrementStockByName, deliverStockByName } from '../daos/stockDao.js';
import { getCaseOrderById, updateCaseOrderStatus, incrementQuantityDelivered } from '../daos/caseOrdersDao.js';
import { getOrderStatusByName } from '../daos/orderStatusesDao.js';
import { getCaseMachineWeight } from '../daos/equipmentParametersDao.js';

/**
 * KEY NOTE: ID is either:
 * 1. orderReference - external order
 * 2. id - case order
 */
export const handleLogistics = async (req, res, next) => {
    try {
        const { id, type, items } = req.body; 

        if (!items || items.length !== 1) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ error: 'Unexpected number of items' });
        }

        // as per business logic this should always have a length of 1
        const { name, quantity } = items[0]; 

        switch (type) {
            case 'DELIVERY':
                const deliveryOrder = await getExternalOrderWithItems(id);
                if (!deliveryOrder) {
                    return res
                        .status(StatusCodes.NOT_FOUND)
                        .json({ error: 'Delivery order not found' });
                };
                if (deliveryOrder.stock_type_name === 'machine') {
                    const weightPerUnit = await getCaseMachineWeight();
                    const machineQuantity = Math.ceil(quantity / weightPerUnit);
                    await deliverStockByName(deliveryOrder.stock_type_name, machineQuantity);
                } else {
                    await deliverStockByName(deliveryOrder.stock_type_name, quantity);
                };
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
                        .json({ error: 'Pickup not pending.' });
                };

                if (quantity + order.quantity_delivered > order.quantity) {
                    return res
                        .status(StatusCodes.BAD_REQUEST)
                        .json({ error: 'Requested quantity exceeded for order id. ' });
                }

                // revoke stock after pickup
                await decrementStockByName('case', quantity);
                await incrementQuantityDelivered(id, quantity);
                const updatedOrder = await getCaseOrderById(id);

                if (updatedOrder.quantity <= updatedOrder.quantity_delivered) {
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

