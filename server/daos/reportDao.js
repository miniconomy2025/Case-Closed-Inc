import { db } from "../db/knex.js";

const CASES_STOCK_VIEW = 'case_stock_status';
const EXTERNAL_ORDER_COUNTS = 'count_external_orders_by_received_status()';
const CASE_ORDER_COUNTS = 'count_case_orders()';
const SALES_REPORT = 'get_sales_report()';

export async function getBalanceFromBank() {
    // TODO: make call to bank to get actua balance for now this bad mock data
    return {balance: 1000000}
}

export async function getLoanTotalFromBank() {
    // TODO: make call to bank to get actua loan for now this bad mock data
    return {loan: 500000000}
}


export async function getOrderCounts() {
    const { rows } = await db.raw(`SELECT * FROM ${CASE_ORDER_COUNTS};`);
    return rows;
}


export async function getMaterialStockCount() {
    // TODO: hard coded stock id
    const stock = await db(CASES_STOCK_VIEW)
                .whereNot({stock_id: 4})
                .select('stock_name', 'available_units');

    return Object.fromEntries(stock.map(({ stock_name, available_units }) => [stock_name, parseInt(available_units)]));
}

export async function getTransactionsFromBank() {
    // TODO: make call to bank to get transaction history
    return [
        {
            id: 11,
            amount: 10000
        },
        {
            id: 10,
            amount: 50         
        }
    ];
}


export async function getAllShipments() {
    const { rows } = await db.raw(`SELECT * FROM ${EXTERNAL_ORDER_COUNTS};`);
    return rows[0];
}

export async function getSalesReport() {
    const { rows } = await db.raw(`SELECT * FROM ${SALES_REPORT};`);
    return rows[0];
}


export async function getCaseOrders() {
 const orders = await db('case_orders')
  .leftJoin('order_statuses', 'case_orders.order_status_id', 'order_statuses.id')
  .select(
    'case_orders.id as order_id',
    'case_orders.quantity',
    'case_orders.quantity_delivered',
    'case_orders.total_price',
    'case_orders.amount_paid',
    'case_orders.account_number',
    'case_orders.ordered_at',
    'order_statuses.id as status_id',
    'order_statuses.name as status_name'
  ).orderBy('case_orders.ordered_at', 'asc');
  return orders;
}

export async function getOrderStats() {
  const [row] = await db
    .select(db.raw(`
      COUNT(*) AS "totalOrders",
      COUNT(*) FILTER (WHERE os.name = 'payment_pending') AS "pendingPayment",
      COUNT(*) FILTER (WHERE os.name = 'pickup_pending') AS "pendingPickup",
      COUNT(*) FILTER (WHERE os.name = 'order_complete') AS "completed",
      COALESCE(SUM(co.total_price), 0) AS "totalRevenue",
      ROUND(AVG(co.total_price)::numeric, 2) AS "avgOrderValue"
    `))
    .from('case_orders as co')
    .join('order_statuses as os', 'co.order_status_id', 'os.id');
  return row;
}



