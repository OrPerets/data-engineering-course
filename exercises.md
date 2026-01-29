# Practice 1

# Week 1: Introduction to Data Engineering — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Focus on data engineering thinking
- Calculate costs, latencies, storage requirements
- Design pipelines with trade-offs
- Identify failure modes and solutions

## Data Context (MANDATORY)

### Scenario: Social Media Analytics Platform

**System Requirements:**
- 100 million registered users
- 500 million posts (5 posts/user average)
- 10 billion interactions (likes, comments, shares)
- Peak load: 50,000 posts/minute, 500,000 interactions/minute
- Average load: 10,000 posts/minute, 100,000 interactions/minute

**Data Sources:**

**Posts Table:**
- Columns: post_id (8 bytes), user_id (8 bytes), content (2 KB text), timestamp (8 bytes), category (20 bytes)
- Total row size: ~2.1 KB
- 500M rows total
- Partition key: user_id
- Access pattern: get posts by user_id (80%), get posts by category (20%)

**Interactions Table:**
- Columns: interaction_id (8 bytes), post_id (8 bytes), user_id (8 bytes), type (1 byte: like/comment/share), timestamp (8 bytes)
- Total row size: ~33 bytes
- 10B rows total
- Partition key: post_id
- Access pattern: get interactions by post_id (90%), get interactions by user_id (10%)

**Users Table:**
- Columns: user_id (8 bytes), username (50 bytes), email (100 bytes), profile (1 KB JSON), created_at (8 bytes)
- Total row size: ~1.2 KB
- 100M rows total
- Partition key: user_id
- Access pattern: get user by user_id (100%)

**Storage Details:**
- Raw data: uncompressed JSON files
- Processed data: Parquet format (5× compression)
- Retention: 90 days raw, 365 days processed
- Replication: 3× for availability

**Pipeline Requirements:**
- Process posts and interactions hourly
- Calculate: daily post counts per category, daily interaction counts per post
- Output: analytics-ready tables for dashboards
- Latency: data available within 2 hours of event time

## Warm-up Exercises

## Exercise 1
Calculate storage requirements for the social media platform.

**Questions:**
a) What is the total raw storage size for posts, interactions, and users (in GB)?
b) If data is stored in Parquet format (5× compression), what is the compressed size?
c) With 90-day retention for raw data, what is the total raw storage needed?
d) With 3× replication, what is the total storage including replicas?

## Exercise 2
A data pipeline processes 1 million events per hour.

**Questions:**
a) If each event is 1 KB, what is the hourly data volume in GB?
b) If processing takes 30 minutes, what is the throughput in MB/s?
c) If the pipeline runs daily for 30 days, what is the total monthly volume?
d) If storage costs $0.023/GB/month, what is the monthly storage cost?

## Exercise 3
A batch pipeline runs every hour.

**Questions:**
a) If processing takes 45 minutes, what is the maximum data latency?
b) If a failure occurs at minute 30, how long until the next successful run?
c) If the pipeline must complete within 1 hour, what is the maximum processing time?
d) If processing time increases 2× due to data growth, what happens to latency?

## Engineering Exercises

## Exercise 4
Design a data pipeline for the social media platform.

**Given:**
- Source: posts and interactions tables (updated continuously)
- Target: daily aggregated analytics tables
- Frequency: hourly batch processing
- Latency requirement: 2 hours maximum

**Tasks:**
a) Design pipeline steps: ingestion, transformation, aggregation, load.
b) Calculate intermediate data sizes: raw → filtered → aggregated.
c) Estimate processing time: assume 100 MB/s processing speed.
d) Identify potential bottlenecks and suggest optimizations.
e) Calculate total pipeline cost: compute + storage + network.

## Exercise 5
Analyze batch vs streaming trade-offs.

**Scenario:**
- Posts: 10,000/minute average, 50,000/minute peak
- Analytics need: "trending posts in last 5 minutes"

**Batch Approach:**
- Process every 5 minutes
- Latency: 5-10 minutes
- Cost: $0.10 per batch run

**Streaming Approach:**
- Process continuously
- Latency: < 1 second
- Cost: $2.00 per hour (always running)

**Tasks:**
a) Calculate daily cost for batch (288 runs/day) vs streaming (24 hours).
b) If business requires < 1 minute latency, which approach is required?
c) If cost is the primary concern, which approach is better?
d) Design a hybrid approach: streaming for recent, batch for history.

## Exercise 6
Calculate pipeline failure impact and recovery.

**Scenario:**
- Pipeline processes 1 hour of data (10,000 posts, 100,000 interactions)
- Failure occurs: 30 minutes into processing
- 50% of data processed, 50% lost
- Recovery: manual investigation + rerun = 2 hours

**Tasks:**
a) Calculate data loss: how many posts/interactions not processed?
b) Calculate time to recovery: failure time + investigation + rerun.
c) If pipeline runs hourly, how many subsequent runs are delayed?
d) Design checkpoint strategy: save state every 10 minutes.
e) With checkpoints, calculate recovery time and data loss.

## Exercise 7
Estimate network and compute costs.

**Given:**
- Ingest: 5 GB/hour from source databases
- Process: 5 GB/hour (local, no network)
- Output: 100 MB/hour to data warehouse
- Network: $0.09/GB egress, $0.00/GB ingress
- Compute: $0.10 per hour for processing

**Tasks:**
a) Calculate daily network cost (ingress + egress).
b) Calculate daily compute cost (24 hours).
c) Calculate monthly total cost (30 days).
d) If data volume increases 5×, calculate new costs.
e) If processing time is 30 minutes (not 1 hour), calculate compute savings.

## Challenge Exercise

## Challenge: End-to-End Pipeline Design

You are designing a complete data engineering pipeline for a news aggregation platform.

**Requirements:**
- 50 million articles (from 1,000 sources)
- 200 million user clicks (4 clicks/user average)
- Real-time requirement: trending articles updated every 5 minutes
- Batch requirement: daily analytics reports
- Availability: 99.9% (8.76 hours downtime/year max)

**Data Models:**

**Articles:**
- article_id, source_id, title (200 bytes), content (10 KB), category (50 bytes), published_at
- Row size: ~10.3 KB
- 50M articles total
- Growth: 10,000 articles/day

**Clicks:**
- click_id, article_id, user_id, timestamp, device_type (20 bytes)
- Row size: ~44 bytes
- 200M clicks total
- Growth: 500,000 clicks/day

**Sources:**
- source_id, name (100 bytes), domain (50 bytes), category (50 bytes)
- Row size: ~208 bytes
- 1,000 sources total
- Static (rarely changes)

**Part 1: Storage Architecture**
a) Calculate total raw storage for articles, clicks, sources (in GB).
b) Design partitioning strategy: how to partition articles? clicks?
c) Calculate storage with 90-day retention and 3× replication.
d) Estimate monthly storage cost at $0.023/GB/month.

**Part 2: Pipeline Design**
a) Design batch pipeline: daily aggregation of clicks per article.
  - Calculate input size, output size, processing time.
  - Estimate cost: compute + storage + network.
b) Design streaming pipeline: trending articles every 5 minutes.
  - Calculate throughput: articles/minute, clicks/minute.
  - Estimate cost: compute (always running).
c) Compare batch vs streaming costs for trending use case.
d) Recommend hybrid approach with justification.

**Part 3: Failure Analysis**
a) Identify 3 critical failure modes in your pipeline design.
b) For each failure, calculate:
  - Probability of occurrence
  - Data loss impact
  - Recovery time
  - Business impact (downtime cost)
c) Design mitigation strategies for each failure mode.
d) Calculate additional cost for failure mitigation (redundancy, monitoring).

**Part 4: Scaling Analysis**
a) If article volume grows 10× (100,000/day), recalculate:
  - Storage requirements
  - Processing time
  - Costs
b) If click volume grows 10× (5M/day), recalculate:
  - Network transfer size
  - Aggregation time
  - Costs
c) Design scaling strategy: when to add more compute nodes?
d) Calculate break-even point: batch processing vs distributed processing.

**Part 5: Architecture Diagram**
- Create diagram showing: sources → ingestion → storage → processing → consumption
- Include: batch pipeline, streaming pipeline, data flows
- Label: data volumes, latencies, costs
- Diagram: week1_practice_slide15_architecture.puml

## Solutions

## Solution 1

**a) Total raw storage:**
```
Posts: 500M rows × 2.1 KB = 1,050,000 MB = 1,050 GB
Interactions: 10B rows × 33 bytes = 330,000 MB = 330 GB
Users: 100M rows × 1.2 KB = 120,000 MB = 120 GB
Total: 1,050 + 330 + 120 = 1,500 GB = 1.5 TB
```

**b) Compressed size (Parquet, 5×):**
```
Posts: 1,050 GB / 5 = 210 GB
Interactions: 330 GB / 5 = 66 GB
Users: 120 GB / 5 = 24 GB
Total: 210 + 66 + 24 = 300 GB
```

**c) 90-day retention raw:**
```
Daily growth: posts (10M/day × 2.1 KB) + interactions (200M/day × 33 bytes)
Posts daily: 21 GB/day
Interactions daily: 6.6 GB/day
Total daily: 27.6 GB/day
90 days: 27.6 GB × 90 = 2,484 GB = 2.5 TB
```

**d) With 3× replication:**
```
Raw: 2.5 TB × 3 = 7.5 TB
Processed: 300 GB × 3 = 900 GB
Total: 8.4 TB
```

## Solution 2

**a) Hourly volume:**
```
1M events × 1 KB = 1,000 MB = 1 GB/hour
```

**b) Throughput:**
```
1 GB in 30 minutes = 1 GB / 1800s = 0.56 MB/s
```

**c) Monthly volume:**
```
1 GB/hour × 24 hours × 30 days = 720 GB/month
```

**d) Storage cost:**
```
720 GB × $0.023/GB = $16.56/month
```

## Solution 3

**a) Maximum latency:**
```
Processing: 45 minutes
Next run starts: 1 hour after previous
Maximum: 45 min (processing) + 60 min (wait) = 105 minutes
```

**b) Time to next success:**
```
Failure at 30 min
Current run: fails (no output)
Next run: starts in 30 min, takes 45 min
Total: 30 + 45 = 75 minutes
```

**c) Maximum processing time:**
```
Must complete within 1 hour window
Buffer for failures: 10 minutes
Maximum: 50 minutes processing time
```

**d) Latency impact:**
```
Processing: 45 min → 90 min
If window is 1 hour: pipeline cannot complete
Solution: increase parallelism or reduce data volume
```

## Solution 4

**a) Pipeline steps:**
```
1. Ingestion: Read posts and interactions from source
2. Transformation: Filter valid records, extract fields
3. Aggregation: Group by (date, category) for posts, (date, post_id) for interactions
4. Load: Write aggregated results to analytics tables
```

**b) Intermediate sizes:**
```
Raw posts: 500M × 2.1 KB = 1,050 GB
After filter (95% valid): 1,050 GB × 0.95 = 997.5 GB
After aggregation: 50K rows/day × 100 bytes = 5 MB/day

Raw interactions: 10B × 33 bytes = 330 GB
After filter (98% valid): 330 GB × 0.98 = 323.4 GB
After aggregation: 500K rows/day × 50 bytes = 25 MB/day
```

**c) Processing time:**
```
Posts: 997.5 GB / 100 MB/s = 9,975 seconds = 166 minutes
Interactions: 323.4 GB / 100 MB/s = 3,234 seconds = 54 minutes
Total: 220 minutes = 3.7 hours
Bottleneck: posts processing
```

**d) Optimizations:**
```
- Partition processing by date (parallel)
- Use columnar format (Parquet) for faster reads
- Pre-filter invalid records during ingestion
- Incremental processing: only new data
```

**e) Total cost:**
```
Compute: 3.7 hours × $0.10/hour = $0.37 per run
Daily: $0.37 × 24 = $8.88/day
Storage: 30 MB/day × 365 days × $0.023/GB = $0.25/year
Network: 100 MB/day egress × $0.09/GB = $0.009/day
Monthly: ($8.88 + $0.009) × 30 = $266.67/month
```

## Solution 5

**a) Daily costs:**
```
Batch: 288 runs × $0.10 = $28.80/day
Streaming: 24 hours × $2.00 = $48.00/day
Difference: $19.20/day more for streaming
```

**b) Latency requirement:**
```
Batch: 5-10 minutes latency
Requirement: < 1 minute
Conclusion: Batch insufficient, streaming required
```

**c) Cost comparison:**
```
If latency not critical: batch is $19.20/day cheaper
If latency critical: streaming required despite cost
```

**d) Hybrid approach:**
```
- Streaming: last 1 hour of data (low latency)
- Batch: historical data (hourly, lower cost)
- Cost: $2.00/hour streaming + $0.10/hour batch = $2.10/hour
- Daily: $2.10 × 24 = $50.40/day
- Benefit: real-time for recent, cost-effective for history
```

## Solution 6

**a) Data loss:**
```
Posts: 10,000 × 0.5 = 5,000 posts not processed
Interactions: 100,000 × 0.5 = 50,000 interactions not processed
```

**b) Time to recovery:**
```
Failure time: 30 minutes
Investigation: 2 hours = 120 minutes
Rerun: 60 minutes (full pipeline)
Total: 30 + 120 + 60 = 210 minutes = 3.5 hours
```

**c) Delayed runs:**
```
Recovery: 3.5 hours
Pipeline frequency: hourly
Delayed runs: 3-4 runs (depending on timing)
```

**d) Checkpoint strategy:**
```
Checkpoint every 10 minutes
Failure at 30 min: last checkpoint at 20 min
Data loss: 10 minutes = 1,667 posts, 16,667 interactions
Recovery: resume from checkpoint, process remaining 40 min
Recovery time: 40 minutes (no investigation needed)
```

**e) With checkpoints:**
```
Data loss: 10 minutes instead of 30 minutes (67% reduction)
Recovery time: 40 minutes instead of 210 minutes (81% reduction)
```

## Solution 7

**a) Daily network cost:**
```
Ingress: 5 GB/hour × 24 hours = 120 GB/day × $0.00 = $0.00
Egress: 100 MB/hour × 24 hours = 2.4 GB/day × $0.09/GB = $0.216/day
Total: $0.216/day
```

**b) Daily compute cost:**
```
24 hours × $0.10/hour = $2.40/day
```

**c) Monthly total:**
```
Network: $0.216 × 30 = $6.48/month
Compute: $2.40 × 30 = $72.00/month
Total: $78.48/month
```

**d) 5× volume increase:**
```
Ingress: 120 GB × 5 = 600 GB/day (still free)
Egress: 2.4 GB × 5 = 12 GB/day × $0.09 = $1.08/day
Compute: $2.40 × 5 = $12.00/day (if processing time scales)
Monthly: ($1.08 + $12.00) × 30 = $392.40/month
```

**e) 30-minute processing:**
```
Compute: 0.5 hours × $0.10 = $0.05 per run
Daily: $0.05 × 24 = $1.20/day (50% savings)
Monthly: $1.20 × 30 = $36.00/month
Savings: $72 - $36 = $36/month
```

# Practice 2

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

# Practice 3

# Week 3: Parallelism and Divide-and-Conquer — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Trace map → shuffle → reduce with concrete (k,v) and groups
- Compute shuffle size, reducer input size, and cost where asked
- Justify skew mitigations with numeric assumptions

## Data Context (MANDATORY)

### Input: log lines and sales records

**Word-count / log input (records 1–10):**
1. "the quick brown fox"
2. "the quick brown dog"
3. "quick brown fox jumps"
4. "the lazy dog"
5. "brown fox lazy"
6. "dog jumps quick"
7. "the fox and the dog"
8. "quick brown lazy fox"
9. "jumps over lazy dog"
10. "the quick brown fox runs"

**Sales-by-product input (records 1–10):** each record = (product_id, amount)
- (101, 10.0), (102, 5.5), (101, 7.5), (103, 3.0), (102, 4.5)
- (101, 2.0), (103, 8.0), (102, 6.0), (101, 11.0), (103, 1.5)

**Keys and scale:**
- Word count: key = word (string); value = count (int). ~10 records, ~4 words/line ⇒ ~40 map emits.
- Sales: key = product_id (int); value = amount (float). 10 records ⇒ 10 map emits.

**Skew scenario (for later exercises):**
- Clicks table: (user_id, click_ts). user_id 888 (bot) = 1B rows; others &lt; 1K each.
- Users table: (user_id, name). 1M users. Join: clicks ⟗ users. Standard hash(user_id) → one reducer gets 1B rows for 888 ⇒ OOM.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count, sales per product); map outputs, shuffle groups, reduce outputs; solution format and structure.
- exercises2.md: Anatomy of shuffle; inverted index with positions; data skew and salting (hot key 888, salt and replicate); combiner and partitioner reasoning.

## Diagram Manifest
- Slide 18 → week3_practice_slide18_skew_mitigation.puml → skew mitigation (salting) flow

## Warm-up Exercises

## Exercise 1
Using the word-count input (records 1–3 only: "the quick brown fox", "the quick brown dog", "quick brown fox jumps"), write the **map outputs** (key, value) for each record. Then list the **shuffle groups** (key → list of values). No reduce step yet.

## Exercise 2
For the same three records, complete the **reduce** step: for each key, sum the values. Write the final (word, count) output.

## Exercise 3
Using the sales-by-product input (all 10 records), show **map outputs**, **shuffle groups**, and **reduce outputs** (product_id, total_sales). Assume map emits (product_id, amount) as-is.

## Exercise 4
Define **work** and **span** in one sentence each. For 100 map tasks of equal size and 10 reduce tasks of equal size, what is the best-case speedup (upper bound) if we have 50 workers? One sentence.

## Exercise 5
Why is the **shuffle** phase often the most expensive part of a MapReduce job? Give two reasons in one sentence each.

## Engineering Exercises

## Exercise 6
**Shuffle size:** Word-count input has 10 lines, ~4 words/line ⇒ 40 map emits. Assume each (word, 1) is 20 bytes (key + value).  
a) Total map output size in bytes?  
b) This is also the shuffle size (all (k,v) sent to reducers). If we have 5 reducers and keys are evenly distributed, bytes per reducer (approx)?  
c) If one word (e.g. "the") appears in 8 lines, how many (k,v) pairs does that key produce? How many go to one reducer?

