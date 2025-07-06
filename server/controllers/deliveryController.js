import { StatusCodes } from 'http-status-codes';
import { getOrderByShipmentReference, receivedDelivery } from '../daos/incomingOrdersDao.js';
import { increaseMaterialStock } from '../daos/materialDao.js';
import { increaseNumberOfMachines } from '../daos/machineryDao.js';

/**
 * Handles deliveries from the bulk logistics team
 * They will hit this endpoint to mark that a delivery has been made
 * It will have the order reference number / order ID
 * We will then check our database:
 *      1. increase our stock with the delivered goods
 *      2. move the delivery status to complete
 */
export const handleDelivery = async (req, res, next) => {
    try {
        const shipmentReference = req.params.id;

        const order = await getOrderByShipmentReference(shipmentReference);

        if (!order) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ error: 'Delivery order not found' });
        };

        if (order.received_at) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ error: 'Delivery already marked as received' });
        };

        const deliveryType = order.type;

        switch (deliveryType) {

            case 'material':

                // Increase material stock
                await increaseMaterialStock(order.material_id, order.quantity_kg);
                break;

            case 'machinery':

                // Increase number of machines
                await increaseNumberOfMachines(order.amount);
                break;

            default:
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ error: 'Unknown delivery type' });
        };

        // Mark the delivery as received
        await receivedDelivery(shipmentReference);

        return res
            .status(StatusCodes.OK)
            .json({ message: 'Delivery successfully recorded' });

    } catch (error) {
        next(error);
    };
};

