import { db } from "../db/knex.js";
import { getOrderStatusByName } from "./orderStatusesDao.js";

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

export async function getCasePrice(plastic = 4, aluminium = 7, markup = 4) {
  const result = await db.raw(
    `SELECT * FROM calculate_case_price(?, ?, ?)`,
    [plastic, aluminium, markup]
  );
  return result.rows?.[0] ?? null;
}

export async function getUnpaidOrdersOlderThan(days) {
  const pendingStatus = await getOrderStatusByName('payment_pending');

  if (!pendingStatus) {
    throw new Error(`Order status 'payment_pending' not found`);
  }

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  return await db(TABLE_NAME)
    .where('order_status_id', pendingStatus.id)
    .andWhere('ordered_at', '<', dateLimit)
    .select('*');
}

export async function getPendingOrders(days) {
  const pendingStatus = await getOrderStatusByName('payment_pending');

  if (!pendingStatus) {
    throw new Error(`Order status 'payment_pending' not found`);
  }

  return await db(TABLE_NAME)
    .where('order_status_id', pendingStatus.id)
    .select('*');
}

export const incrementAmountPaid = async (orderId, amount) => {
  return db(TABLE_NAME)
    .where({ id: orderId })
    .increment('amount_paid', amount);
};

export const incrementQuantityDelivered = async (orderId, quantity) => {
  return db(TABLE_NAME)
    .where({ id: orderId })
    .increment('quantity_delivered', quantity);
};

export const updateOrderAccountNumber = async (orderId, accountNumber) => {
  return db(TABLE_NAME)
    .where({ id: orderId })
    .update({ account_number: accountNumber });
};

export const updateOrderPaymentAndAccount = async (orderId, amount, accountNumber) => {
  return db(TABLE_NAME)
    .where({ id: orderId })
    .update({ account_number: accountNumber })
    .increment('amount_paid', amount);
};