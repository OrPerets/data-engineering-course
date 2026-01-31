# Matrix–Vector Multiplication — MapReduce Practice (Step-by-Step)

## Scenario
You are scoring documents using a sparse feature matrix and a weight vector.
Each matrix entry `A[i,j]` is a feature value for document `i`,
and each vector entry `v[j]` is the weight for feature `j`.
You need the score `y[i] = Σ_j A[i,j] * v[j]` for each document.

## Input Data
### Input tables
Matrix `A` (sparse):

| i (row) | j (col) | A[i,j] |
|---:|---:|---:|
| 1 | 1 | 2 |
| 1 | 3 | 1 |
| 2 | 1 | 4 |
| 2 | 2 | 5 |
| 3 | 3 | 3 |

Vector `v`:

| j (index) | v[j] |
|---:|---:|
| 1 | 10 |
| 2 | 1 |
| 3 | 2 |

### Processing rules
1. Join `A[i,j]` with `v[j]` on the shared index `j`.
2. Compute partial products `A[i,j] * v[j]`.
3. Sum partial products by row `i` to get `y[i]`.

## Goal (Expected Output Format)
Produce scores per row:

| i | y[i] |
|---:|---:|
| 1 | 22 |
| 2 | 45 |
| 3 | 6 |

## Questions

### Q1 — Key/Value Design
What keys and values should the mapper emit to join matrix rows with the vector?
Why does this require two logical phases?

### Q2 — Mapper Output (Explicit)
Write the mapper output **exactly** as `(key, value)` pairs for:
- Matrix entries with `j = 1`
- Vector entry `v[1]`

### Q3 — Shuffle / Sort
Show the grouped values that arrive to reducers for key `j = 1`.

### Q4 — Reducer Logic
Describe how the reducer computes partial products for `j = 1`.
Explain how these partials are aggregated into final `y[i]` values.

### Q5 — Final Output (Explicit)
Show the final output lines for all `i`.

### Q6 — Combiner: Safe or Not?
Can a combiner be used in either phase? Explain.

### Q7 — Engineering Insight
What is the main scalability bottleneck in this workflow, and how could you reduce it?

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Phase 1 (Join on j):**
- **Key:** `j`
- **Value:** tagged record
  - For matrix: `(A, i, A[i,j])`
  - For vector: `(V, v[j])`

This joins `A[i,j]` with `v[j]` by index.

**Phase 2 (Sum by i):**
- **Key:** `i`
- **Value:** partial product `A[i,j] * v[j]`

Two logical phases are required because:
1. The join is keyed by `j`.
2. The final aggregation is keyed by `i`.
These are different grouping keys and cannot be completed in a single reducer pass.

## A2 — Mapper Output
For `j = 1`:

### Matrix entries
- (1, (A, 1, 2))
- (1, (A, 2, 4))

### Vector entry
- (1, (V, 10))

## A3 — Shuffle / Sort
Grouped by key `j = 1`:

Key 1 → Values: [(A, 1, 2), (A, 2, 4), (V, 10)]

## A4 — Reducer Logic
**Phase 1 reducer (for j = 1):**
1. Separate the vector value `v[1] = 10` from the matrix entries.
2. For each `(A, i, A[i,1])`, compute partial `A[i,1] * 10`.
3. Emit `(i, partial)`:
   - (1, 20)
   - (2, 40)

**Phase 2 reducer:**
1. Group by `i`.
2. Sum all partials for that `i` to get `y[i]`.

## A5 — Final Output
- 1	22  (2*10 + 1*2)
- 2	45  (4*10 + 5*1)
- 3	6   (3*2)

## A6 — Combiner Discussion
- **Phase 1:** combiner is **not** applicable because it needs the vector value to compute products.
- **Phase 2:** combiner is **safe** because summing partials by `i` is associative and commutative.

## A7 — Engineering Insight
The bottleneck is the shuffle of all matrix entries keyed by `j`,
which can be large if the matrix is dense or skewed on certain `j` values.
Mitigate by:
- broadcasting the vector if it fits in memory (map-side join),
- partitioning the matrix to balance heavy `j` keys, or
- using combiners in phase 2 to reduce network traffic.

---

## Common Pitfalls
- Forgetting that join and aggregation use different keys (requires two phases).
- Assuming vector values are always present (handle missing `v[j]`).
- Emitting `(i, j)` as a key in phase 1 (prevents join).

## Optional Extensions
- Use a map-side join if `v` is small enough to distribute.
- Add sparsity-aware compression to reduce shuffle size.
- Compute multiple vectors at once (matrix–matrix multiply variant).
