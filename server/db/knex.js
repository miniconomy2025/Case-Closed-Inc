import knex from "knex";
import knexConfig from "../knexfile.js";
import logger from "../utils/logger.js";

export const runMigrations = async () => {
  const dbMigrate = knex(knexConfig);

  try {
    await dbMigrate.migrate.latest();
    logger.info("Migrations ran successfully");
  } catch (err) {
    logger.error("Error running migrations", {
      error: err,
      message: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    await dbMigrate.destroy();
  }
};

export const db = knex(knexConfig);
