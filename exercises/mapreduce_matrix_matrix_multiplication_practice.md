# Matrix–Matrix Multiplication — MapReduce Practice (Step-by-Step)

## Scenario
You are multiplying two sparse matrices in a recommendation pipeline.
Matrix `A` represents user-to-feature weights, and matrix `B` maps features to item scores.
You need `C = A × B`, where `C[i,j] = Σ_k A[i,k] * B[k,j]`.

## Input Data
### Input tables
Matrix `A` (2×3, sparse):

| i | k | A[i,k] |
|---:|---:|---:|
| 1 | 1 | 2 |
| 1 | 3 | 1 |
| 2 | 2 | 4 |
| 2 | 3 | 2 |

Matrix `B` (3×2, sparse):

| k | j | B[k,j] |
|---:|---:|---:|
| 1 | 1 | 5 |
| 2 | 1 | 3 |
| 2 | 2 | 1 |
| 3 | 2 | 4 |

### Processing rules
1. Join `A[i,k]` with `B[k,j]` on shared index `k`.
2. Multiply to produce partials for `C[i,j]`.
3. Sum partials by `(i,j)`.

## Goal (Expected Output Format)

| i | j | C[i,j] |
|---:|---:|---:|
| 1 | 1 | 10 |
| 1 | 2 | 4 |
| 2 | 1 | 12 |
| 2 | 2 | 12 |

## Questions

### Q1 — Key/Value Design
What keys and values should the mapper emit to join on `k`?
Why does this require a second aggregation phase?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for:
- `A[1,1] = 2`
- `B[1,1] = 5`
- `B[3,2] = 4`

### Q3 — Shuffle / Sort
Show grouped values that arrive at reducers for keys:
- `k = 1`
- `k = 3`

### Q4 — Reducer Logic
Describe how the reducer forms cross-products for each `k` and emits partials.

### Q5 — Final Output (Explicit)
Show the final `C[i,j]` outputs.

### Q6 — Combiner: Safe or Not?
Where can a combiner be used in this workflow, if at all?

### Q7 — Engineering Insight
Explain the “reducer explosion” risk and how to mitigate it.

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Phase 1 (Join on k):**
- **Key:** `k`
- **Value:** tagged record
  - From `A`: `(A, i, A[i,k])`
  - From `B`: `(B, j, B[k,j])`

**Phase 2 (Sum by i,j):**
- **Key:** `(i, j)`
- **Value:** partial product `A[i,k] * B[k,j]`

A second aggregation is required because the join key `k` differs from the output key `(i,j)`.

## A2 — Mapper Output
- A[1,1] = 2 → (1, (A, 1, 2))
- B[1,1] = 5 → (1, (B, 1, 5))
- B[3,2] = 4 → (3, (B, 2, 4))

## A3 — Shuffle / Sort
### Key k = 1
Values: [(A, 1, 2), (B, 1, 5)]

### Key k = 3
Values: [(A, 1, 1), (A, 2, 2), (B, 2, 4)]

## A4 — Reducer Logic
For each `k`:
1. Separate A-side and B-side records.
2. Compute all pairwise combinations between A-rows and B-cols:
   - For k = 1: (i=1) × (j=1) → partial 2*5 = 10
   - For k = 3: (i=1,2) × (j=2) → partials 1*4 = 4 and 2*4 = 8
3. Emit `(i,j,partial)` for each pair.

Phase 2 reducer sums partials per `(i,j)`.

## A5 — Final Output
- (1, 1)	10
- (1, 2)	4
- (2, 1)	12  (from k=2 only: 4*3)
- (2, 2)	12  (from k=2: 4*1, k=3: 2*4 → 4+8)

## A6 — Combiner Discussion
Combiner is **safe in Phase 2 only**, where values are partials summed by `(i,j)`.
It is not useful in Phase 1 because we must see both A and B records to form pairs.

## A7 — Engineering Insight
Reducer explosion occurs when a key `k` has many A-rows and many B-cols.
The reducer must compute a Cartesian product, causing high memory and CPU cost.
Mitigations include:
- block matrix multiplication (partition by blocks),
- pruning zeros to reduce pair counts,
- using skew-aware partitioning for heavy `k` values.

---

## Common Pitfalls
- Forgetting the second aggregation phase.
- Emitting `(i,j)` directly from the mapper (no join on k).
- Assuming dense matrices (leads to huge shuffle and reducer load).

## Optional Extensions
- Implement block multiplication to reduce shuffle.
- Use distributed cache for small B (map-side join).
- Compute `A × B × v` in a pipeline of two MapReduce jobs.