## Exercise 7
**Combiner:** For word count, a combiner sums counts locally before shuffle: (the,1),(the,1),(the,1) → (the,3).  
a) If the 40 map emits become 15 after combining (fewer distinct words per mapper), what is the new shuffle size in bytes (still 20 B per (k,v))?  
b) Why can we use a combiner for word count? (Associate? Commutative?) One sentence.

## Exercise 8
**Skew:** Join Clicks (user_id, ts) with Users (user_id, name). user_id 888 has 1B clicks; 999,999 users have &lt; 1K clicks each. Hash partitioning: hash(user_id) mod 1000 → reducer.  
a) How many clicks does reducer for 888 get (approx)?  
b) If each click record is 100 B, how much data does that reducer receive (GB)?  
c) Why might that reducer OOM or timeout? One sentence.

## Exercise 9
**Salting mitigation:** We salt 888 into 10 buckets: 888-1 … 888-10. Clicks for 888: emit (888-i, click) for random i in 1..10. Users for 888: replicate (888-1, user) … (888-10, user).  
a) How many click records does each of the 10 reducers get (approx)?  
b) How much does the Users table grow in the shuffle (for key 888 only)? One sentence.  
c) After the join, what extra step is needed to get "user 888" result? One sentence.

## Challenge Exercise

## Challenge: Skew mitigation design and diagram

**Setup:** Same as Exercise 8: Clicks (1B rows for user 888, rest small) join Users (1M rows). Standard join → one reducer gets ~100 GB for 888 and fails.

**Part 1 — Salting plan**  
a) Choose number of salt buckets N (e.g. 10 or 100). How many reducers will process 888’s data?  
b) For Clicks: how do you modify the key so 888’s rows go to N different reducers? (Pseudocode or one sentence.)  
c) For Users: why must you replicate 888’s row N times? One sentence.

**Part 2 — Cost**  
a) Shuffle volume for 888’s clicks: before salting (one reducer) vs after (N reducers). Same total bytes?  
b) Extra shuffle cost for Users (888 only): how many copies of 888’s row?  
c) Is the extra cost for Users acceptable? Why? One sentence.

**Part 3 — Diagram**  
- Draw or reference a diagram that shows: before (one hot reducer) vs after salting (N reducers, replicated small table).

## Skew mitigation flow (diagram)
- Before: one hot reducer; after: salting splits large table, small table replicated to N reducers; merge step.
- Diagram: week3_practice_slide18_skew_mitigation.puml

## Solutions

## Solution 1
**Assumptions:** Records 1–3 only; map emits (word, 1) per word; lowercase.  
**Map outputs:**  
- R1: (the,1),(quick,1),(brown,1),(fox,1)  
- R2: (the,1),(quick,1),(brown,1),(dog,1)  
- R3: (quick,1),(brown,1),(fox,1),(jumps,1)  
**Shuffle groups:** the→[1,1], quick→[1,1,1], brown→[1,1,1], fox→[1,1], dog→[1], jumps→[1]  
**Check:** 4+4+4 = 12 map emits; 6 keys; sum of group sizes = 12.

## Solution 2
**Reduce:** sum values per key.  
**Output:** (the,2), (quick,3), (brown,3), (fox,2), (dog,1), (jumps,1)  
**Check:** Total count = 2+3+3+2+1+1 = 12 = total map emits.

## Solution 3
**Map outputs:** (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5)  
**Shuffle groups:** 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5]  
**Reduce outputs:** 101: 10+7.5+2+11 = 30.5; 102: 5.5+4.5+6 = 16.0; 103: 3+8+1.5 = 12.5  
**Final:** (101, 30.5), (102, 16.0), (103, 12.5). **Check:** 30.5+16+12.5 = 59.0 = sum of amounts.

## Solution 4
**Work:** total operations over all tasks (sum of all task times). **Span:** critical path length (longest chain of dependencies). **Best-case speedup:** upper bound = min(workers, tasks); with 50 workers and 100 map + 10 reduce tasks, speedup ≤ 110 (all tasks parallel); in practice limited by slowest stage (e.g. 10 reducers ⇒ at most 10-way parallelism in reduce).

## Solution 5
**Reasons:** (1) All map output is written to disk/network and read by reducers ⇒ large I/O. (2) Network bandwidth and disk throughput are often the bottleneck, not CPU; shuffle size equals map output size.

## Solution 6
**a)** 40 × 20 B = 800 B.  
**b)** 800 / 5 = 160 B per reducer (approx).  
**c)** 8 pairs (word "the", 1); all go to the same reducer (same key). That reducer gets 8 × 20 = 160 B just for "the" plus other keys hashing to it.

## Solution 7
**a)** 15 × 20 B = 300 B (shuffle size reduced from 800 B).  
**b)** Sum is associative and commutative; combining (the,1)+(the,1)+(the,1) → (the,3) gives same result as if all (the,1) went to reducer and summed there.

## Solution 8
**a)** ~1B (all 888’s clicks go to one reducer).  
**b)** 1B × 100 B = 100 GB.  
**c)** One reducer must hold or process 100 GB; heap or single-task memory limits cause OOM or timeout; other reducers finish quickly (straggler / skew).

## Solution 9
**a)** ~100M each (1B / 10).  
**b)** Users table: one row for 888 replicated 10 times in the shuffle (sent to each of 10 reducers).  
**c)** After join, each reducer outputs (888-i, joined_row); aggregate or merge by user_id 888 (e.g. second MR or in-memory merge) to get final result for 888.

## Solution: Challenge Part 1
**a)** N = 10 (example): 10 reducers process 888’s data.  
**b)** Clicks: for each (888, click), emit (888-salt, click) with salt = random 1..N (or hash(click_id) mod N).  
**c)** Users: 888’s row must join with every 888-salt bucket; so emit (888-1, user), …, (888-N, user) so each reducer has the user row for its bucket.

## Solution: Challenge Part 2
**a)** Same total bytes: 100 GB of click data still moved; now spread over N reducers (each ~100/N GB).  
**b)** 888’s user row replicated N times (e.g. 10 copies) in shuffle.  
**c)** Yes: Users is small (1M rows); replicating one row N times is negligible compared to moving 100 GB of clicks; trade-off is acceptable to avoid OOM.

## Solution: Challenge Part 3
**Diagram:** week3_practice_slide18_skew_mitigation.puml shows: before (one hot reducer with 1B rows), after salting (large table split into N keys 888-1..888-N; small table replicated to all N reducers); second step to merge results per original key 888.

# Practice 4

# Week 4: Data Ingestion and ETL Pipelines — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Incremental load: use watermark or CDC; ensure idempotent rerun
- Failure scenario: rerun must not duplicate results

## Data Context (MANDATORY)

### Tables and schemas

**raw_events** (staging / append-only logs):
- `event_id INT`, `user_id INT`, `event_type VARCHAR`, `event_timestamp VARCHAR`, `details JSON`
- Sample: (1, 101, 'click', '2025/12/01 08:00:00', '{"page":"home"}'); (2, 102, 'view', '2025-12-01T09:30:00', '{"page":"product"}'); (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id (business key); no PK; duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day)

**events_clean** (target):
- `event_id INT PRIMARY KEY`, `user_id INT`, `event_type VARCHAR`, `event_time TIMESTAMP`, `details JSON`
- Sample: (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id; one row per event
- Scale: ~1B rows total (100 GB)

**daily_sales** (CSV / staging):
- `sale_id INT`, `product_id INT`, `sale_date DATE`, `quantity INT`, `amount FLOAT`
- Sample: (1001, 500, '2025-12-01', 2, 19.98), (1002, 501, '2025-12-01', 1, 9.99), (1001, 500, '2025-12-01', 2, 19.98)
- Keys: sale_id (business key); duplicates possible in file
- Scale: ~5M rows/day (500 MB)

**sales** (target):
- `sale_id INT PRIMARY KEY`, `product_id INT`, `sale_date DATE`, `quantity INT`, `amount FLOAT`
- Sample: (1000, 499, '2025-11-30', 5, 49.95)
- Keys: sale_id; one row per sale
- Scale: ~100M rows

**etl_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_watermark TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('events_sync', '2025-12-01 08:00:00', '2025-12-02 06:00:00')
- Used for incremental load watermark

### Access patterns
- raw_events: read by date partition; append-only
- events_clean: read by event_id (MERGE); query by user_id, event_time
- daily_sales: bulk read; load into sales with upsert
- sales: read by sale_date (partition pruning)

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw_events → events_clean, dedup, MERGE, incremental); Batch Data Ingestion (daily_sales → sales, staging, upsert); Incremental (daily_updates → products, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun).
- exercises2.md: Module 3 Robust Data Ingestion (Schema-on-Read, watermarking, DLQ); Robust Batch Ingestion (staging, valid/invalid split); Incremental Loading and High-Water Marking (safety buffer, CDC).

## Diagram Manifest
- Slide 18 → week4_practice_slide18_incremental_rerun.puml → incremental load and idempotent rerun flow

## Warm-up Exercises

## Exercise 1
List the **three phases** of ETL in order. In one sentence, what is the main difference between ETL and ELT?

## Exercise 2
Define **idempotency** for a data load job in one sentence. Why is it important when a job is re-run after a failure?

## Exercise 3
What is a **watermark** in incremental load? In one sentence, what happens to the watermark if the load job fails before completing the write?

## Exercise 4
**raw_events** has two rows with event_id = 1 (duplicate). Before loading into **events_clean**, how do you keep exactly one row per event_id? Name the SQL pattern (e.g. window function).

## Exercise 5
A job loads partitions 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-02. On re-run, should the job process 2025-12-01 and 2025-12-02 again? One sentence.

## Engineering Exercises

## Exercise 6
**Transform and load (initial):** Write SQL to load from **raw_events** into **events_clean**:
- Filter event_type IN ('click', 'view', 'purchase')
- Normalize event_timestamp to TIMESTAMP (event_time)
- Deduplicate by event_id (keep one row per event_id, e.g. earliest event_time)
- Insert into events_clean. Use a single statement (CTE + MERGE or INSERT ... ON CONFLICT).

## Exercise 7
**Incremental load with watermark:** Assume raw_events is partitioned by date and we have **etl_control** with job_key = 'events_sync'. Write pseudocode or SQL steps to:
- Read last_watermark from etl_control
- Extract from raw_events where event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'
- Apply same transform/dedup as Exercise 6; MERGE into events_clean
- Update etl_control last_watermark only after successful load. Why the 5-minute buffer?

## Exercise 8
**Batch ingestion with upsert:** Load **daily_sales** (with possible duplicate sale_id in file and possible overlap with existing **sales** rows) into **sales**. Requirements:
- Deduplicate within daily_sales (one row per sale_id; e.g. keep latest by sale_date)
- Insert new sale_id; update existing sale_id if daily_sales has newer data (upsert by sale_id)
- Write the MERGE (or INSERT ... ON CONFLICT) statement. Assume sale_id is PRIMARY KEY in sales.

## Exercise 9
**Failure and rerun:** The incremental job for events runs for 2025-12-01, 2025-12-02, 2025-12-03. It fails after successfully writing 2025-12-01 and 2025-12-02 to events_clean (watermark updated for 12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is loaded, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 10
**Cost:** Assume raw_events has 100M rows/day; each row ~100 B. Staging holds one day. (a) Staging size in GB? (b) If MERGE does a full scan of events_clean (1B rows) to match keys, why is that expensive? (c) What index or design reduces that cost? One sentence each.

## Challenge Exercise

## Challenge: Incremental pipeline design and diagram

**Setup:** Same raw_events → events_clean pipeline. Job runs every 15 minutes. Source can have late-arriving events (event_time up to 10 minutes in the past).

**Part 1 — Watermark and buffer**
- (a) Where do you store the watermark (table name and column)?
- (b) Why use upper_bound = NOW() - 10 minutes instead of NOW() when reading raw_events?
- (c) If the job fails after writing to events_clean but before updating the watermark, what happens on the next run? One sentence.

**Part 2 — Idempotency**
- (a) Why is MERGE (or ON CONFLICT DO NOTHING) required for idempotency when the same slice might be read again?
- (b) Give one scenario (e.g. duplicate in source, or re-delivered file) where the same event_id is processed twice. How does MERGE prevent duplicate rows in events_clean?

**Part 3 — Diagram**
- Reference the diagram that shows: read watermark → extract slice → transform → MERGE target → update watermark. What is the purpose of updating the watermark only after success?

## Incremental and rerun flow (diagram)
- Flow: control table (watermark) → read source slice → transform/dedup → MERGE target → update watermark after success.
- Rerun: same slice re-read if watermark not updated; MERGE ensures no duplicates.
- Diagram: week4_practice_slide18_incremental_rerun.puml

## Solutions

## Solution 1
**ETL:** Extract → Transform → Load. **ELT:** Extract → Load (raw into store) → Transform (in place, e.g. SQL). Difference: ELT defers transformation to the load environment (e.g. DWH); scales with engine and avoids moving transformed data over the wire.

## Solution 2
**Idempotency:** Running the job N times (N ≥ 1) yields the same result as running it once. Important on re-run: if the job fails mid-way, re-running should not insert duplicate rows or overwrite with stale data; MERGE/ON CONFLICT and watermark make reruns safe.

## Solution 3
**Watermark:** A stored value (e.g. last_loaded_at or max(modified_at)) that marks the upper bound of data already loaded. If the job fails before completing the write, the watermark is not updated, so the next run re-reads the same slice; with idempotent write (MERGE), no duplicates.

## Solution 4
Use **ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time)** and keep rows where rn = 1. That keeps one row per event_id (e.g. earliest event_time).

## Solution 5
No. The job should only process 2025-12-03 (and update watermark for 12-03). 2025-12-01 and 2025-12-02 are already in the target; re-processing them would require idempotent write (MERGE) so that no duplicate rows are inserted; ideally skip them via partition tracking.

## Solution 6
**Assumptions:** event_timestamp parseable to TIMESTAMP; event_id business key. **Plan:** Filter types, cast timestamp, dedup by event_id, MERGE into events_clean.

```sql
WITH filtered AS (
  SELECT event_id, user_id, event_type,
         CAST(event_timestamp AS TIMESTAMP) AS event_time,
         details
  FROM raw_events
  WHERE event_type IN ('click', 'view', 'purchase')
    AND event_timestamp IS NOT NULL
),
deduped AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
  FROM filtered
),
to_load AS (
  SELECT event_id, user_id, event_type, event_time, details
  FROM deduped
  WHERE rn = 1
)
MERGE INTO events_clean AS target
USING to_load AS src
ON target.event_id = src.event_id
WHEN NOT MATCHED THEN
  INSERT (event_id, user_id, event_type, event_time, details)
  VALUES (src.event_id, src.user_id, src.event_type, src.event_time, src.details);
```

**Check:** No duplicate event_id in events_clean; rerun with same raw_events changes nothing (idempotent).

## Solution 7
**Steps:**
1. `SELECT last_watermark FROM etl_control WHERE job_key = 'events_sync';`
2. `upper_bound = NOW() - INTERVAL '5 minutes';`
3. Extract: `SELECT * FROM raw_events WHERE event_time > last_watermark AND event_time <= upper_bound;` (same filter/dedup as Ex 6).
4. MERGE into events_clean (same as Ex 6).
5. In same transaction: `UPDATE etl_control SET last_watermark = upper_bound, last_run_ts = NOW() WHERE job_key = 'events_sync';` only after step 4 commits.

**5-minute buffer:** Transactions in the source may commit slightly after event_time; reading up to NOW() could miss rows that commit just after the query runs. Upper bound in the past ensures committed rows are included; trade latency for consistency.

## Solution 8
**Assumptions:** sale_id PRIMARY KEY in sales; one row per sale_id in result; "newer" = later sale_date or later ingestion order.

```sql
WITH deduped_staging AS (
  SELECT sale_id, product_id, sale_date, quantity, amount,
         ROW_NUMBER() OVER (PARTITION BY sale_id ORDER BY sale_date DESC) AS rn
  FROM daily_sales
),
to_upsert AS (
  SELECT sale_id, product_id, sale_date, quantity, amount
  FROM deduped_staging
  WHERE rn = 1
)
MERGE INTO sales AS target
USING to_upsert AS src
ON target.sale_id = src.sale_id
WHEN MATCHED AND src.sale_date >= target.sale_date THEN
  UPDATE SET product_id = src.product_id, sale_date = src.sale_date, quantity = src.quantity, amount = src.amount
WHEN NOT MATCHED THEN
  INSERT (sale_id, product_id, sale_date, quantity, amount)
  VALUES (src.sale_id, src.product_id, src.sale_date, src.quantity, src.amount);
```

**Check:** One row per sale_id in sales; re-run with same daily_sales yields same state (idempotent).

## Solution 9
- (a) Next run reads watermark = 2025-12-02 (or max loaded partition); extract slice includes 2025-12-03 only (or process only partition 2025-12-03).
- (b) Do not re-insert 2025-12-01 and 2025-12-02: use partition-level tracking (skip completed partitions) or rely on MERGE: rows for 12-01 and 12-02 already in target, so MERGE WHEN NOT MATCHED does not fire for them; no duplicates.
- (c) Update watermark (or mark partition 2025-12-03 completed) only after 2025-12-03 is successfully written; if this run fails, next run still sees 12-03 as unprocessed.

## Solution 10
- (a) 100M × 100 B = 10^10 B = 10 GB staging (one day).
- (b) Full scan of 1B rows to match keys: O(target size); high I/O and CPU; long runtime.
- (c) Index on events_clean(event_id) (or PK): MERGE join uses index lookup per source row; cost ≈ O(source rows × log(target rows)) instead of full scan.

## Solution: Challenge Part 1
- (a) **etl_control** table; columns e.g. job_key, last_watermark (TIMESTAMP), last_run_ts.
- (b) Late-arriving events: if we read up to NOW(), we might read rows that are not yet committed or that will be corrected; upper_bound = NOW() - 10 min gives a safety buffer so committed/corrected data is included; avoids missing or double-counting late events.
- (c) Next run re-reads the same slice (watermark unchanged); MERGE ensures no duplicate rows; load is effectively retried until success, then watermark advances.

