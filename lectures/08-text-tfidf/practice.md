# Week 8: Text Processing at Scale: TF-IDF — Practice

## Instructions
- Engineering course: show reasoning and calculations
- TF-IDF: show TF, IDF, TF-IDF formulas and numeric steps
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs where applicable
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Documents corpus (TF-IDF and MapReduce)

**Schema:** Input: (doc_id, text). Tokenize: lowercase, split on whitespace. Output: (doc_id, term, tfidf).

**Sample input (10 documents):**

| doc_id | text                         |
|--------|------------------------------|
| 1      | data engineering data        |
| 2      | engineering systems          |
| 3      | data data data               |
| 4      | systems data                 |
| 5      | data engineering systems     |
| 6      | engineering                  |
| 7      | data systems                 |
| 8      | the data the engineering     |
| 9      | the systems the data         |
| 10     | the the the                  |

**Approximate scale (for cost exercises):** 10 docs here; assume 1 million docs, ~200 terms/doc avg, 500K distinct terms; 100 reducers for MapReduce.

**Keys / partitions:** MapReduce Job 1: key (doc_id, term); Job 2: key = term; partition = hash(key) mod R.

**Access patterns:** Compute TF-IDF per (doc_id, term); query by term or doc_id for search index.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count map/shuffle/reduce), solution format with step-by-step and check.
- exercises2.md: Inverted index (map emit (word, (doc_id, pos)), reducer sorts postings); data skew and salting (hot key, salt and replicate); shuffle anatomy and cost.

## Diagram Manifest
- Slide 18 → week8_practice_slide20_tfidf_mapreduce_skew.puml → TF-IDF Job 2 skew: term "the" hot reducer; stop-list mitigation

## Warm-up Exercises

## Exercise 1
For the **Documents** Data Context (10 docs), list the **unique terms** after tokenization (lowercase, split). How many distinct terms are there? Which term appears in the most documents?

## Exercise 2
Define **TF** (term frequency) and **IDF** (inverse document frequency) in one sentence each. Write the formula for TF-IDF score.

## Exercise 3
Using the 10-doc corpus, what is **N** (total documents)? For the term "data", how many documents contain it? So what is **df("data")**?

## Exercise 4
Compute **IDF** for "data", "engineering", "systems", and "the" with smoothing: \(\text{idf}(t) = \log\frac{N+1}{df(t)+1}\), N=10. Use natural log. Which term has the highest IDF and why?

## Exercise 5
In MapReduce Job 2 for TF-IDF (computing df per term), what is the **partition rule**? If R=3 and hash("the") mod 3 = 0, which reducer gets the key "the"? What happens to that reducer if "the" appears in every document?

## Engineering Exercises

## Exercise 6
**TF-IDF by hand (docs 1–3 only):** Using docs 1, 2, 3 from Data Context (ignore docs 4–10). (a) Compute **term counts** per (doc_id, term) and **doc lengths**. (b) Compute **df** for each term (only over docs 1–3) and **N=3**. (c) Compute **IDF** with \(\log\frac{N+1}{df+1}\). (d) Compute **TF** (normalized: count/|d|) and **TF-IDF** for (D1, data), (D1, engineering), (D2, engineering), (D2, systems), (D3, data). Show numeric values (2 decimal places).

## Exercise 7
**Full MapReduce walkthrough (Job 1 — term count per doc):** Using the full 10-doc input, Job 1 emits ((doc_id, term), 1). (a) List **Map output** for docs 8, 9, 10 only (all (k,v) pairs). (b) Assume R=4 and partition = hash(key) mod 4. For key ("8", "the"), assume partition 0; for ("8", "data"), partition 1; for ("8", "engineering"), partition 2. Which **reducer** gets ("8", "the")? (c) For the reducer that receives key ("8", "the"), give **input** (key and list of values) and **output** (key, sum). (d) What is the total number of **map output pairs** for the full 10 docs (count all terms)?

