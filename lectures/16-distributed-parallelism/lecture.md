# Week 16: Distributed Systems + Parallelism (Conceptual Overview)

## 1) Why Distributed Data & Parallelism Matter for IEM

In Industrial Engineering & Management, we do not scale systems for “technical elegance.” We scale because business processes generate more demand, more events, and more decisions per minute than a single machine can handle.

Think like a system designer, not a programmer:

- **Distributed database decisions** answer: *Where is the data stored so service stays reliable and responsive?*
- **Parallel processing decisions** answer: *How is the workload split so decisions arrive on time at acceptable cost?*

Operational objective:

| KPI | What it means in operations | Why leadership cares |
|---|---|---|
| Throughput (req/s, rows/s) | System capacity per unit time | Revenue volume and SLA coverage |
| Latency (p50/p95/p99) | Response speed | User experience, abandonment, penalty risk |
| Availability (%) | Uptime under failure | Business continuity |
| Cost per 1M operations | Infrastructure efficiency | Margin and budget predictability |
| Freshness (replication lag) | Data age at read time | Decision quality |

---

## 2) The Scaling Problem (Business View)

A single-node architecture often works early, then fails suddenly during growth.

| Stage | Daily volume | Peak request rate | Typical symptom |
|---|---:|---:|---|
| Pilot | 100k rows/day | 50 req/s | No visible issues |
| Growth | 5M rows/day | 800 req/s | Slow dashboards, timeout spikes |
| Scale | 100M rows/day | 8,000 req/s | Queue buildup, SLA misses, outage risk |

Why this breaks in operations terms:

- One machine becomes a **bottleneck station**.
- Maintenance or failure creates a **single point of stoppage**.
- Peak demand creates long tails (p95/p99 explode before average does).

### Decision Box
> **What decision is being made here?**  
> Scale up one bigger machine vs scale out multiple machines.
>
> **What could go wrong?**  
> Big machine still fails; migration is expensive; peak season still overloads.
>
> **What metric would warn us?**  
> p95 latency trend, CPU saturation %, queue depth, timeout rate.

---

## 3) Distributed Databases (Rewritten)

### 3.1 Partitioning: split data across nodes

Partitioning means dividing rows so each node stores a subset.

#### Example 1 — Partition by `customer_id` vs `country`

**Table: `Orders(order_id, customer_id, country, amount)`**

| order_id | customer_id | country | amount |
|---:|---:|---|---:|
| 1 | 101 | US | 120 |
| 2 | 102 | US | 90 |
| 3 | 103 | IN | 40 |
| 4 | 104 | US | 75 |
| 5 | 105 | BR | 60 |
| 6 | 106 | US | 210 |
| 7 | 107 | IN | 55 |
| 8 | 108 | US | 130 |
| 9 | 109 | BR | 45 |
| 10 | 110 | US | 80 |

**Single-node scenario (what breaks):**
- 10M orders/day on one node.
- Peak reads 2,000 req/s; node handles 900 req/s comfortably.
- p95 latency rises from 80 ms to 450 ms.

**Distributed scenario (what improves):**
- 4 nodes, partition by `customer_id` hash.
- ~2.5M rows/node, read load spread to ~500 req/s/node.
- p95 latency drops to ~120 ms.

**If partition by `country` here:**
- US rows = 6/10 in toy table (60%); in real traffic maybe 70–80%.
- One partition gets overloaded (hot partition).

**SQL lens:**
- Looks like: `SELECT * FROM Orders WHERE customer_id = 106` → usually one shard hit.
- Why SQL struggles at scale: joins/aggregations across many shards require coordination and network exchange.

**Takeaway:** Choose partition keys by **access pattern + key distribution**, not by intuition.

---

### 3.2 Replication: copy data for availability and read scale

Replication keeps multiple copies (primary + replicas).

#### Example 2 — Replication and stale reads

**Table: `Inventory(product_id, stock, updated_at)`**

| product_id | stock | updated_at |
|---:|---:|---|
| 11 | 18 | 10:00:00 |
| 12 | 2 | 10:00:00 |
| 13 | 9 | 10:00:00 |
| 14 | 0 | 10:00:00 |
| 15 | 25 | 10:00:00 |

At 10:00:02, product 12 is purchased twice; primary updates stock from 2 → 0.
Replica receives update at 10:00:05 (3-second lag).

