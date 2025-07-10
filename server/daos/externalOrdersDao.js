import { db } from '../db/knex.js';

const EXTERNAL_ORDERS_TABLE = 'external_orders';
const EXTERNAL_ORDER_ITEMS_TABLE = 'external_order_items';

/**
 * Creates an external order and its associated items in a single transaction.
 *
 * @param {Object} order - The external order data.
 * @param {string} order.order_reference
 * @param {number} order.total_cost
 * @param {number} order.order_type_id
 * @param {string|null} [order.shipment_reference]
 * @param {Date|string} order.ordered_at
 * @param {Date|string|null} [order.received_at]
 * @param {Array<Object>} items - List of external_order_items to insert.
 *        Each item must have: stock_type_id, ordered_units, per_unit_cost
 * @returns {Promise<number>} The ID of the inserted external order.
 */
export async function createExternalOrderWithItems(order, items) {
  return await db.transaction(async (trx) => {
    const [orderId] = await trx(EXTERNAL_ORDERS_TABLE)
      .insert({
        order_reference: order.order_reference,
        total_cost: order.total_cost,
        order_type_id: order.order_type_id,
        shipment_reference: order.shipment_reference || null,
        ordered_at: order.ordered_at,
        received_at: order.received_at || null
      })
      .returning('id');

    const itemRows = items.map((item) => ({
      stock_type_id: item.stock_type_id,
      order_id: orderId.id,
      ordered_units: item.ordered_units,
      per_unit_cost: item.per_unit_cost
    }));

    await trx(EXTERNAL_ORDER_ITEMS_TABLE).insert(itemRows);

    return orderId;
  });
}

export const getExternalOrderWithItems = async (shipmentReference) => {
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
        .where('eo.shipment_reference', shipmentReference)
        .first();
};

export async function updateShipmentReference(orderReference, shipmentReference) {
    return await db(EXTERNAL_ORDERS_TABLE)
        .where({ order_reference: orderReference })
        .update({ shipment_reference: shipmentReference });
};