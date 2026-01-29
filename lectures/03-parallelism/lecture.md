# Week 3: Parallelism and Divide-and-Conquer

## Purpose
- Why parallelism and divide-and-conquer matter in data engineering
- Single-node limits force distribution of work
- Foundation for MapReduce and distributed processing

## Learning Objectives
- Define divide-and-conquer and its three phases
- Distinguish parallelism from concurrency
- Express pure functions and independence for distribution
- Trace a full MapReduce-style job
- Compute work, span, and speedup
- Identify data skew and hot keys as failure modes
- Describe mitigations: combiner, custom partitioner, salting

## Diagram Manifest
- Slide 13 → week3_lecture_slide13_system_overview.puml
- Slide 22 → week3_lecture_slide22_execution_flow.puml
- Slide 38 → week3_lecture_slide38_failure_skew.puml

## Core Concepts (1/2) — Constraints

## Divide-and-Conquer
- Split problem into subproblems, solve independently, combine
- **Constraint:** no shared state across chunks
- **Divide:** partition input
- **Conquer:** same function per chunk
- **Combine:** group by key

## Parallelism vs Concurrency
- **Parallelism:** simultaneous execution on multiple cores
- **Concurrency:** overlapping (may be time-sliced)
- **Map:** one output per input; no cross-record state
- **Pure functions** enable safe distribution

## Core Concepts (2/2) — Why Systems Break

## Determinism and Scalability
- **Determinism:** same input ⇒ same output
- **Violation** (shared state, time-dependent logic) ⇒ wrong results
- **Scalability:** more workers ⇒ more throughput
- **Until** shuffle or skew dominates

## Shuffle and Coordination
- **Shuffle cost:** network and disk I/O to group by key
- **Skew:** one key ⇒ one reducer overloaded ⇒ OOM
- **Coordination:** fault tolerance, stragglers, partial failures
- **Design for them**

## Cost of Naïve Design (Parallelism)

## What Goes Wrong (1/2)
- **Naïve:** "just add more workers"
- **Shuffle** and **skew** often dominate
- More workers ⇒ more shuffle traffic
- **Cost explosion**

## What Goes Wrong (2/2)
- **Naïve:** shared state or order-dependent logic
- ⇒ **Non-determinism**, wrong results on rerun
- **Naïve:** ignore key distribution
- Hot key **overloads one reducer**; job latency = slowest task
- **Takeaway:** minimize shuffle, balance partitions, pure functions

## Running Example — Data & Goal
- **Input:** lines of text
- Sample: "the quick brown fox"; "the quick brown dog"
- "quick brown fox jumps"
- **Goal:** word count — (word, count)

## Running Example — Step-by-Step (1/4)
- **Step 1: Map** — each record independently
- Emit `(word, 1)` per word
- R1: (the,1),(quick,1),(brown,1),(fox,1)
- R2: (the,1),(quick,1),(brown,1),(dog,1)
- R3: (quick,1),(brown,1),(fox,1),(jumps,1)

## Running Example — Step-by-Step (2/4)
- **Step 2: Shuffle** — framework sends same key to same reducer
- **Grouped:** the→[1,1], quick→[1,1,1], brown→[1,1,1]
- fox→[1,1], dog→[1], jumps→[1]
- Main network and I/O cost in this phase

## Data Context: Word-Count Input (Records 1–3)
- R1: "the quick brown fox"
- R2: "the quick brown dog"
- R3: "quick brown fox jumps"
- Map emits (word, 1) per token

## In-Lecture Exercise 1: Map Outputs & Shuffle Groups
- Write map outputs for R1–R3
- Group by key after shuffle
- Do not reduce yet

## In-Lecture Exercise 1: Solution (1/2)
- R1: (the,1),(quick,1),(brown,1),(fox,1)
- R2: (the,1),(quick,1),(brown,1),(dog,1)
- R3: (quick,1),(brown,1),(fox,1),(jumps,1)

## In-Lecture Exercise 1: Solution (2/2)
- the→[1,1]
- quick→[1,1,1]
- brown→[1,1,1]
- fox→[1,1], dog→[1], jumps→[1]

## In-Lecture Exercise 1: Takeaway
- Map outputs are independent and deterministic
- Shuffle groups define reducer input size
- Correct grouping is required for correct reduce

## Running Example — Step-by-Step (3/4)
- **Step 3: Reduce** — each reducer gets one key and values
- Sum the values
- **Output:** (the,2), (quick,3), (brown,3)
- (fox,2), (dog,1), (jumps,1)

