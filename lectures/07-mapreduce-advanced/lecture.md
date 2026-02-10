# Week 7: MapReduce Examples

## Purpose & Learning Objectives

- **Purpose:** Demonstrate MapReduce through four canonical examples, from simple filtering to multi-phase joins and graph algorithms. Each example shows problem → solution design → step-by-step input/output per phase.
- **Learning Objectives:**
  - Design key/value pairs so Map → Shuffle → Reduce produce the desired result
  - Trace data flow phase-by-phase with concrete inputs and outputs
  - Decide when combiners are safe and when multiple MapReduce phases are needed
  - Recognize patterns: filtering, inverted index, join+aggregate, iterative graph

---

## Example 1: Filtering Pattern — Count Errors by Service

## 1.1 Problem

You run a fleet of API services and need to **count errors by service name**. Raw logs are large; only rows with status code ≥ 500 are relevant. You want to avoid shuffling and reducing over successful requests.

**Input:** API request logs (timestamp, service, status, latency_ms).  
**Output:** For each service, the number of error rows (status ≥ 500).

---

## 1.2 Solution (Key/Value Design)

- **Filter in the mapper:** emit only for status ≥ 500; non-error rows emit nothing.
- **Key:** `service`
- **Value:** `1` (one count per error row)

Reducer groups by service and sums the 1s → error count per service.

---

## 1.3 Formal Solution (Filtering)

```
map(record):
  if record.status < 500:
    emit nothing
  else:
    emit (record.service, 1)

reduce(key, values):
  emit (key, sum(values))
```


---

## 1.4 Step-by-Step: Input (Filtering)

| ts   | service | status | latency_ms |
|------|--------|--------|------------|
| 10:00 | auth   | 200    | 35         |
| 10:01 | auth   | 500    | 120        |
| 10:02 | cart   | 404    | 22         |
| 10:03 | cart   | 500    | 300        |
| 10:04 | search | 200    | 18         |
| 10:05 | search | 500    | 210        |

---

## 1.5 Step-by-Step: Map & Shuffle (Filtering)

- Rows with status &lt; 500 → **emit nothing** (filtered out).
- Rows with status ≥ 500 → emit `(service, 1)`.

**Mapper output (only error rows):** 10:01 → (auth, 1), 10:03 → (cart, 1), 10:05 → (search, 1).

**Shuffle — grouped by key `service`:** auth → [1], cart → [1], search → [1].

---

## 1.6 Step-by-Step: Reduce & Final Output (Filtering)

For each service key: sum all values; emit `service<TAB>error_count`.

| service | error_count |
|---------|-------------|
| auth    | 1           |
| cart    | 1           |
| search  | 1           |

---

## 1.7 Combiner & Engineering (Filtering)

- **Combiner:** Safe — summing counts is associative and commutative. Can pre-aggregate (e.g. (auth, 1), (auth, 1) → (auth, 2) locally).
- **Why filter in map:** Reduces shuffle traffic; only error rows move. Downside: wrong filter logic can silently drop data — monitor filter rates and validate with sampling.

---

## Example 2: Inverted Index — Term → Document Postings

---

## 2.1 Problem

You have a small document collection (e.g. internal wiki or log snippets). For each **term**, you want a **posting list**: the documents that contain it and the **term frequency** in each document. This is the core structure for search.

**Input:** Documents (doc_id + raw text).  
**Output:** For each term: `doc_id:tf, doc_id:tf, ...` (e.g. `data → 1:1,2:2,3:1,4:1`).

---

## 2.2 Solution (Key/Value Design)

- **Map:** Tokenize (lowercase, split on whitespace). Emit one pair per (term, doc) occurrence so we can count.
- **Key:** `(term, doc_id)` — groups all occurrences of the same term in the same document.
- **Value:** `1`

Reducer (or combiner) sums the 1s → term frequency per (term, doc). Then we format postings per term (e.g. by tracking “current term” and emitting when term changes; postings are sorted by doc_id because key is (term, doc_id)).

---

## 2.3 Formal Solution (Inverted Index)

```
map(doc_id, text):
  for term in tokenize(text):   // lowercase, split on whitespace
    emit ((term, doc_id), 1)

reduce((term, doc_id), values):
  tf = sum(values)
  emit (term, "doc_id:tf" appended to postings list for term)
  // output: term \t doc1:tf1,doc2:tf2,...
```

---

## 2.4 Step-by-Step: Input (Inverted Index)

