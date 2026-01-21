# Week 2: Distributed Databases — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Focus on distributed systems thinking
- Calculate partition sizes, replication costs
- Reason about trade-offs quantitatively
- Choose SQL vs NoSQL based on requirements

## Data Context (MANDATORY BEFORE QUESTIONS)

### Scenario: E-commerce Platform

**System Requirements:**
- 50 million registered users
- 500 million orders (10 orders/user average)
- 1 million products
- Peak load: 100,000 requests/second
- Average load: 10,000 requests/second

**Data Sizes:**
- User record: 500 bytes (user_id, email, profile, preferences)
- Order record: 300 bytes (order_id, user_id, items, total, timestamp)
- Product record: 1,000 bytes (product_id, name, description, price)

**Access Patterns:**
- 80% reads, 20% writes
- Most queries: get user profile, get user orders
- Complex queries: user orders by product category (rare, 5%)

## Warm-up Exercises

## Exercise 1
A single-node database stores 100 million user records.
Each record is 500 bytes.
**Questions:**
a) What is the total storage requirement in GB?
b) If the database can handle 5,000 writes/second maximum, how long to insert all 100M records?
c) If we need to support 50,000 writes/second, how many nodes are needed (assuming linear scaling)?

## Exercise 2
A distributed database uses 5 partitions.
Each partition handles 20 million users.
**Questions:**
a) If a query needs data from all 5 partitions, how many network round-trips are required?
b) Assuming 10ms latency per round-trip, what is the minimum query latency?
c) If each partition returns 4 MB of data, what is the total network transfer size?

## Exercise 3
A system uses replication factor of 3 (1 primary + 2 replicas).
**Questions:**
a) If original data size is 100 GB, what is total storage used?
b) If a write requires updating all 3 replicas, what is the write amplification factor?
c) If 1 replica fails, how many replicas remain operational?

## Engineering Exercises

## Exercise 4
Design a partitioning strategy for the e-commerce platform.

**Given:**
- 50M users, 500M orders
- User data: 25 GB total
- Order data: 150 GB total
- Target: 10 nodes, balanced load

**Tasks:**
a) Calculate data per node if partitioned by user_id (hash-based).
b) If each node can handle 10,000 ops/sec, is this sufficient for peak load?
c) Design partitioning: should orders be co-located with users? Why or why not?
d) Calculate network cost if orders are on separate nodes from users.

## Exercise 5
Analyze replication factor trade-offs.

**Scenario:**
- 3-node cluster, 100 GB data per node
- Network bandwidth: 1 Gbps between nodes
- Replication options: RF=2 or RF=3

**Tasks:**
a) Calculate total storage for RF=2 vs RF=3.
b) If a write is 1 KB, calculate network traffic for RF=2 vs RF=3.
c) How many node failures can RF=2 tolerate? RF=3?
d) If node failure probability is 1% per year, calculate expected data loss risk for RF=2.
e) Recommend RF=2 or RF=3 with reasoning.

## Exercise 6
Compare SQL vs NoSQL for a specific use case.

**Use Case: User Order History**
- Query: "Get all orders for user X, grouped by product category"
- Users: 50M, Orders: 500M
- Average: 10 orders per user
- Query frequency: 1M queries/day

**SQL Approach:**
- Join users and orders tables
- Filter by user_id, group by category
- Cross-partition join if data distributed

**NoSQL Approach:**
- Store orders embedded in user document
- Single partition lookup by user_id
- Application-level grouping

**Tasks:**
a) Calculate SQL query cost: assume 50M users across 10 partitions, 500M orders across 10 partitions. Cross-partition join transfers 5 GB.
b) Calculate NoSQL query cost: single partition read, 10 orders × 300 bytes = 3 KB per user.
c) Compare latency: SQL (network transfer + join) vs NoSQL (local read).
d) Which approach is better for this use case? Justify with numbers.

## Challenge Exercise

## Challenge: Distributed Database Architecture Design

You are designing a distributed database for a social media platform.

**Requirements:**
- 200 million users
- 2 billion posts (10 posts/user average)
- 20 billion likes (100 likes/post average)
- Peak: 500,000 writes/second, 2 million reads/second
- Availability: 99.9% (8.76 hours downtime/year max)
- Consistency: eventual consistency acceptable for likes

**Data Models:**
- User: user_id (key), profile (2 KB)
- Post: post_id (key), user_id, content (5 KB), timestamp
- Like: like_id (key), user_id, post_id, timestamp (100 bytes)

**Part 1: Storage and Partitioning**
a) Calculate total storage for users, posts, and likes (in GB).
b) Design partitioning strategy: how many partitions? Partition key?
c) Calculate data per partition assuming 10 partitions.
d) Should posts be co-located with users? Justify.

**Part 2: Replication Strategy**
a) Choose replication factor (RF=2 or RF=3). Justify.
b) Calculate total storage with replication.
c) Calculate write amplification (network traffic per write).
d) How many simultaneous node failures can the system tolerate?

