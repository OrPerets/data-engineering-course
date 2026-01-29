# Week 8: Text Processing at Scale: TF-IDF

## Purpose
- TF-IDF is the workhorse for search, ranking, and text features in data pipelines
- Combines local importance (term frequency) with global rarity (inverse document frequency)
- At scale: MapReduce multi-job pipeline; vocabulary and skew drive cost and failure

## Learning Objectives (1/2)
- Define term frequency (TF) and inverse document frequency (IDF) formally
- Compute TF-IDF score from a small document-term matrix and document lengths
- Explain why IDF down-weights terms that appear in many documents
- Describe the role of TF-IDF in search ranking and feature pipelines

## Learning Objectives (2/2)
- Design a MapReduce pipeline for TF-IDF: word count per doc, df, N, then TF-IDF
- Estimate shuffle size and reducer load from corpus size and vocabulary
- Identify failure modes: stop-word skew, empty documents, numerical edge cases
- Apply best practices: stop-word lists, smoothing, idempotent indexing

## Sources Used (Reference Only)
- sources/TF-IDF.pdf
- sources/Lecture 6,7,8.pdf
- sources/Lecture 6,7,8.pptx
- exercises1.md
- exercises2.md

## Diagram Manifest
- Slide 14 → week8_lecture_slide14_tfidf_pipeline_overview.puml → TF-IDF pipeline: docs → tokenize → TF → IDF → scores
- Slide 24 → week8_lecture_slide24_mapreduce_execution_flow.puml → MapReduce jobs for TF-IDF (Job1–Job3)
- Slide 26 → week8_lecture_slide26_failure_stopword_skew.puml → Failure: stop-word hot key → one reducer OOM

## The Real Problem This Lecture Solves
- **At scale:** TF-IDF pipelines fail not from the formula, but from *data distribution*: Job 2 partitions by term; a term that appears in every document (e.g. "the") sends all doc_ids to one reducer → OOM or straggler.
- **Storage vs compute:** Vocabulary V can be millions; storing dense V-dimensional vectors per doc is infeasible; sparse (doc_id, term, tfidf) is the only option for production.
- **Engineering:** Multi-job pipeline (counts → df/N → TF-IDF); global stats (N, df) and per-doc TF; skew and sparsity drive cost and failure.

## Cost of Naïve Design (TF-IDF)
- **No stop list:** Term "the" in all N documents ⇒ Job 2 reducer for "the" receives N (term, doc_id) pairs ⇒ OOM or extreme straggler; indexing job latency = that reducer’s time; stop-word list or df cap is non-negotiable.
- **Dense vectors when V is large:** Store V floats per doc for vocabulary size V=10^6 ⇒ 4 MB per doc; 10^6 docs ⇒ 4 TB just for vectors; sparse (doc_id, term, tfidf) ⇒ O(terms per doc) per doc; storage vs compute trade-off is decisive.
- **No smoothing:** df=0 or df=N ⇒ log(0) or division edge cases; \(\log\frac{N+1}{df+1}\) and handle empty docs; numerical robustness is production requirement.
- **Production cost:** Broken search index, SLA misses, reruns; fixing stop-word skew or storage blow-up post-launch is far more expensive than designing for skew and sparsity up front.

## Core Concepts (1/2)
- **Term Frequency (TF):** how often a term appears in a document; raw count or normalized
- **Document Frequency (df):** number of documents containing the term
- **Inverse Document Frequency (IDF):** \(\log\frac{N}{df}\) or \(\log\frac{N+1}{df+1}\); N = total documents
- **TF-IDF:** \(\text{tfidf}(t,d) = \text{TF}(t,d) \times \text{IDF}(t)\); balances local relevance and global rarity

## Core Concepts (2/2)
- **Guarantees:** deterministic given same tokenization and (N, df); comparable across docs for ranking
- **What breaks at scale:** vocabulary size and df aggregation; skew (e.g. "the" in every doc → hot reducer)
- **Engineering:** multi-job MapReduce; first pass for N and df; second for TF-IDF; storage of vectors

## Formal TF Definitions
- **Raw count:** \(\text{tf}_{\text{raw}}(t,d) = \text{count of } t \text{ in } d\)
- **Normalized (per-doc):** \(\text{tf}_{\text{norm}}(t,d) = \frac{\text{tf}_{\text{raw}}(t,d)}{|d|}\); \(|d|\) = total terms in \(d\)
- **Log-scaled:** \(\text{tf}_{\text{log}}(t,d) = 1 + \log(\text{tf}_{\text{raw}}(t,d))\) if \(\text{tf}_{\text{raw}} > 0\)
- **Use:** normalized or log-scaled avoids long-doc dominance; raw common in simple pipelines

