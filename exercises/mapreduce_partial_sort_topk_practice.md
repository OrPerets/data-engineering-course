# Partial Sort (Top-K per Key) — MapReduce Practice (Step-by-Step)

## Scenario
A marketplace wants the top 2 selling products in each category.
Sorting all products in a category is wasteful when only the top 2 are needed.
You will use a Top-K pattern to keep reducers efficient.

## Input Data
### Input tables
Daily sales totals:

| category | product | units_sold |
|---|---|---:|
| books | novel | 120 |
| books | textbook | 80 |
| books | comics | 95 |
| games | console | 60 |
| games | controller | 75 |
| games | headset | 40 |

### Processing rules
1. Group by `category`.
2. Within each category, keep only the top 2 by `units_sold`.
3. Output ordered Top-2 lists.

## Goal (Expected Output Format)

| category | top2 |
|---|---|
| books | novel:120,comics:95 |
| games | controller:75,console:60 |

## Questions

### Q1 — Key/Value Design
What key/value pairs should the mapper emit to enable Top-K per category?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for the three `books` rows.

### Q3 — Shuffle / Sort
Show grouped values for key `books`.

### Q4 — Reducer Logic
Describe how the reducer keeps only the Top-2 without fully sorting the entire list.

### Q5 — Final Output (Explicit)
Write the final output lines for all categories.

### Q6 — Combiner: Safe or Not?
Is a combiner safe or useful for Top-K? Explain.

### Q7 — Engineering Insight
Why is a full sort wasteful here, and what data structure helps?

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits:**
- **Key:** `category`
- **Value:** `(product, units_sold)`

Reducers operate per category to compute Top-K.

## A2 — Mapper Output
For category `books`:
- (books, (novel, 120))
- (books, (textbook, 80))
- (books, (comics, 95))

## A3 — Shuffle / Sort
Grouped values:

books → [(novel, 120), (textbook, 80), (comics, 95)]

## A4 — Reducer Logic
For each category:
1. Maintain a min-heap of size 2 (Top-2).
2. Insert each `(product, units_sold)`.
3. If heap exceeds size 2, remove the smallest.
4. After processing all values, sort the heap descending for output.

## A5 — Final Output
- books	novel:120,comics:95
- games	controller:75,console:60

## A6 — Combiner Discussion
A combiner **can be safe** if it also outputs only Top-2 per category,
because the Top-K of a union is contained in the union of each partition’s Top-K.
However, if K is too small, you may need Top-(K + buffer) to be safe under ties.

## A7 — Engineering Insight
A full sort is wasteful because you only need the top 2 items.
A fixed-size heap keeps memory and CPU proportional to K, not to the total group size.

---

## Common Pitfalls
- Sorting all values before trimming to K.
- Forgetting to handle ties consistently.
- Emitting `(product, units_sold)` as key (loses category grouping).

## Optional Extensions
- Compute Top-3 with tie-breaking by product name.
- Add a combiner that emits Top-3 to protect against ties.
- Track total category sales alongside Top-K.
