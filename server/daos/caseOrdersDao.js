import { db } from "../db/knex.js";

const TABLE_NAME = 'case_orders'

export async function getCaseOrderById(id) {
    return await db(TABLE_NAME).where({ id }).first();
}

export async function createCaseOrder({ order_status_id, quantity, total_price, ordered_at }) {
  const [caseOrder] = await db(TABLE_NAME)
    .insert({ order_status_id, quantity, total_price, ordered_at })
    .returning(['id', 'order_status_id', 'quantity', 'total_price', 'ordered_at']);
  return caseOrder;
}

export async function updateCaseOrderStatus(orderId, orderStatusId) {
    return await db(TABLE_NAME)
        .where({ id: orderId })
        .update({ order_status_id: orderStatusId });
}

export async function getCasePrice(plastic = 4, aluminium = 7, markup = 1.3) {
  const result = await db.raw(
    `SELECT * FROM calculate_case_price(?, ?, ?)`,
    [plastic, aluminium, markup]
  );
  return result.rows?.[0] ?? null;
}