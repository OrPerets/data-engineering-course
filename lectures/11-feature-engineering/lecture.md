# Week 11: Feature Engineering for Data Systems

## Purpose
- Features are derived inputs for models and analytics; pipelines must be correct at scale
- Feature engineering sits between raw data and ML/BI; bad features break trust in numbers
- Leakage and train/serve skew cause silent failures; point-in-time correctness is mandatory

## Learning Objectives
- Define feature, feature pipeline, and feature store in data-engineering terms
- Apply point-in-time correctness: no future data when computing features for a given timestamp
- Distinguish offline (batch) vs online (serving) feature computation and storage
- Design idempotent feature jobs: rerun must not duplicate rows; key = (entity_id, as_of_ts)
- Identify and mitigate data leakage and train/serve skew
- Reason about cost: compute, storage, freshness, and join size in feature pipelines
- Describe at least one failure mode: leakage, duplicate features on rerun, schema drift

## The Real Problem This Lecture Solves
- **Organizational failure:** A team trained a model on “clicks in last 7 days” without as_of_ts; each row used all events up to “today”
- **Trigger:** At serving time, only past data was available; train had future data; model accuracy collapsed in production
- **Root cause:** Data leakage; no point-in-time correctness in feature pipeline
- **Takeaway:** Bad feature pipelines don’t just break backtests—they break production models. This lecture is about correct, idempotent feature pipelines.

## The System We Are Building (End-to-End)
- **Domain:** User engagement features for a recommender (clicks, views) feeding training and online serving
- **Raw source:** events (event_id, user_id, event_ts, event_type); partitioned by date; ~100M rows/day
- **Feature compute:** point-in-time aggregation (e.g. clicks_7d per user per as_of_ts); key = (user_id, as_of_ts)
- **Target:** user_features (user_id, as_of_ts, clicks_7d, …); partitioned by as_of_ts; consumed by training and serving
- **Consumers:** Training (batch read by as_of_ts range); serving (lookup by user_id, latest as_of_ts)
- Every later example refers to *this* system unless stated otherwise

## Sources Used (Reference Only)
- sources/Lecture 6,7,8.pdf, sources/Spark.pdf (broader DE context)
- exercises1.md (ETL/ELT, incremental load, idempotency, failure/reprocessing)
- exercises2.md (Module 1: window functions, idempotent pipelines, SCD; Module 3: ingestion, watermark)

## Diagram Manifest
- Slide 15 → week11_lecture_slide08_feature_pipeline_overview.puml → feature pipeline system overview
- Slide 21 → week11_lecture_slide12_execution_flow.puml → offline vs online request flow
- Slide 23 → week11_lecture_slide16_failure_leakage_rerun.puml → failure: leakage and rerun duplicates

## Core Concepts (1/2)
- **Feature:** numeric or categorical input derived from raw data; consumed by model or analytics
- **Feature pipeline:** raw sources → transform (agg, window, join) → feature table or store
- **Point-in-time (as-of):** for a given `as_of_ts`, use only data with `ts <= as_of_ts`; prevents leakage

## Core Concepts (2/2)
- **Offline features:** batch-computed; stored with (entity_id, as_of_ts); used for training
- **Online features:** low-latency lookup by entity_id; often latest snapshot or real-time compute
- **Train/serve consistency:** same definition and data availability at training and serving time

## What Breaks at Scale
- **Leakage at scale:** large event tables joined without as_of_ts → accidental use of future data; hard to audit
- **Duplicate rows:** append-only writes on rerun → duplicate (entity_id, as_of_ts); training and joins wrong
- **Schema drift:** new features added; old jobs or consumers still expect old schema; silent mismatches

