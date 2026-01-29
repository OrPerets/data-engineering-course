# Week 11: Feature Engineering for Data Systems — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Feature pipelines: point-in-time correctness; idempotent write on (entity_id, as_of_ts)
- Failure scenario: rerun must not duplicate feature rows

## Data Context (MANDATORY)

### Tables and schemas

**events** (raw user activity; append-only):
- `event_id INT`, `user_id INT`, `event_ts TIMESTAMP`, `event_type VARCHAR(20)`
- Sample: (1, 101, '2025-12-01 10:00:00', 'click'), (2, 101, '2025-12-02 14:00:00', 'view'), (3, 102, '2025-12-01 09:00:00', 'click'), (4, 101, '2025-12-03 08:00:00', 'click'), (5, 102, '2025-12-02 11:00:00', 'view')
- Keys: event_id (business key); no PK; duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day); partitioned by date(event_ts)

**user_features** (feature table; target):
- `user_id INT`, `as_of_ts TIMESTAMP`, `clicks_7d INT`, `views_7d INT`
- Sample: (101, '2025-12-02 23:59:59', 2, 1), (102, '2025-12-02 23:59:59', 1, 1)
- Keys: (user_id, as_of_ts) — primary or overwrite key; one row per (user_id, as_of_ts)
- Scale: ~10M users × 365 days ≈ 3.65B rows (partitioned by as_of_ts, e.g. by month)

**users** (dimension; optional for join):
- `user_id INT PRIMARY KEY`, `signup_ts TIMESTAMP`, `region VARCHAR(20)`
- Sample: (101, '2025-01-15 00:00:00', 'North'), (102, '2025-02-01 00:00:00', 'South')
- Scale: ~10M rows (100 MB)

**feature_job_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_as_of_ts TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('user_features_daily', '2025-12-02 23:59:59', '2025-12-03 06:00:00')
- Used for incremental feature compute (watermark on as_of_ts)

### Access patterns
- events: read by date partition; filter by event_ts <= as_of_ts for point-in-time
- user_features: read by (user_id, as_of_ts) or by as_of_ts range for training; write by MERGE/overwrite on (user_id, as_of_ts)
- users: read by user_id for join; small table

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw → clean, dedup, MERGE); Incremental (watermark, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun).
- exercises2.md: Module 1 (window functions, idempotent pipelines, SCD); Module 3 (watermarking, schema-on-read, incremental load).

## Diagram Manifest
- Slide 19 → week11_practice_slide20_reasoning_feature_flow.puml → feature pipeline reasoning (agg, join, write)

## Warm-up Exercises

## Exercise 1
Define **point-in-time correctness** for a feature in one sentence. Why is it required to avoid data leakage?

## Exercise 2
What is the **natural key** for a feature table that supports training and backtests? Why must a rerun not insert a second row for the same key?

## Exercise 3
Distinguish **offline** vs **online** feature consumption in one sentence each. Which one typically uses (entity_id, as_of_ts) range reads?

## Exercise 4
For **events** with user_id = 101 and as_of_ts = '2025-12-02 23:59:59', which events may be used to compute clicks_7d? (Give the time window.)

## Exercise 5
A feature job writes (user_id, as_of_ts, clicks_7d) with plain INSERT. The job is re-run for the same day. What goes wrong? One sentence.

## Engineering Exercises
- Point-in-time aggregation; idempotent MERGE; incremental job with watermark
- Numeric assumptions: table sizes, partition pruning; cost reasoning required
- Failure and rerun: no duplicate feature rows; control table updated after success

## Exercise 6
**Point-in-time aggregation:** Write SQL to compute `clicks_7d` and `views_7d` for each (user_id, as_of_ts) where as_of_ts is '2025-12-02 23:59:59' and '2025-12-03 23:59:59'. Use only events with event_ts <= as_of_ts and event_ts > as_of_ts - INTERVAL '7 days'. Output: user_id, as_of_ts, clicks_7d, views_7d. (Assume events table and a grid of (user_id, as_of_ts) from a CTE or cross join with a small dates table.)

## Exercise 7
**Idempotent write:** Assume you have a CTE `feature_rows` with (user_id, as_of_ts, clicks_7d, views_7d). Write a MERGE (or INSERT ... ON CONFLICT) into **user_features** so that (user_id, as_of_ts) is the key. On conflict, update clicks_7d and views_7d. Re-running the same feature_rows must not duplicate rows.

## Exercise 8
**Incremental feature job:** Assume **feature_job_control** has job_key = 'user_features_daily'. Describe in 3 bullets: (a) read last_as_of_ts from control; (b) compute features only for as_of_ts = last_as_of_ts + 1 day; (c) MERGE into user_features and update control only after successful write. Why update control only after success?

## Exercise 9
**Cost:** Assume 10M users, 365 as_of_ts points per year, 50 bytes per feature row. (a) Approximate feature table size in GB. (b) If training reads one month of as_of_ts (e.g. December), how does partitioning by as_of_ts (e.g. by month) reduce scan size? One sentence.

