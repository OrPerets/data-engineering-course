# Week 7: Advanced MapReduce and Data Skew

## Purpose
- Real-world MapReduce jobs fail or stall due to data skew and shuffle cost
- Engineers must reason about partition balance, combiners, and salting
- This topic bridges theory (Week 6) and production debugging and tuning

## Learning Objectives (1/2)
- Define data skew and explain why it causes OOM and stragglers
- Describe the role of the shuffle: partition, sort, transfer
- Explain when and how a combiner reduces network and disk I/O
- State the contract of a custom partitioner and when to use one

## Learning Objectives (2/2)
- Design a salted-key scheme to mitigate a single hot key in a join
- Estimate intermediate data size and shuffle cost from input cardinality
- Recognize skew from job metrics (reducer input size variance, task duration)
- List failure modes: OOM, timeout, straggler; tie each to skew or scale

## Sources Used (Reference Only)
- sources/Introduction to MapReduce.pdf
- sources/Lecture 6,7,8.pdf
- sources/Lecture 6,7,8.pptx
- sources/Spark.pdf

## Diagram Manifest
- Slide 12 → week7_lecture_slide12_system_overview.puml → MapReduce pipeline and skew mitigation layers
- Slide 19 → week7_lecture_slide19_example_shuffle.puml → Running example: shuffle groups by key
- Slide 24 → week7_lecture_slide24_execution_flow.puml → Execution flow Map → Shuffle → Reduce
- Slide 28 → week7_lecture_slide28_failure_skew.puml → Failure: hot key → one reducer OOM

## The Real Problem This Lecture Solves
- **In production:** MapReduce jobs fail or stall not because the logic is wrong, but because one reducer gets most of the data (skew) or because shuffle dominates runtime (data movement, not code).
- **Hot key:** One key with huge value set → one reducer OOM or straggler; job latency = that reducer’s time.
- **Shuffle cost:** Intermediate (k,v) size can match or exceed input; no combiner ⇒ network and disk I/O dominate; thinking in *data movement* is the lever.

## The System We Are Building (Tie to Week 6)
- **Context:** Week 6 gave the MapReduce model (map → shuffle → reduce). Here we make it production-ready for skewed and large datasets.
- **Same pipeline shape:** Event analytics by user_id or session_id; word count; join Users (small) with Clicks (large). The *partition balance* and *shuffle size* determine success.
- **Engineering goal:** Design keys and partitioners so no single reducer is overloaded; cut shuffle with combiners; detect skew from metrics before it becomes an incident.

## Cost of Naïve Design (Advanced MapReduce)
- **No combiner:** Emit (word, 1) for every occurrence ⇒ shuffle size ≈ map output; for 1 TB of text, intermediate data similar scale ⇒ network and disk thrashing; combiner cuts bytes sent and spilled.
- **Default partitioner on skewed key:** Join on user_id; one bot has 1B clicks ⇒ all 1B (user_id, click) go to one reducer ⇒ OOM or timeout; “correct” logic, wrong data distribution.
- **No salting on hot key:** Same join; without splitting the hot key across reducers, the job cannot scale; salting trades small-table replication for reducer balance.
- **Production cost:** Job retries, SLA misses, on-call; fixing skew post-incident is far more expensive than profiling key distribution and designing partition strategy up front.

## Core Concepts (1/2)
- **Shuffle:** Framework groups all (k,v) by k; same key → same reducer
- **Partition function:** `partition_id = hash(k) mod R`; R = number of reducers
- **Sort:** Within each partition, keys (and optionally values) sorted before reduce

## Core Concepts (2/2)
- **Guarantees:** All pairs with same key reach one reducer; order of values undefined unless secondary sort
- **What breaks at scale:** One key with huge value set → one reducer overloaded (skew)
- **Cost:** Shuffle dominates when intermediate data is large; network and disk I/O

## Shuffle Anatomy
- **Partition:** Each map output (k,v) sent to reducer `hash(k) mod R`
- **Sort:** Reducer receives key and sorted iterator of values (if sort enabled)
- **Transfer:** Map-side spill to disk; fetch by reducers; merge and sort on reduce side

