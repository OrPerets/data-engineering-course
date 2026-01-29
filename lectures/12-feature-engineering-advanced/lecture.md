# Week 12: Advanced Feature Engineering Pipelines

## Purpose
- Multi-step feature pipelines (DAGs) are the norm in production; ordering and idempotency matter
- Backfill vs incremental trade-offs drive cost and correctness; wrong choice causes duplicates or gaps
- Advanced pipelines combine multiple entities and derived features; failure modes multiply
- Engineering focus: cost models, failure reasoning, and orchestration semantics

## Learning Objectives
- Define advanced feature pipeline: multi-step DAG with entity features, joins, and derived features
- Distinguish backfill (full or range) from incremental (watermark-based) and state when to use each
- Design idempotent writes for backfill: partition overwrite or MERGE so overlapping runs do not duplicate
- Reason about cost: full recompute vs incremental; join cardinality; partition pruning
- Identify failure modes: backfill overlap, aggregation skew, schema version mismatch
- Apply orchestration rules: control table updated only after successful write; single owner per partition
- Describe at least one mitigation: partition overwrite, salting for hot keys, incremental as_of_ts

## Sources Used (Reference Only)
- sources/Lecture 6,7,8.pdf, sources/Spark.pdf (DE context)
- exercises1.md (ETL/ELT, incremental, MERGE, idempotency, failure/reprocessing)
- exercises2.md (Module 1: window functions, idempotent pipelines; Module 3: watermarking, incremental load)

## Diagram Manifest
- Slide 9 → week12_lecture_slide09_advanced_pipeline_overview.puml → advanced feature pipeline (multi-step DAG)
- Slide 15 → week12_lecture_slide15_execution_flow.puml → incremental vs backfill execution flow
- Slide 17 → week12_lecture_slide17_failure_backfill_skew.puml → failure: backfill overlap and aggregation skew

## Core Concepts (1/3)
- **Advanced feature pipeline:** DAG of steps: raw → entity features (e.g. user, item) → join → derived → feature table
- **Entity feature:** computed per (entity_id, as_of_ts); e.g. user clicks_7d, item impressions_7d
- **Derived feature:** computed from other features or joined entities; e.g. ratio, cross-entity signal

## Core Concepts (2/3)
- **Backfill:** compute features for a range of as_of_ts (e.g. full history or [d_start, d_end]); one-time or repair
- **Incremental:** compute only new as_of_ts (e.g. last_as_of_ts + 1 day); daily job; watermark in control table
- **Orchestration:** order of steps; when to update watermark; who owns which partition to avoid overlap

## Core Concepts (3/3)
- **Idempotent backfill:** writing the same (entity_id, as_of_ts) range twice yields one row per key; use partition overwrite or MERGE
- **Single owner per partition:** only one job writes a given as_of_ts partition; prevents duplicate keys from overlapping backfills
- **What breaks at scale:** backfill overlap → duplicates; skew in aggregation → OOM; schema drift → silent wrong values

## Watermark and Control Table
- **Watermark:** last_as_of_ts stored in control table; incremental job computes only as_of_ts > last_as_of_ts (e.g. +1 day)
- **Update rule:** update last_as_of_ts and last_run_ts **only after** successful write; otherwise next run skips that as_of_ts (gap)
- **Backfill:** does not advance watermark; writes explicit range; overwrites only those partitions

## Partition Overwrite Semantics
- **Partition overwrite:** write step writes only to partition \( p = \text{as\_of\_ts} \) (e.g. by day); rerun overwrites same partition \( p \)
- **Idempotent:** same partition overwritten; no append; one row per key in that partition
- **Overlap fix:** two backfill jobs writing same partition both overwrite; second run overwrites first; final state = second run (deterministic if same logic)

## Formal Model: Pipeline as DAG
- Steps \( S_1, \ldots, S_k \); each \( S_i \) reads from sources or prior steps; outputs to next step or feature table
- **Ordering:** entity features before join; join before derived; write after all computes for that partition
- **Correctness:** every step respects point-in-time (no data with ts > as_of_ts); write key = (entity_id, as_of_ts) or composite

## Formal Model: Idempotent Write
- **Idempotent:** writing features for key \( k = (\text{entity\_id}, \text{as\_of\_ts}) \) twice yields one row for \( k \)
- **MERGE:** ON target.key = source.key; WHEN MATCHED UPDATE; WHEN NOT MATCHED INSERT; rerun overwrites same key
- **Partition overwrite:** write only to partition \( p = \text{as\_of\_ts} \); rerun overwrites partition \( p \); no append

## Running Example — Schema & Sample
- **events:** event_id INT, user_id INT, item_id INT, event_ts TIMESTAMP, event_type VARCHAR; partitioned by date(event_ts)
- **user_features (intermediate):** user_id INT, as_of_ts TIMESTAMP, clicks_7d INT, views_7d INT
- **item_features (intermediate):** item_id INT, as_of_ts TIMESTAMP, impressions_7d INT
- **feature_table (target):** user_id INT, item_id INT, as_of_ts TIMESTAMP, clicks_7d, views_7d, impressions_7d, ctr_7d; key (user_id, item_id, as_of_ts)