## Solution: Challenge Part 2
- (a) If the same slice is read again (e.g. after failure before watermark update), INSERT would duplicate rows. MERGE (or ON CONFLICT DO NOTHING) ensures existing keys are not inserted again, so rerun is idempotent.
- (b) Scenario: upstream retries and sends the same batch twice, or the same file is re-delivered. Same event_id appears in the slice twice (or in two runs). MERGE ON event_id: first time INSERT, second time MATCHED so no second INSERT; events_clean has one row per event_id.

## Solution: Challenge Part 3
**Diagram:** week4_practice_slide18_incremental_rerun.puml. **Purpose of updating watermark only after success:** If we updated before write and the write then failed, the next run would skip that slice (watermark already advanced), so data would be lost. Updating after success ensures we only advance when data is safely in the target; on failure, watermark stays, next run retries the same slice and MERGE avoids duplicates.

# Practice 5

# Week 5: Data Warehousing and Data Lakes — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Star schema: use fact and dimensions; reason about partition pruning and join cost
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Star schema: fact and dimensions

**sales_fact** (fact table; partitioned by date_key):
- `sale_id INT`, `customer_key INT`, `product_key INT`, `date_key INT`, `quantity INT`, `amount DECIMAL(10,2)`
- Keys: sale_id (business); customer_key, product_key, date_key (FKs to dimensions)
- Sample: (1, 101, 201, 20251201, 2, 19.98), (2, 102, 202, 20251201, 1, 9.99), (3, 101, 202, 20251202, 3, 29.97), (4, 103, 201, 20251202, 1, 9.99)
- Scale: ~10M rows/year (~1 TB); 365 partitions (one per day)

**dim_customer** (dimension):
- `customer_key INT PK`, `customer_id INT`, `name VARCHAR`, `region VARCHAR`
- Sample: (101, 1, 'Alice', 'North'), (102, 2, 'Bob', 'East'), (103, 3, 'Charlie', 'West')
- Scale: ~10K rows (~10 MB)

**dim_product** (dimension):
- `product_key INT PK`, `product_id INT`, `name VARCHAR`, `category VARCHAR`
- Sample: (201, 101, 'T-shirt', 'Clothing'), (202, 102, 'Mug', 'Home'), (203, 103, 'Notebook', 'Office')
- Scale: ~1K rows (~1 MB)

**dim_date** (dimension):
- `date_key INT PK`, `date DATE`, `month INT`, `year INT`
- Sample: (20251201, '2025-12-01', 12, 2025), (20251202, '2025-12-02', 12, 2025)
- Scale: ~2K rows (small)

### Access patterns
- sales_fact: read by date_key (partition pruning); join to dim_customer, dim_product, dim_date
- Dimensions: lookup by key; small enough to broadcast in distributed engines
- Critical: queries must filter by date_key to avoid full scan

## Reference Exercises Used (Root)
- exercises1.md: SQL joins and aggregations (e-commerce revenue by region, NOT EXISTS); structure of sample rows and full SQL solutions; partition/index notes.
- exercises2.md: Module 1 Advanced Relational Modeling (star schema, fact/dim, surrogate keys); window functions and cost reasoning; SCD and MERGE patterns adapted to DWH context.

## Diagram Manifest
- Slide 18 → week5_practice_slide18_star_query_flow.puml → star schema query path and partition pruning

## Warm-up Exercises

## Exercise 1
Name the **three** main components of a star schema. What is the partition key of **sales_fact** in this context?

## Exercise 2
What is **partition pruning**? In one sentence, why does a query without a filter on `date_key` become expensive for **sales_fact**?

## Exercise 3
Which table is largest by row count: **sales_fact**, **dim_customer**, or **dim_product**? Which is smallest? Why does that matter for join strategy?

## Exercise 4
Write one SQL line that selects from **sales_fact** with a partition filter so that only December 2025 data is read. (Use date_key range.)

## Exercise 5
For the query "revenue by region for December 2025", name the fact table and the dimension table(s) that must be joined. What is the join key?

## Engineering Exercises

## Exercise 6
**Revenue by region with partition pruning:** Write a full SQL query that returns total revenue (SUM(amount)) by region for **December 2025 only**. Use **sales_fact** and **dim_customer**. Ensure the WHERE clause includes a filter on **date_key** so that partition pruning applies. State how many partitions are read (assume one partition per day).

## Exercise 7
**Partition pruning and cost:** Assume **sales_fact** has 365 partitions (one per day in 2025), ~27K rows per partition, and total size 1 TB. (a) How many partitions are read for the query in Exercise 6? (b) Approximate bytes read if data is distributed evenly. (c) If the same query were run **without** a date filter, how many partitions would be read and why is that a problem?

## Exercise 8
**Revenue by category:** Write a full SQL query that returns total revenue by **product category** for December 2025. Use **sales_fact** and **dim_product**. Include the partition filter on date_key. Order by total_revenue DESC.

## Exercise 9
**Join size reasoning:** For the query "revenue by region for December 2025", the join is sales_fact (pruned to December) ⋈ dim_customer. (a) Which side is larger after pruning: fact slice or dimension? (b) In a distributed engine, would you broadcast dim_customer to all nodes or shuffle sales_fact? Justify in one sentence. (c) If dim_customer were 10 GB instead of 10 MB, how might the strategy change?

## Exercise 10
**Categories with no sales in December:** List all product categories that have **no sales** in December 2025. Use **dim_product** and **sales_fact** (with partition filter). Hint: NOT EXISTS or LEFT JOIN ... WHERE ... IS NULL. Write full SQL.

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: architecture and diagram.** (a) Design a minimal "reporting checklist" for running the "revenue by region" report in production: what must be true about the query (partition filter? indexes?) and what should be monitored (e.g. scan size). (b) Draw or reference a diagram showing: BI → SQL → planner → partition pruning → scan fact → join dim_customer → aggregate → result. Diagram: week5_practice_slide18_star_query_flow.puml (c) If a new partition is added every day, how do you ensure today's partition is not queried until the nightly load completes? One sentence.

## Solutions

## Solution 1
- **Star schema components:** (1) Fact table (sales_fact), (2) Dimension tables (dim_customer, dim_product, dim_date), (3) Foreign keys from fact to dimensions.
- **Partition key of sales_fact:** date_key (one partition per day in this setup).

## Solution 2
- **Partition pruning:** The engine skips partitions that do not satisfy the filter, so only relevant partitions are scanned.
- Without a filter on date_key, the engine must scan **all** partitions (full table scan), so I/O and time scale with total table size and the query becomes expensive.

## Solution 3
- **Largest:** sales_fact (~10M rows/year). **Smallest:** dim_product (~1K rows).
- **Why it matters:** Small dimensions can be broadcast to all nodes; the fact table is scanned (with pruning). Join strategy: broadcast small dims, stream or partition fact.

## Solution 4
- Example: `SELECT * FROM sales_fact WHERE date_key BETWEEN 20251201 AND 20251231;`
- This restricts the scan to December 2025 partitions only.

## Solution 5
- **Fact:** sales_fact. **Dimension(s):** dim_customer (for region).
- **Join key:** customer_key (sales_fact.customer_key = dim_customer.customer_key).

## Solution 6
**Assumptions:** December 2025 ⇒ date_key 20251201–20251231; one partition per day.
**Plan:** Join sales_fact to dim_customer on customer_key; filter date_key; group by region; sum amount.

**SQL:**

```sql
SELECT c.region, SUM(f.amount) AS total_revenue
FROM sales_fact f
JOIN dim_customer c ON f.customer_key = c.customer_key
WHERE f.date_key BETWEEN 20251201 AND 20251231
GROUP BY c.region
ORDER BY total_revenue DESC;
```

**Check:** Partition filter on date_key ensures only December partitions are read (31 partitions).

## Solution 7
- (a) **Partitions read:** 31 (December has 31 days).
- (b) **Bytes read (approx):** 1 TB / 365 ≈ 2.7 GB per partition; 31 × 2.7 GB ≈ 84 GB (or proportionally by rows: 31 × 27K ≈ 837K rows).
- (c) **Without date filter:** All 365 partitions read ⇒ full scan, 1 TB. Problem: 365× more I/O and time; risk of timeout and high cost.

## Solution 8
**SQL:**

```sql
SELECT p.category, SUM(f.amount) AS total_revenue
FROM sales_fact f
JOIN dim_product p ON f.product_key = p.product_key
WHERE f.date_key BETWEEN 20251201 AND 20251231
GROUP BY p.category
ORDER BY total_revenue DESC;
```

Partition filter on date_key applies; same 31 partitions as Exercise 6.

## Solution 9
- (a) **Larger after pruning:** Fact slice (December: ~31 × 27K ≈ 837K rows). dim_customer is ~10K rows.
- (b) **Strategy:** Broadcast dim_customer (small); keep fact scan local per partition. Avoids shuffling the fact table for the dimension lookup.
- (c) **If dim_customer were 10 GB:** Broadcast may be too large; would need to partition/shuffle both sides on customer_key (e.g. hash join with shuffle).

## Solution 10
**SQL:**

```sql
SELECT DISTINCT p.category
FROM dim_product p
WHERE NOT EXISTS (
  SELECT 1 FROM sales_fact f
  WHERE f.product_key = p.product_key
    AND f.date_key BETWEEN 20251201 AND 20251231
);
```

**Check:** Categories with no matching sales in December are returned. Partition filter in subquery limits fact scan to December.

## Solution 11 (Challenge)
- **(a) Reporting checklist:** Query must include partition filter (date_key range); no full scan. Monitor: bytes/rows read, partitions read, query duration; alert on full scan or scan size above threshold.
- **(b) Diagram:** BI → SQL → planner (extract partition filter) → partition pruning → scan sales_fact (pruned partitions only) → join dim_customer (broadcast) → aggregate → result. See slide 18 (Challenge) for diagram.
- **(c) Today's partition:** Do not include today's partition in the report until the load for that partition has completed; e.g. report only up to yesterday, or use a "data ready" cutoff (e.g. max date_key where load_status = 'complete').

# Practice 6

# Week 6: MapReduce Fundamentals — Practice

## Instructions
- Engineering course: show reasoning and calculations
- MapReduce: show map emits (k,v), shuffle groups, reduce outputs explicitly
- All exercises use the Data Context below unless stated otherwise

## Data Context (MANDATORY)

### Word-count input (records 1–4)
- **Format:** one record = one line of text (line_id, text).
- **Sample (4 lines):**
  1. "the quick brown fox"
  2. "the quick brown dog"
  3. "quick brown fox jumps"
  4. "the lazy dog"
- **Keys after map:** word (lowercase); value from map = 1.
- **Approx:** 4 lines, 4+4+4+3 = 15 words ⇒ 15 map emits; 7 distinct words.

### Sales-by-product input (10 records)
- **Format:** each record = (transaction_id, product_id, amount).
- **Sample:** (T1, 101, 10.0), (T2, 102, 5.5), (T3, 101, 7.5), (T4, 103, 3.0), (T5, 102, 4.5), (T6, 101, 2.0), (T7, 103, 8.0), (T8, 102, 6.0), (T9, 101, 11.0), (T10, 103, 1.5)
- **Keys after map:** product_id (101, 102, 103); value = amount.
- **Goal:** total sales per product_id.

### Skew scenario (reference)
- **Clicks:** (user_id, click_ts); user_id 888 has 1B rows; 999,999 users have <1K each.
- **Users:** (user_id, name); 1M rows; join key = user_id.
- **Problem:** hash(888) mod R → one reducer gets ~1B rows ⇒ OOM/timeout.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count, sales per product); map outputs, shuffle groups, reduce outputs; solution structure and phrasing.
- exercises2.md: Module 2 Distributed Computation (anatomy of shuffle, inverted index, skew and salting, combiner); hot key 888 salt-and-replicate; cost reasoning.

## Diagram Manifest
- Slide 18 → week6_practice_slide18_skew_mitigation.puml → before/after salting for hot key

## Warm-up Exercises

## Exercise 1
Using the word-count input (4 lines only), write the **map outputs** (key, value) for each of the 4 records. Assume map emits (word, 1) per word, lowercase. No shuffle or reduce yet.

## Exercise 2
For the same 4 lines, list the **shuffle groups**: key → list of values. How many keys? What is the sum of all value counts across groups?

## Exercise 3
Complete the **reduce** step for word count: for each key, sum the values. Write the final (word, count) output. Verify total count equals total words in the 4 lines.

## Exercise 4
Using the sales-by-product input (all 10 records), show **map outputs** (product_id, amount) as emitted by map. Then list **shuffle groups** (product_id → list of amounts).

## Exercise 5
Complete the **reduce** step for sales-by-product: for each product_id, sum the amounts. Write the final (product_id, total_sales). Verify sum of totals equals sum of all 10 amounts.

## Engineering Exercises

## Exercise 6
**Shuffle size:** Word-count input has 4 lines, 15 words total ⇒ 15 map emits. Assume each (word, 1) pair is 20 bytes (key + value). (a) Total map output size in bytes? (b) This equals shuffle size. With 3 reducers and even key distribution, approx bytes per reducer? (c) The word "the" appears in 3 lines: how many (k,v) pairs does key "the" produce? How many go to one reducer?

## Exercise 7
**Combiner:** For word count, a combiner sums counts locally before shuffle: (the,1),(the,1),(the,1) → (the,3). (a) If after combining we have 8 (k,v) pairs instead of 15, what is the new shuffle size in bytes (still 20 B per pair)? (b) Why is the final reduce output still correct? One sentence.

## Exercise 8
**Skew:** Join Clicks (user_id, ts) with Users (user_id, name). user_id 888 has 1B clicks; 999,999 users have <1K each. Hash partitioning: hash(user_id) mod 1000 → reducer. (a) Approx how many clicks does the reducer for key 888 get? (b) If each click record is 100 B, how much data does that reducer receive (GB)? (c) Why might that reducer OOM or timeout? One sentence.

## Exercise 9
**Salting (setup):** Same as Exercise 8. We use N=10 salt buckets for key 888. (a) For Clicks: how do you modify the key so 888’s rows go to 10 different reducers? (Pseudocode or one sentence.) (b) For Users: how many copies of the row for user_id 888 must be sent (and to which reducers) so the join still works? One sentence.

## Exercise 10
**Salting (cost):** (a) Shuffle volume for 888’s clicks: before salting (one reducer) vs after (10 reducers). Same total bytes? (b) Extra shuffle cost for Users (888 only): how many copies of 888’s row? (c) Draw or reference a diagram: before (one hot reducer) vs after salting (10 reducers, replicated small table). Diagram: week6_practice_slide18_skew_mitigation.puml

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: full walkthrough + skew.** (a) Using the sales-by-product input (10 records), perform a **full manual MapReduce**: write map outputs, shuffle groups, and reduce outputs in a small table. (b) Assume product_id 101 is a "hot key" (e.g. 80% of future data). Describe one mitigation (combiner or salting) and how it changes map key and/or reduce logic. (c) For the mitigation you chose, state one trade-off (e.g. extra network, code complexity, or merge step). Diagram: week6_practice_slide18_skew_mitigation.puml for part (b) if salting.

## Solutions

## Solution 1
- **Assumptions:** 4 lines; map emits (word, 1) per word; lowercase.
- **Map outputs:** R1: (the,1),(quick,1),(brown,1),(fox,1); R2: (the,1),(quick,1),(brown,1),(dog,1); R3: (quick,1),(brown,1),(fox,1),(jumps,1); R4: (the,1),(lazy,1),(dog,1).
- **Check:** 4+4+4+3 = 15 map emits; 7 distinct words (the, quick, brown, fox, dog, jumps, lazy).

## Solution 2
- **Shuffle groups:** brown→[1,1,1], dog→[1,1], fox→[1,1], jumps→[1], lazy→[1], quick→[1,1,1], the→[1,1,1].
- **Count:** 7 keys; sum of group sizes = 3+2+2+1+1+3+3 = 15 = total map emits.

## Solution 3
- **Reduce:** sum values per key. brown→3, dog→2, fox→2, jumps→1, lazy→1, quick→3, the→3.
- **Check:** Total words in 4 lines = 4+4+4+3 = 15; sum of counts = 3+2+2+1+1+3+3 = 15.

## Solution 4
- **Map outputs:** (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5).
- **Shuffle groups:** 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5].

## Solution 5
- **Reduce:** 101→30.5, 102→16.0, 103→12.5.
- **Check:** 10.0+5.5+7.5+3.0+4.5+2.0+8.0+6.0+11.0+1.5 = 58.0; 30.5+16.0+12.5 = 58.0.

## Solution 6
- **Assumptions:** 16 map emits; 20 B per (k,v); 3 reducers.
- (a) Total map output = 15 × 20 = 300 B. Shuffle size = 300 B.
- (b) Even distribution ⇒ 300/3 = 100 B per reducer (approx).
- (c) "the" in 3 lines ⇒ 3 (k,v) pairs for key "the"; all 3 go to one reducer (same key).

## Solution 7
- (a) New shuffle size = 8 × 20 = 160 B (reduced from 300 B).
- (b) Final output correct because sum is associative and commutative; combiner only pre-aggregates, reduce sees same total per key.

## Solution 8
- (a) Reducer for 888 gets ~1B clicks (all rows with user_id 888).
- (b) 1B × 100 B = 100 GB to one reducer.
- (c) Reducer must hold or process 100 GB; heap or disk spill can cause OOM or extreme latency/timeout.

## Solution 9
- (a) Clicks: emit (888||random(1..10), click_data) so 888’s rows spread to 10 keys (888-1 .. 888-10); partition by new key ⇒ 10 reducers.
- (b) Users: emit 10 copies of (888-1, user_row), (888-2, user_row), …, (888-10, user_row) so each of the 10 reducers gets 888’s user row for the join.

## Solution 10
- (a) Same total bytes: 888’s clicks still 100 GB total; now split across 10 reducers (~10 GB each).
- (b) Users: 10 copies of 888’s row (one per salt bucket).
- (c) Diagram: before = one reducer with 100 GB; after = 10 reducers with ~10 GB each; small table replicated 10× for key 888.

