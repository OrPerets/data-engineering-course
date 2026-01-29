# Week 13: DataOps, Testing, and Data Quality

## Purpose
- DataOps applies DevOps practices to data pipelines: CI/CD, tests, monitoring
- Bad data or silent regressions break trust; tests and quality gates prevent that
- Engineering: formalize what “good” means and enforce it before promote

## Learning Objectives
- Define DataOps and its role in data engineering (CI/CD, tests, monitoring)
- Classify data tests: schema, row, freshness, volume, custom assertions
- Design a quality gate so pipeline output is validated before promote
- Apply idempotency and partition-level resume in the context of tested pipelines
- Reason about cost: test runtime, storage for assertions, alert fatigue
- Identify failure modes: silent regression, test gap, flaky test, watermark skew

## Sources Used (Reference Only)
- sources/Lecture 4.pptx
- exercises1.md (ETL/ELT, idempotency, failure/reprocessing, DLQ)
- exercises2.md (Module 3: Robust Data Ingestion, staging, watermarking, DLQ)

## Diagram Manifest
- Slide 12 → week13_lecture_slide12_dataops_pipeline_overview.puml → DataOps pipeline system overview
- Slide 22 → week13_lecture_slide22_test_execution_flow.puml → CI test execution flow (build → test → deploy)
- Slide 38 → week13_lecture_slide38_failure_silent_regression.puml → failure: silent regression when test gap exists

## The Real Problem This Lecture Solves
- **Silent regression:** new column or source; no test on it; bad value reaches dashboards and models; trust collapses
- **No quality gate:** pipeline “succeeds” but output is wrong; promote happens; consumers see bad data
- **Alert fatigue:** too many alerts or noisy metrics → real incidents ignored; on-call burns out
- **Production reality:** schema drift, bad rows, and stale data are discovered by users, not by the pipeline

## The System We Are Building
- Same event pipeline as Weeks 4 (ingestion), 6 (MapReduce), 10 (streaming): raw_events → staging → events_clean
- **This week:** add CI/CD, data tests on target, and a quality gate before promote
- **Observability:** row counts, watermark lag, test pass/fail, DLQ size; alert on failure, not on noise
- **Goal:** catch schema drift, duplicates, and freshness issues before consumers see them

## Core Concepts (1/2)
- **DataOps:** CI/CD, automated tests, and monitoring for data pipelines
- **Data tests:** assertions on pipeline output (schema, rows, freshness, volume)
- **Quality gate:** block promote or alert when tests fail; no silent bad data

## Core Concepts (2/2)
- **Guarantees:** tests give confidence that output meets defined criteria
- **At scale:** test runtime grows with data; flaky tests and alert fatigue hurt
- **Incident thinking:** detect, triage, fix; post-mortem to close test gaps

## DataOps Definition
- Borrow from DevOps: version control, automated build, test, deploy
- For data: pipeline as code; tests on **data** (not only code); monitor SLAs
- Goal: catch schema drift, bad rows, duplicates, and freshness issues before consumers see them

## CI/CD in Data Context
- **CI:** on commit or schedule, run pipeline (or subset), then run data tests
- **CD:** promote only if tests pass; idempotent deploy so rerun is safe
- **Difference from app CI:** data volume and freshness matter; tests may be slow

## Data Testing Types (1/2)
- **Schema tests:** column exists, type, nullable; enforce contract
- **Row tests:** uniqueness (e.g. PK), not-null, value in set, regex
- **Referential:** FK present in dimension (e.g. product_id in products)

## Data Testing Types (2/2)
- **Freshness:** max(timestamp) ≥ now − threshold (e.g. data no older than 24 h)
- **Volume / row count:** count between bounds or min expected per partition
- **Custom:** SQL assertion (e.g. revenue = sum(quantity * price) per day)

## Quality Dimensions
- **Accuracy:** values correct (e.g. no wrong cast, no duplicate keys)
- **Completeness:** no missing partitions or rows; freshness within SLA
- **Consistency:** same semantics across runs; idempotent rerun
- **Timeliness:** data available within latency budget

## What Breaks at Scale
- Test runtime: full-table assertions on 1B rows can timeout
- Flaky tests: ordering or clock skew cause intermittent failure
- Alert fatigue: too many alerts or noisy metrics → ignored incidents
- Test gap: new column or source not covered → silent regression