## Running Example — Data & Goal
- **Sources:** events (event_id, user_id, item_id, event_ts, event_type); users (user_id, signup_ts); items (item_id, created_ts)
- **Sample events:** (1, 101, 201, '2025-12-01 10:00', 'click'), (2, 101, 201, '2025-12-02 14:00', 'view'), (3, 102, 201, '2025-12-01 09:00', 'click')
- **Goal:** feature table (user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d, ctr_7d) for training/serving
- **Engineering objective:** point-in-time; idempotent backfill and incremental; no duplicate (user_id, item_id, as_of_ts)

## Running Example — Step-by-Step (1/4)
- **Step 1:** Compute user features: (user_id, as_of_ts, clicks_7d, views_7d) from events with event_ts <= as_of_ts and 7d window
- **Step 2:** Compute item features: (item_id, as_of_ts, impressions_7d) from events; same point-in-time filter
- Diagram: week12_lecture_slide09_advanced_pipeline_overview.puml

## Running Example — Step-by-Step (2/4)
- **Step 3:** Generate (user_id, item_id, as_of_ts) grid from distinct user–item pairs and as_of_ts dates
- Join user features and item features on (user_id, as_of_ts) and (item_id, as_of_ts); point-in-time: only users/items where signup_ts, created_ts <= as_of_ts
- Fill 0 for missing counts; compute derived: ctr_7d = clicks_7d / NULLIF(impressions_7d, 0)

## Running Example — Step-by-Step (3/4)
- **Step 4:** Write to feature table; key = (user_id, item_id, as_of_ts)
- **Idempotent write:** MERGE ON (user_id, item_id, as_of_ts) WHEN MATCHED UPDATE WHEN NOT MATCHED INSERT; or overwrite partition by as_of_ts
- Partition feature table by as_of_ts (e.g. by day or month) for training reads and backfill scope

## Running Example — Step-by-Step (4/4)
- **Output:** one row per (user_id, item_id, as_of_ts) with clicks_7d, views_7d, impressions_7d, ctr_7d
- **Trade-off:** join size = |users| × |items| × |as_of_ts| can explode; restrict grid to observed pairs or sample
- **Conclusion:** multi-step pipeline with entity features → join → derived → MERGE/overwrite gives correct, rerun-safe features

## Running Example — Idempotent Write
- **MERGE:** ON (user_id, item_id, as_of_ts); WHEN MATCHED UPDATE all feature columns; WHEN NOT MATCHED INSERT; rerun overwrites same key
- **Partition overwrite:** write only rows for as_of_ts = '2025-12-02'; overwrite partition p = 2025-12-02; rerun overwrites p again; one row per key in p
- **Control table:** after successful MERGE, update last_as_of_ts = '2025-12-02'; next incremental run computes only 2025-12-03

## When to Use Backfill vs Incremental
- **Incremental:** daily (or hourly) pipeline; new as_of_ts only; low cost; use control table and watermark
- **Backfill:** one-time full load; repair after bug; new feature definition for history; explicit range [d1, d2]
- **Rule:** incremental for steady state; backfill for bootstrap or repair; never mix both writing same partition without overwrite

## Backfill vs Incremental (Summary Table)
| Aspect | Incremental | Backfill |
|--------|-------------|----------|
| Trigger | Watermark (last_as_of_ts + 1 day) | Explicit range [d1, d2] |
| Cost | O(events in window) × 1 day | O(events) × (d2 − d1) |
| Watermark | Advance after success | Do not advance |
| Write | MERGE or overwrite partition | Overwrite partitions d1..d2 |
| Use case | Daily pipeline | Bootstrap, repair, new feature |

## Cost & Scaling Analysis (1/3)
- **Time model (naive):** \( T \propto |\text{events}| \times |\text{as\_of\_ts}| \) per entity type; multiplied by number of entity feature steps
- **Backfill:** \( T_{\text{backfill}} \propto |\text{events}| \times (d_2 - d_1) \); full history = \( |\text{events}| \times N_{\text{days}} \)
- **Incremental:** \( T_{\text{incr}} \propto |\text{events in window}| \times 1 \); bounded by one day (or batch) of events

## Cost & Scaling Analysis (2/3)
- **Memory / storage:** feature table size ≈ \( N_{\text{user}} \times N_{\text{item}} \times N_{\text{as\_of}} \times \text{bytes/row} \); often reduced by storing only observed (user, item) per as_of_ts
- **Join cardinality:** grid of all (user_id, item_id, as_of_ts) can be huge; prefer join only (user, item) pairs that appear in events for that window
- **Partition retention:** keep as_of_ts range needed for backtests; archive or drop older partitions to control storage

