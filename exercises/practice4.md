# Topic 04-05 Practice - DWH, ETL, STTM (Student Version)

---

## Instructions & Questions

### Scenario
A digital commerce company operates online and physical channels.
Management wants trusted KPI dashboards for:
- Daily net revenue by region and product category
- Weekly order fulfillment rate by channel
- Monthly customer segment performance

Current sources are operational and inconsistent.
Your task is to design a warehouse model and ingestion flow that are correct, scalable, and rerun-safe.

---

### Part A - Source Setup and Data Understanding

#### A1. Source tables (operational)
You receive the following source schemas.

**`orders_src`**

| column | type |
|---|---|
| order_id | BIGINT |
| customer_id | BIGINT |
| order_ts | TIMESTAMP |
| channel | VARCHAR |
| order_status | VARCHAR |
| updated_at | TIMESTAMP |

**`order_items_src`**

| column | type |
|---|---|
| order_id | BIGINT |
| line_id | INT |
| product_id | BIGINT |
| quantity | INT |
| unit_price | DECIMAL(12,2) |
| discount_amount | DECIMAL(12,2) |
| updated_at | TIMESTAMP |

**`products_src`**

| column | type |
|---|---|
| product_id | BIGINT |
| product_name | VARCHAR |
| category | VARCHAR |
| brand | VARCHAR |
| supplier_id | BIGINT |
| updated_at | TIMESTAMP |

**`customers_src`**

| column | type |
|---|---|
| customer_id | BIGINT |
| full_name | VARCHAR |
| segment | VARCHAR |
| city | VARCHAR |
| region | VARCHAR |
| updated_at | TIMESTAMP |

**`returns_src`**

| column | type |
|---|---|
| return_id | BIGINT |
| order_id | BIGINT |
| line_id | INT |
| return_ts | TIMESTAMP |
| return_amount | DECIMAL(12,2) |
| reason_code | VARCHAR |
| ingested_at | TIMESTAMP |

#### A2. Sample data
Use this subset for calculations.

**`orders_src`**

| order_id | customer_id | order_ts | channel | order_status | updated_at |
|---:|---:|---|---|---|---|
| 7001 | 101 | 2025-06-01 10:05 | web | completed | 2025-06-01 10:10 |
| 7002 | 102 | 2025-06-01 10:20 | app | completed | 2025-06-01 10:25 |
| 7003 | 103 | 2025-06-01 11:00 | store | cancelled | 2025-06-01 11:10 |
| 7002 | 102 | 2025-06-01 10:20 | app | refunded | 2025-06-02 08:00 |

**`order_items_src`**

| order_id | line_id | product_id | quantity | unit_price | discount_amount | updated_at |
|---:|---:|---:|---:|---:|---:|---|
| 7001 | 1 | 501 | 1 | 120.00 | 10.00 | 2025-06-01 10:10 |
| 7001 | 2 | 502 | 2 | 30.00 | 0.00 | 2025-06-01 10:10 |
| 7002 | 1 | 503 | 1 | 75.00 | 5.00 | 2025-06-01 10:25 |
| 7003 | 1 | 504 | 1 | 40.00 | 0.00 | 2025-06-01 11:10 |

**`products_src`**

| product_id | product_name | category | brand | supplier_id | updated_at |
|---:|---|---|---|---:|---|
| 501 | Headphones | electronics | Sonic | 9001 | 2025-05-15 09:00 |
| 502 | Mug | home | Casa | 9002 | 2025-05-20 12:00 |
| 503 | USB Hub | electronics | Sonic | 9001 | 2025-05-18 08:30 |
| 504 | Notebook | stationery | PaperCo | 9003 | 2025-05-12 16:00 |

**`customers_src`**

| customer_id | full_name | segment | city | region | updated_at |
|---:|---|---|---|---|---|
| 101 | Ava Patel | premium | Tel Aviv | center | 2025-05-01 09:00 |
| 102 | Ben Ruiz | standard | Jerusalem | jerusalem | 2025-05-01 09:00 |
| 102 | Ben Ruiz | premium | Jerusalem | jerusalem | 2025-06-02 08:00 |
| 103 | Choi Lee | standard | Haifa | north | 2025-05-01 09:00 |

