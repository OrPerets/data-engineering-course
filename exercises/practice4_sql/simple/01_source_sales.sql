-- Step 1: operational source data.
-- One flat sales feed is enough to teach the ETL idea.

DROP SCHEMA IF EXISTS simple_dwh CASCADE;
DROP SCHEMA IF EXISTS simple_staging CASCADE;
DROP SCHEMA IF EXISTS simple_sources CASCADE;

CREATE SCHEMA simple_sources;

CREATE TABLE simple_sources.raw_sales (
  sale_id INT PRIMARY KEY,
  order_date DATE NOT NULL,
  customer_id VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2)
);

INSERT INTO simple_sources.raw_sales VALUES
  (1, DATE '2025-06-01', 'C001', 'Ava Patel', 'Center',    501, 'Headphones', 'Electronics',  1, 120.00, 10.00),
  (2, DATE '2025-06-01', 'C002', 'Ben Ruiz',  'jerusalem', 502, 'Mug',        'home kitchen', 2,  30.00,  0.00),
  (3, DATE '2025-06-02', 'C003', 'Dana Choi', 'North',     501, 'Headphones', 'electronics',  1, 120.00,  0.00),
  (4, DATE '2025-06-02', 'C002', 'Ben Ruiz',  'JERUSALEM', 503, 'USB Hub',    'Electronics',  1,  75.00,  5.00),
  (5, DATE '2025-06-03', 'C001', 'Ava Patel', 'Center',    502, 'Mug',        'Home_Kitchen', 1,  30.00,  NULL);
