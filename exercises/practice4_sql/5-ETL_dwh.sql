BEGIN;

INSERT INTO dwh.dim_date (
  date_key,
  calendar_date,
  year_month,
  week_start
)
SELECT
  to_char(d.calendar_date, 'YYYYMMDD')::int AS date_key,
  d.calendar_date,
  to_char(d.calendar_date, 'YYYY-MM') AS year_month,
  date_trunc('week', d.calendar_date)::date AS week_start
FROM (
  SELECT generate_series(
    MIN(order_ts)::date,
    MAX(order_ts)::date,
    INTERVAL '1 day'
  )::date AS calendar_date
  FROM staging.v_orders_latest
) AS d
WHERE d.calendar_date IS NOT NULL
ON CONFLICT (date_key) DO UPDATE SET
  calendar_date = EXCLUDED.calendar_date,
  year_month = EXCLUDED.year_month,
  week_start = EXCLUDED.week_start;

INSERT INTO dwh.dim_channel (channel_name)
VALUES ('unknown')
ON CONFLICT (channel_name) DO NOTHING;

INSERT INTO dwh.dim_channel (channel_name)
SELECT DISTINCT channel_name
FROM staging.v_orders_latest
ON CONFLICT (channel_name) DO NOTHING;

INSERT INTO dwh.dim_product (
  product_id,
  product_name,
  category
)
SELECT
  product_id,
  COALESCE(product_name, 'Unknown Product') AS product_name,
  COALESCE(NULLIF(category, ''), 'unknown') AS category
FROM (
  SELECT DISTINCT ON (product_id)
    product_id,
    product_name,
    category
  FROM staging.v_order_items_latest
  ORDER BY product_id, updated_at DESC
) AS products_from_order_lines
ON CONFLICT (product_id) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  category = EXCLUDED.category;

INSERT INTO dwh.dim_customer (
  customer_ref,
  full_name,
  segment,
  region
)
SELECT
  customer_ref,
  COALESCE(full_name, 'Unknown Customer') AS full_name,
  COALESCE(NULLIF(segment, ''), 'unknown') AS segment,
  COALESCE(NULLIF(region, ''), 'unknown') AS region
FROM staging.v_customers_latest
ON CONFLICT (customer_ref) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  segment = EXCLUDED.segment,
  region = EXCLUDED.region;

COMMIT;