**`returns_src`**

| return_id | order_id | line_id | return_ts | return_amount | reason_code | ingested_at |
|---:|---:|---:|---|---:|---|---|
| 90001 | 7001 | 2 | 2025-06-03 10:00 | 30.00 | damaged | 2025-06-03 10:05 |
| 90002 | 7002 | 1 | 2025-06-01 18:00 | 70.00 | changed_mind | 2025-06-04 09:00 |

#### A3. Questions
1. Define grain and business key for each source table.
2. Classify each source as mutable, append-only, or late-arriving.
3. Identify two data quality risks that can break KPI accuracy.
4. Write `CREATE TABLE` SQL for `orders_src` and `order_items_src` in a staging schema.

---

### Part B - DWH Modeling (Star Schema + SCD)

#### B1. Modeling task
Design a star schema for KPI analytics.
Minimum required tables:
- `fact_sales`
- `dim_date`
- `dim_product`
- `dim_customer`
- `dim_channel`

#### B2. Requirements
- Fact grain must support day, category, segment, region, and channel analysis.
- Revenue metrics must support gross, discount, return, and net values.
- `dim_customer` must preserve history of segment changes (SCD Type 2).
- Facts must join dimensions using surrogate keys.

#### B3. Questions
1. Define the exact grain of `fact_sales`.
2. Provide schema for `fact_sales` as a markdown table.
3. Provide schema for `dim_customer` with SCD2 columns.
4. Explain why order-level fact grain is wrong for this use case.
5. Draw or describe star schema relationships (FKs from fact to dimensions).

---

### Part C - ETL, Incremental Loads, and STTM

#### C1. Pipeline constraints
- Daily batch runs at 02:00 UTC.
- Accepted late-arrival window: 72 hours.
- Rerun must be idempotent.
- Failures must not publish partial data.

#### C2. Questions
1. Define Extract, Transform, Load steps for this pipeline.
2. Design control table columns for watermark-based incremental processing.
3. Write pseudocode for watermark logic with a safety buffer.
4. Specify deterministic dedup rule for `customers_src` and `orders_src`.
5. Provide STTM mapping for 8 target fields (source -> transform -> target).
6. Write SQL skeleton for idempotent `MERGE` into `fact_sales`.
7. Explain how to process late-arriving records in `returns_src`.

#### C3. STTM template (fill in)

| target_table | target_column | source_table.source_column | transform_rule | key_type | null_policy |
|---|---|---|---|---|---|
| fact_sales | date_key |  |  |  |  |
| fact_sales | product_key |  |  |  |  |
| fact_sales | customer_key |  |  |  |  |
| fact_sales | channel_key |  |  |  |  |
| fact_sales | gross_revenue |  |  |  |  |
| fact_sales | discount_amount |  |  |  |  |
| fact_sales | return_amount |  |  |  |  |
| fact_sales | net_revenue |  |  |  |  |

---

### Part D - Analytics Queries and Performance

#### D1. Query tasks
Write optimized SQL for:
1. Daily net revenue by region and category.
2. Weekly fulfillment rate by channel (`completed / total orders`).
3. Monthly net revenue by customer segment.
4. Top 5 products by net revenue in the last 30 days.

#### D2. Cost and correctness tasks
1. Explain how partition pruning applies to your fact table.
2. Show one query anti-pattern that causes full scan and rewrite it correctly.
3. Explain how missing SCD2 join conditions can distort historical segment KPIs.
4. Propose 4 monitoring metrics for pipeline + warehouse health.

---

### Bonus Challenges
1. Add fraud flags from a new `risk_events_src` stream without breaking existing grain.
2. Design a backfill strategy for one month of corrected order data.
3. Add semantic metric definitions for `gross_revenue` and `net_revenue` to prevent KPI drift.

---

