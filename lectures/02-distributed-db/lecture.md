# Week 2: Distributed Databases — SQL, NoSQL & CAP

## Purpose
- Why databases must be distributed
- Why distribution changes everything

## Learning Objectives
- Calculate single-node database limits
- Explain why SQL semantics break at scale
- Compare SQL vs NoSQL trade-offs quantitatively
- Design partitioning strategies with calculations
- Reason about replication factor trade-offs
- Analyze CAP trade-offs in concrete scenarios
- Identify failure modes in distributed systems

## Sources Used (Reference Only)
- sources/Lecture 2.pptx
- sources/Lecture 2.pdf

## Coverage Checklist (Legacy)
- [x] Distributed DB motivation
- [x] SQL scalability limits
- [x] NoSQL motivation
- [x] Consistency trade-offs
- [x] Partitioning concepts
- [x] Replication concepts
- [x] CAP theorem intuition

## Why Single-Node Databases Break

## Storage Limits
- Single machine: max ~100 TB disk
- Example: 1B users × 1 KB = 1 TB
- Growth: 10% monthly = 100 GB/month
- Time to fill: ~8 years
- Reality: need 10× headroom = 10 TB limit

## Throughput Limits
- Single machine: ~10K writes/sec
- Example: 100M users, 1 write/user/day
- Required: 1,157 writes/sec average
- Peak: 5× average = 5,785 writes/sec
- Single node: insufficient headroom

## Availability Limits
- Single machine: 99.9% uptime
- Downtime: 8.76 hours/year
- Example: e-commerce loses $10K/hour
- Annual loss: $87,600
- Distributed: 99.99% = $8,760 loss

## What "Distributed" Really Means

## Multiple Machines
- Data split across nodes
- Each node: independent storage
- Each node: independent compute
- Coordination: network required
- Example: 3 nodes, 33% data each

## Partial Failures
- Node 1 fails: others continue
- Network partition: split-brain risk
- Replica lag: stale reads possible
- No single point of failure
- Trade-off: complexity increases

## Network Uncertainty
- Latency: 1-100ms between nodes
- Bandwidth: 1-10 Gbps shared
- Packet loss: 0.1-1% typical
- Example: 3-node write = 3× network cost
- Cannot assume instant communication

## SQL in a Distributed World

## Joins Across Machines
- Table A: Node 1 (100M rows)
- Table B: Node 2 (50M rows)
- Join: must transfer data
- Transfer: 100M × 200 bytes = 20 GB
- Network: 1 Gbps = 160 seconds
- Cost: 160s + compute time

## Transactions at Scale
- ACID: all-or-nothing guarantee
- 2PC: two-phase commit protocol
- Coordinator: blocks on failures
- Example: 5 nodes, 1 fails
- Block time: until timeout (30s)
- Throughput: drops to near zero

## Cost Explosion
- Single node: 1 disk read
- 3 nodes: 3 disk reads + network
- Network: 10× slower than disk
- Example: 1M queries/day
- Single: 1M × 1ms = 1,000 seconds
- Distributed: 1M × 10ms = 10,000 seconds

## Why NoSQL Exists

## Relaxed Guarantees
- No cross-partition transactions
- Eventual consistency allowed
- No complex joins
- Example: key-value store
- Read: single partition lookup
- Write: single partition update

## Simplified Access Patterns
- Key-based access only
- No ad-hoc queries
- Predefined access paths
- Example: user_id → profile
- Latency: 1-5ms (local)
- Throughput: 100K ops/sec/node

## Predictable Scaling
- Linear scaling: add nodes
- Partition by key: hash(user_id)
- Example: 3 nodes → 6 nodes
- Throughput: 2× increase
- Storage: 2× increase
- No coordination overhead

## Visual Comparison: SQL vs NoSQL

| Aspect | SQL | NoSQL |
|--------|-----|-------|
| **Consistency** | Strong (ACID) | Eventual (BASE) |
| **Transactions** | Cross-partition | Single-partition |
| **Joins** | Supported | Not supported |
| **Schema** | Fixed (schema-on-write) | Flexible (schema-on-read) |
| **Scaling** | Vertical (hard) | Horizontal (easy) |
| **Latency** | 10-100ms (joins) | 1-5ms (key lookup) |
| **Throughput** | 1K-10K ops/sec | 10K-100K ops/sec |
| **Use Case** | Complex queries | Simple lookups |

## Partitioning Intuition

## Horizontal Partitioning
- Split table by rows
- Each partition: subset of rows
- Example: users table
- Partition 1: user_id 1-333K
- Partition 2: user_id 334K-666K
- Partition 3: user_id 667K-1M

## Key-Based Distribution
- Hash function: hash(key) mod N
- N = number of partitions
- Example: hash(user_id) mod 3
- User 123 → partition 0
- User 456 → partition 1
- User 789 → partition 2

