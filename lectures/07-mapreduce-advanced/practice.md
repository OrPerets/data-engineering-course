# Week 7: Advanced MapReduce and Data Skew — Practice

## Instructions
- Engineering course: show reasoning and calculations
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs explicitly
- Include one skew case and one mitigation (combiner / partitioner / salting)
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Input: text lines (word count)

**File / split:** Plain text lines; each line = (line_id, line_text). Splits by block.

**Schema:** Input record: (line_id, line_text). Map emit: (word, 1). Reduce output: (word, total_count).

**Sample input (10 records):**

| line_id | line_text        |
|--------:|------------------|
| 1       | data eng data    |
| 2       | eng data fun     |
| 3       | data data data   |
| 4       | fun eng          |
| 5       | data eng fun     |
| 6       | eng              |
| 7       | data fun         |
| 8       | data data        |
| 9       | eng fun data     |
| 10      | data             |

**Approximate scale (for cost exercises):** 10 lines here; assume 1 billion lines, ~100 bytes/line → 100 GB input; 3 reducers.

**Keys / partitions:** Reduce key = word; partition = hash(word) mod R. R = number of reducers.

### Input: clicks and users (skew / join)

**Clicks:** (user_id, click_id, ts). **Users:** (user_id, name). Join key = user_id.

**Sample Clicks (8 records):** (101, c1, t1), (102, c2, t2), (101, c3, t3), (101, c4, t4), (103, c5, t5), (101, c6, t6), (101, c7, t7), (102, c8, t8).

**Sample Users (3 records):** (101, "Alice"), (102, "Bob"), (103, "Carol").

**Skew:** user_id 101 has 5 clicks; 102 has 2; 103 has 1. At scale, one user_id (e.g. bot) could have billions of clicks.

## Reference Exercises Used (Root)
- exercises1.md: Exercise structure, sample rows, step-by-step solutions and check notes; SQL/aggregation style adapted to MapReduce wording.
- exercises2.md: Module 2 MapReduce — inverted index (map emit (word, (doc_id, pos)), shuffle, reduce); matrix multiplication (replication join); data skew and salting (hot key 888, salt and replicate); shuffle anatomy and cost.

## Diagram Manifest
- Slide 18 → week7_practice_slide18_skew_salting.puml → skew mitigation: salting flow (large table salt, small table replicate)

## Warm-up Exercises

## Exercise 1
For the **word count** Data Context (10 lines), list the **unique words** that will appear as reduce keys. How many distinct keys are there?

## Exercise 2
In MapReduce word count, what is the **partition rule**? Which reducer will get the key "data" if R = 3 and partition = hash(word) mod 3? (Assume hash("data") mod 3 = 0.)

## Exercise 3
What is a **combiner**? In one sentence, why can we use a combiner for word count (sum of 1s) but must be careful for "count distinct"?

## Exercise 4
Define **data skew** in one sentence. What happens to one reducer when its key has 100× more values than the average?

## Exercise 5
For the **Clicks–Users** sample, which user_id is the "hot" key? How many click records will the reducer for that key receive if we use default partitioning?

## Engineering Exercises

## Exercise 6
**Full manual walkthrough (word count):** Using the 10-line input in Data Context, (a) Write the **Map output** (all (k,v) pairs) for the first 3 lines (line_id 1, 2, 3). (b) Assume R = 3 and hash("data") mod 3 = 0, hash("eng") mod 3 = 1, hash("fun") mod 3 = 2. List which **keys** go to which **reducer**. (c) For each reducer, give the **input** (key and list of values) and the **output** (key, sum). (d) What is the final word count for "data", "eng", "fun"?

## Exercise 7
**Shuffle size:** For the full 10-line input, every word emits (word, 1). (a) How many **map output pairs** are there in total? (b) If we use a **combiner** that sums (word, count) per map task, what is the maximum number of pairs that can be sent to the shuffle from a **single** map task (for this tiny input, one map might see all 10 lines)? (c) Why does the combiner reduce network cost at scale?

## Exercise 8
**Skew case — Clicks–Users:** Using the Clicks and Users samples (user_id 101 has 5 clicks, 102 has 2, 103 has 1), (a) With default partition hash(user_id) mod R and R = 3, which reducer gets user_id 101? (b) How many **click records** does that reducer receive? (c) If at scale user_id 101 had 1 billion clicks and others had &lt; 1000, what failure would you expect? (d) In one sentence, what does **salting** do to the key for the large table (Clicks)?

## Exercise 9
**Salting design:** To mitigate the hot key 101, we use N = 3 salt buckets. (a) For **Clicks**: how do we modify the emit key so that 101's clicks go to 3 different reducers? (b) For **Users**: how many times do we emit the row (101, "Alice") and with what keys? (c) After the join, do we need an extra step to merge rows? Why or why not?

