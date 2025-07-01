import { db } from '../db/knex.js';

const TABLE_NAME = 'materials';

export async function increaseMaterialStock(id, quantity_kg) {
    return await db(TABLE_NAME)
        .where({ id: id })
        .increment('stock_kg', quantity_kg);
};