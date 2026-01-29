# Week 6: MapReduce Fundamentals

## Purpose
- MapReduce is the execution model behind distributed batch processing
- Shuffle cost and data skew dominate failure and performance at scale
- Engineering: design keys, minimize shuffle, handle skew

## Learning Objectives
- Define MapReduce: map, shuffle, reduce; input/output types and key semantics
- Write map and reduce functions for aggregation (e.g. word count, sum by key)
- Trace a full job: map emits (k,v), shuffle groups by key, reduce aggregates
- Compute shuffle size and reducer input size from input and key distribution
- Identify data skew and hot keys as failure modes; describe combiner and salting
- Reason about cost: work, span, network, and when shuffle dominates

## Sources Used (Reference Only)
- sources/Lecture 6,7,8.pdf
- sources/Lecture 6,7,8.pptx
- sources/Introduction to MapReduce.pdf
- exercises1.md
- exercises2.md

## Diagram Manifest
- Slide 17 → week6_lecture_slide17_system_overview.puml → MapReduce pipeline overview
- Slide 20 → week6_lecture_slide20_execution_flow.puml → map–shuffle–reduce execution flow
- Slide 29 → week6_lecture_slide29_failure_skew.puml → failure: hot reducer, skew

## Why MapReduce in Data Engineering
- Batch processing at scale: single node cannot hold or process TB of data
- MapReduce: divide input into splits; map in parallel; shuffle groups by key; reduce in parallel
- Foundation for Hadoop, Spark, and distributed SQL (shuffle = exchange)
- Enables aggregation, join, and indexing at cluster scale

## Core Concepts (1/2)
- **MapReduce:** programming model: Map (emit (k,v)) → Shuffle (group by k) → Reduce (aggregate per k)
- **Map:** pure function per record; no cross-record state; emits zero or more (key, value) pairs
- **Shuffle:** framework sends all pairs with same key to same reducer; sort/group by key
- **Reduce:** receives one key and iterator of values; emits final (key, aggregate)

## Core Concepts (2/2)
- **Key constraint:** same key must land on one reducer; hash(key) mod R determines reducer
- **Guarantees:** deterministic if map/reduce pure; scalable until shuffle or skew limits
- **What breaks:** shuffle I/O and network; skew (one key has most values) ⇒ OOM or timeout

## Formal Model: Input and Output Types
- **Input:** (key_in, value_in) or split of raw records (e.g. line number, line text)
- **Map:** (k_in, v_in) → list of (k_out, v_out); k_out is the grouping key for reduce
- **Shuffle:** groups all (k_out, v_out) by k_out; each group → one reducer
- **Reduce:** (k, list of v) → one or more (k, result); often one output per key

## Formal Model: Key and Partitioning
- **Partition function:** partition(k, R) = hash(k) mod R; R = number of reducers
- Same k ⇒ same partition ⇒ same reducer; different k may collide (same partition)
- **Implication:** design k so that load is balanced; hot k ⇒ one partition overloaded

## Pseudocode: Map and Reduce (Word Count)
- **Map:** `map(line_id, text): for word in split(text): emit(word, 1)`
- **Reduce:** `reduce(word, values): emit(word, sum(values))`
- Map: no cross-line state; reduce: one key, aggregate over values; deterministic

## Running Example — Data & Goal
- **Input:** log lines (record = line); sample 4 lines: "a b a", "b a c", "a c", "b b a"
- **Goal:** word count — (word, count); used for search, analytics, indexing
- **Schema:** input (line_id, text); map emits (word, 1); reduce sums per word

## Running Example — Input Table
- **Sample input (4 records):**

| line_id | text    |
|--------:|---------|
| 1       | a b a   |
| 2       | b a c   |
| 3       | a c     |
| 4       | b b a   |
- Distinct keys after map: a, b, c; total map emits = 11