## Solution (End to End)

### Part A – Solutions

**A3.1 – Grain and business key per source**

| source_table     | grain description                    | business key(s)                    |
|------------------|--------------------------------------|------------------------------------|
| orders_src       | One row per order (version)          | order_id (+ updated_at for version)|
| order_items_src  | One row per order line               | order_id, line_id                  |
| products_src     | One row per product (version)        | product_id (+ updated_at)          |
| customers_src    | One row per customer (version)       | customer_id (+ updated_at)         |
| returns_src      | One row per return                   | return_id                          |

**A3.2 – Source classification**

| source_table     | classification   | reason |
|------------------|------------------|--------|
| orders_src       | **Mutable**      | Status and other attributes can change (e.g. completed → refunded); multiple rows per order_id. |
| order_items_src  | **Mutable**      | Quantity, price, discount can be corrected; updated_at signals changes. |
| products_src     | **Mutable**      | Name, category, brand can change over time. |
| customers_src    | **Mutable**      | Segment and attributes can change (e.g. standard → premium); SCD2 required. |
| returns_src      | **Late-arriving**| Arrives after order/line; ingested_at can be days after return_ts. |

**A3.3 – Two data quality risks**

1. **Duplicate or multiple versions of same business key**  
   Orders and customers have multiple rows per business key (e.g. order 7002 completed then refunded; customer 102 segment change). Without deterministic dedup (e.g. by `updated_at DESC`), KPIs can double-count or use stale attributes.

2. **Late-arriving returns and status changes**  
   Returns and order status updates can arrive after the order’s “natural” load window. If the pipeline only looks at “yesterday’s” data, net revenue and fulfillment rates will be wrong unless we re-process a lookback window (e.g. 72 hours) for returns and order status.

**A3.4 – CREATE TABLE for staging**

```sql
CREATE TABLE staging.orders_src (
  order_id     BIGINT NOT NULL,
  customer_id  BIGINT NOT NULL,
  order_ts     TIMESTAMP NOT NULL,
  channel      VARCHAR(50),
  order_status VARCHAR(50),
  updated_at   TIMESTAMP NOT NULL,
  _batch_id    VARCHAR(50),   -- optional: load batch for rerun isolation
  PRIMARY KEY (order_id, updated_at)  -- if we keep full history in staging
);

CREATE TABLE staging.order_items_src (
  order_id        BIGINT NOT NULL,
  line_id         INT NOT NULL,
  product_id      BIGINT NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP NOT NULL,
  _batch_id       VARCHAR(50),
  PRIMARY KEY (order_id, line_id)
);
```

---

### Part B – Solutions

**B3.1 – Exact grain of `fact_sales`**

One row per **order line** (order_id + line_id), at the **order date** (calendar day of order_ts).  
So: **grain = (order_id, line_id)** with **date_key** = calendar date of the order.  
This supports day/category/segment/region/channel (via dimension FKs) and line-level revenue and returns.

**B3.2 – Schema for `fact_sales`**

| column          | type           | description |
|-----------------|----------------|-------------|
| date_key        | INT            | FK to dim_date (YYYYMMDD or surrogate) |
| product_key     | BIGINT         | FK to dim_product (surrogate) |
| customer_key    | BIGINT         | FK to dim_customer (surrogate, SCD2) |
| channel_key     | INT            | FK to dim_channel (surrogate) |
| order_id        | BIGINT         | degenerate dimension (optional, for drill-down) |
| line_id         | INT            | degenerate dimension |
| gross_revenue   | DECIMAL(14,2)  | quantity * unit_price (before discount) |
| discount_amount | DECIMAL(14,2)  | total discount for line |
| return_amount   | DECIMAL(14,2)  | from returns_src, 0 if no return |
| net_revenue     | DECIMAL(14,2)  | gross_revenue - discount_amount - return_amount |

**B3.3 – Schema for `dim_customer` (SCD Type 2)**

