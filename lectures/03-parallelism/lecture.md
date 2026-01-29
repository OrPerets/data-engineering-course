# Week 3: Parallelism and Divide-and-Conquer

## Purpose
- Why parallelism and divide-and-conquer matter in data engineering
- Single-node limits force distribution of work
- Foundation for MapReduce and distributed processing

## Learning Objectives
- Define divide-and-conquer and its three phases: divide, conquer, combine
- Distinguish parallelism (simultaneous execution) from concurrency (overlapping)
- Express pure functions and independence as basis for distributed computation
- Trace a full MapReduce-style job: map emits, shuffle groups, reduce aggregates
- Compute work, span, and speedup for simple parallel decompositions
- Identify data skew and hot keys as failure modes
- Describe mitigations: combiner, custom partitioner, salting

## Sources Used (Reference Only)
- sources/Lecture 3.pptx
- sources/Introduction to MapReduce.pdf

## Diagram Manifest
- Slide 13 → week3_lecture_slide13_system_overview.puml → parallel pipeline overview
- Slide 22 → week3_lecture_slide22_execution_flow.puml → map-shuffle-reduce execution flow
- Slide 38 → week3_lecture_slide38_failure_skew.puml → failure: data skew, hot reducer

## Core Concepts (1/2)
- **Divide-and-conquer:** split problem into subproblems, solve independently, combine results
- **Parallelism:** simultaneous execution; **concurrency:** overlapping (may be time-sliced)
- **Divide:** partition input into chunks; no shared state; **Conquer:** same function per chunk; **Combine:** group by key
- Map: one output per input record; no cross-record state; pure functions enable safe distribution

## Core Concepts (2/2)
- **Determinism:** same input ⇒ same output (pure map/reduce); **Scalability:** more workers ⇒ more throughput until shuffle/skew
- **Shuffle cost:** network and disk I/O to group by key; **Skew:** one key ⇒ one reducer overloaded
- **Coordination:** fault tolerance, stragglers, partial failures

## Running Example — Data & Goal
- **Input:** lines of text; sample: "the quick brown fox"; "the quick brown dog"; "quick brown fox jumps"
- **Goal:** word count — (word, count); used for search, analytics, indexing

## Running Example — Step-by-Step (1/4)
- **Step 1: Map** — each record independently; emit `(word, 1)` per word
- **Map outputs:** R1: (the,1),(quick,1),(brown,1),(fox,1); R2: (the,1),(quick,1),(brown,1),(dog,1); R3: (quick,1),(brown,1),(fox,1),(jumps,1)

## Running Example — Step-by-Step (2/4)
- **Step 2: Shuffle** — framework sends same key to same reducer
- **Grouped:** the→[1,1], quick→[1,1,1], brown→[1,1,1], fox→[1,1], dog→[1], jumps→[1]
- Main network and I/O cost in this phase

## Running Example — Step-by-Step (3/4)
- **Step 3: Reduce** — each reducer gets one key and list of values; sum the values
- **Output:** (the,2), (quick,3), (brown,3), (fox,2), (dog,1), (jumps,1)

## Running Example — Step-by-Step (4/4)
- **Result:** word-count table; correct and deterministic
- **Trade-off:** shuffle moves data; skew can overload one reducer; pattern scales to TB (MapReduce)

## From example to pipeline
- Same pattern: divide (split input) → conquer (map per chunk) → combine (shuffle + reduce)
- Next: system view of parallel pipeline; then cost and failure

## Parallel Pipeline Overview
- Divide: split input into chunks; assign to workers
- Parallel workers: map (or local combine) on each chunk
- Combine: shuffle groups by key; reducers aggregate
- Diagram: week3_lecture_slide13_system_overview.puml

## Cost & Scaling Analysis (1/3)

## Time model
- **Work \(W\):** total operations over all workers (e.g. sum of map + reduce ops)
- **Span \(S\):** critical path; longest chain of dependencies
- **Speedup:** \(W/S\) with enough workers; upper bound = number of workers

## Cost & Scaling Analysis (2/3)

## Memory and storage
- **Map:** each task holds one record (or chunk) + emitted (k,v); bounded per task
- **Shuffle:** all (k,v) written to disk/network; peak ≈ size of map output
- **Reduce:** one key’s values in memory; skew ⇒ one reducer can OOM

## Cost & Scaling Analysis (3/3)

## Network and throughput
- **Shuffle traffic:** ≈ size of map output (every (k,v) sent to reducer)
- **Bottleneck:** link bandwidth and disk I/O; often limits scale more than CPU
- **Latency:** job time ≈ map time + shuffle time + reduce time; shuffle usually dominates

## Example: work and span (back-of-envelope)
- 1B records, 10 words each ⇒ 10B map emits; 1M distinct words ⇒ 1M reduce tasks
- If map takes 100 ns/record ⇒ 100 s work; with 1000 workers ⇒ ~0.1 s map phase (ideal)

## Shuffle size and network cost
- Shuffle bytes ≈ map output size; every (k,v) sent over network to reducer
- Example: 10B emits × 20 B/pair ⇒ 200 GB shuffle; at 10 Gbps ⇒ ~160 s minimum
- Often the dominant cost; combiners reduce map output before shuffle

## Reducer memory and skew risk
- Each reducer holds one key’s value list in memory; skew ⇒ one list huge ⇒ OOM
- Mitigation: combiner (local pre-aggregate), salting (spread hot key), custom partitioner

