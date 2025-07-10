import { db } from '../db/knex.js';

export async function clearMockData() { 
    return await db.transaction(async trx => {
        await trx('case_orders').del();
        await trx('external_order_items').del();
        await trx('external_orders').del();
        await trx('bank_details').update({
            account_number: 123451234512,
        });
        await trx('equipment_parameters').update({
            plastic_ratio: 4,
            aluminium_ratio: 7,
            production_rate: 20
        });
        await trx('stock').update({
            total_units: 0,
            ordered_units: 0
        });
    });
};