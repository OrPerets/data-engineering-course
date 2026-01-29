# Week 8: Text Processing at Scale: TF-IDF

## Purpose
- TF-IDF is the workhorse for search, ranking, and text features
- Combines local importance (TF) with global rarity (IDF)
- At scale: MapReduce multi-job; vocabulary and skew drive cost

## Learning Objectives (1/2)
- Define term frequency (TF) and inverse document frequency (IDF)
- Compute TF-IDF score from a small document-term matrix
- Explain why IDF down-weights common terms
- Describe the role of TF-IDF in search ranking

## Learning Objectives (2/2)
- Design a MapReduce pipeline for TF-IDF
- Estimate shuffle size and reducer load
- Identify failure modes: stop-word skew, empty documents
- Apply best practices: stop-word lists, smoothing, idempotent indexing

## Diagram Manifest
- Slide 14 → week8_lecture_slide14_tfidf_pipeline_overview.puml
- Slide 24 → week8_lecture_slide24_mapreduce_execution_flow.puml
- Slide 26 → week8_lecture_slide26_failure_stopword_skew.puml

## The Real Problem This Lecture Solves

## Data Distribution Issue
- TF-IDF pipelines fail not from the formula
- Job 2 partitions by term
- Term appearing in every doc (e.g. "the") sends all doc_ids to one reducer
- ⇒ OOM or straggler

## Storage vs Compute
- Vocabulary V can be millions
- Storing dense V-dimensional vectors per doc is infeasible
- Sparse (doc_id, term, tfidf) is the only option

## Engineering Challenge
- Multi-job pipeline (counts → df/N → TF-IDF)
- Global stats (N, df) and per-doc TF
- Skew and sparsity drive cost and failure

## Cost of Naïve Design (TF-IDF)

## No Stop List
- Term "the" in all N documents
- Job 2 reducer for "the" receives N (term, doc_id) pairs
- ⇒ OOM or extreme straggler
- Stop-word list or df cap is non-negotiable

## In-Lecture Exercise 3: Scale Cost & Skew
- Assume 1M docs, 200 terms/doc, 100 reducers
- Estimate Job 1 map emits
- Estimate average pairs per reducer in Job 2
- If "the" appears in 80% of docs, load for that reducer?

## In-Lecture Exercise 3: Solution (1/2)
- Map emits ≈ 1M × 200 = 200M pairs
- Average per reducer: 200M / 100 = 2M pairs

## In-Lecture Exercise 3: Solution (2/2)
- "the" in 80% of docs ⇒ 0.8M pairs for one reducer
- That reducer becomes a straggler or OOM risk

## In-Lecture Exercise 3: Takeaway
- Average load hides hot-term skew
- Stop-word filtering is a performance safeguard

## Dense Vectors When V is Large
- Store V floats per doc for vocabulary size V=10^6
- ⇒ 4 MB per doc; 10^6 docs ⇒ 4 TB just for vectors
- Sparse (doc_id, term, tfidf) ⇒ O(terms per doc)

## No Smoothing
- df=0 or df=N ⇒ log(0) or division edge cases
- Use \(\log\frac{N+1}{df+1}\) and handle empty docs
- Numerical robustness is production requirement

## Core Concepts (1/2)
- **Term Frequency (TF):** how often term appears in document
- Raw count or normalized
- **Document Frequency (df):** number of docs containing term
- **Inverse Document Frequency (IDF):** \(\log\frac{N}{df}\)
- N = total documents

## Core Concepts (2/2)
- **TF-IDF:** \(\text{tfidf}(t,d) = \text{TF}(t,d) \times \text{IDF}(t)\)
- Balances local relevance and global rarity
- **Guarantees:** deterministic given same tokenization
- **What breaks:** vocabulary size and df aggregation; skew

## Data Context: 10-Doc Corpus
- Terms: data, engineering, systems, the
- N = 10 documents
- Tokenize: lowercase, split on whitespace

## In-Lecture Exercise 1: TF and IDF Basics
- Define TF and IDF in one sentence each
- Write the TF-IDF formula