| doc_id | text                                                                 |
|--------|----------------------------------------------------------------------|
| 1      | data engineering is fun and practical                                |
| 2      | data pipelines need reliable data quality                            |
| 3      | mapreduce is practical for large scale data processing               |
| 4      | quality matters in data engineering pipelines                         |

Tokenization: lowercase, split on whitespace, keep duplicates (for term frequency).

---

## 2.5 Step-by-Step: Map & Shuffle (Inverted Index)

For each token emit **((term, doc_id), 1)**. Example: doc 2 → ((data, 2), 1), ((pipelines, 2), 1), ((data, 2), 1), ((quality, 2), 1).

**Shuffle — grouped by `(term, doc_id)`:** (data, 1)→[1], (data, 2)→[1,1], (data, 3)→[1], (data, 4)→[1], (engineering, 1)→[1], (engineering, 4)→[1], (pipelines, 2)→[1], (pipelines, 4)→[1], (quality, 2)→[1], (quality, 4)→[1].

---

## 2.6 Step-by-Step: Reduce & Final Output (Inverted Index)

For each key `(term, doc_id)`: sum values → tf. Maintain current term; when term changes, emit previous term with posting list. Output: `term<TAB>doc1:tf1,doc2:tf2,...`.

---

## 2.7 Combiner & Pitfalls (Inverted Index)

- **Combiner:** Safe and useful. Locally aggregate `((term, doc_id), 1)` → `((term, doc_id), partial_count)`. Sum is associative/commutative. Do not build final posting strings in the combiner — only counts.
- **Pitfalls:** Removing duplicates in map breaks term frequency; keying only by term (no doc_id) loses per-document counts; unclear tokenization makes results ambiguous.

---

## Example 3: Matrix–Vector Multiplication (Two-Phase)

---

## 3.1 Problem

You are scoring documents with a **sparse feature matrix** `A` and a **weight vector** `v`. Each `A[i,j]` is the feature value for document `i`, feature `j`; each `v[j]` is the weight for feature `j`. You need the score per document:

**y[i] = Σ_j A[i,j] · v[j]**

So you must **join** matrix entries with the vector on index `j`, compute products, then **sum by row** `i`. Join is keyed by `j`; final aggregation is keyed by `i` — hence **two MapReduce phases**.

---

## 3.2 Solution (Key/Value Design)

**Phase 1 — Join on j:** Key `j`; value tagged — matrix: `(A, i, A[i,j])`, vector: `(V, v[j])`. Reducer computes partials and emits **(i, partial)**.

**Phase 2 — Sum by i:** Key `i`; value partial product. Reducer sums → **y[i]**.

---

## 3.3 Formal Solution (Matrix–Vector)

**Phase 1:** map emits (j, (A,i,A[i,j])) or (j, (V,v[j])); reduce(j) uses v_j, emits (i, a_ij*v_j).  
**Phase 2:** map identity; reduce(i) emits (i, sum(values)).

---

## 3.4 Step-by-Step: Input (Matrix–Vector)

**Matrix A (sparse):**

| i (row) | j (col) | A[i,j] |
|--------:|--------:|-------:|
| 1       | 1       | 2      |
| 1       | 3       | 1      |
| 2       | 1       | 4      |
| 2       | 2       | 5      |
| 3       | 3       | 3      |

**Vector v:** j=1→10, j=2→1, j=3→2.

---

## 3.5 Step-by-Step: Phase 1 — Map, Shuffle, Reduce (Matrix–Vector)

**Map:** Matrix → (j, (A, i, A[i,j])); vector → (j, (V, v[j])). Example j=1: (1,(A,1,2)), (1,(A,2,4)), (1,(V,10)).

**Shuffle:** Key 1 → [(A,1,2), (A,2,4), (V,10)].

**Reduce:** For each j take v[j]; for each (A, i, a_ij) emit (i, a_ij*v_j). j=1 → (1,20), (2,40); j=2 → (2,5); j=3 → (1,2), (3,6).

---

## 3.6 Step-by-Step: Phase 2 & Final Output (Matrix–Vector)

**Phase 2:** Identity map; shuffle by i: 1→[20,2], 2→[40,5], 3→[6]; reduce sums per i.

| i | y[i] |
|---|-----:|
| 1 | 22   |
| 2 | 45   |
| 3 | 6    |

---

## 3.7 Combiner & Engineering (Matrix–Vector)

- **Phase 1:** Combiner not applicable — need vector value to compute products; reducer must see both matrix and vector.
- **Phase 2:** Combiner safe — sum of partials is associative and commutative.
- **Bottleneck:** Shuffle of all matrix entries keyed by `j`; can be large if matrix is dense or skewed. Mitigate with map-side broadcast of vector if it fits in memory, or combiners in phase 2 to reduce network.

