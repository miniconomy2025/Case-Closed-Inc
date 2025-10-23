import { testDb } from "./testDb.js";

describe("Database Connection Test", () => {
  it("should connect to test database", async () => {
    const result = await testDb.raw("SELECT 1 as value");
    expect(result.rows[0].value).toBe(1);
    console.log("✅ Test database connection successful!");
  });

  it("should have correct database name", async () => {
    const result = await testDb.raw("SELECT current_database()");
    expect(result.rows[0].current_database).toBe("case_closed_test_db");
    console.log("✅ Connected to correct database: case_closed_test_db");
  });

  it("should have migrations table", async () => {
    const result = await testDb.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'knex_migrations'
      ) as exists
    `);
    expect(result.rows[0].exists).toBe(true);
    console.log("✅ Migrations table exists");
  });

  it("should have required tables", async () => {
    const tables = [
      "case_orders",
      "order_statuses",
      "stock",
      "stock_types",
      "equipment_parameters",
      "external_orders",
      "bank_details",
    ];

    for (const tableName of tables) {
      const result = await testDb.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        ) as exists
      `);
      expect(result.rows[0].exists).toBe(true);
    }

    console.log(`✅ All ${tables.length} required tables exist`);
  });
});
