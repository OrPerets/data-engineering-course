# Week 12: Advanced Feature Engineering Pipelines — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Feature pipelines: multi-step (entity features → join → derived); point-in-time; idempotent write
- Backfill vs incremental: control table, partition overwrite; rerun must not duplicate

## Data Context (MANDATORY)

### Tables and schemas

**events** (raw user–item activity; append-only):
- `event_id INT`, `user_id INT`, `item_id INT`, `event_ts TIMESTAMP`, `event_type VARCHAR(20)`
- Sample: (1, 101, 201, '2025-12-01 10:00:00', 'click'), (2, 101, 201, '2025-12-02 14:00:00', 'view'), (3, 102, 201, '2025-12-01 09:00:00', 'click'), (4, 101, 202, '2025-12-03 08:00:00', 'click'), (5, 102, 201, '2025-12-02 11:00:00', 'view')
- Keys: event_id (business); duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day); partitioned by date(event_ts)

**users** (dimension):
- `user_id INT PRIMARY KEY`, `signup_ts TIMESTAMP`, `region VARCHAR(20)`
- Sample: (101, '2025-01-15 00:00:00', 'North'), (102, '2025-02-01 00:00:00', 'South')
- Scale: ~10M rows (100 MB)

**items** (dimension):
- `item_id INT PRIMARY KEY`, `created_ts TIMESTAMP`, `category VARCHAR(20)`
- Sample: (201, '2025-01-01 00:00:00', 'A'), (202, '2025-01-10 00:00:00', 'B')
- Scale: ~1M rows (10 MB)

**feature_table** (target; user–item features):
- `user_id INT`, `item_id INT`, `as_of_ts TIMESTAMP`, `clicks_7d INT`, `views_7d INT`, `impressions_7d INT`, `ctr_7d FLOAT`
- Keys: (user_id, item_id, as_of_ts) — primary or overwrite key; one row per key
- Scale: ~10M users × 1M items × 365 days → store only observed (user, item) per as_of_ts; ~50B rows if full grid; ~1B if observed pairs
- Partitioned by as_of_ts (e.g. by month)

**feature_job_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_as_of_ts TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('user_item_features_daily', '2025-12-02 23:59:59', '2025-12-03 06:00:00')
- Used for incremental: watermark on as_of_ts

### Access patterns
- events: read by date partition; filter event_ts <= as_of_ts for point-in-time
- feature_table: read by (user_id, item_id, as_of_ts) or as_of_ts range; write by MERGE or partition overwrite on (user_id, item_id, as_of_ts)
- users, items: read for point-in-time join (signup_ts, created_ts <= as_of_ts)

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw → clean, dedup, MERGE); Incremental (watermark, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun)
- exercises2.md: Module 1 (window functions, idempotent pipelines, SCD); Module 3 (watermarking, incremental load, safety buffer)

## Diagram Manifest
- Slide 22 → week12_practice_slide22_backfill_reasoning.puml → backfill vs incremental decision and idempotent write

## Warm-up Exercises

## Exercise 1
Define **backfill** vs **incremental** in one sentence each. When would you use backfill?

## Exercise 2
What is the **write key** for a user–item feature table that supports training and serving? Why must overlapping backfill jobs not both use INSERT?

## Exercise 3
In a multi-step pipeline (user features → item features → join → derived → write), why must entity features be computed **before** the join?

## Exercise 4
For **incremental** run: control table has last_as_of_ts = '2025-12-02 23:59:59'. Which as_of_ts should the next run compute? One sentence.

## Exercise 5
Two backfill jobs run: Job A writes as_of_ts in [2025-12-01, 2025-12-05]; Job B writes [2025-12-03, 2025-12-07]. Both use plain INSERT. What goes wrong?

## Engineering Exercises

## Exercise 6
**Point-in-time user–item features:** Write SQL to compute `clicks_7d`, `views_7d`, `impressions_7d` per (user_id, item_id, as_of_ts) for as_of_ts = '2025-12-02 23:59:59' and '2025-12-03 23:59:59'. Use only events with event_ts <= as_of_ts AND event_ts > as_of_ts - INTERVAL '7 days'. Build grid from distinct (user_id, item_id) in events in that window. Output: user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d.

## Exercise 7
**Derived feature and MERGE:** From the result of Exercise 6, add derived column `ctr_7d = clicks_7d / NULLIF(impressions_7d, 0)`. Write MERGE (or INSERT ... ON CONFLICT) into **feature_table** with key (user_id, item_id, as_of_ts). On conflict, update all feature columns. Re-running must not duplicate rows.

