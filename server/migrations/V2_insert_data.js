export async function up(knex) {
  return knex.raw(`
    -- insert order statuses
    INSERT INTO "order_statuses" ("name")
    VALUES 
      ('payment_pending'),
      ('pickup_pending'),
      ('order_complete'),
      ('order_cancelled');

    -- insert stock types
    INSERT INTO "stock_types" ("name")
    VALUES
      ('aluminium'),
      ('plastic'),
      ('machine'),
      ('case');

    -- insert stock
    INSERT INTO "stock" ("stock_type_id", "total_units", "ordered_units") VALUES
      (1, 500, 100),   -- aluminium
      (2, 300, 0),   -- plastic
      (3, 10, 0),    -- machine
      (4, 120, 0);   -- case

    -- insert order types
    INSERT INTO "order_types" ("name")
    VALUES
      ('material_order'),
      ('machine_order');

    -- insert external orders
    -- INSERT INTO "external_orders" (
    --   "order_reference", "total_cost", "order_type_id",
    --   "shipment_reference", "ordered_at", "received_at"
    -- ) VALUES
    --   ('EXT-1001', 1200.50, 1, 'SHIP-001', '2025-07-01 10:15:00', '2025-07-02 09:00:00'),
    --   ('EXT-1002', 7500.00, 2, 'SHIP-002', '2025-07-02 11:30:00', NULL),
    --   ('EXT-1003', 300.00, 1, NULL, '2025-07-03 09:00:00', '2025-07-04 13:45:00');

    -- insert external order items
    -- INSERT INTO "external_order_items" (
    --   "stock_type_id", "order_id", "ordered_units", "per_unit_cost"
    -- ) VALUES
    --   (1, 1, 100, 1000.00),
    --   (2, 1, 50, 200.50),
    --   (3, 2, 2, 7500.00),
    --   (1, 3, 30, 300.00);

    -- insert case orders
    -- INSERT INTO "case_orders" (
    --   "order_status_id", "quantity", "total_price", "amount_paid", "ordered_at"
    -- ) VALUES
    --   (1, 10, 150.00, 0, '2025-07-01 08:00:00'),
    --   (2, 25, 375.00, 0, '2025-07-02 12:00:00'),
    --   (3, 5, 75.00, 0, '2025-07-03 14:30:00');
  `);
}

export async function down(knex) {
  return knex.raw(`
    -- delete case orders
    DELETE FROM "case_orders";

    -- delete external order items
    DELETE FROM "external_order_items";

    -- delete external orders
    DELETE FROM "external_orders"
    WHERE "order_reference" IN ('EXT-1001', 'EXT-1002', 'EXT-1003');

    -- delete stock
    DELETE FROM "stock";

    -- delete order types
    DELETE FROM "order_types"
    WHERE "name" IN ('material_order', 'machine_order');

    -- delete stock types
    DELETE FROM "stock_types"
    WHERE "name" IN ('aluminium', 'plastic', 'machine', 'case');

    -- delete order statuses
    DELETE FROM "order_statuses"
    WHERE "name" IN ('payment_pending', 'pickup_pending', 'order_complete', 'order_cancelled');
  `);
}