## Exercise 10
**Failure and rerun:** The feature job runs for as_of_ts = 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-01 and 2025-12-02 to user_features (control updated to 2025-12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is computed and written, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Challenge Exercise

## Challenge Exercise
- Multi-part; architecture-level reasoning; diagram required

## Exercise 11 (Multi-part)
- **(a)** Draw or reference a diagram of the feature pipeline: events + users → aggregate (clicks_7d, views_7d) with point-in-time → join to user dimension (as-of) → write to user_features with key (user_id, as_of_ts). Diagram: week11_practice_slide20_reasoning_feature_flow.puml
- **(b)** Explain why the join to **users** must be point-in-time: only use user rows where signup_ts <= as_of_ts. What goes wrong if you use the current user state?
- **(c)** If the write step used INSERT only (no MERGE), and the job is re-run for the same as_of_ts range, what is the impact on training? How do you fix it?

## Solutions
- Each solution matches exercise order; assumptions, plan, execution, check
- SQL in fenced blocks; step-by-step calculations where required

## Solution 1
- **Point-in-time correctness:** For a given as_of_ts, use only raw data with timestamp <= as_of_ts when computing the feature.
- **Why:** Using data after as_of_ts would leak future information into training or backtest, inflating accuracy and breaking production.

## Solution 2
- **Natural key:** (entity_id, as_of_ts) — e.g. (user_id, as_of_ts).
- **Rerun:** If the job inserts again for the same key, we get duplicate rows; training and joins would double-count or be ambiguous; idempotent write (MERGE/overwrite) avoids this.

## Solution 3
- **Offline:** Batch read of feature table by (entity_ids, as_of_ts range); used for training.
- **Online:** Low-latency lookup by entity_id (e.g. latest as_of_ts); used for serving.
- **Range reads:** Offline typically uses as_of_ts range; online uses key lookup.

## Solution 4
- **Window:** event_ts > '2025-11-25 23:59:59' AND event_ts <= '2025-12-02 23:59:59' (last 7 days at as_of_ts).
- Only events in that window may be used; events on 2025-12-03 must not be used.

## Solution 5
- **Wrong:** Re-run inserts the same (user_id, as_of_ts) again; user_features gets duplicate rows per key; training and backtests are wrong (e.g. duplicate rows per user per day).

## Solution 6
- **Assumptions:** events table; as_of_ts values in a small set (e.g. 2 dates); grid = distinct user_id from events cross join as_of_ts.
- **Plan:** For each (user_id, as_of_ts), count events where event_ts <= as_of_ts AND event_ts > as_of_ts - 7 days, split by event_type.

```sql
WITH as_of_dates AS (
  SELECT TIMESTAMP '2025-12-02 23:59:59' AS as_of_ts
  UNION ALL SELECT TIMESTAMP '2025-12-03 23:59:59'
),
grid AS (
  SELECT DISTINCT e.user_id, d.as_of_ts
  FROM events e
  CROSS JOIN as_of_dates d
),
counts AS (
  SELECT e.user_id, d.as_of_ts,
         SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicks_7d,
         SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) AS views_7d
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
  GROUP BY e.user_id, d.as_of_ts
)
SELECT g.user_id, g.as_of_ts,
       COALESCE(c.clicks_7d, 0) AS clicks_7d,
       COALESCE(c.views_7d, 0) AS views_7d
FROM grid g
LEFT JOIN counts c ON g.user_id = c.user_id AND g.as_of_ts = c.as_of_ts;
```

- **Check:** No event with event_ts > as_of_ts is used; correct 7-day window.

## Solution 7
- **Plan:** MERGE into user_features on (user_id, as_of_ts); when matched update; when not matched insert.

```sql
MERGE INTO user_features AS target
USING feature_rows AS source
ON target.user_id = source.user_id AND target.as_of_ts = source.as_of_ts
WHEN MATCHED THEN
  UPDATE SET clicks_7d = source.clicks_7d, views_7d = source.views_7d
WHEN NOT MATCHED THEN
  INSERT (user_id, as_of_ts, clicks_7d, views_7d)
  VALUES (source.user_id, source.as_of_ts, source.clicks_7d, source.views_7d);
```

- **Check:** Re-running with same feature_rows leaves one row per (user_id, as_of_ts); idempotent.

## Solution 8
- **(a)** SELECT last_as_of_ts FROM feature_job_control WHERE job_key = 'user_features_daily'.
- **(b)** Compute features for as_of_ts = last_as_of_ts + 1 day only (e.g. one new day); do not recompute all history.
- **(c)** MERGE into user_features; then UPDATE feature_job_control SET last_as_of_ts = new_as_of_ts, last_run_ts = NOW() WHERE job_key = 'user_features_daily'.
- **Why after success:** If we update control before write and write fails, next run would skip that as_of_ts and leave a gap; updating after success ensures we only advance when data is written.

## Solution 9
- **(a)** 10M × 365 × 50 B = 182.5e9 B ≈ 182.5 GB (or ~183 GB).
- **(b)** Partitioning by month limits scan to one month’s partition (e.g. December); instead of full 183 GB, scan ~15 GB (1/12); partition pruning reduces I/O and cost.

## Solution 10
- **(a)** Next run reads last_as_of_ts = 2025-12-02; compute features for as_of_ts = 2025-12-03 only; MERGE into user_features; update control to 2025-12-03.
- **(b)** Do not recompute or re-insert 2025-12-01 and 2025-12-02; MERGE on (user_id, as_of_ts) ensures re-run of same day overwrites rather than duplicates.
- **(c)** Track only last_as_of_ts so we only add new days; idempotent write so partial re-run does not duplicate.

## Solution 11
- **(a)** Diagram: week11_practice_slide20_reasoning_feature_flow.puml — events → aggregate (point-in-time) → join users (as-of) → write user_features.
- **(b)** If we use current user state, we might join users who signed up after as_of_ts (e.g. user created on 2025-12-05 used for as_of_ts 2025-12-01); that leaks future information; join must use only users with signup_ts <= as_of_ts.
- **(c)** INSERT only: re-run inserts duplicate rows for same (user_id, as_of_ts); training sees duplicate rows per key, wrong aggregates. Fix: use MERGE or overwrite on (user_id, as_of_ts) so rerun overwrites same key; one row per key.
