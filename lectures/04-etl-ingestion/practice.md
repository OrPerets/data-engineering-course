# Week 4: Data Ingestion and ETL Pipelines — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Incremental load: use watermark or CDC; ensure idempotent rerun
- Failure scenario: rerun must not duplicate results

## Data Context (MANDATORY)

### Tables and schemas

**raw_events** (staging / append-only logs):
- `event_id INT`, `user_id INT`, `event_type VARCHAR`, `event_timestamp VARCHAR`, `details JSON`
- Sample: (1, 101, 'click', '2025/12/01 08:00:00', '{"page":"home"}'); (2, 102, 'view', '2025-12-01T09:30:00', '{"page":"product"}'); (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id (business key); no PK; duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day)

**events_clean** (target):
- `event_id INT PRIMARY KEY`, `user_id INT`, `event_type VARCHAR`, `event_time TIMESTAMP`, `details JSON`
- Sample: (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id; one row per event
- Scale: ~1B rows total (100 GB)

**daily_sales** (CSV / staging):
- `sale_id INT`, `product_id INT`, `sale_date DATE`, `quantity INT`, `amount FLOAT`
- Sample: (1001, 500, '2025-12-01', 2, 19.98), (1002, 501, '2025-12-01', 1, 9.99), (1001, 500, '2025-12-01', 2, 19.98)
- Keys: sale_id (business key); duplicates possible in file
- Scale: ~5M rows/day (500 MB)

**sales** (target):
- `sale_id INT PRIMARY KEY`, `product_id INT`, `sale_date DATE`, `quantity INT`, `amount FLOAT`
- Sample: (1000, 499, '2025-11-30', 5, 49.95)
- Keys: sale_id; one row per sale
- Scale: ~100M rows

**etl_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_watermark TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('events_sync', '2025-12-01 08:00:00', '2025-12-02 06:00:00')
- Used for incremental load watermark

### Access patterns
- raw_events: read by date partition; append-only
- events_clean: read by event_id (MERGE); query by user_id, event_time
- daily_sales: bulk read; load into sales with upsert
- sales: read by sale_date (partition pruning)

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw_events → events_clean, dedup, MERGE, incremental); Batch Data Ingestion (daily_sales → sales, staging, upsert); Incremental (daily_updates → products, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun).
- exercises2.md: Module 3 Robust Data Ingestion (Schema-on-Read, watermarking, DLQ); Robust Batch Ingestion (staging, valid/invalid split); Incremental Loading and High-Water Marking (safety buffer, CDC).

## Diagram Manifest
- Slide 18 → week4_practice_slide18_incremental_rerun.puml → incremental load and idempotent rerun flow

## Warm-up Exercises

## Exercise 1
List the **three phases** of ETL in order. In one sentence, what is the main difference between ETL and ELT?

## Exercise 2
Define **idempotency** for a data load job in one sentence. Why is it important when a job is re-run after a failure?

## Exercise 3
What is a **watermark** in incremental load? In one sentence, what happens to the watermark if the load job fails before completing the write?

## Exercise 4
**raw_events** has two rows with event_id = 1 (duplicate). Before loading into **events_clean**, how do you keep exactly one row per event_id? Name the SQL pattern (e.g. window function).

## Exercise 5
A job loads partitions 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-02. On re-run, should the job process 2025-12-01 and 2025-12-02 again? One sentence.

## Engineering Exercises

## Exercise 6
**Transform and load (initial):** Write SQL to load from **raw_events** into **events_clean**:
- Filter event_type IN ('click', 'view', 'purchase')
- Normalize event_timestamp to TIMESTAMP (event_time)
- Deduplicate by event_id (keep one row per event_id, e.g. earliest event_time)
- Insert into events_clean. Use a single statement (CTE + MERGE or INSERT ... ON CONFLICT).

## Exercise 7
**Incremental load with watermark:** Assume raw_events is partitioned by date and we have **etl_control** with job_key = 'events_sync'. Write pseudocode or SQL steps to:
- Read last_watermark from etl_control
- Extract from raw_events where event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'
- Apply same transform/dedup as Exercise 6; MERGE into events_clean
- Update etl_control last_watermark only after successful load. Why the 5-minute buffer?

