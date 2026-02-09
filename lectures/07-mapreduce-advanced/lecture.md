# MapReduce for IEM: Week 6 (Fundamentals) + Week 7 (Advanced)

## Audience Framing: Why IEM Should Care
- You already optimize flow, queues, and bottlenecks—MapReduce is the same logic at data scale.
- Every batch job is a production system: throughput, WIP (in-flight data), and a critical path.
- Cost is dominated by transfer and coordination (the “shuffle”), not local compute.
- Determinism under retries is the data equivalent of repeatable SOPs in operations.
- Skew is a classic bottleneck problem: one “hot” key can stall the whole line.
- SQL logic (GROUP BY, JOIN) still applies—but scale forces different tactics.

---

# Week 6: MapReduce Fundamentals (IEM Adaptation)

## Purpose
- Learn the core model behind distributed batch processing
- Understand why shuffle dominates cost at scale
- Design jobs that are correct under retries and skew

## Learning Objectives
- Explain map, shuffle, and reduce as formal operators
- Estimate runtime and communication bottlenecks
- Detect and mitigate skew/hot-key failures
- Use combiners and partitioning strategies safely

## Why MapReduce Matters (IEM Lens)
- Single-node processing is like a single workstation: it cannot handle enterprise-scale WIP.
- MapReduce turns a huge batch into parallel micro-batches with controlled aggregation.
- The real “cost center” is moving and consolidating data (shuffle), not local computation.
- **SQL lens:** MapReduce is a physical execution model for `GROUP BY` and `JOIN` at scale.

> **Managerial takeaway:** Treat shuffle as the main bottleneck. Most optimization effort should reduce intermediate data volume.

## The Core Problem
- **Input:** massive dataset distributed across many machines
- **Goal:** compute aggregate results over all records
- **Constraint:** no single machine can store/process full input
- **Need:** parallel processing plus coordinated aggregation
- **SQL lens:** This is `SELECT ... GROUP BY ...` on a table too large for one database server.

## MapReduce Model (Operational View)
- **Map:** `(k1, v1) -> [(k2, v2)]` transforms each record into key-value pairs.
- **Shuffle:** groups all values by key `k2` across the cluster.
- **Reduce:** `(k2, [v2]) -> [(k3, v3)]` aggregates each group into final output.
- **SQL lens:** `Map = SELECT key, value FROM table`, `Shuffle = GROUP BY key`, `Reduce = aggregate per group`.

## Why Shuffle Is the Bottleneck
- All map outputs must be redistributed by key.
- Network + disk spill dominate total runtime.
- CPU can be idle while waiting for shuffle.
- **SQL lens:** This is like a global `GROUP BY` needing a full data repartition.

## Shuffle Cost Formula (Simple Model)
\[
C_{shuffle} = E \cdot s
\]
- `E`: number of emitted key-value pairs from map
- `s`: average serialized pair size
- Reduce `E` (via combiner) or `s` (via compact encoding) to reduce cost.

> **Managerial takeaway:** Estimate shuffle cost before running jobs. If the shuffle is huge, the job will be slow and expensive regardless of CPU.

## Runtime Decomposition (Bottleneck Focus)
\[
T_{total} = T_{map} + T_{shuffle} + T_{reduce}
\]
- Map scales well with more workers.
- Shuffle scales with bandwidth and spill behavior.
- Reduce is limited by the largest key-group.
- **SQL lens:** Large `GROUP BY` jobs are constrained by data movement, not just SQL compute.

## Determinism and Correctness
- Map/reduce logic should be pure and deterministic.
- Retries must produce the same output (idempotent behavior).
- Non-deterministic logic breaks trust in KPIs.
- **SQL lens:** Imagine a `GROUP BY` that changes results on re-run—unacceptable for financial reporting.

> **Managerial takeaway:** Treat deterministic logic as a quality control requirement. If it can’t be re-run reliably, it’s not production-ready.

## Worked Example 1: Order Counts by Customer (GROUP BY)
**Scenario (Orders):** Count orders per customer.

**Input (Orders)**

| OrderID | CustomerID | Amount |
|---|---|---|
| O1 | C1 | 120 |
| O2 | C2 | 80 |
| O3 | C1 | 50 |
| O4 | C3 | 200 |
| O5 | C1 | 30 |

**Map output** (emit `(CustomerID, 1)`)
- O1 → (C1,1)
- O2 → (C2,1)
- O3 → (C1,1)
- O4 → (C3,1)
- O5 → (C1,1)

