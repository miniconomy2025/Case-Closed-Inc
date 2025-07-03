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


export async function getCasesProduced() {
    // TODO: write the actual query
    return {
        type: 'Case 1',
        amount: 5
    };
}

export async function getShipmentsByStatus(status) {
    // TODO: write actual query
    return [{
        id: 1,
        status: status,
        item: 'plastic',
        amount: 1000
    }];
}