**Single-node scenario (what breaks):**
- If only one DB node fails, checkout stops (0% availability during outage).

**Distributed with replication (what improves):**
- 1 primary + 2 replicas.
- Read capacity roughly triples for read-heavy traffic.
- Availability improves: reads continue if one node fails.

**Risk:** user reads replica at 10:00:03 and sees stock=2 (stale).

**SQL lens:**
- Looks like: `SELECT stock FROM Inventory WHERE product_id = 12` may hit stale replica.
- Why SQL struggles at scale: strict up-to-date reads from all replicas increase coordination and latency.

**Takeaway:** Replication improves resilience and read throughput, but introduces freshness risk.

### Decision Box
> **What decision is being made here?**  
> Read from nearest replica vs force read from primary.
>
> **What could go wrong?**  
> Overselling inventory due to stale reads.
>
> **What metric would warn us?**  
> Replication lag (seconds), stale-read incident count.

---

### 3.3 SQL vs NoSQL trade-offs (IEM decision view)

| Dimension | SQL systems (typical) | NoSQL systems (typical) |
|---|---|---|
| Strength | Strong integrity, joins, transactions | High write/read scale, flexible schema |
| Best fit | Finance, orders, master data | Event logs, feeds, session/state |
| Cost pattern | Higher coordination cost at very high scale | Lower per-operation coordination, higher app-level logic |
| Risk pattern | Performance bottlenecks under extreme scale | Consistency/freshness caveats |

#### Example 3 — Same business data, different workload

**Table: `Payments(payment_id, customer_id, amount, status)`**

| payment_id | customer_id | amount | status |
|---:|---:|---:|---|
| 501 | 9001 | 42 | captured |
| 502 | 9002 | 75 | pending |
| 503 | 9001 | 30 | captured |
| 504 | 9003 | 110 | failed |
| 505 | 9002 | 60 | captured |

- Finance reconciliation needs exact consistency (SQL transactional path).
- Real-time customer activity feed needs very high read throughput (NoSQL serving path).

**Single-node break:** mixed workload on one DB causes lock/contention and 700 ms p95 at peaks.

**Distributed/hybrid improvement:**
- SQL system handles correctness-critical writes.
- NoSQL read model serves 5,000 req/s feed lookups with 80 ms p95.

**SQL lens:**
- Transaction side: `BEGIN ... UPDATE Payments ... COMMIT`.
- Serving side often denormalized: precomputed customer-payment history by key.
- Why SQL struggles here: high fan-out serving reads + heavy joins on hot tables under peak load.

**Takeaway:** This is not SQL *or* NoSQL ideology; it is workload segmentation.

---

### 3.4 ACID / BASE / CAP (intuition only)

- **ACID intuition:** prioritize correctness of each transaction.
- **BASE intuition:** prioritize availability and scale; consistency may be delayed.
- **CAP intuition:** during network partition, you cannot maximize both immediate consistency and availability simultaneously.

#### Example 4 — Branch ticketing under network split

**Table: `Tickets(ticket_id, branch, priority, created_at)`**

| ticket_id | branch | priority | created_at |
|---:|---|---|---|
| 701 | North | high | 09:01 |
| 702 | South | low | 09:02 |
| 703 | North | medium | 09:04 |
| 704 | East | high | 09:05 |
| 705 | South | medium | 09:06 |

At 09:10, WAN link between regions fails.

- **Consistency-first choice:** reject some writes until coordination restored.
- **Availability-first choice:** accept local writes; reconcile later.

**Single-node break:** no regional autonomy; outage can block all writes.

**Distributed improvement:** regional continuity possible, with explicit consistency policy.

**SQL lens:**
- SQL expectation: one current truth now.
- At distributed scale with partitions, enforcing that globally can raise latency or reject operations.

**Takeaway:** CAP is an outage-time trade-off decision, not a normal-day design slogan.

---

## 4) Parallelism & Work Distribution

### 4.1 Parallelism vs concurrency using operations logic

| Concept | Operations analogy | Main KPI impacted |
|---|---|---|
| Concurrency | One agent juggling multiple calls | Utilization |
| Parallelism | Multiple agents serving calls simultaneously | Throughput + waiting time |

#### Example 5 — Call center workload

**Table: `Calls(call_id, arrival_min, service_min, queue)`**

