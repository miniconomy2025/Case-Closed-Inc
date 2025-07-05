import { db } from "../db/knex.js";

const TABLE_NAME = 'order_statuses'

export async function getAllOrderStatuses() {
    return await db(TABLE_NAME);
}
export async function getOrderStatusById(id) {
    return await db(TABLE_NAME).where({ id }).first();
}
export async function getOrderStatusByName(name) {
    return await db(TABLE_NAME).where({ name }).first();
}