## Intuition: Why IDF Down-weights Common Terms
- **Search goal:** rank documents by relevance to query; discriminative terms matter more
- **Common terms:** "the", "a" appear in most docs → low discriminative power; IDF small
- **Rare terms:** appear in few docs → high discriminative power; IDF large
- **Engineering:** stop words (very high df) also cause skew in df aggregation; filter or cap

## Formal IDF Definition
- **IDF:** \(\text{idf}(t) = \log\frac{N}{df(t)}\); \(N\) = total documents, \(df(t)\) = documents containing \(t\)
- **Smoothing:** \(\text{idf}(t) = \log\frac{N+1}{df(t)+1}\) avoids \(\log 0\) when \(df = N\)
- **Intuition:** rare terms (low df) get high IDF; common terms (high df) get low IDF
- **At scale:** N and df must be computed once and broadcast or joined

## Tokenization and Normalization
- **Tokenize:** split on whitespace; lowercase; optional: stem (Porter), remove punctuation
- **Normalization:** same token everywhere (e.g. "Data" and "data" → one term); affects TF and df
- **Edge cases:** empty doc after tokenize ⇒ |d|=0 ⇒ division by zero for TF; filter or |d|≥1
- **Reproducibility:** version tokenization (stemmer, stop list); same pipeline ⇒ same scores

## TF-IDF Formula and Vector
- **Score:** \(\text{tfidf}(t,d) = \text{TF}(t,d) \times \text{IDF}(t)\)
- **Document vector:** one dimension per term in vocabulary; value = TF-IDF for that term in \(d\)
- **Query:** same weighting for query terms; similarity = dot product or cosine of doc and query vectors
- **Engineering:** store sparse vectors (term_id, tfidf) or dense arrays; vocabulary size drives dimension

## Sparse vs Dense Storage
- **Sparse:** store only (doc_id, term, tfidf) where tfidf > 0; typical doc has few terms vs vocabulary V
- **Dense:** one array of length V per doc; wasteful when V is large and doc uses few terms
- **Scale:** V = 10^6, 100 terms/doc ⇒ sparse: 100 entries; dense: 10^6 entries per doc
- **Use:** search indexes and feature stores prefer sparse; some ML libs expect dense

## TF-IDF Pipeline Overview
- Documents → tokenize (split, lowercase, optional stem) → term counts per doc
- Compute doc lengths and df per term; then N; then IDF per term
- Per (doc, term): TF from count and doc length; TF-IDF = TF × IDF
- Diagram: week8_lecture_slide14_tfidf_pipeline_overview.puml

## Running Example — Data & Goal
- **Corpus:** 3 documents. D1: "data engineering data"; D2: "engineering systems"; D3: "data data data"
- **Schema:** doc_id, text; tokenize → (doc_id, term, count); goal: TF-IDF per (doc_id, term)
- **Engineering objective:** reproducible scores; same pipeline scales to N docs and V terms

## Running Example — Input Table
- **Sample input:**

| doc_id | text                    |
|--------|-------------------------|
| 1      | data engineering data   |
| 2      | engineering systems    |
| 3      | data data data         |

- **Vocabulary (after tokenize):** data, engineering, systems
- **Doc lengths:** D1: 3; D2: 2; D3: 3

## Running Example — Step-by-Step (1/4)
- **Step 1: Term counts per doc.** (doc_id, term, count): (1, data, 2), (1, engineering, 1), (2, engineering, 1), (2, systems, 1), (3, data, 3)
- **Step 2: Doc lengths.** |D1|=3, |D2|=2, |D3|=3
- **Step 3: Document frequency.** df(data)=2 (D1,D3), df(engineering)=2 (D1,D2), df(systems)=1 (D2); N=3

## Running Example — Step-by-Step (2/4)
- **IDF (with smoothing):** \(\text{idf} = \log\frac{N+1}{df+1}\). idf(data)=log(4/3), idf(engineering)=log(4/3), idf(systems)=log(4/2)=log 2
- **TF normalized:** TF(data,D1)=2/3, TF(engineering,D1)=1/3; TF(data,D3)=3/3=1; etc.
- **TF-IDF:** e.g. (D1, data): (2/3)×log(4/3); (D1, engineering): (1/3)×log(4/3); (D3, data): 1×log(4/3)