| column         | type        | description |
|----------------|-------------|-------------|
| customer_key   | BIGINT      | surrogate PK (auto/increment) |
| customer_id    | BIGINT      | business key (natural key) |
| full_name      | VARCHAR    | current in this row |
| segment        | VARCHAR    | current in this row |
| city           | VARCHAR    | current in this row |
| region         | VARCHAR    | current in this row |
| effective_from | DATE       | row valid from (inclusive) |
| effective_to   | DATE       | row valid to (exclusive); NULL = current |
| is_current     | BOOLEAN    | true iff effective_to IS NULL |

**B3.4 – Why order-level fact grain is wrong**

- **Product/category analysis:** Order-level facts don’t tell which product or category generated revenue; we need line-level grain to join to dim_product and aggregate by category.
- **Returns:** Returns are at (order_id, line_id). With order-level grain we can’t correctly allocate return_amount to products or compute net revenue per line/category.
- **Discounts:** Discounts are per line; order-level grain would mix all lines and lose allocation to category/segment.

**B3.5 – Star schema relationships**

- **fact_sales** has FKs: `date_key` → dim_date, `product_key` → dim_product, `customer_key` → dim_customer, `channel_key` → dim_channel.
- **dim_date:** one row per calendar day (date_key = YYYYMMDD or surrogate).
- **dim_product:** one row per product (surrogate key); product_id as business key.
- **dim_customer:** multiple rows per customer_id (SCD2); fact joins on customer_key where effective_from <= order date < effective_to (or is_current for “as of today”).
- **dim_channel:** one row per channel (e.g. web, app, store).

```
fact_sales ──► dim_date (date_key)
    ├────────► dim_product (product_key)
    ├────────► dim_customer (customer_key)
    └────────► dim_channel (channel_key)
```

---

### Part C – Solutions

**C2.1 – Extract, Transform, Load**

- **Extract:** Read from operational DB/API into staging. For incremental: only rows where `updated_at` (or `ingested_at` for returns) is in the watermark window. Use a control table to store last successful high-water mark per source.
- **Transform:** (1) Dedup sources: e.g. orders_src by (order_id, updated_at DESC), customers_src by (customer_id, updated_at DESC). (2) Join orders + order_items + products + customers + channel to get one row per line; resolve dim surrogate keys (date_key from order_ts, product_key, customer_key with SCD2 validity, channel_key). (3) Compute gross_revenue, discount_amount; attach return_amount from returns_src on (order_id, line_id). (4) Apply 72-hour lookback for returns so late-arriving returns update the same fact row (or a dedicated update step).
- **Load:** Idempotent MERGE into fact_sales (and dimension MERGE/SCD2 for dim_customer, etc.). Only commit after full success; no partial publish.

**C2.2 – Control table for watermark-based incremental processing**

| column           | type        | description |
|------------------|-------------|-------------|
| source_name      | VARCHAR(100)| e.g. 'orders_src', 'returns_src' |
| watermark_column | VARCHAR(100)| e.g. 'updated_at', 'ingested_at' |
| last_value       | TIMESTAMP   | last successfully processed max value |
| last_run_ts      | TIMESTAMP   | when the pipeline last ran |
| batch_id         | VARCHAR(50) | optional id for this run |

**C2.3 – Watermark logic with safety buffer (pseudocode)**

```
SAFETY_BUFFER_HOURS = 1
LOOKBACK_HOURS = 72   -- for late-arriving (e.g. returns)

-- Read last watermark from control table for this source
last_watermark = control_table.get_last_value("orders_src", "updated_at")

-- Lower bound: last run minus lookback (so we don’t miss late data)
extract_from = last_watermark - LOOKBACK_HOURS

-- Upper bound: “now” minus safety buffer (avoid reading in-flight transactions)
extract_to = current_utc_timestamp() - SAFETY_BUFFER_HOURS

-- Extract only rows in [extract_from, extract_to]
rows = source.read_where(updated_at > extract_from AND updated_at <= extract_to)

-- After successful load, update control table
new_watermark = max(rows.updated_at)
control_table.set_last_value("orders_src", "updated_at", new_watermark)
```