## Running Example — Step-by-Step (4/4)
- **Result:** word-count table; correct and deterministic
- **Trade-off:** shuffle moves data
- Skew can overload one reducer
- Pattern scales to TB (MapReduce)

## From Example to Pipeline
- Same pattern: divide → conquer → combine
- Next: system view of parallel pipeline
- Then cost and failure

## Parallel Pipeline Overview
- Divide: split input into chunks; assign to workers
- Parallel workers: map (or local combine) on each chunk
- Combine: shuffle groups by key; reducers aggregate
![](../../diagrams/week03/week3_lecture_slide13_system_overview.png)

## Cost & Scaling Analysis (1/3)

## Time Model
- **Work \(W\):** total operations over all workers
- **Span \(S\):** critical path; longest dependency chain
- **Speedup:** \(W/S\) with enough workers
- Upper bound = number of workers

## Cost & Scaling Analysis (2/3)

## Memory and Storage
- **Map:** each task holds one record + emitted (k,v)
- Bounded per task
- **Shuffle:** all (k,v) written to disk/network
- Peak ≈ size of map output
- **Reduce:** one key's values in memory; skew ⇒ OOM

## Cost & Scaling Analysis (3/3)

## Network and Throughput
- **Shuffle traffic:** ≈ size of map output
- **Bottleneck:** link bandwidth and disk I/O
- Often limits scale more than CPU
- **Latency:** job time ≈ map + shuffle + reduce
- Shuffle usually dominates

## Example: Work and Span
- 1B records, 10 words each ⇒ 10B map emits
- 1M distinct words ⇒ 1M reduce tasks
- Map takes 100 ns/record ⇒ 100 s work
- With 1000 workers ⇒ ~0.1 s map phase (ideal)

## Shuffle Size and Network Cost
- Shuffle bytes ≈ map output size
- Every (k,v) sent over network to reducer
- Example: 10B emits × 20 B/pair ⇒ 200 GB shuffle
- At 10 Gbps ⇒ ~160 s minimum
- Combiners reduce map output before shuffle

## In-Lecture Exercise 2: Shuffle Size Estimation
- 10 lines, ~4 words/line ⇒ 40 map emits
- Each (word,1) is 20 bytes
- Compute total shuffle size
- With 5 reducers, estimate bytes per reducer
- If "the" appears in 8 lines, how many pairs for that key?

## In-Lecture Exercise 2: Solution (1/2)
- Total map output: 40 × 20 B = 800 B
- Shuffle size equals map output: 800 B
- Even split: 800 / 5 ≈ 160 B per reducer

## In-Lecture Exercise 2: Solution (2/2)
- "the" appears 8 times ⇒ 8 (k,v) pairs
- All 8 pairs go to one reducer for key "the"
- That reducer receives 8 × 20 B = 160 B

## In-Lecture Exercise 2: Takeaway
- Shuffle size is dominated by map output
- Even distribution is an assumption, not a guarantee
- Hot keys concentrate bytes on one reducer

## Reducer Memory and Skew Risk
- Each reducer holds one key's value list in memory
- Skew ⇒ one list huge ⇒ OOM
- Mitigation: combiner, salting, custom partitioner

## Cost Summary
- **Work:** total CPU
- **Span:** critical path
- **Shuffle:** network and disk I/O
- **Skew:** one partition dominates
- Engineering: minimize shuffle, balance partitions

## Execution Flow: Map–Shuffle–Reduce
- Map reads records, emits (k,v)
- Shuffle groups by key
- Reduce aggregates per key
![](../../diagrams/week03/week3_lecture_slide22_execution_flow.png)

## Pitfalls & Failure Modes (1/3)

## Shared State and Stragglers
- Map or reduce with global state is not deterministic
- One slow worker (straggler) delays the whole job
- Causes: skew, GC, network, disk
- Mitigation: speculative execution, better partitioning

## Pitfalls: Non-determinism
- Reruns must yield same result
- Shared state breaks this
- Design: pure map/reduce, deterministic key derivation
- Idempotent writes

## Stragglers: Causes and Impact
- One task runs much longer than others
- Job latency = slowest task
- Causes: data skew, GC pauses, network, disk contention
- Mitigation: speculative execution, partition balance

## Skew: Hot Key and Hot Partition
- **Hot key:** one key has majority of values
- E.g. bot user_id, null bucket
- **Real data is often Zipfian**
- **Hot partition:** one reducer gets most data ⇒ OOM
- **Job latency = slowest reducer**