## Solution 11
- (a) **Full walkthrough:** Map: (101,10.0),(102,5.5),(101,7.5),(103,3.0),(102,4.5),(101,2.0),(103,8.0),(102,6.0),(101,11.0),(103,1.5). Shuffle: 101→[10.0,7.5,2.0,11.0], 102→[5.5,4.5,6.0], 103→[3.0,8.0,1.5]. Reduce: 101→30.5, 102→16.0, 103→12.5.
- (b) **Mitigation (combiner):** On map side, locally sum amounts per product_id before shuffle: e.g. (101,10.0),(101,7.5) → (101,17.5). Reduces shuffle size; same final result. **Or salting:** If 101 is hot, emit (101-salt, amount) with random salt 1..N; replicate product 101’s dimension row to all N reducers; reduce per (101-salt) then merge sums for 101.
- (c) **Trade-off:** Combiner: no extra merge; requires associative reduce. Salting: spreads load but small table replication and final merge step; more code and network for dimension.

# Practice 7

# Week 7: Advanced MapReduce and Data Skew — Practice

## Instructions
- Engineering course: show reasoning and calculations
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs explicitly
- Include one skew case and one mitigation (combiner / partitioner / salting)
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Input: text lines (word count)

**File / split:** Plain text lines; each line = (line_id, line_text). Splits by block.

**Schema:** Input record: (line_id, line_text). Map emit: (word, 1). Reduce output: (word, total_count).

**Sample input (10 records):**

| line_id | line_text        |
|--------:|------------------|
| 1       | data eng data    |
| 2       | eng data fun     |
| 3       | data data data   |
| 4       | fun eng          |
| 5       | data eng fun     |
| 6       | eng              |
| 7       | data fun         |
| 8       | data data        |
| 9       | eng fun data     |
| 10      | data             |

**Approximate scale (for cost exercises):** 10 lines here; assume 1 billion lines, ~100 bytes/line → 100 GB input; 3 reducers.

**Keys / partitions:** Reduce key = word; partition = hash(word) mod R. R = number of reducers.

### Input: clicks and users (skew / join)

**Clicks:** (user_id, click_id, ts). **Users:** (user_id, name). Join key = user_id.

**Sample Clicks (8 records):** (101, c1, t1), (102, c2, t2), (101, c3, t3), (101, c4, t4), (103, c5, t5), (101, c6, t6), (101, c7, t7), (102, c8, t8).

**Sample Users (3 records):** (101, "Alice"), (102, "Bob"), (103, "Carol").

**Skew:** user_id 101 has 5 clicks; 102 has 2; 103 has 1. At scale, one user_id (e.g. bot) could have billions of clicks.

## Reference Exercises Used (Root)
- exercises1.md: Exercise structure, sample rows, step-by-step solutions and check notes; SQL/aggregation style adapted to MapReduce wording.
- exercises2.md: Module 2 MapReduce — inverted index (map emit (word, (doc_id, pos)), shuffle, reduce); matrix multiplication (replication join); data skew and salting (hot key 888, salt and replicate); shuffle anatomy and cost.

## Diagram Manifest
- Slide 18 → week7_practice_slide18_skew_salting.puml → skew mitigation: salting flow (large table salt, small table replicate)

## Warm-up Exercises

## Exercise 1
For the **word count** Data Context (10 lines), list the **unique words** that will appear as reduce keys. How many distinct keys are there?

## Exercise 2
In MapReduce word count, what is the **partition rule**? Which reducer will get the key "data" if R = 3 and partition = hash(word) mod 3? (Assume hash("data") mod 3 = 0.)

## Exercise 3
What is a **combiner**? In one sentence, why can we use a combiner for word count (sum of 1s) but must be careful for "count distinct"?

## Exercise 4
Define **data skew** in one sentence. What happens to one reducer when its key has 100× more values than the average?

## Exercise 5
For the **Clicks–Users** sample, which user_id is the "hot" key? How many click records will the reducer for that key receive if we use default partitioning?

## Engineering Exercises

## Exercise 6
**Full manual walkthrough (word count):** Using the 10-line input in Data Context, (a) Write the **Map output** (all (k,v) pairs) for the first 3 lines (line_id 1, 2, 3). (b) Assume R = 3 and hash("data") mod 3 = 0, hash("eng") mod 3 = 1, hash("fun") mod 3 = 2. List which **keys** go to which **reducer**. (c) For each reducer, give the **input** (key and list of values) and the **output** (key, sum). (d) What is the final word count for "data", "eng", "fun"?

## Exercise 7
**Shuffle size:** For the full 10-line input, every word emits (word, 1). (a) How many **map output pairs** are there in total? (b) If we use a **combiner** that sums (word, count) per map task, what is the maximum number of pairs that can be sent to the shuffle from a **single** map task (for this tiny input, one map might see all 10 lines)? (c) Why does the combiner reduce network cost at scale?

## Exercise 8
**Skew case — Clicks–Users:** Using the Clicks and Users samples (user_id 101 has 5 clicks, 102 has 2, 103 has 1), (a) With default partition hash(user_id) mod R and R = 3, which reducer gets user_id 101? (b) How many **click records** does that reducer receive? (c) If at scale user_id 101 had 1 billion clicks and others had &lt; 1000, what failure would you expect? (d) In one sentence, what does **salting** do to the key for the large table (Clicks)?

## Exercise 9
**Salting design:** To mitigate the hot key 101, we use N = 3 salt buckets. (a) For **Clicks**: how do we modify the emit key so that 101's clicks go to 3 different reducers? (b) For **Users**: how many times do we emit the row (101, "Alice") and with what keys? (c) After the join, do we need an extra step to merge rows? Why or why not?

## Exercise 10
**Cost estimate:** Assume 1 billion lines, 100 bytes/line (100 GB input), word count with 1 million distinct words. (a) Roughly how many **(word, 1)** pairs are emitted by Map? (Assume 10 words/line on average.) (b) If shuffle sends 50 GB, and we have 100 reducers, what is the approximate **average** bytes per reducer? (c) If one word appears in 10% of all lines (skew), how many values does one reducer get for that word? (Order of magnitude.)

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: skew mitigation and diagram.** (a) **Architecture:** For a join of **Users (1 GB)** and **Clicks (10 TB)** with one hot user_id (1 billion clicks), describe the **salted join** in three steps: (1) how the large table (Clicks) emits keys, (2) how the small table (Users) emits keys for the hot user, (3) what each reducer receives and outputs. (b) **Diagram:** Reference the salting flow (large table → salted keys to N reducers; small table → replicate hot key to N reducers). Diagram: week7_practice_slide18_skew_salting.puml (c) **Trade-off:** What is the cost of replicating the small-table row for the hot key N times? When is it acceptable?

## Solutions

## Solution 1
- **Unique words:** data, eng, fun. **Distinct keys:** 3.

## Solution 2
- **Partition rule:** partition_id = hash(key) mod R; same key → same reducer.
- If hash("data") mod 3 = 0, the key "data" goes to **reducer 0**.

## Solution 3
- **Combiner:** Optional local reduce on map output before shuffle; reduces bytes sent.
- For word count, sum is associative and commutative, so combiner is correct. For count distinct, merging two sets is not a simple sum; a naive combiner can overcount unless we use a distinct structure (e.g. HyperLogLog) or accept approximation.

## Solution 4
- **Data skew:** Unequal distribution of data per key; some keys have far more values than others.
- One reducer gets 100× more values → much more memory and CPU → OOM risk or straggler; job latency equals that reducer's finish time.

## Solution 5
- **Hot key:** user_id 101 (5 clicks). **Reducer for 101:** receives 5 click records (and 1 user row after shuffle).

## Solution 6
- **(a) Map output for lines 1–3:** Line 1: (data,1), (eng,1), (data,1). Line 2: (eng,1), (data,1), (fun,1). Line 3: (data,1), (data,1), (data,1). Full list: (data,1)×5, (eng,1)×2, (fun,1)×1 for lines 1–3.
- **(b) Partition:** "data"→R0, "eng"→R1, "fun"→R2.
- **(c) Reducer inputs/outputs:** R0: key "data", values [1,1,...] (11 ones) → output ("data", 11). R1: key "eng", values [1,1,...] (6 ones) → ("eng", 6). R2: key "fun", values [1,1,...] (5 ones) → ("fun", 5). (Counts from full 10 lines.)
- **(d) Final:** data 11, eng 6, fun 5.

## Solution 7
- **(a) Total map output pairs:** Count words in 10 lines: 3+3+3+2+3+1+2+2+3+1 = 22 pairs.
- **(b) With combiner (one map for all 10 lines):** After local sum: (data, 11), (eng, 6), (fun, 5) → 3 pairs to shuffle (max for this map).
- **(c) At scale:** Combiner reduces bytes sent over network and written to disk; fewer spills; reducers receive pre-aggregated counts.

## Solution 8
- **(a)** Partition = hash(101) mod 3; assume it maps to reducer 1 (value depends on hash).
- **(b)** Reducer for 101 receives **5** click records (and 1 user row).
- **(c)** At scale: that reducer would get 1 billion records → OOM or extreme straggler; job fails or times out.
- **(d) Salting (large table):** Emit (user_id-salt, click) so hot key's records are spread across N reducers (e.g. (101-1, click), (101-2, click), (101-3, click)).

## Solution 9
- **(a) Clicks:** Emit (101-1, click), (101-2, click), (101-3, click) for user_id 101 (e.g. round-robin or hash(click_id) mod 3); each reducer gets ~1/3 of 101's clicks.
- **(b) Users:** Emit (101-1, "Alice"), (101-2, "Alice"), (101-3, "Alice") so every reducer that gets 101-X clicks also gets the user row.
- **(c)** Reducer output is (101-X, (user, click)); we can drop the salt and output (101, (user, click)) or merge in a second job; for a simple join we often output (user_id, joined_row) and the salt was only for distribution.

## Solution 10
- **(a)** ~10 words/line × 1B lines = **10B** (word, 1) pairs (order of magnitude).
- **(b)** 50 GB / 100 reducers ≈ **500 MB** per reducer on average.
- **(c)** 10% of 10B = 1B values for one key; one reducer gets **~1 billion** values (order of magnitude) → severe skew.

## Solution 11 (Challenge)
- **(a) Salted join:** (1) **Clicks (large):** For hot user_id 888, emit (888-1, click), (888-2, click), ..., (888-N, click); other keys unchanged. (2) **Users (small):** For 888, emit (888-1, user), (888-2, user), ..., (888-N, user). (3) **Reducer:** Each reducer 888-i gets 1/N of 888's clicks and the user row; performs join; outputs (888, (user, click)) for each pair.
- **(b)** Diagram: week7_practice_slide18_skew_salting.puml — large table emits salted keys to N reducers; small table replicates hot key to N reducers.
- **(c) Trade-off:** Replicating the small-table row N times for the hot key increases small-table traffic by N for that key; acceptable when the small table is small (e.g. 1 GB) and the hot key is few; avoids OOM on the large side.

# Practice 8

# Week 8: Text Processing at Scale: TF-IDF — Practice

## Instructions
- Engineering course: show reasoning and calculations
- TF-IDF: show TF, IDF, TF-IDF formulas and numeric steps
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs where applicable
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Documents corpus (TF-IDF and MapReduce)

**Schema:** Input: (doc_id, text). Tokenize: lowercase, split on whitespace. Output: (doc_id, term, tfidf).

**Sample input (10 documents):**

| doc_id | text                         |
|--------|------------------------------|
| 1      | data engineering data        |
| 2      | engineering systems          |
| 3      | data data data               |
| 4      | systems data                 |
| 5      | data engineering systems     |
| 6      | engineering                  |
| 7      | data systems                 |
| 8      | the data the engineering     |
| 9      | the systems the data         |
| 10     | the the the                  |

**Approximate scale (for cost exercises):** 10 docs here; assume 1 million docs, ~200 terms/doc avg, 500K distinct terms; 100 reducers for MapReduce.

**Keys / partitions:** MapReduce Job 1: key (doc_id, term); Job 2: key = term; partition = hash(key) mod R.

**Access patterns:** Compute TF-IDF per (doc_id, term); query by term or doc_id for search index.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (word count map/shuffle/reduce), solution format with step-by-step and check.
- exercises2.md: Inverted index (map emit (word, (doc_id, pos)), reducer sorts postings); data skew and salting (hot key, salt and replicate); shuffle anatomy and cost.

## Diagram Manifest
- Slide 18 → week8_practice_slide20_tfidf_mapreduce_skew.puml → TF-IDF Job 2 skew: term "the" hot reducer; stop-list mitigation

## Warm-up Exercises

## Exercise 1
For the **Documents** Data Context (10 docs), list the **unique terms** after tokenization (lowercase, split). How many distinct terms are there? Which term appears in the most documents?

## Exercise 2
Define **TF** (term frequency) and **IDF** (inverse document frequency) in one sentence each. Write the formula for TF-IDF score.

## Exercise 3
Using the 10-doc corpus, what is **N** (total documents)? For the term "data", how many documents contain it? So what is **df("data")**?

## Exercise 4
Compute **IDF** for "data", "engineering", "systems", and "the" with smoothing: \(\text{idf}(t) = \log\frac{N+1}{df(t)+1}\), N=10. Use natural log. Which term has the highest IDF and why?

## Exercise 5
In MapReduce Job 2 for TF-IDF (computing df per term), what is the **partition rule**? If R=3 and hash("the") mod 3 = 0, which reducer gets the key "the"? What happens to that reducer if "the" appears in every document?

## Engineering Exercises

## Exercise 6
**TF-IDF by hand (docs 1–3 only):** Using docs 1, 2, 3 from Data Context (ignore docs 4–10). (a) Compute **term counts** per (doc_id, term) and **doc lengths**. (b) Compute **df** for each term (only over docs 1–3) and **N=3**. (c) Compute **IDF** with \(\log\frac{N+1}{df+1}\). (d) Compute **TF** (normalized: count/|d|) and **TF-IDF** for (D1, data), (D1, engineering), (D2, engineering), (D2, systems), (D3, data). Show numeric values (2 decimal places).

## Exercise 7
**Full MapReduce walkthrough (Job 1 — term count per doc):** Using the full 10-doc input, Job 1 emits ((doc_id, term), 1). (a) List **Map output** for docs 8, 9, 10 only (all (k,v) pairs). (b) Assume R=4 and partition = hash(key) mod 4. For key ("8", "the"), assume partition 0; for ("8", "data"), partition 1; for ("8", "engineering"), partition 2. Which **reducer** gets ("8", "the")? (c) For the reducer that receives key ("8", "the"), give **input** (key and list of values) and **output** (key, sum). (d) What is the total number of **map output pairs** for the full 10 docs (count all terms)?

## Exercise 8
**Shuffle size (Job 2):** Job 2 computes df: Map emits (term, doc_id) for each (doc_id, term). (a) How many **(term, doc_id)** pairs are emitted for the full 10 docs? (b) Which **term** appears in the most documents? How many pairs (term, doc_id) will the reducer for that term receive? (c) If at scale we had 1M docs and "the" appeared in all 1M docs, what would the reducer for "the" receive? What failure is likely?

## Exercise 9
**Skew mitigation — stop list:** To avoid hot reducer for "the", we filter out "the" in the Map of Job 1 (and thus never emit (term, doc_id) for "the" in Job 2). (a) After filtering "the", how many (term, doc_id) pairs are emitted for doc 8? (b) Is the final TF-IDF output still correct for ranking documents that contain "the"? Explain in one sentence (e.g. do we need "the" in the index?).

## Exercise 10
**Cost estimate:** Assume 1M docs, 200 terms/doc avg, 500K distinct terms, 100 reducers. (a) Roughly how many **(doc_id, term, 1)** pairs does Job 1 Map emit? (b) If Job 2 shuffle sends (term, doc_id) and we have 100 reducers, what is the **average** number of (term, doc_id) pairs per reducer if keys are balanced? (c) If "the" appears in 80% of docs (skew), how many pairs does the reducer for "the" get? Order of magnitude.

## Challenge Exercise

## Exercise 11 (Challenge)
**Multi-part: TF-IDF pipeline and skew diagram.** (a) **Pipeline:** For the 10-doc corpus, describe the **three MapReduce jobs** for TF-IDF in order: Job 1 (outputs?), Job 2 (outputs?), Job 3 (inputs and output?). (b) **Skew:** Explain why Job 2 partitions by term and why the term "the" causes one reducer to receive most of the (term, doc_id) pairs. (c) **Diagram:** Draw the flow: Job 2 Map emits (term, doc_id) → Shuffle by term → one reducer gets "the" with 10 doc_ids (hot). Show stop-list mitigation: filter "the" in Map so Job 2 never sees it. Diagram: week8_practice_slide20_tfidf_mapreduce_skew.puml (d) **Trade-off:** What do we lose by removing "the" from the index? When is it acceptable?

## Solutions

## Solution 1
- **Unique terms (lowercase, split):** data, engineering, systems, the. **Distinct terms:** 4.
- **Most documents:** "the" appears in docs 8, 9, 10 → 3 docs; "data" in 1,3,4,5,7,8,9 → 7 docs. So "data" appears in the most documents (7).

## Solution 2
- **TF:** Term frequency = how often the term appears in the document (raw count or normalized by doc length).
- **IDF:** Inverse document frequency = log(N/df) or log((N+1)/(df+1)); N = total docs, df = docs containing the term; down-weights common terms.
- **TF-IDF:** tfidf(t,d) = TF(t,d) × IDF(t).

## Solution 3
- **N** = 10 (total documents).
- **"data"** appears in docs 1, 3, 4, 5, 7, 8, 9 → **df("data")** = 7.

## Solution 4
- **IDF** = log((N+1)/(df+1)) = log(11/(df+1)). data: log(11/8)≈0.32; engineering: df=5 → log(11/6)≈0.60; systems: df=5 → log(11/6)≈0.60; the: df=3 → log(11/4)≈1.01.
- **Highest IDF:** "the" (only in 3 docs); "data" lowest (in 7 docs). Rare terms get higher IDF.

## Solution 5
- **Partition rule:** partition_id = hash(key) mod R; same term → same reducer.
- **Reducer for "the":** If hash("the") mod 3 = 0, key "the" goes to **reducer 0**.
- **If "the" in every doc:** Reducer 0 receives 10 (doc_id) values for 10 docs; at scale (1M docs) it would receive 1M values → OOM or straggler.

