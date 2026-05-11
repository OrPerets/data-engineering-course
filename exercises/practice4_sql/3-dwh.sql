CREATE SCHEMA IF NOT EXISTS dwh;

CREATE TABLE dwh.dim_date (
  date_key INT PRIMARY KEY,
  calendar_date DATE NOT NULL UNIQUE,
  year_month CHAR(7) NOT NULL,
  week_start DATE NOT NULL
);

CREATE TABLE dwh.dim_channel (
  channel_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE dwh.dim_product (
  product_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL UNIQUE,
  product_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE dwh.dim_customer (
  customer_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_ref VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  segment VARCHAR(50) NOT NULL,
  region VARCHAR(100) NOT NULL
);

CREATE TABLE dwh.fact_sales (
  date_key INT NOT NULL REFERENCES dwh.dim_date(date_key),
  product_key BIGINT NOT NULL REFERENCES dwh.dim_product(product_key),
  customer_key BIGINT NOT NULL REFERENCES dwh.dim_customer(customer_key),
  channel_key BIGINT NOT NULL REFERENCES dwh.dim_channel(channel_key),
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  order_status VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  gross_revenue DECIMAL(14,2) NOT NULL,
  discount_amount DECIMAL(14,2) NOT NULL,
  return_amount DECIMAL(14,2) NOT NULL,
  net_revenue DECIMAL(14,2) NOT NULL,
  CONSTRAINT pk_fact_sales_order_line PRIMARY KEY (order_id, line_id),
  CONSTRAINT ck_fact_sales_amounts CHECK (
    net_revenue = gross_revenue - discount_amount - return_amount
  )
);

CREATE INDEX ix_fact_sales_date_key ON dwh.fact_sales (date_key);
CREATE INDEX ix_fact_sales_product_key ON dwh.fact_sales (product_key);
CREATE INDEX ix_fact_sales_customer_key ON dwh.fact_sales (customer_key);
CREATE INDEX ix_fact_sales_channel_key ON dwh.fact_sales (channel_key);

CREATE TABLE dwh.etl_run_log (
  run_id VARCHAR(100) PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  rows_read BIGINT NOT NULL DEFAULT 0,
  rows_loaded BIGINT NOT NULL DEFAULT 0,
  rows_rejected BIGINT NOT NULL DEFAULT 0,
  notes TEXT
);