## Running Example — Step-by-Step (3/4)
- **Output (conceptually):** (doc_id, term, tfidf). D1: (data, 0.19), (engineering, 0.10); D2: (engineering, 0.14), (systems, 0.35); D3: (data, 0.29)
- **Interpretation:** "systems" only in D2 → high IDF; "data" in D1 and D3 → lower IDF; D3 has most "data" → highest TF-IDF for data in D3
- Diagram: week8_lecture_slide14_tfidf_pipeline_overview.puml (pipeline; numbers in slides)

## Running Example — Step-by-Step (4/4)
- **Result:** Sparse (doc_id, term, tfidf) suitable for search index or feature store
- **Conclusion:** Multi-step pipeline; N and df are global stats; TF is per-doc; IDF is per-term
- **Trade-off:** Storing full vectors = V floats per doc; sparse = only non-zero terms; V large ⇒ sparse essential

## MapReduce for TF-IDF — Job 1
- **Goal:** (doc_id, term, count) and doc lengths
- **Map:** input (doc_id, text) → tokenize → emit ((doc_id, term), 1) or (doc_id, (term, 1))
- **Reduce (term count per doc):** key (doc_id, term), values [1,1,...] → emit (doc_id, term, sum)
- **Doc length:** second pass or side output: (doc_id, total_terms); or combine in same job with two emit types

## MapReduce for TF-IDF — Job 2
- **Goal:** N (total docs) and df(term) = number of docs containing term
- **Input:** (doc_id, term, count) from Job 1; or (doc_id, term) distinct
- **Map:** emit (term, doc_id) or (term, 1) per (doc_id, term) with dedup per doc
- **Reduce:** key = term, values = list of doc_ids or 1s → df = count distinct docs; N from separate counter or job

## MapReduce for TF-IDF — Job 3
- **Goal:** (doc_id, term, tfidf)
- **Input:** Job 1 output (doc_id, term, count), doc lengths; Job 2 output (term, df); N
- **Map/Join:** for each (doc_id, term, count), look up |d|, df(term), N; compute TF and IDF; emit (doc_id, term, tfidf)
- **Implementation:** broadcast (term, idf) and (doc_id, |d|); or join in reduce; single reduce per (doc_id, term) if pre-joined

## MapReduce Execution Flow (TF-IDF)
- Job 1: Docs → Map (tokenize, emit (doc_id, term, 1)) → Shuffle by (doc_id, term) → Reduce (sum) → (doc_id, term, count) + doc lengths
- Job 2: (doc_id, term) → Map (emit (term, doc_id)) → Shuffle by term → Reduce (count distinct docs) → (term, df); N from Job 1 or counter
- Job 3: Join (doc_id, term, count) with (term, idf) and (doc_id, |d|) → compute TF-IDF → output
- Diagram: week8_lecture_slide24_mapreduce_execution_flow.puml

## Key Design: Shuffle and Partitioning (Job 1–2)
- **Job 1:** Partition by (doc_id, term) ⇒ reducers get all counts for same (doc, term); balanced if terms spread
- **Job 2:** Partition by term ⇒ same term from all docs to one reducer; **skew:** term "the" in every doc → one reducer gets all doc_ids
- **Cost:** Job 2 shuffle size = number of (term, doc_id) pairs; hot term ⇒ one partition huge

## Cost & Scaling Analysis (1/3)
- **Time model:** T = T_Job1 + T_Job2 + T_Job3; each job has map + shuffle + reduce
- **Job 1:** Map ∝ total terms in corpus; shuffle ∝ (doc_id, term, 1) emits; reduce ∝ unique (doc_id, term)
- **Job 2:** Shuffle ∝ (term, doc_id) pairs; one reducer per term ⇒ skew if few terms dominate df

## Cost & Scaling Analysis (2/3)
- **Memory:** Reducer for Job 2 holds all doc_ids for one term; if term in all N docs, reducer gets N doc_ids
- **Storage:** Output (doc_id, term, tfidf) is sparse; vocabulary V and doc count N ⇒ O(N × avg_terms_per_doc) non-zero entries
- **Vocabulary:** V can be millions; df and IDF fit in memory per term; document vectors stored sparse

## Cost & Scaling Analysis (3/3)
- **Network:** Job 1 shuffle = map output (doc_id, term, 1); Job 2 shuffle = (term, doc_id) or (term, 1); Job 3 = join traffic
- **Throughput:** Limited by shuffle of Job 2 when one term appears in most docs (stop-word skew)
- **Latency:** Multi-job pipeline; total latency = sum of job latencies; straggler in Job 2 delays pipeline

