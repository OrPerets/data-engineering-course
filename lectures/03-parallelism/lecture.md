# Week 3: Parallelism and Divide-and-Conquer

## Purpose
- Why parallelism and divide-and-conquer matter in data engineering
- Single-node limits force distribution of work
- Foundation for distributed batch and streaming processing

## Learning Objectives
- Define divide-and-conquer and its three phases
- Distinguish parallelism from concurrency
- Express pure functions and independence for distribution
- Trace a parallel dataflow job (partition → group → merge)
- Compute work, span, and speedup
- Identify data skew and hot keys as failure modes
- Describe mitigations: local aggregation, partitioning, salting

## Diagram Manifest
- Slide 13 → week3_lecture_slide13_system_overview.puml
- Slide 22 → week3_lecture_slide22_execution_flow.puml
- Slide 38 → week3_lecture_slide38_failure_skew.puml

## Core Concepts (1/2) — Constraints: Divide-and-Conquer
- Split problem into subproblems, solve independently, combine
- **Constraint:** no shared state across chunks
- **Divide:** partition input
- **Conquer:** same function per chunk
- **Combine:** group by key

## Parallelism vs Concurrency
- **Parallelism:** simultaneous execution on multiple cores
- **Concurrency:** overlapping (may be time-sliced)
- **Pure functions** enable safe distribution

## Processes, Threads, and Virtualization
- **Process:** isolated memory + OS resources; higher startup cost
- **Thread:** shared memory within a process; cheaper to spawn
- **Context switch:** OS saves/restores state to share CPU among tasks
- **Scheduler:** decides which threads run on which cores
- **Virtualization:** abstract hardware for isolation
  - **VMs:** full OS per guest; strong isolation, more overhead
  - **Containers:** shared host kernel; lighter isolation, faster startup
- **Practical impact:** thread-heavy workloads need careful locking; process-heavy workloads need efficient IPC and batching

## Core Concepts (2/2) — Why Systems Break: Determinism and Scalability
- **Determinism:** same input ⇒ same output
- **Violation** (shared state, time-dependent logic) ⇒ wrong results
- **Scalability:** more workers ⇒ more throughput
- **Until** repartition or skew dominates

## Formal Work and Span
- Let \(W\) = total work, \(S\) = span (critical path), \(p\) = workers
$$
T_p \ge \max\left(\frac{W}{p}, S\right)
$$
- Interpretation: parallel time bounded by work and critical path
- Engineering implication: low \(S\) is required for near-linear scale
- Speedup is limited by the sequential fraction
$$
\text{Speedup} \le \frac{W}{S}
$$
- Interpretation: Amdahl-style bound on parallel benefit
- Engineering implication: remove sequential bottlenecks first

## Repartitioning and Coordination
- **Repartitioning cost:** network and disk I/O to group by key
- **Skew:** one key ⇒ one worker overloaded ⇒ OOM
- **Coordination:** fault tolerance, stragglers, partial failures
- **Design for them**

## Cost of Naïve Design (Parallelism): What Goes Wrong (1/2)
- **Naïve:** "just add more workers"
- **Repartitioning** and **skew** often dominate
- More workers ⇒ more repartition traffic
- **Cost explosion**

## What Goes Wrong (2/2)
- **Naïve:** shared state or order-dependent logic
- ⇒ **Non-determinism**, wrong results on rerun
- **Naïve:** ignore key distribution
- Hot key **overloads one worker**; job latency = slowest task
- **Takeaway:** minimize repartition, balance partitions, pure functions

## Running Example — Data & Goal
- **Input:** order lines with product IDs
- Sample: "A12 B07 C33"; "A12 B07 D44"
- "B07 C33 A12"
- **Goal:** product frequency — (product_id, count)

## Running Example — Step-by-Step (1/4)
- **Step 1: Local tokenize & count** — each record independently
- Emit `(product_id, 1)` per product from each record
- R1: (A12,1),(B07,1),(C33,1)
- R2: (A12,1),(B07,1),(D44,1)
- R3: (B07,1),(C33,1),(A12,1)

## Running Example — Step-by-Step (2/4)
- **Step 2: Repartition** — framework sends same key to same worker
- **Grouped:** A12→[1,1,1], B07→[1,1,1], C33→[1,1]
- D44→[1]
- Main network and I/O cost in this phase

## Data Context: Order Input (Records 1–3)
- R1: "A12 B07 C33"
- R2: "A12 B07 D44"
- R3: "B07 C33 A12"
- Local emit produces (product_id, 1) per token

