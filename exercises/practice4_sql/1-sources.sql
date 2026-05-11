CREATE SCHEMA IF NOT EXISTS sources;

DROP TABLE IF EXISTS sources.returns_src;
DROP TABLE IF EXISTS sources.customers_src;
DROP TABLE IF EXISTS sources.order_items_src;
DROP TABLE IF EXISTS sources.orders_src;

CREATE TABLE sources.orders_src (
  order_id BIGINT NOT NULL,
  customer_ref VARCHAR(100),
  order_ts TIMESTAMP NOT NULL,
  channel VARCHAR(50),
  order_status VARCHAR(50),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE sources.order_items_src (
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200),
  category VARCHAR(100),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE sources.customers_src (
  customer_ref VARCHAR(100) NOT NULL,
  full_name VARCHAR(200),
  segment VARCHAR(50),
  region VARCHAR(100),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE sources.returns_src (
  return_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  return_ts TIMESTAMP NOT NULL,
  return_amount DECIMAL(12,2) NOT NULL,
  ingested_at TIMESTAMP NOT NULL
);

INSERT INTO sources.orders_src (
  order_id, customer_ref, order_ts, channel, order_status, updated_at
) VALUES
  (7001, 'orp',       TIMESTAMP '2025-06-01 10:05:00', 'WEB',        'completed', TIMESTAMP '2025-06-01 10:10:00'),
  (7002, 'ben-ruiz',  TIMESTAMP '2025-06-01 10:20:00', 'mobile_app', 'completed', TIMESTAMP '2025-06-01 10:25:00'),
  (7003, 'choi_lee',  TIMESTAMP '2025-06-01 11:00:00', 'Store',      'cancelled', TIMESTAMP '2025-06-01 11:10:00'),
  (7002, 'ben-ruiz',  TIMESTAMP '2025-06-01 10:20:00', 'APP',        'refunded',  TIMESTAMP '2025-06-02 08:00:00');

INSERT INTO sources.order_items_src (
  order_id, line_id, product_id, product_name, category, quantity, unit_price, discount_amount, updated_at
) VALUES
  (7001, 1, 501, 'Headphones', 'Electronics',  1, 120.00, 10.00, TIMESTAMP '2025-06-01 10:10:00'),
  (7001, 2, 502, 'Mug',        'home_kitchen', 2,  30.00,  0.00, TIMESTAMP '2025-06-01 10:10:00'),
  (7002, 1, 503, 'USB Hub',    'electronics',  1,  75.00,  5.00, TIMESTAMP '2025-06-01 10:25:00'),
  (7003, 1, 504, 'Notebook',   'Stationery',   1,  40.00,  0.00, TIMESTAMP '2025-06-01 11:10:00');

INSERT INTO sources.customers_src (
  customer_ref, full_name, segment, region, updated_at
) VALUES
  ('user_orp',      'Ava Patel', 'VIP',      'Center',    TIMESTAMP '2025-05-01 09:00:00'),
  ('user_ben_ruiz', 'Ben Ruiz',  'standard', 'jerusalem', TIMESTAMP '2025-05-01 09:00:00'),
  ('user_ben_ruiz', 'Ben Ruiz',  'Premium',  'JERUSALEM', TIMESTAMP '2025-06-02 08:00:00'),
  ('user_choi_lee', 'Choi Lee',  'std',      'North',     TIMESTAMP '2025-05-01 09:00:00');

INSERT INTO sources.returns_src (
  return_id, order_id, line_id, return_ts, return_amount, ingested_at
) VALUES
  (90001, 7001, 2, TIMESTAMP '2025-06-03 10:00:00', 30.00, TIMESTAMP '2025-06-03 10:05:00'),
  (90002, 7002, 1, TIMESTAMP '2025-06-01 18:00:00', 70.00, TIMESTAMP '2025-06-04 09:00:00');

