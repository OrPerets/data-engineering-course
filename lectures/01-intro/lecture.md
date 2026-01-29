# Week 1: Introduction to Data Engineering

## Purpose
- Why data engineering matters in modern systems
- Engineering problems that require data engineering
- Scale, reliability, and cost as first-class concerns

## Learning Objectives
- Define data engineering vs data science vs analytics
- Calculate data volume growth and storage requirements
- Design basic data pipeline architectures
- Estimate pipeline costs (time, storage, network)
- Identify failure modes in data systems
- Reason about trade-offs: batch vs streaming, SQL vs NoSQL
- Map business questions to data engineering solutions

## Sources Used (Reference Only)
- sources/Lecture 1.pptx
- sources/Introduction & Recap.pdf

## What is Data Engineering?

## Definition
- Building systems to collect, store, process data
- Focus: reliability, scale, cost, maintainability
- Output: clean, accessible data for consumers
- Not about: building ML models or dashboards

## Core Problem Statement
- Data exists in many sources (databases, APIs, files)
- Consumers need unified, reliable access
- Scale: millions of records, terabytes daily
- Time: batch (hours) vs real-time (seconds)
- Quality: missing, duplicate, inconsistent data

## Data Engineering vs Data Science

## Data Science Focus
- Build predictive models
- Statistical analysis
- Experimentation
- Output: insights, predictions, recommendations

## Data Engineering Focus
- Build data pipelines
- Infrastructure and reliability
- Scale and performance
- Output: datasets, APIs, data products

## Overlap
- Both need clean data
- Both work with large datasets
- Engineering enables science
- Science informs engineering requirements

## Data Engineering vs Analytics

## Analytics Focus
- Answer business questions
- Create reports and dashboards
- Ad-hoc exploration
- Output: charts, tables, insights

## Data Engineering Focus
- Make analytics possible
- Provide reliable data infrastructure
- Automate data preparation
- Output: data platforms, pipelines

## Relationship
- Analytics consumes engineering output
- Engineering builds what analytics needs
- Both serve business stakeholders
- Clear separation of concerns

## Why Data Engineering Exists

## The Scale Problem
- 2010: 1 TB/day typical company
- 2020: 1 PB/day large companies
- Growth: 10× every 5 years
- Single machine: insufficient

## The Variety Problem
- Sources: databases, APIs, logs, files
- Formats: JSON, CSV, Parquet, Avro
- Schemas: structured, semi-structured, unstructured
- Integration: complex, error-prone

## The Velocity Problem
- Batch: process once per day
- Streaming: process in real-time
- Latency requirements: seconds to hours
- Throughput: 100K to 1M events/second

## The Reliability Problem
- Data quality: missing, wrong, late
- System failures: nodes crash, network partitions
- Business impact: wrong decisions, lost revenue
- Need: monitoring, alerting, recovery

## Data Engineering Lifecycle

## Ingestion
- Extract data from sources
- Handle failures and retries
- Validate basic structure
- Store raw data (immutable)

## Storage
- Choose storage format
- Partition by time/keys
- Replicate for availability
- Optimize for access patterns

## Processing
- Transform raw to processed
- Clean, deduplicate, enrich
- Aggregate and join
- Apply business logic

## Consumption
- Serve to analytics tools
- Provide APIs for applications
- Generate reports
- Feed ML models

## Lifecycle Diagram
- Diagram: week1_lecture_slide12_lifecycle.puml

## Core Concepts (1/2)

## Data Pipeline
- Sequence of processing steps
- Input → Transform → Output
- Each step: independent, testable
- Failure: one step fails, pipeline stops

## ETL: Extract, Transform, Load
- Extract: read from source
- Transform: clean, enrich, aggregate
- Load: write to destination
- Order: transform before load

## ELT: Extract, Load, Transform
- Extract: read from source
- Load: write raw to storage
- Transform: process in storage
- Order: load before transform

## ETL vs ELT Trade-off
- ETL: smaller storage, faster queries
- ELT: preserve raw data, flexible
- Cost: ETL = compute + storage
- Cost: ELT = storage + compute

## Core Concepts (2/2)

## Batch Processing
- Process data in chunks
- Frequency: hourly, daily, weekly
- Latency: minutes to hours
- Use case: reports, analytics

