BEGIN;

CREATE TEMP TABLE practice4_fact_sales_src AS
SELECT
  d.date_key,
  p.product_key,
  c.customer_key,
  ch.channel_key,
  o.order_id,
  oi.line_id,
  o.order_status,
  oi.quantity,
  (oi.quantity * oi.unit_price)::decimal(14,2) AS gross_revenue,
  COALESCE(oi.discount_amount, 0)::decimal(14,2) AS discount_amount,
  COALESCE(r.return_amount, 0)::decimal(14,2) AS return_amount,
  (
    (oi.quantity * oi.unit_price)
    - COALESCE(oi.discount_amount, 0)
    - COALESCE(r.return_amount, 0)
  )::decimal(14,2) AS net_revenue
FROM staging.v_orders_latest AS o
JOIN staging.v_order_items_latest AS oi
  ON oi.order_id = o.order_id
JOIN dwh.dim_date AS d
  ON d.calendar_date = o.order_ts::date
JOIN dwh.dim_product AS p
  ON p.product_id = oi.product_id
JOIN dwh.dim_customer AS c
  ON c.customer_ref = o.customer_ref_std
JOIN dwh.dim_channel AS ch
  ON ch.channel_name = COALESCE(NULLIF(o.channel_name, ''), 'unknown')
LEFT JOIN staging.v_returns_agg AS r
  ON r.order_id = oi.order_id
 AND r.line_id = oi.line_id
WHERE o.order_status IN ('completed', 'refunded');

DELETE FROM dwh.fact_sales AS f
USING staging.v_orders_latest AS o
WHERE f.order_id = o.order_id
  AND o.order_status NOT IN ('completed', 'refunded');

MERGE INTO dwh.fact_sales AS target
USING practice4_fact_sales_src AS src
ON target.order_id = src.order_id
AND target.line_id = src.line_id
WHEN MATCHED THEN UPDATE SET
  date_key = src.date_key,
  product_key = src.product_key,
  customer_key = src.customer_key,
  channel_key = src.channel_key,
  order_status = src.order_status,
  quantity = src.quantity,
  gross_revenue = src.gross_revenue,
  discount_amount = src.discount_amount,
  return_amount = src.return_amount,
  net_revenue = src.net_revenue
WHEN NOT MATCHED THEN INSERT (
  date_key,
  product_key,
  customer_key,
  channel_key,
  order_id,
  line_id,
  order_status,
  quantity,
  gross_revenue,
  discount_amount,
  return_amount,
  net_revenue
) VALUES (
  src.date_key,
  src.product_key,
  src.customer_key,
  src.channel_key,
  src.order_id,
  src.line_id,
  src.order_status,
  src.quantity,
  src.gross_revenue,
  src.discount_amount,
  src.return_amount,
  src.net_revenue
);

COMMIT;
