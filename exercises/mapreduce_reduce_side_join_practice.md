# SQL Join Pattern (Reduce-side Join) — MapReduce Practice (Step-by-Step)

## Scenario
A marketplace needs to join orders with customer profiles to build a daily report.
Orders and customers arrive as separate datasets, so a reduce-side join is used.
You must join on `customer_id` and emit enriched order records.

## Input Data
### Input tables
Customers:

| customer_id | name | tier |
|---|---|---|
| C1 | Ada | gold |
| C2 | Ben | silver |
| C3 | Cy | bronze |

Orders:

| order_id | customer_id | amount |
|---|---|---:|
| O1 | C1 | 50 |
| O2 | C2 | 20 |
| O3 | C1 | 30 |
| O4 | C4 | 70 |

### Processing rules
1. Join orders with customers on `customer_id`.
2. Emit only orders with a matching customer.

## Goal (Expected Output Format)

| order_id | customer_id | name | tier | amount |
|---|---|---|---|---:|
| O1 | C1 | Ada | gold | 50 |
| O2 | C2 | Ben | silver | 20 |
| O3 | C1 | Ada | gold | 30 |

## Questions

### Q1 — Key/Value Design
What should the mapper emit for customers and orders to enable a reduce-side join?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for:
- Customer C1
- Orders O1 and O3

### Q3 — Shuffle / Sort
Show grouped values arriving at the reducer for key `C1`.

### Q4 — Reducer Logic
Describe how the reducer performs the join and filters missing customers.

### Q5 — Final Output (Explicit)
Write the final joined output lines.

### Q6 — Combiner: Safe or Not?
Is a combiner useful here? Explain.

### Q7 — Engineering Insight
Discuss skew risks when a single customer has many orders.

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits:**
- For customers: `(customer_id, (CUST, name, tier))`
- For orders: `(customer_id, (ORDER, order_id, amount))`

Reducers can then join by customer_id.

## A2 — Mapper Output
- Customer C1 → (C1, (CUST, Ada, gold))
- Order O1 → (C1, (ORDER, O1, 50))
- Order O3 → (C1, (ORDER, O3, 30))

## A3 — Shuffle / Sort
Grouped values for key `C1`:

C1 → [(CUST, Ada, gold), (ORDER, O1, 50), (ORDER, O3, 30)]

## A4 — Reducer Logic
For each `customer_id`:
1. Identify the customer record (if missing, drop all orders).
2. For each order record, emit a joined row with customer fields.
3. If no customer record exists (e.g., C4), emit nothing.

## A5 — Final Output
- O1	C1	Ada	gold	50
- O2	C2	Ben	silver	20
- O3	C1	Ada	gold	30

## A6 — Combiner Discussion
A combiner is **not useful** because join requires seeing both datasets together.
Partial combining could discard necessary records.

## A7 — Engineering Insight
Skew occurs when one customer has many orders.
A single reducer can become a hotspot and run out of memory.
Mitigate by:
- range partitioning heavy keys,
- using a map-side join for small customer tables,
- or splitting orders by time window and joining in batches.

---

## Common Pitfalls
- Forgetting to tag records (customer vs order).
- Emitting orders with missing customers (should be filtered).
- Assuming one-to-one join (orders are one-to-many).

## Optional Extensions
- Outer join to keep orders with missing customers.
- Add a second dataset (e.g., promotions) for a multi-way join.
- Use Bloom filters to pre-filter orders before shuffle.
