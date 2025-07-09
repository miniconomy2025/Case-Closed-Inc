import { db } from "../db/knex.js";
import apiUrls from "../utils/companyUrls.js";
import simulationTimer from "../controllers/simulationController.js";

const CASES_STOCK_VIEW = 'case_stock_status';
const EXTERNAL_ORDER_COUNTS = 'count_external_orders_by_received_status()';
const CASE_ORDER_COUNTS = 'count_case_orders()';
const SALES_REPORT = 'get_sales_report()';

export async function getBalanceFromBank() {
    const { balance } = await fetch(`${apiUrls}/account/me/balance`, {
        method: "GET"
    })
    return balance;
}

export async function getLoanTotalFromBank() {
    const loans  = await fetch(`${apiUrls}/loan`, {
        method: "GET"
    })

    const allLoans = loans.reduce((sum, item) => sum + item.outstanding_amount, 0);
    return allLoans;
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