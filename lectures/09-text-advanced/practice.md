# Week 9: Advanced Text Processing Techniques — Practice

## Instructions
- Engineering course: show reasoning and calculations
- N-grams: show extraction steps, counts, and optional TF-IDF where asked
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs where applicable
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Documents corpus (n-grams and MapReduce)

**Schema:** Input: (doc_id, text). Tokenize: lowercase, split on whitespace. N-grams: word bigrams (n=2). Output: (doc_id, ngram, count) or (doc_id, ngram, tfidf).

**Sample input (10 documents):**

| doc_id | text                         |
|--------|------------------------------|
| 1      | data engineering data        |
| 2      | engineering systems           |
| 3      | data data data                |
| 4      | systems data                  |
| 5      | data engineering systems      |
| 6      | engineering                   |
| 7      | data systems                  |
| 8      | the data the engineering      |
| 9      | the systems the data          |
| 10     | the the the                   |

**Approximate scale (for cost exercises):** 10 docs here; assume 1 million docs, ~200 terms/doc avg, bigrams; 100 reducers for MapReduce.

**Keys / partitions:** MapReduce: key (doc_id, ngram); partition = hash(key) mod R. Optional df job: key = ngram.

**Access patterns:** Compute n-gram counts per (doc_id, ngram); query by ngram or doc_id for search/index.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (map/shuffle/reduce), ETL dedup and idempotent merge pattern.
- exercises2.md: Inverted index (map emit (word, (doc_id, pos))), data skew and salting (hot key, salt and replicate); shuffle anatomy and cost; regex/schema-on-read in ingestion.

## Diagram Manifest
- Slide 19 → week9_practice_slide19_ngram_pipeline_reasoning.puml → N-gram pipeline: docs → tokenize → n-gram extract → aggregate → output; skew note

## Warm-up Exercises

## Exercise 1
For the **Documents** Data Context (10 docs), list all **unique bigrams** (word n-gram, n=2) after tokenization (lowercase, split). How many distinct bigrams are there? Which bigram appears in the most documents?

## Exercise 2
Define **word n-gram** and **character n-gram** in one sentence each. For the string "data", list all character trigrams (n=3).

## Exercise 3
Using the 10-doc corpus, for the bigram "data_engineering": (a) In which documents does it appear? (b) What is the **count** of "data_engineering" in doc 1? In doc 5?

## Exercise 4
What is **vocabulary size** (upper bound) for word bigrams if the unigram vocabulary has \(V = 50{,}000\) terms? Why is the actual number of distinct bigrams usually much smaller?

## Exercise 5
In a MapReduce job that emits ((doc_id, ngram), 1) and partitions by (doc_id, ngram), what is the **partition rule**? If R=4 and we use hash(doc_id || ngram) mod 4, which reducer receives the key (1, "data_engineering")? Could one reducer get a very large number of values for a single key?

## Engineering Exercises

## Exercise 6
**Bigram counts by hand (docs 1–3 only):** Using docs 1, 2, 3 from Data Context. (a) Tokenize and list all **bigrams** per doc. (b) Compute **count** per (doc_id, ngram). (c) How many distinct (doc_id, ngram) pairs are there? Show a small table.

## Exercise 7
**Full MapReduce walkthrough (bigram count):** Using the full 10-doc input, Map emits ((doc_id, ngram), 1). (a) List **Map output** for docs 8, 9, 10 only (all (key, value) pairs). (b) Assume R=4 and partition = hash(key) mod 4. For the key (8, "the_data"), assume partition 2. Which **reducer** gets (8, "the_data")? (c) For the reducer that receives key (8, "the_data"), give **input** (key and list of values) and **output** (key, sum). (d) What is the total number of **map output pairs** for the full 10 docs?

## Exercise 8
**Shuffle size:** (a) For the 10-doc corpus, how many ((doc_id, ngram), 1) pairs does Map emit (total)? (b) After **combiner** (sum per (doc_id, ngram)), how many (key, count) pairs are sent to shuffle? (c) If at scale we had 1M docs and 200 terms/doc (bigrams), order-of-magnitude how many pairs without combiner? With combiner (assume 10^7 distinct (doc_id, ngram))?