## Exercise 10
**Cost estimate:** Assume 1 billion lines, 100 bytes/line (100 GB input), word count with 1 million distinct words. (a) Roughly how many **(word, 1)** pairs are emitted by Map? (Assume 10 words/line on average.) (b) If shuffle sends 50 GB, and we have 100 reducers, what is the approximate **average** bytes per reducer? (c) If one word appears in 10% of all lines (skew), how many values does one reducer get for that word? (Order of magnitude.)

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: skew mitigation and diagram.** (a) **Architecture:** For a join of **Users (1 GB)** and **Clicks (10 TB)** with one hot user_id (1 billion clicks), describe the **salted join** in three steps: (1) how the large table (Clicks) emits keys, (2) how the small table (Users) emits keys for the hot user, (3) what each reducer receives and outputs. (b) **Diagram:** Reference the salting flow (large table → salted keys to N reducers; small table → replicate hot key to N reducers). Diagram: week7_practice_slide18_skew_salting.puml (c) **Trade-off:** What is the cost of replicating the small-table row for the hot key N times? When is it acceptable?

## Solutions

## Solution 1
- **Unique words:** data, eng, fun. **Distinct keys:** 3.

## Solution 2
- **Partition rule:** partition_id = hash(key) mod R; same key → same reducer.
- If hash("data") mod 3 = 0, the key "data" goes to **reducer 0**.

## Solution 3
- **Combiner:** Optional local reduce on map output before shuffle; reduces bytes sent.
- For word count, sum is associative and commutative, so combiner is correct. For count distinct, merging two sets is not a simple sum; a naive combiner can overcount unless we use a distinct structure (e.g. HyperLogLog) or accept approximation.

## Solution 4
- **Data skew:** Unequal distribution of data per key; some keys have far more values than others.
- One reducer gets 100× more values → much more memory and CPU → OOM risk or straggler; job latency equals that reducer's finish time.

## Solution 5
- **Hot key:** user_id 101 (5 clicks). **Reducer for 101:** receives 5 click records (and 1 user row after shuffle).

## Solution 6
- **(a) Map output for lines 1–3:** Line 1: (data,1), (eng,1), (data,1). Line 2: (eng,1), (data,1), (fun,1). Line 3: (data,1), (data,1), (data,1). Full list: (data,1)×5, (eng,1)×2, (fun,1)×1 for lines 1–3.
- **(b) Partition:** "data"→R0, "eng"→R1, "fun"→R2.
- **(c) Reducer inputs/outputs:** R0: key "data", values [1,1,...] (11 ones) → output ("data", 11). R1: key "eng", values [1,1,...] (6 ones) → ("eng", 6). R2: key "fun", values [1,1,...] (5 ones) → ("fun", 5). (Counts from full 10 lines.)
- **(d) Final:** data 11, eng 6, fun 5.

## Solution 7
- **(a) Total map output pairs:** Count words in 10 lines: 3+3+3+2+3+1+2+2+3+1 = 22 pairs.
- **(b) With combiner (one map for all 10 lines):** After local sum: (data, 11), (eng, 6), (fun, 5) → 3 pairs to shuffle (max for this map).
- **(c) At scale:** Combiner reduces bytes sent over network and written to disk; fewer spills; reducers receive pre-aggregated counts.

## Solution 8
- **(a)** Partition = hash(101) mod 3; assume it maps to reducer 1 (value depends on hash).
- **(b)** Reducer for 101 receives **5** click records (and 1 user row).
- **(c)** At scale: that reducer would get 1 billion records → OOM or extreme straggler; job fails or times out.
- **(d) Salting (large table):** Emit (user_id-salt, click) so hot key's records are spread across N reducers (e.g. (101-1, click), (101-2, click), (101-3, click)).

## Solution 9
- **(a) Clicks:** Emit (101-1, click), (101-2, click), (101-3, click) for user_id 101 (e.g. round-robin or hash(click_id) mod 3); each reducer gets ~1/3 of 101's clicks.
- **(b) Users:** Emit (101-1, "Alice"), (101-2, "Alice"), (101-3, "Alice") so every reducer that gets 101-X clicks also gets the user row.
- **(c)** Reducer output is (101-X, (user, click)); we can drop the salt and output (101, (user, click)) or merge in a second job; for a simple join we often output (user_id, joined_row) and the salt was only for distribution.

## Solution 10
- **(a)** ~10 words/line × 1B lines = **10B** (word, 1) pairs (order of magnitude).
- **(b)** 50 GB / 100 reducers ≈ **500 MB** per reducer on average.
- **(c)** 10% of 10B = 1B values for one key; one reducer gets **~1 billion** values (order of magnitude) → severe skew.

## Solution 11 (Challenge)
- **(a) Salted join:** (1) **Clicks (large):** For hot user_id 888, emit (888-1, click), (888-2, click), ..., (888-N, click); other keys unchanged. (2) **Users (small):** For 888, emit (888-1, user), (888-2, user), ..., (888-N, user). (3) **Reducer:** Each reducer 888-i gets 1/N of 888's clicks and the user row; performs join; outputs (888, (user, click)) for each pair.
- **(b)** Diagram: week7_practice_slide18_skew_salting.puml — large table emits salted keys to N reducers; small table replicates hot key to N reducers.
- **(c) Trade-off:** Replicating the small-table row N times for the hot key increases small-table traffic by N for that key; acceptable when the small table is small (e.g. 1 GB) and the hot key is few; avoids OOM on the large side.
