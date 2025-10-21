// Global setup for integration tests
// This runs once before all integration tests

export default async function globalSetup() {
  console.log("Global setup for integration tests...");

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DB_NAME = "case_closed_test_db";

  // You can add:
  // - Test database setup
  // - External service mocking
  // - Test data preparation

  console.log("Global setup completed.");
}
