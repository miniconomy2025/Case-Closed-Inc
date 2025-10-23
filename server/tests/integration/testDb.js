// Dedicated Knex instance for integration tests
import knex from "knex";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Test database configuration from environment variables
const testDbConfig = {
  client: "pg",
  connection: {
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT || "5433"),
    user: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "password",
    database: process.env.TEST_DB_NAME || "case_closed_test_db",
    ssl: false,
  },
  migrations: {
    directory: "./migrations",
    extension: "js",
  },
};

// Create and export test database instance
export const testDb = knex(testDbConfig);

// Helper function to reset database between tests
export async function resetDatabase() {
  // Truncate all tables and reset sequences
  await testDb.raw(`
    TRUNCATE TABLE 
      case_orders,
      external_orders,
      machinery,
      stock,
      order_statuses,
      stock_types,
      equipment_parameters,
      bank_details
    RESTART IDENTITY CASCADE
  `);
}

// Helper function to seed basic data
export async function seedBasicData() {
  // Insert default order statuses if they don't exist
  await testDb.raw(`
    INSERT INTO order_statuses (id, status) 
    VALUES 
      (1, 'PENDING'),
      (2, 'PAID'),
      (3, 'SHIPPED'),
      (4, 'DELIVERED'),
      (5, 'CANCELLED')
    ON CONFLICT (id) DO NOTHING
  `);

  // Insert default stock types if they don't exist
  await testDb.raw(`
    INSERT INTO stock_types (id, type_name) 
    VALUES 
      (1, 'raw_material'),
      (2, 'finished_goods')
    ON CONFLICT (id) DO NOTHING
  `);
}
