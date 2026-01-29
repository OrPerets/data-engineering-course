# Week 4: Data Ingestion and ETL Pipelines

## Purpose
- Ingestion is the first mile of data: source → storage
- ETL/ELT pipelines are the backbone of analytics and DWH
- Failures and reruns must not corrupt or duplicate data

## Learning Objectives
- Define ETL vs ELT and when to use each
- Classify ingestion: batch vs incremental; full vs delta
- Apply idempotency and watermark for safe reruns
- Design staging, dedup, and MERGE for incremental load
- Handle failure: partition-based resume, DLQ, no duplicates on rerun
- Reason about cost: I/O, network, and latency vs consistency

## The Real Problem This Lecture Solves
- **Organizational failure:** A company ran nightly revenue loads with plain INSERT and no watermark
- **Trigger:** Job failed mid-run; operator re-ran the full job; same day’s data was inserted again
- **Consequence:** Revenue dashboards showed 2× real revenue; finance and execs lost trust in “the number”
- **Root cause:** Non-idempotent load; no staging or dedup; no partition-level resume
- **Takeaway:** Bad ingestion doesn’t just break pipelines—it breaks trust. This lecture is about designing so that reruns and late data never corrupt the target

## The System We Are Building (End-to-End)
- **Domain:** Event analytics (clicks, views, purchases) feeding BI and product dashboards
- **Data source(s):** raw_events (DB or log export); partitioned by date; ~100M rows/day
- **Ingestion boundary:** Extract with watermark; upper_bound = NOW() - 5 min (safety buffer)
- **Staging:** One batch per run; schema-on-read; dedup by event_id; invalid rows → DLQ
- **Transform:** Filter event_type; cast event_timestamp → event_time; one row per event_id
- **Load:** MERGE into events_clean (target); key = event_id; idempotent
- **Target:** events_clean in DWH/lake; partitioned by date; consumed by BI and analysts
- **Consumers:** BI tools, analysts; expect one row per event, no duplicates
- Every later example refers to *this* system unless stated otherwise

## Sources Used (Reference Only)
- sources/Lecture 4.pptx
- exercises1.md (ETL/ELT, batch ingestion, incremental, failure/reprocessing)
- exercises2.md (Module 3: Robust Data Ingestion, watermarking, DLQ, schema-on-read)

## Diagram Manifest
- Slide 13 → week4_lecture_slide13_pipeline_overview.puml → ETL pipeline system overview
- Slide 14 → week4_lecture_bad_architecture.puml → bad architecture (no staging, INSERT, no watermark) and why it fails
- Slide 15 → week4_lecture_evolution_v1_v2.puml → evolution: v1 full refresh → v2 incremental + MERGE + watermark
- Slide 22 → week4_lecture_slide22_execution_flow.puml → execution flow (trigger → load → watermark)
- Slide 38 → week4_lecture_slide38_failure_rerun.puml → failure: partial run and idempotent rerun

## Core Concepts (1/2)
- **ETL:** Extract (read source) → Transform (clean, join, aggregate) → Load (write target)
- **ELT:** Extract → Load (raw into lake/DWH) → Transform (SQL in place); scales with engine
- **Batch:** periodic bulk load (e.g. nightly); **incremental:** only new/changed rows

## Core Concepts (2/2)
- **Idempotency:** running the job N times yields same result as running once
- **Watermark:** last_loaded_at or max(id); next run reads only data after watermark
- **CDC:** change data capture; apply inserts/updates/deletes from source log

## Architectural Fork: ETL vs ELT
- **Option A — ETL:** Transform in pipeline (Spark, Python); then load cleaned data
  - Pros: target sees only clean data; smaller load volume
  - Cons: transform logic lives outside DWH; harder to reuse DWH SQL; more moving parts
- **Option B — ELT:** Load raw into lake/DWH; transform with SQL (views, dbt, etc.)
  - Pros: one copy of raw; transform scales with DWH engine; schema-on-read flexibility
  - Cons: raw can be large; governance must control what is “curated”
- **Decision rule:** Choose ETL when source is small and transform is complex outside SQL. Choose ELT when you have a powerful DWH/lake engine and want raw + curated in one place. In *this* system we use ETL with staging so that invalid rows never touch the target and dedup is explicit before MERGE

## Architectural Fork: MERGE vs Overwrite
- **Option A — MERGE (upsert):** ON key match update/insert; rerun safe
  - Pros: idempotent; handles duplicates and late updates
  - Cons: cost = join source vs target; needs index or partition on key
- **Option B — Partition overwrite:** Replace whole partition (e.g. by date)
  - Pros: simple; no join; good when partition = natural unit of reload
  - Cons: only idempotent at partition level; full partition rewrite