## In-Lecture Exercise 1: Solution (1/2)
- TF: term frequency in a document (raw or normalized)
- IDF: log-scaled inverse of document frequency

## In-Lecture Exercise 1: Solution (2/2)
- TF-IDF: tfidf(t,d) = TF(t,d) × IDF(t)

## In-Lecture Exercise 1: Takeaway
- TF captures local importance; IDF down-weights common terms

## Formal TF Definitions
- **Raw count:** \(\text{tf}_{\text{raw}}(t,d) = \text{count of } t \text{ in } d\)
- **Normalized:** \(\text{tf}_{\text{norm}}(t,d) = \frac{\text{tf}_{\text{raw}}}{|d|}\)
- |d| = total terms in d
- **Log-scaled:** \(\text{tf}_{\text{log}}(t,d) = 1 + \log(\text{tf}_{\text{raw}})\)
- **Use:** normalized or log-scaled avoids long-doc dominance

## Intuition: Why IDF Down-weights Common Terms
- **Search goal:** rank documents by relevance
- Discriminative terms matter more
- **Common terms:** "the", "a" appear in most docs
- Low discriminative power; IDF small
- **Rare terms:** appear in few docs; IDF large
- **Engineering:** stop words also cause skew

## Formal IDF Definition
- **IDF:** \(\text{idf}(t) = \log\frac{N}{df(t)}\)
- N = total documents, df(t) = docs containing t
- **Smoothing:** \(\text{idf}(t) = \log\frac{N+1}{df(t)+1}\)
- Avoids log(0) when df = N
- **At scale:** N and df must be computed once and broadcast

## Data Context: Docs 1–3 Only
- D1: "data engineering data"
- D2: "engineering systems"
- D3: "data data data"
- N = 3 documents

## In-Lecture Exercise 2: TF-IDF by Hand
- Compute term counts and doc lengths for D1–D3
- Compute df and smoothed IDF for data, engineering, systems
- Compute TF-IDF for (D1,data) and (D2,systems)

## In-Lecture Exercise 2: Solution (1/2)
- Counts: D1 data=2, engineering=1; D2 engineering=1, systems=1; D3 data=3
- Doc lengths: |D1|=3, |D2|=2, |D3|=3
- df: data=2, engineering=2, systems=1

## In-Lecture Exercise 2: Solution (2/2)
- IDF: data=log(4/3)=0.29; engineering=0.29; systems=log(2)=0.69
- TF-IDF(D1,data)=2/3×0.29≈0.19
- TF-IDF(D2,systems)=1/2×0.69≈0.35

## In-Lecture Exercise 2: Takeaway
- TF normalizes within document length
- IDF boosts rare terms
- TF-IDF combines local and global signals

## Tokenization and Normalization
- **Tokenize:** split on whitespace; lowercase
- Optional: stem (Porter), remove punctuation
- **Normalization:** same token everywhere
- E.g. "Data" and "data" → one term
- **Edge cases:** empty doc after tokenize ⇒ |d|=0 ⇒ division by zero
- **Reproducibility:** version tokenization (stemmer, stop list)

## TF-IDF Formula and Vector
- **Score:** \(\text{tfidf}(t,d) = \text{TF}(t,d) \times \text{IDF}(t)\)
- **Document vector:** one dimension per term in vocabulary
- Value = TF-IDF for that term in d
- **Query:** same weighting; similarity = dot product or cosine
- **Engineering:** store sparse vectors or dense arrays

## Sparse vs Dense Storage
- **Sparse:** store only (doc_id, term, tfidf) where tfidf > 0
- Typical doc has few terms vs vocabulary V
- **Dense:** one array of length V per doc
- Wasteful when V large and doc uses few terms
- **Scale:** V = 10^6, 100 terms/doc ⇒ sparse: 100 entries; dense: 10^6

## TF-IDF Pipeline Overview
- Documents → tokenize → term counts per doc
- Compute doc lengths and df per term; then N; then IDF
- Per (doc, term): TF from count and doc length
- TF-IDF = TF × IDF
![](../../diagrams/week8/week8_lecture_slide14_tfidf_pipeline_overview.png)

