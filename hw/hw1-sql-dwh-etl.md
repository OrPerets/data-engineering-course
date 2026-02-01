# Homework 1 — SQL, Data Warehousing & ETL

## Instructions
- Submission format: one PDF with answers and reasoning; include SQL in monospace blocks.
- Allowed: calculator, notes. Not allowed: tool-specific APIs, copy–paste SQL without explanation.
- Grading: partial credit based on logic; missing assumptions or units reduces credit.

## Data Context
You manage an e-commerce analytics warehouse. Raw operational tables are:
- `orders_raw(order_id, user_id, order_ts, ship_country, device_type)`
- `order_items_raw(order_id, product_id, qty, unit_price_usd)`
- `products_raw(product_id, category, brand)`
- `users_raw(user_id, signup_ts, marketing_channel)`

Daily volume (one day of data):
- `orders_raw`: 10,000,000 rows, 120 bytes/row
- `order_items_raw`: 40,000,000 rows, 80 bytes/row (avg 4 items/order)
- `products_raw`: 500,000 rows, 80 bytes/row
- `users_raw`: 20,000,000 rows, 100 bytes/row

Keys and access patterns:
- `order_id` joins `orders_raw` ↔ `order_items_raw`.
- `product_id` joins `order_items_raw` ↔ `products_raw`.
- `user_id` joins `orders_raw` ↔ `users_raw`.
- Typical queries aggregate revenue by day, country, device, category, and marketing channel.

Assume hash joins, uniform distributions unless stated, and 1 GB = 10^9 bytes.

## Questions
### Question 1 — Warm-up
Write a SQL query to compute daily revenue by `ship_country` and `device_type` for January 2026. Revenue is `sum(qty * unit_price_usd)`. Include only orders with at least one item. Output: `order_date`, `ship_country`, `device_type`, `revenue_usd`.

### Question 2 — Engineering Reasoning
Estimate the size (in GB) of the intermediate result for a hash join between `orders_raw` and `order_items_raw` on `order_id`. Assume:
- 10,000,000 orders/day, 40,000,000 items/day
- Each joined row contains all columns from both tables
- Joined row size = 120 + 80 = 200 bytes
Provide the intermediate size and explain the join cardinality.

### Question 3 — Cost / Scale Analysis
Design a star schema for a daily sales warehouse that supports queries by day, product category, brand, ship country, device, and marketing channel. Specify fact and dimension tables with primary keys and foreign keys. Assume grain is one row per order item.

### Question 4 — Design Decision
You must ingest the raw tables into the warehouse. Compare ETL vs ELT for this case. Given:
- Raw data arrives at 2 AM and must be queryable by 7 AM.
- Transformations include currency normalization, deduping, and SCD Type-2 for `users`.
- Warehouse compute can scale to 100 nodes for 2 hours.
Decide ETL or ELT and justify with cost, latency, and correctness trade-offs.

### Question 5 — Challenge (Optional)
The `order_items_raw` table is partitioned by `order_date` (derived from `orders_raw.order_ts`). Queries frequently filter by `order_date` and `category`. Propose a partitioning and clustering strategy for the fact table in your star schema. Identify likely bottlenecks and propose two improvements. Use concrete reasoning about scan size and join cost.

## Solutions
### Solution 1
SQL:
```sql
SELECT
  DATE(o.order_ts) AS order_date,
  o.ship_country,
  o.device_type,
  SUM(oi.qty * oi.unit_price_usd) AS revenue_usd
FROM orders_raw o
JOIN order_items_raw oi
  ON o.order_id = oi.order_id
WHERE o.order_ts >= '2026-01-01'
  AND o.order_ts < '2026-02-01'
GROUP BY 1, 2, 3;
```
Explanation: inner join ensures only orders with at least one item. Grouping by date, country, device yields required aggregation. Filter uses a half-open interval to avoid time-of-day issues.

### Solution 2
Join cardinality: each order has ~4 items, so joining `orders_raw` (10M) with `order_items_raw` (40M) on `order_id` yields ~40M joined rows (one per order item). Intermediate size:
- 40,000,000 rows × 200 bytes/row = 8,000,000,000 bytes ≈ 8.0 GB.
Assumptions: no data loss, uniform distribution, full inner join.

### Solution 3
Star schema (grain: one order item):
- Fact table `fact_order_item`:
  - PK: `order_item_id` (surrogate)
  - FKs: `date_id`, `product_id`, `user_id`, `ship_country_id`, `device_id`, `channel_id`, `order_id`
  - Measures: `qty`, `unit_price_usd`, `revenue_usd`
- Dimensions:
  - `dim_date(date_id, date, day, month, year)`
  - `dim_product(product_id, category, brand)`
  - `dim_user(user_id, signup_date_id, marketing_channel)` (SCD2 possible via `user_sk`, `effective_from`, `effective_to`)
  - `dim_ship_country(ship_country_id, ship_country)`
  - `dim_device(device_id, device_type)`
  - `dim_channel(channel_id, marketing_channel)`
Reasoning: star schema isolates measures in a single fact table and supports slicing by all required attributes via dimensions. Grain at order item supports category and brand rollups without loss.

### Solution 4
Choose ELT. Raw data lands at 2 AM; window is 5 hours. With 100 nodes for 2 hours, warehouse compute can run heavy transformations in parallel. ELT benefits:
- Latency: load raw quickly, then parallel transforms; no upstream staging bottleneck.
- Cost: scalable warehouse compute concentrates processing; avoids separate ETL cluster.
- Correctness: SCD2 for users can be managed with SQL-based merge logic and audit tables; deduping on raw history remains available.
Trade-offs: ELT increases warehouse load during transform window but stays within 2-hour compute budget. ETL would require provisioning and maintaining a separate transformation system and can delay availability if the ETL pipeline bottlenecks.

### Solution 5
Partition by `order_date` to prune daily scans. Cluster within partitions by `category` (via `product_id` join) or directly denormalize `category` into the fact table to enable clustering without a join. Bottlenecks: joins to `dim_product` for category filters and wide scans of large daily partitions. Improvements:
1) Add `product_category` to fact table as a derived column to avoid joining for common filters; reduces join cost and enables effective clustering.
2) Use composite clustering on (`category`, `ship_country_id`) or (`category`, `device_id`) to improve locality for common filters, reducing scan bytes. Expected benefit: smaller scan per query, fewer hash join inputs.

