# Week 2: Distributed Databases: SQL vs NoSQL — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Focus on distributed systems and SQL vs NoSQL trade-offs
- Calculate partition sizes, replication costs, and latencies
- Justify choices with numeric assumptions and access patterns

## Data Context (MANDATORY)

### Scenario: E-Commerce Platform

**Tables and schema:**
- **users**: `user_id` (PK), `email`, `region`, `profile` (JSON). ~500 B/row.
- **orders**: `order_id` (PK), `user_id` (FK), `product_id`, `quantity`, `unit_price`, `order_date`. ~300 B/row.
- **products**: `product_id` (PK), `name`, `category`, `price`. ~1 KB/row.

**Approximate scale:**
- users: 50M rows ⇒ ~25 GB
- orders: 500M rows ⇒ ~150 GB
- products: 1M rows ⇒ ~1 GB

**Keys and partitions:**
- Partition key: `user_id` for users and orders (co-location by user).
- Products: replicated or partitioned by `product_id`.

**Access patterns:**
- 80% reads, 20% writes.
- Frequent: get user profile; get orders for user X.
- Rare: orders by product category (≈5%).

## Reference Exercises Used (Root)
- exercises1.md: SQL vs NoSQL decision (social vs financial); join and aggregation structure; idempotency.
- exercises2.md: Architectural decision matrix (e-commerce, financial, session); Cassandra partition sizing; DynamoDB hot partition / write sharding; cost and partition reasoning.

## Warm-up Exercises

## Exercise 1
A single-node DB stores 100M user records, 500 B each.
a) Total storage in GB?
b) Max 5,000 writes/sec. Time to insert all 100M records?
c) To support 50,000 writes/sec, how many nodes (linear scaling)?

## Exercise 2
A distributed DB has 5 partitions, 20M users each.
a) Query needs all 5 partitions. How many round-trips?
b) 10 ms per round-trip. Minimum query latency?
c) Each partition returns 4 MB. Total network transfer?

## Exercise 3
Replication factor 3 (1 primary + 2 replicas).
a) Data size 100 GB. Total storage?
b) Write updates all 3. Write amplification factor?
c) One replica fails. How many remain?

## Exercise 4
Define *partition key* and *replication factor* in one sentence each. Why does co-locating orders with users reduce latency for “orders for user X”?

## Exercise 5
Give one access pattern where SQL is a better fit than NoSQL, and one where NoSQL is better. One sentence each.

## Engineering Exercises

## Exercise 6
Partitioning for the e-commerce platform:
- 50M users, 500M orders; users 25 GB, orders 150 GB.
- Target: 10 nodes, balanced load.

a) Data per node if partitioned by `user_id` (hash).
b) Each node: 10,000 ops/sec. Sufficient for 100K peak?
c) Should orders be co-located with users? Why or why not?
d) If users and orders on separate node groups, estimate network transfer for a full user+orders scan (back-of-envelope).

## Exercise 7
Replication trade-offs:
- 3-node cluster, 100 GB per node.
- Network 1 Gbps between nodes.
- RF = 2 vs RF = 3.

a) Total storage for RF=2 vs RF=3.
b) Write size 1 KB. Network traffic per write for RF=2 vs RF=3.
c) How many node failures can RF=2 tolerate? RF=3?
d) Node failure ~1%/year. Roughly, P(two nodes fail in same year) for RF=2? One sentence on risk.
e) Recommend RF=2 or RF=3 with brief justification.

## Exercise 8
**Use case: “All orders for user X, grouped by product category.”**
- 50M users, 500M orders, ~10 orders/user.
- 1M such queries per day.

**SQL:** Join users, orders, products; filter by `user_id`; group by category. Cross-partition join transfers 5 GB total per full run.

**NoSQL:** User+orders co-located; single-partition read. ~10 orders × 300 B = 3 KB per user.

a) SQL: approximate latency (network + compute) if 5 GB at 1 Gbps.
b) NoSQL: approximate latency per query (single-partition read).
c) Compare and conclude: which fits this use case better? Short justification with numbers.

## Exercise 9
**CAP:** Network partition splits two datacenters. For a *shopping cart*:
a) What does CP imply? What does AP imply?
b) Which would you choose for a cart? One paragraph justification.

## Challenge Exercise

## Challenge: Distributed DB Architecture for a Social Platform

**Requirements:**
- 200M users, 2B posts (10/user), 20B likes (100/post).
- Peak: 500K writes/sec, 2M reads/sec.
- Availability: 99.9% (max ~8.76 h downtime/year).
- Likes: eventual consistency acceptable.

**Models:**
- User: `user_id` (key), profile ~2 KB.
- Post: `post_id` (key), `user_id`, content ~5 KB, timestamp.
- Like: `like_id` (key), `user_id`, `post_id`, timestamp ~100 B.

**Part 1 — Storage and partitioning**
a) Total storage for users, posts, likes (GB).
b) Propose partition key and number of partitions. Brief justification.
c) Data per partition if 10 partitions.
d) Should posts be co-located with users? Justify.

**Part 2 — Replication**
a) Choose RF=2 or RF=3. Justify.
b) Total storage with replication.
c) Write amplification (network traffic per write).
d) How many simultaneous node failures can the system tolerate?
e) Node fails; 100 GB must be copied over 1 Gbps to recover. Estimate recovery time (seconds).

**Part 3 — SQL vs NoSQL**
a) User profile lookup: SQL or NoSQL? Why?
b) “All posts by user X”: SQL or NoSQL? Why?
c) “All likes for post Y”: SQL or NoSQL? Why?
d) “Trending posts” (heavy aggregation): SQL or NoSQL? Why?

