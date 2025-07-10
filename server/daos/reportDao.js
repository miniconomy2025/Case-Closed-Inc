import { db } from "../db/knex.js";
import apiUrls from "../utils/companyUrls.js";
import simulationTimer from "../controllers/simulationController.js";

import { getStockByName } from "./stockDao.js";

const CASES_STOCK_VIEW = 'case_stock_status';
const EXTERNAL_ORDER_COUNTS = 'count_external_orders_by_received_status()';
const CASE_ORDER_COUNTS = 'count_case_orders()';
const SALES_REPORT = 'get_sales_report()';


export async function getOrderCounts() {
    const { rows } = await db.raw(`SELECT * FROM ${CASE_ORDER_COUNTS};`);
    return rows;
}


export async function getMaterialStockCount() {
    const plasticStock = await getStockByName('plastic');
    const aluminiumStock = await getStockByName('aluminium');
    const machineStock = await getStockByName('machine');

    const stock = {
        plastic: plasticStock.total_units, 
        aluminium: aluminiumStock.total_units,  
        machine: machineStock.total_units
    }

    return stock;
}

export async function getTransactionsFromBank() {
    const transactions = await fetch(`${apiUrls}/transaction?from=2050-01-01&to=${simulationTimer.getDate()}`, {
        method: "GET"
    })
    return transactions;
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