## Running Example — Data & Goal
- **Corpus:** 3 documents
- D1: "data engineering data"
- D2: "engineering systems"
- D3: "data data data"
- **Goal:** TF-IDF per (doc_id, term)

## Running Example — Input Table

| doc_id | text                    |
|--------|-------------------------|
| 1      | data engineering data   |
| 2      | engineering systems     |
| 3      | data data data          |

- **Vocabulary:** data, engineering, systems
- **Doc lengths:** D1: 3; D2: 2; D3: 3

## Running Example — Step-by-Step (1/4)
- **Step 1: Term counts per doc**
- (1, data, 2), (1, engineering, 1)
- (2, engineering, 1), (2, systems, 1)
- (3, data, 3)
- **Step 2: Doc lengths:** |D1|=3, |D2|=2, |D3|=3

## Running Example — Step-by-Step (2/4)
- **Step 3: Document frequency**
- df(data)=2 (D1,D3)
- df(engineering)=2 (D1,D2)
- df(systems)=1 (D2); N=3
- **IDF (with smoothing):** idf = log((N+1)/(df+1))
- idf(data)=log(4/3), idf(engineering)=log(4/3), idf(systems)=log(2)

## Running Example — Step-by-Step (3/4)
- **TF normalized:** TF(data,D1)=2/3, TF(engineering,D1)=1/3
- TF(data,D3)=3/3=1
- **TF-IDF:** (D1, data): (2/3)×log(4/3)≈0.19
- (D1, engineering): (1/3)×log(4/3)≈0.10
- (D3, data): 1×log(4/3)≈0.29

## Running Example — Step-by-Step (4/4)
- **Output:** (doc_id, term, tfidf)
- D1: (data, 0.19), (engineering, 0.10)
- D2: (engineering, 0.14), (systems, 0.35)
- D3: (data, 0.29)
- **Interpretation:** "systems" only in D2 → high IDF
- "data" in D1 and D3 → lower IDF

## MapReduce for TF-IDF — Job 1
- **Goal:** (doc_id, term, count) and doc lengths
- **Map:** input (doc_id, text) → tokenize
- Emit ((doc_id, term), 1) or (doc_id, (term, 1))
- **Reduce:** key (doc_id, term), values [1,1,...]
- Emit (doc_id, term, sum)
- **Doc length:** second pass or side output

## MapReduce for TF-IDF — Job 2
- **Goal:** N (total docs) and df(term)
- **Input:** (doc_id, term, count) from Job 1
- **Map:** emit (term, doc_id) or (term, 1) per (doc_id, term)
- **Reduce:** key = term, values = list of doc_ids
- df = count distinct docs; N from counter

## MapReduce for TF-IDF — Job 3
- **Goal:** (doc_id, term, tfidf)
- **Input:** Job 1 output + Job 2 output + N
- **Map/Join:** for each (doc_id, term, count)
- Look up |d|, df(term), N; compute TF and IDF
- Emit (doc_id, term, tfidf)
- **Implementation:** broadcast (term, idf) and (doc_id, |d|)

## MapReduce Execution Flow
- Job 1: Docs → Map (tokenize) → Shuffle by (doc_id, term) → Reduce (sum)
- Job 2: (doc_id, term) → Map (emit term) → Shuffle by term → Reduce (count df)
- Job 3: Join → compute TF-IDF → output
![](../../diagrams/week8/week8_lecture_slide24_mapreduce_execution_flow.png)

## Key Design: Shuffle and Partitioning

## Job 1 Partitioning
- Partition by (doc_id, term)
- Reducers get all counts for same (doc, term)
- Balanced if terms spread

## Job 2 Partitioning
- Partition by term
- Same term from all docs to one reducer
- **Skew:** term "the" in every doc → one reducer gets all doc_ids
- **Cost:** shuffle size = number of (term, doc_id) pairs

## Cost & Scaling Analysis (1/3)
- **Time model:** T = T_Job1 + T_Job2 + T_Job3
- Each job has map + shuffle + reduce
- **Job 1:** Map ∝ total terms; shuffle ∝ (doc_id, term, 1) emits
- **Job 2:** Shuffle ∝ (term, doc_id) pairs; skew if few terms dominate