## Combiner
- **Role:** Optional local reduce on map output before shuffle; must be associative and commutative where used
- **Effect:** Reduces bytes sent over network and written to disk
- **Example:** Word count: combiner sums (word, 1) per map task → emit (word, count) to shuffle

## Partitioner
- **Default:** `hash(key) mod numReducers`; uniform hash spreads keys
- **Custom:** Override to control which reducer gets which keys (e.g. range partition, avoid known hot keys)
- **Contract:** Deterministic; same key always same partition; partition index in [0, R−1]

## Data Skew Definition
- **Skew:** Unequal distribution of data per key; some keys have far more values than others
- **Zipfian:** Many real key distributions (e.g. user activity, words) follow heavy-tail; few keys dominate
- **Metric:** Reducer input size variance; max reducer size / mean → high implies skew

## System / Pipeline Overview
- Input splits → Map (emit (k,v)) → Partition → Shuffle (sort & transfer) → Reduce → Output
- Skew mitigation sits at partition (custom partitioner), map (combiner), or key design (salting)
- Diagram: week7_lecture_slide12_system_overview.puml

## Guarantees and What Breaks
- **Guarantee:** Same key → same reducer; complete grouping before reduce runs
- **No guarantee:** Order of values per key (unless secondary sort); balance of load across reducers
- **Break:** Skew causes one reducer to get most data → OOM or straggler

## Running Example — Data & Goal
- **Input:** Short lines of text (e.g. "data eng", "data fun", "eng data"); block-sized splits
- **Goal:** Word count: output (word, total_count) per word
- **Schema:** Input: (line_offset, line_text); Map emit: (word, 1); Reduce: (word, sum)

## Running Example — Step-by-Step (1/4)
- **Map:** Read split; tokenize each line; for each word emit (word, 1)
- Example: ("data eng", "data fun") → ("data",1), ("eng",1), ("data",1), ("fun",1)
- Map output (before shuffle): stream of (k,v) pairs

## Running Example — Step-by-Step (2/4)
- **Shuffle:** Partition by hash(word); e.g. "data"→P0, "eng"→P1, "fun"→P2
- All ("data", 1) go to same reducer; ("eng",1) to another; ("fun",1) to another
- Reducers receive (key, iterator of values)

## Running Example — Step-by-Step (3/4)
- **Reduce:** For each key, sum the values in the iterator; emit (key, sum)
- Reducer for "data": values [1,1,...] → emit ("data", 2)
- Reducer for "eng": [1] → ("eng", 1); "fun": [1] → ("fun", 1)

## Running Example — Step-by-Step (4/4)
- **Output:** ("data", 2), ("eng", 1), ("fun", 1)
- With combiner: map-side pre-aggregation could emit ("data", 2) once per map; less shuffle data

## Running Example — Shuffle Groups (Diagram)
- Map emits (word, 1); partition by hash(word) sends same word to same reducer
- Skew: if one word appears in most lines, one reducer gets most of the values
- Diagram: week7_lecture_slide19_example_shuffle.puml

## Running Example — Engineering Conclusion
- **Trade-off:** Combiner reduces shuffle size but adds CPU and must be semantically valid (e.g. sum ok; distinct count not exactly)
- **Scale:** For 1 TB of text, intermediate (word, 1) can be similar size; combiner cuts network and spill

## Cost & Scaling Analysis (1/3)
- **Time model:** T ≈ T_map + T_shuffle + T_reduce; T_shuffle often dominant
- **Map:** O(input size / parallelism); reduce: O(intermediate size per reducer)
- **Bottleneck:** Reducer that receives far more data than others (skew)

## Cost & Scaling Analysis (2/3)
- **Memory:** Map output buffer → spill when full; reduce fetches partitions → merge
- **Storage:** Intermediate (k,v) written to local disk by map; read by reducers over network
- **Spill:** Multiple spills merged with sort; large intermediate → many spills and I/O

