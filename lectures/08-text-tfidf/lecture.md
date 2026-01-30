# Week 8: Text Processing at Scale — TF-IDF

## Purpose
- TF-IDF is the foundational algorithm for document ranking and search
- Combines local term importance (TF) with global rarity (IDF)
- At scale: multi-job pipeline; vocabulary size and skew dominate cost

## Learning Objectives
- Define TF-IDF in the vector space model framework
- State why TF-IDF is a data engineering problem, not ML
- Compute TF-IDF from a document-term matrix
- Design MapReduce pipeline for distributed TF-IDF
- Analyze sparsity constraints and storage requirements
- Identify failure modes: stop-word skew, vocabulary explosion

---

# Part I: The Information Retrieval Problem

## The Problem Statement
- **Input:** Corpus $D = \{d_1, d_2, \ldots, d_N\}$ of $N$ documents
- **Query:** User search query $q$
- **Goal:** Rank documents by relevance to $q$
- **Output:** Ordered list of documents

## Why This Is a Data Engineering Problem

### Not Machine Learning
- No training; no model parameters learned
- Deterministic: same corpus → same TF-IDF values
- **Pure computation:** Count, aggregate, normalize, store

### The Engineering Challenge
- $N = 10^9$ documents (web scale)
- Vocabulary $V = 10^6$ terms
- Computing and storing requires distributed systems
- **Bottleneck:** Global statistics (df, N) require full corpus scan

## Why Exact Computation Is Hard at Scale
- **Per-document TF:** Local computation; $O(|d|)$
- **Document frequency df(t):** Global; requires counting across all $N$ docs
- **Constraint:** $N \times |V|$ potential entries
- **Impossibility:** Dense storage at $N = 10^9$, $|V| = 10^6$ → $10^{15}$ entries

---

# Part II: Vector Space Model — Formal Framework

## Documents as Vectors
- **Vocabulary:** $V = \{t_1, t_2, \ldots, t_{|V|}\}$
- **Document vector:** $\vec{d} \in \mathbb{R}^{|V|}$
- Component $d_i$ = weight of term $t_i$ in document $d$
- **Query vector:** $\vec{q} \in \mathbb{R}^{|V|}$

## Similarity Measure
- **Cosine similarity:**
$$
\text{sim}(q, d) = \frac{\vec{q} \cdot \vec{d}}{|\vec{q}| \cdot |\vec{d}|} = \frac{\sum_i q_i \cdot d_i}{\sqrt{\sum_i q_i^2} \cdot \sqrt{\sum_i d_i^2}}
$$
- **Interpretation:** Angle between vectors; 1 = identical direction
- **Ranking:** Sort documents by $\text{sim}(q, d)$ descending

## The Weighting Problem
- **Raw counts:** Common terms dominate (e.g., "the")
- **Need:** Down-weight common terms; up-weight rare terms
- **Solution:** TF-IDF weighting scheme

---

# Part III: TF-IDF — Mathematical Definition

## Term Frequency (TF)

### Raw Count
$$
\text{tf}_{\text{raw}}(t, d) = f_{t,d} = \text{count of } t \text{ in } d
$$

### Normalized TF
$$
\text{tf}(t, d) = \frac{f_{t,d}}{|d|}
$$
- $|d|$ = total terms in document $d$
- **Interpretation:** Fraction of document devoted to term $t$

### Log-Scaled TF
$$
\text{tf}_{\text{log}}(t, d) = 1 + \log(f_{t,d}) \quad \text{if } f_{t,d} > 0
$$
- **Purpose:** Diminishing returns for repeated terms

## Document Frequency (DF)
$$
\text{df}(t) = |\{d \in D : t \in d\}|
$$
- **Interpretation:** Number of documents containing term $t$
- **Range:** $1 \leq \text{df}(t) \leq N$

## Inverse Document Frequency (IDF)
$$
\text{idf}(t) = \log \frac{N}{\text{df}(t)}
$$
- **Interpretation:** Rarity measure; high for rare terms
- **Extreme cases:**
  - $\text{df}(t) = 1$: $\text{idf}(t) = \log N$ (maximum)
  - $\text{df}(t) = N$: $\text{idf}(t) = 0$ (no discrimination)

