# Week 14: Course Review and Exam Preparation — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Use concrete data (tables, keys, sample rows) in every answer
- For SQL: write full solutions in fenced SQL blocks
- For MapReduce: show map emits, shuffle groups, reduce outputs explicitly
- For cost: state assumptions and formula before computing

## Data Context (MANDATORY)
- **raw_events** (staging): event_id INT, user_id INT, event_type VARCHAR, event_timestamp VARCHAR, details JSON. Keys: none (append-only). Sample: (1,101,'click','2025/12/01 08:00:00','{}'), (2,102,'view','2025-12-01T09:00:00','{}'), (1,101,'click','2025/12/01 08:00:00','{}'). ~100M rows/day.
- **events_clean** (target): event_id INT PK, user_id INT, event_type VARCHAR, event_time TIMESTAMP, details JSON. One row per event_id. Partitioned by date(event_time). ~1B rows.
- **dim_customer**: customer_id INT PK, name VARCHAR, region VARCHAR. Sample: (1,'Alice','North'), (2,'Bob','East'). ~10K rows.
- **dim_product**: product_id INT PK, name VARCHAR, category VARCHAR. Sample: (101,'Shirt','Clothing'), (102,'Mug','Home'). ~1K rows.
- **sales_fact**: sale_id BIGINT PK, customer_id INT FK, product_id INT FK, quantity INT, unit_price DECIMAL(10,2), date_key INT (YYYYMMDD). Sample: (1001,1,101,2,9.99,20251201), (1002,2,102,1,12.00,20251201). ~10M rows/year; partitioned by date_key. Access: BI queries filter by date_key and join to dims.
- **MapReduce input (word count):** 4 lines: line 1 "a b a", line 2 "b a c", line 3 "a c", line 4 "b b a". Then skew variant: 10 lines where word "the" appears 50 times total, others 1–2 each.

## Reference Exercises Used (Root)
- exercises1.md: SQL joins/aggregations (revenue by region), ETL dedup/MERGE, batch ingestion, incremental load (watermark, idempotency), MapReduce word count and sales-by-product walkthrough, failure/reprocessing (partition resume, exactly-once)
- exercises2.md: Banking ledger schema and window functions, idempotent MERGE and ROW_NUMBER dedup, MapReduce inverted index and skew salting, ingestion DLQ and watermark with buffer, SCD Type 2 and surrogate keys

## Diagram Manifest
- Slide 18 → week14_practice_slide18_reasoning_pipeline_choice.puml → Reasoning: ETL vs ELT and when to use MERGE vs partition overwrite

## Warm-up Exercises
- 3–5 short exercises; each on its own slide below
- Use Data Context tables and sample rows in answers
- Full solutions follow in Solutions section

## W1
- List the partition key of sales_fact
- List the primary key of sales_fact
- Why must BI queries include a filter on date_key?

## W2
- How many rows in raw_events sample have event_id = 1?
- After dedup by event_id (keep earliest event_timestamp), how many rows for event_id = 1?
- What does idempotent rerun require for this load?

## W3
- After map emits (word, 1) for the 4 lines, how many pairs does key "a" receive at shuffle?
- What is the reduce output for "a"?
- How many distinct keys are there after map?

## W4
- Write one SQL statement: update the watermark to '2025-12-01 12:00:00' for key 'events_sync'
- Assume table etl_state(key, val)
- One line only

## W5
- Name one failure mode in ingestion (e.g. duplicate on rerun)
- Name one failure mode in MapReduce (e.g. skew)
- Name one failure mode in DWH (e.g. full scan)

## Engineering Exercises
- 3–6 exercises; numeric assumptions and cost reasoning; each on its own slide below
- Include SQL/ETL, MapReduce trace, DWH query, and cost estimate
- Full solutions with assumptions and check follow in Solutions section

## E1 (SQL/ETL)
- Filter raw_events: event_type IN ('click','view','purchase'); cast event_timestamp to TIMESTAMP
- Deduplicate by event_id (keep earliest event_timestamp per event_id)
- Write full SQL: CTE for dedup + MERGE into events_clean ON event_id; MERGE only when source newer than target last_updated_ts

## E2 (Incremental + idempotency)
- Job loads 2025-12-01 and 2025-12-02; fails after writing 2025-12-01. How to rerun without duplicating 2025-12-01?
- Use watermark or partition list to track progress
- Give pseudocode or bullet steps for resume logic

## E3 (MapReduce)
- Write map outputs (key, value) for each of the 4 lines (exact strings "a", "b", "c")
- Write shuffle groups: key → list of values
- Write reduce outputs: (word, count) for each key

## E4 (Skew)
- What failure can occur when one reducer gets 50 values for "the" and others get 1–3?
- Propose combiner: what does it do and how does it help?
- Propose salting: one sentence on how it distributes load

## E5 (DWH)
- Query: total revenue (quantity * unit_price) by region for December 2025
- Join sales_fact to dim_customer; filter date_key between 20251201 and 20251231
- State why partition pruning applies

## E6 (Cost)
- With filter date_key IN (20251201, 20251202): how many rows scanned? (2 partitions × ~27K)
- Without date filter: how many rows scanned? (10M)
- What is the reduction factor from pruning?

## Challenge Exercise
- **C1 (Multi-part):** (a) Design a minimal pipeline (extract → staging → load) so that daily raw_events are loaded into events_clean and rerun never duplicates. State: how you track progress (watermark or partition list), how you dedup, and how you write (MERGE or partition overwrite). (b) Draw or reference a diagram that shows the decision: when to use MERGE vs partition overwrite (one sentence per branch). Diagram: week14_practice_slide18_reasoning_pipeline_choice.puml

## Solutions

