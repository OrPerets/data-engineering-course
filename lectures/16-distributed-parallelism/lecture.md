# Week 16: Distributed Systems + Parallelism (Conceptual Overview)

## Learning objectives (1/2)
- Describe why we partition data and work across many machines
- Explain SQL vs NoSQL using correctness vs scale (ACID/BASE, CAP intuition)
- Distinguish parallelism vs concurrency in operations terms

---

## Learning objectives (2/2)
- Use divide–conquer–combine to reason about scalable jobs
- Recognize common failure modes: hot keys, skew, stale reads, and what to monitor

---

## Flow for today
- The scaling problem: data and work outgrow one machine
- Distributed data: partitioning, replication, and consistency trade-offs
- Distributed work: parallelism, divide-and-conquer, and bottlenecks
- Failure modes and decision checklist

---

## Key terms: SLA

**SLA (Service Level Agreement):** A commitment between provider and customer (e.g. "99.9% uptime" or "p95 response time < 200 ms"). Missing the SLA can trigger penalties, refunds, or contract risk. We design and monitor systems so we stay within these targets.

---

## Key terms: Why we care about response-time distribution

When we measure **response time** (e.g. how long a query or request takes), we care about the full distribution, not only the average.

---

## Key terms: Latency percentiles (p50, p95, p99)

| Term | Meaning | Why it matters |
|---|---|---|
| **p50 (median)** | Half of requests finish within this time | Typical user experience |
| **p95** | 95% of requests finish within this time | Most users; long tail starts here |
| **p99** | 99% of requests finish within this time | Worst regular users; SLA and penalties often defined here |

---

## Key terms: In practice

Average latency can look fine while p95/p99 spike (e.g. a few slow requests drag the tail). Under load, p95 and p99 rise before the average does—so we monitor them to avoid surprises and SLA breaches.

---

## 1) Why Distributed Data & Parallelism Matter for IEM

In Industrial Engineering & Management, we do not scale systems for "technical elegance." We scale because business processes generate more demand, more events, and more decisions per minute than a single machine can handle.

---

## Think like a system designer, not a programmer
- **Distributed database decisions** answer: *Where is the data stored so service stays reliable and responsive?*
- **Parallel processing decisions** answer: *How is the workload split so decisions arrive on time at acceptable cost?*

---

## Operational objective: KPIs

| KPI | What it means in operations | Why leadership cares |
|---|---|---|
| Throughput (req/s, rows/s) | System capacity per unit time | Revenue volume and SLA coverage |
| Latency (p50/p95/p99) | Response speed | User experience, abandonment, penalty risk |
| Availability (%) | Uptime under failure | Business continuity |
| Cost per 1M operations | Infrastructure efficiency | Margin and budget predictability |
| Freshness (replication lag) | Data age at read time | Decision quality |

---

## Two sides of the same coin
- **Distributed data:** many nodes store one logical database (where the data lives)
- **Parallel compute:** many workers process one logical job (how the work is split)
- Same user experience, higher scale and resilience

---

## 2) The Scaling Problem (Business View)

A single-node architecture often works early, then fails suddenly during growth.

---

## Scaling: stages and symptoms

| Stage | Daily volume | Peak request rate | Typical symptom |
|---|---:|---:|---|
| Pilot | 100k rows/day | 50 req/s | No visible issues |
| Growth | 5M rows/day | 800 req/s | Slow dashboards, timeout spikes |
| Scale | 100M rows/day | 8,000 req/s | Queue buildup, SLA misses, outage risk |

---

## Why this breaks (operations terms)
- One machine becomes a **bottleneck station**.
- Maintenance or failure creates a **single point of stoppage**.
- Peak demand creates long tails (p95/p99 explode before average does).

---

## Decision Box — Scaling (1/2)
> **What decision is being made here?**  
> Scale up one bigger machine vs scale out multiple machines.
>
> **What could go wrong?**  
> Big machine still fails; migration is expensive; peak season still overloads.

---

## Decision Box — Scaling (2/2)
> **What metric would warn us?**  
> p95 latency trend, CPU saturation %, queue depth, timeout rate.

---

## 3) Distributed Databases (Rewritten)

## 3.1 Partitioning: split data across nodes

Partitioning means dividing rows so each node stores a subset.

---

### Example 1 — Partition by `customer_id` vs `country`

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

---

## Example 1 — Single-node scenario (what breaks)
- 10M orders/day on one node.
- Peak reads 2,000 req/s; node handles 900 req/s comfortably.
- p95 latency rises from 80 ms to 450 ms.

---

## Example 1 — Distributed scenario (what improves)
- 4 nodes, partition by `customer_id` hash.
- ~2.5M rows/node, read load spread to ~500 req/s/node.
- p95 latency drops to ~120 ms.

---

## Example 1 — If partition by `country` (hot partition)
- US rows = 6/10 in toy table (60%); in real traffic maybe 70–80%.
- One partition gets overloaded (hot partition).

---

## Example 1 — SQL lens and takeaway
**SQL lens:** `SELECT * FROM Orders WHERE customer_id = 106` → usually one shard hit. Joins/aggregations across many shards require coordination.