## Cost & Scaling Analysis (3/3)
- **Network:** Shuffle bytes ≈ size of map output (minus combiner reduction)
- **Throughput:** Limited by disk and network; skew causes one reducer to receive most traffic
- **Latency:** Job latency = max over reducer finish times; straggler delays entire job

## Execution Flow — Map to Reduce
- 1. Map: read split → emit (k,v); 2. Shuffle: partition → sort → transfer; 3. Reduce: consume (k, [v]) → emit (k,v')
- Diagram: week7_lecture_slide24_execution_flow.puml

## Pitfalls & Failure Modes (1/3)
- **Skew:** One or few keys get majority of values → one reducer OOM or very slow
- **Straggler:** One task (map or reduce) runs much longer; job waits for it
- **Hot key:** Same key in join or group-by; e.g. default user_id, bot, or null

## Pitfalls & Failure Modes (2/3)
- **OOM:** Reducer receives more (k,v) than heap can hold; no spill on reduce side for values
- **Timeout:** Single reducer task exceeds allowed time; often due to skew
- **Default partitioner:** hash(key) can still put many distinct keys on one reducer if key space small

## Pitfalls & Failure Modes (3/3)
- **Detection:** Monitor reducer input sizes, task durations; high variance → skew
- **Mitigation:** Combiner (reduce map output); custom partitioner (spread known hot keys); salting (split hot key across reducers, then reconcile)

## Failure Scenario — Hot Key to OOM
- Scenario: Join Users (small) with Clicks (large); user_id 888 is bot with 1B clicks
- Default partition: all 1B (888, click) go to one reducer → OOM
- Diagram: week7_lecture_slide28_failure_skew.puml

## Skew Detection
- **Metrics:** Reducer input bytes or record count; max / mean or standard deviation
- **Logs:** Task duration per partition; identify partition with much longer runtime
- **Sampling:** Sample keys to estimate per-key cardinality; flag keys above threshold

## Skew Mitigation — Salting (Concept)
- **Idea:** For hot key K, emit (K-1, v), (K-2, v), ... (K-N, v) from large table; replicate small-table row for K to all N partitions
- **Result:** Each reducer gets 1/N of hot key data; join still correct after grouping by K
- **Cost:** Small table row replicated N times for hot key; acceptable if small table is small

## Skew Mitigation — Combiner and Partitioner
- **Combiner:** Reduces map output size; use when reduce is associative (e.g. sum, max)
- **Custom partitioner:** Send known hot keys to dedicated reducers or spread by salted sub-key
- **Trade-off:** Combiner is transparent to logic; partitioner and salting require key design

## Best Practices (1/2)
- Use combiners whenever reduce function is associative and commutative on map output
- Sample or profile key distribution before large jobs; identify hot keys early
- Prefer salting for joins with one very large side and known skewed keys
- Set reducer count based on data size; avoid too few (skew) or too many (overhead)

## Best Practices (2/2)
- Monitor reducer input size variance; alert on high skew
- Document partition strategy when using custom partitioner or salting
- Test with skewed samples (e.g. inject hot key) to validate OOM and timeout handling
- Prefer engine features (e.g. Spark AQE) when available; understand underlying MR semantics

## Recap — Engineering Judgment
- **Shuffle is the bottleneck:** Think in data movement, not code; intermediate size and partition balance determine job success; combiner is the first lever when reduce is associative.
- **Skew is a first-class failure:** One key with most values → one reducer OOM or straggler; design partition strategy and key shape (e.g. salting) so no single reducer gets the hot key alone.
- **Measure before and after:** Reducer input size variance and task duration variance; sample key distribution before large jobs; alert on skew so you fix before incident.
- **Non-negotiable in production:** Use combiners when valid; profile and mitigate hot keys (partitioner or salting); document partition strategy; test with skewed samples.

## Pointers to Practice
- Manual walkthrough: 8–12 input records → Map emits → Shuffle groups → Reduce outputs
- One skew case: skewed key distribution; one mitigation: combiner or salting with concrete (k,v)
- Cost exercise: estimate intermediate size and shuffle bytes from input size and key cardinality
