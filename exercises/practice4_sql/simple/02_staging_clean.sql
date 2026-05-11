-- Step 2: staging transformation.
-- The staging view keeps the raw source intact and exposes cleaned values.

CREATE SCHEMA simple_staging;

CREATE VIEW simple_staging.v_sales_clean AS
SELECT
  sale_id,
  order_date,
  lower(customer_id) AS customer_id,
  customer_name,
  CASE
    WHEN lower(region) IN ('center', 'central') THEN 'center'
    WHEN lower(region) IN ('jerusalem', 'jrs') THEN 'jerusalem'
    WHEN lower(region) IN ('north', 'northern') THEN 'north'
    ELSE 'unknown'
  END AS region,
  product_id,
  product_name,
  CASE
    WHEN lower(category) = 'electronics' THEN 'electronics'
    WHEN lower(replace(category, ' ', '_')) = 'home_kitchen' THEN 'home_kitchen'
    ELSE 'unknown'
  END AS category,
  quantity,
  unit_price,
  COALESCE(discount_amount, 0) AS discount_amount,
  (quantity * unit_price) AS gross_revenue,
  (quantity * unit_price) - COALESCE(discount_amount, 0) AS net_revenue
FROM simple_sources.raw_sales;