## Solution 6
- **(a) Term counts (docs 1–3):** D1: data 2, engineering 1; D2: engineering 1, systems 1; D3: data 3. Doc lengths: |D1|=3, |D2|=2, |D3|=3.
- **(b) df (N=3):** data: 2 (D1,D3), engineering: 2 (D1,D2), systems: 1 (D2). N=3.
- **(c) IDF:** idf(data)=log(4/3)≈0.29, idf(engineering)=log(4/3)≈0.29, idf(systems)=log(4/2)=log(2)≈0.69.
- **(d) TF (norm) and TF-IDF:** D1: (data, 2/3, 2/3×0.29≈0.19), (engineering, 1/3, 1/3×0.29≈0.10). D2: (engineering, 1/2, 0.14), (systems, 1/2, 0.35). D3: (data, 3/3=1, 1×0.29≈0.29).

## Solution 7
- **(a) Map output docs 8,9,10:** Doc 8: (("8","the"),1), (("8","data"),1), (("8","the"),1), (("8","engineering"),1). Doc 9: (("9","the"),1), (("9","systems"),1), (("9","the"),1), (("9","data"),1). Doc 10: (("10","the"),1)×3. Full list for 8,9,10: ("8","the")×2, ("8","data")×1, ("8","engineering")×1, ("9","the")×2, ("9","systems")×1, ("9","data")×1, ("10","the")×3.
- **(b)** Key ("8","the") → partition 0 → **reducer 0** (assuming hash gives 0).
- **(c) Reducer for ("8","the"):** Input: key ("8","the"), values [1,1]. Output: ("8","the", 2).
- **(d) Total map output pairs (10 docs):** Count terms: 3+2+3+2+3+1+2+4+4+3 = 27 pairs.

## Solution 8
- **(a)** One (term, doc_id) per (doc_id, term) in corpus. Same count as term occurrences if we emit per occurrence; if we emit distinct (term, doc_id) per doc, we count unique (term, doc) pairs. For 10 docs: e.g. 27 term occurrences → 27 (term, doc_id) pairs if we emit per occurrence; for df we need distinct (term, doc_id), so one emit per (term, doc_id) per doc: e.g. ("the", 8), ("the", 9), ("the", 10), ... Total distinct (term, doc_id) for 10 docs: data 7, engineering 5, systems 5, the 3 → 20 pairs.
- **(b)** "data" in 7 docs → reducer for "data" receives 7 (term, doc_id) pairs (or 7 doc_ids). "the" in 3 docs → 3 pairs.
- **(c)** At scale: reducer for "the" receives 1M (doc_id) values → OOM or timeout; job fails or straggler.

## Solution 9
- **(a) After filtering "the":** Doc 8 terms: data, engineering. So 2 (term, doc_id) pairs for doc 8 (("data", 8), ("engineering", 8)).
- **(b)** For ranking, stop words like "the" usually add little discriminative power; removing them keeps index smaller and avoids skew. We lose ability to rank by "the" (rarely needed). Acceptable when stop words are not query terms of interest.

## Solution 10
- **(a)** 1M × 200 = **200M** (doc_id, term, 1) pairs (order of magnitude).
- **(b)** 200M (term, doc_id) pairs / 100 reducers ≈ **2M** pairs per reducer on average (if balanced).
- **(c)** 80% of 1M = 800K docs; reducer for "the" gets **~800K** values → severe skew.

## Solution 11 (Challenge)
- **(a) Pipeline:** Job 1: (doc_id, text) → Map tokenize, emit ((doc_id, term), 1) → Reduce sum → (doc_id, term, count); side output doc lengths. Job 2: (doc_id, term) → Map emit (term, doc_id) → Reduce count distinct docs → (term, df); N from counter or Job 1. Job 3: Join (doc_id, term, count) with (term, idf) and (doc_id, |d|) → compute TF-IDF → (doc_id, term, tfidf).
- **(b)** Job 2 partitions by term so one reducer gets all doc_ids for that term to count df. "the" in 10 docs → reducer for "the" gets 10 (doc_id); at scale, "the" in all docs → one reducer gets all N doc_ids → hot reducer.
- **(c)** Diagram: week8_practice_slide20_tfidf_mapreduce_skew.puml — Job 2 Map → (term, doc_id) → Shuffle by term → Reducer "the" gets 10 doc_ids (hot); stop-list: filter "the" in Job 1 Map so no (the, doc_id) in Job 2.
- **(d) Trade-off:** We lose "the" in the index; queries for "the" return no or incomplete results. Acceptable when "the" is a stop word and not used for ranking; most search engines drop stop words.

# Practice 9

# Week 9: Advanced Text Processing Techniques — Practice

## Instructions
- Engineering course: show reasoning and calculations
- N-grams: show extraction steps, counts, and optional TF-IDF where asked
- MapReduce: show Map emits (k,v), Shuffle groups, Reduce outputs where applicable
- All exercises use the Data Context below

## Data Context (MANDATORY)

### Documents corpus (n-grams and MapReduce)

**Schema:** Input: (doc_id, text). Tokenize: lowercase, split on whitespace. N-grams: word bigrams (n=2). Output: (doc_id, ngram, count) or (doc_id, ngram, tfidf).

**Sample input (10 documents):**

| doc_id | text                         |
|--------|------------------------------|
| 1      | data engineering data        |
| 2      | engineering systems           |
| 3      | data data data                |
| 4      | systems data                  |
| 5      | data engineering systems      |
| 6      | engineering                   |
| 7      | data systems                  |
| 8      | the data the engineering      |
| 9      | the systems the data          |
| 10     | the the the                   |

**Approximate scale (for cost exercises):** 10 docs here; assume 1 million docs, ~200 terms/doc avg, bigrams; 100 reducers for MapReduce.

**Keys / partitions:** MapReduce: key (doc_id, ngram); partition = hash(key) mod R. Optional df job: key = ngram.

**Access patterns:** Compute n-gram counts per (doc_id, ngram); query by ngram or doc_id for search/index.

## Reference Exercises Used (Root)
- exercises1.md: MapReduce manual execution (map/shuffle/reduce), ETL dedup and idempotent merge pattern.
- exercises2.md: Inverted index (map emit (word, (doc_id, pos))), data skew and salting (hot key, salt and replicate); shuffle anatomy and cost; regex/schema-on-read in ingestion.

## Diagram Manifest
- Slide 19 → week9_practice_slide19_ngram_pipeline_reasoning.puml → N-gram pipeline: docs → tokenize → n-gram extract → aggregate → output; skew note

## Warm-up Exercises

## Exercise 1
For the **Documents** Data Context (10 docs), list all **unique bigrams** (word n-gram, n=2) after tokenization (lowercase, split). How many distinct bigrams are there? Which bigram appears in the most documents?

## Exercise 2
Define **word n-gram** and **character n-gram** in one sentence each. For the string "data", list all character trigrams (n=3).

## Exercise 3
Using the 10-doc corpus, for the bigram "data_engineering": (a) In which documents does it appear? (b) What is the **count** of "data_engineering" in doc 1? In doc 5?

## Exercise 4
What is **vocabulary size** (upper bound) for word bigrams if the unigram vocabulary has \(V = 50{,}000\) terms? Why is the actual number of distinct bigrams usually much smaller?

## Exercise 5
In a MapReduce job that emits ((doc_id, ngram), 1) and partitions by (doc_id, ngram), what is the **partition rule**? If R=4 and we use hash(doc_id || ngram) mod 4, which reducer receives the key (1, "data_engineering")? Could one reducer get a very large number of values for a single key?

## Engineering Exercises

## Exercise 6
**Bigram counts by hand (docs 1–3 only):** Using docs 1, 2, 3 from Data Context. (a) Tokenize and list all **bigrams** per doc. (b) Compute **count** per (doc_id, ngram). (c) How many distinct (doc_id, ngram) pairs are there? Show a small table.

## Exercise 7
**Full MapReduce walkthrough (bigram count):** Using the full 10-doc input, Map emits ((doc_id, ngram), 1). (a) List **Map output** for docs 8, 9, 10 only (all (key, value) pairs). (b) Assume R=4 and partition = hash(key) mod 4. For the key (8, "the_data"), assume partition 2. Which **reducer** gets (8, "the_data")? (c) For the reducer that receives key (8, "the_data"), give **input** (key and list of values) and **output** (key, sum). (d) What is the total number of **map output pairs** for the full 10 docs?

## Exercise 8
**Shuffle size:** (a) For the 10-doc corpus, how many ((doc_id, ngram), 1) pairs does Map emit (total)? (b) After **combiner** (sum per (doc_id, ngram)), how many (key, count) pairs are sent to shuffle? (c) If at scale we had 1M docs and 200 terms/doc (bigrams), order-of-magnitude how many pairs without combiner? With combiner (assume 10^7 distinct (doc_id, ngram))?

## Exercise 9
**Skew — df by ngram:** Suppose we add a second job that computes **document frequency** of each bigram: Map emits (ngram, doc_id) for each (doc_id, ngram). Partition by ngram. (a) Which bigram in our 10-doc corpus appears in the most documents? (b) How many (ngram, doc_id) pairs will the reducer for that bigram receive? (c) If at scale "the_data" appeared in 80% of 1M docs, what would the reducer for "the_data" receive? What failure is likely?

## Exercise 10
**Cost estimate:** Assume 1M docs, 200 terms/doc avg, bigrams, 100 reducers. (a) Roughly how many ((doc_id, ngram), 1) pairs does Map emit? (b) What is the **average** number of keys per reducer if partition is by (doc_id, ngram) and keys are balanced? (c) If we partition by ngram only for a df job and "the_data" is in 800K docs, how many values does that reducer get? Order of magnitude.

## Exercise 11
**Regex:** A pipeline uses the regex `^[a-zA-Z0-9\s]+$` to validate that a line contains only letters, digits, and spaces. (a) What does this pattern match? (b) Why might a pattern like `(a+)+b` be dangerous on long input? (c) Suggest one mitigation (timeout, engine, or pattern change).

## Challenge Exercise

## Exercise 12 (Challenge)
**Multi-part: N-gram pipeline and skew.** (a) **Pipeline:** For the 10-doc corpus, describe the **single MapReduce job** for bigram counts: Map input/output, partition key, Reduce input/output. (b) **Skew:** If we added a second job to compute df(ngram) with partition by ngram, explain why the bigram "the_data" (or "the_engineering") could cause one reducer to receive most of the (ngram, doc_id) pairs. (c) **Diagram:** Draw the flow: tokenize → n-gram extract → Map emit ((doc_id, ngram), 1) → Shuffle by (doc_id, ngram) → Reduce sum. Show where combiner fits. Diagram: week9_practice_slide19_ngram_pipeline_reasoning.puml (d) **Mitigation:** How would you avoid the hot reducer in the df job (filter, partition, or cap)?

## Solutions

## Solution 1
- **Unique bigrams (lowercase, split):** data_engineering, engineering_data, engineering_systems, data_data, systems_data, data_systems, the_data, data_the, the_engineering, the_systems, systems_the, the_the. **Distinct:** 12. Doc 6 has one token ⇒ no bigram.
- **Most documents:** "the_data" in docs 8, 9; "data_engineering" in 1, 5; "engineering_systems" in 2, 5. So "the_data" and "data_engineering" and "engineering_systems" each in 2 docs (tie).

## Solution 2
- **Word n-gram:** Contiguous sequence of \(n\) tokens from a tokenized text (e.g. bigram = two consecutive words).
- **Character n-gram:** Contiguous substring of length \(n\) from the character sequence (e.g. trigram = three consecutive characters).
- **Char trigrams of "data":** "dat", "ata" (only two; length 4 ⇒ 4−3+1 = 2 trigrams).

## Solution 3
- (a) "data_engineering" appears in docs 1 and 5 (token sequences [data, engineering, ...]).
- (b) Doc 1: count = 1 (one occurrence: data, engineering). Doc 5: count = 1 (data, engineering, systems ⇒ one "data_engineering").

## Solution 4
- **Upper bound:** \(V^2 = 50{,}000^2 = 2.5 \times 10^9\) possible bigrams.
- **Actual smaller:** Most word pairs never co-occur; corpus uses a small subset of possible combinations; Zipfian distribution ⇒ few bigrams are frequent, many rare or zero.

## Solution 5
- **Partition rule:** key = (doc_id, ngram); partition index = hash(key) mod R; same key always to same reducer.
- **(1, "data_engineering")** goes to reducer hash(1 || "data_engineering") mod 4; depends on hash function.
- **Large values per key:** No; each key (doc_id, ngram) has one count per (doc_id, ngram) after combiner. So at most one value per key in reduce (or many 1s before combiner). Reducer receives one key and one sum (or list of 1s to sum).

## Solution 6
- (a) **Doc 1:** [data, engineering, data] → bigrams: (data_engineering, 1), (engineering_data, 1). **Doc 2:** [engineering, systems] → (engineering_systems, 1). **Doc 3:** [data, data, data] → (data_data, 2).
- (b) **Counts:** (1, data_engineering, 1), (1, engineering_data, 1), (2, engineering_systems, 1), (3, data_data, 2).
- (c) **Distinct (doc_id, ngram):** 4 pairs.

## Solution 7
- (a) **Doc 8:** [the, data, the, engineering] → (8, the_data, 1), (8, data_the, 1), (8, the_engineering, 1). **Doc 9:** [the, systems, the, data] → (9, the_systems, 1), (9, systems_the, 1), (9, the_data, 1). **Doc 10:** [the, the, the] → (10, the_the, 2).
- (b) Partition = hash((8, "the_data")) mod 4 = 2 ⇒ **reducer 2**.
- (c) **Input:** key (8, "the_data"), values [1]. **Output:** (8, "the_data", 1).
- (d) **Total map output pairs:** Count bigrams: doc 1: 2, 2: 1, 3: 2, 4: 1, 5: 2, 6: 0, 7: 1, 8: 3, 9: 3, 10: 2. Sum = 15.

## Solution 8
- (a) **Total Map emits:** 15 (from Solution 7d).
- (b) **After combiner:** 15 pairs (each (doc_id, ngram) appears once per doc; combiner sums 1s ⇒ same 15 (key, count) with count≥1).
- (c) **Scale, no combiner:** 1M × 199 ≈ 2×10^8 pairs. **With combiner:** 10^7 distinct (doc_id, ngram) ⇒ 10^7 pairs (smaller payload per key).

## Solution 9
- (a) **Most documents:** "the_data" in docs 8, 9; "the_engineering" in 8; "the_systems" in 9; "data_engineering" in 1, 5. So "the_data" in 2 docs; same for others. For 10-doc corpus, max df = 2.
- (b) **Reducer for that bigram:** 2 (ngram, doc_id) pairs (e.g. ("the_data", 8), ("the_data", 9)).
- (c) **Scale:** "the_data" in 800K docs ⇒ reducer gets 800K values ⇒ **OOM or straggler**. **Failure:** Out-of-memory or timeout.

## Solution 10
- (a) **Map output pairs:** 1M × 199 ≈ **2×10^8** (with bigrams).
- (b) **Avg keys per reducer:** 2×10^8 / 100 = 2×10^6 keys per reducer (if we count key occurrences; for distinct (doc_id, ngram), distinct keys per reducer ≈ 10^7/100 = 10^5).
- (c) **df job, "the_data" in 800K docs:** Reducer for "the_data" gets **8×10^5** values (order of magnitude).

## Solution 11
- (a) **Pattern:** Matches a string that **only** contains letters, digits, and spaces (from start to end).
- (b) **(a+)+b** is dangerous: on input with many 'a' and no 'b', the engine backtracks over all possible splits of (a+) ⇒ **catastrophic backtracking**, exponential time.
- (c) **Mitigation:** Use a **timeout** per record; or **possessive** (a++)+b; or **non-backtracking** engine; or avoid nested quantifiers on untrusted input.

## Solution 12
- (a) **Job:** Map: (doc_id, text) → tokenize → emit ((doc_id, ngram), 1) for each bigram. Partition by (doc_id, ngram). Reduce: key (doc_id, ngram), values [1,1,...] → sum → (doc_id, ngram, count). Combiner: same as reduce.
- (b) **Skew:** Partition by ngram sends all (ngram, doc_id) with same ngram to one reducer. "the_data" in many docs ⇒ one reducer gets most pairs ⇒ hot reducer.
- (c) **Diagram:** week9_practice_slide19_ngram_pipeline_reasoning.puml — docs → tokenize → n-gram extract → Map ((doc_id, ngram), 1) → Combiner → Shuffle → Reduce → (doc_id, ngram, count).
- (d) **Mitigation:** Filter **stop-ngrams** (e.g. "the_data") in Map so they are not emitted for df job; or **partition by (doc_id, ngram)** for count job and compute df in a separate pass with **cap** on df per ngram; or **sample** for df and extrapolate.

# Practice 10

# Week 10: Streaming Data and Real-Time Processing — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Use concrete events, timestamps, and window boundaries in answers
- For cost and latency: state assumptions and units (events/sec, minutes, bytes)
- Failure scenarios: explain idempotency and late-data handling

## Data Context (MANDATORY)

### Event stream: clicks

**Schema:** `(event_id, user_id, event_time, amount)`  
- `event_id`: unique per event (INT)  
- `user_id`: user identifier (VARCHAR, e.g. 'A', 'B')  
- `event_time`: when the event occurred (TIMESTAMP, minute granularity)  
- `amount`: numeric value to aggregate (DECIMAL, e.g. spend or count)

**Sample events (ordered by event_time):**

| event_id | user_id | event_time | amount |
|----------|---------|------------|--------|
| e1       | A       | 10:00      | 5      |
| e2       | B       | 10:02      | 3      |
| e3       | A       | 10:04      | 2      |
| e4       | B       | 10:06      | 1      |
| e5       | A       | 10:08      | 4      |
| e6       | B       | 10:10      | 2      |
| e7 (late)| A       | 10:01      | 1      |

**Note:** e7 arrives late (processing_time after e6); event_time 10:01 belongs to window [10:00, 10:05).

**Sink table (window aggregates):**  
`window_agg(window_start TIMESTAMP, user_id VARCHAR, sum_amount DECIMAL, PRIMARY KEY (window_start, user_id))`  
- One row per (window, user); upsert for idempotency.

**Scale (for exercises):** 100K events/day; 5K distinct users; tumbling windows 5 min; watermark delay 2 min.

### Access patterns
- Events: append-only stream; consumed in event_time order (or out-of-order)
- Sink: write by (window_start, user_id); read by window_start or user_id for dashboards

