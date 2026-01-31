# Metapatterns (Pattern Selection & Reasoning) — MapReduce Practice (Step-by-Step)

## Scenario
A platform team needs multiple daily reports from the same request logs.
Each report requires a different MapReduce pattern.
Your task is to choose the correct pattern for each sub-task and show explicit flows.

## Input Data
### Input tables
Requests:

| req_id | user_id | service | endpoint | status | bytes |
|---|---|---|---|---:|---:|
| R1 | U1 | search | /q | 200 | 500 |
| R2 | U2 | search | /q | 500 | 300 |
| R3 | U1 | cart | /add | 200 | 700 |
| R4 | U3 | search | /q | 500 | 250 |
| R5 | U2 | cart | /pay | 200 | 900 |

Users:

| user_id | region |
|---|---|
| U1 | NA |
| U2 | EU |
| U3 | NA |

### Processing rules
We need to produce **three separate reports**:
1. **Error Count by Service** (count only status >= 500).
2. **Bytes per Region** (sum bytes after joining requests with users).
3. **Top-1 Endpoint per Service** (by total bytes).

## Goal (Expected Output Format)
Produce three independent outputs:

**Report 1 — Error Count by Service**
| service | error_count |
|---|---:|
| search | 2 |

**Report 2 — Bytes per Region**
| region | total_bytes |
|---|---:|
| NA | 1450 |
| EU | 1200 |

**Report 3 — Top-1 Endpoint per Service**
| service | top_endpoint |
|---|---|
| cart | /pay:900 |
| search | /q:1050 |

## Questions

### Q1 — Key/Value Design
For each report, identify the correct MapReduce pattern and the mapper key/value design.

### Q2 — Mapper Output (Explicit)
Provide explicit mapper outputs for:
- Report 1 (row R2)
- Report 2 (row R3 and user U1)
- Report 3 (rows R1 and R4)

### Q3 — Shuffle / Sort
Show grouped values for:
- Report 1 key `search`
- Report 2 key `U1`
- Report 3 key `search`

### Q4 — Reducer Logic
Describe reducer logic for each report in words.

### Q5 — Final Output (Explicit)
Write the final output lines for all three reports.

### Q6 — Combiner: Safe or Not?
For each report, state whether a combiner is safe and why.

### Q7 — Engineering Insight
Explain how skew could affect Report 3 and how to mitigate it.

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Report 1 — Error Count by Service (Filtering Pattern):**
- Mapper filters `status >= 500`.
- Key: `service`
- Value: `1`

**Report 2 — Bytes per Region (Reduce-side Join + Aggregation):**
- Mapper emits tagged records keyed by `user_id`:
  - Requests: `(user_id, (REQ, bytes))`
  - Users: `(user_id, (USER, region))`
- Reducer joins, then emits `(region, bytes)` for aggregation in a second phase or with a combiner.

**Report 3 — Top-1 Endpoint per Service (Partial Sort):**
- Mapper key: `service`
- Value: `(endpoint, bytes)`
- Reducer sums bytes per endpoint, then keeps only the top 1.

## A2 — Mapper Output

### Report 1 (row R2: search, status 500)
- (search, 1)

### Report 2 (row R3 and user U1)
- R3 → (U1, (REQ, 700))
- U1 → (U1, (USER, NA))

### Report 3 (rows R1 and R4)
- R1 → (search, (/q, 500))
- R4 → (search, (/q, 250))

## A3 — Shuffle / Sort

### Report 1 key search
search → [1, 1]  (from R2 and R4)

### Report 2 key U1
U1 → [(REQ, 500), (REQ, 700), (USER, NA)]  (R1, R3, and user U1)

### Report 3 key search
search → [(/q, 500), (/q, 300), (/q, 250)]  (R1, R2, R4)

## A4 — Reducer Logic

**Report 1:**
1. Sum all `1`s per service.
2. Emit `service<TAB>error_count`.

**Report 2:**
1. Identify the user’s region from the USER record.
2. For each REQ record, emit `(region, bytes)`.
3. Sum bytes per region (can be a second reduce or combiner-based aggregation).

**Report 3:**
1. Sum bytes per endpoint within the service key.
2. Track the single highest total (Top-1).
3. Emit `service<TAB>endpoint:total_bytes`.

## A5 — Final Output

**Report 1 — Error Count by Service**
- search	2

**Report 2 — Bytes per Region**
- NA	1450  (U1: 500+700, U3: 250)
- EU	1200  (U2: 300+900)

**Report 3 — Top-1 Endpoint per Service**
- cart	/pay:900
- search	/q:1050  (500+300+250)

## A6 — Combiner Discussion
- **Report 1:** Safe (summing counts).
- **Report 2:** Safe after join when aggregating bytes per region; not safe before join.
- **Report 3:** Safe if the combiner outputs Top-1 per service, but careful with ties.

## A7 — Engineering Insight
Report 3 can skew if one service has massive traffic.
That reducer becomes a hotspot.
Mitigate by:
- splitting heavy services by secondary key (service, hash(endpoint)),
- using a two-stage Top-K aggregation,
- or pre-aggregating per mapper.

---

## Common Pitfalls
- Mixing patterns in a single reducer (makes logic opaque and brittle).
- Joining on the wrong key (e.g., `region` instead of `user_id`).
- Emitting Top-1 without first summing per endpoint (wrong ranking).

## Optional Extensions
- Add a fourth report: error rate per service (requires two aggregates).
- Turn Report 2 into a left outer join (keep requests with missing users).
- Compute Top-2 endpoints per service with tie-breaking rules.
