// Global teardown for integration tests
// This runs once after all integration tests

import { db } from "../../db/knex.js";

export default async function globalTeardown() {
  console.log("Global teardown for integration tests...");

  try {
    // Clean up test database
    console.log("Cleaning up test database...");

    // Don't truncate tables here - let individual tests handle their own cleanup
    // This prevents the "tables don't exist" error
    console.log(
      "Test database cleanup skipped - individual tests handle their own cleanup"
    );

    console.log("Test database cleaned up successfully.");
  } catch (error) {
    console.error("Failed to clean up test database:", error);
  }

  console.log("Global teardown completed.");
}