## Shuffle Size Example (TF-IDF)
- **Assumptions:** 10^6 docs, 100 terms/doc avg, 500K distinct terms
- **Job 1:** 10^8 (doc_id, term, 1) pairs; ~30 B per pair ⇒ ~3 GB shuffle (before combiner)
- **Job 2:** 10^8 (term, doc_id) pairs; same order of magnitude; if "the" in all 10^6 docs, one reducer gets 10^6 values
- **Combiner (Job 1):** (doc_id, term) → sum locally ⇒ fewer pairs; Job 2 no simple combiner for distinct count

## Pitfalls & Failure Modes (1/3)
- **Stop-word skew:** Terms like "the", "a" appear in almost every doc; df ≈ N ⇒ one reducer in Job 2 gets most pairs
- **Empty documents:** Doc with no terms ⇒ division by zero for TF if normalized by |d|; filter or |d| ≥ 1
- **Numerical edge:** log(0) if df=0; use smoothing (df+1, N+1); zero TF ⇒ TF-IDF = 0

## Pitfalls & Failure Modes (2/3)
- **Hot reducer (Job 2):** Term "the" in 10^6 docs ⇒ reducer for "the" receives 10^6 (doc_id or 1) values ⇒ OOM or timeout
- **Mitigation:** Stop-word list: filter out high-df terms before Job 2 or in Map; or cap df for IDF
- Diagram: week8_lecture_slide26_failure_stopword_skew.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** Monitor reducer input sizes in Job 2; alert if max ≫ median; profile term df distribution
- **Idempotency:** Re-run of indexing must not duplicate; write (doc_id, term, tfidf) with overwrite or keyed by (doc_id, term)
- **Tokenization drift:** Lowercase/stem/stop-word changes ⇒ different TF-IDF; version pipeline and vocabulary

## Failure Scenario — Stop-Word Hot Reducer
- **Scenario:** Job 2: partition by term; "the" appears in every document
- **Result:** One reducer receives (the, doc_1), (the, doc_2), ... (the, doc_N) ⇒ N values; others get few
- **Failure:** OOM (cannot hold N doc_ids) or extreme straggler; job latency = that reducer's time
- Diagram: week8_lecture_slide26_failure_stopword_skew.puml

## Best Practices (1/2)
- Use stop-word list or df threshold to drop terms before IDF aggregation; reduces skew and noise
- Normalize TF by doc length or use log(1+tf) to avoid long-doc bias
- Smooth IDF: \(\log\frac{N+1}{df+1}\); avoid log(0) and division by zero
- Store vocabulary and N, df for reproducibility and incremental updates

## Best Practices (2/2)
- Prefer sparse (doc_id, term, tfidf) over dense vectors when vocabulary is large
- Make indexing idempotent: overwrite by (doc_id, term) or partition by doc batch
- Monitor Job 2 reducer input variance; sample term df to detect stop-word-like terms
- Version tokenization (lowercase, stemmer, stop list) and document so reruns are comparable

## Relation to Week 6–7 MapReduce
- **Week 6:** Map emits (k,v); shuffle groups by key; reduce aggregates; same model for Job 1 (term count per doc)
- **Week 7:** Skew (hot key) and combiner; Job 2 partitions by term ⇒ stop-word in every doc = hot reducer
- **TF-IDF:** multi-job pipeline; Job 1 = word count per (doc, term); Job 2 = df per term; Job 3 = join + TF-IDF
- **Mitigation:** stop list (filter in Map); combiner in Job 1 when summing counts

## Recap — Engineering Judgment
- **Job 2 skew is the main risk:** Partition by term ⇒ stop-words in every doc send all doc_ids to one reducer; stop list or df cap is non-negotiable; monitor reducer input variance in Job 2.
- **Sparse over dense when V is large:** Vocabulary drives dimension; dense V floats per doc does not scale; sparse (doc_id, term, tfidf) is the production choice; storage vs compute trade-off is explicit.
- **Multi-job pipeline:** Counts and doc lengths (Job 1); df and N (Job 2); join + TF-IDF (Job 3); global stats must be computed once and joined; idempotent write by (doc_id, term).
- **Non-negotiable:** Smooth IDF and handle empty docs; version tokenization; profile term df to catch stop-word-like terms before they become incidents.

## Pointers to Practice
- Compute TF, IDF, and TF-IDF by hand for a small corpus (3–5 docs, 5–10 terms)
- Full MapReduce walkthrough: 8–12 document records → Map emits → Shuffle groups → Reduce outputs for one job
- One skew case: term in all docs → hot reducer; one mitigation: stop list or salting; diagram required
