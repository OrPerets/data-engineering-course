# Week 1: Introduction to Data Engineering

## Purpose
- Why data engineering matters in modern systems
- Engineering problems that require data engineering
- Scale, reliability, and cost as first-class concerns

## Learning Objectives
- **Frame** data engineering as constraints (scale, reliability, cost), not definitions
- Calculate data volume growth and storage requirements
- Design basic data pipeline architectures and **justify** choices
- Estimate pipeline costs (time, storage, network) and **spot** cost explosions
- Identify failure modes and **why systems break** in production
- Reason about trade-offs: batch vs streaming, SQL vs NoSQL
- Map business questions to data engineering solutions

## Sources Used (Reference Only)
- sources/Lecture 1.pptx
- sources/Introduction & Recap.pdf
- sources/new/Introduction to BI.pdf
- sources/new/KDD.pdf

## What is Data Engineering?

## Constraints, Not Definitions
- **Constraint:** data lives in many systems; consumers need one place to read from
- **Constraint:** volume and velocity grow; single machines and scripts break
- **Constraint:** failures happen; pipelines must be rerunnable and observable
- **Output:** clean, queryable data at the right latency and cost
- **Not:** building ML models or dashboards — we build the plumbing they depend on

## Core Problem Statement
- Data exists in many sources (databases, APIs, files)
- Consumers need unified, reliable access
- **Scale:** millions of records, terabytes daily — naïve “one script” design fails
- **Time:** batch (hours) vs real-time (seconds) — choice drives architecture and cost
- **Quality:** missing, duplicate, inconsistent data — pipelines must detect and handle, not assume

## Business Intelligence Context

## What is Business Intelligence?
- **Definition:** BI is a set of ideas, methodologies, processes, architectures, and technologies that change raw data into significant and useful data for business purpose
- **Benefits:** Handle large amounts of data; identify and evolve new opportunities; provide comparable market benefit and long-term stability
- **Key insight:** Use the technology as a tool — BI enables decision-making, not replaces it

## Data to Wisdom Pyramid
- **Data:** Raw facts that describe characteristics of an event or object (e.g., 51, 77, 58, 82, 64, 70)
- **Information:** Data converted into meaningful insights with context (e.g., "Test scores achieved by students; average is 67")
- **Knowledge:** Skills and experience coupled with information that creates intellectual resources
- **Wisdom:** Applied knowledge — knowing what to do with the information (e.g., "I better stop the car!" when seeing a red light)
- **Engineering perspective:** Data engineering builds the pipeline from raw data to information; analytics and BI convert information to knowledge

## Data Mining in Data Engineering
- **Definition:** Computational process of discovering patterns in large data sets using AI, ML, statistics, and database systems
- **Tasks in business:** Classification (categorize data), Estimation (response rates, probabilities), Prediction (customer behavior), Affinity Grouping (items purchased together), Description (finding patterns)
- **Techniques:** Market basket analysis, Cluster analysis, PCA, Decision trees, Regression
- **Role in DE:** Data engineering provides clean, accessible data that data mining consumes

## Knowledge Discovery in Databases (KDD)
- **Definition:** Automatic extraction of non-obvious, hidden knowledge from large volumes of data
- **KDD Process:** Data Cleaning → Data Integration → Selection (task-relevant data) → Data Mining → Pattern Evaluation
- **Main fields intersection:** Databases (store, access), Statistics (infer info), Machine Learning (algorithms that improve through experience)
- **Data warehouse role:** Integrated data; OLAP (On-Line Analytical Processing) enables KDD at scale

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

## The Scale Problem (Why Naïve Design Breaks)
- 2010: 1 TB/day typical company → 2020: 1 PB/day at scale
- Growth: ~10× every 5 years — **linear scripts and single-node DBs hit a wall**
- **Cost of naïveté:** “run a nightly job” becomes 20-hour runs, then failures; re-architect under fire

## The Variety Problem
- Sources: databases, APIs, logs, files; formats: JSON, CSV, Parquet, Avro
- Schemas: structured, semi-structured, unstructured
- **Constraint:** integration is complex and error-prone; schema drift and bad data will happen

## The Velocity Problem
- Batch: process once per day vs streaming: process in real-time
- Latency: seconds to hours; throughput: 100K–1M events/sec at scale
- **Trade-off:** lower latency ⇒ more complexity and cost; choose from requirements, not fashion

## The Reliability Problem (Why Systems Break)
- Data: missing, wrong, late; systems: nodes crash, network partitions
- **Production reality:** pipelines fail; the question is detection, recovery, and blast radius
- Business impact: wrong decisions, lost revenue — **design for failure from day one**

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

## Core Concepts (1/3)

## Data Pipeline
- Sequence of processing steps: Input → Transform → Output
- Each step: independent, testable — **failure in one step must not leave partial state**
- **Constraint:** design so reruns produce the same result (idempotency)

