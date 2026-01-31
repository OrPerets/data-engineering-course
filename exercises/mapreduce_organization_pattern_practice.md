# Organization Pattern — MapReduce Practice (Step-by-Step)

## Scenario
A fulfillment system stores package scans from multiple warehouses.
For audit reports, you must group scans by `package_id`
and output each package’s scans in time order.
This is an “organization pattern” job: group then structure.

## Input Data
### Input tables
Scan events:

| package_id | ts | location |
|---|---|---|
| P1 | 09:00 | dock |
| P2 | 09:05 | dock |
| P1 | 10:10 | sorter |
| P3 | 10:20 | dock |
| P2 | 11:00 | sorter |
| P1 | 12:30 | truck |

### Processing rules
1. Group by `package_id`.
2. Within each group, order scans by `ts` ascending.
3. Output a structured list per package.

## Goal (Expected Output Format)

| package_id | scans |
|---|---|
| P1 | 09:00@dock,10:10@sorter,12:30@truck |
| P2 | 09:05@dock,11:00@sorter |
| P3 | 10:20@dock |

## Questions

### Q1 — Key/Value Design
What should the mapper emit so that reducers can build ordered scan lists per package?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for package `P1` rows.

### Q3 — Shuffle / Sort
Show grouped values arriving at the reducer for key `P1`.

### Q4 — Reducer Logic
Describe how the reducer orders and formats the scan list.

### Q5 — Final Output (Explicit)
Write the final output lines for all packages.

### Q6 — Combiner: Safe or Not?
Is a combiner helpful or safe here? Explain.

### Q7 — Engineering Insight
What happens if one package has millions of scans, and how would you handle it?

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits:**
- **Key:** `package_id`
- **Value:** `(ts, location)`

This groups all scans for the same package at one reducer.

## A2 — Mapper Output
For package P1:
- (P1, (09:00, dock))
- (P1, (10:10, sorter))
- (P1, (12:30, truck))

## A3 — Shuffle / Sort
Reducer receives:

P1 → [(09:00, dock), (10:10, sorter), (12:30, truck)]

(Note: order is not guaranteed without sorting in reducer.)

## A4 — Reducer Logic
For each package:
1. Collect all `(ts, location)` values.
2. Sort by timestamp ascending.
3. Format as `ts@location` strings and join with commas.
4. Emit `package_id<TAB>scan_list`.

## A5 — Final Output
- P1	09:00@dock,10:10@sorter,12:30@truck
- P2	09:05@dock,11:00@sorter
- P3	10:20@dock

## A6 — Combiner Discussion
A combiner is **not useful** because the reducer must sort the full list.
Partial lists cannot be safely concatenated without a global order guarantee.

## A7 — Engineering Insight
A package with millions of scans can cause a memory blowup in a single reducer.
Mitigate by:
- secondary sort with streaming merge,
- external sorting on reducer disk,
- or splitting by `(package_id, day)` to cap group size.

---

## Common Pitfalls
- Assuming shuffle preserves time order (it does not).
- Trying to sort in the mapper (breaks global ordering).
- Emitting only the location (loses timestamp for ordering).

## Optional Extensions
- Add scan status (e.g., loaded, delayed) to the output.
- Produce JSON-like arrays instead of comma-separated strings.
- Track gaps between scans to flag stalled packages.
