export async function up(knex) {
  return knex.raw(`
    -- insert raw materials
    INSERT INTO "materials" ("name", "stock_kg")
    VALUES 
      ('aluminium', 0),
      ('plastic', 0);

    -- insert order statuses
    INSERT INTO "order_statuses" ("name")
    VALUES 
      ('waiting_payment'),
      ('waiting_collection'),
      ('collected');

    -- insert cases types
    INSERT INTO "cases" ("name", "price", "stock_units", "material_id")
    VALUES 
      ('aluminum_case', 100.0, 0, (SELECT id FROM "materials" WHERE name = 'aluminium')),
      ('plastic_case', 50.0, 0, (SELECT id FROM "materials" WHERE name = 'plastic'));
  `);
};

export async function down(knex) {
  return knex.raw(`
    -- delete cases
    DELETE FROM "cases"
    WHERE "name" IN ('aluminum case', 'plastic case');

    -- delete order statuses
    DELETE FROM "order_statuses"
    WHERE "name" IN ('waiting_payment', 'waiting_collection', 'collected');

    -- delete raw materials
    DELETE FROM "materials"
    WHERE "name" IN ('aluminium', 'plastic');
  `);
};