- **Decision rule:** Choose MERGE when same business key can arrive in multiple runs or when you need row-level upsert. Choose partition overwrite when you always reload full days and never mix old and new in the same partition. In *this* system we use MERGE on event_id because retries and late data can resend the same event_id

## Architectural Fork: Schema-on-Read vs Schema-on-Write
- **Option A — Schema-on-write:** Validate and type on load; bad row fails load
  - Pros: target is always typed; simpler queries
  - Cons: one bad row fails whole batch; no audit of bad data
- **Option B — Schema-on-read:** Load raw (e.g. VARCHAR/JSON); apply schema at query or in staging
  - Pros: bad rows can go to DLQ; pipeline doesn’t crash; audit trail
  - Cons: consumers must handle types; staging holds raw
- **Decision rule:** Use schema-on-write for curated target tables. Use schema-on-read at the ingestion boundary (staging) so invalid rows go to DLQ and the pipeline stays up. In *this* system we load raw into staging (schema-on-read), validate, then write typed data to events_clean (schema-on-write)

## Running Example — Data & Goal (In This System)
- **Source:** raw_events (event_id, user_id, event_type, event_timestamp, details)
- **Sample:** (1,101,'click','2025/12/01 08:00:00','{"page":"home"}'); duplicate event_id 1
- **Target:** events_clean same schema; event_time TIMESTAMP; no duplicates
- **Goal:** load raw → clean; dedup by event_id; idempotent rerun

## Running Example — Step-by-Step (1/4)
- **Step 1: Extract** — read raw_events (e.g. partition by date); in *this* system we use watermark so only new rows are read
- Filter event_type IN ('click','view','purchase')
- Cast event_timestamp string → TIMESTAMP; validate format
- Output: rows with event_time; invalid rows → DLQ or skip

## Running Example — Step-by-Step (2/4)
- **Step 2: Dedup (in-batch)** — one row per event_id
- ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
- Keep WHERE rn = 1; drop rest
- Ensures staging does not insert duplicate keys into target

## Running Example — Step-by-Step (3/4)
- **Step 3: Load (merge)** — MERGE INTO events_clean
- ON target.event_id = source.event_id
- WHEN NOT MATCHED THEN INSERT
- WHEN MATCHED AND source.event_time > target.event_time THEN UPDATE (optional)
- In *this* system, rerun with same source: no new rows inserted (idempotent)
- See slide 13 (ETL Pipeline Overview) for pipeline diagram

## Running Example — Step-by-Step (4/4)
- **Result:** events_clean has one row per event_id; correct types
- **Trade-off:** MERGE cost = join source vs target; index on event_id critical
- **Conclusion:** staging + dedup + MERGE gives safe, repeatable ingestion

## From example to pipeline
- Same pattern: extract (with filter) → dedup → merge; scales to many sources
- Next: system view of ETL pipeline; then cost and failure

## ETL Pipeline Overview (This System)
- Sources (DB, files, API) → Extract → Staging (optional) → Transform → Load → Target
- Staging allows schema-on-read and validation before touching target
- Diagram: week4_lecture_slide13_pipeline_overview.puml

## Bad Architecture: Why This Fails in Production
- **Anti-pattern:** Source → direct INSERT into target; no staging; no watermark; no MERGE
- **What goes wrong:** Rerun inserts same rows again ⇒ duplicated events; dashboard shows 2× counts
- **Partial failure:** Job fails after writing half the partitions; rerun re-inserts those partitions ⇒ duplicates
- **No dedup:** Upstream retry sends same batch twice ⇒ duplicate event_id in target
- **Diagram:** week4_lecture_bad_architecture.puml (bad path vs correct path)

## Evolution: v1 Full Refresh → v2 Incremental + Idempotent
- **v1:** Full table read every run; INSERT into target; no watermark
  - Fails at scale: full scan each run; rerun duplicates everything
- **v2:** Watermark; read only new slice; staging + dedup; MERGE; update watermark only after success
  - Safe rerun; partition-level resume; same slice re-read does not duplicate
- **Diagram:** week4_lecture_evolution_v1_v2.puml

## Cost & Scaling Analysis (1/3)
- **Time model:** T ≈ read_time + transform_time + write_time
- Read: I/O and network from source; Write: target load (indexes, constraints)
- Batch size vs latency: larger batches ⇒ fewer runs, higher per-run time

## Cost & Scaling Analysis (2/3)
- **Memory / storage:** staging holds one batch; target grows monotonically
- Peak disk = max(staging size, target write buffer)
- Partition target by date to limit scan and enable partition pruning