## Cost summary: what drives scalability
- **Work:** total CPU; **Span:** critical path; **Shuffle:** network and disk I/O
- **Skew:** one partition dominates; limits parallelism and causes failures
- Engineering: minimize shuffle, balance partitions, monitor per-partition sizes

## Execution flow: map, shuffle, reduce (overview)
- Map: read records, emit (k,v); Shuffle: group by key, transfer to reducers; Reduce: aggregate per key
- Diagram next: end-to-end flow from records to output

## Execution Flow (Map–Shuffle–Reduce)
- Map reads records, emits (k,v); shuffle groups by key; reduce aggregates per key
- Diagram: week3_lecture_slide22_execution_flow.puml

## Pitfalls & Failure Modes (1/3)

## Common pitfall: shared state and stragglers
- Map or reduce that depends on global state or order is not deterministic
- One slow worker (straggler) delays the whole job; causes: skew, GC, network, disk
- Mitigation: speculative execution, better partitioning, pure functions

## Pitfalls: non-determinism and reruns
- Reruns or different partitioning must yield same result; shared state breaks this
- Design: pure map/reduce, deterministic key derivation, idempotent writes

## Stragglers: causes and impact
- One task runs much longer than others; job latency = slowest task
- Causes: data skew (one partition huge), GC pauses, network, disk contention
- Mitigation: speculative execution (rerun slow tasks), better partition balance

## Skew: hot key and hot partition
- Hot key: one key has majority of values (e.g. bot user_id, null bucket)
- Hot partition: one reducer gets most data ⇒ OOM or timeout
- Zipfian key distribution in real data often causes skew

## Detection: per-partition size and runtime
- Monitor size of each partition after shuffle; alert if max ≫ median
- Monitor reducer runtimes; one reducer much slower ⇒ skew or straggler
- Metrics: partition size distribution, P99 reducer time, spill count

## Mitigation 1: Combiner
- Local pre-aggregation on map side before sending to shuffle
- For sum/count: combine (k,v1),(k,v2) → (k,v1+v2); reduces shuffle size
- Only when reduce function is associative and commutative

## Mitigation 2: Salting (split hot key)
- Append random suffix to hot key: (k,v) → (k-salt,v); spread across reducers
- Small table: replicate key to all salt buckets for join correctness
- Second pass or merge step to combine results per original key

## Mitigation 3: Custom partitioner
- Default: hash(key) mod R; custom: route known hot keys to dedicated reducers or spread
- Can combine with salting: partition by (key, salt) so hot key splits across reducers
- Trade-off: more reducers, more merge logic; less OOM and latency

## Skew mitigation trade-offs
- Combiner: free if reduce is associative; reduces network and reducer load
- Salting: increases small-table replication and merge cost; unblocks skew
- Custom partitioner: requires key knowledge; balances load

## Failure in production: OOM and timeout
- Reducer OOM: one key’s value list exceeds heap; fix: salting or increase memory
- Timeout: single reducer runs too long; fix: split partition, combiner, salting
- Detection: monitor heap, GC, task duration; alert on outliers

## Summary: failure modes so far
- Non-determinism and stragglers; skew and hot key; detection and mitigations
- Next: diagram of skew failure (one reducer overloaded)

## Skew failure: one reducer gets most data
- Hash partitioning sends same key to same reducer; hot key ⇒ one reducer gets huge input
- That reducer: OOM (cannot hold all values) or timeout (too long to process)
- Other reducers finish quickly; job waits for the hot one or fails

## Visual: skew failure (next slide)
- Diagram shows: balanced reducers R1, R2; hot reducer R3 with one key and huge value list
- R3 → OOM or timeout; mitigation (salting, combiner) shown in practice

## Pitfalls & Failure Modes (2/3): skew failure scenario
- Central failure mode in distributed aggregation: one key dominates
- Next: diagram of hot reducer and OOM/timeout

## Failure scenario: data skew (hot key)
- One key (e.g. user_id of a bot) gets a huge fraction of values
- One reducer receives almost all data ⇒ OOM or extreme latency
- Diagram: week3_lecture_slide38_failure_skew.puml

## Pitfalls & Failure Modes (3/3)

## Detection and mitigation
- **Detection:** monitor per-partition sizes and reducer runtimes; alert on outliers
- **Combiner:** local pre-aggregation before shuffle to cut data volume
- **Custom partitioner / salting:** spread hot key across multiple reducers; then merge

## Best Practices
- Keep map and reduce pure (no shared mutable state)
- Minimize shuffle size: reduce key size, use combiners where correct
- Partition by key so related data lands together; avoid skew via salting if needed
- Design for idempotency and reruns (deterministic output)
- Monitor skew and stragglers; set resource and timeout limits
- Prefer smaller, bounded reduce groups to avoid OOM
- Document key schema and partitioning strategy for operators

## Recap
- Divide-and-conquer: divide → conquer → combine; basis for distributed processing
- Parallelism ≠ concurrency; pure functions enable safe distribution
- Map emits (k,v); shuffle groups by key; reduce aggregates; shuffle is the bottleneck
- Skew and hot keys cause reducer OOM or timeout; use combiners and salting
- Cost reasoning: work, span, shuffle size, and network drive scalability

## Pointers to Practice
- Run a full manual MapReduce (map → shuffle → reduce) on 8–12 input records
- Compute shuffle size and reducer input size for a given input and key distribution
- Solve one skew scenario and one mitigation (e.g. salting or combiner)
- Reason about cost and failure when one key dominates the data
