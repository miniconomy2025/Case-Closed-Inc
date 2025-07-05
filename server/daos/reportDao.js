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