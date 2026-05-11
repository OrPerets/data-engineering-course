-- Step 4: load dimensions from the cleaned staging view.

INSERT INTO simple_dwh.dim_date (date_key, order_date, year_month)
SELECT DISTINCT
  to_char(order_date, 'YYYYMMDD')::INT AS date_key,
  order_date,
  to_char(order_date, 'YYYY-MM') AS year_month
FROM simple_staging.v_sales_clean
ORDER BY order_date;

INSERT INTO simple_dwh.dim_customer (customer_id, customer_name, region)
SELECT DISTINCT
  customer_id,
  customer_name,
  region
FROM simple_staging.v_sales_clean
ORDER BY customer_id;

INSERT INTO simple_dwh.dim_product (product_id, product_name, category)
SELECT DISTINCT
  product_id,
  product_name,
  category
FROM simple_staging.v_sales_clean
ORDER BY product_id;
