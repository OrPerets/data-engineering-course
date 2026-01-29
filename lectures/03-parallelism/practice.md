# Week 3: Parallelism and Divide-and-Conquer — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Trace map → shuffle → reduce with concrete (k,v) and groups
- Compute shuffle size, reducer input size, and cost where asked
- Justify skew mitigations with numeric assumptions

## Data Context (MANDATORY)

### Input: log lines and sales records

**Word-count / log input (records 1–10):**
1. "the quick brown fox"
2. "the quick brown dog"
3. "quick brown fox jumps"
4. "the lazy dog"
5. "brown fox lazy"
6. "dog jumps quick"
7. "the fox and the dog"
8. "quick brown lazy fox"
9. "jumps over lazy dog"
10. "the quick brown fox runs"

**Sales-by-product input (records 1–10):** each record = (product_id, amount)
- (101, 10.0), (102, 5.5), (101, 7.5), (103, 3.0), (102, 4.5)
- (101, 2.0), (103, 8.0), (102, 6.0), (101, 11.0), (103, 1.5)

**Keys and scale:**
- Word count: key = word (string); value = count (int). ~10 records, ~4 words/line ⇒ ~40 map emits.
- Sales: key = product_id (int); value = amount (float). 10 records ⇒ 10 map emits.

**Skew scenario (for later exercises):**
- Clicks table: (user_id, click_ts). user_id 888 (bot) = 1B rows; others &lt; 1K each.
- Users table: (user_id, name). 1M users. Join: clicks ⟗ users. Standard hash(user_id) → one reducer gets 1B rows for 888 ⇒ OOM.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count, sales per product); map outputs, shuffle groups, reduce outputs; solution format and structure.
- exercises2.md: Anatomy of shuffle; inverted index with positions; data skew and salting (hot key 888, salt and replicate); combiner and partitioner reasoning.

## Diagram Manifest
- Slide 18 → week3_practice_slide18_skew_mitigation.puml → skew mitigation (salting) flow

## Warm-up Exercises

## Exercise 1
Using the word-count input (records 1–3 only: "the quick brown fox", "the quick brown dog", "quick brown fox jumps"), write the **map outputs** (key, value) for each record. Then list the **shuffle groups** (key → list of values). No reduce step yet.

## Exercise 2
For the same three records, complete the **reduce** step: for each key, sum the values. Write the final (word, count) output.

## Exercise 3
Using the sales-by-product input (all 10 records), show **map outputs**, **shuffle groups**, and **reduce outputs** (product_id, total_sales). Assume map emits (product_id, amount) as-is.

## Exercise 4
Define **work** and **span** in one sentence each. For 100 map tasks of equal size and 10 reduce tasks of equal size, what is the best-case speedup (upper bound) if we have 50 workers? One sentence.

## Exercise 5
Why is the **shuffle** phase often the most expensive part of a MapReduce job? Give two reasons in one sentence each.

## Engineering Exercises

## Exercise 6
**Shuffle size:** Word-count input has 10 lines, ~4 words/line ⇒ 40 map emits. Assume each (word, 1) is 20 bytes (key + value).  
a) Total map output size in bytes?  
b) This is also the shuffle size (all (k,v) sent to reducers). If we have 5 reducers and keys are evenly distributed, bytes per reducer (approx)?  
c) If one word (e.g. "the") appears in 8 lines, how many (k,v) pairs does that key produce? How many go to one reducer?

## Exercise 7
**Combiner:** For word count, a combiner sums counts locally before shuffle: (the,1),(the,1),(the,1) → (the,3).  
a) If the 40 map emits become 15 after combining (fewer distinct words per mapper), what is the new shuffle size in bytes (still 20 B per (k,v))?  
b) Why can we use a combiner for word count? (Associate? Commutative?) One sentence.

## Exercise 8
**Skew:** Join Clicks (user_id, ts) with Users (user_id, name). user_id 888 has 1B clicks; 999,999 users have &lt; 1K clicks each. Hash partitioning: hash(user_id) mod 1000 → reducer.  
a) How many clicks does reducer for 888 get (approx)?  
b) If each click record is 100 B, how much data does that reducer receive (GB)?  
c) Why might that reducer OOM or timeout? One sentence.

## Exercise 9
**Salting mitigation:** We salt 888 into 10 buckets: 888-1 … 888-10. Clicks for 888: emit (888-i, click) for random i in 1..10. Users for 888: replicate (888-1, user) … (888-10, user).  
a) How many click records does each of the 10 reducers get (approx)?  
b) How much does the Users table grow in the shuffle (for key 888 only)? One sentence.  
c) After the join, what extra step is needed to get "user 888" result? One sentence.

## Challenge Exercise

## Challenge: Skew mitigation design and diagram

**Setup:** Same as Exercise 8: Clicks (1B rows for user 888, rest small) join Users (1M rows). Standard join → one reducer gets ~100 GB for 888 and fails.