## Exercise 8
**Incremental feature job:** Assume **feature_job_control** has job_key = 'user_item_features_daily'. Describe in 4 bullets: (a) read last_as_of_ts from control; (b) compute features only for as_of_ts = last_as_of_ts + 1 day; (c) MERGE into feature_table for that as_of_ts; (d) update control (last_as_of_ts, last_run_ts) only after successful write. Why update control only after success?

## Exercise 9
**Cost:** Assume 10M users, 1M items, 365 as_of_ts, 60 bytes per row. (a) Full grid size in GB. (b) If we store only observed (user_id, item_id) per as_of_ts and average 5M pairs per day, approximate feature table size in GB. (c) How does partitioning by as_of_ts (by month) reduce scan for training reading one month?

## Exercise 10
**Failure and rerun:** Feature job runs for as_of_ts = 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-01 and 2025-12-02 (control updated to 2025-12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is computed and written, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 11
**Join size reasoning:** Full grid (all users × all items × 365 as_of_ts) is infeasible. Give the SQL pattern to build a grid of only (user_id, item_id) that appear in **events** in the last 7 days for a given as_of_ts. One short query or pseudocode.

## Challenge Exercise

## Exercise 12 (Multi-part)
- **(a)** Draw or reference a diagram of backfill vs incremental: control table, watermark, partition overwrite; idempotent write. Diagram: week12_practice_slide22_backfill_reasoning.puml
- **(b)** Explain why two overlapping backfill jobs (e.g. both writing 2025-12-03) with INSERT cause duplicate rows. How does partition overwrite or MERGE fix it?
- **(c)** If the feature job updates the control table **before** writing to feature_table and the write fails, what happens on the next run? How do you fix it?

## Solutions

## Solution 1
- **Backfill:** Compute features for a range of as_of_ts (e.g. full history or [d_start, d_end]); used for one-time load or repair.
- **Incremental:** Compute only new as_of_ts (e.g. last_as_of_ts + 1 day); used for daily pipeline; watermark in control table.
- **When backfill:** New feature definition; historical repair; new entity set; full retrain.

## Solution 2
- **Write key:** (user_id, item_id, as_of_ts).
- **Overlapping INSERT:** If two jobs both INSERT for the same (user_id, item_id, as_of_ts), the table gets two rows per key; training and joins double-count or are ambiguous. Use MERGE or partition overwrite so the second write replaces the same key (idempotent).

## Solution 3
- Join needs **entity-level features** (e.g. user clicks_7d, item impressions_7d) as inputs. Computing entity features first gives one row per (user_id, as_of_ts) and (item_id, as_of_ts); the join then combines them on the grid (user_id, item_id, as_of_ts). Order: entity features → join → derived → write.

## Solution 4
- Next run should compute as_of_ts = last_as_of_ts + 1 day = '2025-12-03 23:59:59' (or the next calendar day end). Only one new as_of_ts for incremental.

## Solution 5
- **Wrong:** Overlap days 2025-12-03, 2025-12-04, 2025-12-05 get written by both jobs. With INSERT, feature_table has duplicate rows for those (user_id, item_id, as_of_ts); training and metrics are wrong. Fix: MERGE or partition overwrite so each partition is written by one job and rerun overwrites same key.

## Solution 6
- **Assumptions:** events table; as_of_ts in a small set (2 dates); grid = distinct (user_id, item_id) from events in 7d window per as_of_ts.

```sql
WITH as_of_dates AS (
  SELECT TIMESTAMP '2025-12-02 23:59:59' AS as_of_ts
  UNION ALL SELECT TIMESTAMP '2025-12-03 23:59:59'
),
grid AS (
  SELECT DISTINCT e.user_id, e.item_id, d.as_of_ts
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
),
counts AS (
  SELECT e.user_id, e.item_id, d.as_of_ts,
         SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicks_7d,
         SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) AS views_7d,
         COUNT(*) AS impressions_7d
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
  GROUP BY e.user_id, e.item_id, d.as_of_ts
)
SELECT g.user_id, g.item_id, g.as_of_ts,
       COALESCE(c.clicks_7d, 0) AS clicks_7d,
       COALESCE(c.views_7d, 0) AS views_7d,
       COALESCE(c.impressions_7d, 0) AS impressions_7d
FROM grid g
LEFT JOIN counts c ON g.user_id = c.user_id AND g.item_id = c.item_id AND g.as_of_ts = c.as_of_ts;
```

- **Check:** No event with event_ts > as_of_ts; grid from observed pairs only; correct 7-day window.

## Solution 7
- **Plan:** Assume CTE `feature_rows` has (user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d); add ctr_7d = clicks_7d / NULLIF(impressions_7d, 0). MERGE into feature_table on (user_id, item_id, as_of_ts); WHEN MATCHED UPDATE all columns; WHEN NOT MATCHED INSERT.

```sql
WITH feature_rows AS (
  SELECT user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d,
         clicks_7d::FLOAT / NULLIF(impressions_7d, 0) AS ctr_7d
  FROM ( ... )  -- output of Solution 6 query
)
MERGE INTO feature_table AS target
USING feature_rows AS source
ON target.user_id = source.user_id
   AND target.item_id = source.item_id
   AND target.as_of_ts = source.as_of_ts
WHEN MATCHED THEN
  UPDATE SET clicks_7d = source.clicks_7d, views_7d = source.views_7d,
              impressions_7d = source.impressions_7d, ctr_7d = source.ctr_7d
WHEN NOT MATCHED THEN
  INSERT (user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d, ctr_7d)
  VALUES (source.user_id, source.item_id, source.as_of_ts, source.clicks_7d, source.views_7d,
          source.impressions_7d, source.ctr_7d);
```

- **Check:** Re-running with same feature_rows leaves one row per (user_id, item_id, as_of_ts); idempotent.

## Solution 8
- **(a)** SELECT last_as_of_ts FROM feature_job_control WHERE job_key = 'user_item_features_daily'.
- **(b)** Compute features for as_of_ts = last_as_of_ts + 1 day only (e.g. one new day).
- **(c)** MERGE into feature_table for rows with that as_of_ts (or overwrite partition for that as_of_ts).
- **(d)** UPDATE feature_job_control SET last_as_of_ts = new_as_of_ts, last_run_ts = NOW() WHERE job_key = 'user_item_features_daily', only after MERGE/write succeeds.
- **Why after success:** If we update control before write and write fails, next run would skip that as_of_ts and leave a gap; updating after success ensures we only advance when data is written.

## Solution 9
- **(a)** Full grid: 10M × 1M × 365 × 60 B = 219e15 B ≈ 219 PB (infeasible).
- **(b)** Observed pairs: 5M pairs/day × 365 days × 60 B = 109.5e9 B ≈ 109.5 GB (feasible).
- **(c)** Partitioning by month: training reading one month (e.g. December) scans only December partition; instead of full table, scan ~1/12 of rows; partition pruning reduces I/O and cost.

## Solution 10
- **(a)** Next run reads last_as_of_ts = 2025-12-02; compute features for as_of_ts = 2025-12-03 only; MERGE into feature_table; update control to 2025-12-03.
- **(b)** Do not recompute or re-insert 2025-12-01 and 2025-12-02; MERGE on (user_id, item_id, as_of_ts) ensures re-run of same day overwrites; incremental only adds new as_of_ts.
- **(c)** Track only last_as_of_ts so we only add new days; idempotent write so partial re-run does not duplicate.

## Solution 11
- **Pattern:** Restrict grid to (user_id, item_id) that appear in events in the 7-day window for each as_of_ts.

```sql
SELECT DISTINCT user_id, item_id
FROM events
WHERE event_ts <= :as_of_ts
  AND event_ts > :as_of_ts - INTERVAL '7 days';
```

- Then cross join with as_of_ts (or with a small as_of_dates table). This keeps grid size bounded by observed pairs, not full Cartesian product.

## Solution 12
- **(a)** Diagram: week12_practice_slide22_backfill_reasoning.puml — control table, incremental (last_as_of_ts + 1 day), backfill (range), overwrite partition per as_of_ts, idempotent write.
- **(b)** Both jobs INSERT rows for same (user_id, item_id, as_of_ts); table gets two rows per key. Fix: use MERGE so second write updates same row; or partition overwrite so each job overwrites its partition and overlapping run overwrites same partition (idempotent).
- **(c)** If control is updated before write and write fails, next run reads advanced last_as_of_ts and skips that as_of_ts; gap in feature table. Fix: update control only **after** successful write; then next run only advances when data is committed.
