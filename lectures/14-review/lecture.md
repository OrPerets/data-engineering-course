# Week 14: Course Review and Exam Preparation

## Purpose
- Synthesize data engineering concepts across the full course
- Connect theory, cost models, and failure modes for exam readiness
- Engineering: decisions under constraints, trade-offs, and correctness

## Learning Objectives
- Map exam-style questions to course topics (ingestion, DWH, MapReduce, streaming, DataOps)
- Apply cost models: time, memory, network, shuffle; partition pruning and join size
- Design idempotent pipelines: watermark, MERGE, dedup; safe rerun and resume
- Trace MapReduce: map emits, shuffle groups, reduce output; identify skew and mitigation
- Reason about DWH: star schema, partition pruning, join cost and cardinality
- Identify failure modes: duplicate on rerun, skew OOM, late data, silent regression
- State trade-offs: ETL vs ELT, batch vs streaming, SQL vs NoSQL, consistency vs latency

## Sources Used (Reference Only)
- sources/Introduction & Recap.pdf
- sources/Lecture 1.pptx, Lecture 2.pdf, Lecture 2.pptx, Lecture 3.pptx, Lecture 4.pptx, Lecture 5.pptx
- sources/Lecture 6,7,8.pdf, Lecture 6,7,8.pptx
- sources/TF-IDF.pdf, Spark.pdf, Regular Expressions.pptx
- exercises1.md, exercises2.md

## Diagram Manifest
- Slide 11 → week14_lecture_slide11_course_pipeline_overview.puml → Full course pipeline: sources → ingestion → DWH/Lake → consumers
- Slide 19 → week14_lecture_slide19_failure_rerun.puml → Failure: partial run and non-idempotent rerun → duplicates
- Slide 21 → week14_lecture_slide21_exam_request_flow.puml → Exam flow: question → topic → concepts → solution path

## Core Concepts (1/2)
- **Data engineering:** collect, store, process data at scale; output for analytics/ML/BI
- **Pipeline:** source → extract → (staging) → transform → load → target; idempotency required
- **Distributed:** partitioning, replication; CAP: consistency vs availability under partition

## Core Concepts (2/2)
- **MapReduce:** map (emit (k,v)) → shuffle (group by k) → reduce (aggregate); shuffle cost and skew
- **DWH/Lake:** star schema, partition pruning, schema-on-read vs schema-on-write
- **Streaming:** event-time, watermark, windows; at-least-once + idempotent sink

## Formal Formulas to Recall
- **Partition:** partition_id = hash(k) mod R; same k ⇒ same reducer
- **Shuffle size:** sum over all map output (k,v) pairs; combiner reduces before shuffle
- **IDF:** \(\log\frac{N}{df}\); TF-IDF = TF(t,d) × IDF(t)
- **Join size (upper bound):** |A ⋈ B| ≤ |A| × |B|; with FK often ≈ fact rows

## Course Map: Weeks 1–5
- **W1:** Intro — scale, pipeline, DE vs DS vs analytics
- **W2:** Distributed DB — SQL vs NoSQL, partitioning, CAP
- **W3:** Parallelism — divide and conquer, functional primitives
- **W4:** ETL/Ingestion — batch vs incremental, MERGE, watermark, DLQ
- **W5:** DWH/Lake — star schema, partitioning, pruning

## Course Map: Weeks 6–10
- **W6–7:** MapReduce — map/shuffle/reduce, combiner, skew, salting
- **W8–9:** Text — TF-IDF, n-grams, indexing at scale
- **W10:** Streaming — windows, event-time, watermark, delivery semantics

## Course Map: Weeks 11–13
- **W11–12:** Feature engineering — point-in-time, leakage, offline vs online
- **W13:** DataOps — CI/CD, data tests, quality gates, monitoring

## Running Example — Data & Goal
- **Domain:** Event analytics; raw events → clean table → star schema for BI
- **Source:** raw_events(event_id, user_id, event_type, event_timestamp, details); ~100M rows/day
- **Target:** events_clean (PK event_id); then sales_fact + dim_customer, dim_product
- **Goal:** End-to-end: extract with watermark, staging dedup, MERGE; then OLAP query with pruning

## Running Example — Sample Rows
- **raw_events (sample):** (1,101,'click','2025/12/01 08:00:00','{}'), (2,102,'view','2025-12-01T09:00:00','{}'), (1,101,'click','2025/12/01 08:00:00','{}')
- **events_clean:** one row per event_id; duplicate event_id 1 → dedup to one row
- **sales_fact + dim_customer:** join on customer_id; filter date_key for December; sum quantity × unit_price by region

## Running Example — Step-by-Step (1/4)
- **Step 1 — Extract:** Read raw_events where event_timestamp > watermark AND ≤ upper_bound
- **Upper bound:** NOW() − 5 min (safety buffer for committed transactions)
- **Watermark:** stored in metadata table; updated only after successful load
- Diagram: week14_lecture_slide11_course_pipeline_overview.puml

## Running Example — Step-by-Step (2/4)
- **Step 2 — Staging and dedup:** Load into staging (schema-on-read); filter event_type IN ('click','view','purchase')
- **Dedup:** ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp) AS rn; keep rn = 1
- **Invalid rows:** WHERE fail validation → DLQ; pipeline does not crash