## Cost of Naïve Design (Feature Engineering)
- **No as_of_ts in joins:** "clicks in last 7 days" computed with all events up to today ⇒ train sees future; serve sees past only ⇒ model accuracy collapses in production; production cost: silent wrong predictions
- **Append-only on rerun:** job writes (user_id, as_of_ts, clicks_7d) with INSERT; rerun appends same keys ⇒ duplicate rows per (entity_id, as_of_ts) ⇒ wrong aggregates and broken backtests; sink must MERGE or partition overwrite
- **Train/serve skew:** offline feature definition differs from online (e.g. different window, different source) ⇒ model sees different distribution at serve time ⇒ drift and poor performance
- **Engineering rule:** key = (entity_id, as_of_ts); every join filtered by ts ≤ as_of_ts; MERGE or overwrite so rerun does not duplicate; same definition in offline and online paths

## Formal Model: Feature as Function
- Let \( x = f(\text{raw}; \, t) \): feature value at time \( t \) depends only on raw data up to \( t \)
- **No leakage:** \( f \) must not use any event with timestamp \( > t \)
- **Idempotent write:** writing features for (entity_id, as_of_ts) twice yields one row; key = (entity_id, as_of_ts)

## Architectural Fork: Offline vs Online
- **Offline:** batch job computes features for many (entity_id, as_of_ts); write to feature table; training reads by as_of_ts range
- **Online:** serving requests one entity_id; lookup (entity_id, latest) or compute in real time; latency ms
- **Decision rule:** Use offline for training and backtests; use online for real-time APIs; align definitions

## Architectural Fork: MERGE vs Append
- **MERGE/OVERWRITE on (entity_id, as_of_ts):** rerun overwrites same key; one row per key; idempotent
- **Append-only:** rerun inserts again; duplicate rows per key; training and joins wrong
- **Decision rule:** Always key feature table by (entity_id, as_of_ts) and use MERGE or partition overwrite so rerun does not duplicate

## Running Example — Data & Goal
- **Source:** `events` (event_id, user_id, event_ts, event_type); sample: (1, 101, '2025-12-01 10:00', 'click'), (2, 101, '2025-12-02 14:00', 'view'), (3, 102, '2025-12-01 09:00', 'click')
- **Schema:** events: event_id INT, user_id INT, event_ts TIMESTAMP, event_type VARCHAR; user_features: user_id INT, as_of_ts TIMESTAMP, clicks_7d INT
- **Goal:** one row per (user_id, as_of_ts) with feature `clicks_7d` = count of clicks in last 7 days at as_of_ts
- **Engineering objective:** point-in-time correct; idempotent rerun; no duplicates

## Running Example — Step-by-Step (1/4)
- **Step 1:** For each (user_id, as_of_ts), select events where event_ts <= as_of_ts AND event_ts > as_of_ts - 7 days
- Filter event_type = 'click'; count per user_id
- Diagram: week11_lecture_slide08_feature_pipeline_overview.puml

## Running Example — Step-by-Step (2/4)
- **Step 2:** Generate (user_id, as_of_ts) grid; join to event counts; fill 0 where no clicks
- Point-in-time count (pseudocode): for each (user_id, as_of_ts), count events where event_ts <= as_of_ts AND event_ts > as_of_ts - 7d AND event_type = 'click'
- Ensures every (user_id, as_of_ts) has a row; no missing dates

## Running Example — Step-by-Step (3/4)
- **Step 3:** Write to feature table: (user_id, as_of_ts, clicks_7d); key = (user_id, as_of_ts)
- MERGE INTO user_features ON (user_id, as_of_ts) WHEN MATCHED THEN UPDATE SET clicks_7d = source.clicks_7d WHEN NOT MATCHED THEN INSERT
- Partition by as_of_ts (e.g. by day) for efficient training reads and pruning; rerun overwrites same key

## Running Example — Step-by-Step (4/4)
- **Output:** feature table with one row per (user_id, as_of_ts); clicks_7d correct as of that time
- **Trade-off:** full scan of events per as_of_ts window; optimize with partitioned reads and incremental aggregation where possible
- **Conclusion:** point-in-time filter + (entity_id, as_of_ts) key gives correct, rerun-safe features

