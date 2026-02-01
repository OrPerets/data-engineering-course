# Homework 2 — MapReduce & TF-IDF

## Instructions
- Submission format: one PDF; include all (k, v) pairs, shuffle groupings, and formulas.
- Allowed: calculator, notes. Not allowed: tool-specific APIs, copy–paste code without explanation.
- Grading: partial credit based on logic; include units for costs and memory.

## Data Context
You have a corpus of 4 documents:
- D1: "data engineering data"
- D2: "engineering systems"
- D3: "data systems systems"
- D4: "streaming data"

Assume whitespace tokenization, lowercase, no stopword removal.
For scaling questions, assume:
- 10,000,000 documents
- Average document length = 200 terms
- Vocabulary size = 1,000,000 terms
- MapReduce uses 200 mappers and 50 reducers
- Each emitted pair is 24 bytes (key + value) on average
- Network shuffle cost equals size of emitted pairs

## Questions
### Question 1 — Warm-up
Perform one full MapReduce word count for D1 and D2 only. Provide:
1) Mapper outputs (k, v)
2) Shuffle groups
3) Reducer outputs

### Question 2 — Engineering Reasoning
Compute the total shuffle communication cost (in GB) for full-corpus word count with 10,000,000 documents. Use the average document length and the emitted pair size. Show your formula and units.

### Question 3 — Cost / Scale Analysis
Compute TF-IDF for the term "data" in D1 and D3 using:
- TF = term count in doc / total terms in doc
- IDF = ln(N / df)
- N = 4 documents
Provide TF, IDF, and TF-IDF values to 3 decimal places.

### Question 4 — Design Decision
You must compute TF-IDF for 10,000,000 documents. Choose between:
A) Two MapReduce jobs (word count → document frequency → TF-IDF)
B) Single MapReduce job with a combiner and in-mapper aggregation
Estimate the memory requirement per mapper if you store a hash map of term counts for one document at a time. Decide and justify using memory and communication costs.

### Question 5 — Challenge (Optional)
Exact TF-IDF is expensive. Propose an approximation that reduces communication cost by at least 50% while keeping top-100 terms per document accurate. State assumptions and quantify the trade-off.

## Solutions
### Solution 1
Mapper outputs for D1: "data engineering data"
- (data, 1), (engineering, 1), (data, 1)
Mapper outputs for D2: "engineering systems"
- (engineering, 1), (systems, 1)

Shuffle groups:
- data → [1, 1]
- engineering → [1, 1]
- systems → [1]

Reducer outputs:
- (data, 2)
- (engineering, 2)
- (systems, 1)

### Solution 2
Total terms emitted = N_docs × avg_terms = 10,000,000 × 200 = 2,000,000,000 pairs.
Shuffle size = pairs × 24 bytes = 48,000,000,000 bytes ≈ 48.0 GB.
Assumption: one (term, 1) per term occurrence; no combiner reduction.

### Solution 3
Document lengths:
- D1 has 3 terms: data, engineering, data
- D3 has 3 terms: data, systems, systems

df("data") = appears in D1, D3, D4 → df = 3.
IDF = ln(4 / 3) = ln(1.333) ≈ 0.288.
TF in D1 = 2/3 = 0.667 → TF-IDF = 0.667 × 0.288 ≈ 0.192.
TF in D3 = 1/3 = 0.333 → TF-IDF = 0.333 × 0.288 ≈ 0.096.

### Solution 4
Option A (two jobs) separates document frequency from per-document TF computation and allows global DF aggregation; communication cost is higher but predictable.
Option B (single job with in-mapper aggregation) reduces emitted pairs using local aggregation.
Memory per mapper: store term counts for one document at a time. Worst case 200 terms, with up to 200 distinct terms. If each hash entry ≈ 32 bytes, memory ≈ 200 × 32 = 6,400 bytes ≈ 6.4 KB per mapper per document. This is small, so in-mapper aggregation is feasible.
Decision: choose B to reduce shuffle volume; DF still needed, so compute DF in the same job by emitting (term, doc_id) only once per term per doc and combining. Communication cost drops because repeated terms in a doc are combined before shuffle. Correctness preserved if combiners are associative and emit counts.

### Solution 5
Approximation: keep only top-k terms per document using local term frequency and emit only those for TF-IDF. If k=100 and avg doc length is 200, emit at most 100 pairs/doc, cutting shuffle by at least 50%. Trade-off: rare but important terms could be dropped; accuracy for top-100 terms remains high if term frequencies are Zipf-distributed. Assumption: top-100 by TF approximates top-100 by TF-IDF for most documents.