## Partitioning Diagram
```
Users Table (1M rows)
    ↓
Hash(user_id) mod 3
    ↓
┌─────────┬─────────┬─────────┐
│Partition│Partition│Partition│
│   0     │   1     │   2     │
│333K rows│333K rows│334K rows│
└─────────┴─────────┴─────────┘
```

## Replication Intuition

## Replicas
- Copy data to multiple nodes
- Example: 3 replicas per partition
- Write: update all 3 replicas
- Read: can read from any replica
- Failure: 1 replica down, 2 remain

## Read/Write Paths
- Write: primary replica first
- Then: async to 2 secondaries
- Read: any replica (fast)
- Example: 3 replicas
- Write latency: 50ms (wait for 1)
- Read latency: 5ms (local replica)

## Replication Diagram
```
Write Request
    ↓
Primary Replica (Node 1)
    ↓
Async Replication
    ↓
┌──────────┬──────────┐
│Secondary │Secondary │
│(Node 2)  │(Node 3)  │
└──────────┴──────────┘
```

## CAP Intuition (Engineering View)

## CAP Theorem
- Consistency: all nodes see same data
- Availability: system responds always
- Partition tolerance: survives network splits
- Theorem: can only guarantee 2 of 3

## Concrete Scenario: E-commerce Cart
- User adds item to cart
- Network partition: 2 datacenters split
- Choice 1: CP (Consistency + Partition)
- Block writes until partition heals
- User: cart update fails (unavailable)
- Choice 2: AP (Availability + Partition)
- Accept writes on both sides
- User: cart works (eventually consistent)

## Trade-offs Explained
- CP: strong consistency, downtime
- AP: always available, stale reads
- CA: not possible in distributed systems
- Real systems: choose based on use case
- Example: bank = CP, social feed = AP

## Failure Scenarios

## Network Partition
- 3 nodes: A, B, C
- Partition: A isolated, B+C connected
- Write to A: cannot replicate
- Write to B: replicates to C only
- Split-brain: A has different data
- Resolution: wait for partition to heal

## Replica Lag
- Write: primary + 2 secondaries
- Primary: updated immediately
- Secondary 1: 10ms lag
- Secondary 2: 50ms lag (slow network)
- Read from Secondary 2: stale data
- Example: read shows old balance

## Node Failure
- 3 replicas: Node 1, 2, 3
- Node 1 fails: 2 replicas remain
- System: still operational
- New replica: promoted from Node 2
- Recovery: rebuild Node 1 from Node 2
- Time: 1-10 hours (depends on data size)

## Numeric Example: Scalability Calculation

## Scenario: Social Media Posts
- 100M users, 10 posts/user/day
- Total: 1B posts/day = 11,574 posts/sec
- Average: 11,574/sec
- Peak: 5× = 57,870 posts/sec
- Single node: max 10K writes/sec
- Required nodes: 57,870 / 10,000 = 6 nodes

## Partitioning Strategy
- 6 partitions: hash(user_id) mod 6
- Each partition: 16.7M users
- Posts per partition: 1.93M posts/day
- Writes per partition: 22,361 posts/sec
- Each node: handles 1 partition
- Throughput: 22,361 < 10,000? No, need 3 nodes/partition

## Replication Factor Trade-off
- Replication factor: 3 (1 primary + 2 replicas)
- Storage: 3× original size
- Write cost: 3× network traffic
- Read throughput: 3× (read from any)
- Failure tolerance: 2 nodes can fail
- Trade-off: 3× storage for 2× fault tolerance

## SQL vs NoSQL: Quantitative Trade-off

## Scenario: User Profile + Orders Join
- Users: 10M rows, 200 bytes/row = 2 GB
- Orders: 100M rows, 150 bytes/row = 15 GB
- Join: user_id matching
- SQL: cross-partition join required
- Transfer: 2 GB + 15 GB = 17 GB
- Network: 1 Gbps = 136 seconds
- NoSQL: pre-join in application
- Read user: 1 partition, 5ms
- Read orders: 1 partition, 5ms
- Total: 10ms (no network transfer)

## Best Practices (Week 2)

## Distributed Design Mindset
- Design for failure: assume nodes fail
- Partition carefully: avoid cross-partition ops
- Replicate strategically: balance cost vs safety
- Monitor latency: network is slow
- Choose consistency model: match use case
- Test partition scenarios: verify behavior

## Recap
- Single-node databases hit hard limits
- Distribution introduces network uncertainty
- SQL semantics become expensive at scale
- NoSQL trades guarantees for performance
- Partitioning enables horizontal scaling
- Replication provides fault tolerance
- CAP theorem: fundamental trade-off
- Failure is normal: design for it

## Pointers to Practice
- Calculate partition sizes and counts
- Reason about replication factor choices
- Compare SQL vs NoSQL for use cases
- Analyze CAP trade-offs in scenarios
- Design partitioning strategies
- Evaluate failure mode impacts
- Calculate latency and throughput
