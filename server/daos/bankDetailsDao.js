import { db } from "../db/knex.js";

const TABLE_NAME = 'bank_details';

export const getAccountNumber = async () => {
    return await db(TABLE_NAME).first();
};

export const updateAccountNumber = async (accountNumber) => {
    await db(TABLE_NAME).del();
    return db(TABLE_NAME).insert({ account_number: accountNumber });
};