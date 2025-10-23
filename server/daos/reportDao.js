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

export async function getExternalOrders() {
  const orders = await db('external_orders')
    .leftJoin('order_types', 'external_orders.order_type_id', 'order_types.id')
    .select(
      'external_orders.id as order_id',
      'external_orders.order_reference',
      'external_orders.total_cost',
      'external_orders.shipment_reference',
      'external_orders.ordered_at',
      'external_orders.received_at',
      'order_types.id as type_id',
      'order_types.name as type_name'
    )
    .orderBy('external_orders.ordered_at', 'asc');

  return orders;
}

export async function getExternalOrderStats() {
  const [row] = await db
    .select(db.raw(`
      COUNT(*) AS "totalExternalOrders",

      -- Breakdown by delivery status
      COUNT(*) FILTER (WHERE eo.received_at IS NULL) AS "pending_delivery",
      COUNT(*) FILTER (WHERE eo.received_at IS NOT NULL) AS "delivered",

      -- Breakdown by order type
      COUNT(*) FILTER (WHERE ot.name = 'material_order') AS "material_order",
      COUNT(*) FILTER (WHERE ot.name = 'machine_order') AS "machine_order",

      -- Cost metrics
      COALESCE(SUM(eo.total_cost), 0) AS "totalCost"
    `))
    .from('external_orders as eo')
    .join('order_types as ot', 'eo.order_type_id', 'ot.id');
  
  return row;
}