**Shuffle grouping**
- C1 → [1,1,1]
- C2 → [1]
- C3 → [1]

**Reduce output** (sum counts)
- (C1,3), (C2,1), (C3,1)

**SQL equivalent**
```sql
SELECT CustomerID, COUNT(*)
FROM Orders
GROUP BY CustomerID;
```

**Mini cost estimate**
- Emitted pairs `E = 5`
- If average pair size `s = 16 bytes`, `C_shuffle ≈ 5 * 16 = 80 bytes`
- **Dominant stage:** shuffle, even for small datasets it is the coordination step.

## Combiner (Local Pre-Aggregation)
- Runs after map, before shuffle.
- Reduces duplicate keys per mapper.
- Greatly reduces shuffle bytes for count/sum/max/min.
- **SQL lens:** This is like partial aggregation at each shard before a global `GROUP BY`.

## Combiner Validity Rule
- Safe when operation is **associative** and **commutative**.
- Valid: sum, count, min, max.
- Not directly valid: median, exact distinct, naive average.
- For average, combine `(sum, count)` tuples instead.

## Worked Example 2: Inventory Movement Totals (Combiner-Safe Sum)
**Scenario (InventoryMovements):** Total units moved per product.

**Input (InventoryMovements)**

| MovementID | ProductID | Qty |
|---|---|---|
| M1 | P1 | +10 |
| M2 | P2 | -4 |
| M3 | P1 | +6 |
| M4 | P2 | +3 |

**Map output** (emit `(ProductID, Qty)`)
- (P1,+10), (P2,-4), (P1,+6), (P2,+3)

**Combiner output** (per mapper)
- (P1,16), (P2,-1)

**Shuffle grouping**
- P1 → [16]
- P2 → [-1]

**Reduce output**
- (P1,16), (P2,-1)

**SQL equivalent**
```sql
SELECT ProductID, SUM(Qty)
FROM InventoryMovements
GROUP BY ProductID;
```

**Mini cost estimate**
- Without combiner: `E = 4`
- With combiner: `E = 2` (half the shuffle)
- If `s = 16 bytes`, shuffle drops from 64 to 32 bytes.

> **Managerial takeaway:** Use combiners whenever the metric is additive. It’s the easiest “free” cost reduction.

## Worked Example 3: Call Center Average Handle Time (Combiner-Unsafe Naive Avg)
**Scenario (CallCenterLogs):** Average handle time per agent.

**Input (CallCenterLogs)**

| CallID | AgentID | HandleTime |
|---|---|---|
| C1 | A1 | 6 |
| C2 | A1 | 4 |
| C3 | A2 | 10 |
| C4 | A1 | 20 |

**Naive map output** (emit `(AgentID, HandleTime)`)
- (A1,6), (A1,4), (A2,10), (A1,20)

**Naive combiner (WRONG):** averaging locally then averaging again
- Suppose mapper1 sees A1: [6,4] → avg=5
- mapper2 sees A1: [20] → avg=20
- Shuffle A1 → [5,20] → reduce avg = 12.5 (WRONG)

**Correct map output** (emit `(AgentID, (sum, count))`)
- (A1,(6,1)), (A1,(4,1)), (A2,(10,1)), (A1,(20,1))

**Combiner output**
- (A1,(10,2)), (A2,(10,1)), (A1,(20,1))

**Shuffle grouping**
- A1 → [(10,2),(20,1)]
- A2 → [(10,1)]

**Reduce output**
- A1: sum=30, count=3 → avg=10
- A2: sum=10, count=1 → avg=10

**SQL equivalent**
```sql
SELECT AgentID, AVG(HandleTime)
FROM CallCenterLogs
GROUP BY AgentID;
```

**Mini cost estimate**
- Correct approach doubles pair size `(sum,count)` but enables safe combiner.
- If `E=4`, `s=32 bytes`, `C_shuffle ≈ 128 bytes`.
- Still cheaper than wrong results.

## Joins in MapReduce (SQL Lens)
- **Reduce-side join:** shuffle both tables by join key.
- **Broadcast/map-side join:** replicate small table to mappers.
- **SQL lens:** Both implement `SELECT ... FROM R JOIN S ON key` with different execution plans.

## Worked Example 4: Reduce-Side Join (Orders + Customers)
**Scenario:** Enrich orders with customer segment when both tables are large.

**Input (Orders)**

| OrderID | CustomerID | Amount |
|---|---|---|
| O1 | C1 | 120 |
| O2 | C2 | 80 |

