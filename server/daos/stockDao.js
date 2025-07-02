import { db } from '../db/knex.js';

const STOCK_TABLE = 'stock';

export async function increaseStockUnitsByTypeId(typeId, amount) {
    return await db(STOCK_TABLE)
        .where({ stock_type_id: typeId })
        .increment('total_units', amount);
};