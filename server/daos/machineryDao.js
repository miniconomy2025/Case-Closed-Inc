import { db } from '../db/knex.js';

const TABLE_NAME = 'machinery';

export async function increaseNumberOfMachines(amount) {
    return await db(TABLE_NAME)
        .increment('amount', amount);
};