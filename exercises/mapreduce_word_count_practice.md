# Word Count — MapReduce Practice (Step-by-Step)

## Scenario
You are analyzing short incident summaries from a monitoring system.
Operations wants a quick count of how often each word appears across the summaries
so they can spot recurring issues in dashboards and alerts.
The dataset is small now but will scale to millions of lines.

## Input Data
### Input tables
Each row is one document (incident summary).

| doc_id | text |
|---:|---|
| 1 | server reboot caused network outage |
| 2 | network outage caused data loss |
| 3 | server reboot reboot detected |
| 4 | data pipeline outage resolved |

### Processing rules
1. Lowercase everything (already lowercase).
2. Split on whitespace.
3. Keep duplicates (word frequency matters).
4. No stemming or stopword removal.

## Goal (Expected Output Format)
Produce total counts per word, like:

| word | total_count |
|---|---:|
| outage | 3 |
| reboot | 3 |
| ... | ... |

## Questions

### Q1 — Key/Value Design
What should the mapper emit as key and value so reducers can compute total word counts?

### Q2 — Mapper Output (Explicit)
Write the mapper output **exactly** as `(key, value)` pairs for:
- Document 1
- Document 3
(Include duplicates explicitly.)

### Q3 — Shuffle / Sort
Show the grouped values that arrive to reducers for these keys:
- `reboot`
- `network`
- `outage`

### Q4 — Reducer Logic
Describe, in words, how the reducer computes final counts per word.

### Q5 — Final Output (Explicit)
Write the final output lines for the three keys above.

### Q6 — Combiner: Safe or Not?
Is a combiner safe here? Why or why not?

### Q7 — Engineering Insight
What scalability or skew issue could appear as input grows, and how would you mitigate it?

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits:**
- **Key:** `word`
- **Value:** `1`

This lets reducers sum all `1`s for the same word to get the total count.

## A2 — Mapper Output
Below are the emitted pairs for the requested documents.

### Document 1: "server reboot caused network outage"
- (server, 1)
- (reboot, 1)
- (caused, 1)
- (network, 1)
- (outage, 1)

### Document 3: "server reboot reboot detected"
- (server, 1)
- (reboot, 1)
- (reboot, 1)  ← duplicate occurrence
- (detected, 1)

## A3 — Shuffle / Sort
Grouped values by key (what reducers receive):

### reboot
Values: [1, 1, 1]  ← from doc 1 (1), doc 3 (2)

### network
Values: [1, 1]  ← from doc 1 and doc 2

### outage
Values: [1, 1, 1]  ← from doc 1, doc 2, doc 4

## A4 — Reducer Logic
For each word key:
1. Iterate over all values (a list of `1`s).
2. Sum them to compute the total count.
3. Emit `word<TAB>total_count`.

## A5 — Final Output
- reboot	3
- network	2
- outage	3

## A6 — Combiner Discussion
**Yes, a combiner is safe.**
Summation is associative and commutative, so partial counts can be summed again in reducers
without changing correctness.

## A7 — Engineering Insight
Skew can occur if a very common word dominates (e.g., "error").
This creates a hot reducer and slow job completion.
Mitigate by:
- filtering stopwords in the mapper,
- using a two-stage aggregation (split hot keys), or
- sampling to detect and handle skew.

---

## Common Pitfalls
- Dropping duplicate words (breaks counts).
- Emitting `(doc_id, word)` keys (forces extra reduce steps).
- Forgetting to lowercase, leading to duplicate keys like `Server` vs `server`.

## Optional Extensions
- Add stopword removal and compare count changes.
- Compute both word count and document frequency in a single job.
- Track counts per day by extending the key to `(word, date)`.
