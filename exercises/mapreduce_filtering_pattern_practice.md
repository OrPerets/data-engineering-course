# Filtering Pattern — MapReduce Practice (Step-by-Step)

## Scenario
You run a fleet of API services and want to count errors by service name.
The raw logs are large, but only error rows are relevant for this report.
Filtering in the mapper reduces network cost and speeds up the job.

## Input Data
### Input tables
API request logs:

| ts | service | status | latency_ms |
|---|---|---|---:|
| 10:00 | auth | 200 | 35 |
| 10:01 | auth | 500 | 120 |
| 10:02 | cart | 404 | 22 |
| 10:03 | cart | 500 | 300 |
| 10:04 | search | 200 | 18 |
| 10:05 | search | 500 | 210 |

### Processing rules
1. Filter **only** status codes `>= 500`.
2. Count errors per service.

## Goal (Expected Output Format)

| service | error_count |
|---|---:|
| auth | 1 |
| cart | 1 |
| search | 1 |

## Questions

### Q1 — Key/Value Design
What should the mapper emit after filtering to count errors per service?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for the rows at `10:01`, `10:03`, and `10:05`.

### Q3 — Shuffle / Sort
Show the grouped values for keys `auth` and `cart`.

### Q4 — Reducer Logic
Describe how the reducer computes the final counts.

### Q5 — Final Output (Explicit)
Write the final output lines for all services with errors.

### Q6 — Combiner: Safe or Not?
Is a combiner safe here? Why?

### Q7 — Engineering Insight
How does mapper-side filtering reduce shuffle cost, and what is a potential downside?

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits only error rows:**
- **Key:** `service`
- **Value:** `1`

Non-error rows emit nothing (filtered out in mapper).

## A2 — Mapper Output
Rows with status `>= 500`:
- 10:01 auth 500 → (auth, 1)
- 10:03 cart 500 → (cart, 1)
- 10:05 search 500 → (search, 1)

## A3 — Shuffle / Sort
Grouped values:

### auth
Values: [1]

### cart
Values: [1]

## A4 — Reducer Logic
For each service key:
1. Sum all values.
2. Emit `service<TAB>error_count`.

## A5 — Final Output
- auth	1
- cart	1
- search	1

## A6 — Combiner Discussion
**Yes, a combiner is safe** because summing counts is associative and commutative.

## A7 — Engineering Insight
Filtering in the mapper reduces shuffle traffic by sending only error rows.
Downside: if filter logic is wrong, you can silently drop data and skew reports.
Monitor filter rates and validate with sampling.

---

## Common Pitfalls
- Filtering in the reducer (too late, high shuffle cost).
- Emitting `(status, 1)` instead of `(service, 1)`.
- Forgetting to emit nothing for non-error rows.

## Optional Extensions
- Add a second job to compute error rate per service.
- Filter by latency as well (e.g., 95th percentile analysis).
- Add time bucketing by hour in the key.
