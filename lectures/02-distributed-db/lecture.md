# Week 2: Distributed Databases: SQL vs NoSQL

## Purpose
- Why this topic matters in data engineering
- Distributed storage as foundation for scale
- Trade-offs drive architecture choices

## Learning Objectives
- Define distributed DB concepts: partitioning, replication
- Compare SQL vs NoSQL models and guarantees formally
- Calculate single-node limits (storage, throughput, availability)
- Design partitioning strategies with numeric constraints
- Reason about replication factor and write amplification
- Analyze CAP trade-offs in concrete scenarios
- Identify failure modes and detection or mitigation

## Sources Used (Reference Only)
- sources/Lecture 2.pptx
- sources/Lecture 2.pdf

## Core Concepts (1/2)

## Definitions
- Distributed DB: data and compute spread across nodes
- Partition: subset of data on one or more nodes
- Replication: copies of same partition for availability
- Coordinator: routes requests, may run consensus

## Formal Models
- Relational (SQL): tables, keys, joins, ACID
- Key-value: get/put by key, no joins
- Document: nested structures, key or path access
- Wide-column: partition + clustering keys

## SQL vs NoSQL (Models, Not Tools)
- SQL: fixed schema, normalized, declarative queries
- NoSQL: schema-flexible, denormalized, key-centric
- Both: can be single-node or distributed
- Choice: access patterns and guarantees first

## Core Concepts (2/2)

## Guarantees
- ACID: atomicity, consistency, isolation, durability
- BASE: basically available, soft state, eventual consistency
- Strong vs eventual: when reads see writes

## What Breaks at Scale
- Cross-partition joins: data movement, latency
- Cross-partition transactions: 2PC, blocking
- Single partition: hot keys, skew
- Network: latency, partitions, partial failure

## Why Single-Node Databases Break

## Storage Limits
- Single machine: max ~100 TB disk typical
- Example: 1B users × 1 KB ≈ 1 TB
- Growth 10%/month ⇒ 100 GB/month
- Time to fill: ~8 years; need headroom ⇒ ~10 TB limit

## Throughput Limits
- Single machine: ~10K writes/sec order of magnitude
- Example: 100M users, 1 write/user/day ⇒ 1,157 writes/sec avg
- Peak 5× ⇒ 5,785 writes/sec
- Single node: insufficient headroom

## Availability Limits
- Single machine: 99.9% uptime ⇒ 8.76 h/year downtime
- Example: e-commerce $10K/h loss ⇒ $87,600/year
- Distributed 99.99% ⇒ $8,760; distribution improves availability

## What “Distributed” Really Means

## Multiple Machines
- Data split across nodes; each node: own storage, own compute
- Coordination over network
- Example: 3 nodes, ~33% data each

## Partial Failures
- One node fails; others continue
- Network partition ⇒ split-brain risk
- Replica lag ⇒ stale reads possible
- No single point of failure; complexity increases

## Network Uncertainty
- Latency 1–100 ms between nodes; bandwidth 1–10 Gbps shared
- Packet loss 0.1–1% typical
- Example: 3-node write ⇒ 3× network cost
- Cannot assume instant communication

## Distributed System Overview
- Diagram: week2_lecture_slide13_system_overview.puml

## SQL in a Distributed World

## Joins Across Machines
- Table A on node 1 (100M rows), B on node 2 (50M rows)
- Join ⇒ must move data
- Transfer: 100M × 200 B ≈ 20 GB; at 1 Gbps ⇒ 160 s + compute

## Transactions at Scale
- ACID ⇒ all-or-nothing; 2PC used across nodes
- Coordinator blocks on any failure
- Example: 5 nodes, 1 fails ⇒ block until timeout (e.g. 30 s)
- Throughput can drop to near zero

## Cost Explosion
- Single node: 1 disk read per local op
- 3 nodes: 3 disk reads + network; network ~10× slower than disk
- Example: 1M queries/day; 1 ms vs 10 ms ⇒ 1,000 s vs 10,000 s