## Cost & Scaling Analysis (3/3)
- **Network / throughput:** extract and load move bytes; often bottleneck
- Compression (e.g. Parquet, gzip) reduces transfer; trade CPU for bandwidth
- Incremental load reduces data moved vs full refresh

## Cost Intuition: What Changes at 10× Scale
- **10M rows/day vs 100M rows/day:** Staging 1 GB vs 10 GB; memory and network 10×; MERGE join cost scales with target size—index on key is mandatory
- **Daily vs hourly ingestion:** Hourly ⇒ 24× more runs; watermark and partition pruning essential; control table and idempotency prevent 24× duplicate risk
- **Full scan vs partitioned scan:** Full scan of 1B-row target for MERGE ≈ hours; partition by date and prune to “last 7 days” for key lookup ⇒ orders of magnitude less I/O
- **Rule of thumb:** At 10× row volume, assume 10× read/write time unless you cut scope (incremental + pruning)

## Cost summary: what drives ingestion time
- Read: source I/O and network; Write: target load and indexes
- Transform: CPU and memory; staging size bounds memory
- Incremental + partition pruning cut data volume per run

## Storage and partitioning
- Staging: one batch at a time; truncate or overwrite per run
- Target: partition by date (or key) for pruning and partition-level rerun
- Control table: small; stores watermark and job state

## Incremental load: watermark
- Store last_loaded_at (or max(modified_at)) in control table
- Next run: SELECT * FROM source WHERE modified_at > last_loaded_at
- Update watermark only after successful load; rerun skips already-loaded data

## Watermark and late-arriving data
- Safety buffer: upper_bound = NOW() - 5 min so committed transactions included
- If job runs at 12:02 and txn commits at 12:05, row can be missed then skipped next run
- Trade latency (data 5 min old) for consistency (no loss)

## Execution flow: steps
- Trigger (schedule or event) → read source with watermark → transform → write target
- After successful write: update watermark in control table
- On failure: do not update watermark; next run re-reads same slice (idempotent)

## Execution flow: trigger to commit
- Trigger (schedule or event) → read source (with watermark) → transform → write target → update watermark
- Failure before watermark update: next run re-reads same slice (idempotent)
- Diagram: week4_lecture_slide22_execution_flow.puml

## Failure Story 1: Rerun Duplicates Revenue
- **Trigger:** Nightly revenue job failed after loading 2 of 3 partitions; operator re-ran full job
- **Symptom:** Revenue report showed ~2× for the two partitions that had been loaded; finance flagged the number
- **Root cause:** INSERT without MERGE; no partition-level tracking; rerun re-inserted same rows
- **Design fix:** MERGE on business key (e.g. sale_id); track completed partitions in control table; on rerun skip completed partitions and only process remaining; update watermark only after successful commit

## Failure Story 2: One Bad Row Kills the Batch
- **Trigger:** Source started sending a new field as integer for one partner; existing column was string; one row failed cast
- **Symptom:** Whole nightly load failed; next morning dashboards had no new data; ops paged at 6 a.m.
- **Root cause:** Schema-on-write on target only; no staging; no DLQ; one bad row failed entire batch
- **Design fix:** Ingest to staging with schema-on-read (e.g. all VARCHAR or JSON); validate in transform; valid rows → target; invalid rows → DLQ (raw row, error_reason, ingest_ts); pipeline stays green; fix schema or source from DLQ analysis

## Pitfalls & Failure Modes (1/3)
- **Non-idempotent load:** INSERT without dedup or MERGE ⇒ rerun duplicates rows
- **No watermark:** full table scan every run ⇒ slow and risky for partial failure
- **Overwrite instead of merge:** reprocessing overwrites good data with stale

## Pitfalls: partial failure and resume
- Job processes partitions P1, P2, P3; fails after writing P2
- Rerun from start: without idempotent write, P1 and P2 duplicated in target
- Fix: partition-level writes (e.g. by date) + MERGE or INSERT ON CONFLICT DO NOTHING

## Pitfalls: duplicate source data
- Upstream retries send same batch twice; or file re-delivered
- Dedup in staging (ROW_NUMBER by business key) then MERGE into target
- Idempotency: processing same batch again changes nothing

## Pitfalls: bad data and DLQ
- One bad row (wrong type, null required) can fail whole batch in schema-on-write
- Schema-on-read: load raw to staging (e.g. all VARCHAR); valid rows → target, invalid → DLQ
- Pipeline does not crash; bad rows auditable

## Pitfalls & Failure Modes (2/3)
- **Summary:** partial run, duplicate source, bad data; all need design for rerun and validation
- Next: diagram of partial failure and idempotent rerun