**Takeaway:** Choose partition keys by **access pattern + key distribution**, not by intuition.

---

## 3.2 Replication: copy data for availability and read scale

Replication keeps multiple copies (primary + replicas).

---

### Example 2 — Replication and stale reads

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

---

## Example 2 — Single-node scenario (what breaks)
- If only one DB node fails, checkout stops (0% availability during outage).

---

## Example 2 — Distributed with replication (what improves)
- 1 primary + 2 replicas.
- Read capacity roughly triples for read-heavy traffic.
- Availability improves: reads continue if one node fails.

**Risk:** user reads replica at 10:00:03 and sees stock=2 (stale).

---

## Example 2 — Stale reads and takeaway
**SQL lens:** `SELECT stock FROM Inventory WHERE product_id = 12` may hit stale replica. Strict up-to-date reads from all replicas increase coordination and latency.

**Takeaway:** Replication improves resilience and read throughput, but introduces freshness risk.

---

## Decision Box — Replication (1/2)
> **What decision is being made here?**  
> Read from nearest replica vs force read from primary.
>
> **What could go wrong?**  
> Overselling inventory due to stale reads.

---

## Decision Box — Replication (2/2)
> **What metric would warn us?**  
> Replication lag (seconds), stale-read incident count.

---

## 3.3 SQL vs NoSQL trade-offs (IEM decision view)

| Dimension | SQL systems (typical) | NoSQL systems (typical) |
|---|---|---|
| Strength | Strong integrity, joins, transactions | High write/read scale, flexible schema |
| Best fit | Finance, orders, master data | Event logs, feeds, session/state |
| Cost pattern | Higher coordination cost at very high scale | Lower per-operation coordination, higher app-level logic |
| Risk pattern | Performance bottlenecks under extreme scale | Consistency/freshness caveats |

---

### Example 3 — Same business data, different workload

**Table: `Payments(payment_id, customer_id, amount, status)`**

| payment_id | customer_id | amount | status |
|---:|---:|---:|---|
| 501 | 9001 | 42 | captured |
| 502 | 9002 | 75 | pending |
| 503 | 9001 | 30 | captured |
| 504 | 9003 | 110 | failed |
| 505 | 9002 | 60 | captured |

---

## Example 3 — Two workloads, one table
- Finance reconciliation needs exact consistency (SQL transactional path).
- Real-time customer activity feed needs very high read throughput (NoSQL serving path).

**Single-node break:** mixed workload on one DB causes lock/contention and 700 ms p95 at peaks.

**Distributed/hybrid improvement:** SQL handles correctness-critical writes; NoSQL read model serves 5,000 req/s feed lookups with 80 ms p95.

---

## Example 3 — Takeaway
**SQL lens:** Transaction side = `BEGIN ... UPDATE ... COMMIT`. Serving side often denormalized (precomputed by key). High fan-out reads + heavy joins on hot tables under peak load.

**Takeaway:** This is not SQL *or* NoSQL ideology; it is **workload segmentation**.

---

## 3.4 ACID / BASE / CAP (intuition only)

- **ACID intuition:** prioritize correctness of each transaction.
- **BASE intuition:** prioritize availability and scale; consistency may be delayed.
- **CAP intuition:** during network partition, you cannot maximize both immediate consistency and availability simultaneously.

---

### Example 4 — Branch ticketing under network split

**Table: `Tickets(ticket_id, branch, priority, created_at)`**

| ticket_id | branch | priority | created_at |
|---:|---|---|---|
| 701 | North | high | 09:01 |
| 702 | South | low | 09:02 |
| 703 | North | medium | 09:04 |
| 704 | East | high | 09:05 |
| 705 | South | medium | 09:06 |

---

## Example 4 — Network split: two choices
At 09:10, WAN link between regions fails.

- **Consistency-first choice:** reject some writes until coordination restored.
- **Availability-first choice:** accept local writes; reconcile later.

**Single-node break:** no regional autonomy; outage can block all writes.

**Distributed improvement:** regional continuity possible, with explicit consistency policy.

---

## Example 4 — Takeaway
**SQL lens:** SQL expectation = one current truth now. At distributed scale, enforcing that globally can raise latency or reject operations.

**Takeaway:** CAP is an **outage-time trade-off** decision, not a normal-day design slogan.

---

## 4) Parallelism & Work Distribution

## 4.1 Parallelism vs concurrency using operations logic

| Concept | Operations analogy | Main KPI impacted |
|---|---|---|
| Concurrency | One agent juggling multiple calls | Utilization |
| Parallelism | Multiple agents serving calls simultaneously | Throughput + waiting time |

---

### Example 5 — Call center workload

**Table: `Calls(call_id, arrival_min, service_min, queue)`**

| call_id | arrival_min | service_min | queue |
|---:|---:|---:|---|
| 1 | 0 | 4 | billing |
| 2 | 1 | 3 | billing |
| 3 | 1 | 5 | support |
| 4 | 2 | 2 | support |
| 5 | 3 | 4 | billing |
| 6 | 3 | 3 | support |

---