## Solution W1
- **Partition key:** date_key. **Primary key:** sale_id.
- **Why filter:** Without date_key filter, the query scans all partitions (full table scan). With filter, only matching partitions are read; otherwise 10M+ rows and timeout.

## Solution W2
- **Before dedup:** 2 rows have event_id = 1 (duplicate timestamps).
- **After dedup (earliest event_timestamp):** 1 row for event_id = 1 (keep one, e.g. '2025/12/01 08:00:00').

## Solution W3
- **Map:** Line 1: (a,1),(b,1),(a,1); Line 2: (b,1),(a,1),(c,1); Line 3: (a,1),(c,1); Line 4: (b,1),(b,1),(a,1).
- **Shuffle for "a":** [1,1,1,1,1] (five 1s).
- **Reduce output for "a":** ("a", 5).

## Solution W4
- **Assumption:** Table name etl_state(key VARCHAR, val TIMESTAMP).
- **SQL:** `UPDATE etl_state SET val = '2025-12-01 12:00:00' WHERE key = 'events_sync';`

## Solution W5
- **Ingestion:** Duplicate on rerun (no MERGE/watermark).
- **MapReduce:** Skew — one key has most values ⇒ one reducer OOM or straggler.
- **DWH:** Full scan (no partition filter) ⇒ timeout.

## Solution E1
- **Assumptions:** events_clean has (event_id PK, user_id, event_type, event_time, details, last_updated_ts). raw_events has event_timestamp as string.
- **Plan:** Filter types; dedup by event_id with ROW_NUMBER; MERGE on event_id; UPDATE only when source event_timestamp > target last_updated_ts.

```sql
WITH filtered AS (
  SELECT event_id, user_id, event_type,
         CAST(event_timestamp AS TIMESTAMP) AS event_time, details
  FROM raw_events
  WHERE event_type IN ('click','view','purchase')
),
deduped AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp) AS rn
  FROM filtered
),
src AS (
  SELECT event_id, user_id, event_type, event_time, details, event_timestamp
  FROM deduped WHERE rn = 1
)
MERGE INTO events_clean AS t
USING src AS s ON t.event_id = s.event_id
WHEN MATCHED AND s.event_timestamp > t.last_updated_ts THEN
  UPDATE SET user_id = s.user_id, event_type = s.event_type, event_time = s.event_time, details = s.details, last_updated_ts = s.event_timestamp
WHEN NOT MATCHED THEN
  INSERT (event_id, user_id, event_type, event_time, details, last_updated_ts)
  VALUES (s.event_id, s.user_id, s.event_type, s.event_time, s.details, s.event_timestamp);
```

- **Check:** Rerun with same raw_events leaves events_clean unchanged (idempotent).

## Solution E2
- **Assumptions:** Partitions = date (2025-12-01, 2025-12-02). Watermark stored in etl_state.
- **Plan:** (1) Read watermark (e.g. NULL or last successful date). (2) For each date in [2025-12-01, 2025-12-02]: if date > watermark, load that date’s raw_events into events_clean (dedup + MERGE). (3) After successful load for a date, set watermark = that date (or max(watermark, date)). (4) On rerun, skip dates ≤ watermark.
- **Pseudocode:** `for d in [2025-12-01, 2025-12-02]: if d > watermark: load(d); watermark = d`. After failure, watermark = 2025-12-01; rerun processes only 2025-12-02; no duplicate for 2025-12-01.

## Solution E3
- **Map outputs:** R1: (a,1),(b,1),(a,1). R2: (b,1),(a,1),(c,1). R3: (a,1),(c,1). R4: (b,1),(b,1),(a,1).
- **Shuffle:** a→[1,1,1,1,1], b→[1,1,1,1], c→[1,1].
- **Reduce:** (a,5), (b,4), (c,2).

## Solution E4
- **Failure:** One reducer gets 50 values for "the" ⇒ high memory or straggler; others finish early. Risk: OOM or timeout.
- **Combiner:** Locally sum (the, 1)s on map side → emit (the, 50) once per map task; reduces bytes to shuffle.
- **Salting:** Emit (the_1, 1), (the_2, 1), … (the_N, 1) with random suffix; N reducers get a share; then sum the_* in a second job or in application.

## Solution E5
- **Partition pruning:** WHERE date_key BETWEEN 20251201 AND 20251231 limits scan to December 2025 partitions only.

```sql
SELECT c.region, SUM(f.quantity * f.unit_price) AS total_revenue
FROM sales_fact f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.date_key BETWEEN 20251201 AND 20251231
GROUP BY c.region;
```

- **Check:** Only fact rows in December partitions are read; join to small dim_customer.

## Solution E6
- **With filter (2 days):** 2 partitions × ~27K ≈ 54K rows scanned.
- **Without filter:** All partitions ⇒ 10M rows scanned. Pruning reduces I/O by ~185×.

## Solution C1
- **(a) Minimal pipeline:** (1) **Progress:** Watermark (max event_timestamp or max date_key) in etl_state; or list of loaded dates. (2) **Extract:** raw_events WHERE event_timestamp > watermark AND event_timestamp <= upper_bound (e.g. NOW() − 5 min). (3) **Dedup:** ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp); keep rn = 1. (4) **Write:** MERGE into events_clean ON event_id (idempotent). Rerun: same watermark until run succeeds; then advance watermark; next run skips already-loaded data.
- **(b) MERGE vs partition overwrite:** Use **MERGE** when the same business key (e.g. event_id) can arrive in multiple runs or late; need row-level upsert and no duplicate keys. Use **partition overwrite** when each run reloads a full partition (e.g. one day) and never mixes old and new in the same partition; simpler but only idempotent at partition level.
- Diagram: week14_practice_slide18_reasoning_pipeline_choice.puml
