import { db } from '../db/knex.js';

const TABLE_NAME = 'machinery';

export async function increaseNumberOfMachines(amount) {
       if (amount < 0) throw new Error('Amount must be positive');
       return await db(TABLE_NAME).increment('amount', amount);
   }