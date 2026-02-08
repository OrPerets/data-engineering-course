# Topic 04-05 Practice - DWH, ETL, STTM (Solution Key)

## A1. Grain and keys
- `orders_src`: grain = one order version; key = `order_id` with latest by `updated_at`.
- `order_items_src`: grain = one order line version; key = (`order_id`, `line_id`) latest by `updated_at`.
- `products_src`: grain = one product version; key = `product_id` latest by `updated_at`.
- `customers_src`: grain = one customer version; key = `customer_id` latest by `updated_at`.
- `returns_src`: grain = one return event; key = `return_id` (business event-time = `return_ts`, ingestion-time = `ingested_at`).

## A2. Source classification
- Mutable: `orders_src`, `order_items_src`, `products_src`, `customers_src`.
- Append-only/late-arriving: `returns_src` (append, may arrive late).

## A3. Two data quality risks
- Duplicate/multiple versions loaded without deterministic dedup -> double counting.
- Late-arriving returns not backfilled -> overstated net revenue historically.

## A4. Example staging DDL
```sql
CREATE TABLE stg.orders_src (
  order_id BIGINT,
  customer_id BIGINT,
  order_ts TIMESTAMP,
  channel VARCHAR(20),
  order_status VARCHAR(20),
  updated_at TIMESTAMP
);

CREATE TABLE stg.order_items_src (
  order_id BIGINT,
  line_id INT,
  product_id BIGINT,
  quantity INT,
  unit_price DECIMAL(12,2),
  discount_amount DECIMAL(12,2),
  updated_at TIMESTAMP
);
```

---

## B1. Fact grain
One row per `order_id + line_id` at transaction line level (after dedup), linked to date/customer/product/channel dimensions.

## B2. `fact_sales` schema
| column | type | note |
|---|---|---|
| fact_sales_sk | BIGINT | surrogate PK |
| date_key | INT | FK to `dim_date` |
| product_key | BIGINT | FK to `dim_product` |
| customer_key | BIGINT | FK to `dim_customer` (SCD2 version) |
| channel_key | INT | FK to `dim_channel` |
| order_id | BIGINT | degenerate dimension |
| line_id | INT | degenerate dimension |
| quantity | INT | additive |
| gross_revenue | DECIMAL(12,2) | `quantity*unit_price` |
| discount_amount | DECIMAL(12,2) | line discount |
| return_amount | DECIMAL(12,2) | late adjusted |
| net_revenue | DECIMAL(12,2) | gross-discount-return |
| load_ts | TIMESTAMP | audit |

## B3. `dim_customer` (SCD2)
| column | type |
|---|---|
| customer_key | BIGINT |
| customer_id | BIGINT |
| full_name | VARCHAR |
| segment | VARCHAR |
| city | VARCHAR |
| region | VARCHAR |
| valid_from | TIMESTAMP |
| valid_to | TIMESTAMP |
| is_current | BOOLEAN |

## B4. Why not order-level grain
- One order can include multiple products/categories, so category KPIs become ambiguous.
- Returns often happen per line item, so order-level fact cannot represent accurate net revenue corrections.

## B5. Star relationships
`fact_sales(date_key, product_key, customer_key, channel_key) -> dim_date, dim_product, dim_customer, dim_channel`.

---

## C1. ETL steps
1. Extract source deltas by watermark window.
2. Stage raw rows with `run_id`, `ingested_at`, source metadata.
3. Dedup mutable sources by business key + `updated_at` desc.
4. Build conformed dimensions first (`dim_product`, `dim_channel`, `dim_customer` SCD2).
5. Build fact staging by joining orders + lines + dims + returns.
6. Idempotent `MERGE` into target facts.
7. Publish and then advance watermark.

## C2. Control table (minimum)
`job_key, run_id, lower_watermark, upper_bound, status, rows_read, rows_loaded, rows_rejected, started_at, finished_at, error_code`.

## C3. Watermark pseudocode
```text
last_wm = read_last_successful_watermark(job_key)
upper_bound = now_utc() - interval '10 minutes'
extract where updated_at > last_wm and updated_at <= upper_bound
if load_success:
  set watermark = upper_bound
else:
  keep watermark = last_wm
```