## Cost & Scaling Analysis (1/3)
- **Time model:** \( T \propto |\text{events}| \times |\text{as_of_ts grid}| \) for naive; reduce by partition pruning on event_ts and as_of_ts
- **Incremental:** recompute only new as_of_ts dates; or append-only events + rolling window to avoid full rescan
- **Example:** 100M events/day, 365 as_of_ts points → naive 36.5B row scans; partition by date and as_of_ts to limit scan

## Cost & Scaling Analysis (2/3)
- **Memory / storage:** feature table size ≈ \( N_{\text{entity}} \times N_{\text{as\_of}} \times (\text{bytes per row}) \); partition and compress
- **Retention:** keep as_of_ts range needed for training backtest; archive or drop older partitions
- **Example:** 10M users × 365 days × 100 B/row ≈ 365 GB; partition by as_of_ts (e.g. month) for pruning

## Cost & Scaling Analysis (3/3)
- **Request flow:** offline = batch read by (entity_ids, as_of_ts range); online = key lookup (entity_id, latest)
- Diagram: week11_lecture_slide12_execution_flow.puml
- **Latency:** offline dominated by scan/partition; online requires index or cache on entity_id

## Pitfalls & Failure Modes (1/3)
- **Leakage:** using future or post-cutoff data when computing feature for as_of_ts; model sees “answer” in training
- **Detection:** audit feature SQL/logic: no table joined without ts <= as_of_ts filter; no global aggregates that include future

## Pitfalls & Failure Modes (2/3)
- **Rerun duplicates:** job writes (user_id, as_of_ts, clicks_7d) with INSERT; rerun appends same keys again; training sees double rows
- **Failure:** duplicate rows per (entity_id, as_of_ts) → wrong aggregates and broken backtests
- Diagram: week11_lecture_slide16_failure_leakage_rerun.puml

## Pitfalls & Failure Modes (3/3)
- **Mitigation:** write with MERGE/OVERWRITE on (entity_id, as_of_ts); or partition overwrite per as_of_ts so rerun replaces same partition
- **Schema drift:** new feature column added; old jobs still write old schema; detection: schema checks and lineage; version feature definitions

## Best Practices (1/2)
- Always key feature table by (entity_id, as_of_ts) for point-in-time and idempotency
- Enforce as_of_ts in every join and filter when reading raw data for features
- Use partition overwrite or MERGE on (entity_id, as_of_ts) so reruns do not duplicate
- Document feature definitions and lineage; test with known dates and spot-check for leakage
- Separate offline (batch) and online (low-latency) paths; align definitions and semantics

## Best Practices (2/2)
- Retain as_of_ts range needed for backtests; archive old partitions to control storage cost
- Validate schema and nullability when adding new features; avoid silent drift
- Monitor feature freshness (max as_of_ts) and job success; alert on duplicate key violations
- Prefer incremental feature compute for new as_of_ts only when event volume is large

## Recap — Engineering Judgment
- **Point-in-time is non-negotiable:** no data with ts > as_of_ts in any join or filter; leakage breaks production models; audit every feature SQL for as_of_ts
- **Key = (entity_id, as_of_ts):** MERGE or partition overwrite so rerun overwrites same key; append-only ⇒ duplicate rows ⇒ wrong training and joins
- **Offline vs online:** same feature definition in both paths; train/serve skew (different window or source) ⇒ silent drift; align definitions and semantics
- **Cost levers:** compute = partition pruning and incremental; storage = partition by as_of_ts and retention; online latency = index or cache on entity_id
- **Failure modes:** leakage (no as_of_ts), rerun duplicates (append), schema drift; mitigate with key design, MERGE, and versioning

## Pointers to Practice
- Compute features from concrete events table with point-in-time aggregation
- Write SQL for feature table and idempotent upsert; reason about rerun and leakage
- Cost: estimate feature table size and join/scan cost; design partition strategy
- Challenge: end-to-end pipeline with leakage pitfall and idempotent fix; use diagram to reason
