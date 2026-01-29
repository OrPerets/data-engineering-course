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
