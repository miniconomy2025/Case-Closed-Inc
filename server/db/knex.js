import knex from "knex";
import knexConfig from "../knexfile.cjs";
import logger from "../utils/logger.js";

export const runMigrations = async () => {
  const dbMigrate = knex(knexConfig);

  try {
    await dbMigrate.migrate.latest();
    logger.info("Migrations ran successfully");
  } finally {
    await dbMigrate.destroy();
  }
};

export const db = knex(knexConfig);