## Streaming Processing
- Process data continuously
- Frequency: real-time, seconds
- Latency: milliseconds to seconds
- Use case: alerts, dashboards

## Batch vs Streaming
- Batch: simpler, cheaper, higher latency
- Streaming: complex, expensive, low latency
- Hybrid: batch for history, stream for recent
- Choose based on requirements

## Schema-on-Write vs Schema-on-Read
- Schema-on-write: validate at ingestion
- Schema-on-read: validate at query time
- Trade-off: flexibility vs performance
- Data warehouse: schema-on-write
- Data lake: schema-on-read

## Running Example — Data & Goal

## Scenario: E-commerce Clickstream
- Source: web server logs
- Volume: 10M events/day
- Format: JSON, 500 bytes/event
- Content: user_id, page, timestamp, action

## Goal
- Calculate daily page views per product
- Serve to analytics dashboard
- Latency: data available within 1 hour
- Reliability: 99.9% success rate

## Constraints
- Storage: 5 GB/day raw logs
- Processing: 1 hour window acceptable
- Cost: minimize compute hours
- Quality: handle missing user_ids

## Running Example — Step-by-Step (1/4)

## Step 1: Ingestion
- Read log files from S3
- Parse JSON events
- Validate: timestamp, page present
- Write to raw storage (Parquet)
- Output: 10M events, 5 GB

## Ingestion Diagram
- Diagram: week1_lecture_slide20_ingestion.puml

## Running Example — Step-by-Step (2/4)

## Step 2: Transformation
- Filter: only "page_view" events
- Extract: product_id from page URL
- Clean: remove invalid product_ids
- Group: by (date, product_id)
- Count: events per group

## Transformation Logic
```
Input: {user_id, page, timestamp, action}
Filter: action == "page_view"
Extract: product_id = parse(page)
Group: (date(timestamp), product_id)
Output: (date, product_id, view_count)
```

## Running Example — Step-by-Step (3/4)

## Step 3: Aggregation
- Input: filtered events (8M after filter)
- Group by: (date, product_id)
- Aggregate: count(*) as views
- Output: 50K products × 1 day = 50K rows

## Aggregation Example
```
Raw: 8M page_view events
Group: by (2024-01-15, product_123)
Result: 1,250 views for product_123
Output row: (2024-01-15, product_123, 1250)
```

## Running Example — Step-by-Step (4/4)

## Step 4: Load to Analytics
- Write aggregated results
- Format: Parquet, partitioned by date
- Destination: data warehouse
- Size: 50K rows × 100 bytes = 5 MB

## Engineering Interpretation
- Reduction: 5 GB → 5 MB (1000×)
- Latency: 45 minutes end-to-end
- Cost: $0.50 per day (compute)
- Reliability: 99.95% success rate
- Trade-off: 1-hour delay acceptable

## Cost & Scaling Analysis (1/3)

## Time Model
- Ingestion: 10 minutes (I/O bound)
- Transformation: 20 minutes (CPU bound)
- Aggregation: 10 minutes (CPU bound)
- Load: 5 minutes (I/O bound)
- Total: 45 minutes

## Scaling Time
- 2× data: 90 minutes (linear)
- 10× data: 7.5 hours (linear)
- Parallelization: divide by N workers
- Example: 10 workers → 4.5 minutes

## Time Cost Formula
```
T_total = T_ingest + T_transform + T_aggregate + T_load
T_parallel = T_sequential / N_workers
Bottleneck: max(T_ingest, T_transform, T_aggregate, T_load)
```

## Cost & Scaling Analysis (2/3)

## Memory Model
- Raw data: 5 GB (compressed)
- Intermediate: 2 GB (after filter)
- Final output: 5 MB (aggregated)
- Peak memory: 5 GB (during ingestion)

## Storage Cost
- Raw: 5 GB/day × 30 days = 150 GB/month
- Processed: 5 MB/day × 30 days = 150 MB/month
- Retention: 90 days raw, 365 days processed
- Cost: $0.023/GB/month = $3.45/month raw

## Storage Scaling
- 10× volume: 1.5 TB/month raw
- Cost: $34.50/month
- Compression: 5× reduction possible
- Compressed: $6.90/month

## Cost & Scaling Analysis (3/3)

