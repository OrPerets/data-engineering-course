-- Step 3: DWH star schema.
-- Dimensions describe entities. The fact table stores measurable sales events.

CREATE SCHEMA simple_dwh;

CREATE TABLE simple_dwh.dim_date (
  date_key INT PRIMARY KEY,
  order_date DATE NOT NULL UNIQUE,
  year_month CHAR(7) NOT NULL
);

CREATE TABLE simple_dwh.dim_customer (
  customer_key INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL
);

CREATE TABLE simple_dwh.dim_product (
  product_key INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  product_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL
);

CREATE TABLE simple_dwh.fact_sales (
  sale_id INT PRIMARY KEY,
  date_key INT NOT NULL REFERENCES simple_dwh.dim_date(date_key),
  customer_key INT NOT NULL REFERENCES simple_dwh.dim_customer(customer_key),
  product_key INT NOT NULL REFERENCES simple_dwh.dim_product(product_key),
  quantity INT NOT NULL,
  gross_revenue NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL,
  net_revenue NUMERIC(10,2) NOT NULL
);
