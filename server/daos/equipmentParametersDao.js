import { db } from "../db/knex.js";

const TABLE_NAME = "equipment_parameters";

export async function insertEquipmentParameters({
  plastic_ratio,
  aluminium_ratio,
  production_rate,
}) {
  await db.transaction(async (trx) => {
    const existingRow = await trx(TABLE_NAME).first();

    let case_machine_weight = null;
    if (existingRow) {
      case_machine_weight = existingRow.case_machine_weight;
    }

    await trx(TABLE_NAME).del();
    await trx(TABLE_NAME).insert({
      plastic_ratio,
      aluminium_ratio,
      production_rate,
      case_machine_weight,
    });
  });
}

export async function updateCaseMachineWeight(newWeight) {
  return await db(TABLE_NAME)
    .whereNull('case_machine_weight')
    .update({ case_machine_weight: newWeight });
};

export async function getCaseMachineWeight() {
  const row = await db(TABLE_NAME).first('case_machine_weight');
  return row?.case_machine_weight ?? null;
};

export async function getEquipmentParameters() {
    return await db(TABLE_NAME).first();
};