## Running Example — Step-by-Step (3/4)
- **Step 3 — Load:** MERGE INTO events_clean USING deduped_staging ON event_id
- **WHEN MATCHED AND** source.event_timestamp > target.last_updated **THEN** UPDATE
- **WHEN NOT MATCHED THEN** INSERT; idempotent: rerun yields same result

## Running Example — Step-by-Step (4/4)
- **Step 4 — OLAP:** Query revenue by region for December 2025
- **Join:** sales_fact → dim_customer (region); **filter:** date_key in December partition only
- **Engineering:** Partition pruning limits scan; join size = fact rows in range × match rate

## Cost & Scaling Analysis (1/3)
- **Time model:** T ∝ (data size / parallelism) + shuffle + reduce; shuffle often dominates
- **MapReduce:** Shuffle size = sum of map output; reducer input = group size per key
- **Skew:** max reducer input ≫ mean ⇒ one reducer dominates; OOM or timeout

## Cost & Scaling Analysis (2/3)
- **Memory/storage:** Staging holds one batch; target grows; partition count affects metadata
- **DWH:** Scan cost ∝ partitions read × rows per partition; pruning = skip partitions
- **Join size:** |A ⋈ B| ≤ |A| × |B|; with FK, often ≈ fact rows when dimension small

## Cost & Scaling Analysis (3/3)
- **Network:** Shuffle = all map output over network; combiner reduces bytes per key
- **Throughput:** events/sec limited by slowest operator; backpressure in streaming
- **Latency:** Watermark delay + processing; buffer trades latency for consistency

## Pitfalls & Failure Modes (1/3)
- **Duplicate on rerun:** Job fails after partial insert; rerun without MERGE or watermark ⇒ 2× data
- **Full scan:** Query without partition filter on large fact table ⇒ timeout
- **Skew:** One key has most values ⇒ one reducer OOM or straggler

## Pitfalls & Failure Modes (2/3)
- **Late data:** Watermark too tight ⇒ events dropped; too loose ⇒ long delay and state growth
- **Silent regression:** New column or source not covered by tests ⇒ bad data promoted
- **Leakage:** Feature uses future data for training ⇒ model fails in production
- Diagram: week14_lecture_slide19_failure_rerun.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** Monitor row counts, watermark lag, reducer input variance, test results
- **Mitigation:** Idempotent MERGE; partition-level resume; watermark with buffer; salting for skew
- **Quality gate:** Block promote on test failure; DLQ for invalid rows; post-mortem to close gaps

## Exam Readiness: Question → Topic
- **SQL/ETL:** Joins, aggregations, window functions, MERGE, dedup, incremental load
- **MapReduce:** Map/shuffle/reduce trace, word count, skew, combiner, salting
- **DWH:** Star schema, partition pruning, join cost, fact vs dimensions
- Diagram: week14_lecture_slide21_exam_request_flow.puml

## Exam Readiness: Question Types
- **Design:** "Design an idempotent incremental load" → watermark, staging, MERGE, partition resume
- **Trace:** "Show map outputs, shuffle, reduce for this input" → list (k,v), then groups, then aggregates
- **Query:** "Revenue by region for date range" → star join, partition filter, GROUP BY
- **Reasoning:** "Why did the job fail?" / "How to mitigate skew?" → identify cause, propose fix

## Exam Readiness: Concepts to Recall
- **Definitions:** Idempotency, watermark, partition key, shuffle, event-time, point-in-time
- **Formulas:** Shuffle size; partition(k,R)=hash(k) mod R; IDF = log(N/df); TF-IDF product
- **Trade-offs:** ETL vs ELT; batch vs streaming; at-most / at-least / exactly-once

## Best Practices (1/2)
- Design for idempotency: MERGE or partition overwrite; watermark; no duplicate keys on rerun
- Use staging and DLQ: schema-on-read for landing; invalid rows isolated; pipeline does not fail whole batch
- Partition fact tables and require partition filter in queries to avoid full scan
- In MapReduce: balance keys; use combiner when reduce is associative; salt hot keys

## Best Practices (2/2)
- In streaming: event-time windows; watermark with buffer; idempotent sink by (key, window)
- Feature pipelines: point-in-time correctness; key = (entity_id, as_of_ts); test for leakage
- DataOps: schema and row tests; freshness and volume checks; quality gate before promote
- Trade-off table: ETL (transform before load) vs ELT (load raw then transform); choose by engine and governance

## Recap (1/2)
- End-to-end pipeline: extract (watermark) → staging → transform/dedup → MERGE → target; tests after load
- MapReduce: same key → same reducer; shuffle cost and skew drive failure; combiners and salting help

## Recap (2/2)
- DWH: star schema, partition pruning, join size; avoid full scan
- Failure modes: duplicate on rerun, skew OOM, late data, silent regression; mitigate with idempotency, watermark, tests

## Pointers to Practice
- Solve SQL on concrete tables: joins, MERGE, dedup, incremental load and rerun scenario
- Trace MapReduce manually: 8–12 input records, map emits, shuffle groups, reduce output; then skew case and salting
- DWH: star schema query with partition filter; reason about join size and scan cost
- Combine topics: ingestion + idempotency + DWH query in one end-to-end scenario