## Reference Exercises Used (Root)
- exercises1.md: Failure and Reprocessing (Kafka duplicates, idempotent sink, exactly-once semantics); ETL dedup and MERGE style adapted to streaming upsert.
- exercises2.md: Module 3 Incremental Loading and High-Water Marking (safety buffer, watermark); idempotent merge; Module 4 time-series and hot partition (skew) adapted to hot key in streams.

## Diagram Manifest
- Slide 18 → week10_practice_slide18_window_late_reasoning.puml → Window aggregate and late-data reasoning

## Warm-up Exercises
- Short definitions and one-sentence reasoning
- Use the event stream and sink schema from Data Context
- Prepare for window and watermark questions in Engineering section

## Exercise 1
Define **event-time** and **processing-time** in one sentence each. Why do we use event-time for window aggregation?

## Exercise 2
What is a **watermark** in streaming? In one sentence, when does a tumbling window [10:00, 10:05) get closed and its result emitted?

## Exercise 3
List the **three** delivery semantics (at-most-once, at-least-once, exactly-once). Which one usually requires an idempotent sink?

## Exercise 4
For the sample events e1–e6 (ignore e7), assign each event to a **tumbling 5-minute** window (event_time). Give window start and the list of (user_id, amount) in that window.

## Exercise 5
Event e7 has event_time 10:01 but arrives after the pipeline has already closed window [10:00, 10:05) and emitted results. What are two options to handle e7? One sentence each.

## Engineering Exercises
- Use sample events e1–e6 (and e7 where noted); show calculations
- State assumptions for throughput, latency, and state size
- Idempotent sink and late-data handling required in answers

## Exercise 6
**Window aggregate (manual):** For events e1–e6 only, compute **sum(amount) per user** in window [10:00, 10:05). Then compute sum(amount) per user in window [10:05, 10:10). Show the two result rows (window_start, user_id, sum_amount).

## Exercise 7
**Late data:** Suppose window [10:00, 10:05) was closed and we emitted (10:00, A, 7), (10:00, B, 3). Then e7 (A, 10:01, 1) arrives. What is the **correct** sum for user A in [10:00, 10:05) if we include e7? If the sink is idempotent (upsert by (window_start, user_id)), what single write do we need to correct the result?

## Exercise 8
**Throughput and latency:** Assume 100K events/day, watermark delay 2 min, tumbling 5 min. Estimate (a) average events per window per user (5K users), and (b) minimum result latency (time from event_time 10:04 to emission of window [10:00, 10:05)) in minutes. State assumptions.

## Exercise 9
**State size:** For 5K users and tumbling 5-min windows, how many **active** window buffers do we hold per user at any time? What is the order of magnitude of state size if each buffer holds one sum (e.g. 8 bytes)? Assume no allowed lateness.

## Exercise 10
**Idempotent sink:** The job crashes after writing (10:00, A, 7) and (10:00, B, 3) but before committing the consumer offset. On restart, the job replays events e1–e6 and recomputes the same aggregates. Explain why writing (10:00, A, 7) and (10:00, B, 3) again to the sink does **not** create duplicate rows. What key constraint on the sink table is required?

## Challenge Exercise
- Multi-part: (a) diagram and handling of e7, (b) trade-off, (c) diagram reference
- Architecture-level reasoning: state, latency, correctness
- Diagram required: week10_practice_slide18_window_late_reasoning.puml

## Exercise 11
**Multi-part — architecture and late data:**  
(a) Draw or reference a diagram showing: stream (e1–e6 + late e7) → tumbling windows [10:00,10:05) and [10:05,10:10) → aggregate per user → sink. Show where e7 would be handled (dropped vs allowed lateness).  
(b) If we **allow lateness** 3 min, we can retract (10:00, A, 7) and emit (10:00, A, 8). What is the trade-off in state size and result latency when allowing 3 min lateness vs dropping late events?  
(c) Diagram: week10_practice_slide18_window_late_reasoning.puml — use it to support your reasoning.

## Solutions

## Solution 1
- **Event-time:** the timestamp when the event actually occurred (from the data).
- **Processing-time:** the time when the pipeline processes the event (system clock).
- **Why event-time for windows:** so that results are deterministic and correct under out-of-order arrival and reprocessing; same events ⇒ same window assignment and aggregates.

## Solution 2
- **Watermark:** a monotonically advancing bound on event-time; "no event with event_time < T will arrive."
- **When window closes:** when the watermark reaches or passes the window end (e.g. 10:05); then the window [10:00, 10:05) is closed and its aggregate is emitted.

## Solution 3
- **At-most-once:** emit once, may lose on failure.
- **At-least-once:** retry on failure; duplicates possible.
- **Exactly-once:** no loss, no duplicate (transactional sink or dedup).
- **Idempotent sink:** required for **at-least-once** so that duplicate processing does not create duplicate rows (upsert by key).

## Solution 4
- **Window [10:00, 10:05):** e1 (A,5), e2 (B,3), e3 (A,2)  
- **Window [10:05, 10:10):** e4 (B,1), e5 (A,4), e6 (B,2)  
- e7 (A,1) has event_time 10:01 ⇒ belongs to [10:00, 10:05) but arrives late.

## Solution 5
- **Option 1:** Drop e7; result for [10:00, 10:05) stays (A,7), (B,3); possible undercount for A.
- **Option 2:** Allow lateness: retract (10:00, A, 7) and emit (10:00, A, 8); correct sum, more state and delayed final result.

## Solution 6
- **Window [10:00, 10:05):** A: 5+2 = 7; B: 3. → (10:00, A, 7), (10:00, B, 3).
- **Window [10:05, 10:10):** A: 4; B: 1+2 = 3. → (10:05, A, 4), (10:05, B, 3).

## Solution 7
- **Correct sum for A in [10:00, 10:05):** 7 + 1 = 8 (include e7).
- **Idempotent sink:** upsert (window_start=10:00, user_id=A, sum_amount=8). Same key (10:00, A) overwrites the previous row; one write updates A’s row to 8.

## Solution 8
- **Assumptions:** 100K events/day ≈ 69.4 events/min; 5K users; uniform over time and users (simplified).
- **(a) Events per window per user:** 5 min × 69.4 ≈ 347 events per 5 min total; per user ≈ 347/5000 ≈ 0.07; in practice skew (e.g. 20 events per window per active user, 5K users ⇒ order 100K/288 windows ≈ 347 per window total).
- **(b) Min result latency:** window [10:00, 10:05) closes when watermark ≥ 10:05. Watermark delay 2 min ⇒ watermark reaches 10:05 when latest event_time seen is 10:05, typically 2 min after 10:05 in processing-time. So latency from event_time 10:04 to emission ≥ 2 min (watermark delay) + processing; **≥ 2 min**.

## Solution 9
- **Active windows per user:** tumbling 5 min ⇒ at most **1** active window per user (current open window).
- **State:** 5K users × 1 window × 8 bytes (one sum) ≈ 40 KB; plus key overhead (window_start, user_id) ⇒ order of magnitude **tens of KB to low hundreds of KB**. With allowed lateness, multiple windows per user can be open ⇒ state larger.

## Solution 10
- **No duplicate rows:** the sink has PRIMARY KEY (window_start, user_id). Writing (10:00, A, 7) again is an **upsert**: same key (10:00, A) overwrites the existing row. So we still have one row per (window_start, user_id).
- **Constraint required:** unique key on (window_start, user_id) — e.g. PRIMARY KEY or UNIQUE — so that repeated writes for the same window and user update the same row (idempotent).

## Solution 11
- **(a)** Diagram: week10_practice_slide18_window_late_reasoning.puml. Stream e1–e6 → windows [10:00,10:05) and [10:05,10:10); aggregate per user → (10:00, A, 7), (10:00, B, 3), (10:05, A, 4), (10:05, B, 3). Late e7: if **dropped**, no change; if **allowed lateness**, e7 joins [10:00,10:05), we retract (10:00, A, 7) and emit (10:00, A, 8).
- **(b) Trade-off:** **Allow 3 min lateness:** state must hold window [10:00,10:05) for 3 min after watermark; possible retractions; correct result; higher state and slightly delayed “final” result. **Drop late:** smaller state, lower latency, but A’s sum for [10:00,10:05) is 7 (undercount).
- **(c)** The diagram shows “without late” vs “with late (allowed)”: same window, sum 10 vs 11 when late event (A, 10:01, 1) is included; idempotent sink updates the same row so the final stored value is correct.

# Practice 11

# Week 11: Feature Engineering for Data Systems — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Feature pipelines: point-in-time correctness; idempotent write on (entity_id, as_of_ts)
- Failure scenario: rerun must not duplicate feature rows

## Data Context (MANDATORY)

### Tables and schemas

**events** (raw user activity; append-only):
- `event_id INT`, `user_id INT`, `event_ts TIMESTAMP`, `event_type VARCHAR(20)`
- Sample: (1, 101, '2025-12-01 10:00:00', 'click'), (2, 101, '2025-12-02 14:00:00', 'view'), (3, 102, '2025-12-01 09:00:00', 'click'), (4, 101, '2025-12-03 08:00:00', 'click'), (5, 102, '2025-12-02 11:00:00', 'view')
- Keys: event_id (business key); no PK; duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day); partitioned by date(event_ts)

**user_features** (feature table; target):
- `user_id INT`, `as_of_ts TIMESTAMP`, `clicks_7d INT`, `views_7d INT`
- Sample: (101, '2025-12-02 23:59:59', 2, 1), (102, '2025-12-02 23:59:59', 1, 1)
- Keys: (user_id, as_of_ts) — primary or overwrite key; one row per (user_id, as_of_ts)
- Scale: ~10M users × 365 days ≈ 3.65B rows (partitioned by as_of_ts, e.g. by month)

**users** (dimension; optional for join):
- `user_id INT PRIMARY KEY`, `signup_ts TIMESTAMP`, `region VARCHAR(20)`
- Sample: (101, '2025-01-15 00:00:00', 'North'), (102, '2025-02-01 00:00:00', 'South')
- Scale: ~10M rows (100 MB)

**feature_job_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_as_of_ts TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('user_features_daily', '2025-12-02 23:59:59', '2025-12-03 06:00:00')
- Used for incremental feature compute (watermark on as_of_ts)

### Access patterns
- events: read by date partition; filter by event_ts <= as_of_ts for point-in-time
- user_features: read by (user_id, as_of_ts) or by as_of_ts range for training; write by MERGE/overwrite on (user_id, as_of_ts)
- users: read by user_id for join; small table

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw → clean, dedup, MERGE); Incremental (watermark, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun).
- exercises2.md: Module 1 (window functions, idempotent pipelines, SCD); Module 3 (watermarking, schema-on-read, incremental load).

## Diagram Manifest
- Slide 19 → week11_practice_slide20_reasoning_feature_flow.puml → feature pipeline reasoning (agg, join, write)

## Warm-up Exercises

## Exercise 1
Define **point-in-time correctness** for a feature in one sentence. Why is it required to avoid data leakage?

## Exercise 2
What is the **natural key** for a feature table that supports training and backtests? Why must a rerun not insert a second row for the same key?

## Exercise 3
Distinguish **offline** vs **online** feature consumption in one sentence each. Which one typically uses (entity_id, as_of_ts) range reads?

## Exercise 4
For **events** with user_id = 101 and as_of_ts = '2025-12-02 23:59:59', which events may be used to compute clicks_7d? (Give the time window.)

## Exercise 5
A feature job writes (user_id, as_of_ts, clicks_7d) with plain INSERT. The job is re-run for the same day. What goes wrong? One sentence.

## Engineering Exercises
- Point-in-time aggregation; idempotent MERGE; incremental job with watermark
- Numeric assumptions: table sizes, partition pruning; cost reasoning required
- Failure and rerun: no duplicate feature rows; control table updated after success

## Exercise 6
**Point-in-time aggregation:** Write SQL to compute `clicks_7d` and `views_7d` for each (user_id, as_of_ts) where as_of_ts is '2025-12-02 23:59:59' and '2025-12-03 23:59:59'. Use only events with event_ts <= as_of_ts and event_ts > as_of_ts - INTERVAL '7 days'. Output: user_id, as_of_ts, clicks_7d, views_7d. (Assume events table and a grid of (user_id, as_of_ts) from a CTE or cross join with a small dates table.)

## Exercise 7
**Idempotent write:** Assume you have a CTE `feature_rows` with (user_id, as_of_ts, clicks_7d, views_7d). Write a MERGE (or INSERT ... ON CONFLICT) into **user_features** so that (user_id, as_of_ts) is the key. On conflict, update clicks_7d and views_7d. Re-running the same feature_rows must not duplicate rows.

## Exercise 8
**Incremental feature job:** Assume **feature_job_control** has job_key = 'user_features_daily'. Describe in 3 bullets: (a) read last_as_of_ts from control; (b) compute features only for as_of_ts = last_as_of_ts + 1 day; (c) MERGE into user_features and update control only after successful write. Why update control only after success?

## Exercise 9
**Cost:** Assume 10M users, 365 as_of_ts points per year, 50 bytes per feature row. (a) Approximate feature table size in GB. (b) If training reads one month of as_of_ts (e.g. December), how does partitioning by as_of_ts (e.g. by month) reduce scan size? One sentence.

## Exercise 10
**Failure and rerun:** The feature job runs for as_of_ts = 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-01 and 2025-12-02 to user_features (control updated to 2025-12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is computed and written, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Challenge Exercise

## Challenge Exercise
- Multi-part; architecture-level reasoning; diagram required

## Exercise 11 (Multi-part)
- **(a)** Draw or reference a diagram of the feature pipeline: events + users → aggregate (clicks_7d, views_7d) with point-in-time → join to user dimension (as-of) → write to user_features with key (user_id, as_of_ts). Diagram: week11_practice_slide20_reasoning_feature_flow.puml
- **(b)** Explain why the join to **users** must be point-in-time: only use user rows where signup_ts <= as_of_ts. What goes wrong if you use the current user state?
- **(c)** If the write step used INSERT only (no MERGE), and the job is re-run for the same as_of_ts range, what is the impact on training? How do you fix it?

## Solutions
- Each solution matches exercise order; assumptions, plan, execution, check
- SQL in fenced blocks; step-by-step calculations where required

## Solution 1
- **Point-in-time correctness:** For a given as_of_ts, use only raw data with timestamp <= as_of_ts when computing the feature.
- **Why:** Using data after as_of_ts would leak future information into training or backtest, inflating accuracy and breaking production.

## Solution 2
- **Natural key:** (entity_id, as_of_ts) — e.g. (user_id, as_of_ts).
- **Rerun:** If the job inserts again for the same key, we get duplicate rows; training and joins would double-count or be ambiguous; idempotent write (MERGE/overwrite) avoids this.

## Solution 3
- **Offline:** Batch read of feature table by (entity_ids, as_of_ts range); used for training.
- **Online:** Low-latency lookup by entity_id (e.g. latest as_of_ts); used for serving.
- **Range reads:** Offline typically uses as_of_ts range; online uses key lookup.

## Solution 4
- **Window:** event_ts > '2025-11-25 23:59:59' AND event_ts <= '2025-12-02 23:59:59' (last 7 days at as_of_ts).
- Only events in that window may be used; events on 2025-12-03 must not be used.

## Solution 5
- **Wrong:** Re-run inserts the same (user_id, as_of_ts) again; user_features gets duplicate rows per key; training and backtests are wrong (e.g. duplicate rows per user per day).

## Solution 6
- **Assumptions:** events table; as_of_ts values in a small set (e.g. 2 dates); grid = distinct user_id from events cross join as_of_ts.
- **Plan:** For each (user_id, as_of_ts), count events where event_ts <= as_of_ts AND event_ts > as_of_ts - 7 days, split by event_type.

```sql
WITH as_of_dates AS (
  SELECT TIMESTAMP '2025-12-02 23:59:59' AS as_of_ts
  UNION ALL SELECT TIMESTAMP '2025-12-03 23:59:59'
),
grid AS (
  SELECT DISTINCT e.user_id, d.as_of_ts
  FROM events e
  CROSS JOIN as_of_dates d
),
counts AS (
  SELECT e.user_id, d.as_of_ts,
         SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicks_7d,
         SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) AS views_7d
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
  GROUP BY e.user_id, d.as_of_ts
)
SELECT g.user_id, g.as_of_ts,
       COALESCE(c.clicks_7d, 0) AS clicks_7d,
       COALESCE(c.views_7d, 0) AS views_7d
FROM grid g
LEFT JOIN counts c ON g.user_id = c.user_id AND g.as_of_ts = c.as_of_ts;
```

- **Check:** No event with event_ts > as_of_ts is used; correct 7-day window.

## Solution 7
- **Plan:** MERGE into user_features on (user_id, as_of_ts); when matched update; when not matched insert.

```sql
MERGE INTO user_features AS target
USING feature_rows AS source
ON target.user_id = source.user_id AND target.as_of_ts = source.as_of_ts
WHEN MATCHED THEN
  UPDATE SET clicks_7d = source.clicks_7d, views_7d = source.views_7d
WHEN NOT MATCHED THEN
  INSERT (user_id, as_of_ts, clicks_7d, views_7d)
  VALUES (source.user_id, source.as_of_ts, source.clicks_7d, source.views_7d);
```

- **Check:** Re-running with same feature_rows leaves one row per (user_id, as_of_ts); idempotent.

## Solution 8
- **(a)** SELECT last_as_of_ts FROM feature_job_control WHERE job_key = 'user_features_daily'.
- **(b)** Compute features for as_of_ts = last_as_of_ts + 1 day only (e.g. one new day); do not recompute all history.
- **(c)** MERGE into user_features; then UPDATE feature_job_control SET last_as_of_ts = new_as_of_ts, last_run_ts = NOW() WHERE job_key = 'user_features_daily'.
- **Why after success:** If we update control before write and write fails, next run would skip that as_of_ts and leave a gap; updating after success ensures we only advance when data is written.

## Solution 9
- **(a)** 10M × 365 × 50 B = 182.5e9 B ≈ 182.5 GB (or ~183 GB).
- **(b)** Partitioning by month limits scan to one month’s partition (e.g. December); instead of full 183 GB, scan ~15 GB (1/12); partition pruning reduces I/O and cost.

## Solution 10
- **(a)** Next run reads last_as_of_ts = 2025-12-02; compute features for as_of_ts = 2025-12-03 only; MERGE into user_features; update control to 2025-12-03.
- **(b)** Do not recompute or re-insert 2025-12-01 and 2025-12-02; MERGE on (user_id, as_of_ts) ensures re-run of same day overwrites rather than duplicates.
- **(c)** Track only last_as_of_ts so we only add new days; idempotent write so partial re-run does not duplicate.

## Solution 11
- **(a)** Diagram: week11_practice_slide20_reasoning_feature_flow.puml — events → aggregate (point-in-time) → join users (as-of) → write user_features.
- **(b)** If we use current user state, we might join users who signed up after as_of_ts (e.g. user created on 2025-12-05 used for as_of_ts 2025-12-01); that leaks future information; join must use only users with signup_ts <= as_of_ts.
- **(c)** INSERT only: re-run inserts duplicate rows for same (user_id, as_of_ts); training sees duplicate rows per key, wrong aggregates. Fix: use MERGE or overwrite on (user_id, as_of_ts) so rerun overwrites same key; one row per key.

# Practice 12

# Week 12: Advanced Feature Engineering Pipelines — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Feature pipelines: multi-step (entity features → join → derived); point-in-time; idempotent write
- Backfill vs incremental: control table, partition overwrite; rerun must not duplicate

## Data Context (MANDATORY)

### Tables and schemas

**events** (raw user–item activity; append-only):
- `event_id INT`, `user_id INT`, `item_id INT`, `event_ts TIMESTAMP`, `event_type VARCHAR(20)`
- Sample: (1, 101, 201, '2025-12-01 10:00:00', 'click'), (2, 101, 201, '2025-12-02 14:00:00', 'view'), (3, 102, 201, '2025-12-01 09:00:00', 'click'), (4, 101, 202, '2025-12-03 08:00:00', 'click'), (5, 102, 201, '2025-12-02 11:00:00', 'view')
- Keys: event_id (business); duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day); partitioned by date(event_ts)