## In-Lecture Exercise 4: Hot Key Skew Impact
- Clicks join Users on user_id
- user_id 888 has 1B clicks; others < 1K each
- Hash to 1,000 reducers by user_id
- Each click is 100 B
- Compute reducer load and data size for key 888

## In-Lecture Exercise 4: Solution (1/2)
- All 1B clicks for 888 go to one reducer
- Data size: 1B × 100 B = 100 GB
- That reducer becomes the straggler

## In-Lecture Exercise 4: Solution (2/2)
- 100 GB exceeds typical reducer memory
- OOM or timeouts likely while others finish early
- Job latency dominated by that one reducer

## In-Lecture Exercise 4: Takeaway
- Skew turns parallel jobs into single-task bottlenecks
- Hot keys must be detected and mitigated early
- Salting or custom partitioners are standard fixes

## Skew Detection
- Per-partition size after shuffle
- Reducer runtimes
- Alert if max ≫ median
- P99 reducer time, spill count

## Mitigation 1: Combiner
- Local pre-aggregation on map side before shuffle
- For sum/count: combine (k,v1),(k,v2) → (k,v1+v2)
- Reduces shuffle size
- Only when reduce is associative and commutative

## In-Lecture Exercise 3: Combiner Impact
- Word count with 40 map emits
- After combining, emits drop to 15
- Each (k,v) is 20 bytes
- Compute new shuffle size
- State why combiner is valid for word count

## In-Lecture Exercise 3: Solution (1/2)
- New shuffle size: 15 × 20 B = 300 B
- Reduction from 800 B to 300 B

## In-Lecture Exercise 3: Solution (2/2)
- Word count sum is associative and commutative
- Local sums equal global sum after shuffle

## In-Lecture Exercise 3: Takeaway
- Combiners shrink shuffle without changing results
- Only safe for associative, commutative reducers
- Always validate reducer math before combining

## Mitigation 2: Salting (Split Hot Key)
- Append random suffix: (k,v) → (k-salt,v)
- Spread across reducers
- Small table: replicate key to all salt buckets
- Second pass to combine results per original key

## Mitigation 3: Custom Partitioner
- Default: hash(key) mod R
- Custom: route hot keys to dedicated reducers or spread
- Combine with salting for hot key splits
- Trade-off: more reducers, more merge logic

## Skew Mitigation Trade-offs
- Combiner: free if reduce is associative
- Salting: increases replication and merge cost
- Custom partitioner: requires key knowledge

## Failure in Production
- **Reducer OOM:** one key's value list exceeds heap
- Fix: salting or increase memory
- **Timeout:** single reducer runs too long
- Fix: split partition, combiner, salting
- **Detection:** monitor heap, GC, task duration

## Failure Scenario: Data Skew (Hot Key)
- Hash partitioning sends same key to same reducer
- Hot key ⇒ one reducer gets huge input ⇒ OOM
- Other reducers finish quickly; job waits or fails
![](../../diagrams/week03/week3_lecture_slide38_failure_skew.png)

## Pitfalls & Failure Modes (3/3)

## Detection and Mitigation
- **Detection:** per-partition sizes and reducer runtimes
- **Combiner:** local pre-aggregation before shuffle
- **Custom partitioner / salting:** spread hot key across reducers

## Best Practices
- Keep map and reduce pure (no shared mutable state)
- Minimize shuffle size: reduce key size, use combiners
- Partition by key so related data lands together
- Avoid skew via salting if needed
- Design for idempotency and reruns
- Monitor skew and stragglers
- Prefer smaller, bounded reduce groups
- Document key schema and partitioning strategy

## Recap (Engineering Judgment)
- **Divide-and-conquer:** divide → conquer → combine
- **Constraint:** no shared state; pure functions
- **Shuffle is the bottleneck** — network and disk I/O
- **Skew and hot keys** cause reducer OOM
- **Design for Zipfian key distribution**
- **Cost reasoning:** work, span, shuffle size
- **Constraints drive design**

## Pointers to Practice
- Run full manual MapReduce on 8–12 input records
- Compute shuffle size and reducer input size
- Solve one skew scenario and mitigation
- Reason about cost when one key dominates

## Additional Diagrams
### Practice: Skew Mitigation
![](../../diagrams/week03/week3_practice_slide18_skew_mitigation.png)