## Smoothed IDF
$$
\text{idf}_{\text{smooth}}(t) = \log \frac{N + 1}{\text{df}(t) + 1}
$$
- **Purpose:** Avoid division by zero; numerical stability
- **Also handles:** Terms appearing in all documents

## TF-IDF Weight
$$
\text{tfidf}(t, d) = \text{tf}(t, d) \times \text{idf}(t)
$$
- **High when:** Term is frequent in $d$ AND rare overall
- **Low when:** Term is rare in $d$ OR common overall

---

# Part IV: Why Exact TF-IDF Fails at Scale

## The Storage Problem
- **Dense representation:** $N \times |V|$ matrix
- $N = 10^6$ docs, $|V| = 10^5$ terms → $10^{11}$ entries
- 4 bytes per float → 400 GB just for one matrix
- **At web scale:** $N = 10^9$ → 400 PB (impossible)

## The Sparsity Solution
- **Observation:** Each document uses $\ll |V|$ terms
- Typical document: 100–1000 unique terms
- $|V| = 10^6$ → sparsity = $\frac{1000}{10^6} = 0.1\%$
- **Sparse storage:** Only store non-zero entries

## Sparse Representation
$$
\text{Storage} = O(\text{nnz}) = O\left(\sum_d |d|_{\text{unique}}\right)
$$
- Store triples: $(d, t, \text{tfidf}(t, d))$
- **Example:** $10^6$ docs × 500 terms/doc = $5 \times 10^8$ entries
- 4 bytes per entry → 2 GB (feasible)

## The df Computation Problem
- **For each term $t$:** Count documents containing $t$
- **Naïve:** Scan all $N$ documents for each of $|V|$ terms → $O(N \times |V|)$
- **Better:** Single pass, count per term → $O(\sum_d |d|)$
- **Challenge:** Requires global aggregation; distributed shuffle

---

# Part V: Manual TF-IDF Computation

## Example Corpus

| doc_id | text |
|--------|------|
| D1 | data engineering data |
| D2 | engineering systems |
| D3 | data data data |

- $N = 3$ documents
- Vocabulary: $V = \{data, engineering, systems\}$, $|V| = 3$

## Step 1: Term Counts

| doc | data | engineering | systems |
|-----|------|-------------|---------|
| D1  | 2    | 1           | 0       |
| D2  | 0    | 1           | 1       |
| D3  | 3    | 0           | 0       |

## Step 2: Document Lengths
- $|D1| = 3$, $|D2| = 2$, $|D3| = 3$

## Step 3: Term Frequency (Normalized)

| doc | tf(data) | tf(engineering) | tf(systems) |
|-----|----------|-----------------|-------------|
| D1  | 2/3 = 0.67 | 1/3 = 0.33 | 0 |
| D2  | 0 | 1/2 = 0.50 | 1/2 = 0.50 |
| D3  | 3/3 = 1.00 | 0 | 0 |

## Step 4: Document Frequency
- df(data) = 2 (D1, D3)
- df(engineering) = 2 (D1, D2)
- df(systems) = 1 (D2)

## Step 5: IDF (Smoothed)
$$
\text{idf}(t) = \log \frac{N + 1}{\text{df}(t) + 1} = \log \frac{4}{\text{df}(t) + 1}
$$
- idf(data) = $\log(4/3) = 0.29$
- idf(engineering) = $\log(4/3) = 0.29$
- idf(systems) = $\log(4/2) = 0.69$

## Step 6: TF-IDF Weights

| doc | tfidf(data) | tfidf(engineering) | tfidf(systems) |
|-----|-------------|--------------------|--------------  |
| D1  | 0.67 × 0.29 = 0.19 | 0.33 × 0.29 = 0.10 | 0 |
| D2  | 0 | 0.50 × 0.29 = 0.15 | 0.50 × 0.69 = 0.35 |
| D3  | 1.00 × 0.29 = 0.29 | 0 | 0 |

## Interpretation
- "systems" has highest weight in D2 (only doc with it)
- "data" has highest weight in D3 (most frequent there)
- "engineering" moderate everywhere (appears in 2/3 docs)

---

# Part VI: Distributed TF-IDF — MapReduce Pipeline

## Pipeline Overview
- **Job 1:** Term counts per document → $(d, t, count)$, $|d|$
- **Job 2:** Document frequency per term → $(t, df)$, $N$
- **Job 3:** Compute TF-IDF → $(d, t, tfidf)$