**Part 4 — CAP**
a) Partition between two datacenters. Choose CP or AP for this product. Why?
b) What happens to writes during the partition under CP? Under AP?
c) One-sentence impact on availability.

**Part 5 — Diagram**
- Sketch or reuse an architecture diagram that shows access patterns (user profile, posts by user, likes by post, trending) and whether each is served by SQL, NoSQL, or both.
- Diagram: week2_practice_slide18_architecture.puml

## Solutions

## Solution 1
**a)** 100M × 500 B = 50 GB.  
**b)** 100M ÷ 5,000/s = 20,000 s ≈ 5.56 h.  
**c)** 50,000 ÷ 5,000 = 10 nodes.

## Solution 2
**a)** 5 round-trips (one per partition).  
**b)** 5 × 10 ms = 50 ms minimum (excluding compute).  
**c)** 5 × 4 MB = 20 MB.

## Solution 3
**a)** 100 GB × 3 = 300 GB.  
**b)** 1 write → 3 updates ⇒ 3× amplification.  
**c)** 2 replicas remain; quorum 2/3 still met.

## Solution 4
- **Partition key:** Attribute(s) used to assign each row to a partition (e.g. `hash(user_id) mod N`).  
- **Replication factor:** Number of copies of each partition across nodes.  
- Co-locating orders with users puts both on the same partition ⇒ “orders for user X” is a single-partition read ⇒ no cross-partition transfer, lower latency.

## Solution 5
- **SQL better:** Complex analytical queries (e.g. “revenue by region and category”) with joins and aggregations; strong consistency and transactions (e.g. payments).  
- **NoSQL better:** Simple key-based lookups (e.g. user profile by `user_id`), very high write throughput with flexible schema, or graph-like traversal.

## Solution 6
**a)** Users: 25/10 = 2.5 GB/node. Orders: 150/10 = 15 GB/node. Total ~17.5 GB/node.  
**b)** 100K ÷ 10 = 10K ops/sec per node ⇒ exactly at capacity; no headroom. Prefer 12–15 nodes.  
**c)** Co-locate if “orders for user X” is dominant: single-partition read, lower latency. Separate if uniform distribution and independent scaling matter more; then expect cross-partition joins.  
**d)** User scan ~25 GB + orders ~150 GB ⇒ 175 GB. At 1 Gbps: 175 × 8 Gb ÷ 1 Gbps ≈ 1,400 s (order-of-magnitude).

## Solution 7
**a)** RF=2: 100 GB × 2 × 3 = 600 GB. RF=3: 100 GB × 3 × 3 = 900 GB.  
**b)** RF=2: 2 KB per write. RF=3: 3 KB per write.  
**c)** RF=2: 1 failure. RF=3: 2 failures.  
**d)** P(two failures) ≈ 0.01 × 0.01 = 0.0001 per year (very rough; assumes independence). Low but non-zero data loss risk with RF=2.  
**e)** Prefer RF=3: extra storage usually acceptable; tolerates 2 failures, better read capacity, lower loss risk.

## Solution 8
**a)** 5 GB × 8 = 40 Gb; 40 Gb ÷ 1 Gbps = 40 s (+ join time) ⇒ tens of seconds per full cross-partition run.  
**b)** Single-partition read ~1–5 ms; 3 KB is small.  
**c)** NoSQL much lower latency for this key-based, user-scoped pattern. Prefer NoSQL for serving; use SQL/analytics for heavy aggregations.

## Solution 9
**a)** CP: preserve consistency; may reject or block writes during partition ⇒ lower availability. AP: keep accepting writes; both sides can diverge ⇒ eventual consistency.  
**b)** For a cart, AP is often chosen: better to add items (even if briefly inconsistent) than to fail. Strong consistency matters more for checkout/payment.

## Solution: Challenge Part 1
**a)** Users: 200M × 2 KB = 400 GB. Posts: 2B × 5 KB = 10 TB. Likes: 20B × 100 B = 2 TB. Total ~12.4 TB.  
**b)** Partition by `user_id`; 10 partitions (match scale and ops). User-centric queries dominate.  
**c)** Users: 40 GB; Posts: 1 TB; Likes: 200 GB per partition ⇒ ~1.24 TB per partition.  
**d)** Co-locate posts with users: “posts by user X” is then single-partition; avoids cross-partition reads.

## Solution: Challenge Part 2
**a)** RF=3: 99.9% availability, tolerate 2 failures, better read capacity.  
**b)** 12.4 TB × 3 ≈ 37.2 TB.  
**c)** 3× network traffic per write.  
**d)** 2 simultaneous node failures.  
**e)** 100 GB × 8 = 800 Gb; 800 Gb ÷ 1 Gbps = 800 s ≈ 13.3 min (plus processing).

## Solution: Challenge Part 3
**a)** NoSQL (key-value): simple `user_id` → profile; single-partition lookup.  
**b)** NoSQL (document/wide-column): posts co-located with user; single-partition read.  
**c)** NoSQL keyed by `post_id`: “likes for post Y” single-partition if partitioned by `post_id`.  
**d)** SQL or dedicated analytics store: heavy aggregation over large sets; complex filters and sort.

## Solution: Challenge Part 4
**a)** AP: availability and partition tolerance prioritized; eventual consistency acceptable for likes/social.  
**b)** CP: block or reject writes in minority partition. AP: accept writes in both; merge later.  
**c)** CP can cause downtime during partition; AP avoids it but may serve stale data.

## Solution: Challenge Part 5
- Use the architecture diagram (week2_practice_slide18_architecture.puml) to map access patterns (user profile, posts by user, likes by post, trending) to SQL vs NoSQL and to justify co-location and partitioning choices.
