import { db } from '../db/knex.js';

const STOCK_TYPES_TABLE = 'stock_types';

export async function getStockTypeIdByName(typeName) {
    const type = await db(STOCK_TYPES_TABLE)
        .select('id')
        .where({ name: typeName })
        .first();
    return type?.id || null;
};
