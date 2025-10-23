// Global setup for integration tests

import { testDb } from "./testDb.js";

export default async function globalSetup() {
  console.log("Global setup for integration tests...");

  // Set test environment
  process.env.NODE_ENV = "test";

  try {
    // Check database connection
    console.log(
      "Connecting to test database: case_closed_test_db on port 5433..."
    );
    await testDb.raw("SELECT 1");
    console.log("Test database connection successful!");

    // Run migrations on test database
    console.log("Running migrations on test database...");
    await testDb.migrate.latest();
    console.log("Migrations completed successfully.");

    // Get migration status
    const [latestMigration] = await testDb("knex_migrations")
      .orderBy("id", "desc")
      .limit(1);
    console.log("Latest migration:", latestMigration?.name || "none");
  } catch (error) {
    console.error("Failed to setup test database:", error.message);
    console.error("Make sure the test database is running on port 5433");
    console.error("Run: docker ps --filter 'name=case-closed-test-db'");
    throw error;
  } finally {
    await testDb.destroy();
  }

  console.log("Global setup completed.");
}
