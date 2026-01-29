# Week 13: DataOps, Testing, and Data Quality — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Data tests: write assertions (row count, uniqueness, freshness)
- Failure scenario: rerun must not duplicate results; tests must catch regressions

## Data Context (MANDATORY)

### Tables and schemas

**raw_events** (staging / append-only logs):
- `event_id INT`, `user_id INT`, `event_type VARCHAR`, `event_timestamp VARCHAR`, `details JSON`
- Sample: (1, 101, 'click', '2025/12/01 08:00:00', '{"page":"home"}'); (2, 102, 'view', '2025-12-01T09:30:00', '{"page":"product"}'); (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id (business key); duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day)

**events_clean** (target):
- `event_id INT PRIMARY KEY`, `user_id INT`, `event_type VARCHAR`, `event_time TIMESTAMP`, `details JSON`
- Sample: (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id; one row per event
- Scale: ~1B rows total (100 GB); partitioned by date

**etl_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_watermark TIMESTAMP`, `last_run_ts TIMESTAMP`, `status VARCHAR`
- Sample: ('events_sync', '2025-12-01 08:00:00', '2025-12-02 06:00:00', 'OK')
- Used for incremental load watermark

**test_results** (optional; test run audit):
- `run_id VARCHAR`, `test_name VARCHAR`, `passed BOOLEAN`, `actual_value NUMERIC`, `run_ts TIMESTAMP`
- Sample: ('run_001', 'row_count_20251201', true, 1000000, '2025-12-02 06:05:00')

### Access patterns
- raw_events: read by date partition; append-only
- events_clean: read by event_id (MERGE); query by user_id, event_time; tests read by partition or full
- etl_control: read/write by job_key

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw_events → events_clean, dedup, MERGE); Failure and Reprocessing (partition-based, idempotent rerun); Incremental (watermark, MERGE, idempotent).
- exercises2.md: Module 3 Robust Data Ingestion (staging, DLQ, watermarking); Idempotent Pipelines and Deduplication (MERGE, ROW_NUMBER).
- Adapted for DataOps: tests on target, quality gate, idempotent rerun, and failure/reprocessing scenarios.

## Diagram Manifest
- Slide 20 → week13_practice_slide20_quality_gate_flow.puml → quality gate flow after load (tests on target)
- Purpose: show load → target → tests → pass/fail for Challenge Exercise 11(d)
- One diagram in practice; referenced in Solution 11(d)

## Warm-up Exercises

## Exercise 1
- Name **three** types of data tests (e.g. schema, row, freshness).
- In one sentence, what is a quality gate?
- Give one example of each type you named.

## Exercise 2
- Why is **idempotency** important when a data pipeline is re-run after a failure?
- One sentence.
- What happens to the target if the job is run twice with the same input and writes are not idempotent?

## Exercise 3
- **events_clean** is partitioned by date. Give one example of a **freshness** assertion for a single partition (e.g. partition_date = '2025-12-01').
- Give one example of a **row count** assertion for that partition.
- In one line: what should “pass” mean for each assertion?

## Exercise 4
- If the load job fails **after** writing partition 2025-12-02 but **before** updating the watermark, what should the next run do with partitions 2025-12-01 and 2025-12-02?
- One sentence.
- Why is it safe to re-read and re-write 2025-12-02 if the pipeline uses MERGE?

## Exercise 5
- What is a **test gap**?
- Give one example where a test gap could allow bad data to reach consumers.
- Name one way to close that gap (e.g. add which test?).

## Engineering Exercises

## Exercise 6
**Uniqueness test:** Write a SQL assertion that checks that **events_clean** has no duplicate `event_id`. The assertion should be a single query that returns one row; we consider it passed if the result equals (total rows, distinct event_id count) and they are equal. Show the query.

## Exercise 7
**Freshness test:** Write a SQL query that returns the maximum `event_time` in **events_clean** for partition date '2025-12-01'. How would you use this in a test (e.g. pass if max(event_time) ≥ expected_lower_bound)?

## Exercise 8
**Load + watermark:** Assume raw_events is partitioned by date and **etl_control** has job_key = 'events_sync'. Write pseudocode or SQL steps to: (a) Read last_watermark from etl_control. (b) Extract from raw_events where event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'. (c) Apply same transform/dedup as in lecture; MERGE into events_clean. (d) Update etl_control last_watermark only after successful load. Why the 5-minute buffer?

## Exercise 9
**Failure and rerun:** The incremental job for events runs for 2025-12-01, 2025-12-02, 2025-12-03. It fails after successfully writing 2025-12-01 and 2025-12-02 to events_clean (watermark updated for 12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is loaded, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 10
**Cost:** Assume events_clean has 1B rows and a full-table uniqueness test runs COUNT(*) and COUNT(DISTINCT event_id). (a) Why might this test be slow? (b) How would you make the test faster (e.g. partition-level or sampled)? One sentence each.

## Challenge Exercise

## Exercise 11 (Multi-part)
**Quality gate design:** For the pipeline raw_events → events_clean (with watermark and MERGE):

- **(a)** List **three** concrete tests you would run after each load (schema/row/freshness/volume). For each, state the assertion in one line (e.g. “event_id unique”).
- **(b)** Where in the pipeline would you run these tests (before or after watermark update)? Justify in one sentence.
- **(c)** If the uniqueness test fails after a run, what could have gone wrong in the pipeline? Name two possible causes.
- **(d)** Draw or reference the quality gate flow: load → target → tests → pass/fail. Diagram: week13_practice_slide20_quality_gate_flow.puml

## Solutions

## Solution 1
- **Three types:** e.g. schema (column type, nullable), row (uniqueness, not-null, value in set), freshness (max timestamp within SLA).
- **Quality gate:** A check that blocks promote (or alerts) when assertions fail; bad data does not reach consumers without detection.

## Solution 2
- Idempotency means running the job N times yields the same result as once. If the job is re-run after a partial failure, idempotent writes (e.g. MERGE or INSERT ON CONFLICT DO NOTHING) prevent duplicate rows in the target.

## Solution 3
- **Freshness (partition):** e.g. max(event_time) for partition_date = '2025-12-01' ≥ '2025-12-01 23:00:00' (data for that day is complete up to some time).
- **Row count (partition):** e.g. count(*) for partition_date = '2025-12-01' between 500000 and 2000000 (min expected, sanity upper bound).

## Solution 4
- The next run should **re-process** 2025-12-02 (and 2025-12-01 if watermark was not updated for 12-01) because the watermark was not advanced; the job will re-read the same slice. Idempotent MERGE ensures no duplicate rows when re-inserting.

## Solution 5
- **Test gap:** A part of the data or schema that is not covered by any test. Example: a new column X is added; pipeline writes X; no test checks X for null or valid values. Bad values in X can reach consumers without any test failing.

## Solution 6
**Assumptions:** events_clean has event_id as business key; we expect one row per event_id.

**Plan:** Compare total row count to distinct event_id count; they must be equal.

**SQL:**

```sql
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT event_id) AS distinct_ids
FROM events_clean;
```

**Check:** Pass if total_rows = distinct_ids. If total_rows > distinct_ids, there are duplicate event_ids.

## Solution 7
**Assumptions:** events_clean partitioned by date (e.g. partition key = date(event_time)); we test partition '2025-12-01'.

**Plan:** Get max(event_time) for that partition; compare to expected lower bound (e.g. end of day or now − threshold).

**SQL:**

```sql
SELECT MAX(event_time) AS max_event_time
FROM events_clean
WHERE event_time >= '2025-12-01' AND event_time < '2025-12-02';
```

**Check:** Pass if max_event_time ≥ expected_lower_bound (e.g. '2025-12-01 23:00:00' or NOW() − INTERVAL '24 hours').

## Solution 8
**Assumptions:** raw_events has event_time (or event_timestamp cast to timestamp); etl_control stores last_watermark for job_key = 'events_sync'.

**Plan:** (a) SELECT last_watermark FROM etl_control WHERE job_key = 'events_sync'. (b) SELECT * FROM raw_events WHERE event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'. (c) Dedup with ROW_NUMBER() PARTITION BY event_id ORDER BY event_time; MERGE INTO events_clean FROM deduped CTE ON event_id; (d) UPDATE etl_control SET last_watermark = NOW() - INTERVAL '5 minutes', last_run_ts = NOW() WHERE job_key = 'events_sync' (only after successful commit of load).
- **Why 5-minute buffer:** So that transactions that started before the run but commit slightly later are included in the next run; avoids missing rows due to commit latency.

## Solution 9
- **(a)** Next run reads last_watermark from etl_control (e.g. end of 2025-12-02); so it only extracts data with event_time > that watermark, i.e. 2025-12-03 and later.
- **(b)** It does **not** re-extract 2025-12-01 or 2025-12-02 because they are before the stored watermark.
- **(c)** MERGE (or INSERT ON CONFLICT) ensures that if any row from 2025-12-03 were already present, it would be updated, not duplicated; so no duplicate rows for 12-01 or 12-02 (they are not re-read) and no duplicates for 12-03 (idempotent write).

## Solution 10
- **(a)** Full-table scan of 1B rows twice (COUNT(*) and COUNT(DISTINCT event_id)) is I/O and CPU intensive; can take minutes and timeout in CI.
- **(b)** Run the test per partition (e.g. only on the partition just loaded) so each run scans a small subset; or sample a fraction of rows and test uniqueness on the sample to bound runtime.

## Solution 11
**(a)** Three tests (examples): (1) **Uniqueness:** count(*) = count(DISTINCT event_id) on target (or per partition). (2) **Row count:** count(*) for the loaded partition ≥ min_expected (e.g. from source count or prior day). (3) **Freshness:** max(event_time) for the partition ≥ expected_lower_bound (e.g. end of partition day or now − 24 h).

**(b)** Run tests **after** load and **after** watermark update (or in same transaction as watermark update only if tests pass). So: load → commit → run tests; if tests pass, consider “promote” or OK; if tests fail, alert and do not consider the run successful (optionally do not advance watermark if we treat “success” as load + tests). Running after load ensures we validate the actual state that consumers will see.

**(c)** (1) Dedup step was skipped or wrong (e.g. ROW_NUMBER filter missing), so duplicates were inserted. (2) MERGE was not used and a rerun inserted the same keys again. (3) Upstream sent duplicate event_ids and dedup was not applied correctly.

**(d)** Load writes to target (events_clean); then tests read from target (row count, uniqueness, freshness); pass → promote/OK, fail → block and alert. Diagram: week13_practice_slide20_quality_gate_flow.puml
