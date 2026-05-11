BEGIN;

TRUNCATE TABLE
  staging.orders_src,
  staging.order_items_src,
  staging.customers_src,
  staging.returns_src;

INSERT INTO staging.orders_src (
  order_id, customer_ref, order_ts, channel, order_status, updated_at,
  run_id
)
SELECT
  s.order_id,
  s.customer_ref,
  s.order_ts,
  s.channel,
  s.order_status,
  s.updated_at,
  c.run_id
FROM sources.orders_src AS s
CROSS JOIN practice4_run_context AS c;

INSERT INTO staging.order_items_src (
  order_id, line_id, product_id, product_name, category, quantity, unit_price, discount_amount, updated_at,
  run_id
)
SELECT
  s.order_id,
  s.line_id,
  s.product_id,
  s.product_name,
  s.category,
  s.quantity,
  s.unit_price,
  s.discount_amount,
  s.updated_at,
  c.run_id
FROM sources.order_items_src AS s
CROSS JOIN practice4_run_context AS c;

INSERT INTO staging.customers_src (
  customer_ref, full_name, segment, region, updated_at,
  run_id
)
SELECT
  s.customer_ref,
  s.full_name,
  s.segment,
  s.region,
  s.updated_at,
  c.run_id
FROM sources.customers_src AS s
CROSS JOIN practice4_run_context AS c;

INSERT INTO staging.returns_src (
  return_id, order_id, line_id, return_ts, return_amount, ingested_at,
  run_id
)
SELECT
  s.return_id,
  s.order_id,
  s.line_id,
  s.return_ts,
  s.return_amount,
  s.ingested_at,
  c.run_id
FROM sources.returns_src AS s
CROSS JOIN practice4_run_context AS c;

UPDATE dwh.etl_run_log
SET
  status = 'success',
  finished_at = clock_timestamp(),
  rows_read =
    (SELECT COUNT(*) FROM sources.orders_src)
    + (SELECT COUNT(*) FROM sources.order_items_src)
    + (SELECT COUNT(*) FROM sources.customers_src)
    + (SELECT COUNT(*) FROM sources.returns_src),
  rows_loaded =
    (SELECT COUNT(*) FROM staging.orders_src)
    + (SELECT COUNT(*) FROM staging.order_items_src)
    + (SELECT COUNT(*) FROM staging.customers_src)
    + (SELECT COUNT(*) FROM staging.returns_src)
WHERE run_id = (SELECT run_id FROM practice4_run_context);

COMMIT;

