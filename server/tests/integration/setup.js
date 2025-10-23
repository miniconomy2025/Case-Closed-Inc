// Integration test setup
// This runs before each test file

import { jest } from "@jest/globals";

// Set up test environment
process.env.NODE_ENV = "test";

// You can add global test setup here
// For example:
// - Database connection setup
// - Test data seeding
// - Mock external services

beforeAll(async () => {
  // Global setup for all integration tests
  console.log("Setting up integration test environment...");
});

afterAll(async () => {
  // Global cleanup for all integration tests
  console.log("Cleaning up integration test environment...");
});
