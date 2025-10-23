// Global teardown for integration tests

import { db } from "../../db/knex.js";
import { testDb } from "./testDb.js";

export default async function globalTeardown() {
  console.log("Global teardown for integration tests...");

  try {
    // Clean up test-specific configuration data
    console.log("Cleaning up test database...");

    await testDb("bank_details").del();
    await testDb("equipment_parameters").del();

    console.log("Test database cleaned up successfully.");
  } catch (error) {
    console.error("Failed to clean up test database:", error);
  } finally {
    // IMPORTANT: Destroy all database connections to allow Jest to exit
    console.log("Closing database connections...");
    await testDb.destroy();
    await db.destroy();
    console.log("Database connections closed.");
  }

  console.log("Global teardown completed.");
}