## Exercise 9
**Skew — df by ngram:** Suppose we add a second job that computes **document frequency** of each bigram: Map emits (ngram, doc_id) for each (doc_id, ngram). Partition by ngram. (a) Which bigram in our 10-doc corpus appears in the most documents? (b) How many (ngram, doc_id) pairs will the reducer for that bigram receive? (c) If at scale "the_data" appeared in 80% of 1M docs, what would the reducer for "the_data" receive? What failure is likely?

## Exercise 10
**Cost estimate:** Assume 1M docs, 200 terms/doc avg, bigrams, 100 reducers. (a) Roughly how many ((doc_id, ngram), 1) pairs does Map emit? (b) What is the **average** number of keys per reducer if partition is by (doc_id, ngram) and keys are balanced? (c) If we partition by ngram only for a df job and "the_data" is in 800K docs, how many values does that reducer get? Order of magnitude.

## Exercise 11
**Regex:** A pipeline uses the regex `^[a-zA-Z0-9\s]+$` to validate that a line contains only letters, digits, and spaces. (a) What does this pattern match? (b) Why might a pattern like `(a+)+b` be dangerous on long input? (c) Suggest one mitigation (timeout, engine, or pattern change).

## Challenge Exercise

## Exercise 12 (Challenge)
**Multi-part: N-gram pipeline and skew.** (a) **Pipeline:** For the 10-doc corpus, describe the **single MapReduce job** for bigram counts: Map input/output, partition key, Reduce input/output. (b) **Skew:** If we added a second job to compute df(ngram) with partition by ngram, explain why the bigram "the_data" (or "the_engineering") could cause one reducer to receive most of the (ngram, doc_id) pairs. (c) **Diagram:** Draw the flow: tokenize → n-gram extract → Map emit ((doc_id, ngram), 1) → Shuffle by (doc_id, ngram) → Reduce sum. Show where combiner fits. Diagram: week9_practice_slide19_ngram_pipeline_reasoning.puml (d) **Mitigation:** How would you avoid the hot reducer in the df job (filter, partition, or cap)?

## Solutions

## Solution 1
- **Unique bigrams (lowercase, split):** data_engineering, engineering_data, engineering_systems, data_data, systems_data, data_systems, the_data, data_the, the_engineering, the_systems, systems_the, the_the. **Distinct:** 12. Doc 6 has one token ⇒ no bigram.
- **Most documents:** "the_data" in docs 8, 9; "data_engineering" in 1, 5; "engineering_systems" in 2, 5. So "the_data" and "data_engineering" and "engineering_systems" each in 2 docs (tie).

## Solution 2
- **Word n-gram:** Contiguous sequence of \(n\) tokens from a tokenized text (e.g. bigram = two consecutive words).
- **Character n-gram:** Contiguous substring of length \(n\) from the character sequence (e.g. trigram = three consecutive characters).
- **Char trigrams of "data":** "dat", "ata" (only two; length 4 ⇒ 4−3+1 = 2 trigrams).

## Solution 3
- (a) "data_engineering" appears in docs 1 and 5 (token sequences [data, engineering, ...]).
- (b) Doc 1: count = 1 (one occurrence: data, engineering). Doc 5: count = 1 (data, engineering, systems ⇒ one "data_engineering").

## Solution 4
- **Upper bound:** \(V^2 = 50{,}000^2 = 2.5 \times 10^9\) possible bigrams.
- **Actual smaller:** Most word pairs never co-occur; corpus uses a small subset of possible combinations; Zipfian distribution ⇒ few bigrams are frequent, many rare or zero.

## Solution 5
- **Partition rule:** key = (doc_id, ngram); partition index = hash(key) mod R; same key always to same reducer.
- **(1, "data_engineering")** goes to reducer hash(1 || "data_engineering") mod 4; depends on hash function.
- **Large values per key:** No; each key (doc_id, ngram) has one count per (doc_id, ngram) after combiner. So at most one value per key in reduce (or many 1s before combiner). Reducer receives one key and one sum (or list of 1s to sum).

