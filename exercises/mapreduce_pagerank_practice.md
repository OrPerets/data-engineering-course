# PageRank (Single Iteration, Damping) — MapReduce Practice (Step-by-Step)

## Scenario
You maintain a tiny internal wiki with pages that link to each other.
You want to compute one iteration of PageRank to estimate which pages are most central.
This exercise includes damping and handles dangling pages (no outlinks).

## Input Data
### Input tables
Directed edges:

| from_page | to_page |
|---|---|
| A | B |
| A | C |
| B | C |
| C | A |

Pages in the graph: A, B, C, D (D is dangling: no outlinks).

### Processing rules
1. Initial rank for each page: `PR0 = 1/N`, with `N = 4` → `0.25` each.
2. Damping factor: `d = 0.85`.
3. New rank formula:
   - `PR1(p) = (1 - d)/N + d * (sum_incoming_contribs + dangling_mass/N)`
4. Dangling mass is the total rank from dangling pages (D) redistributed equally.

## Goal (Expected Output Format)
Produce updated ranks after one iteration:

| page | PR1 |
|---|---:|
| A | 0.3031 |
| B | 0.1969 |
| C | 0.4094 |
| D | 0.0906 |

## Questions

### Q1 — Key/Value Design
What should the mapper emit to distribute rank contributions and preserve adjacency lists?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for page A and page D (dangling), using `(key, value)` pairs.

### Q3 — Shuffle / Sort
Show the grouped values arriving at the reducer for key `C`.

### Q4 — Reducer Logic
Describe how the reducer computes `PR1` for a page, including damping and dangling mass.

### Q5 — Final Output (Explicit)
Write the final output lines for all pages after one iteration.

### Q6 — Combiner: Safe or Not?
Is a combiner safe for PageRank contributions? Why or why not?

### Q7 — Engineering Insight
What failure mode appears if dangling nodes are not handled correctly?

---

# Step-by-Step Solution

## A1 — Key/Value Design
Each mapper reads a page with its current rank and adjacency list.
It emits:
- **Rank contributions** to outlink targets: `(to_page, contrib)`
- **Adjacency list** for the page itself: `(page, adjacency_list)`
- **Dangling mass** is tracked by summing ranks of dangling pages.

## A2 — Mapper Output
Using `PR0 = 0.25`.

### Page A (outlinks to B, C)
- (B, 0.125)  ← 0.25 / 2
- (C, 0.125)
- (A, [B, C])

### Page D (dangling)
- (D, [])  ← adjacency list preserved
- Dangling mass contribution: 0.25 (tracked separately)

## A3 — Shuffle / Sort
Grouped values for key `C`:

C → Values: [0.125 (from A), 0.25 (from B), (A, [B, C])? no, adjacency lists are keyed by source]

Actual grouped values for C:
- 0.125 from A
- 0.25 from B (since B links to C)
- adjacency list for C: [A]

So reducers see:
C → [0.125, 0.25, [A]]

## A4 — Reducer Logic
For each page `p`:
1. Separate adjacency list from rank contributions.
2. Sum incoming contributions: `sum_in`.
3. Add dangling mass share: `dangling_mass / N`.
4. Apply damping:
   - `PR1(p) = (1 - d)/N + d * (sum_in + dangling_mass/N)`
5. Emit `(p, PR1(p))` along with its adjacency list for the next iteration.

## A5 — Final Output
Dangling mass = 0.25 (from D).
Base term `(1-d)/N = 0.0375`.
Dangling share `0.25/4 = 0.0625`.

Incoming sums:
- A: from C → 0.25
- B: from A → 0.125
- C: from A + B → 0.125 + 0.25 = 0.375
- D: no incoming → 0

Final ranks:
- A: 0.0375 + 0.85 * (0.25 + 0.0625) = 0.3031
- B: 0.0375 + 0.85 * (0.125 + 0.0625) = 0.1969
- C: 0.0375 + 0.85 * (0.375 + 0.0625) = 0.4094
- D: 0.0375 + 0.85 * (0 + 0.0625) = 0.0906

Output lines:
- A	0.3031
- B	0.1969
- C	0.4094
- D	0.0906

## A6 — Combiner Discussion
**Combiner is safe for summing contributions per key**, because addition is associative.
However, the combiner must NOT drop the adjacency list; it must pass it through.

## A7 — Engineering Insight
If dangling nodes are ignored, rank mass “leaks” from the graph.
Total rank decreases every iteration, and results drift toward zero.
Properly redistributing dangling mass preserves total rank.

---

## Common Pitfalls
- Forgetting to emit adjacency lists (graph structure lost).
- Double-applying damping (once in mapper and again in reducer).
- Ignoring dangling nodes (rank leakage).

## Optional Extensions
- Run multiple iterations and track convergence.
- Add a personalization vector for topic-sensitive PageRank.
- Use combiners plus in-mapper aggregation to reduce shuffle volume.