## Exercise 8
**Batch ingestion with upsert:** Load **daily_sales** (with possible duplicate sale_id in file and possible overlap with existing **sales** rows) into **sales**. Requirements:
- Deduplicate within daily_sales (one row per sale_id; e.g. keep latest by sale_date)
- Insert new sale_id; update existing sale_id if daily_sales has newer data (upsert by sale_id)
- Write the MERGE (or INSERT ... ON CONFLICT) statement. Assume sale_id is PRIMARY KEY in sales.

## Exercise 9
**Failure and rerun:** The incremental job for events runs for 2025-12-01, 2025-12-02, 2025-12-03. It fails after successfully writing 2025-12-01 and 2025-12-02 to events_clean (watermark updated for 12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is loaded, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 10
**Cost:** Assume raw_events has 100M rows/day; each row ~100 B. Staging holds one day. (a) Staging size in GB? (b) If MERGE does a full scan of events_clean (1B rows) to match keys, why is that expensive? (c) What index or design reduces that cost? One sentence each.

## Challenge Exercise

## Challenge: Incremental pipeline design and diagram

**Setup:** Same raw_events → events_clean pipeline. Job runs every 15 minutes. Source can have late-arriving events (event_time up to 10 minutes in the past).

**Part 1 — Watermark and buffer**
- (a) Where do you store the watermark (table name and column)?
- (b) Why use upper_bound = NOW() - 10 minutes instead of NOW() when reading raw_events?
- (c) If the job fails after writing to events_clean but before updating the watermark, what happens on the next run? One sentence.

**Part 2 — Idempotency**
- (a) Why is MERGE (or ON CONFLICT DO NOTHING) required for idempotency when the same slice might be read again?
- (b) Give one scenario (e.g. duplicate in source, or re-delivered file) where the same event_id is processed twice. How does MERGE prevent duplicate rows in events_clean?

**Part 3 — Diagram**
- Reference the diagram that shows: read watermark → extract slice → transform → MERGE target → update watermark. What is the purpose of updating the watermark only after success?

## Incremental and rerun flow (diagram)
- Flow: control table (watermark) → read source slice → transform/dedup → MERGE target → update watermark after success.
- Rerun: same slice re-read if watermark not updated; MERGE ensures no duplicates.
- Diagram: week4_practice_slide18_incremental_rerun.puml

## Solutions

## Solution 1
**ETL:** Extract → Transform → Load. **ELT:** Extract → Load (raw into store) → Transform (in place, e.g. SQL). Difference: ELT defers transformation to the load environment (e.g. DWH); scales with engine and avoids moving transformed data over the wire.

## Solution 2
**Idempotency:** Running the job N times (N ≥ 1) yields the same result as running it once. Important on re-run: if the job fails mid-way, re-running should not insert duplicate rows or overwrite with stale data; MERGE/ON CONFLICT and watermark make reruns safe.

## Solution 3
**Watermark:** A stored value (e.g. last_loaded_at or max(modified_at)) that marks the upper bound of data already loaded. If the job fails before completing the write, the watermark is not updated, so the next run re-reads the same slice; with idempotent write (MERGE), no duplicates.

## Solution 4
Use **ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time)** and keep rows where rn = 1. That keeps one row per event_id (e.g. earliest event_time).

## Solution 5
No. The job should only process 2025-12-03 (and update watermark for 12-03). 2025-12-01 and 2025-12-02 are already in the target; re-processing them would require idempotent write (MERGE) so that no duplicate rows are inserted; ideally skip them via partition tracking.

## Solution 6
**Assumptions:** event_timestamp parseable to TIMESTAMP; event_id business key. **Plan:** Filter types, cast timestamp, dedup by event_id, MERGE into events_clean.

```sql
WITH filtered AS (
  SELECT event_id, user_id, event_type,
         CAST(event_timestamp AS TIMESTAMP) AS event_time,
         details
  FROM raw_events
  WHERE event_type IN ('click', 'view', 'purchase')
    AND event_timestamp IS NOT NULL
),
deduped AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
  FROM filtered
),
to_load AS (
  SELECT event_id, user_id, event_type, event_time, details
  FROM deduped
  WHERE rn = 1
)
MERGE INTO events_clean AS target
USING to_load AS src
ON target.event_id = src.event_id
WHEN NOT MATCHED THEN
  INSERT (event_id, user_id, event_type, event_time, details)
  VALUES (src.event_id, src.user_id, src.event_type, src.event_time, src.details);
```