**Part 1 — Salting plan**  
a) Choose number of salt buckets N (e.g. 10 or 100). How many reducers will process 888’s data?  
b) For Clicks: how do you modify the key so 888’s rows go to N different reducers? (Pseudocode or one sentence.)  
c) For Users: why must you replicate 888’s row N times? One sentence.

**Part 2 — Cost**  
a) Shuffle volume for 888’s clicks: before salting (one reducer) vs after (N reducers). Same total bytes?  
b) Extra shuffle cost for Users (888 only): how many copies of 888’s row?  
c) Is the extra cost for Users acceptable? Why? One sentence.

**Part 3 — Diagram**  
- Draw or reference a diagram that shows: before (one hot reducer) vs after salting (N reducers, replicated small table).

## Skew mitigation flow (diagram)
- Before: one hot reducer; after: salting splits large table, small table replicated to N reducers; merge step.
- Diagram: week3_practice_slide18_skew_mitigation.puml

## Solutions

## Solution 1
**Assumptions:** Records 1–3 only; map emits (word, 1) per word; lowercase.  
**Map outputs:**  
- R1: (the,1),(quick,1),(brown,1),(fox,1)  
- R2: (the,1),(quick,1),(brown,1),(dog,1)  
- R3: (quick,1),(brown,1),(fox,1),(jumps,1)  
**Shuffle groups:** the→[1,1], quick→[1,1,1], brown→[1,1,1], fox→[1,1], dog→[1], jumps→[1]  
**Check:** 4+4+4 = 12 map emits; 6 keys; sum of group sizes = 12.

## Solution 2
**Reduce:** sum values per key.  
**Output:** (the,2), (quick,3), (brown,3), (fox,2), (dog,1), (jumps,1)  
**Check:** Total count = 2+3+3+2+1+1 = 12 = total map emits.

## Solution 3
**Map outputs:** (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5)  
**Shuffle groups:** 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5]  
**Reduce outputs:** 101: 10+7.5+2+11 = 30.5; 102: 5.5+4.5+6 = 16.0; 103: 3+8+1.5 = 12.5  
**Final:** (101, 30.5), (102, 16.0), (103, 12.5). **Check:** 30.5+16+12.5 = 59.0 = sum of amounts.

## Solution 4
**Work:** total operations over all tasks (sum of all task times). **Span:** critical path length (longest chain of dependencies). **Best-case speedup:** upper bound = min(workers, tasks); with 50 workers and 100 map + 10 reduce tasks, speedup ≤ 110 (all tasks parallel); in practice limited by slowest stage (e.g. 10 reducers ⇒ at most 10-way parallelism in reduce).

## Solution 5
**Reasons:** (1) All map output is written to disk/network and read by reducers ⇒ large I/O. (2) Network bandwidth and disk throughput are often the bottleneck, not CPU; shuffle size equals map output size.

## Solution 6
**a)** 40 × 20 B = 800 B.  
**b)** 800 / 5 = 160 B per reducer (approx).  
**c)** 8 pairs (word "the", 1); all go to the same reducer (same key). That reducer gets 8 × 20 = 160 B just for "the" plus other keys hashing to it.

## Solution 7
**a)** 15 × 20 B = 300 B (shuffle size reduced from 800 B).  
**b)** Sum is associative and commutative; combining (the,1)+(the,1)+(the,1) → (the,3) gives same result as if all (the,1) went to reducer and summed there.

## Solution 8
**a)** ~1B (all 888’s clicks go to one reducer).  
**b)** 1B × 100 B = 100 GB.  
**c)** One reducer must hold or process 100 GB; heap or single-task memory limits cause OOM or timeout; other reducers finish quickly (straggler / skew).

## Solution 9
**a)** ~100M each (1B / 10).  
**b)** Users table: one row for 888 replicated 10 times in the shuffle (sent to each of 10 reducers).  
**c)** After join, each reducer outputs (888-i, joined_row); aggregate or merge by user_id 888 (e.g. second MR or in-memory merge) to get final result for 888.

## Solution: Challenge Part 1
**a)** N = 10 (example): 10 reducers process 888’s data.  
**b)** Clicks: for each (888, click), emit (888-salt, click) with salt = random 1..N (or hash(click_id) mod N).  
**c)** Users: 888’s row must join with every 888-salt bucket; so emit (888-1, user), …, (888-N, user) so each reducer has the user row for its bucket.

## Solution: Challenge Part 2
**a)** Same total bytes: 100 GB of click data still moved; now spread over N reducers (each ~100/N GB).  
**b)** 888’s user row replicated N times (e.g. 10 copies) in shuffle.  
**c)** Yes: Users is small (1M rows); replicating one row N times is negligible compared to moving 100 GB of clicks; trade-off is acceptable to avoid OOM.

## Solution: Challenge Part 3
**Diagram:** week3_practice_slide18_skew_mitigation.puml shows: before (one hot reducer with 1B rows), after salting (large table split into N keys 888-1..888-N; small table replicated to all N reducers); second step to merge results per original key 888.