## Join Size Reasoning
- **Full grid:** \( |\text{users}| \times |\text{items}| \times |\text{as\_of\_ts}| \) rows; e.g. 10M × 1M × 365 = 3.65e12 rows (infeasible)
- **Observed pairs:** restrict grid to (user_id, item_id) that appear in events in the window; typically \( \ll \) full Cartesian product
- **Engineering rule:** build grid from SELECT DISTINCT user_id, item_id FROM events WHERE event_ts IN window; then cross join as_of_ts

## Quantitative Cost Comparison
- **Example:** 100M events/day, 365 as_of_ts, 10M users, 1M items. Naive backfill: 100M × 365 ≈ 36.5B row scans per entity step.
- **Incremental (1 day):** 100M × 1 ≈ 100M row scans per entity step; partition pruning on event_ts and as_of_ts limits scan.
- **Join:** full grid 10M × 1M × 365 ≈ 3.65e12; observed pairs ~5M/day × 365 ≈ 1.8e9 rows (feasible).

## Cost & Scaling Analysis (3/3)
- **Execution flow:** incremental = read watermark → compute new as_of_ts → MERGE/overwrite that partition → update watermark
- **Backfill flow:** request range [d1, d2] → compute all (entity, as_of_ts) in range → overwrite partitions d1..d2; no watermark advance
- Diagram: week12_lecture_slide15_execution_flow.puml

## Pitfalls & Failure Modes (1/3)
- **Backfill overlap:** two jobs write same as_of_ts range (e.g. d3–d5); both use INSERT → duplicate rows per (user_id, item_id, as_of_ts)
- **Impact:** training sees double counts; joins wrong; metrics invalid
- **Prevention:** single owner per partition; use partition overwrite or MERGE so second write replaces same key

## Pitfalls & Failure Modes (2/3)
- **Aggregation skew:** one entity (e.g. user_888) has orders of magnitude more events; single reducer gets 1B rows → OOM or timeout
- **Failure:** job fails or straggler; entire pipeline blocked
- Diagram: week12_lecture_slide17_failure_backfill_skew.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor duplicate key violations; profile reducer input sizes; alert on job duration spikes
- **Mitigation (overlap):** MERGE or overwrite by partition; control table updated only after successful write; backfill jobs use explicit range and overwrite only that range
- **Mitigation (skew):** salt hot keys (e.g. user_888 → user_888_1..N); or limit window per entity; or incremental per entity

## Schema Version and Drift
- **Schema drift:** new feature column added; old job still writes old schema; consumers expect new column → null or mismatch
- **Detection:** schema checks on write; lineage and version tags; alert on column count or type change
- **Mitigation:** version feature definitions; backfill with new schema for historical partitions; validate schema before release

## Best Practices (1/2)
- Design pipeline as DAG: entity features first, then join, then derived, then write; document dependencies
- Key feature table by (entity_id, as_of_ts) or (user_id, item_id, as_of_ts); always MERGE or partition overwrite for idempotency
- Use control table for incremental: last_as_of_ts, last_run_ts; update only after successful write to avoid gaps
- Backfill: overwrite only the requested as_of_ts partitions; do not mix incremental and backfill writing same partition

## Best Practices (2/2)
- Limit join size: build grid from observed (user, item) pairs in window, not full Cartesian product
- Profile for skew: monitor reducer or partition sizes; add salting or split for hot entities
- Version feature definitions and schema; validate schema on write; alert on duplicate key or schema mismatch
- Retain as_of_ts range needed for training; archive old partitions; document backfill and incremental runbooks

## Orchestration Order
- **Step order:** read control (watermark) → compute entity features → join → derived → write → update control
- **Critical:** update control only after write succeeds; otherwise next run skips as_of_ts (gap)
- **Backfill:** no control read; compute range [d1, d2] → overwrite partitions d1..d2; do not update watermark

## Detection and Mitigation Summary
- **Overlap:** detection = duplicate key violations or row count spike; mitigation = MERGE or partition overwrite; single owner per partition
- **Skew:** detection = reducer input size profile; mitigation = salting, split hot keys, limit window
- **Gap (watermark too early):** detection = missing as_of_ts in feature table; mitigation = update control only after successful write

## Recap
- Advanced pipelines are multi-step DAGs: entity features → join → derived → feature table; ordering and idempotency are critical
- Backfill vs incremental: backfill for full/range; incremental for daily new as_of_ts; single owner per partition
- Cost: backfill O(events × range); incremental O(events in window); join cardinality and skew drive memory and time
- Failure modes: backfill overlap → duplicates; skew → OOM; mitigation: partition overwrite/MERGE, salting, control table after success
- Best practice: key by (entity, as_of_ts); MERGE/overwrite; update watermark only after write; limit grid size

## Pointers to Practice
- Build multi-step feature pipeline from events to (user_id, item_id, as_of_ts) with point-in-time aggregation and MERGE
- Design incremental vs backfill: control table, watermark, partition overwrite; reason about rerun and overlap
- Cost: estimate feature table size and backfill time; partition pruning; join size reduction
- Challenge: backfill overlap scenario and idempotent fix; skew case and mitigation; use diagram to reason
