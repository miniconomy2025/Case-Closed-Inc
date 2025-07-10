export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_case_price(
      plastic_units_per_case NUMERIC,
      aluminium_units_per_case NUMERIC,
      markup NUMERIC
    )
    RETURNS TABLE (
      base_cost NUMERIC,
      selling_price NUMERIC
    ) AS $$
    BEGIN
      RETURN QUERY
      WITH plastic_avg AS (
        SELECT 
          SUM(eoi.ordered_units * eoi.per_unit_cost)::numeric / NULLIF(SUM(eoi.ordered_units), 0) AS avg_plastic_cost
        FROM external_order_items eoi
        JOIN stock_types st ON st.id = eoi.stock_type_id
        WHERE st.name = 'plastic'
      ),
      aluminium_avg AS (
        SELECT 
          SUM(eoi.ordered_units * eoi.per_unit_cost)::numeric / NULLIF(SUM(eoi.ordered_units), 0) AS avg_aluminium_cost
        FROM external_order_items eoi
        JOIN stock_types st ON st.id = eoi.stock_type_id
        WHERE st.name = 'aluminium'
      ),
      base_cost_calc AS (
        SELECT 
          pa.avg_plastic_cost * plastic_units_per_case + aa.avg_aluminium_cost * aluminium_units_per_case AS total_base_cost
        FROM plastic_avg pa, aluminium_avg aa
      )
      SELECT 
        total_base_cost,
        total_base_cost * markup
      FROM base_cost_calc;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex) {
  await knex.raw(`DROP FUNCTION IF EXISTS calculate_case_price(NUMERIC, NUMERIC, NUMERIC);`);
}