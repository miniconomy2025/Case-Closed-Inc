export async function up(knex) {
  return knex.raw(`
    CREATE OR REPLACE VIEW "case_stock_status" AS
    SELECT
      s.id AS stock_id,
      st.name AS stock_name,
      s.total_units,
      COALESCE(SUM(co.quantity - co.quantity_delivered), 0) AS reserved_units,
      (s.total_units - COALESCE(SUM(co.quantity - co.quantity_delivered), 0)) AS available_units
    FROM stock s
    LEFT JOIN stock_types st ON s.stock_type_id = st.id
    LEFT JOIN case_orders co ON st.name = 'case'
      AND co.order_status_id IN (
        SELECT id FROM order_statuses WHERE name LIKE '%pending'
      )
    GROUP BY s.id, st.name, s.total_units;
  `);
}

export async function down(knex) {
  return knex.raw(`
    DROP VIEW IF EXISTS "case_stock_status";
  `);
}