## Pitfalls: non-idempotent write
- INSERT without key check: rerun inserts same rows again ⇒ duplicates
- Fix: MERGE or INSERT ON CONFLICT DO NOTHING keyed by business key
- Watermark alone is not enough if source can resend same batch

## Pitfalls: partition-level resume
- Track which partitions (e.g. dates) are completed in control table
- On failure: skip already-completed partitions; process only remaining
- Write per partition (or MERGE) so rerun does not duplicate

## Pitfalls: duplicate source and dedup
- Upstream retries or re-delivery: same event_id appears twice in batch
- In-staging dedup: ROW_NUMBER() PARTITION BY event_id ORDER BY event_time; keep rn=1
- MERGE into target: WHEN NOT MATCHED THEN INSERT; no duplicate keys in target

## Pitfalls: DLQ and observability
- Invalid rows (type error, null required) → Dead Letter Queue table
- DLQ columns: raw row, error_reason, ingest_ts; analyze patterns (e.g. one device broken)
- Do not drop bad rows silently; audit and fix schema or source

## Pitfalls: detection
- Monitor: rows read vs rows written; watermark lag; DLQ row count
- Alert: load duration spike; zero rows written (possible bug); DLQ growth
- Metrics: per-partition counts; control table last_updated

## Pitfalls: mitigation summary
- Idempotent write (MERGE/ON CONFLICT); partition-level watermark and commit
- Staging + dedup + DLQ; update watermark only after success
- Next: diagram of partial run and idempotent rerun

## Engineering Judgment
- **Never do plain INSERT into a keyed target** unless you are 100% sure the source slice is append-only and will never be re-delivered. Default to MERGE or INSERT ON CONFLICT.
- **Never update the watermark before the write commits.** If you do, a failure after “advance” loses that slice forever.
- **If you’re unsure about late data,** use a safety buffer (e.g. upper_bound = NOW() - 5 min). Trade a few minutes of latency for not missing rows.
- **Default to staging for any source that can have bad or duplicate rows.** Target stays clean; DLQ gives you an audit trail.

## CDC and deletes
- Watermark on table scan detects inserts/updates; deletes leave no row
- To capture deletes: log-based CDC (WAL, binlog) or soft-delete column
- Trade-off: complexity of CDC vs accepting no delete sync

## Control table design
- Columns: job_key, last_watermark (timestamp or max id), last_run_ts, status
- Read before run; update only after successful commit (in same txn as load)
- Partition-level: store completed partition list or max partition date

## Rerun scenario: what we want
- Job processes P1, P2, P3; fails after P2 written; rerun processes only P3
- Target must not contain duplicate rows for P1, P2 (idempotent write)
- Diagram next: partial run and safe rerun

## Failure scenario: summary
- Job runs for 2025-12-01, 2025-12-02, 2025-12-03; fails after loading 12-02
- Rerun: only process 2025-12-03; do not re-insert 12-01 and 12-02 (idempotent write)
- Control table: mark 12-01 and 12-02 completed; skip on rerun; process 12-03

## Visual: partial run and idempotent rerun
- Diagram shows: run 1 processes P1, P2, fails before P3; run 2 processes only P3
- Target: P1 and P2 written once; P3 written on run 2; no duplicates
- Diagram: week4_lecture_slide38_failure_rerun.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor row counts, watermark lag, DLQ size; alert on anomalies
- **Mitigation:** idempotent writes (MERGE/ON CONFLICT); watermark + buffer; partition-level commit
- **CDC for deletes:** watermark on table scan misses deletes; use log-based CDC if deletes matter

## Best Practices
- Use staging for raw load; validate and dedup before target
- Design for idempotency: MERGE or INSERT ON CONFLICT; key by business key
- Watermark incremental loads; update only after successful commit
- Partition target by date (or key range) for pruning and safe rerun
- Route bad rows to DLQ; do not fail entire batch on one bad row
- Use transactions so partial write does not leave half-updated state
- Document schema, keys, and expected volumes for operators
- Monitor load duration, row counts, and watermark lag

## Recap
- ETL vs ELT: transform before vs after load; ELT scales with engine
- Idempotency and watermark are essential for safe reruns and incremental load
- Staging + dedup + MERGE pattern avoids duplicates and allows reprocessing
- Partial failure and duplicate source require partition-aware, idempotent design
- Cost: I/O and network dominate; incremental and compression reduce load

## Pointers to Practice
- Write SQL: raw → clean with dedup and MERGE; incremental slice by watermark
- Reason about rerun: job fails after 2/3 partitions; ensure no duplicates on rerun
- Design: staging schema, DLQ, and control table for one pipeline
