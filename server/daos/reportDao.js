import { db } from "../db/knex.js";

export async function getBalanceFromBank() {
    // TODO: make call to bank to get actua balance for now this bad mock data
    return {balance: 10000000}
}

export async function getOrdersByType(type) {
    // TODO: write the actual query
    return {
        orderId: 1,
        cost: 500,
        stockType: type
    };
}

export async function getMaterialAmounts() {
    // TODO: write the actual query
    return [
        {
            type: 'plastic',
            units: 1000
        },
        {
            type: 'alimunium',
            units: 7000            
        }
    ];
}