## Cost of Naïve Design (DataOps)
- **No tests on new columns:** schema allows null; source sends null; dashboard shows “unknown”; no pipeline failure; silent regression
- **No quality gate:** load “succeeds”; bad data promoted; analysts and models consume wrong data; trust and SLA break
- **Too many alerts:** every minor drift triggers alert; team mutes or ignores; real incident missed; cost = lost trust and firefighting
- **Full-table tests at scale:** uniqueness on 1B rows every run ⇒ timeout; CI blocks; team disables test or skips; gap remains
- **Production cost:** incident-driven; post-mortem shows missing test or missing gate; formalize “good” and enforce before promote

## DataOps Pipeline Overview (This System)
- Trigger (schedule/commit) → Extract (with watermark) → Staging → Transform → Load → Target
- After load: run data tests on target (schema, row, freshness, volume)
- Monitor: row counts, watermark lag, test results, DLQ size
- Diagram: week13_lecture_slide12_dataops_pipeline_overview.puml

## Running Example — Data & Goal
- **Source:** raw_events (event_id, user_id, event_type, event_timestamp, details)
- **Sample:** (1,101,'click','2025/12/01 08:00:00','{"page":"home"}'); duplicate event_id 1
- **Target:** events_clean (event_id PK, user_id, event_type, event_time, details)
- **Goal:** load with dedup and MERGE; then run tests (row count, uniqueness, freshness)

## Running Example — Step-by-Step (1/4)
- **Step 1: Extract** — read raw_events with watermark (e.g. event_time > last_watermark)
- Filter event_type IN ('click','view','purchase')
- Cast event_timestamp → event_time (TIMESTAMP); invalid rows → DLQ
- Output: staging rows for this slice; DLQ rows for audit

## Running Example — Step-by-Step (2/4)
- **Step 2: Transform and dedup** — one row per event_id
- ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
- Keep WHERE rn = 1; drop rest
- Ensures no duplicate keys in target

## Running Example — Step-by-Step (3/4)
- **Step 3: Load (MERGE)** — MERGE INTO events_clean ON event_id
- WHEN NOT MATCHED THEN INSERT; WHEN MATCHED AND source newer THEN UPDATE (optional)
- Update watermark in control table only after successful commit
- Idempotent: rerun same slice changes nothing

## Running Example — Step-by-Step (4/4)
- **Step 4: Data tests** — run assertions on events_clean (this partition or full table)
- Row count: e.g. count ≥ min_expected for partition
- Uniqueness: count(*) = count(DISTINCT event_id)
- Freshness: max(event_time) ≥ now − 24 h (or per-partition threshold)
- **Result:** pass → promote or OK; fail → block and alert

## Running Example — Engineering Conclusion
- Tests catch duplicates, missing partitions, and stale data before dashboards
- Trade-off: test runtime vs coverage; sample or partition-level tests to bound time
- Cost: test queries add I/O and time; run after load so failure blocks bad state

## Cost & Scaling Analysis (1/3)
- **Time model:** T_pipeline + T_tests; T_tests ≈ sum of assertion query times
- Full-table uniqueness or row-count on 1B rows can be minutes; partition-level tests faster
- Run tests on partition just written to keep CI feedback short

## Cost & Scaling Analysis (2/3)
- **Memory / storage:** test results and metrics (pass/fail, row counts) stored for audit
- Assertion definitions (e.g. dbt tests, Great Expectations) versioned; small
- DLQ and control table grow with failures and partitions; retain policy needed

## Cost & Scaling Analysis (3/3)
- **Network / throughput:** tests read from target; same store as consumers
- Avoid tests that scan full table every run; use partition pruning or incremental checks
- Alerting: message volume scales with pipelines; aggregate or route to avoid noise

## Cost Intuition: What Changes at 10× Scale
- 10× rows ⇒ 10× scan time for full-table tests; use partition-level or sampled tests
- 10× pipelines ⇒ 10× test runs; parallelize and cache where possible
- Rule of thumb: keep test suite under SLA (e.g. &lt; 15 min) so CI stays usable

## Execution Flow: Trigger to Tests
- Trigger (schedule or commit) → Extract (watermark) → Transform → Load → update watermark
- After load: run data tests on target (or on new partition only)
- Pass: done (or promote); Fail: block deploy, alert, do not advance watermark if load was partial
- Diagram: week13_lecture_slide22_test_execution_flow.puml

