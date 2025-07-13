import { db } from "../db/knex.js";

const TABLE_NAME = 'bank_details';

export const getAccountNumber = async () => {
    return await db(TABLE_NAME).first();
};

export const updateAccount = async (accountNumber, account_balance) => {
    await db.transaction(async (trx) => {
        await trx(TABLE_NAME).del();

        await trx(TABLE_NAME).insert({
            account_number: accountNumber,
            account_balance: account_balance,
        });
    });
};
  
export const updateBalance = async (balance, account_number) => {
    return db(TABLE_NAME)
        .where({ account_number })
        .update({ account_balance: balance });
};
