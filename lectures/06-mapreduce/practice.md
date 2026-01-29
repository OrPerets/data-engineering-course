# Week 6: MapReduce Fundamentals — Practice

## Instructions
- Engineering course: show reasoning and calculations
- MapReduce: show map emits (k,v), shuffle groups, reduce outputs explicitly
- All exercises use the Data Context below unless stated otherwise

## Data Context (MANDATORY)

### Word-count input (records 1–4)
- **Format:** one record = one line of text (line_id, text).
- **Sample (4 lines):**
  1. "the quick brown fox"
  2. "the quick brown dog"
  3. "quick brown fox jumps"
  4. "the lazy dog"
- **Keys after map:** word (lowercase); value from map = 1.
- **Approx:** 4 lines, 4+4+4+3 = 15 words ⇒ 15 map emits; 7 distinct words.

### Sales-by-product input (10 records)
- **Format:** each record = (transaction_id, product_id, amount).
- **Sample:** (T1, 101, 10.0), (T2, 102, 5.5), (T3, 101, 7.5), (T4, 103, 3.0), (T5, 102, 4.5), (T6, 101, 2.0), (T7, 103, 8.0), (T8, 102, 6.0), (T9, 101, 11.0), (T10, 103, 1.5)
- **Keys after map:** product_id (101, 102, 103); value = amount.
- **Goal:** total sales per product_id.

### Skew scenario (reference)
- **Clicks:** (user_id, click_ts); user_id 888 has 1B rows; 999,999 users have <1K each.
- **Users:** (user_id, name); 1M rows; join key = user_id.
- **Problem:** hash(888) mod R → one reducer gets ~1B rows ⇒ OOM/timeout.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count, sales per product); map outputs, shuffle groups, reduce outputs; solution structure and phrasing.
- exercises2.md: Module 2 Distributed Computation (anatomy of shuffle, inverted index, skew and salting, combiner); hot key 888 salt-and-replicate; cost reasoning.

## Diagram Manifest
- Slide 18 → week6_practice_slide18_skew_mitigation.puml → before/after salting for hot key

## Warm-up Exercises

## Exercise 1
Using the word-count input (4 lines only), write the **map outputs** (key, value) for each of the 4 records. Assume map emits (word, 1) per word, lowercase. No shuffle or reduce yet.

## Exercise 2
For the same 4 lines, list the **shuffle groups**: key → list of values. How many keys? What is the sum of all value counts across groups?

## Exercise 3
Complete the **reduce** step for word count: for each key, sum the values. Write the final (word, count) output. Verify total count equals total words in the 4 lines.

## Exercise 4
Using the sales-by-product input (all 10 records), show **map outputs** (product_id, amount) as emitted by map. Then list **shuffle groups** (product_id → list of amounts).

## Exercise 5
Complete the **reduce** step for sales-by-product: for each product_id, sum the amounts. Write the final (product_id, total_sales). Verify sum of totals equals sum of all 10 amounts.

## Engineering Exercises

## Exercise 6
**Shuffle size:** Word-count input has 4 lines, 15 words total ⇒ 15 map emits. Assume each (word, 1) pair is 20 bytes (key + value). (a) Total map output size in bytes? (b) This equals shuffle size. With 3 reducers and even key distribution, approx bytes per reducer? (c) The word "the" appears in 3 lines: how many (k,v) pairs does key "the" produce? How many go to one reducer?

## Exercise 7
**Combiner:** For word count, a combiner sums counts locally before shuffle: (the,1),(the,1),(the,1) → (the,3). (a) If after combining we have 8 (k,v) pairs instead of 15, what is the new shuffle size in bytes (still 20 B per pair)? (b) Why is the final reduce output still correct? One sentence.

## Exercise 8
**Skew:** Join Clicks (user_id, ts) with Users (user_id, name). user_id 888 has 1B clicks; 999,999 users have <1K each. Hash partitioning: hash(user_id) mod 1000 → reducer. (a) Approx how many clicks does the reducer for key 888 get? (b) If each click record is 100 B, how much data does that reducer receive (GB)? (c) Why might that reducer OOM or timeout? One sentence.

## Exercise 9
**Salting (setup):** Same as Exercise 8. We use N=10 salt buckets for key 888. (a) For Clicks: how do you modify the key so 888’s rows go to 10 different reducers? (Pseudocode or one sentence.) (b) For Users: how many copies of the row for user_id 888 must be sent (and to which reducers) so the join still works? One sentence.

