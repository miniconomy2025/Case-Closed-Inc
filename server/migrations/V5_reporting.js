export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION count_external_orders_by_received_status()
    RETURNS TABLE(received_count BIGINT, places_count BIGINT) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        COUNT(*) FILTER (WHERE received_at IS NOT NULL) AS received_count,
        COUNT(*) FILTER (WHERE received_at IS NULL) AS places_count
      FROM external_orders;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION count_case_orders()
    RETURNS TABLE(status_name VARCHAR(32), count BIGINT) AS $$
    BEGIN
        RETURN QUERY
        SELECT o.name, count(*) FROM case_orders c
        INNER JOIN order_statuses o ON c.order_status_id = o.id
        GROUP BY o.namE;        
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION get_sales_report()
    RETURNS TABLE (
    total_sales FLOAT,
    total_orders BIGINT,
    cases_sold BIGINT
    ) AS $$
    BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(co.total_price) FILTER (
        WHERE os.name = 'order_complete'), 0) AS total_sales,

        COUNT(co.id) AS total_orders,

        COALESCE(SUM(co.quantity) FILTER (
        WHERE os.name = 'order_complete'), 0) AS cases_sold

    FROM case_orders co
    JOIN order_statuses os ON co.order_status_id = os.id;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex) {
  await knex.raw(`DROP FUNCTION IF EXISTS count_external_orders_by_received_status();`);

  await knex.raw(`DROP FUNCTION IF EXISTS count_case_orders();`);

  await knex.raw(`DROP FUNCTION IF EXISTS get_sales_report();`);
}