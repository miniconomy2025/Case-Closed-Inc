import { db } from '../db/knex.js';

const EXTERNAL_ORDERS_TABLE = 'external_orders';

export const getExternalOrderWithItems = async (orderReference) => {
    return db('external_orders as eo')
        .select(
            'eo.id as order_id',
            'eo.order_type_id',
            'eoi.stock_type_id',
            'eoi.ordered_units',
            'st.name as stock_type_name'
        )
        .leftJoin('external_order_items as eoi', 'eo.id', 'eoi.order_id')
        .leftJoin('stock_types as st', 'eoi.stock_type_id', 'st.id')
        .where('eo.order_reference', orderReference)
        .first();
};

export async function updateShipmentReference(orderReference, shipmentReference) {
    return await db(EXTERNAL_ORDERS_TABLE)
        .where({ order_reference: orderReference })
        .update({ shipment_reference: shipmentReference });
};