**Input (Customers)**

| CustomerID | Segment |
|---|---|
| C1 | Enterprise |
| C2 | SMB |

**Map outputs (tagged)**
- Orders → (C1, ("O", O1,120)), (C2,("O",O2,80))
- Customers → (C1,("C",Enterprise)), (C2,("C",SMB))

**Shuffle grouping**
- C1 → [O1,120], [Enterprise]
- C2 → [O2,80], [SMB]

**Reduce output**
- (O1, C1, 120, Enterprise)
- (O2, C2, 80, SMB)

**SQL equivalent**
```sql
SELECT o.OrderID, o.CustomerID, o.Amount, c.Segment
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID;
```

**Mini cost estimate**
- Shuffle bytes proportional to `|Orders| + |Customers|`.
- If `|Orders| = 10^8 rows`, `|Customers| = 10^7 rows`, shuffle dominates.

## Failure Mode: Data Skew (Bottleneck Risk)
- One hot key sends huge volume to one reducer.
- That reducer spills heavily, becomes straggler, may OOM.
- Whole job waits for this reducer.
- **SQL lens:** A `GROUP BY` where one group is 90% of all rows.

## Skew Detection Signals
- Max reducer input vs median reducer input.
- Reducer runtime p99 vs median.
- Spill bytes and retry counts per reducer.
- Alert when imbalance ratio crosses threshold.

> **Managerial takeaway:** Skew is a production risk, not a corner case. Monitor reducer balance like you monitor utilization in a factory line.

---

# Week 7: Advanced MapReduce — Skew, Joins, and Cost Optimization (IEM Adaptation)

## Purpose
- Solve real production bottlenecks in MapReduce pipelines
- Control shuffle cost and load imbalance under skewed data
- Choose join and partitioning strategies from measurable constraints

## Learning Objectives
- Quantify skew and estimate its runtime impact
- Apply combiner, salting, and custom partitioning correctly
- Select reduce-side vs broadcast vs salted joins
- Build operational guardrails for shuffle-heavy jobs

## Core Metric: Skew Ratio
\[
\sigma = \frac{\max_i n_i}{N/R}
\]
- `N`: total values, `R`: reducers, `n_i`: reducer load.
- `sigma = 1` is perfectly balanced.
- High `sigma` predicts stragglers and possible OOM.
- **SQL lens:** This is the uneven group-size ratio in `GROUP BY` results.

## Latency Impact of Skew
\[
T_{job} \approx \alpha \cdot \max_i n_i = \sigma \cdot T_{balanced}
\]
- Job time is driven by the hottest reducer.
- 20× skew can produce ~20× tail latency.
- Retries do not help when skew is structural.

## Why Skew Appears (Operations Analogy)
- Real key distributions are long-tail (few products/customers dominate volume).
- Hash partitioning sends all of a hot key to one reducer.
- **SQL lens:** A `GROUP BY` with a single group holding most rows.

## Worked Example 5: Skewed Key and Salting (Two-Stage Reduce)
**Scenario (OrderItems):** Count items per ProductID; one mega-product dominates.

**Input (OrderItems)**

| ItemID | ProductID |
|---|---|
| I1 | P_HOT |
| I2 | P_HOT |
| I3 | P_HOT |
| I4 | P2 |
| I5 | P3 |

**Problem:** P_HOT has 60% of rows → one reducer overload.