## Cost & Scaling Analysis (2/3)
- **Memory:** Job 2 reducer holds all doc_ids for one term
- If term in all N docs, reducer gets N doc_ids
- **Storage:** output (doc_id, term, tfidf) is sparse
- Vocabulary V and doc count N ⇒ O(N × avg_terms_per_doc)

## Cost & Scaling Analysis (3/3)
- **Network:** Job 1 shuffle = map output
- Job 2 shuffle = (term, doc_id); Job 3 = join traffic
- **Throughput:** limited by Job 2 shuffle when term in most docs
- **Latency:** multi-job pipeline; straggler in Job 2 delays all

## Shuffle Size Example (TF-IDF)
- **Assumptions:** 10^6 docs, 100 terms/doc avg, 500K distinct terms
- **Job 1:** 10^8 (doc_id, term, 1) pairs; ~30 B per pair ⇒ ~3 GB
- **Job 2:** 10^8 (term, doc_id) pairs
- If "the" in all 10^6 docs, one reducer gets 10^6 values
- **Combiner (Job 1):** (doc_id, term) → sum locally; fewer pairs

## Pitfalls & Failure Modes (1/3)
- **Stop-word skew:** "the", "a" appear in almost every doc
- df ≈ N ⇒ one reducer in Job 2 gets most pairs
- **Empty documents:** doc with no terms ⇒ division by zero
- **Numerical edge:** log(0) if df=0; use smoothing

## Pitfalls & Failure Modes (2/3)
- **Hot reducer (Job 2):** term "the" in 10^6 docs
- Reducer receives 10^6 values ⇒ OOM or timeout
- **Mitigation:** stop-word list; filter high-df terms in Map
![](../../diagrams/week8/week8_lecture_slide26_failure_stopword_skew.png)

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor reducer input sizes in Job 2
- Alert if max ≫ median; profile term df distribution
- **Idempotency:** rerun must not duplicate
- Write (doc_id, term, tfidf) with overwrite or key
- **Tokenization drift:** change in stop list ⇒ different TF-IDF

## Failure Scenario — Stop-Word Hot Reducer
- **Scenario:** Job 2 partitions by term
- "the" appears in every document
- **Result:** one reducer receives N (the, doc_i) values
- Others get few
- **Failure:** OOM or extreme straggler

## Best Practices (1/2)
- Use stop-word list or df threshold to drop terms
- Reduces skew and noise
- Normalize TF by doc length or use log(1+tf)
- Smooth IDF: \(\log\frac{N+1}{df+1}\)
- Store vocabulary and N, df for reproducibility

## Best Practices (2/2)
- Prefer sparse (doc_id, term, tfidf) over dense vectors
- Make indexing idempotent: overwrite by (doc_id, term)
- Monitor Job 2 reducer input variance
- Version tokenization and document so reruns are comparable

## Relation to Week 6–7 MapReduce
- **Week 6:** map emits (k,v); shuffle; reduce; same model for Job 1
- **Week 7:** skew and combiner; Job 2 partitions by term
- Stop-word in every doc = hot reducer
- **TF-IDF:** multi-job; Job 1 = word count per (doc, term)
- Job 2 = df per term; Job 3 = join + TF-IDF

## Recap — Engineering Judgment
- **Job 2 skew is the main risk:** partition by term
- Stop-words send all doc_ids to one reducer
- Stop list or df cap is non-negotiable
- **Sparse over dense when V is large:** dense doesn't scale
- Sparse (doc_id, term, tfidf) is production choice
- **Multi-job pipeline:** counts, df, N, then join + TF-IDF
- Idempotent write by (doc_id, term)

## Pointers to Practice
- Compute TF, IDF, and TF-IDF by hand for 3–5 docs
- Full MapReduce walkthrough: 8–12 document records
- One skew case: term in all docs → hot reducer
- One mitigation: stop list or salting; diagram required

## Additional Diagrams
### Practice: TF-IDF MapReduce Skew
![](../../diagrams/week8/week8_practice_slide20_tfidf_mapreduce_skew.png)