## In-Lecture Exercise 1: Local Outputs & Repartition Groups
- Write local emits for R1–R3
- Group by key after repartitioning
- Do not merge yet

## In-Lecture Exercise 1: Solution (1/2)
- R1: (A12,1),(B07,1),(C33,1)
- R2: (A12,1),(B07,1),(D44,1)
- R3: (B07,1),(C33,1),(A12,1)

## In-Lecture Exercise 1: Solution (2/2)
- A12→[1,1,1]
- B07→[1,1,1]
- C33→[1,1]
- D44→[1]

## In-Lecture Exercise 1: Takeaway
- Local emits are independent and deterministic
- Repartition groups define worker input size
- Correct grouping is required for correct merge

## Running Example — Step-by-Step (3/4)
- **Step 3: Merge** — each worker gets one key and values
- Sum the values for the final count
- **Output:** (A12,3), (B07,3), (C33,2), (D44,1)

## Running Example — Step-by-Step (4/4)
- **Result:** product-count table; correct and deterministic
- **Trade-off:** repartition moves data
- Skew can overload one worker
- Pattern scales to TB in distributed batch systems

## From Example to Pipeline
- Same pattern: divide → conquer → combine
- Next: system view of parallel pipeline
- Then cost and failure

## Parallel Pipeline Overview
- Divide: split input into chunks; assign to workers
- Parallel workers: local compute (or local aggregate) on each chunk
- Combine: repartition groups by key; workers aggregate
![](../../diagrams/week03/week3_lecture_slide13_system_overview.png)

## Cost & Scaling Analysis (1/3): Time Model
- **Work \(W\):** total operations over all workers
- **Span \(S\):** critical path; longest dependency chain
- **Speedup:**
$$
W/S
$$
with enough workers
- Upper bound = number of workers

## Cost & Scaling Analysis (2/3): Memory and Storage
- **Local compute:** each task holds one record + emitted (k,v)
- Bounded per task
- **Repartition:** all (k,v) written to disk/network
- Peak ≈ size of local output
- **Merge:** one key's values in memory; skew ⇒ OOM

## Cost & Scaling Analysis (3/3): Network and Throughput
- **Repartition traffic:** ≈ size of local output
- **Bottleneck:** link bandwidth and disk I/O
- Often limits scale more than CPU
- **Latency:** job time ≈ local compute + repartition + merge
- Repartition usually dominates

## Example: Work and Span
- 1B records, 10 items each ⇒ 10B local emits
- 1M distinct products ⇒ 1M merge tasks
- Local compute takes 100 ns/record ⇒ 100 s work
- With 1000 workers ⇒ ~0.1 s local phase (ideal)

## Repartition Size and Network Cost
- Repartition bytes ≈ local output size
- Every (k,v) sent over network to responsible worker
- Example: 10B emits × 20 B/pair ⇒ 200 GB repartition
- At 10 Gbps ⇒ ~160 s minimum
- Local aggregation reduces local output before repartition

## In-Lecture Exercise 2: Repartition Size Estimation
- 10 lines, ~4 items/line ⇒ 40 local emits
- Each (product_id,1) is 20 bytes
- Compute total repartition size
- With 5 workers, estimate bytes per worker
- If "A12" appears in 8 lines, how many pairs for that key?

## In-Lecture Exercise 2: Solution (1/2)
- Total local output: 40 × 20 B = 800 B
- Repartition size equals local output: 800 B
- Even split: 800 / 5 ≈ 160 B per worker

## In-Lecture Exercise 2: Solution (2/2)
- "A12" appears 8 times ⇒ 8 (k,v) pairs
- All 8 pairs go to one worker for key "A12"
- That worker receives 8 × 20 B = 160 B

## In-Lecture Exercise 2: Takeaway
- Repartition size is dominated by local output
- Even distribution is an assumption, not a guarantee
- Hot keys concentrate bytes on one worker

## Worker Memory and Skew Risk
- Each worker holds one key's value list in memory
- Skew ⇒ one list huge ⇒ OOM
- Mitigation: local aggregation, salting, custom partitioning

## Cost Summary
- **Work:** total CPU
- **Span:** critical path
- **Repartition:** network and disk I/O
- **Skew:** one partition dominates
- Engineering: minimize repartition, balance partitions

## Execution Flow: Partition–Group–Merge
- Local compute reads records, emits (k,v)
- Repartition groups by key
- Merge aggregates per key
![](../../diagrams/week03/week3_lecture_slide22_execution_flow.png)

## Pitfalls & Failure Modes (1/3): Shared State and Stragglers
- Task logic with global state is not deterministic
- One slow worker (straggler) delays the whole job
- Causes: skew, GC, network, disk
- Mitigation: speculative execution, better partitioning