**C2.4 – Deterministic dedup**

- **orders_src:** Keep one row per `order_id` with **latest `updated_at`** (e.g. `ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1`). Use that row for status and order_ts when building fact rows.
- **customers_src:** Keep one row per `customer_id` with **latest `updated_at`** for “current” view; for SCD2 we keep all versions and assign effective_from / effective_to so the fact joins to the version valid at order_ts.

**C2.5 & C3 – STTM mapping (filled)**

| target_table | target_column   | source_table.source_column     | transform_rule                                      | key_type | null_policy |
|--------------|-----------------|---------------------------------|------------------------------------------------------|----------|-------------|
| fact_sales   | date_key        | orders_src.order_ts             | DATE(order_ts) → lookup dim_date.date_key (YYYYMMDD) | FK       | NOT NULL    |
| fact_sales   | product_key     | order_items_src.product_id      | Lookup dim_product by product_id → product_key       | FK       | NOT NULL    |
| fact_sales   | customer_key    | orders_src.customer_id + order_ts| Lookup dim_customer SCD2 valid at order_ts           | FK       | NOT NULL    |
| fact_sales   | channel_key     | orders_src.channel              | Lookup dim_channel by channel name → channel_key     | FK       | NOT NULL    |
| fact_sales   | gross_revenue   | order_items_src.quantity, unit_price | quantity * unit_price                         | measure  | NOT NULL    |
| fact_sales   | discount_amount | order_items_src.discount_amount | as-is (per line)                                    | measure  | NOT NULL, default 0 |
| fact_sales   | return_amount   | returns_src.return_amount       | SUM(return_amount) per (order_id, line_id); 0 if no return | measure  | NOT NULL, default 0 |
| fact_sales   | net_revenue     | (derived)                       | gross_revenue - discount_amount - return_amount      | measure  | NOT NULL    |

**C2.6 – SQL skeleton for idempotent MERGE into `fact_sales`**

```sql
MERGE INTO dwh.fact_sales AS t
USING (
  SELECT
    d.date_key,
    p.product_key,
    c.customer_key,
    ch.channel_key,
    o.order_id,
    oi.line_id,
    (oi.quantity * oi.unit_price) AS gross_revenue,
    oi.discount_amount,
    COALESCE(r.return_amount, 0) AS return_amount,
    (oi.quantity * oi.unit_price) - oi.discount_amount - COALESCE(r.return_amount, 0) AS net_revenue
  FROM staging.orders_dedup o
  JOIN staging.order_items oi ON o.order_id = oi.order_id
  JOIN dim_date d ON d.date_key = TO_CHAR(o.order_ts::DATE, 'YYYYMMDD')::INT
  JOIN dim_product p ON p.product_id = oi.product_id AND p.is_current
  JOIN dim_customer c ON c.customer_id = o.customer_id
    AND o.order_ts::DATE >= c.effective_from
    AND (c.effective_to IS NULL OR o.order_ts::DATE < c.effective_to)
  JOIN dim_channel ch ON ch.channel_name = o.channel
  LEFT JOIN (
    SELECT order_id, line_id, SUM(return_amount) AS return_amount
    FROM staging.returns_src
    GROUP BY order_id, line_id
  ) r ON r.order_id = oi.order_id AND r.line_id = oi.line_id
  WHERE o.order_status IN ('completed', 'refunded')  -- include refunded so return_amount applies
) AS s
ON t.order_id = s.order_id AND t.line_id = s.line_id
WHEN MATCHED THEN
  UPDATE SET
    gross_revenue = s.gross_revenue,
    discount_amount = s.discount_amount,
    return_amount = s.return_amount,
    net_revenue = s.net_revenue
WHEN NOT MATCHED THEN
  INSERT (date_key, product_key, customer_key, channel_key, order_id, line_id,
          gross_revenue, discount_amount, return_amount, net_revenue)
  VALUES (s.date_key, s.product_key, s.customer_key, s.channel_key, s.order_id, s.line_id,
          s.gross_revenue, s.discount_amount, s.return_amount, s.net_revenue);
```