## Running Example — Step-by-Step (1/4)
- **Step 1: Map** — each line independently; emit (word, 1) for every word (lowercase)
- **Map outputs:** R1: (a,1),(b,1),(a,1); R2: (b,1),(a,1),(c,1); R3: (a,1),(c,1); R4: (b,1),(b,1),(a,1)
- Total map emits: 3+3+2+3 = 11 pairs; keys: a, b, c

## Running Example — Step-by-Step (2/4)
- **Step 2: Shuffle** — group by key; all (a,1) → reducer for "a"; same for "b", "c"
- **Grouped:** a→[1,1,1,1,1], b→[1,1,1,1], c→[1,1]
- Shuffle moves 11 (k,v) pairs over network to reducers
- Diagram: week6_lecture_slide20_execution_flow.puml

## Running Example — Step-by-Step (3/4)
- **Step 3: Reduce** — each reducer gets one key and list of values; sum the values
- Reducer "a": sum([1,1,1,1,1]) = 5; "b": 4; "c": 2
- **Output:** (a, 5), (b, 4), (c, 2)

## Running Example — Step-by-Step (4/4)
- **Result:** word-count table; correct and deterministic
- **Conclusion:** map emits (word,1); shuffle groups by word; reduce sums ⇒ word count
- **Trade-off:** shuffle size = map output size; skew (one word in every line) would overload one reducer

## MapReduce Pipeline Overview
- Input (files/blocks) → split → Map tasks (emit (k,v)) → Shuffle (sort & transfer) → Reduce tasks → output
- Diagram: week6_lecture_slide17_system_overview.puml

## Execution Flow: Map Phase
- Each map task reads one split (e.g. block or range of lines)
- For each record, map function emits (k,v) pairs to buffer
- Buffer may be spilled to local disk; sorted by k for merge in shuffle
- No communication between map tasks; parallelism = number of splits

## Execution Flow: Shuffle Phase
- Map output partitioned by key (hash(k) mod R); each partition sent to one reducer
- On reducer side: fetch partitions from all mappers; merge-sort by key
- **Cost:** network = total map output size; disk I/O for sort and spill
- Often the dominant phase in wall-clock time

## Execution Flow: Reduce Phase
- Reducer receives merged stream of (k, iterator of values) per key
- Reduce function aggregates (e.g. sum, concat, max) and writes output
- One output partition per reducer (or per key if multiple outputs)
- Diagram: week6_lecture_slide20_execution_flow.puml (full flow)

## Cost & Scaling Analysis (1/3)
- **Time model:** T_job ≈ T_map + T_shuffle + T_reduce; T_shuffle often dominates
- **Work W:** total CPU over all tasks; **Span S:** critical path (longest chain)
- **Speedup:** upper bound min(workers, map_tasks); then limited by reduce and shuffle

## Cost & Scaling Analysis (2/3)
- **Memory:** map task: input chunk + output buffer; reducer: one key’s value list (skew risk)
- **Storage:** map output and shuffle spill on disk; output = reduce write
- **Reducer OOM:** one key with huge value list exceeds heap; fix: salting or combiner

## Cost & Scaling Analysis (3/3)
- **Network / shuffle:** bytes shuffled ≈ size of map output; every (k,v) sent once
- **Formula:** shuffle_bytes ≈ N_emits × avg_size_per_pair; throughput limited by network
- **Latency:** job latency = map + shuffle + reduce; shuffle often bottleneck

## Shuffle Size Calculation
- **Example:** 10^9 records, 10 words each ⇒ 10^10 map emits; 20 B per (word, count) ⇒ 200 GB shuffle
- At 10 Gbps network: 200 GB / 1.25 GB/s ≈ 160 s minimum for shuffle
- **Reduction:** combiner (local reduce before shuffle) cuts map output and thus shuffle size

## Reducer Memory and Skew
- Each reducer holds one key’s value list in memory (before/during reduce)
- **Skew:** one key has 10^9 values ⇒ list size 10^9 × value_size ⇒ OOM
- **Mitigation:** spread hot key across reducers (salting); or increase reducer memory (bounded)

