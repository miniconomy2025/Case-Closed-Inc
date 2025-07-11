import { db } from "../db/knex.js";

const TABLE_NAME = 'bank_details';

export const getAccountNumber = async () => {
    return await db(TABLE_NAME).first();
};

export const getStoredBalance = async (accountNumber) => {
    return await db(TABLE_NAME)
    .where({account_number: accountNumber})
    .returning('account_balance');
};

export const updateAccountNumber = async (accountNumber) => {
    return (await db(TABLE_NAME))
    .where({id : 1})
    .update({ account_number: accountNumber });
};

export const updateBalance = async (balance, account_number) => {
    return db(TABLE_NAME)
    .where({account_number: account_number})
    .update({ account_balance: balance });
};