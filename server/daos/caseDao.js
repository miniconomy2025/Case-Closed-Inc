import { db } from "../db/knex.js";

const TABLE_NAME = 'cases'

export async function getAllCases() {
    return await db(TABLE_NAME);
}

export async function getCaseById(id) {
    return await db(TABLE_NAME).where({ id }).first();
}

export async function getCaseByName(name) {
    return await db(TABLE_NAME).where({ name }).first();
}