## Example 5 — Single-worker scenario
- Capacity ≈ 1/3.5 calls per min.
- Queue grows; average wait 6 min; p95 wait 12 min.

---

## Example 5 — Parallel 3-worker scenario
- Capacity ≈ 3/3.5 calls per min.
- Average wait drops to ~1.5 min; p95 ~4 min.

---

## Example 5 — Why adding workers helps until it doesn't
If one queue type dominates (e.g., billing 80%), specialized agents become bottleneck. Coordination overhead rises with too many workers.

---

## Example 5 — SQL lens and takeaway
**SQL lens:** Similar to running independent chunks of a large query in parallel; final merge/sort and shared resources can become bottlenecks.

**Takeaway:** More workers improve throughput until **imbalance and coordination overhead** dominate.

---

## 4.2 Divide–Conquer–Combine as the central model

- **Divide:** partition data/workload.
- **Conquer:** same operation on each partition independently.
- **Combine:** merge partial outputs.

This is the mental bridge to next week’s MapReduce.

---

### Numeric demo A — Count orders by department

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

---

## Numeric demo A — Divide, conquer, combine
- **Divide:** 2 partitions, 4 rows each.
- **Conquer (local counts):** P1: A=2, B=1, C=1; P2: A=1, B=2, C=1
- **Combine:** A=3, B=3, C=2

**SQL mapping:** `GROUP BY department`.

---

### Numeric demo B — Sum revenue by region

**Table: `Sales(sale_id, region, revenue)`**

| sale_id | region | revenue |
|---:|---|---:|
| 11 | North | 100 |
| 12 | South | 70 |
| 13 | North | 60 |
| 14 | East | 90 |
| 15 | South | 50 |
| 16 | East | 40 |

---

## Numeric demo B — Divide, conquer, combine
- **Divide:** 3 workers, 2 rows each.
- **Conquer (local sums):** W1: North=100, South=70; W2: North=60, East=90; W3: South=50, East=40
- **Combine:** North=160, South=120, East=130

**SQL mapping:** `SELECT region, SUM(revenue) ... GROUP BY region`.

---

### Numeric demo C — Average handling time by queue

**Table: `Tasks(task_id, queue, handle_min)`**

| task_id | queue | handle_min |
|---:|---|---:|
| 21 | claims | 6 |
| 22 | claims | 4 |
| 23 | support | 5 |
| 24 | support | 7 |
| 25 | claims | 8 |
| 26 | support | 4 |

---

## Numeric demo C — Divide, conquer, combine
- **Divide:** 2 partitions.
- **Conquer:** each partition computes `(sum, count)` per queue.
- **Combine:** totals then divide — claims: avg 6; support: avg 5.33

**SQL mapping:** `AVG(handle_min)` works as distributed `SUM/COUNT`.

---

## Bridge to MapReduce
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

---

### Example 6 — Hot key and straggler in event data

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

---

## Example 6 — What happens
If partitioned by `user_id`, user 999 dominates one partition.

**Single-node break:** all 8 events one queue; burst causes 500 ms spikes.

**Distributed scenario:** 4 workers, but worker handling user 999 gets 4/8 rows while others get ~1–2. Fast workers finish in 1s, hot worker in 3s. End-to-end job time = 3s (straggler effect).

---

## Example 6 — Takeaway
**SQL lens:** `WHERE user_id = 999` repeatedly hits same shard. Even with partitioning, skewed keys defeat balance.

**Takeaway:** Average load can look healthy while tail latency and bottleneck risk worsen.

---

## Example 6 — Mitigation options (conceptual)
- Local aggregation before shuffle
- Key salting for hot keys
- Custom partitioning for heavy keys

---

## Decision Box — Hot keys and stragglers (1/2)
> **What decision is being made here?**  
> Keep simple partitioning vs apply salting/repartitioning for hot keys.
>
> **What could go wrong?**  
> One partition dictates completion time; incident escalations during peaks.

---

## Decision Box — Hot keys and stragglers (2/2)
> **What metric would warn us?**  
> Max/avg partition size ratio, p99 task completion time.

---

## 6) Worked Example Bank

## Example Bank Index (1/2)
1. Partition key choice (`customer_id` vs `country`)  
2. Replication and stale reads in inventory  
3. SQL vs NoSQL hybrid for payments/feed  
4. ACID/BASE/CAP during network partition  
5. Parallelism vs concurrency in call center queues  

---

## Example Bank Index (2/2)
6. Hot key, skew, and straggler in event processing  
7. Divide–conquer–combine numeric demo A (count)  
8. Divide–conquer–combine numeric demo B (sum)  
9. Divide–conquer–combine numeric demo C (average)

---

## How to use the example bank
Use these as in-class mini-cases:

- Ask students to estimate **rows per node**, **req/s per node**, and **expected p95 impact** before revealing outcomes.
- Always end each case with: “What would you monitor first tomorrow morning?”

---

## Design checklist (before scaling a system) — 1/2
- What are the top 3 read/write paths?
- Which operations need strict consistency?
- What is the acceptable stale-read window?

---

## Design checklist (before scaling a system) — 2/2
- Are partitions balanced for real key distributions?
- Can local aggregation reduce coordination volume?