## C4. Deterministic dedup
- `customers_src`: keep row with max(`updated_at`), tie-break by max ingest sequence.
- `orders_src`: keep row with max(`updated_at`) per `order_id`.

## C5. STTM sample rows
| target_table | target_column | source_table.source_column | transform_rule | key_type | null_policy |
|---|---|---|---|---|---|
| fact_sales | date_key | orders_src.order_ts | `to_yyyymmdd(order_ts)` | FK | reject |
| fact_sales | product_key | order_items_src.product_id | lookup in `dim_product` | FK | reject |
| fact_sales | customer_key | orders_src.customer_id | SCD2 lookup by `order_ts` between `valid_from/valid_to` | FK | reject |
| fact_sales | channel_key | orders_src.channel | lookup in `dim_channel` | FK | default unknown |
| fact_sales | gross_revenue | order_items_src.quantity, order_items_src.unit_price | `quantity*unit_price` | measure | default 0 |
| fact_sales | discount_amount | order_items_src.discount_amount | `coalesce(discount_amount,0)` | measure | default 0 |
| fact_sales | return_amount | returns_src.return_amount | aggregated by `order_id,line_id` and load window | measure | default 0 |
| fact_sales | net_revenue | derived | `gross_revenue-discount_amount-return_amount` | measure | reject if < -1e6 |

## C6. MERGE skeleton
```sql
MERGE INTO dwh.fact_sales t
USING stg.fact_sales_ready s
ON t.order_id = s.order_id AND t.line_id = s.line_id
WHEN MATCHED THEN UPDATE SET
  date_key = s.date_key,
  product_key = s.product_key,
  customer_key = s.customer_key,
  channel_key = s.channel_key,
  quantity = s.quantity,
  gross_revenue = s.gross_revenue,
  discount_amount = s.discount_amount,
  return_amount = s.return_amount,
  net_revenue = s.net_revenue,
  load_ts = current_timestamp
WHEN NOT MATCHED THEN INSERT (
  fact_sales_sk, date_key, product_key, customer_key, channel_key,
  order_id, line_id, quantity, gross_revenue, discount_amount,
  return_amount, net_revenue, load_ts
) VALUES (
  s.fact_sales_sk, s.date_key, s.product_key, s.customer_key, s.channel_key,
  s.order_id, s.line_id, s.quantity, s.gross_revenue, s.discount_amount,
  s.return_amount, s.net_revenue, current_timestamp
);
```

## C7. Late returns handling
- Keep 72-hour backfill window.
- Recompute affected fact partitions by `return_ts` date.
- Ensure rerun idempotency by replacing same logical keys.

---

## D1. Query sketches
```sql
-- 1) Daily net revenue by region/category
SELECT d.date, c.region, p.category, SUM(f.net_revenue) AS net_rev
FROM dwh.fact_sales f
JOIN dwh.dim_date d ON f.date_key = d.date_key
JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
JOIN dwh.dim_product p ON f.product_key = p.product_key
WHERE d.date BETWEEN DATE '2025-06-01' AND DATE '2025-06-30'
GROUP BY d.date, c.region, p.category;

-- 2) Weekly fulfillment rate by channel
SELECT d.year, d.week_of_year, ch.channel_name,
       SUM(CASE WHEN f.net_revenue > 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) AS fulfillment_rate
FROM dwh.fact_sales f
JOIN dwh.dim_date d ON f.date_key = d.date_key
JOIN dwh.dim_channel ch ON f.channel_key = ch.channel_key
WHERE d.date BETWEEN DATE '2025-06-01' AND DATE '2025-06-30'
GROUP BY d.year, d.week_of_year, ch.channel_name;

-- 3) Monthly net revenue by segment
SELECT d.year, d.month, c.segment, SUM(f.net_revenue) AS net_rev
FROM dwh.fact_sales f
JOIN dwh.dim_date d ON f.date_key = d.date_key
JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
GROUP BY d.year, d.month, c.segment;
```

## D2. Performance and correctness notes
- Partition fact by `date_key`; always filter dates for pruning.
- Anti-pattern: dashboard queries without date predicate.
- SCD2 join must align event time to customer validity window, otherwise historical segment KPI is wrong.
- Monitoring: bytes scanned/query, freshness lag, DLQ rate, merge conflicts.