## Job 1: Term Counts

### Map
- **Input:** $(doc\_id, text)$
- **Process:** Tokenize; count terms
- **Output:** $((doc\_id, term), 1)$

### Reduce
- **Input:** $((doc\_id, term), [1, 1, \ldots])$
- **Output:** $(doc\_id, term, count)$

### Combiner
- Sum counts locally: $((doc\_id, term), count)$

### Cost Analysis
$$
C_1 = \sum_d |d| \times s
$$
- One emission per term occurrence; combiner reduces to unique pairs

## Job 2: Document Frequency

### Map
- **Input:** $(doc\_id, term, count)$
- **Output:** $(term, 1)$ — one per unique (doc, term)

### Reduce
- **Input:** $(term, [1, 1, \ldots])$
- **Output:** $(term, df)$

### The Skew Problem
- Stop word "the" appears in all $N$ documents
- Reducer for "the" receives $N$ values
- **Failure:** $N = 10^6$ → OOM

### Cost Analysis
$$
C_2 = \text{(unique (doc, term) pairs)} \times s
$$

## Job 3: TF-IDF Computation

### Inputs
- Job 1 output: $(doc\_id, term, count)$
- Job 2 output: $(term, df)$
- Global: $N$, $(doc\_id, |d|)$

### Map/Broadcast
- Broadcast $(term \rightarrow df)$ and $(doc\_id \rightarrow |d|)$
- For each $(doc\_id, term, count)$:
  - Look up $|d|$ and $df(term)$
  - Compute $tf = count / |d|$
  - Compute $idf = \log((N+1)/(df+1))$
  - Emit $(doc\_id, term, tf \times idf)$

### Cost Analysis
- Shuffle: 0 if broadcast fits; otherwise join cost

## Pipeline Diagram
- (see Diagram: week8_lecture_slide14_tfidf_pipeline_overview.puml)

---

# Part VII: Cost and Complexity Analysis

## Total Communication Cost
$$
C_{\text{total}} = C_1 + C_2 + C_3
$$

### Job 1 (Term Counts)
- Without combiner: $\sum_d |d|$ pairs
- With combiner: unique $(doc, term)$ pairs ≈ $\sum_d |d|_{unique}$

### Job 2 (Document Frequency)
- Input: unique $(doc, term)$ pairs
- Output: $|V|$ terms with df values

### Job 3 (TF-IDF)
- Broadcast: $|V| \times s_{df} + N \times s_{len}$
- Or join shuffle: $\sum_d |d|_{unique} + |V|$

## Worked Example
- $N = 10^6$ documents
- Average 200 unique terms per document
- $|V| = 500K$ vocabulary
- Pair size: 30 bytes

### Job 1
- Map emissions (with combiner): $10^6 \times 200 = 2 \times 10^8$ pairs
- Shuffle: $2 \times 10^8 \times 30 = 6$ GB

### Job 2
- Map emissions: $2 \times 10^8$ (one per unique doc-term)
- Shuffle: $2 \times 10^8 \times 10 = 2$ GB

### Job 3
- Broadcast df table: $500K \times 12 = 6$ MB
- Broadcast doc lengths: $10^6 \times 8 = 8$ MB
- **Total broadcast:** 14 MB (fits easily)

## Time Complexity
$$
T = T_1 + T_2 + T_3
$$
- Each job: $O\left(\frac{\text{shuffle}}{B \cdot P}\right)$ for bandwidth $B$, parallelism $P$

---

# Part VIII: The Stop-Word Skew Problem

## Why Stop Words Cause Failure
- "the", "a", "is", "to" appear in nearly all documents
- $\text{df}(\text{"the"}) \approx N$
- Job 2 reducer for "the" receives $N$ values
- **Memory:** $N \times s_{doc\_id}$; for $N = 10^6$, $s = 8$ → 8 MB
- **For $N = 10^9$:** 8 GB for one reducer

## Example: Hot Reducer
- $N = 10^6$ documents
- "the" in 80% → 800K documents
- Reducer memory: 800K × 8 B = 6.4 MB
- At $N = 10^9$: 6.4 GB