## Network Model
- Ingestion: 5 GB from source
- Processing: 0 GB (local)
- Output: 5 MB to warehouse
- Total: 5.005 GB transferred

## Network Cost
- Ingress: $0.00 (free)
- Egress: $0.09/GB = $0.45/day
- Monthly: $13.50
- Scaling: 10× volume = $135/month

## Throughput Limits
- Network: 1 Gbps = 125 MB/s
- Transfer time: 5 GB / 125 MB/s = 40s
- Bottleneck: network if > 1 Gbps needed
- Solution: parallel transfers

## Pitfalls & Failure Modes (1/3)

## Missing Data
- Problem: user_id null in 5% of events
- Impact: undercounted page views
- Detection: count nulls, alert if > 1%
- Mitigation: use session_id as fallback

## Duplicate Events
- Problem: same event processed twice
- Impact: double-counted views
- Detection: check event_id uniqueness
- Mitigation: deduplicate by (event_id, timestamp)

## Schema Drift
- Problem: new field added to logs
- Impact: pipeline fails or ignores field
- Detection: schema validation errors
- Mitigation: schema evolution, versioning

## Pitfalls & Failure Modes (2/3)

## Pipeline Failure Scenario
- Step 1 (ingestion): succeeds
- Step 2 (transform): fails at 50%
- Step 3 (aggregate): never runs
- Step 4 (load): never runs
- Result: partial data, inconsistent state

## Failure Propagation Diagram
- Diagram: week1_lecture_slide35_failure.puml

## Recovery Strategies
- Retry: automatic, 3 attempts
- Checkpoint: save state after each step
- Rollback: delete partial outputs
- Manual: investigate, fix, rerun

## Pitfalls & Failure Modes (3/3)

## Late Data
- Problem: events arrive 2 hours late
- Impact: yesterday's report incomplete
- Detection: watermark, late event metrics
- Mitigation: reprocess window, alert

## Resource Exhaustion
- Problem: memory full during aggregation
- Impact: pipeline crashes, no output
- Detection: OOM errors, monitoring
- Mitigation: increase memory, partition data

## Cost Overruns
- Problem: 10× data volume, 10× cost
- Impact: budget exceeded
- Detection: cost alerts, daily reports
- Mitigation: optimize queries, compress data

## Best Practices

## Start with Business Questions
- What decisions need data?
- Who consumes the data?
- What latency is acceptable?
- Don't build pipelines without purpose

## Store Raw Data
- Never delete source data
- Raw data is immutable
- Enables reprocessing, debugging
- Cost: minimal with compression

## Idempotent Operations
- Rerun pipeline: same output
- Use deterministic transformations
- Avoid time-dependent logic
- Test: run twice, compare outputs

## Monitor Everything
- Pipeline success/failure rates
- Data quality metrics
- Processing latency
- Cost per pipeline run

## Version Control
- Code: Git for pipeline code
- Schema: versioned schemas
- Data: timestamped outputs
- Enables rollback, debugging

## Test Incrementally
- Unit tests: individual functions
- Integration tests: full pipeline
- Data tests: validate outputs
- Failure tests: simulate errors

## Design for Failure
- Assume components fail
- Build retry logic
- Use checkpoints
- Plan recovery procedures

## Document Assumptions
- Data sources and formats
- Business logic and rules
- Expected volumes and latencies
- Failure modes and mitigations

## Optimize Last
- First: make it work
- Second: make it reliable
- Third: make it fast
- Premature optimization: waste time

## Recap

## Data Engineering Defined
- Build systems for data at scale
- Focus: reliability, performance, cost
- Output: clean, accessible data

## Key Concepts
- Pipelines: ETL vs ELT
- Processing: batch vs streaming
- Schema: on-write vs on-read
- Lifecycle: ingest → store → process → consume

## Engineering Mindset
- Calculate costs and trade-offs
- Design for failure
- Monitor and measure
- Start simple, optimize later

## What's Next
- Distributed databases (Week 2)
- Parallel processing (Week 3)
- ETL pipelines (Week 4)
- Data warehousing (Week 5)

## Pointers to Practice
- Calculate pipeline costs from volumes
- Design pipeline for given requirements
- Identify failure modes and mitigations
- Choose batch vs streaming based on latency
- Estimate storage and network costs
