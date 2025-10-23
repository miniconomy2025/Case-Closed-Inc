// Global setup for integration tests

import dotenv from "dotenv";
import { testDb } from "./testDb.js";

export default async function globalSetup() {
  console.log("Global setup for integration tests...");
  console.log(
    `Using test database: ${process.env.DB_NAME} on port ${process.env.DB_PORT}`
  );

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

    // Seed test-specific data that's required by controllers but not part of production migrations
    console.log("Seeding test-specific configuration data...");

    // Insert equipment_parameters (required for case order calculations)
    await testDb("equipment_parameters").insert({
      plastic_ratio: 3,
      aluminium_ratio: 5,
      production_rate: 150,
      case_machine_weight: 100,
    });

    // Insert bank_details (required for case order creation)
    await testDb("bank_details").insert({
      account_number: "1234567890",
    });

    console.log("Test data seeded successfully.");
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