(Note: Exact syntax for date_key and “current” flag may vary by engine; surrogate keys and SCD2 join as above.)

**C2.7 – Late-arriving records in `returns_src`**

- **Lookback window:** For each run, re-extract returns where `ingested_at` is in the last 72 hours (or where `return_ts` is within 72 hours of the latest order date we’re processing). This pulls in returns that arrived after the order was first loaded.
- **Idempotent update:** Fact grain is (order_id, line_id). For each (order_id, line_id) that has a return, either (1) **MERGE** return_amount into existing fact row (UPDATE return_amount and net_revenue), or (2) rebuild fact rows for affected order lines in the lookback window and MERGE. No new fact row is created; only return_amount and net_revenue are updated.
- **Order of operations:** Load/update dimensions first, then build the fact set including returns from the lookback window, then run the MERGE so that re-runs with the same data produce the same result.

---

### Part D – Solutions

**D1.1 – Daily net revenue by region and category**

```sql
SELECT
  d.calendar_date,
  c.region,
  p.category,
  SUM(f.net_revenue) AS daily_net_revenue
FROM dwh.fact_sales f
JOIN dwh.dim_date d   ON f.date_key = d.date_key
JOIN dwh.dim_customer c ON f.customer_key = c.customer_key AND c.is_current = true
JOIN dwh.dim_product p  ON f.product_key = p.product_key
GROUP BY d.calendar_date, c.region, p.category
ORDER BY d.calendar_date, c.region, p.category;
```

**D1.2 – Weekly fulfillment rate by channel**

```sql
SELECT
  ch.channel_name,
  d.week_start,
  COUNT(DISTINCT CASE WHEN f.order_id IN (SELECT order_id FROM staging.orders_dedup WHERE order_status = 'completed') THEN f.order_id END) * 1.0
    / NULLIF(COUNT(DISTINCT f.order_id), 0) AS fulfillment_rate
FROM dwh.fact_sales f
JOIN dwh.dim_channel ch ON f.channel_key = ch.channel_key
JOIN dwh.dim_date d ON f.date_key = d.date_key
WHERE d.week_start >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '12 weeks')::DATE
GROUP BY ch.channel_name, d.week_start;
```

*Simpler alternative if order status is on the fact or a degenerate:*  
Count completed orders vs total orders per channel per week. Example (if we had order_status on fact):

```sql
SELECT
  ch.channel_name,
  d.week_start,
  SUM(CASE WHEN f.order_status = 'completed' THEN 1 ELSE 0 END) * 1.0
    / NULLIF(COUNT(*), 0) AS fulfillment_rate
FROM dwh.fact_sales f
JOIN dwh.dim_channel ch ON f.channel_key = ch.channel_key
JOIN dwh.dim_date d ON f.date_key = d.date_key
GROUP BY ch.channel_name, d.week_start;
```

(If order_status is not in the fact, use the first variant with a join to a view of “orders that are completed” or store order_status as degenerate on fact_sales.)

**D1.3 – Monthly net revenue by customer segment**

```sql
SELECT
  d.year_month,
  c.segment,
  SUM(f.net_revenue) AS monthly_net_revenue
FROM dwh.fact_sales f
JOIN dwh.dim_date d ON f.date_key = d.date_key
JOIN dwh.dim_customer c ON f.customer_key = c.customer_key AND c.is_current = true
GROUP BY d.year_month, c.segment
ORDER BY d.year_month, c.segment;
```

(Assuming dim_date has `year_month` e.g. YYYY-MM; otherwise use `DATE_TRUNC('month', d.calendar_date)`.)

**D1.4 – Top 5 products by net revenue (last 30 days)**

```sql
SELECT
  p.product_name,
  p.category,
  SUM(f.net_revenue) AS net_revenue_30d
FROM dwh.fact_sales f
JOIN dwh.dim_product p ON f.product_key = p.product_key
JOIN dwh.dim_date d ON f.date_key = d.date_key
WHERE d.calendar_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.product_key, p.product_name, p.category
ORDER BY net_revenue_30d DESC
LIMIT 5;
```