## Control Table and Watermark
- Columns: job_key, last_watermark, last_run_ts, status
- Read watermark before run; update only after successful commit (same txn as load)
- If tests run after load: fail tests ⇒ do not consider “promote”; rerun same slice is idempotent

## Pitfalls & Failure Modes (1/3)
- **Silent regression:** new column or source; no test on it; bad value reaches consumers
- **Test gap:** tests only PK and count; wrong value in other column slips through
- **Flaky test:** timing or ordering causes intermittent failure; team disables or ignores

## Pitfalls & Failure Modes (2/3)
- **Alert fatigue:** too many alerts or low signal → real incidents missed
- **Watermark skew:** watermark updated but data not visible (e.g. replication lag); next run skips rows
- **Rerun without idempotency:** duplicate rows when same slice processed again

## Pitfalls: Detection
- Monitor: row counts (in vs out), watermark lag, test pass/fail, DLQ row count
- Alert: test failure; load duration spike; zero rows written; DLQ growth
- Metrics: per-partition counts; last successful run; test runtime trend

## Pitfalls: Mitigation Summary
- Add tests for every new column or contract that matters; close test gaps after incidents
- Idempotent write (MERGE/ON CONFLICT); update watermark only after success
- Staging + dedup + DLQ; partition-level tests to bound runtime

## Failure Story 1: Silent Regression
- **Trigger:** Source started sending null in column X for one partner; schema allowed null
- **Symptom:** Dashboard showed “unknown” for X; analysts complained; no pipeline failure
- **Root cause:** No test on “X not null” or “X in allowed set”; test gap
- **Fix:** Add assertion on X; backfill or fix source; post-mortem to add tests for similar columns

## Failure Story 2: Test Passes but Data Wrong
- **Trigger:** Transform bug: wrong join key; revenue doubled for one region
- **Symptom:** Row count and uniqueness passed; sum(revenue) was wrong
- **Root cause:** No custom test on revenue consistency (e.g. vs source or prior day)
- **Fix:** Add business-rule test (e.g. revenue within expected range); fix transform; rerun idempotently

## Failure Story 3: Silent Regression (Test Gap)
- **Trigger:** New column X added; pipeline wrote it; no test on X
- **Symptom:** Bad values in X (type cast error, null where not expected); consumers saw wrong data
- **Root cause:** Tests covered only PK and count; column X untested
- **Fix:** Add schema and row tests for X; fix data; document “test for every critical column”
- Diagram: week13_lecture_slide38_failure_silent_regression.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor test results, row counts, watermark lag, DLQ size
- **Mitigation:** close test gaps; idempotent writes; partition-level resume
- **Incident:** fail fast, alert, block promote; post-mortem and add tests to prevent recurrence

## Best Practices (1/2)
- Version pipeline and tests together; run tests on every run or at least before promote
- Test schema, uniqueness, freshness, and critical business rules (e.g. revenue bounds)
- Keep test suite fast: partition-level or sampled assertions; avoid full-table scan every time
- Update watermark only after successful load; use MERGE so rerun does not duplicate

## Best Practices (2/2)
- Route bad rows to DLQ; do not fail entire batch on one bad row; monitor DLQ growth
- Document expected schema, keys, and SLAs; review tests when schema or sources change
- Tune alerts: avoid noise; aggregate or route so real incidents get attention
- After every incident: post-mortem; add test or gate that would have caught it; close the gap

## Recap — Engineering Judgment
- **Quality gate before promote is non-negotiable:** no silent bad data; block deploy when tests fail
- **Test every critical column and contract:** new column or source ⇒ add test; test gap is the main cause of silent regression
- **Incident → post-mortem → close gap:** formalize what “good” means; enforce it; avoid repeat failures
- **Partition-level or sampled tests** to bound runtime; full-table tests at scale hurt CI and get disabled
- **Tune alerts:** signal over noise; real incidents must get attention; cost of alert fatigue = missed incidents and burnout

## Pointers to Practice
- Write assertions for row count, uniqueness, freshness on a given target table
- Reason about rerun: job fails after 2/3 partitions; ensure no duplicates on rerun
- Design a minimal test set for a pipeline (schema + row + freshness) and where to run it
