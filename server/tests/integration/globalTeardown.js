// Global teardown for integration tests
// This runs once after all integration tests

export default async function globalTeardown() {
  console.log("Global teardown for integration tests...");

  // You can add:
  // - Test database cleanup
  // - External service cleanup
  // - Resource cleanup

  console.log("Global teardown completed.");
}
