# MapReduce Practice — Inverted Index (Step-by-Step)

## Scenario
You are building a tiny search feature for a document collection (think: internal wiki or log snippets).
Given a set of documents, you want an **inverted index**:

> For each term, list the documents that contain it, along with the term frequency in each document.

This is a canonical MapReduce job because it:
- scans documents in parallel (Map)
- groups by term (Shuffle/Sort)
- aggregates posting lists (Reduce)

---

## Input Data

### Documents (the input files)
Assume each row is one document (document ID + raw text).

| doc_id | text |
|---:|---|
| 1 | data engineering is fun and practical |
| 2 | data pipelines need reliable data quality |
| 3 | mapreduce is practical for large scale data processing |
| 4 | quality matters in data engineering pipelines |

### Tokenization rules (fixed for the exercise)
1. Lowercase everything (already lowercase in our sample).
2. Split on whitespace.
3. No stemming.
4. Keep duplicates (so term frequency can be computed).
5. Ignore punctuation (none appears here).

---

## Goal (Expected Output Format)
Produce records like:

| term | postings |
|---|---|
| data | 1:1,2:2,3:1,4:1 |
| engineering | 1:1,4:1 |
| pipelines | 2:1,4:1 |
| ... | ... |

Where `doc:count` means **term frequency** in that doc.

---

## Questions

### Q1 — Design the Key/Value pairs
What key/value should the mapper emit so that reducers can build the posting list:
`term -> (doc_id, count_in_doc)` ?

### Q2 — Mapper output (explicit)
For each document, write the mapper output **exactly** as `(key, value)` pairs
for the terms:
- `data`
- `engineering`
- `pipelines`
- `quality`
(Include all occurrences, meaning duplicates should appear multiple times.)

### Q3 — Shuffle/Sort grouping
Show the grouped values that arrive to the reducer **for each of these keys**:
- `data`
- `engineering`
- `pipelines`
- `quality`

### Q4 — Reducer logic
Write the reducer logic (in words) that converts grouped values into:
`term -> doc_id:term_frequency` posting lists, sorted by `doc_id` ascending.

### Q5 — Final output (explicit)
Write the final reducer output lines (for the same keys):
- `data`
- `engineering`
- `pipelines`
- `quality`

### Q6 (Engineering) — Combiner: is it safe and useful?
Can we add a combiner here?
If yes: what does it do, and why is it correct?
If no: explain what breaks.

---

# Step-by-Step Solution

## A1 — Key/Value design
**Mapper emits:**
- **Key:** `(term, doc_id)`
- **Value:** `1`

This pattern is common because counting is easy:
- all records with the same `(term, doc_id)` are grouped
- reducer (or combiner) sums the 1s to get term frequency per document

Later, we format the posting list per `term` (see A4).

---

## A2 — Mapper output (explicit) for selected terms
Below are the emitted pairs **only for** the requested terms.
Format: `((term, doc_id), 1)`

### Document 1: "data engineering is fun and practical"
- ((data, 1), 1)
- ((engineering, 1), 1)

### Document 2: "data pipelines need reliable data quality"
- ((data, 2), 1)
- ((pipelines, 2), 1)
- ((data, 2), 1)        ← second occurrence
- ((quality, 2), 1)

### Document 3: "mapreduce is practical for large scale data processing"
- ((data, 3), 1)

### Document 4: "quality matters in data engineering pipelines"
- ((quality, 4), 1)
- ((data, 4), 1)
- ((engineering, 4), 1)
- ((pipelines, 4), 1)

---

## A3 — Shuffle/Sort grouping (what reducers see)
Records are grouped by **key** `(term, doc_id)`.

### (data, 1)
Values: [1]

### (data, 2)
Values: [1, 1]

### (data, 3)
Values: [1]

### (data, 4)
Values: [1]

### (engineering, 1)
Values: [1]

### (engineering, 4)
Values: [1]

### (pipelines, 2)
Values: [1]

### (pipelines, 4)
Values: [1]

### (quality, 2)
Values: [1]

### (quality, 4)
Values: [1]

---

## A4 — Reducer logic (to postings)
Because keys are sorted as `(term, doc_id)`, all pairs for the same `term` arrive consecutively.

Reducer does:
1. For each key `(term, doc_id)`: sum values → `tf`
2. Maintain a “current term” buffer:
   - append `doc_id:tf`
   - when `term` changes, emit the buffered posting list for the previous term
3. Output format:
   - `term<TAB>doc1:tf1,doc2:tf2,...`
4. Postings are already sorted by doc_id due to key sorting.

---

## A5 — Final output (explicit)

### data
- doc 1: 1
- doc 2: 2
- doc 3: 1
- doc 4: 1

Output:
- data\t1:1,2:2,3:1,4:1

### engineering
Output:
- engineering\t1:1,4:1

### pipelines
Output:
- pipelines\t2:1,4:1

### quality
Output:
- quality\t2:1,4:1

---

## A6 — Combiner: safe and useful?
**Yes, a combiner is safe and helpful** for the counting step.

### What it does
On each mapper node, it aggregates locally:
- input: `((term, doc_id), 1)` many times
- output: `((term, doc_id), partial_count)`

### Why it is correct
Counting via sum is associative and commutative:
- `sum(sum(partials)) = sum(all)`

### What not to do
Do **not** build final posting strings in the combiner.
The combiner should only output structured counts so the final reducer can merge globally.

---

## Complexity intuition (engineering view)
Let:
- `N` = total number of tokens in the corpus
- `U` = unique `(term, doc_id)` pairs

- Map emits ~`N` records
- Shuffle moves ~`N` records (reduced with combiner)
- Reduce outputs one line per term, with total posting size ~`U`

---

## Common pitfalls
- Removing duplicates in Map (breaks term frequency).
- Keying only by `term` without doc_id (can’t separate docs).
- Formatting postings too early (combiner/reducer merge becomes messy).
- Unclear tokenization rules (results become ambiguous).

---

## Optional extension (harder)
- Remove stopwords (e.g., “is”, “and”, “in”, “for”)
- Add document length normalization (prep for TF-IDF)
- Sort postings by `tf DESC` within each term (secondary sort)