**D2.1 – Partition pruning on the fact table**

If `fact_sales` is partitioned by **date_key** (or by a date derived from it), queries that filter on date can skip partitions.  
Example: `WHERE date_key >= 20250501 AND date_key < 20250601` causes the engine to read only partitions in that range (e.g. May 2025), not the full table. So we should partition by date_key (or calendar_date) and use date_key (or calendar_date) in WHERE clauses for time-bounded reports.

**D2.2 – Full-scan anti-pattern and rewrite**

- **Anti-pattern:** Using a function on the partition key so the engine can’t prune:  
  `WHERE YEAR(calendar_date) = 2025 AND MONTH(calendar_date) = 6`  
  or `WHERE date_key::VARCHAR LIKE '2025%'`.
- **Rewrite:** Use a range on the same key so the optimizer can prune:  
  `WHERE date_key >= 20250601 AND date_key <= 20250630`  
  or `WHERE calendar_date >= '2025-06-01' AND calendar_date <= '2025-06-30'`.

**D2.3 – Missing SCD2 join and historical segment KPIs**

If we join to `dim_customer` only on `customer_key` or on `customer_id` without validity dates, we use the **current** segment for all history. When a customer’s segment changes (e.g. standard → premium), past orders would be wrongly attributed to “premium” and monthly segment KPIs would be distorted.  
Correct join: use **effective_from** and **effective_to** (or `is_current`) so that each fact row joins to the customer version that was valid **at order time**. That preserves historical segment for KPIs.

**D2.4 – Four monitoring metrics**

1. **Row count and freshness:** Count of rows loaded per run per table; max(order_ts) or max(date_key) in fact_sales vs expected (e.g. data through yesterday).
2. **Data quality checks:** Null key checks (no null FKs in fact_sales); referential integrity (all FKs exist in dims); gross_revenue ≥ net_revenue sanity check.
3. **Idempotency / duplicate check:** Re-run the same batch and assert row counts and sum(net_revenue) for that batch don’t change.
4. **Late-arriving and SLA:** Count of records with updated_at or ingested_at older than 72 hours that were still processed; alert if volume spikes (possible backlog or source issue).

---

### Bonus – Solutions (optional)

**1. Fraud flags without breaking grain**

- Add a **degenerate** column on `fact_sales`, e.g. `fraud_risk_flag` (BOOLEAN) or `risk_tier` (VARCHAR), set from `risk_events_src` by matching (order_id, line_id) or order_id and taking max risk per line.  
- Grain stays (order_id, line_id); no new fact table.  
- Alternatively: small **fact_fraud** at same grain (order_id, line_id) with risk fields and join to fact_sales when needed; this keeps fraud logic separate without changing fact_sales grain.

**2. Backfill for one month of corrected order data**

- **Extract:** Pull full extract for the target month from source (or from corrected source table) with a filter on order_ts (or date_key range).  
- **Transform:** Same as daily pipeline (dedup, SCD2 customer at order date, returns for that month).  
- **Load:** Use same idempotent MERGE key (order_id, line_id). Run MERGE for that month only (WHERE date_key IN (...) or order_ts in range). This overwrites/updates only affected rows.  
- **Control table:** Optionally do not advance the normal incremental watermark for that source so the next daily run doesn’t re-extract that month; or run backfill as a one-off and then resume incremental from the watermark.

**3. Semantic metric definitions (gross_revenue, net_revenue)**

- Define in a **metric catalog** or dbt semantic layer, e.g.:  
  - **gross_revenue:** `quantity * unit_price` at order line (before discount and returns).  
  - **net_revenue:** `gross_revenue - discount_amount - return_amount` at order line.  
- Store in a single source of truth (YAML or table) and reference the same definition in pipelines and BI so that any change (e.g. including tax) is done in one place and KPI definitions don’t drift between reports and ETL.
