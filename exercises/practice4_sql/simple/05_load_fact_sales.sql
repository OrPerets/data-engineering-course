-- Step 5: load the fact table.
-- The fact connects each sale to the descriptive dimension rows.

INSERT INTO simple_dwh.fact_sales (
  sale_id,
  date_key,
  customer_key,
  product_key,
  quantity,
  gross_revenue,
  discount_amount,
  net_revenue
)
SELECT
  s.sale_id,
  d.date_key,
  c.customer_key,
  p.product_key,
  s.quantity,
  s.gross_revenue,
  s.discount_amount,
  s.net_revenue
FROM simple_staging.v_sales_clean AS s
JOIN simple_dwh.dim_date AS d
  ON d.order_date = s.order_date
JOIN simple_dwh.dim_customer AS c
  ON c.customer_id = s.customer_id
JOIN simple_dwh.dim_product AS p
  ON p.product_id = s.product_id;
