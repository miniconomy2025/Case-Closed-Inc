// Global setup for integration tests
// This runs once before all integration tests

import { db } from "../../db/knex.js";

export default async function globalSetup() {
  console.log("Global setup for integration tests...");

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DB_NAME = "case_closed_test_db";
  process.env.DB_HOST = "localhost";
  process.env.DB_PORT = "5433";
  process.env.DB_USER = "postgres";
  process.env.DB_PASSWORD = "password";

  try {
    // Run migrations on test database using the same connection as tests
    console.log("Running migrations on test database...");
    await db.migrate.latest();
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Failed to run migrations:", error);
    throw error;
  }

  console.log("Global setup completed.");
}
