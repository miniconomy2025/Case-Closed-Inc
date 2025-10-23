// Integration test setup - runs before each test file

import { jest } from "@jest/globals";

// Note: Environment variables are set via cross-env in package.json
// before Node.js starts, so knex.js uses test DB from the beginning

beforeAll(async () => {
  console.log("Setting up integration test environment...");
  console.log(`Test DB: ${process.env.DB_NAME}:${process.env.DB_PORT}`);
});

afterAll(async () => {
  console.log("Cleaning up integration test environment...");
});