## Exercise 10
**Salting (cost):** (a) Shuffle volume for 888’s clicks: before salting (one reducer) vs after (10 reducers). Same total bytes? (b) Extra shuffle cost for Users (888 only): how many copies of 888’s row? (c) Draw or reference a diagram: before (one hot reducer) vs after salting (10 reducers, replicated small table). Diagram: week6_practice_slide18_skew_mitigation.puml

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: full walkthrough + skew.** (a) Using the sales-by-product input (10 records), perform a **full manual MapReduce**: write map outputs, shuffle groups, and reduce outputs in a small table. (b) Assume product_id 101 is a "hot key" (e.g. 80% of future data). Describe one mitigation (combiner or salting) and how it changes map key and/or reduce logic. (c) For the mitigation you chose, state one trade-off (e.g. extra network, code complexity, or merge step). Diagram: week6_practice_slide18_skew_mitigation.puml for part (b) if salting.

## Solutions

## Solution 1
- **Assumptions:** 4 lines; map emits (word, 1) per word; lowercase.
- **Map outputs:** R1: (the,1),(quick,1),(brown,1),(fox,1); R2: (the,1),(quick,1),(brown,1),(dog,1); R3: (quick,1),(brown,1),(fox,1),(jumps,1); R4: (the,1),(lazy,1),(dog,1).
- **Check:** 4+4+4+3 = 15 map emits; 7 distinct words (the, quick, brown, fox, dog, jumps, lazy).

## Solution 2
- **Shuffle groups:** brown→[1,1,1], dog→[1,1], fox→[1,1], jumps→[1], lazy→[1], quick→[1,1,1], the→[1,1,1].
- **Count:** 7 keys; sum of group sizes = 3+2+2+1+1+3+3 = 15 = total map emits.

## Solution 3
- **Reduce:** sum values per key. brown→3, dog→2, fox→2, jumps→1, lazy→1, quick→3, the→3.
- **Check:** Total words in 4 lines = 4+4+4+3 = 15; sum of counts = 3+2+2+1+1+3+3 = 15.

## Solution 4
- **Map outputs:** (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5).
- **Shuffle groups:** 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5].

## Solution 5
- **Reduce:** 101→30.5, 102→16.0, 103→12.5.
- **Check:** 10.0+5.5+7.5+3.0+4.5+2.0+8.0+6.0+11.0+1.5 = 58.0; 30.5+16.0+12.5 = 58.0.

## Solution 6
- **Assumptions:** 16 map emits; 20 B per (k,v); 3 reducers.
- (a) Total map output = 15 × 20 = 300 B. Shuffle size = 300 B.
- (b) Even distribution ⇒ 300/3 = 100 B per reducer (approx).
- (c) "the" in 3 lines ⇒ 3 (k,v) pairs for key "the"; all 3 go to one reducer (same key).

## Solution 7
- (a) New shuffle size = 8 × 20 = 160 B (reduced from 300 B).
- (b) Final output correct because sum is associative and commutative; combiner only pre-aggregates, reduce sees same total per key.

## Solution 8
- (a) Reducer for 888 gets ~1B clicks (all rows with user_id 888).
- (b) 1B × 100 B = 100 GB to one reducer.
- (c) Reducer must hold or process 100 GB; heap or disk spill can cause OOM or extreme latency/timeout.

## Solution 9
- (a) Clicks: emit (888||random(1..10), click_data) so 888’s rows spread to 10 keys (888-1 .. 888-10); partition by new key ⇒ 10 reducers.
- (b) Users: emit 10 copies of (888-1, user_row), (888-2, user_row), …, (888-10, user_row) so each of the 10 reducers gets 888’s user row for the join.

## Solution 10
- (a) Same total bytes: 888’s clicks still 100 GB total; now split across 10 reducers (~10 GB each).
- (b) Users: 10 copies of 888’s row (one per salt bucket).
- (c) Diagram: before = one reducer with 100 GB; after = 10 reducers with ~10 GB each; small table replicated 10× for key 888.

## Solution 11
- (a) **Full walkthrough:** Map: (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5). Shuffle: 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5]. Reduce: 101→30.5, 102→16.0, 103→12.5.
- (b) **Mitigation (combiner):** On map side, locally sum amounts per product_id before shuffle: e.g. (101,10.0),(101,7.5) → (101,17.5). Reduces shuffle size; same final result. **Or salting:** If 101 is hot, emit (101-salt, amount) with random salt 1..N; replicate product 101’s dimension row to all N reducers; reduce per (101-salt) then merge sums for 101.
- (c) **Trade-off:** Combiner: no extra merge; requires associative reduce. Salting: spreads load but small table replication and final merge step; more code and network for dimension.