**Check:** No duplicate event_id in events_clean; rerun with same raw_events changes nothing (idempotent).

## Solution 7
**Steps:**
1. `SELECT last_watermark FROM etl_control WHERE job_key = 'events_sync';`
2. `upper_bound = NOW() - INTERVAL '5 minutes';`
3. Extract: `SELECT * FROM raw_events WHERE event_time > last_watermark AND event_time <= upper_bound;` (same filter/dedup as Ex 6).
4. MERGE into events_clean (same as Ex 6).
5. In same transaction: `UPDATE etl_control SET last_watermark = upper_bound, last_run_ts = NOW() WHERE job_key = 'events_sync';` only after step 4 commits.

**5-minute buffer:** Transactions in the source may commit slightly after event_time; reading up to NOW() could miss rows that commit just after the query runs. Upper bound in the past ensures committed rows are included; trade latency for consistency.

## Solution 8
**Assumptions:** sale_id PRIMARY KEY in sales; one row per sale_id in result; "newer" = later sale_date or later ingestion order.

```sql
WITH deduped_staging AS (
  SELECT sale_id, product_id, sale_date, quantity, amount,
         ROW_NUMBER() OVER (PARTITION BY sale_id ORDER BY sale_date DESC) AS rn
  FROM daily_sales
),
to_upsert AS (
  SELECT sale_id, product_id, sale_date, quantity, amount
  FROM deduped_staging
  WHERE rn = 1
)
MERGE INTO sales AS target
USING to_upsert AS src
ON target.sale_id = src.sale_id
WHEN MATCHED AND src.sale_date >= target.sale_date THEN
  UPDATE SET product_id = src.product_id, sale_date = src.sale_date, quantity = src.quantity, amount = src.amount
WHEN NOT MATCHED THEN
  INSERT (sale_id, product_id, sale_date, quantity, amount)
  VALUES (src.sale_id, src.product_id, src.sale_date, src.quantity, src.amount);
```

**Check:** One row per sale_id in sales; re-run with same daily_sales yields same state (idempotent).

## Solution 9
- (a) Next run reads watermark = 2025-12-02 (or max loaded partition); extract slice includes 2025-12-03 only (or process only partition 2025-12-03).
- (b) Do not re-insert 2025-12-01 and 2025-12-02: use partition-level tracking (skip completed partitions) or rely on MERGE: rows for 12-01 and 12-02 already in target, so MERGE WHEN NOT MATCHED does not fire for them; no duplicates.
- (c) Update watermark (or mark partition 2025-12-03 completed) only after 2025-12-03 is successfully written; if this run fails, next run still sees 12-03 as unprocessed.

## Solution 10
- (a) 100M × 100 B = 10^10 B = 10 GB staging (one day).
- (b) Full scan of 1B rows to match keys: O(target size); high I/O and CPU; long runtime.
- (c) Index on events_clean(event_id) (or PK): MERGE join uses index lookup per source row; cost ≈ O(source rows × log(target rows)) instead of full scan.

## Solution: Challenge Part 1
- (a) **etl_control** table; columns e.g. job_key, last_watermark (TIMESTAMP), last_run_ts.
- (b) Late-arriving events: if we read up to NOW(), we might read rows that are not yet committed or that will be corrected; upper_bound = NOW() - 10 min gives a safety buffer so committed/corrected data is included; avoids missing or double-counting late events.
- (c) Next run re-reads the same slice (watermark unchanged); MERGE ensures no duplicate rows; load is effectively retried until success, then watermark advances.

## Solution: Challenge Part 2
- (a) If the same slice is read again (e.g. after failure before watermark update), INSERT would duplicate rows. MERGE (or ON CONFLICT DO NOTHING) ensures existing keys are not inserted again, so rerun is idempotent.
- (b) Scenario: upstream retries and sends the same batch twice, or the same file is re-delivered. Same event_id appears in the slice twice (or in two runs). MERGE ON event_id: first time INSERT, second time MATCHED so no second INSERT; events_clean has one row per event_id.

## Solution: Challenge Part 3
**Diagram:** week4_practice_slide18_incremental_rerun.puml. **Purpose of updating watermark only after success:** If we updated before write and the write then failed, the next run would skip that slice (watermark already advanced), so data would be lost. Updating after success ensures we only advance when data is safely in the target; on failure, watermark stays, next run retries the same slice and MERGE avoids duplicates.