## ETL vs ELT (1/2)
- **ETL:** Extract → Transform → Load; transform before load; smaller storage, faster queries
- **ELT:** Extract → Load → Transform; load raw first; preserve raw data, flexible analytics later
- **Cost:** ETL = compute up front + less storage; ELT = more storage + compute on demand

## ETL vs ELT (2/2) — Engineering Trade-off
- ETL: good when schema and consumers are stable; **risk:** lose raw data, hard to reprocess
- ELT: good when requirements change; **risk:** higher storage cost, need discipline on transforms
- **Opinion:** keep raw immutable; prefer ELT-style raw layer, then derived layers

## Core Concepts (2/3)

## Batch vs Streaming — Scalability Tension
- **Batch:** chunks; hourly/daily; latency minutes–hours; simpler, cheaper; **breaks when** latency requirement drops to seconds
- **Streaming:** continuous; real-time; latency ms–sec; complex, expensive; **breaks when** throughput or consistency requirements spike
- **Hybrid:** batch for history, stream for recent — common in production; choose from **latency and cost**, not hype

## Schema-on-Write vs Schema-on-Read
- Schema-on-write: validate at ingestion (warehouse); **fails fast**, rigid
- Schema-on-read: validate at query time (lake); **flexible**, risk of garbage-in
- **Trade-off:** strict schema ⇒ fewer surprises and better performance; loose schema ⇒ agility and schema evolution

## Core Concepts (3/3) — One Idea
- **One clear choice per pipeline:** ETL or ELT; batch or stream; schema-on-write or -read
- Mixing without boundaries leads to **cost overruns and unmaintainable pipelines**

## Cost of Naïve Design (Why We Need Engineering)

## What Goes Wrong Without Discipline
- **Naïve:** “one script, one DB, run nightly” — works until volume doubles; then 20-hour runs, timeouts, no observability
- **Naïve:** no raw layer — schema change or bug ⇒ cannot reprocess; **cost:** full re-ingestion or lost history
- **Naïve:** no idempotency — rerun doubles counts; **cost:** wrong reports, loss of trust
- **Takeaway:** constraints (scale, failure, cost) force pipeline design; definitions don’t

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

## Best Practices (1/2)

## Start with Business Questions
- What decisions need data? Who consumes it? What latency is acceptable?
- **Don't build pipelines without purpose** — avoid “data lake as dumping ground”

## Store Raw Data & Idempotency
- **Raw data:** never delete; immutable; enables reprocessing and debugging; cost kept low with compression
- **Idempotent operations:** rerun ⇒ same output; deterministic transforms; avoid time-dependent logic; test: run twice, compare

## Monitor & Version
- **Monitor:** pipeline success/failure, data quality, latency, cost per run — **you can't fix what you don't measure**
- **Version:** code (Git), schema (versioned), data (timestamped); enables rollback and debugging

## Best Practices (2/2)

## CRISP-DM Methodology
- **Cross-Industry Standard Process for Data Mining:** Most widely-used analytics model
- **Six major phases:** Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment
- **Engineering relevance:** Data preparation (ETL) is often 60-80% of the work; data engineering enables all phases
- **Iterative nature:** Phases cycle back; data pipelines must support reprocessing and iteration

## Proof of Concept (POC)
- **Definition:** Realization of a method or idea to demonstrate feasibility; small and may not be complete
- **Purpose:** Test feasibility of business concepts; accelerate business innovation goals
- **Tips for successful POC:**
  - Use your own data — POC that doesn't use your data doesn't prove anything
  - Limit scope of data sources; trim data down or use samples
  - Don't get distracted by pretty visuals — vendors can fake graphics
  - Address future and present requirements — BI requirements are dynamic
  - Consult IT professionals even if not directly involved
  - Demand one solid report running over your data before financial commitment

## Test & Design for Failure
- **Test:** unit (functions), integration (full pipeline), data (outputs), failure (simulate errors)
- **Design for failure:** assume components fail; retry, checkpoints, recovery procedures — **production breaks; design for it**

## Document Assumptions & Optimize Last
- **Document:** sources, formats, business rules, expected volumes/latencies, failure modes
- **Optimize last:** first make it work, then reliable, then fast — **premature optimization wastes time and hides bugs**

## Recap

## Data Engineering: Constraints, Not Definitions
- **Constraints:** scale, reliability, cost; output: clean, accessible data at the right latency
- **Judgment:** ETL vs ELT, batch vs stream, schema-on-write vs -read — each choice has cost and failure modes

## Engineering Mindset (Non-Negotiable)
- **Calculate** costs and trade-offs before scaling
- **Design for failure** — pipelines and nodes will break
- **Monitor and measure** — no blind spots
- **Start simple, optimize later** — avoid premature complexity

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
