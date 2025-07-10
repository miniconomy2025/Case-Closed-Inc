import { db } from "../db/knex.js";

const TABLE_NAME = "equipment_parameters";

export async function insertEquipmentParameters({
  plastic_ratio,
  aluminium_ratio,
  production_rate,
}) {
  return await db(TABLE_NAME).insert({
    plastic_ratio,
    aluminium_ratio,
    production_rate,
  });
}
