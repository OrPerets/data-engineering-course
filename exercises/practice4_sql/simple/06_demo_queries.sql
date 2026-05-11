-- Step 6: analytics from the DWH, not from the raw source.

-- Full business-readable fact table.
SELECT
  d.order_date,
  c.customer_name,
  c.region,
  p.product_name,
  p.category,
  f.quantity,
  f.net_revenue
FROM simple_dwh.fact_sales AS f
JOIN simple_dwh.dim_date AS d
  ON d.date_key = f.date_key
JOIN simple_dwh.dim_customer AS c
  ON c.customer_key = f.customer_key
JOIN simple_dwh.dim_product AS p
  ON p.product_key = f.product_key
ORDER BY d.order_date, f.sale_id;

-- KPI example: revenue by category and region.
SELECT
  p.category,
  c.region,
  SUM(f.net_revenue) AS total_net_revenue
FROM simple_dwh.fact_sales AS f
JOIN simple_dwh.dim_customer AS c
  ON c.customer_key = f.customer_key
JOIN simple_dwh.dim_product AS p
  ON p.product_key = f.product_key
GROUP BY p.category, c.region
ORDER BY p.category, c.region;
