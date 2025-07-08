import { db } from '../db/knex.js';

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