## Why NoSQL Exists

## Relaxed Guarantees
- No cross-partition transactions
- Eventual consistency allowed
- No joins; single-partition access
- Example: key-value get/put by key

## Simplified Access Patterns
- Key-based access only; predefined paths
- Example: user_id → profile
- Latency 1–5 ms (local); throughput ~100K ops/sec/node

## Predictable Scaling
- Add nodes; partition by key, e.g. hash(user_id)
- Example: 3 → 6 nodes ⇒ 2× throughput, 2× storage
- No cross-partition coordination for key-based ops

## Visual Comparison: SQL vs NoSQL

| Aspect | SQL | NoSQL |
|--------|-----|-------|
| Consistency | Strong (ACID) | Eventual (BASE) |
| Transactions | Cross-partition | Single-partition |
| Joins | Supported | Not supported |
| Schema | Fixed (schema-on-write) | Flexible (schema-on-read) |
| Scaling | Vertical (hard) | Horizontal (easier) |
| Latency | 10–100 ms (joins) | 1–5 ms (key lookup) |
| Use case | Complex queries | Simple lookups |

## Partitioning Intuition

## Horizontal Partitioning
- Split table by rows; each partition holds a subset
- Example: users → partition 1 (user_id 1–333K), 2 (334K–666K), 3 (667K–1M)

## Key-Based Distribution
- Hash(key) mod N ⇒ partition id; N = number of partitions
- Example: hash(user_id) mod 3 ⇒ user 123 → 0, 456 → 1, 789 → 2

## Replication Intuition

## Replicas
- Same partition copied to multiple nodes
- Example: 3 replicas per partition
- Write: update all replicas; read: any replica
- One replica down ⇒ two remain

## Read/Write Paths
- Write: primary first, then async to secondaries
- Read: any replica
- Example: 3 replicas; write latency ~50 ms (wait for 1), read ~5 ms (local)

## CAP Intuition (Engineering View)

## CAP Theorem
- Consistency: all nodes see same data
- Availability: every request gets a response
- Partition tolerance: system works despite network splits
- Can only guarantee two of three in practice

## Concrete Scenario: E-Commerce Cart
- User adds item; network partition splits two datacenters
- CP: block writes until heal ⇒ cart update fails (unavailable)
- AP: accept writes both sides ⇒ cart works, eventually consistent

## Trade-offs Explained
- CP: strong consistency, possible downtime
- AP: always available, possible stale reads
- CA: not realistic in distributed systems
- Bank ⇒ CP; social feed ⇒ AP

## Running Example — Data & Goal

## Scenario: Recommendation / Activity Log Service
- 10M users; 100M events/day (clicks, views, likes)
- Events: user_id, item_id, action, timestamp
- ~200 B/event ⇒ ~20 GB/day raw

## Engineering Objective
- Store events and support: “all events for user X” and “all events for item Y”
- Latency: p99 < 50 ms for key-based reads
- Throughput: 100M writes/day sustained

## Running Example — Step-by-Step (1/4)

## Step 1: Scale and Access Patterns
- 100M events/day ⇒ ~1,157 writes/sec avg; peak ~6K/sec
- Two access patterns: by user_id, by item_id
- Single-node: storage and throughput insufficient
- Need partitioning and clear access design

## Running Example — Step-by-Step (2/4)

## Step 2: SQL Design and Join Cost
- Tables: users, items, events (user_id, item_id, action, ts)
- “Events for user X” ⇒ filter events by user_id; optional join to items
- If users and events on different partitions ⇒ cross-partition read
- Transfer ~2 GB for 10M events ⇒ 16 s at 1 Gbps plus compute

## Query Execution Flow
- Diagram: week2_lecture_slide35_query_flow.puml

## Running Example — Step-by-Step (3/4)

## Step 3: NoSQL Design and Partitioning
- Partition by user_id: hash(user_id) mod N
- Store events co-located with user (e.g. document or wide-column)
- “Events for user X” ⇒ single-partition read ⇒ 1–5 ms
- “Events for item Y” ⇒ different access path; need second index or table partitioned by item_id
- Trade-off: denormalize or maintain two views

