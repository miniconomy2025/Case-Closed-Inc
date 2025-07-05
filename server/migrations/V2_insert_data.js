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
    INSERT INTO "stock" ("stock_type_id", "total_units") VALUES
      ((SELECT id FROM "stock_types" WHERE name = 'aluminium'), 500),
      ((SELECT id FROM "stock_types" WHERE name = 'plastic'), 300),
      ((SELECT id FROM "stock_types" WHERE name = 'machine'), 10),
      ((SELECT id FROM "stock_types" WHERE name = 'case'), 120);

    -- insert order types
    INSERT INTO "order_types" ("name")
    VALUES
      ('material_order'),
      ('machine_order');

    -- insert external orders
    INSERT INTO "external_orders" (
      "order_reference", "total_cost", "order_type_id",
      "shipment_reference", "ordered_at", "received_at"
    ) VALUES
      ('EXT-1001', 1200.50, (SELECT id FROM "order_types" WHERE name = 'material_order'), 'SHIP-001', '2025-07-01 10:15:00', '2025-07-02 09:00:00'),
      ('EXT-1002', 7500.00, (SELECT id FROM "order_types" WHERE name = 'machine_order'), 'SHIP-002', '2025-07-02 11:30:00', NULL),
      ('EXT-1003', 300.00, (SELECT id FROM "order_types" WHERE name = 'material_order'), NULL, '2025-07-03 09:00:00', '2025-07-04 13:45:00');

    -- insert external order items
    INSERT INTO "external_order_items" (
      "stock_type_id", "order_id", "ordered_units", "per_unit_cost", "total_cost"
    ) VALUES
      ((SELECT id FROM "stock_types" WHERE name = 'aluminium'), (SELECT id FROM "external_orders" WHERE "order_reference" = 'EXT-1001'), 100, 10.00, 1000.00),
      ((SELECT id FROM "stock_types" WHERE name = 'plastic'), (SELECT id FROM "external_orders" WHERE "order_reference" = 'EXT-1001'), 50, 4.01, 200.50),
      ((SELECT id FROM "stock_types" WHERE name = 'machine'), (SELECT id FROM "external_orders" WHERE "order_reference" = 'EXT-1002'), 2, 3750.00, 7500.00),
      ((SELECT id FROM "stock_types" WHERE name = 'aluminium'), (SELECT id FROM "external_orders" WHERE "order_reference" = 'EXT-1003'), 30, 10.00, 300.00);

    -- insert case orders
    INSERT INTO "case_orders" (
      "order_status_id", "quantity", "total_price", "ordered_at"
    ) VALUES
      ((SELECT id FROM "order_statuses" WHERE name = 'payment_pending'), 10, 150.00, '2025-07-01 08:00:00'),
      ((SELECT id FROM "order_statuses" WHERE name = 'pickup_pending'), 25, 375.00, '2025-07-02 12:00:00'),
      ((SELECT id FROM "order_statuses" WHERE name = 'order_complete'), 5, 75.00, '2025-07-03 14:30:00');
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