**Part 3: SQL vs NoSQL Decision**
a) For user profile queries: SQL or NoSQL? Why?
b) For "get all posts by user X": SQL or NoSQL? Why?
c) For "get all likes for post Y": SQL or NoSQL? Why?
d) For "get trending posts (complex aggregation)": SQL or NoSQL? Why?

**Part 4: CAP Trade-off Analysis**
a) Network partition occurs: 2 datacenters split. Choose CP or AP.
b) For posts: what happens during partition? (CP vs AP behavior)
c) For likes: what happens during partition? (CP vs AP behavior)
d) Calculate availability impact: if CP chosen, estimate downtime.

**Part 5: Failure Scenario**
a) 3-node cluster, RF=3. Node 1 fails. What happens?
b) Can system continue operating? How many replicas remain?
c) New write arrives. Which nodes are updated?
d) Node 1 recovers after 1 hour. What must happen?
e) Calculate recovery time: 100 GB data, 1 Gbps network = ? seconds.

## Solutions

## Solution 1
**a) Total storage:**
```
100,000,000 records × 500 bytes = 50,000,000,000 bytes
= 50,000 MB = 50 GB
```

**b) Time to insert:**
```
100,000,000 records ÷ 5,000 writes/sec = 20,000 seconds
= 333.3 minutes = 5.56 hours
```

**c) Nodes needed:**
```
Required: 50,000 writes/sec
Per node: 5,000 writes/sec
Nodes: 50,000 ÷ 5,000 = 10 nodes
```

## Solution 2
**a) Network round-trips:**
```
5 partitions = 5 round-trips (one per partition)
```

**b) Minimum latency:**
```
5 round-trips × 10ms = 50ms minimum
(Plus processing time, so actual > 50ms)
```

**c) Total network transfer:**
```
5 partitions × 4 MB = 20 MB total
```

## Solution 3
**a) Total storage:**
```
100 GB × 3 replicas = 300 GB
```

**b) Write amplification:**
```
1 write → 3 replica updates = 3× amplification
```

**c) Remaining replicas:**
```
3 replicas - 1 failure = 2 replicas remain
System still operational (quorum: 2/3)
```

## Solution 4
**a) Data per node (user partitioning):**
```
Users: 25 GB ÷ 10 nodes = 2.5 GB per node
Orders: 150 GB ÷ 10 nodes = 15 GB per node
Total: 17.5 GB per node
```

**b) Sufficiency check:**
```
Peak load: 100,000 ops/sec
Per node: 100,000 ÷ 10 = 10,000 ops/sec per node
Node capacity: 10,000 ops/sec
Result: Exactly sufficient (no headroom)
Recommendation: Use 12-15 nodes for headroom
```

**c) Co-location decision:**
```
Option 1: Co-locate orders with users
- Pros: User+orders query = single partition (fast)
- Cons: Uneven distribution (users have different order counts)

Option 2: Separate partitions
- Pros: Even distribution, independent scaling
- Cons: Cross-partition queries (slow)

Recommendation: Co-locate if 80% queries are user+orders together
```

**d) Network cost (separate nodes):**
```
User query: 2.5 GB read from user partition
Order query: 15 GB read from order partition
Total: 17.5 GB transfer per full scan
At 1 Gbps: 17.5 GB × 8 = 140 Gb ÷ 1 Gbps = 140 seconds
```

## Solution 5
**a) Total storage:**
```
RF=2: 100 GB × 2 = 200 GB per node × 3 nodes = 600 GB total
RF=3: 100 GB × 3 = 300 GB per node × 3 nodes = 900 GB total
Difference: 300 GB (50% more storage for RF=3)
```

**b) Network traffic per write:**
```
RF=2: 1 write → 1 primary + 1 replica = 2× network (2 KB total)
RF=3: 1 write → 1 primary + 2 replicas = 3× network (3 KB total)
```

**c) Failure tolerance:**
```
RF=2: Can tolerate 1 node failure (1 replica remains)
RF=3: Can tolerate 2 node failures (1 replica remains)
```

**d) Data loss risk (RF=2):**
```
Probability 2 nodes fail simultaneously:
P(failure) = 1% per year per node
P(2 failures) = 0.01 × 0.01 = 0.0001 = 0.01% per year
Expected data loss: Very low but non-zero
```

**e) Recommendation:**
```
Choose RF=3 because:
- 50% more storage is acceptable (storage is cheap)
- Can tolerate 2 failures (better for 3-node cluster)
- Lower data loss risk (important for production)
- Read throughput: 3× (can read from any replica)
```

## Solution 6
**a) SQL query cost:**
```
Cross-partition join:
- Transfer: 5 GB (given)
- Network: 1 Gbps = 5 GB × 8 = 40 Gb ÷ 1 Gbps = 40 seconds
- Plus join computation: ~10 seconds
- Total latency: ~50 seconds
```