## Pitfalls & Failure Modes (1/3)
- **Data skew:** one key has most records ⇒ one reducer gets most data ⇒ OOM or timeout
- **Non-deterministic map/reduce:** same input ⇒ different output; breaks replay and debugging
- **Shuffle storm:** too many or too large map outputs; no combiner when reduce is sum/count

## Pitfalls & Failure Modes (2/3)
- **Hot key:** e.g. user_id 888 (bot) has 1B clicks; hash(888) mod R → one reducer
- That reducer receives ~1B records; others finish quickly; job waits or fails
- Diagram: week6_lecture_slide29_failure_skew.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor partition sizes after shuffle; reducer runtimes; alert if max ≫ median
- **Combiner:** local pre-aggregation (e.g. sum) before shuffle; reduces network and reducer load
- **Salting:** append random suffix to hot key; replicate small side in join; merge after

## Failure: Hot Reducer (Skew)
- Hash partitioning sends same key to same reducer; hot key ⇒ one reducer gets huge input
- That reducer: OOM (cannot hold all values) or timeout (too long to process)
- Diagram: week6_lecture_slide29_failure_skew.puml

## Combiner: When and Why
- **When:** reduce function is associative and commutative (e.g. sum, count, max)
- **Effect:** combine (k,v1),(k,v2) on map side → (k, v1+v2); fewer pairs sent in shuffle
- **Correctness:** must not change final result; same as running reduce on full value list
- **Trade-off:** less shuffle and faster job; not all reducers support (e.g. median needs all values)

## Custom Partitioner and Salting
- **Default partitioner:** hash(k) mod R; even spread only if key distribution even
- **Salting:** for hot key k, emit (k||salt, v) with random salt in [1..N]; N reducers get 1/N of hot key
- **Join:** small table row for k must be replicated to all N reducers (k||1..N) so join still correct
- **Trade-off:** more reducers and merge logic; avoids OOM and balances load

## Best Practices
- Design map output key so that key distribution is balanced; avoid single dominant key
- Use combiner when reduce is sum/count/max and correctness is preserved
- Monitor shuffle size and per-partition sizes; alert on skew (max/median ratio)
- Prefer smaller, bounded reduce groups; use salting for known hot keys
- Keep map and reduce pure (no shared mutable state); deterministic for replay
- Minimize map output size: smaller keys and values; filter early in map
- Test with skewed input (e.g. one key 80% of data) to validate skew handling
- Document partition function and key design for operators

## MapReduce vs SQL Aggregation
- SQL: GROUP BY key → aggregate; optimizer chooses plan (hash/sort)
- MapReduce: map emits (k,v); shuffle = distributed group by key; reduce = aggregate
- Same logical result; MapReduce explicit about shuffle cost and skew risk
- Use MapReduce when: scale beyond single node; need control over partitioning

## Summary: Phases and Cost
- **Map:** read split, emit (k,v); cost ∝ input size; parallel across splits
- **Shuffle:** group by key, transfer; cost ∝ map output size; often bottleneck
- **Reduce:** aggregate per key, write; cost ∝ reducer input; skew ⇒ one reducer slow or OOM

## Relation to Parallelism (Week 3)
- Divide: split input into chunks (splits); Conquer: map per chunk in parallel
- Combine: shuffle groups by key; reduce aggregates per group
- Pure map/reduce and key design carry over; skew and combiner from Week 3 apply here

## Recap
- MapReduce: map emits (k,v); shuffle groups by key; reduce aggregates per key
- Shuffle is often the bottleneck: network and disk I/O; combiners reduce shuffle size
- Data skew causes one reducer to get most data ⇒ OOM or timeout; use combiners and salting
- Cost: work, span, shuffle bytes; design keys and use combiners for scale
- Formal model: same key → same reducer; partition(k,R) = hash(k) mod R

## Pointers to Practice
- Run full manual MapReduce (map → shuffle → reduce) on 8–12 input records
- Compute shuffle size and reducer input size for given input and key distribution
- Solve one skew case: hot key and mitigation (combiner or salting); diagram required