**users** (dimension):
- `user_id INT PRIMARY KEY`, `signup_ts TIMESTAMP`, `region VARCHAR(20)`
- Sample: (101, '2025-01-15 00:00:00', 'North'), (102, '2025-02-01 00:00:00', 'South')
- Scale: ~10M rows (100 MB)

**items** (dimension):
- `item_id INT PRIMARY KEY`, `created_ts TIMESTAMP`, `category VARCHAR(20)`
- Sample: (201, '2025-01-01 00:00:00', 'A'), (202, '2025-01-10 00:00:00', 'B')
- Scale: ~1M rows (10 MB)

**feature_table** (target; user–item features):
- `user_id INT`, `item_id INT`, `as_of_ts TIMESTAMP`, `clicks_7d INT`, `views_7d INT`, `impressions_7d INT`, `ctr_7d FLOAT`
- Keys: (user_id, item_id, as_of_ts) — primary or overwrite key; one row per key
- Scale: ~10M users × 1M items × 365 days → store only observed (user, item) per as_of_ts; ~50B rows if full grid; ~1B if observed pairs
- Partitioned by as_of_ts (e.g. by month)

**feature_job_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_as_of_ts TIMESTAMP`, `last_run_ts TIMESTAMP`
- Sample: ('user_item_features_daily', '2025-12-02 23:59:59', '2025-12-03 06:00:00')
- Used for incremental: watermark on as_of_ts

### Access patterns
- events: read by date partition; filter event_ts <= as_of_ts for point-in-time
- feature_table: read by (user_id, item_id, as_of_ts) or as_of_ts range; write by MERGE or partition overwrite on (user_id, item_id, as_of_ts)
- users, items: read for point-in-time join (signup_ts, created_ts <= as_of_ts)

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw → clean, dedup, MERGE); Incremental (watermark, MERGE, idempotent); Failure and Reprocessing (partition-based, idempotent rerun)
- exercises2.md: Module 1 (window functions, idempotent pipelines, SCD); Module 3 (watermarking, incremental load, safety buffer)

## Diagram Manifest
- Slide 22 → week12_practice_slide22_backfill_reasoning.puml → backfill vs incremental decision and idempotent write

## Warm-up Exercises

## Exercise 1
Define **backfill** vs **incremental** in one sentence each. When would you use backfill?

## Exercise 2
What is the **write key** for a user–item feature table that supports training and serving? Why must overlapping backfill jobs not both use INSERT?

## Exercise 3
In a multi-step pipeline (user features → item features → join → derived → write), why must entity features be computed **before** the join?

## Exercise 4
For **incremental** run: control table has last_as_of_ts = '2025-12-02 23:59:59'. Which as_of_ts should the next run compute? One sentence.

## Exercise 5
Two backfill jobs run: Job A writes as_of_ts in [2025-12-01, 2025-12-05]; Job B writes [2025-12-03, 2025-12-07]. Both use plain INSERT. What goes wrong?

## Engineering Exercises

## Exercise 6
**Point-in-time user–item features:** Write SQL to compute `clicks_7d`, `views_7d`, `impressions_7d` per (user_id, item_id, as_of_ts) for as_of_ts = '2025-12-02 23:59:59' and '2025-12-03 23:59:59'. Use only events with event_ts <= as_of_ts AND event_ts > as_of_ts - INTERVAL '7 days'. Build grid from distinct (user_id, item_id) in events in that window. Output: user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d.

## Exercise 7
**Derived feature and MERGE:** From the result of Exercise 6, add derived column `ctr_7d = clicks_7d / NULLIF(impressions_7d, 0)`. Write MERGE (or INSERT ... ON CONFLICT) into **feature_table** with key (user_id, item_id, as_of_ts). On conflict, update all feature columns. Re-running must not duplicate rows.

## Exercise 8
**Incremental feature job:** Assume **feature_job_control** has job_key = 'user_item_features_daily'. Describe in 4 bullets: (a) read last_as_of_ts from control; (b) compute features only for as_of_ts = last_as_of_ts + 1 day; (c) MERGE into feature_table for that as_of_ts; (d) update control (last_as_of_ts, last_run_ts) only after successful write. Why update control only after success?

## Exercise 9
**Cost:** Assume 10M users, 1M items, 365 as_of_ts, 60 bytes per row. (a) Full grid size in GB. (b) If we store only observed (user_id, item_id) per as_of_ts and average 5M pairs per day, approximate feature table size in GB. (c) How does partitioning by as_of_ts (by month) reduce scan for training reading one month?

## Exercise 10
**Failure and rerun:** Feature job runs for as_of_ts = 2025-12-01, 2025-12-02, 2025-12-03. It fails after writing 2025-12-01 and 2025-12-02 (control updated to 2025-12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is computed and written, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 11
**Join size reasoning:** Full grid (all users × all items × 365 as_of_ts) is infeasible. Give the SQL pattern to build a grid of only (user_id, item_id) that appear in **events** in the last 7 days for a given as_of_ts. One short query or pseudocode.

## Challenge Exercise

## Exercise 12 (Multi-part)
- **(a)** Draw or reference a diagram of backfill vs incremental: control table, watermark, partition overwrite; idempotent write. Diagram: week12_practice_slide22_backfill_reasoning.puml
- **(b)** Explain why two overlapping backfill jobs (e.g. both writing 2025-12-03) with INSERT cause duplicate rows. How does partition overwrite or MERGE fix it?
- **(c)** If the feature job updates the control table **before** writing to feature_table and the write fails, what happens on the next run? How do you fix it?

## Solutions

## Solution 1
- **Backfill:** Compute features for a range of as_of_ts (e.g. full history or [d_start, d_end]); used for one-time load or repair.
- **Incremental:** Compute only new as_of_ts (e.g. last_as_of_ts + 1 day); used for daily pipeline; watermark in control table.
- **When backfill:** New feature definition; historical repair; new entity set; full retrain.

## Solution 2
- **Write key:** (user_id, item_id, as_of_ts).
- **Overlapping INSERT:** If two jobs both INSERT for the same (user_id, item_id, as_of_ts), the table gets two rows per key; training and joins double-count or are ambiguous. Use MERGE or partition overwrite so the second write replaces the same key (idempotent).

## Solution 3
- Join needs **entity-level features** (e.g. user clicks_7d, item impressions_7d) as inputs. Computing entity features first gives one row per (user_id, as_of_ts) and (item_id, as_of_ts); the join then combines them on the grid (user_id, item_id, as_of_ts). Order: entity features → join → derived → write.

## Solution 4
- Next run should compute as_of_ts = last_as_of_ts + 1 day = '2025-12-03 23:59:59' (or the next calendar day end). Only one new as_of_ts for incremental.

## Solution 5
- **Wrong:** Overlap days 2025-12-03, 2025-12-04, 2025-12-05 get written by both jobs. With INSERT, feature_table has duplicate rows for those (user_id, item_id, as_of_ts); training and metrics are wrong. Fix: MERGE or partition overwrite so each partition is written by one job and rerun overwrites same key.

## Solution 6
- **Assumptions:** events table; as_of_ts in a small set (2 dates); grid = distinct (user_id, item_id) from events in 7d window per as_of_ts.

```sql
WITH as_of_dates AS (
  SELECT TIMESTAMP '2025-12-02 23:59:59' AS as_of_ts
  UNION ALL SELECT TIMESTAMP '2025-12-03 23:59:59'
),
grid AS (
  SELECT DISTINCT e.user_id, e.item_id, d.as_of_ts
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
),
counts AS (
  SELECT e.user_id, e.item_id, d.as_of_ts,
         SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicks_7d,
         SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END) AS views_7d,
         COUNT(*) AS impressions_7d
  FROM events e
  JOIN as_of_dates d ON e.event_ts <= d.as_of_ts
    AND e.event_ts > d.as_of_ts - INTERVAL '7 days'
  GROUP BY e.user_id, e.item_id, d.as_of_ts
)
SELECT g.user_id, g.item_id, g.as_of_ts,
       COALESCE(c.clicks_7d, 0) AS clicks_7d,
       COALESCE(c.views_7d, 0) AS views_7d,
       COALESCE(c.impressions_7d, 0) AS impressions_7d
FROM grid g
LEFT JOIN counts c ON g.user_id = c.user_id AND g.item_id = c.item_id AND g.as_of_ts = c.as_of_ts;
```

- **Check:** No event with event_ts > as_of_ts; grid from observed pairs only; correct 7-day window.

## Solution 7
- **Plan:** Assume CTE `feature_rows` has (user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d); add ctr_7d = clicks_7d / NULLIF(impressions_7d, 0). MERGE into feature_table on (user_id, item_id, as_of_ts); WHEN MATCHED UPDATE all columns; WHEN NOT MATCHED INSERT.

```sql
WITH feature_rows AS (
  SELECT user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d,
         clicks_7d::FLOAT / NULLIF(impressions_7d, 0) AS ctr_7d
  FROM ( ... )  -- output of Solution 6 query
)
MERGE INTO feature_table AS target
USING feature_rows AS source
ON target.user_id = source.user_id
   AND target.item_id = source.item_id
   AND target.as_of_ts = source.as_of_ts
WHEN MATCHED THEN
  UPDATE SET clicks_7d = source.clicks_7d, views_7d = source.views_7d,
              impressions_7d = source.impressions_7d, ctr_7d = source.ctr_7d
WHEN NOT MATCHED THEN
  INSERT (user_id, item_id, as_of_ts, clicks_7d, views_7d, impressions_7d, ctr_7d)
  VALUES (source.user_id, source.item_id, source.as_of_ts, source.clicks_7d, source.views_7d,
          source.impressions_7d, source.ctr_7d);
```

- **Check:** Re-running with same feature_rows leaves one row per (user_id, item_id, as_of_ts); idempotent.

## Solution 8
- **(a)** SELECT last_as_of_ts FROM feature_job_control WHERE job_key = 'user_item_features_daily'.
- **(b)** Compute features for as_of_ts = last_as_of_ts + 1 day only (e.g. one new day).
- **(c)** MERGE into feature_table for rows with that as_of_ts (or overwrite partition for that as_of_ts).
- **(d)** UPDATE feature_job_control SET last_as_of_ts = new_as_of_ts, last_run_ts = NOW() WHERE job_key = 'user_item_features_daily', only after MERGE/write succeeds.
- **Why after success:** If we update control before write and write fails, next run would skip that as_of_ts and leave a gap; updating after success ensures we only advance when data is written.

## Solution 9
- **(a)** Full grid: 10M × 1M × 365 × 60 B = 219e15 B ≈ 219 PB (infeasible).
- **(b)** Observed pairs: 5M pairs/day × 365 days × 60 B = 109.5e9 B ≈ 109.5 GB (feasible).
- **(c)** Partitioning by month: training reading one month (e.g. December) scans only December partition; instead of full table, scan ~1/12 of rows; partition pruning reduces I/O and cost.

## Solution 10
- **(a)** Next run reads last_as_of_ts = 2025-12-02; compute features for as_of_ts = 2025-12-03 only; MERGE into feature_table; update control to 2025-12-03.
- **(b)** Do not recompute or re-insert 2025-12-01 and 2025-12-02; MERGE on (user_id, item_id, as_of_ts) ensures re-run of same day overwrites; incremental only adds new as_of_ts.
- **(c)** Track only last_as_of_ts so we only add new days; idempotent write so partial re-run does not duplicate.

## Solution 11
- **Pattern:** Restrict grid to (user_id, item_id) that appear in events in the 7-day window for each as_of_ts.

```sql
SELECT DISTINCT user_id, item_id
FROM events
WHERE event_ts <= :as_of_ts
  AND event_ts > :as_of_ts - INTERVAL '7 days';
