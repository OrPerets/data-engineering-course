
CREATE SCHEMA IF NOT EXISTS staging;

DROP VIEW IF EXISTS staging.v_returns_agg;
DROP VIEW IF EXISTS staging.v_customers_latest;
DROP VIEW IF EXISTS staging.v_order_items_latest;
DROP VIEW IF EXISTS staging.v_orders_latest;

DROP TABLE IF EXISTS staging.returns_src;
DROP TABLE IF EXISTS staging.customers_src;
DROP TABLE IF EXISTS staging.order_items_src;
DROP TABLE IF EXISTS staging.orders_src;

CREATE TABLE staging.orders_src (
  order_id BIGINT NOT NULL,
  customer_ref VARCHAR(100),
  order_ts TIMESTAMP NOT NULL,
  channel VARCHAR(50),
  order_status VARCHAR(50),
  updated_at TIMESTAMP NOT NULL,
  run_id VARCHAR(100) NOT NULL
);

CREATE TABLE staging.order_items_src (
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200),
  category VARCHAR(100),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2),
  updated_at TIMESTAMP NOT NULL,
  run_id VARCHAR(100) NOT NULL
);

CREATE TABLE staging.customers_src (
  customer_ref VARCHAR(100) NOT NULL,
  full_name VARCHAR(200),
  segment VARCHAR(50),
  region VARCHAR(100),
  updated_at TIMESTAMP NOT NULL,
  run_id VARCHAR(100) NOT NULL
);

CREATE TABLE staging.returns_src (
  return_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  return_ts TIMESTAMP NOT NULL,
  return_amount DECIMAL(12,2) NOT NULL,
  ingested_at TIMESTAMP NOT NULL,
  run_id VARCHAR(100) NOT NULL
);

CREATE VIEW staging.v_orders_latest AS
WITH normalized AS (
  SELECT
    order_id,
    CASE
      WHEN lower(trim(customer_ref)) = 'orp' THEN 'user_orp'
      WHEN lower(trim(customer_ref)) = 'ben-ruiz' THEN 'user_ben_ruiz'
      WHEN lower(trim(customer_ref)) = 'choi_lee' THEN 'user_choi_lee'
      ELSE lower(trim(customer_ref))
    END AS customer_ref_std,
    order_ts,
    CASE
      WHEN lower(trim(channel)) IN ('web', 'website', 'online') THEN 'web'
      WHEN lower(trim(channel)) IN ('mobile_app', 'app', 'mobile', 'ios', 'android') THEN 'mobile_app'
      WHEN lower(trim(channel)) IN ('store', 'pos', 'branch') THEN 'store'
      ELSE 'unknown'
    END AS channel_name,
    lower(trim(order_status)) AS order_status,
    updated_at,
    run_id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id
      ORDER BY updated_at DESC
    ) AS rn
  FROM staging.orders_src
)
SELECT
  order_id,
  customer_ref_std,
  order_ts,
  channel_name,
  order_status,
  updated_at,
  run_id
FROM normalized
WHERE rn = 1;

CREATE VIEW staging.v_order_items_latest AS
WITH ranked AS (
  SELECT
    order_id,
    line_id,
    product_id,
    COALESCE(NULLIF(trim(product_name), ''), 'Unknown Product') AS product_name,
    CASE
      WHEN lower(trim(category)) IN ('electronics', 'electronic') THEN 'electronics'
      WHEN lower(trim(category)) IN ('home_kitchen', 'home kitchen', 'home-kitchen') THEN 'home_kitchen'
      WHEN lower(trim(category)) IN ('stationery', 'stationary') THEN 'stationery'
      ELSE 'unknown'
    END AS category,
    quantity,
    unit_price,
    COALESCE(discount_amount, 0) AS discount_amount,
    updated_at,
    run_id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, line_id
      ORDER BY updated_at DESC
    ) AS rn
  FROM staging.order_items_src
)
SELECT
  order_id,
  line_id,
  product_id,
  product_name,
  category,
  quantity,
  unit_price,
  discount_amount,
  updated_at,
  run_id
FROM ranked
WHERE rn = 1;

CREATE VIEW staging.v_customers_latest AS
WITH normalized AS (
  SELECT
    CASE
      WHEN lower(trim(customer_ref)) = 'orp' THEN 'user_orp'
      WHEN lower(trim(customer_ref)) = 'ben-ruiz' THEN 'user_ben_ruiz'
      WHEN lower(trim(customer_ref)) = 'choi_lee' THEN 'user_choi_lee'
      ELSE lower(trim(customer_ref))
    END AS customer_ref_std,
    full_name,
    CASE
      WHEN lower(trim(segment)) IN ('vip') THEN 'vip'
      WHEN lower(trim(segment)) IN ('premium', 'prem') THEN 'premium'
      WHEN lower(trim(segment)) IN ('standard', 'std') THEN 'standard'
      ELSE 'unknown'
    END AS segment,
    CASE
      WHEN lower(trim(region)) IN ('center', 'central') THEN 'center'
      WHEN lower(trim(region)) IN ('jerusalem', 'jrs') THEN 'jerusalem'
      WHEN lower(trim(region)) IN ('north', 'northern') THEN 'north'
      ELSE 'unknown'
    END AS region,
    updated_at,
    run_id
  FROM staging.customers_src
),
ranked AS (
  SELECT
    normalized.*,
    ROW_NUMBER() OVER (
      PARTITION BY customer_ref_std
      ORDER BY
        updated_at DESC,
        COALESCE(full_name, '') DESC,
        COALESCE(segment, '') DESC,
        COALESCE(region, '') DESC
    ) AS rn
  FROM normalized
)
SELECT
  customer_ref_std AS customer_ref,
  full_name,
  segment,
  region,
  run_id
FROM ranked
WHERE rn = 1;

CREATE VIEW staging.v_returns_agg AS
SELECT
  order_id,
  line_id,
  SUM(return_amount) AS return_amount
FROM staging.returns_src
GROUP BY order_id, line_id;