**Stage 1 Map output (salted)**
- Use 2 salts for P_HOT: `P_HOT#0`, `P_HOT#1`
- I1 → (P_HOT#0,1), I2 → (P_HOT#1,1), I3 → (P_HOT#0,1)
- I4 → (P2,1), I5 → (P3,1)

**Stage 1 Reduce output**
- (P_HOT#0,2), (P_HOT#1,1), (P2,1), (P3,1)

**Stage 2 Map output** (unsalt)
- (P_HOT,2), (P_HOT,1), (P2,1), (P3,1)

**Stage 2 Reduce output**
- (P_HOT,3), (P2,1), (P3,1)

**SQL equivalent**
```sql
SELECT ProductID, COUNT(*)
FROM OrderItems
GROUP BY ProductID;
```

**Mini cost estimate**
- Stage 1 shuffle increases pairs slightly but prevents single-reducer overload.
- Cost tradeoff: extra stage vs avoiding straggler/OOM risk.

> **Managerial takeaway:** Use salting when a single key threatens SLA. The extra stage is cheaper than a failed run.

## Combiner: First Optimization Lever
- Local pre-aggregation before shuffle.
- Reduces duplicate key emissions per mapper.
- Biggest benefit on count/sum-style workloads.
- **SQL lens:** Partial aggregation at each shard.

## Shuffle Reduction Model
\[
C_0 = E \cdot s, \quad C_1 = \left(\sum_m U_m\right) \cdot s
\]
- `E`: raw emissions, `U_m`: unique keys per mapper.
- Reduction depends on duplicate density per mapper.

## Join Strategy 1: Reduce-Side Join
- Shuffle both sides on join key.
- Works for general large-large joins.
- Expensive network cost (`|R| + |S|` moved).
- Highest skew risk on popular keys.

## Join Strategy 2: Broadcast Join
- Replicate small side to mappers.
- Stream large side locally, no global join shuffle.
- Fast when small table fits mapper memory.
- **SQL lens:** Same `JOIN`, but the small table is cached on each worker.

## Worked Example 6: Broadcast Join Decision (OrderItems + Products)
**Scenario:** Products table is small; OrderItems is huge.

**Input sizes (story)**
- Products: 50,000 rows (~5 MB)
- OrderItems: 200 million rows (~20 GB)

**Map-side join approach**
- Load Products into memory on each mapper.
- Map OrderItems and attach product info locally.

**Map output**
- For each item: (OrderID, ProductID, Category, Qty)

**Shuffle grouping** (only if further aggregation needed)
- Example: group by Category to sum Qty.

**Reduce output**
- (Category, TotalQty)

**SQL equivalent**
```sql
SELECT p.Category, SUM(oi.Qty)
FROM OrderItems oi
JOIN Products p ON oi.ProductID = p.ProductID
GROUP BY p.Category;
```

**Mini cost estimate**
- Broadcast cost: replicate ~5 MB to each mapper.
- Shuffle cost avoided for join; only aggregated output shuffles.

> **Managerial takeaway:** If a dimension table is “small enough to email,” broadcast it.

## Join Strategy 3: Salted Join (Skewed Keys)
- For skewed join keys in reduce-side joins.
- Salt heavy side; replicate matching records on light side.
- Balances hot join key across reducers.
- Adds controlled replication cost.

## Worked Example 7: Salted Reduce-Side Join (Mega-Customer)
**Scenario:** A single customer (C_HOT) has 40% of orders.

**Input (Orders)**

| OrderID | CustomerID | Amount |
|---|---|---|
| O1 | C_HOT | 100 |
| O2 | C_HOT | 90 |
| O3 | C2 | 70 |

**Input (Customers)**

| CustomerID | Segment |
|---|---|
| C_HOT | Enterprise |
| C2 | SMB |

**Salted approach**
- Orders map: `C_HOT#0`, `C_HOT#1` to split load.
- Customers map: replicate C_HOT across salts.

**Map output (tagged)**
- Orders → (C_HOT#0,("O",O1,100)), (C_HOT#1,("O",O2,90)), (C2,("O",O3,70))
- Customers → (C_HOT#0,("C",Enterprise)), (C_HOT#1,("C",Enterprise)), (C2,("C",SMB))

**Shuffle grouping**
- C_HOT#0 → [O1,100], [Enterprise]
- C_HOT#1 → [O2,90], [Enterprise]
- C2 → [O3,70], [SMB]

**Reduce output**
- (O1,C_HOT,100,Enterprise), (O2,C_HOT,90,Enterprise), (O3,C2,70,SMB)

**SQL equivalent**
```sql
SELECT o.OrderID, o.CustomerID, o.Amount, c.Segment
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID;
```

**Mini cost estimate**
- Additional replication of the hot customer row (small cost).
- Prevents single reducer overload for C_HOT.

> **Managerial takeaway:** Salted joins trade a small, controlled replication cost for big reductions in risk and tail latency.

## Practical Cost Estimates (Before Running)
\[
B_{shuffle} = N_{emit} \times s_{pair}
\]
- Estimate shuffle bytes before launching large runs.
- Size reducers for expected hottest partition.
- Validate memory headroom against hot-key scenarios.

## Detection Signals (Operational KPIs)
- `max reducer input / median` ratio.
- Reducer runtime p95/p50 spread.
- Spill bytes per task and retry count.
- Shuffle MB per input record trend.

## Mitigation Playbook
- Apply combiner for valid aggregations.
- Salt hot keys above skew threshold.
- Repartition with custom logic for known heavy keys.
- Prefer broadcast joins when memory allows.

> **Managerial takeaway:** Treat reducer balance metrics like utilization metrics in a factory: persistent imbalance requires redesign, not more resources.

---

# Example Bank (All Worked Examples)

## Example A: Order Counts by Customer
- **Input:** Orders table with 5 rows.
- **Map:** emit `(CustomerID,1)`.
- **Shuffle:** group by CustomerID.
- **Reduce:** sum counts.
- **SQL:** `SELECT CustomerID, COUNT(*) FROM Orders GROUP BY CustomerID;`
- **Cost:** `E=5`, `s=16B`, `C_shuffle≈80B`.

## Example B: Inventory Movement Totals
- **Input:** InventoryMovements with Qty.
- **Map:** emit `(ProductID, Qty)`.
- **Combiner:** sum per mapper.
- **Reduce:** sum totals.
- **SQL:** `SELECT ProductID, SUM(Qty) FROM InventoryMovements GROUP BY ProductID;`
- **Cost:** combiner halves shuffle pairs in the example.

## Example C: Call Center Average Handle Time
- **Input:** CallCenterLogs with HandleTime.
- **Map:** emit `(AgentID, (sum,count))`.
- **Combiner:** sum partials.
- **Reduce:** final average.
- **SQL:** `SELECT AgentID, AVG(HandleTime) FROM CallCenterLogs GROUP BY AgentID;`
- **Cost:** larger pair size but correct and combiner-safe.

## Example D: Reduce-Side Join Orders + Customers
- **Input:** Orders + Customers.
- **Map:** tag each row with source.
- **Shuffle:** group by CustomerID.
- **Reduce:** join records.
- **SQL:** standard `JOIN` on CustomerID.
- **Cost:** shuffle proportional to `|Orders| + |Customers|`.

## Example E: Skewed Product Counts with Salting
- **Input:** OrderItems with P_HOT dominating.
- **Map:** salt P_HOT into multiple keys.
- **Reduce:** partial counts per salt.
- **Second stage:** unsalt and recombine.
- **SQL:** `SELECT ProductID, COUNT(*) FROM OrderItems GROUP BY ProductID;`
- **Cost:** extra stage, but avoids straggler risk.

## Example F: Broadcast Join for Small Dimension
- **Input:** small Products, huge OrderItems.
- **Map:** load Products into memory and join locally.
- **Reduce:** optional aggregation (e.g., by Category).
- **SQL:** join + group by Category.
- **Cost:** replicating small table is cheaper than global shuffle.

## Example G: Salted Join for Mega-Customer
- **Input:** Orders + Customers with C_HOT.
- **Map:** salt hot key; replicate customer row.
- **Reduce:** join per salt.
- **SQL:** standard join.
- **Cost:** small replication cost for big skew mitigation.

---

# Practice Questions (10)
1. Explain why shuffle usually dominates runtime in MapReduce. Provide a numeric example with `E` and `s`.
2. Given 1,000,000 records and 100 reducers, a hot key has 300,000 records. Compute the skew ratio.
3. Write the SQL equivalent of a MapReduce job that computes total defects by production line.
4. Why is naive average not combiner-safe? Provide a two-mapper counterexample.
5. For a join between a 2 GB Orders table and a 20 MB Customers table, which join strategy is best and why?
6. In a job with `E=200M` and average pair size `s=24 bytes`, estimate shuffle bytes.
7. Provide a salting strategy for a mega-product that appears in 50% of OrderItems.
8. List three operational metrics that indicate skew risk.
9. You need to compute max temperature by machine from MachineEvents. Is a combiner safe? Why?
10. When would you accept a two-stage MapReduce job despite extra cost?

---

# Instructor Notes
## 90-Minute Teaching Plan
1. **0–10 min:** Motivation (bottlenecks, flow, shuffle cost). Use Audience Framing.
2. **10–30 min:** Map → Shuffle → Reduce fundamentals with Example 1.
3. **30–45 min:** Combiner correctness with Example 2 and Example 3.
4. **45–60 min:** Joins (reduce-side vs broadcast) with Example 4 and Example 6.
5. **60–75 min:** Skew ratio + salting with Example 5 and Example 7.
6. **75–90 min:** Practice questions + managerial takeaways.

## Common Confusions to Address
- **“More reducers fixes skew.”** No—hot keys still go to one reducer.
- **“Combiner always helps.”** Only for associative/commutative operations; naive average breaks.
- **“Shuffle is just network.”** It is network + disk spill + merge CPU.
- **“SQL hides the cost.”** The physical plan still requires data movement at scale.