| call_id | arrival_min | service_min | queue |
|---:|---:|---:|---|
| 1 | 0 | 4 | billing |
| 2 | 1 | 3 | billing |
| 3 | 1 | 5 | support |
| 4 | 2 | 2 | support |
| 5 | 3 | 4 | billing |
| 6 | 3 | 3 | support |

**Single-worker scenario:**
- Capacity ≈ 1/3.5 calls per min.
- Queue grows; average wait 6 min; p95 wait 12 min.

**Parallel 3-worker scenario:**
- Capacity ≈ 3/3.5 calls per min.
- Average wait drops to ~1.5 min; p95 ~4 min.

**Why adding workers helps until it doesn’t:**
- If one queue type dominates (e.g., billing 80%), specialized agents become bottleneck.
- Coordination overhead rises with too many workers.

**SQL lens:**
- Similar to running independent chunks of a large query in parallel.
- Why SQL struggles at scale: final merge/sort and shared resources can become bottlenecks.

**Takeaway:** More workers improve throughput until imbalance and coordination overhead dominate.

---

### 4.2 Divide–Conquer–Combine as the central model

- **Divide:** partition data/workload.
- **Conquer:** same operation on each partition independently.
- **Combine:** merge partial outputs.

This is the mental bridge to next week’s MapReduce.

#### Numeric demo A — Count orders by department

**Table: `OrdersLite(order_id, department, amount)`**

| order_id | department | amount |
|---:|---|---:|
| 1 | A | 20 |
| 2 | B | 35 |
| 3 | A | 40 |
| 4 | C | 15 |
| 5 | B | 25 |
| 6 | A | 10 |
| 7 | C | 30 |
| 8 | B | 45 |

- **Divide:** 2 partitions, 4 rows each.
- **Conquer (local counts):**
  - P1: A=2, B=1, C=1
  - P2: A=1, B=2, C=1
- **Combine:** A=3, B=3, C=2

**SQL mapping:** `GROUP BY department`.

#### Numeric demo B — Sum revenue by region

**Table: `Sales(sale_id, region, revenue)`**

| sale_id | region | revenue |
|---:|---|---:|
| 11 | North | 100 |
| 12 | South | 70 |
| 13 | North | 60 |
| 14 | East | 90 |
| 15 | South | 50 |
| 16 | East | 40 |

- **Divide:** 3 workers, 2 rows each.
- **Conquer (local sums):**
  - W1: North=100, South=70
  - W2: North=60, East=90
  - W3: South=50, East=40
- **Combine:** North=160, South=120, East=130

**SQL mapping:** `SELECT region, SUM(revenue) ... GROUP BY region`.

#### Numeric demo C — Average handling time by queue

**Table: `Tasks(task_id, queue, handle_min)`**

| task_id | queue | handle_min |
|---:|---|---:|
| 21 | claims | 6 |
| 22 | claims | 4 |
| 23 | support | 5 |
| 24 | support | 7 |
| 25 | claims | 8 |
| 26 | support | 4 |

- **Divide:** 2 partitions.
- **Conquer:** each partition computes `(sum, count)` per queue.
- **Combine:** totals then divide.
  - claims: sum 18, count 3, avg 6
  - support: sum 16, count 3, avg 5.33

**SQL mapping:** `AVG(handle_min)` works as distributed `SUM/COUNT`.

**Bridge to MapReduce:**
- Divide ≈ input splits
- Conquer ≈ map/local aggregation
- Combine ≈ reduce/final aggregation

---

## 5) Failure Modes & Risk

| Technical term | IEM interpretation | Symptom | Business impact | What to monitor |
|---|---|---|---|---|
| Hot partition | Bottleneck station | One node at 95% CPU, others 30% | Slow critical path, SLA misses | Max vs avg partition load |
| Skew | Demand imbalance | Uneven row/task distribution | Poor capacity utilization | Partition size histogram |
| Straggler | Slowest worker determines completion | Most tasks finish quickly, few very slow | Batch misses deadline | p95/p99 task duration |
| Stale read | Decision from outdated data | Read-after-write inconsistency | Wrong allocation/pricing decisions | Replication lag, stale-read rate |

#### Example 6 — Hot key and straggler in event data

**Table: `Events(user_id, timestamp, event_type)`**