## Solution 6
- (a) **Doc 1:** [data, engineering, data] → bigrams: (data_engineering, 1), (engineering_data, 1). **Doc 2:** [engineering, systems] → (engineering_systems, 1). **Doc 3:** [data, data, data] → (data_data, 2).
- (b) **Counts:** (1, data_engineering, 1), (1, engineering_data, 1), (2, engineering_systems, 1), (3, data_data, 2).
- (c) **Distinct (doc_id, ngram):** 4 pairs.

## Solution 7
- (a) **Doc 8:** [the, data, the, engineering] → (8, the_data, 1), (8, data_the, 1), (8, the_engineering, 1). **Doc 9:** [the, systems, the, data] → (9, the_systems, 1), (9, systems_the, 1), (9, the_data, 1). **Doc 10:** [the, the, the] → (10, the_the, 2).
- (b) Partition = hash((8, "the_data")) mod 4 = 2 ⇒ **reducer 2**.
- (c) **Input:** key (8, "the_data"), values [1]. **Output:** (8, "the_data", 1).
- (d) **Total map output pairs:** Count bigrams: doc 1: 2, 2: 1, 3: 2, 4: 1, 5: 2, 6: 0, 7: 1, 8: 3, 9: 3, 10: 2. Sum = 15.

## Solution 8
- (a) **Total Map emits:** 15 (from Solution 7d).
- (b) **After combiner:** 15 pairs (each (doc_id, ngram) appears once per doc; combiner sums 1s ⇒ same 15 (key, count) with count≥1).
- (c) **Scale, no combiner:** 1M × 199 ≈ 2×10^8 pairs. **With combiner:** 10^7 distinct (doc_id, ngram) ⇒ 10^7 pairs (smaller payload per key).

## Solution 9
- (a) **Most documents:** "the_data" in docs 8, 9; "the_engineering" in 8; "the_systems" in 9; "data_engineering" in 1, 5. So "the_data" in 2 docs; same for others. For 10-doc corpus, max df = 2.
- (b) **Reducer for that bigram:** 2 (ngram, doc_id) pairs (e.g. ("the_data", 8), ("the_data", 9)).
- (c) **Scale:** "the_data" in 800K docs ⇒ reducer gets 800K values ⇒ **OOM or straggler**. **Failure:** Out-of-memory or timeout.

## Solution 10
- (a) **Map output pairs:** 1M × 199 ≈ **2×10^8** (with bigrams).
- (b) **Avg keys per reducer:** 2×10^8 / 100 = 2×10^6 keys per reducer (if we count key occurrences; for distinct (doc_id, ngram), distinct keys per reducer ≈ 10^7/100 = 10^5).
- (c) **df job, "the_data" in 800K docs:** Reducer for "the_data" gets **8×10^5** values (order of magnitude).

## Solution 11
- (a) **Pattern:** Matches a string that **only** contains letters, digits, and spaces (from start to end).
- (b) **(a+)+b** is dangerous: on input with many 'a' and no 'b', the engine backtracks over all possible splits of (a+) ⇒ **catastrophic backtracking**, exponential time.
- (c) **Mitigation:** Use a **timeout** per record; or **possessive** (a++)+b; or **non-backtracking** engine; or avoid nested quantifiers on untrusted input.

## Solution 12
- (a) **Job:** Map: (doc_id, text) → tokenize → emit ((doc_id, ngram), 1) for each bigram. Partition by (doc_id, ngram). Reduce: key (doc_id, ngram), values [1,1,...] → sum → (doc_id, ngram, count). Combiner: same as reduce.
- (b) **Skew:** Partition by ngram sends all (ngram, doc_id) with same ngram to one reducer. "the_data" in many docs ⇒ one reducer gets most pairs ⇒ hot reducer.
- (c) **Diagram:** week9_practice_slide19_ngram_pipeline_reasoning.puml — docs → tokenize → n-gram extract → Map ((doc_id, ngram), 1) → Combiner → Shuffle → Reduce → (doc_id, ngram, count).
- (d) **Mitigation:** Filter **stop-ngrams** (e.g. "the_data") in Map so they are not emitted for df job; or **partition by (doc_id, ngram)** for count job and compute df in a separate pass with **cap** on df per ngram; or **sample** for df and extrapolate.