## Pitfalls: Non-determinism
- Reruns must yield same result
- Shared state breaks this
- Design: pure task functions, deterministic key derivation
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
- **Hot partition:** one worker gets most data ⇒ OOM
- **Job latency = slowest worker**

## In-Lecture Exercise 4: Hot Key Skew Impact
- Clicks join Users on user_id
- user_id 888 has 1B clicks; others < 1K each
- Hash to 1,000 workers by user_id
- Each click is 100 B
- Compute worker load and data size for key 888

## In-Lecture Exercise 4: Solution (1/2)
- All 1B clicks for 888 go to one worker
- Data size: 1B × 100 B = 100 GB
- That worker becomes the straggler

## In-Lecture Exercise 4: Solution (2/2)
- 100 GB exceeds typical worker memory
- OOM or timeouts likely while others finish early
- Job latency dominated by that one worker

## In-Lecture Exercise 4: Takeaway
- Skew turns parallel jobs into single-task bottlenecks
- Hot keys must be detected and mitigated early
- Salting or custom partitioning are standard fixes

## Skew Detection
- Per-partition size after repartition
- Worker runtimes
- Alert if max ≫ median
- P99 worker time, spill count

## Mitigation 1: Local Aggregation
- Local pre-aggregation before repartition
- For sum/count: combine (k,v1),(k,v2) → (k,v1+v2)
- Reduces repartition size
- Only when merge is associative and commutative

## In-Lecture Exercise 3: Local Aggregation Impact
- Product count with 40 local emits
- After combining, emits drop to 15
- Each (k,v) is 20 bytes
- Compute new repartition size
- State why local aggregation is valid for product counts

## In-Lecture Exercise 3: Solution (1/2)
- New repartition size: 15 × 20 B = 300 B
- Reduction from 800 B to 300 B

## In-Lecture Exercise 3: Solution (2/2)
- Product count sum is associative and commutative
- Local sums equal global sum after repartition

## In-Lecture Exercise 3: Takeaway
- Local aggregation shrinks repartition without changing results
- Only safe for associative, commutative merge logic
- Always validate merge math before combining

## Mitigation 2: Salting (Split Hot Key)
- Append random suffix: (k,v) → (k-salt,v)
- Spread across workers
- Small table: replicate key to all salt buckets
- Second pass to combine results per original key

## Mitigation 3: Custom Partitioning
- Default: hash(key) mod R
- Custom: route hot keys to dedicated workers or spread
- Combine with salting for hot key splits
- Trade-off: more workers, more merge logic

## Skew Mitigation Trade-offs
- Local aggregation: free if merge is associative
- Salting: increases replication and merge cost
- Custom partitioning: requires key knowledge

## Failure in Production
- **Worker OOM:** one key's value list exceeds heap
- Fix: salting or increase memory
- **Timeout:** single worker runs too long
- Fix: split partition, local aggregation, salting
- **Detection:** monitor heap, GC, task duration

## Failure Scenario: Data Skew (Hot Key)
- Hash partitioning sends same key to same worker
- Hot key ⇒ one worker gets huge input ⇒ OOM
- Other workers finish quickly; job waits or fails
![](../../diagrams/week03/week3_lecture_slide38_failure_skew.png)

## Pitfalls & Failure Modes (3/3): Detection and Mitigation
- **Detection:** per-partition sizes and worker runtimes
- **Local aggregation:** pre-aggregation before repartition
- **Custom partitioning / salting:** spread hot key across workers

## Best Practices
- Keep task logic pure (no shared mutable state)
- Minimize repartition size: reduce key size, use local aggregation
- Partition by key so related data lands together
- Avoid skew via salting if needed
- Design for idempotency and reruns
- Monitor skew and stragglers
- Prefer smaller, bounded merge groups
- Document key schema and partitioning strategy

## Recap (Engineering Judgment)
- **Divide-and-conquer:** divide → conquer → combine
- **Constraint:** no shared state; pure functions
- **Repartition is the bottleneck** — network and disk I/O
- **Skew and hot keys** cause worker OOM
- **Design for Zipfian key distribution**
- **Cost reasoning:** work, span, repartition size
- **Constraints drive design**

## Pointers to Practice
- Run full manual partition-group-merge on 8–12 input records
- Compute repartition size and worker input size
- Solve one skew scenario and mitigation
- Reason about cost when one key dominates

## Additional Diagrams
### Practice: Skew Mitigation
![](../../diagrams/week03/week3_practice_slide18_skew_mitigation.png)