```

- Then cross join with as_of_ts (or with a small as_of_dates table). This keeps grid size bounded by observed pairs, not full Cartesian product.

## Solution 12
- **(a)** Diagram: week12_practice_slide22_backfill_reasoning.puml — control table, incremental (last_as_of_ts + 1 day), backfill (range), overwrite partition per as_of_ts, idempotent write.
- **(b)** Both jobs INSERT rows for same (user_id, item_id, as_of_ts); table gets two rows per key. Fix: use MERGE so second write updates same row; or partition overwrite so each job overwrites its partition and overlapping run overwrites same partition (idempotent).
- **(c)** If control is updated before write and write fails, next run reads advanced last_as_of_ts and skips that as_of_ts; gap in feature table. Fix: update control only **after** successful write; then next run only advances when data is committed.

# Practice 13

# Week 13: DataOps, Testing, and Data Quality — Practice

## Instructions
- Engineering course: show reasoning and calculations
- SQL: provide full solutions in fenced SQL blocks
- Data tests: write assertions (row count, uniqueness, freshness)
- Failure scenario: rerun must not duplicate results; tests must catch regressions

## Data Context (MANDATORY)

### Tables and schemas

**raw_events** (staging / append-only logs):
- `event_id INT`, `user_id INT`, `event_type VARCHAR`, `event_timestamp VARCHAR`, `details JSON`
- Sample: (1, 101, 'click', '2025/12/01 08:00:00', '{"page":"home"}'); (2, 102, 'view', '2025-12-01T09:30:00', '{"page":"product"}'); (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id (business key); duplicates possible from retries
- Scale: ~100M rows/day (10 GB/day)

**events_clean** (target):
- `event_id INT PRIMARY KEY`, `user_id INT`, `event_type VARCHAR`, `event_time TIMESTAMP`, `details JSON`
- Sample: (1, 101, 'click', '2025-12-01 08:00:00', '{"page":"home"}')
- Keys: event_id; one row per event
- Scale: ~1B rows total (100 GB); partitioned by date

**etl_control** (control table):
- `job_key VARCHAR PRIMARY KEY`, `last_watermark TIMESTAMP`, `last_run_ts TIMESTAMP`, `status VARCHAR`
- Sample: ('events_sync', '2025-12-01 08:00:00', '2025-12-02 06:00:00', 'OK')
- Used for incremental load watermark

**test_results** (optional; test run audit):
- `run_id VARCHAR`, `test_name VARCHAR`, `passed BOOLEAN`, `actual_value NUMERIC`, `run_ts TIMESTAMP`
- Sample: ('run_001', 'row_count_20251201', true, 1000000, '2025-12-02 06:05:00')

### Access patterns
- raw_events: read by date partition; append-only
- events_clean: read by event_id (MERGE); query by user_id, event_time; tests read by partition or full
- etl_control: read/write by job_key

## Reference Exercises Used (Root)
- exercises1.md: SQL in ETL/ELT (raw_events → events_clean, dedup, MERGE); Failure and Reprocessing (partition-based, idempotent rerun); Incremental (watermark, MERGE, idempotent).
- exercises2.md: Module 3 Robust Data Ingestion (staging, DLQ, watermarking); Idempotent Pipelines and Deduplication (MERGE, ROW_NUMBER).
- Adapted for DataOps: tests on target, quality gate, idempotent rerun, and failure/reprocessing scenarios.

## Diagram Manifest
- Slide 20 → week13_practice_slide20_quality_gate_flow.puml → quality gate flow after load (tests on target)
- Purpose: show load → target → tests → pass/fail for Challenge Exercise 11(d)
- One diagram in practice; referenced in Solution 11(d)

## Warm-up Exercises

## Exercise 1
- Name **three** types of data tests (e.g. schema, row, freshness).
- In one sentence, what is a quality gate?
- Give one example of each type you named.

## Exercise 2
- Why is **idempotency** important when a data pipeline is re-run after a failure?
- One sentence.
- What happens to the target if the job is run twice with the same input and writes are not idempotent?

## Exercise 3
- **events_clean** is partitioned by date. Give one example of a **freshness** assertion for a single partition (e.g. partition_date = '2025-12-01').
- Give one example of a **row count** assertion for that partition.
- In one line: what should “pass” mean for each assertion?

## Exercise 4
- If the load job fails **after** writing partition 2025-12-02 but **before** updating the watermark, what should the next run do with partitions 2025-12-01 and 2025-12-02?
- One sentence.
- Why is it safe to re-read and re-write 2025-12-02 if the pipeline uses MERGE?

## Exercise 5
- What is a **test gap**?
- Give one example where a test gap could allow bad data to reach consumers.
- Name one way to close that gap (e.g. add which test?).

## Engineering Exercises

## Exercise 6
**Uniqueness test:** Write a SQL assertion that checks that **events_clean** has no duplicate `event_id`. The assertion should be a single query that returns one row; we consider it passed if the result equals (total rows, distinct event_id count) and they are equal. Show the query.

## Exercise 7
**Freshness test:** Write a SQL query that returns the maximum `event_time` in **events_clean** for partition date '2025-12-01'. How would you use this in a test (e.g. pass if max(event_time) ≥ expected_lower_bound)?

## Exercise 8
**Load + watermark:** Assume raw_events is partitioned by date and **etl_control** has job_key = 'events_sync'. Write pseudocode or SQL steps to: (a) Read last_watermark from etl_control. (b) Extract from raw_events where event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'. (c) Apply same transform/dedup as in lecture; MERGE into events_clean. (d) Update etl_control last_watermark only after successful load. Why the 5-minute buffer?

## Exercise 9
**Failure and rerun:** The incremental job for events runs for 2025-12-01, 2025-12-02, 2025-12-03. It fails after successfully writing 2025-12-01 and 2025-12-02 to events_clean (watermark updated for 12-02). Describe in 3 bullets how the next run must behave so that (a) 2025-12-03 is loaded, (b) 2025-12-01 and 2025-12-02 are **not** duplicated.

## Exercise 10
**Cost:** Assume events_clean has 1B rows and a full-table uniqueness test runs COUNT(*) and COUNT(DISTINCT event_id). (a) Why might this test be slow? (b) How would you make the test faster (e.g. partition-level or sampled)? One sentence each.

## Challenge Exercise

## Exercise 11 (Multi-part)
**Quality gate design:** For the pipeline raw_events → events_clean (with watermark and MERGE):

- **(a)** List **three** concrete tests you would run after each load (schema/row/freshness/volume). For each, state the assertion in one line (e.g. “event_id unique”).
- **(b)** Where in the pipeline would you run these tests (before or after watermark update)? Justify in one sentence.
- **(c)** If the uniqueness test fails after a run, what could have gone wrong in the pipeline? Name two possible causes.
- **(d)** Draw or reference the quality gate flow: load → target → tests → pass/fail. Diagram: week13_practice_slide20_quality_gate_flow.puml

## Solutions

## Solution 1
- **Three types:** e.g. schema (column type, nullable), row (uniqueness, not-null, value in set), freshness (max timestamp within SLA).
- **Quality gate:** A check that blocks promote (or alerts) when assertions fail; bad data does not reach consumers without detection.

## Solution 2
- Idempotency means running the job N times yields the same result as once. If the job is re-run after a partial failure, idempotent writes (e.g. MERGE or INSERT ON CONFLICT DO NOTHING) prevent duplicate rows in the target.

## Solution 3
- **Freshness (partition):** e.g. max(event_time) for partition_date = '2025-12-01' ≥ '2025-12-01 23:00:00' (data for that day is complete up to some time).
- **Row count (partition):** e.g. count(*) for partition_date = '2025-12-01' between 500000 and 2000000 (min expected, sanity upper bound).

## Solution 4
- The next run should **re-process** 2025-12-02 (and 2025-12-01 if watermark was not updated for 12-01) because the watermark was not advanced; the job will re-read the same slice. Idempotent MERGE ensures no duplicate rows when re-inserting.

## Solution 5
- **Test gap:** A part of the data or schema that is not covered by any test. Example: a new column X is added; pipeline writes X; no test checks X for null or valid values. Bad values in X can reach consumers without any test failing.

## Solution 6
**Assumptions:** events_clean has event_id as business key; we expect one row per event_id.

**Plan:** Compare total row count to distinct event_id count; they must be equal.

**SQL:**

```sql
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT event_id) AS distinct_ids
FROM events_clean;
```

**Check:** Pass if total_rows = distinct_ids. If total_rows > distinct_ids, there are duplicate event_ids.

## Solution 7
**Assumptions:** events_clean partitioned by date (e.g. partition key = date(event_time)); we test partition '2025-12-01'.

**Plan:** Get max(event_time) for that partition; compare to expected lower bound (e.g. end of day or now − threshold).

**SQL:**

```sql
SELECT MAX(event_time) AS max_event_time
FROM events_clean
WHERE event_time >= '2025-12-01' AND event_time < '2025-12-02';
```

**Check:** Pass if max_event_time ≥ expected_lower_bound (e.g. '2025-12-01 23:00:00' or NOW() − INTERVAL '24 hours').

## Solution 8
**Assumptions:** raw_events has event_time (or event_timestamp cast to timestamp); etl_control stores last_watermark for job_key = 'events_sync'.

**Plan:** (a) SELECT last_watermark FROM etl_control WHERE job_key = 'events_sync'. (b) SELECT * FROM raw_events WHERE event_time > last_watermark AND event_time <= NOW() - INTERVAL '5 minutes'. (c) Dedup with ROW_NUMBER() PARTITION BY event_id ORDER BY event_time; MERGE INTO events_clean FROM deduped CTE ON event_id; (d) UPDATE etl_control SET last_watermark = NOW() - INTERVAL '5 minutes', last_run_ts = NOW() WHERE job_key = 'events_sync' (only after successful commit of load).
- **Why 5-minute buffer:** So that transactions that started before the run but commit slightly later are included in the next run; avoids missing rows due to commit latency.

## Solution 9
- **(a)** Next run reads last_watermark from etl_control (e.g. end of 2025-12-02); so it only extracts data with event_time > that watermark, i.e. 2025-12-03 and later.
- **(b)** It does **not** re-extract 2025-12-01 or 2025-12-02 because they are before the stored watermark.
- **(c)** MERGE (or INSERT ON CONFLICT) ensures that if any row from 2025-12-03 were already present, it would be updated, not duplicated; so no duplicate rows for 12-01 or 12-02 (they are not re-read) and no duplicates for 12-03 (idempotent write).

## Solution 10
- **(a)** Full-table scan of 1B rows twice (COUNT(*) and COUNT(DISTINCT event_id)) is I/O and CPU intensive; can take minutes and timeout in CI.
- **(b)** Run the test per partition (e.g. only on the partition just loaded) so each run scans a small subset; or sample a fraction of rows and test uniqueness on the sample to bound runtime.

## Solution 11
**(a)** Three tests (examples): (1) **Uniqueness:** count(*) = count(DISTINCT event_id) on target (or per partition). (2) **Row count:** count(*) for the loaded partition ≥ min_expected (e.g. from source count or prior day). (3) **Freshness:** max(event_time) for the partition ≥ expected_lower_bound (e.g. end of partition day or now − 24 h).

**(b)** Run tests **after** load and **after** watermark update (or in same transaction as watermark update only if tests pass). So: load → commit → run tests; if tests pass, consider “promote” or OK; if tests fail, alert and do not consider the run successful (optionally do not advance watermark if we treat “success” as load + tests). Running after load ensures we validate the actual state that consumers will see.

**(c)** (1) Dedup step was skipped or wrong (e.g. ROW_NUMBER filter missing), so duplicates were inserted. (2) MERGE was not used and a rerun inserted the same keys again. (3) Upstream sent duplicate event_ids and dedup was not applied correctly.

**(d)** Load writes to target (events_clean); then tests read from target (row count, uniqueness, freshness); pass → promote/OK, fail → block and alert. Diagram: week13_practice_slide20_quality_gate_flow.puml

# Practice 14

# Week 14: Course Review and Exam Preparation — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Use concrete data (tables, keys, sample rows) in every answer
- For SQL: write full solutions in fenced SQL blocks
- For MapReduce: show map emits, shuffle groups, reduce outputs explicitly
- For cost: state assumptions and formula before computing

## Data Context (MANDATORY)
- **raw_events** (staging): event_id INT, user_id INT, event_type VARCHAR, event_timestamp VARCHAR, details JSON. Keys: none (append-only). Sample: (1,101,'click','2025/12/01 08:00:00','{}'), (2,102,'view','2025-12-01T09:00:00','{}'), (1,101,'click','2025/12/01 08:00:00','{}'). ~100M rows/day.
- **events_clean** (target): event_id INT PK, user_id INT, event_type VARCHAR, event_time TIMESTAMP, details JSON. One row per event_id. Partitioned by date(event_time). ~1B rows.
- **dim_customer**: customer_id INT PK, name VARCHAR, region VARCHAR. Sample: (1,'Alice','North'), (2,'Bob','East'). ~10K rows.
- **dim_product**: product_id INT PK, name VARCHAR, category VARCHAR. Sample: (101,'Shirt','Clothing'), (102,'Mug','Home'). ~1K rows.
- **sales_fact**: sale_id BIGINT PK, customer_id INT FK, product_id INT FK, quantity INT, unit_price DECIMAL(10,2), date_key INT (YYYYMMDD). Sample: (1001,1,101,2,9.99,20251201), (1002,2,102,1,12.00,20251201). ~10M rows/year; partitioned by date_key. Access: BI queries filter by date_key and join to dims.
- **MapReduce input (word count):** 4 lines: line 1 "a b a", line 2 "b a c", line 3 "a c", line 4 "b b a". Then skew variant: 10 lines where word "the" appears 50 times total, others 1–2 each.

## Reference Exercises Used (Root)
- exercises1.md: SQL joins/aggregations (revenue by region), ETL dedup/MERGE, batch ingestion, incremental load (watermark, idempotency), MapReduce word count and sales-by-product walkthrough, failure/reprocessing (partition resume, exactly-once)
- exercises2.md: Banking ledger schema and window functions, idempotent MERGE and ROW_NUMBER dedup, MapReduce inverted index and skew salting, ingestion DLQ and watermark with buffer, SCD Type 2 and surrogate keys

## Diagram Manifest
- Slide 18 → week14_practice_slide18_reasoning_pipeline_choice.puml → Reasoning: ETL vs ELT and when to use MERGE vs partition overwrite

## Warm-up Exercises
- 3–5 short exercises; each on its own slide below
- Use Data Context tables and sample rows in answers
- Full solutions follow in Solutions section

## W1
- List the partition key of sales_fact
- List the primary key of sales_fact
- Why must BI queries include a filter on date_key?

## W2
- How many rows in raw_events sample have event_id = 1?
- After dedup by event_id (keep earliest event_timestamp), how many rows for event_id = 1?
- What does idempotent rerun require for this load?

## W3
- After map emits (word, 1) for the 4 lines, how many pairs does key "a" receive at shuffle?
- What is the reduce output for "a"?
- How many distinct keys are there after map?

## W4
- Write one SQL statement: update the watermark to '2025-12-01 12:00:00' for key 'events_sync'
- Assume table etl_state(key, val)
- One line only

## W5
- Name one failure mode in ingestion (e.g. duplicate on rerun)
- Name one failure mode in MapReduce (e.g. skew)
- Name one failure mode in DWH (e.g. full scan)

## Engineering Exercises
- 3–6 exercises; numeric assumptions and cost reasoning; each on its own slide below
- Include SQL/ETL, MapReduce trace, DWH query, and cost estimate
- Full solutions with assumptions and check follow in Solutions section

## E1 (SQL/ETL)
- Filter raw_events: event_type IN ('click','view','purchase'); cast event_timestamp to TIMESTAMP
- Deduplicate by event_id (keep earliest event_timestamp per event_id)
- Write full SQL: CTE for dedup + MERGE into events_clean ON event_id; MERGE only when source newer than target last_updated_ts

## E2 (Incremental + idempotency)
- Job loads 2025-12-01 and 2025-12-02; fails after writing 2025-12-01. How to rerun without duplicating 2025-12-01?
- Use watermark or partition list to track progress
- Give pseudocode or bullet steps for resume logic

## E3 (MapReduce)
- Write map outputs (key, value) for each of the 4 lines (exact strings "a", "b", "c")
- Write shuffle groups: key → list of values
- Write reduce outputs: (word, count) for each key

## E4 (Skew)
- What failure can occur when one reducer gets 50 values for "the" and others get 1–3?
- Propose combiner: what does it do and how does it help?
- Propose salting: one sentence on how it distributes load

## E5 (DWH)
- Query: total revenue (quantity * unit_price) by region for December 2025
- Join sales_fact to dim_customer; filter date_key between 20251201 and 20251231
- State why partition pruning applies

## E6 (Cost)
- With filter date_key IN (20251201, 20251202): how many rows scanned? (2 partitions × ~27K)
- Without date filter: how many rows scanned? (10M)
- What is the reduction factor from pruning?

## Challenge Exercise
- **C1 (Multi-part):** (a) Design a minimal pipeline (extract → staging → load) so that daily raw_events are loaded into events_clean and rerun never duplicates. State: how you track progress (watermark or partition list), how you dedup, and how you write (MERGE or partition overwrite). (b) Draw or reference a diagram that shows the decision: when to use MERGE vs partition overwrite (one sentence per branch). Diagram: week14_practice_slide18_reasoning_pipeline_choice.puml

## Solutions

## Solution W1
- **Partition key:** date_key. **Primary key:** sale_id.
- **Why filter:** Without date_key filter, the query scans all partitions (full table scan). With filter, only matching partitions are read; otherwise 10M+ rows and timeout.

## Solution W2
- **Before dedup:** 2 rows have event_id = 1 (duplicate timestamps).
- **After dedup (earliest event_timestamp):** 1 row for event_id = 1 (keep one, e.g. '2025/12/01 08:00:00').

## Solution W3
- **Map:** Line 1: (a,1),(b,1),(a,1); Line 2: (b,1),(a,1),(c,1); Line 3: (a,1),(c,1); Line 4: (b,1),(b,1),(a,1).
- **Shuffle for "a":** [1,1,1,1,1] (five 1s).
- **Reduce output for "a":** ("a", 5).

## Solution W4
- **Assumption:** Table name etl_state(key VARCHAR, val TIMESTAMP).
- **SQL:** `UPDATE etl_state SET val = '2025-12-01 12:00:00' WHERE key = 'events_sync';`

## Solution W5
- **Ingestion:** Duplicate on rerun (no MERGE/watermark).
- **MapReduce:** Skew — one key has most values ⇒ one reducer OOM or straggler.
- **DWH:** Full scan (no partition filter) ⇒ timeout.

## Solution E1
- **Assumptions:** events_clean has (event_id PK, user_id, event_type, event_time, details, last_updated_ts). raw_events has event_timestamp as string.
- **Plan:** Filter types; dedup by event_id with ROW_NUMBER; MERGE on event_id; UPDATE only when source event_timestamp > target last_updated_ts.

```sql
WITH filtered AS (
  SELECT event_id, user_id, event_type,
         CAST(event_timestamp AS TIMESTAMP) AS event_time, details
  FROM raw_events
  WHERE event_type IN ('click','view','purchase')
),
deduped AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp) AS rn
  FROM filtered
),
src AS (
  SELECT event_id, user_id, event_type, event_time, details, event_timestamp
  FROM deduped WHERE rn = 1
)
MERGE INTO events_clean AS t
USING src AS s ON t.event_id = s.event_id
WHEN MATCHED AND s.event_timestamp > t.last_updated_ts THEN
  UPDATE SET user_id = s.user_id, event_type = s.event_type, event_time = s.event_time, details = s.details, last_updated_ts = s.event_timestamp
WHEN NOT MATCHED THEN
  INSERT (event_id, user_id, event_type, event_time, details, last_updated_ts)
  VALUES (s.event_id, s.user_id, s.event_type, s.event_time, s.details, s.event_timestamp);
```

- **Check:** Rerun with same raw_events leaves events_clean unchanged (idempotent).

## Solution E2
- **Assumptions:** Partitions = date (2025-12-01, 2025-12-02). Watermark stored in etl_state.
- **Plan:** (1) Read watermark (e.g. NULL or last successful date). (2) For each date in [2025-12-01, 2025-12-02]: if date > watermark, load that date’s raw_events into events_clean (dedup + MERGE). (3) After successful load for a date, set watermark = that date (or max(watermark, date)). (4) On rerun, skip dates ≤ watermark.
- **Pseudocode:** `for d in [2025-12-01, 2025-12-02]: if d > watermark: load(d); watermark = d`. After failure, watermark = 2025-12-01; rerun processes only 2025-12-02; no duplicate for 2025-12-01.

## Solution E3
- **Map outputs:** R1: (a,1),(b,1),(a,1). R2: (b,1),(a,1),(c,1). R3: (a,1),(c,1). R4: (b,1),(b,1),(a,1).
- **Shuffle:** a→[1,1,1,1,1], b→[1,1,1,1], c→[1,1].
- **Reduce:** (a,5), (b,4), (c,2).

## Solution E4
- **Failure:** One reducer gets 50 values for "the" ⇒ high memory or straggler; others finish early. Risk: OOM or timeout.
- **Combiner:** Locally sum (the, 1)s on map side → emit (the, 50) once per map task; reduces bytes to shuffle.
- **Salting:** Emit (the_1, 1), (the_2, 1), … (the_N, 1) with random suffix; N reducers get a share; then sum the_* in a second job or in application.

## Solution E5
- **Partition pruning:** WHERE date_key BETWEEN 20251201 AND 20251231 limits scan to December 2025 partitions only.

```sql
SELECT c.region, SUM(f.quantity * f.unit_price) AS total_revenue
FROM sales_fact f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.date_key BETWEEN 20251201 AND 20251231
GROUP BY c.region;
```

- **Check:** Only fact rows in December partitions are read; join to small dim_customer.

## Solution E6
- **With filter (2 days):** 2 partitions × ~27K ≈ 54K rows scanned.
- **Without filter:** All partitions ⇒ 10M rows scanned. Pruning reduces I/O by ~185×.

## Solution C1
- **(a) Minimal pipeline:** (1) **Progress:** Watermark (max event_timestamp or max date_key) in etl_state; or list of loaded dates. (2) **Extract:** raw_events WHERE event_timestamp > watermark AND event_timestamp <= upper_bound (e.g. NOW() − 5 min). (3) **Dedup:** ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_timestamp); keep rn = 1. (4) **Write:** MERGE into events_clean ON event_id (idempotent). Rerun: same watermark until run succeeds; then advance watermark; next run skips already-loaded data.
- **(b) MERGE vs partition overwrite:** Use **MERGE** when the same business key (e.g. event_id) can arrive in multiple runs or late; need row-level upsert and no duplicate keys. Use **partition overwrite** when each run reloads a full partition (e.g. one day) and never mixes old and new in the same partition; simpler but only idempotent at partition level.
- Diagram: week14_practice_slide18_reasoning_pipeline_choice.puml