---

## Example 4: PageRank (Single Iteration, with Damping)

---

## 4.1 Problem

You have a small directed graph (e.g. internal wiki pages). You want **one iteration of PageRank** with damping and proper handling of **dangling nodes** (no outlinks). Each page distributes its current rank equally to its outlinks; dangling rank is redistributed to all pages.

**Input:** Edges (from_page, to_page) and set of pages (including dangling). Initial rank PR0 = 1/N per page.  
**Output:** Updated rank PR1 per page after one iteration.

Formula (with damping d = 0.85):  
**PR1(p) = (1−d)/N + d · (sum of incoming contributions + dangling_mass/N)**

---

## 4.2 Solution (Key/Value Design)

Mapper per page: has current rank and adjacency list.

- **Rank contributions:** For each outlink `to_page`, emit **(to_page, contrib)** where contrib = current_rank / num_outlinks. If no outlinks (dangling), contrib is the full rank — tracked as “dangling mass” and redistributed in reducer.
- **Structure:** Emit **(page, adjacency_list)** so the graph is preserved for the next iteration.

Reducer for page `p`: receives contributions and (once) its adjacency list; sums incoming contributions; adds share of dangling mass; applies damping formula; emits **(p, PR1(p))** and passes adjacency list for next round.

### Formal solution

```
map(page, rank, adj_list):
  if adj_list is empty:
    emit (page, [])                    // preserve structure
    dangling_mass += rank              // tracked globally for reducer
  else:
    contrib = rank / len(adj_list)
    for to_page in adj_list:
      emit (to_page, contrib)
    emit (page, adj_list)              // pass through for next iteration

reduce(page, values):
  adj_list = single value that is a list (pass through)
  sum_in = sum(numeric values in values)
  PR1 = (1-d)/N + d * (sum_in + dangling_mass/N)
  emit (page, PR1)   // and adj_list for next iteration
```

---

## 4.4 Step-by-Step: Input (PageRank)

**Edges:** A→B, A→C, B→C, C→A. Pages: A, B, C, D (D dangling). N=4, PR0=0.25 each, d=0.85.

---

## 4.5 Step-by-Step: Map & Shuffle (PageRank)

**Map:** A → (B,0.125), (C,0.125), (A,[B,C]). B → (C,0.25), (B,[C]). C → (A,0.25), (C,[A]). D → (D,[]); dangling mass 0.25.

**Shuffle (e.g. key C):** [0.125 from A, 0.25 from B, adj list [A]]. Reducer separates contributions from adjacency list.

---

## 4.6 Step-by-Step: Reduce & Final Output (PageRank)

Sum incoming contributions; add 0.0625 (dangling_mass/N); base 0.0375; PR1 = 0.0375 + 0.85·(sum_in + 0.0625).

| page | PR1    |
|------|--------|
| A    | 0.3031 |
| B    | 0.1969 |
| C    | 0.4094 |
| D    | 0.0906 |

---

## 4.7 Combiner & Engineering (PageRank)

- **Combiner:** Safe for **summing contributions** per key (addition is associative). Must not drop the adjacency list — pass it through; only numeric contributions are combined.
- **Dangling nodes:** If not handled, rank “leaks” and total rank shrinks each iteration. Redistributing dangling mass preserves total rank and keeps PageRank well-defined.

---

## Summary: Pattern Overview

| Example              | Pattern              | Phases | Key idea                                      |
|----------------------|----------------------|--------|-----------------------------------------------|
| Filtering            | Filter + count       | 1      | Filter in map; key = group (service); value = 1 |
| Inverted index       | Scan + group + count | 1      | Key (term, doc_id); value 1; format postings in reduce |
| Matrix–vector        | Join + aggregate     | 2      | Phase 1 join on j; phase 2 sum on i           |
| PageRank             | Graph iteration      | 1 (per iter) | Emit contributions to targets; preserve graph; handle dangling |

---

## Instructor Notes

- **Teaching order:** Filtering (simplest) → Inverted index (canonical MR) → Matrix–vector (two phases) → PageRank (graph + special handling).
- For each example: state problem → give key/value design → walk one concrete input through Map output → Shuffle grouping → Reduce output → final table.
- Emphasize: key choice determines grouping; value choice determines what reducer aggregates; combiners only when operation is associative/commutative; multi-phase when join key ≠ aggregate key.