**b) NoSQL query cost:**
```
Single partition read:
- Data: 3 KB per user
- Latency: 5ms (local read, no network)
- Throughput: Can handle 10,000+ reads/sec per partition
```

**c) Latency comparison:**
```
SQL: 50 seconds (cross-partition join)
NoSQL: 5ms (single partition)
Difference: 10,000× faster for NoSQL
```

**d) Recommendation:**
```
Choose NoSQL because:
- 10,000× faster latency (5ms vs 50s)
- Simpler access pattern (key-based)
- Lower cost (no network transfer)
- Trade-off: Pre-compute or denormalize data
- SQL only if need ad-hoc queries across users
```

## Solution: Challenge Part 1
**a) Total storage:**
```
Users: 200M × 2 KB = 400 GB
Posts: 2B × 5 KB = 10,000 GB = 10 TB
Likes: 20B × 100 bytes = 2,000 GB = 2 TB
Total: 12.4 TB
```

**b) Partitioning strategy:**
```
10 partitions (given)
Partition key: user_id (hash-based)
Reason: Most queries are user-centric
```

**c) Data per partition:**
```
Users: 400 GB ÷ 10 = 40 GB per partition
Posts: 10 TB ÷ 10 = 1 TB per partition
Likes: 2 TB ÷ 10 = 200 GB per partition
Total: 1.24 TB per partition
```

**d) Co-location decision:**
```
Co-locate posts with users:
- 80% queries: "get user's posts" (single partition)
- Trade-off: Some users have more posts (skew)
- Solution: Use consistent hashing to balance
Recommendation: Yes, co-locate for performance
```

## Solution: Challenge Part 2
**a) Replication factor:**
```
Choose RF=3 because:
- 200M users: critical data (need high availability)
- 99.9% availability requirement
- Can tolerate 2 node failures
- Better read performance (3× read throughput)
```

**b) Total storage with replication:**
```
12.4 TB × 3 = 37.2 TB total
```

**c) Write amplification:**
```
1 write → 3 replicas
Network: 3× traffic per write
Example: 1 KB write → 3 KB network traffic
```

**d) Failure tolerance:**
```
RF=3: Can tolerate 2 simultaneous node failures
Remaining: 1 replica (still operational)
Quorum: 2/3 needed for writes, 1/3 for reads
```

## Solution: Challenge Part 3
**a) User profile queries:**
```
NoSQL (key-value)
- Simple: user_id → profile
- Single partition lookup
- Latency: 1-5ms
- SQL overkill for simple lookup
```

**b) Get all posts by user:**
```
NoSQL (document store)
- Co-locate posts with user
- Single partition read
- Latency: 5-10ms (depending on post count)
- SQL would require join (slower)
```

**c) Get all likes for post:**
```
NoSQL (key-value with post_id as key)
- Post-centric access pattern
- Single partition if posts partitioned by post_id
- Latency: 5-10ms
- SQL: cross-partition if users and posts separate
```

**d) Trending posts (complex aggregation):**
```
SQL (or specialized analytics DB)
- Requires aggregation across all posts
- Time-based filtering, sorting
- Complex queries need SQL
- Trade-off: Slower but more flexible
```

## Solution: Challenge Part 4
**a) CAP choice:**
```
Choose AP (Availability + Partition tolerance)
- Social media: availability > consistency
- Users can tolerate stale data
- Better user experience (always works)
```

**b) Posts during partition (AP):**
```
- Both datacenters accept writes
- Users can post in either datacenter
- Eventually consistent: merge on partition heal
- No blocking: system remains available
```

**c) Likes during partition (AP):**
```
- Likes accepted in both datacenters
- Same post may have different like counts
- Merge on partition heal (eventual consistency)
- Acceptable: likes are not critical data
```

**d) Availability impact:**
```
AP choice: No downtime during partition
CP choice: Would block writes = downtime
Estimated downtime (CP): 1-10 minutes per partition event
With AP: 0 minutes (always available)
```

## Solution: Challenge Part 5
**a) Node 1 fails:**
```
- RF=3: 2 replicas remain (on Node 2 and Node 3)
- System continues operating
- Reads: can use Node 2 or Node 3
- Writes: need 2/3 quorum (Node 2 + Node 3)
```

**b) Operational status:**
```
Yes, system continues
- 2 replicas remain (sufficient for quorum)
- Can handle reads and writes
- Degraded performance (2 nodes instead of 3)
```

**c) New write:**
```
- Write goes to Node 2 (primary) or Node 3
- Replicates to remaining node
- Cannot replicate to Node 1 (failed)
- Write succeeds (2/3 quorum met)
```

**d) Node 1 recovery:**
```
- Node 1 must catch up with missed writes
- Replicate data from Node 2 or Node 3
- Replay write log or full data copy
- Time depends on data size and network
```

**e) Recovery time:**
```
100 GB data ÷ 1 Gbps network
= 100 GB × 8 = 800 Gb ÷ 1 Gbps
= 800 seconds = 13.3 minutes
Plus processing time: ~15-20 minutes total
```
