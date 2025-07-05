import { db } from '../db/knex.js';

const TABLE_NAME = 'incoming_orders';

export async function receivedDelivery(shipmentReference) {
    return await db(TABLE_NAME)
        .where({ shipment_reference: shipmentReference })
        .update({ received_at: new Date() });
};

export async function getOrderByShipmentReference(shipmentReference) {
    return await db(TABLE_NAME)
        .where({ shipment_reference: shipmentReference })
        .first();
};