| user_id | timestamp | event_type |
|---:|---|---|
| 999 | 10:00:01 | click |
| 999 | 10:00:02 | click |
| 999 | 10:00:03 | click |
| 101 | 10:00:03 | view |
| 102 | 10:00:04 | click |
| 999 | 10:00:05 | purchase |
| 103 | 10:00:05 | view |
| 104 | 10:00:06 | click |

If partitioned by `user_id`, user 999 dominates one partition.

**Single-node break:** all 8 events one queue; burst causes 500 ms spikes.

**Distributed scenario:** 4 workers, but worker handling user 999 gets 4/8 rows while others get ~1–2.
- Fast workers finish in 1s, hot worker in 3s.
- End-to-end job time = 3s (straggler effect).

**SQL lens:**
- `WHERE user_id = 999` repeatedly hits same shard.
- Why SQL struggles at scale: even with partitioning, skewed keys defeat balance.

**Takeaway:** Average load can look healthy while tail latency and bottleneck risk worsen.

### Decision Box
> **What decision is being made here?**  
> Keep simple partitioning vs apply salting/repartitioning for hot keys.
>
> **What could go wrong?**  
> One partition dictates completion time; incident escalations during peaks.
>
> **What metric would warn us?**  
> Max/avg partition size ratio, p99 task completion time.

---

## 6) Worked Example Bank

### Example Bank Index

1. Partition key choice (`customer_id` vs `country`)  
2. Replication and stale reads in inventory  
3. SQL vs NoSQL hybrid for payments/feed  
4. ACID/BASE/CAP during network partition  
5. Parallelism vs concurrency in call center queues  
6. Hot key, skew, and straggler in event processing  
7. Divide–conquer–combine numeric demo A (count)  
8. Divide–conquer–combine numeric demo B (sum)  
9. Divide–conquer–combine numeric demo C (average)

Use these as in-class mini-cases:

- Ask students to estimate **rows per node**, **req/s per node**, and **expected p95 impact** before revealing outcomes.
- Always end each case with: “What would you monitor first tomorrow morning?”

---

## 7) Practice Questions

### A) Numeric

1. A table has 120M rows and is hash-partitioned across 6 nodes. If one node fails and traffic is redistributed to 5 nodes, what is the average row responsibility per remaining node?
2. Primary handles 1,200 writes/s. Replication lag is 2 seconds. Approx. how many writes may be missing on a lagging replica view?
3. Four workers process partitions in 8s, 9s, 10s, and 24s. What is total job completion time and what does this imply?

### B) Conceptual

4. Explain why a “good average latency” can hide serious operational risk in distributed systems.
5. During a regional network partition, when might a manager choose availability over strict consistency?
6. Why does adding more parallel workers eventually give diminishing returns?

### C) SQL mapping

7. For partitioning, write pseudo-SQL showing a query that should hit one shard and one that may fan out across shards.
8. For replication, write pseudo-SQL that can return stale data and explain under what condition.
9. For divide–conquer–combine, map `GROUP BY department` into local partials + final combine logic.

---

## 8) Instructor Notes

### 90-minute teaching flow

| Time | Segment | Method |
|---|---|---|
| 0–10 min | Why IEM should care | KPI table + one outage anecdote |
| 10–25 min | Scaling problem | Capacity/latency numbers on board |
| 25–50 min | Distributed DB concepts | Examples 1–4 + SQL lens each |
| 50–70 min | Parallelism & divide–conquer–combine | Call-center analogy + demos A/B/C |
| 70–82 min | Failure modes & risk | Risk table + monitoring metrics |
| 82–90 min | Wrap + MapReduce lead-in | Connect divide/conquer/combine to next week |

### Common student misconceptions

- “Distributed means automatically faster.”  
  Correction: only if partitioning aligns with workload and skew is controlled.
- “Replication solves everything.”  
  Correction: replication improves availability/read scale but can create stale reads.
- “Average latency is enough.”  
  Correction: p95/p99 drives real user pain and SLA breaches.
- “Parallelism = concurrency.”  
  Correction: concurrency improves utilization; parallelism increases simultaneous processing capacity.

### Explicit lead-in to MapReduce (next week)

Use this sentence to close:

> “Today we learned to think in **divide–conquer–combine** for operations scaling. Next week, MapReduce formalizes this into a repeatable execution model: split data, apply the same transformation in parallel, then aggregate deterministically.”