## Running Example — Step-by-Step (4/4)

## Output and Engineering Interpretation
- NoSQL key-based: ~5 ms for “events for user X”; SQL cross-partition: tens of seconds
- NoSQL avoids cross-partition joins for primary access pattern
- Trade-off: complex analytics (e.g. “top items globally”) harder in NoSQL; use SQL or analytics store
- Decision: use NoSQL for serving, batch/SQL for analytics

## Cost & Scaling Analysis (1/3)

## Time Model
- Single-node: T ∝ data size / disk bandwidth
- Distributed: T ∝ data size / bandwidth + network latency × stages
- Join: add shuffle time; shuffle often dominates
- Example: 1M queries, 1 ms vs 10 ms ⇒ 1,000 s vs 10,000 s

## Numeric Example: Nodes for Social Posts
- 100M users; 10 posts/user/day ⇒ 1B posts/day ⇒ ~11,574/sec avg
- Peak 5× ⇒ ~57,870 writes/sec
- Single node: ~10K writes/sec ⇒ need 6 nodes for writes
- Partition by user_id; 6 partitions ⇒ ~16.7M users each
- With RF 3: 18 nodes total (6 × 3); 3× storage, 2 node failures OK

## Cost & Scaling Analysis (2/3)

## Memory and Storage
- Per-node memory: limit working set, sorts, joins
- Storage: data size × replication factor
- Example: 100 GB × RF 3 ⇒ 300 GB total
- Growth: plan for 2× in 12–18 months

## Cost & Scaling Analysis (3/3)

## Network, Throughput, Latency
- Throughput: ops/sec ≈ min(disk, network, CPU) per node × nodes
- Latency: local read ~1–5 ms; cross-partition ~10–100 ms
- Write amplification: 1 write ⇒ RF copies over network
- Example: 1 KB write, RF 3 ⇒ 3 KB network traffic per write

## Pitfalls & Failure Modes (1/3)

## Common Pitfall: Hot Partitions
- Single key gets disproportionate load (e.g. celebrity user)
- One partition throttled; others idle
- Mitigation: salt keys, cache, or split heavy keys

## Pitfalls & Failure Modes (2/3)

## Failure Scenario: Network Partition (Split-Brain)
- Nodes A and B,C in separate partitions; A cannot reach B,C
- Writes accepted in both sides ⇒ divergent state
- Merge on heal: conflicts, last-writer-wins, or manual resolution

## Failure Propagation
- Diagram: week2_lecture_slide42_failure_partition.puml

## Pitfalls & Failure Modes (3/3)

## Detection and Mitigation
- Monitor: latency p99, error rates, replica lag
- Alerts: lag > threshold, partition events, node down
- Mitigation: quorum writes, failover, idempotent producers
- Run chaos or partition drills in non-prod

## Best Practices
- Design for failure: assume nodes and links fail
- Partition to avoid cross-partition joins for hot paths
- Choose replication factor from durability and read load
- Prefer single-partition ops for latency-sensitive APIs
- Use SQL/analytics store for complex ad-hoc queries
- Monitor latency, throughput, and replica lag
- Test failover and partition scenarios
- Document trade-offs (CAP, cost, complexity) for your use case

## Recap
- Single-node hits storage, throughput, and availability limits
- Distributed systems add network and partial failure
- SQL shines for joins and transactions; NoSQL for key-scale and flexibility
- Partitioning and replication enable scale; both have cost and failure modes
- CAP forces explicit trade-offs; design for your requirements

## Pointers to Practice
- Compute partition sizes and counts from data volume and key distribution
- Reason about replication factor and write amplification
- Compare SQL vs NoSQL for given access patterns and constraints
- Analyze CAP trade-offs in concrete scenarios
- Design partitioning schemes and justify choices
- Evaluate failure modes and mitigation strategies