## Exercise 8
**Shuffle size (Job 2):** Job 2 computes df: Map emits (term, doc_id) for each (doc_id, term). (a) How many **(term, doc_id)** pairs are emitted for the full 10 docs? (b) Which **term** appears in the most documents? How many pairs (term, doc_id) will the reducer for that term receive? (c) If at scale we had 1M docs and "the" appeared in all 1M docs, what would the reducer for "the" receive? What failure is likely?

## Exercise 9
**Skew mitigation — stop list:** To avoid hot reducer for "the", we filter out "the" in the Map of Job 1 (and thus never emit (term, doc_id) for "the" in Job 2). (a) After filtering "the", how many (term, doc_id) pairs are emitted for doc 8? (b) Is the final TF-IDF output still correct for ranking documents that contain "the"? Explain in one sentence (e.g. do we need "the" in the index?).

## Exercise 10
**Cost estimate:** Assume 1M docs, 200 terms/doc avg, 500K distinct terms, 100 reducers. (a) Roughly how many **(doc_id, term, 1)** pairs does Job 1 Map emit? (b) If Job 2 shuffle sends (term, doc_id) and we have 100 reducers, what is the **average** number of (term, doc_id) pairs per reducer if keys are balanced? (c) If "the" appears in 80% of docs (skew), how many pairs does the reducer for "the" get? Order of magnitude.

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: TF-IDF pipeline and skew diagram.** (a) **Pipeline:** For the 10-doc corpus, describe the **three MapReduce jobs** for TF-IDF in order: Job 1 (outputs?), Job 2 (outputs?), Job 3 (inputs and output?). (b) **Skew:** Explain why Job 2 partitions by term and why the term "the" causes one reducer to receive most of the (term, doc_id) pairs. (c) **Diagram:** Draw the flow: Job 2 Map emits (term, doc_id) → Shuffle by term → one reducer gets "the" with 10 doc_ids (hot). Show stop-list mitigation: filter "the" in Map so Job 2 never sees it. Diagram: week8_practice_slide20_tfidf_mapreduce_skew.puml (d) **Trade-off:** What do we lose by removing "the" from the index? When is it acceptable?

## Solutions

## Solution 1
- **Unique terms (lowercase, split):** data, engineering, systems, the. **Distinct terms:** 4.
- **Most documents:** "the" appears in docs 8, 9, 10 → 3 docs; "data" in 1,3,4,5,7,8,9 → 7 docs. So "data" appears in the most documents (7).

## Solution 2
- **TF:** Term frequency = how often the term appears in the document (raw count or normalized by doc length).
- **IDF:** Inverse document frequency = log(N/df) or log((N+1)/(df+1)); N = total docs, df = docs containing the term; down-weights common terms.
- **TF-IDF:** tfidf(t,d) = TF(t,d) × IDF(t).

## Solution 3
- **N** = 10 (total documents).
- **"data"** appears in docs 1, 3, 4, 5, 7, 8, 9 → **df("data")** = 7.

## Solution 4
- **IDF** = log((N+1)/(df+1)) = log(11/(df+1)). data: log(11/8)≈0.32; engineering: df=5 → log(11/6)≈0.60; systems: df=5 → log(11/6)≈0.60; the: df=3 → log(11/4)≈1.01.
- **Highest IDF:** "the" (only in 3 docs); "data" lowest (in 7 docs). Rare terms get higher IDF.

## Solution 5
- **Partition rule:** partition_id = hash(key) mod R; same term → same reducer.
- **Reducer for "the":** If hash("the") mod 3 = 0, key "the" goes to **reducer 0**.
- **If "the" in every doc:** Reducer 0 receives 10 (doc_id) values for 10 docs; at scale (1M docs) it would receive 1M values → OOM or straggler.

## Solution 6
- **(a) Term counts (docs 1–3):** D1: data 2, engineering 1; D2: engineering 1, systems 1; D3: data 3. Doc lengths: |D1|=3, |D2|=2, |D3|=3.
- **(b) df (N=3):** data: 2 (D1,D3), engineering: 2 (D1,D2), systems: 1 (D2). N=3.
- **(c) IDF:** idf(data)=log(4/3)≈0.29, idf(engineering)=log(4/3)≈0.29, idf(systems)=log(4/2)=log(2)≈0.69.
- **(d) TF (norm) and TF-IDF:** D1: (data, 2/3, 2/3×0.29≈0.19), (engineering, 1/3, 1/3×0.29≈0.10). D2: (engineering, 1/2, 0.14), (systems, 1/2, 0.35). D3: (data, 3/3=1, 1×0.29≈0.29).

