export async function up(knex) {
  return knex.raw(`
    -- insert order statuses
    INSERT INTO "order_statuses" ("name")
    VALUES 
      ('payment_pending'),
      ('pickup_pending'),
      ('order_complete');

    -- insert stock types
    INSERT INTO "stock_types" ("name")
    VALUES
      ('aluminium'),
      ('plastic'),
      ('machine'),
      ('case');

    -- insert order types
    INSERT INTO "order_types" ("name")
    VALUES
      ('material_order'),
      ('machine_order');
  `);
}

export async function down(knex) {
  return knex.raw(`
    -- delete order types
    DELETE FROM "order_types"
    WHERE "name" IN ('material_order', 'machine_order');

    -- delete stock types
    DELETE FROM "stock_types"
    WHERE "name" IN ('aluminium', 'plastic', 'machine', 'case');

    -- delete order statuses
    DELETE FROM "order_statuses"
    WHERE "name" IN ('payment_pending', 'pickup_pending', 'order_complete');
  `);
}