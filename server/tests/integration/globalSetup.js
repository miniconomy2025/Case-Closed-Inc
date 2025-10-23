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

    // Insert equipment_parameters if not exists (required for case order calculations)
    const equipmentExists = await testDb("equipment_parameters").first();
    if (!equipmentExists) {
      await testDb("equipment_parameters").insert({
        plastic_ratio: 3,
        aluminium_ratio: 5,
        production_rate: 150,
        case_machine_weight: 100,
      });
      console.log("Equipment parameters seeded.");
    } else {
      console.log("Equipment parameters already exist.");
    }

    // Insert bank_details if not exists (required for case order creation)
    const bankExists = await testDb("bank_details").first();
    if (!bankExists) {
      await testDb("bank_details").insert({
        account_number: "1234567890",
      });
      console.log("Bank details seeded.");
    } else {
      console.log("Bank details already exist.");
    }

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