## Solution 7
- **(a) Map output docs 8,9,10:** Doc 8: (("8","the"),1), (("8","data"),1), (("8","the"),1), (("8","engineering"),1). Doc 9: (("9","the"),1), (("9","systems"),1), (("9","the"),1), (("9","data"),1). Doc 10: (("10","the"),1)×3. Full list for 8,9,10: ("8","the")×2, ("8","data")×1, ("8","engineering")×1, ("9","the")×2, ("9","systems")×1, ("9","data")×1, ("10","the")×3.
- **(b)** Key ("8","the") → partition 0 → **reducer 0** (assuming hash gives 0).
- **(c) Reducer for ("8","the"):** Input: key ("8","the"), values [1,1]. Output: ("8","the", 2).
- **(d) Total map output pairs (10 docs):** Count terms: 3+2+3+2+3+1+2+4+4+3 = 27 pairs.

## Solution 8
- **(a)** One (term, doc_id) per (doc_id, term) in corpus. Same count as term occurrences if we emit per occurrence; if we emit distinct (term, doc_id) per doc, we count unique (term, doc) pairs. For 10 docs: e.g. 27 term occurrences → 27 (term, doc_id) pairs if we emit per occurrence; for df we need distinct (term, doc_id), so one emit per (term, doc_id) per doc: e.g. ("the", 8), ("the", 9), ("the", 10), ... Total distinct (term, doc_id) for 10 docs: data 7, engineering 5, systems 5, the 3 → 20 pairs.
- **(b)** "data" in 7 docs → reducer for "data" receives 7 (term, doc_id) pairs (or 7 doc_ids). "the" in 3 docs → 3 pairs.
- **(c)** At scale: reducer for "the" receives 1M (doc_id) values → OOM or timeout; job fails or straggler.

## Solution 9
- **(a) After filtering "the":** Doc 8 terms: data, engineering. So 2 (term, doc_id) pairs for doc 8 (("data", 8), ("engineering", 8)).
- **(b)** For ranking, stop words like "the" usually add little discriminative power; removing them keeps index smaller and avoids skew. We lose ability to rank by "the" (rarely needed). Acceptable when stop words are not query terms of interest.

## Solution 10
- **(a)** 1M × 200 = **200M** (doc_id, term, 1) pairs (order of magnitude).
- **(b)** 200M (term, doc_id) pairs / 100 reducers ≈ **2M** pairs per reducer on average (if balanced).
- **(c)** 80% of 1M = 800K docs; reducer for "the" gets **~800K** values → severe skew.

## Solution 11 (Challenge)
- **(a) Pipeline:** Job 1: (doc_id, text) → Map tokenize, emit ((doc_id, term), 1) → Reduce sum → (doc_id, term, count); side output doc lengths. Job 2: (doc_id, term) → Map emit (term, doc_id) → Reduce count distinct docs → (term, df); N from counter or Job 1. Job 3: Join (doc_id, term, count) with (term, idf) and (doc_id, |d|) → compute TF-IDF → (doc_id, term, tfidf).
- **(b)** Job 2 partitions by term so one reducer gets all doc_ids for that term to count df. "the" in 10 docs → reducer for "the" gets 10 (doc_id); at scale, "the" in all docs → one reducer gets all N doc_ids → hot reducer.
- **(c)** Diagram: week8_practice_slide20_tfidf_mapreduce_skew.puml — Job 2 Map → (term, doc_id) → Shuffle by term → Reducer "the" gets 10 doc_ids (hot); stop-list: filter "the" in Job 1 Map so no (the, doc_id) in Job 2.
- **(d) Trade-off:** We lose "the" in the index; queries for "the" return no or incomplete results. Acceptable when "the" is a stop word and not used for ranking; most search engines drop stop words.