## The IDF Paradox
- Stop words have $\text{df} \approx N$
- $\text{idf} = \log(N/N) = 0$
- **Zero contribution to TF-IDF**
- We shuffle massive data for terms with no discriminative value

## Mitigation: Stop-Word Filtering

### Pre-filter Approach
- Maintain stop-word list: $S = \{\text{the, a, is, to, ...}\}$
- In Job 1 map: skip $t \in S$
- **Eliminates:** ~20% of term occurrences

### DF Threshold Approach
- After Job 2: filter terms with $\text{df}(t) > \theta \cdot N$
- E.g., $\theta = 0.5$ → drop terms in >50% of documents
- **Adaptive:** No predefined list needed

### Cost Impact
- 100 stop words appearing in all docs
- Before filter: 100 × N values to shuffle
- After filter: 0
- **Reduction:** ~20–30% of shuffle volume

---

# Part IX: Approximation and Hashing

## Exact vs Approximate df

### Exact Computation
- Full pass over corpus for accurate df
- Consistent TF-IDF values

### Sampling Approach
- Sample $p$ fraction of documents
- Estimate: $\widehat{\text{df}}(t) = \frac{\text{df}_{\text{sample}}(t)}{p}$
- **Guarantee:** Unbiased estimator
- **Variance:** Higher for rare terms

## Feature Hashing (Hashing Trick)
- Map terms to $B$ buckets: $h(t) \rightarrow [0, B-1]$
- **Vocabulary:** Bounded at $B$ regardless of actual $|V|$
- **Trade-off:** Collisions merge different terms

### Collision Bound
$$
\text{E}[\text{collisions}] = \frac{|V|}{B}
$$
- For $|V| = 10^6$, $B = 2^{20}$: ~1 collision per bucket

### When to Use
- Vocabulary unbounded or unknown a priori
- Memory constraints on df table
- Acceptable to trade some accuracy for bounded resources

---

# Part X: Production Best Practices

## Design Checklist
1. **Filter stop words** in Job 1 map (or use df threshold)
2. **Use combiner** in Job 1 (sum is associative)
3. **Broadcast df** if fits in memory; else use map-side join
4. **Store sparse:** $(doc\_id, term, tfidf)$ triples only
5. **Version tokenization:** Same stemmer, stop list for consistency

## Numerical Stability
- Use smoothed IDF: $\log \frac{N+1}{\text{df}+1}$
- Handle empty documents: $|d| = 0$ → skip or assign zero vector
- Log of zero: Ensure $\text{df} \geq 1$ (add-one smoothing)

## Idempotency
- Write output keyed by $(doc\_id, term)$
- Upsert semantics: rerun overwrites, no duplicates
- **Enables:** Safe retry on failure

## Monitoring
| Metric | Healthy | Investigate |
|--------|---------|-------------|
| Job 2 reducer max/median | < 10 | > 10 (stop-word skew) |
| Vocabulary size | Expected | Unexpected growth |
| Empty document rate | < 1% | > 5% |

---

# Summary

## Recap — Engineering Judgment
- **TF-IDF:** $\text{tf}(t,d) \times \log \frac{N}{\text{df}(t)}$
- High for frequent-in-doc AND rare-overall terms
- **Vector space model:** Documents as sparse vectors; cosine similarity
- **Storage:** Must be sparse; dense is infeasible at scale
- **Job 2 skew:** Stop words send all doc_ids to one reducer
- Stop-word filtering is non-negotiable
- **Three-job pipeline:** Counts → df → TF-IDF
- Each with specific shuffle cost and skew risk

## Pointers to Practice
- Compute TF-IDF by hand for 3–5 documents
- Trace MapReduce pipeline with concrete numbers
- Identify hot term and compute reducer load
- Propose stop-word mitigation strategy

## Additional Diagrams
### TF-IDF Pipeline Overview
![](../../diagrams/week8/week8_lecture_slide14_tfidf_pipeline_overview.png)
### MapReduce Execution Flow
![](../../diagrams/week8/week8_lecture_slide24_mapreduce_execution_flow.png)
### Failure: Stop-Word Skew
![](../../diagrams/week8/week8_lecture_slide26_failure_stopword_skew.png)
### Practice: TF-IDF MapReduce Skew
![](../../diagrams/week8/week8_practice_slide20_tfidf_mapreduce_skew.png)
