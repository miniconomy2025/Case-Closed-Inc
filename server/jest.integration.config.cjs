module.exports = {
  // Extend the base Jest config
  ...require("./jest.config.cjs"),

  // Integration test specific settings
  testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
  testTimeout: 30000, // Longer timeout for integration tests

  // Setup files for integration tests
  setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],

  // Global setup and teardown
  globalSetup: "<rootDir>/tests/integration/globalSetup.js",
  globalTeardown: "<rootDir>/tests/integration/globalTeardown.js",

  // Don't run unit tests in integration mode
  testPathIgnorePatterns: ["<rootDir>/tests/unit/", "<rootDir>/node_modules/"],
};
