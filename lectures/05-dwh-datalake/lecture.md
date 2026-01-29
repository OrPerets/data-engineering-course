# Week 5: Data Warehousing and Data Lakes

## Purpose
- DWH and Data Lake are the primary stores for analytics and BI
- Schema-on-read vs schema-on-write drives cost and flexibility
- Partitioning and pruning determine query cost at scale

## Learning Objectives
- Define Data Warehouse (DWH) vs Data Lake and when to use each
- Explain schema-on-read vs schema-on-write and their trade-offs
- Model analytical data with star schema (fact + dimensions)
- Apply partitioning and partition pruning to reduce scan cost
- Reason about join size and query cost in OLAP
- Connect DWH/Lake to ETL output and BI/analytics consumers

## The Real Problem This Lecture Solves
- **Organizational failure:** A company put all analytics in one huge table with no partition key; BI built “revenue by region” with no date filter
- **Trigger:** Table grew to 1 TB; query scanned full table every time; dashboards started timing out; finance and sales could not refresh reports
- **Consequence:** Broken dashboards; mistrust in “the data is slow”; teams exported to Excel and duplicated logic; governance collapsed
- **Root cause:** No partition key in the model; no governance requiring partition filter; full scan at scale
- **Takeaway:** Bad warehouse design doesn’t just slow queries—it breaks trust and forces workarounds. This lecture is about modeling and pruning so that BI stays fast and reliable at 10× and 100× scale

## The System We Are Building (End-to-End)
- **Domain:** E-commerce sales analytics (revenue by region, by category, by time)
- **Data source(s):** Operational DB and/or ETL output from Week 4; sales and product/customer reference data
- **Ingestion boundary:** ETL/ELT loads into DWH and/or Lake (from Week 4 pipelines)
- **Staging / raw:** Lake raw zone or DWH staging; schema-on-read for landing
- **Curated layer:** DWH star schema: sales_fact (partitioned by date_key) + dim_customer, dim_product, dim_date
- **Storage:** DWH (schema-on-write, SQL) and/or Lake (Parquet by partition); same logical star can sit in either
- **Consumers:** BI tools (Tableau, Looker, etc.); analysts; reports (revenue by region, by category)
- Every later example refers to *this* system unless stated otherwise

## Sources Used (Reference Only)
- sources/Lecture 5.pptx
- exercises1.md (SQL joins/aggregations, e-commerce; ETL/ELT patterns)
- exercises2.md (Module 1: Advanced Relational Modeling and Warehousing; star schema, SCD Type 2, window functions)
- sources/new/Data Warehouse, ETL.pdf
- sources/new/Introduction to BI.pdf
- sources/new/Lecture 10.pdf (Dashboard/Tableau)

## Diagram Manifest
- Slide 13 → week5_lecture_slide13_system_overview.puml → DWH and Lake in the analytics pipeline
- Slide 14 → week5_lecture_bad_architecture.puml → bad architecture (no partition filter, full scan) and why it fails
- Slide 15 → week5_lecture_evolution_v1_v2.puml → evolution: v1 single table / no star → v2 star + partitioned fact
- Slide 22 → week5_lecture_slide22_query_flow.puml → OLAP query path and partition pruning
- Slide 38 → week5_lecture_slide38_failure_partition.puml → failure: full scan when pruning is missed

## Core Concepts (1/2)
- **Data Warehouse (DWH):** centralized store for analytical data; schema-on-write; optimized for SQL/OLAP
- **Data Lake:** store for raw and processed data; often schema-on-read; files (Parquet, ORC) or object storage
- **OLAP:** online analytical processing; aggregations, joins, reporting over large datasets

## Core Concepts (2/2)
- **Star schema:** one fact table (measures, FKs) + dimension tables (attributes); denormalized for query speed
- **Partitioning:** data split by key (e.g. date); partition pruning skips irrelevant partitions
- **Guarantees:** DWH typically ACID on tables; Lake often eventual consistency; both scale with partitioning

## Data Warehouse Definition (Formal)
- **Bill Inmon's definition:** "A data warehouse is a subject-oriented, integrated, time-variant, and nonvolatile collection of data in support of management's decision-making process"
- **Subject Oriented:** Organized around major subjects (customer, product, sales); focusing on modeling and analysis for decision makers
- **Integrated:** Constructed by integrating multiple, heterogeneous data sources; data cleaning and integration techniques applied; ensures consistency in naming conventions, encoding structures, attribute measures
- **Time Variant:** Provides information from historical perspective (e.g., past 5-10 years); unlike operational DB which holds current value data only
- **Non-Volatile:** Physically separate store; transformed from operational environment; operational updates do not occur in DWH

## Why Separate Data Warehouse?
- **Missing data:** Decision support requires historical data which operational DBs do not typically maintain
- **Data consolidation:** DS requires consolidation (aggregation, summarization) from heterogeneous sources
- **Data quality:** Different sources use inconsistent data representations
- **Performance:** Analytical queries should not impact operational system performance

## DWH Back-End Tools and Utilities
- **Data extraction:** Get data from multiple, heterogeneous, and external sources
- **Data cleaning:** Detect errors in the data and rectify them when possible
- **Data transformation:** Convert data from legacy or host format to warehouse format
- **Load:** Sort, summarize, consolidate, compute views, check integrity, build indices and partitions
- **Refresh:** Propagate updates from data sources to the warehouse

## DWH Process Architectures
- **Centralized:** Data collected into single centralized storage and processed by single machine with huge structure (memory, processor, storage)
- **Distributed:** Information and processing allocated across data centers; processing localized with results grouped into centralized storage
- **Trade-off:** Centralized simpler to manage; distributed better for scale and locality

## Multidimensional Modeling

## What is Multidimensional Modeling?
- A technique for structuring data around business concepts
- **ER models:** Describe entities and relationships (operational focus)
- **Multi-dimensional models:** Describe measures and dimensions (analytical focus)
- **Measures:** Numerical data being tracked in business; can be analyzed and examined (e.g., sales amount, quantity)
- **Dimensions:** Business parameters that define a transaction (e.g., time, product, store, customer)

## Dimensional Hierarchy
- Dimensions are organized into hierarchies
- **Time dimension example:** days → weeks → quarters → years
- **Product dimension example:** product → product line → brand → category
- Dimensions have attributes (e.g., Time: date, month, year; Store: id, city, state, country)
- Hierarchies enable drill-down and roll-up operations in OLAP

## DWH Schema Types

## The Star Schema (Classic)
- **Definition:** A relational model with one-to-many relationship between dimension tables and fact table
- **Structure:** Single fact table with detail and summary data; fact table primary key has one key column per dimension; each dimension is a single table, highly denormalized
- **Benefits:**
  - Easy to understand
  - Intuitive mapping between business entities
  - Easy to define hierarchies
  - Reduces number of joins
- **Drawbacks:**
  - Summary data in fact table yields poorer performance for summary level
  - Huge dimension tables can be a problem

## Star Schema Example
```
Sales Fact Table:           time Dimension:
- time_key (FK)             - time_key (PK)
- item_key (FK)             - day
- branch_key (FK)           - day_of_the_week
- location_key (FK)         - month
- units_sold                - quarter
- dollars_sold              - year
- avg_sales (measures)
                            item Dimension:
branch Dimension:           - item_key (PK)
- branch_key (PK)           - item_name
- branch_name               - brand
- branch_type               - type
                            - supplier_type
```

## The Snowflake Schema
- **Definition:** A schema where one or more dimension tables do not connect directly to the fact table but must join through other dimension tables
- **Snowflaking:** Method of normalizing dimension tables in a star schema; attributes with low cardinality removed to form separate tables linked through artificial keys
- **Suitable for:** Many-to-many and one-to-many relationships between dimension levels
- **Result:** More complex queries and reduced query performance
- **Advantages:**
  - Small saving in storage space
  - Normalized structures easier to update and maintain
- **Disadvantages:**
  - Schema less intuitive
  - Difficult to browse through contents

## The Galaxy Schema (Fact Constellation)
- **Definition:** Two or more fact tables sharing one or more dimensions
- **Use case:** When multiple business processes share common dimensions
- **Example:** Sales fact table and Shipping fact table sharing time, item, and location dimensions
- **Describes:** Logical structure of data warehouse or data mart with multiple subjects

## Which Schema Design is Best?
- **Performance benchmarking** can determine best design for your use case
- **Snowflake:** Easier to maintain when dimension tables are very large (reduces overall space); not generally recommended in DWH environment
- **Star:** More effective for data cube browsing (fewer joins); can significantly affect performance positively
- **Engineering rule:** Start with star schema; snowflake only if dimension maintenance is a proven bottleneck

## Architectural Fork: Lake First vs DWH First
- **Option A — Lake first:** Ingest raw to Lake; process in Lake (Spark, etc.); sync curated tables to DWH or query Lake with SQL engine
  - Pros: raw preserved; flexibility for ML/data science; storage cheap
  - Cons: two places to govern; latency if DWH is secondary; small-file and schema evolution issues in Lake
- **Option B — DWH first:** Ingest (or ETL) directly into DWH; star schema in DWH; BI only on DWH
  - Pros: one place for BI; strong consistency; no small-file problem
  - Cons: raw may be limited; less flexibility for ad-hoc/ML in same store
- **Decision rule:** Choose Lake first when you need raw + ML + multiple engines. Choose DWH first when BI and governed reporting are the main consumers. In *this* system we show both: Lake for raw and flexibility; DWH for curated star and BI

## Architectural Fork: Schema-on-Read vs Schema-on-Write (DWH/Lake)
- **Option A — Schema-on-write (DWH default):** Data validated and typed on load; bad row fails load
  - Pros: predictable types; simple queries; integrity at write
  - Cons: one bad row can fail batch; schema change = migration
- **Option B — Schema-on-read (Lake default):** Load raw (e.g. Parquet/JSON); apply schema when querying
  - Pros: flexibility; schema evolution without full reload; bad rows can be isolated (DLQ)
  - Cons: consumers must handle types; consistency is eventual
- **Decision rule:** Use schema-on-write for curated fact and dimensions in DWH. Use schema-on-read at the Lake landing layer. In *this* system: curated star is schema-on-write; raw zone in Lake is schema-on-read

## DWH vs Data Lake (1/2)
- **DWH:** structured; schema enforced on load; SQL engines (Snowflake, BigQuery, Redshift); best for curated reporting
- **Lake:** raw + processed; schema applied at read; file-based (S3, HDFS); best for flexibility and cost at scale
- **Hybrid:** Lakehouse (Delta, Iceberg) combines lake storage with DWH-like table semantics

## DWH vs Data Lake (2/2)
- **Cost model:** DWH: compute + storage often coupled; Lake: storage cheap, compute on demand
- **What breaks at scale:** DWH: very large single table scans; Lake: small-file problem; both: skew and hot partitions
- **Use case:** DWH for governed, low-latency BI; Lake for raw landing and ML/data science

## Schema-on-read vs schema-on-write
- **Schema-on-write:** data validated and typed on load; bad row fails load; DWH default
- **Schema-on-read:** load raw (e.g. as text or JSON); apply schema when querying; Lake default
- **Trade-off:** write-time validation vs flexibility; DLQ and staging support schema-on-read in pipelines

## Star schema and OLAP (This System)
- **Fact table:** sales_fact (sale_id, customer_key, product_key, date_key, quantity, amount); partitioned by date_key
- **Dimension tables:** dim_customer (region, etc.), dim_product (category, etc.), dim_date (month, year)
- **Benefit:** simple joins; predictable query patterns; partition fact by date for pruning
- In *this* system, BI queries always filter by date_key so only relevant partitions are scanned

## Partitioning and pruning
- **Partition key:** e.g. `date_key`; data stored in directories or segments per partition
- **Partition pruning:** query with `WHERE date_key BETWEEN 20251201 AND 20251231` reads only those partitions
- **Cost:** scan size ≈ (selected partitions / total partitions) × table size; pruning reduces I/O

## DWH and Lake: pipeline overview (This System)
- Sources (DB, logs, files) → ETL/ELT → DWH (curated star: sales_fact + dims) and/or Lake (raw + processed zones)
- BI and analytics query DWH or Lake via SQL engines; Lake often queried with Spark/Presto
- Diagram: week5_lecture_slide13_system_overview.puml

## Bad Architecture: Why This Fails in Production
- **Anti-pattern:** One huge fact-like table; no partition key; BI reports with no date filter
- **What goes wrong:** Every “revenue by region” query does full table scan; at 1 TB, queries timeout; dashboards break
- **Hot partition:** If partitioned but only by date, “today” gets all writes and most reads ⇒ throttle and skew
- **Diagram:** week5_lecture_bad_architecture.puml (full scan vs pruned scan)

## Cost of Naïve Design (DWH / Lake)
- **Naïve choice:** One big table; no partition key; “we’ll add filters in the query”
- **Cost at scale:** Full scan at 1 TB ⇒ 15+ min or timeout; dashboards fail; teams export to Excel and duplicate logic; governance collapses
- **Real cost:** Not just slow queries—trust in “the data” breaks; ad-hoc SQL without partition filter becomes the norm
- **Engineering rule:** Partition fact by time; require partition filter in WHERE for all fact queries. Enforce it in governance

## Evolution: v1 Single Table → v2 Star + Partitioned Fact
- **v1:** One big table (or fact with no dimensions); no partition key; ad-hoc WHERE on any column
  - Fails at scale: full scan; unpredictable join cost; no pruning
- **v2:** Star schema; fact partitioned by date_key; dimensions small; BI required to filter by date_key
  - Pruned scan; predictable cost; governance (partition filter required)
- **Diagram:** week5_lecture_evolution_v1_v2.puml

## Running Example — Data & Goal (In This System)
- **Domain:** e-commerce sales analytics
- **Fact:** `sales_fact(sale_id, customer_key, product_key, date_key, quantity, amount)` partitioned by date_key
- **Dimensions:** dim_customer(customer_key, name, region), dim_product(product_key, name, category), dim_date(date_key, date, month, year)
- **Goal:** revenue by region and by category; partition fact by date_key; use pruning

## Running Example — Step-by-Step (1/4)
- **Step 1:** Fact table partitioned by date_key (e.g. one partition per day)
- Sample: (1, 101, 201, 20251201, 2, 19.98), (2, 102, 202, 20251201, 1, 9.99)
- Dimensions: small; not partitioned (or partition by dimension key if huge)
- Diagram in step 2: system already shown; next: query flow

## Running Example — Step-by-Step (2/4)
- **Step 2:** Query: revenue by region for December 2025
- Join sales_fact → dim_customer on customer_key; filter date_key between 20251201 and 20251231
- In *this* system, partition pruning: only December partitions scanned; rest skipped
- Aggregate: SUM(amount) grouped by region

```sql
SELECT c.region, SUM(f.amount) AS total_revenue
FROM sales_fact f
JOIN dim_customer c ON f.customer_key = c.customer_key
WHERE f.date_key BETWEEN 20251201 AND 20251231
GROUP BY c.region ORDER BY total_revenue DESC;
```
- Query path (pruning → scan → join → aggregate): see slide 22 diagram

## Running Example — Step-by-Step (3/4)
- **Step 3:** Same fact, different dimensions: revenue by category
- Join sales_fact → dim_product on product_key; same date filter
- Same partition pruning; different dimension join; same fact scan once if both queries share engine cache
- Engineering: order of join (fact–dim) and filter–aggregate reduces intermediate size

## Running Example — Step-by-Step (4/4)
- **Output:** result sets: (region, total_revenue) and (category, total_revenue)
- **Conclusion:** star schema + partition by date gives predictable joins and pruning
- **Trade-off:** denormalization duplicates dimension attributes; acceptable for analytics; surrogate keys in fact for SCD

## Cost & Scaling Analysis (1/3)
- **Time model:** query time ≈ scan_time + join_time + aggregate_time
- Scan time ∝ rows read; partition pruning reduces rows read
- Formula (intuition): \( T \propto R_{\text{scan}} / \text{throughput} \); \( R_{\text{scan}} \) reduced by pruning

## Cost & Scaling Analysis (2/3)
- **Memory / storage:** fact table dominates; dimensions small; partition fact to bound scan per query
- Storage: DWH often columnar (compress well); Lake: Parquet/ORC by partition
- Peak memory: join buffers (dim in memory, fact streamed) or hash tables for large joins

## Cost & Scaling Analysis (3/3)
- **Network / throughput:** in distributed DWH, shuffle between nodes for joins and aggregates
- Partition pruning reduces data moved; co-location of fact and dimension by key reduces shuffle
- Latency: BI queries often 1–30 s; governed by scan size and concurrency

## Cost Intuition: What Changes at 10× Scale
- **10M rows vs 1B rows (fact):** Full scan 1B ≈ 100× more I/O than 10M; without pruning, dashboards time out; with 31-day filter, scan ≈ 1/12 of year ⇒ ~30M rows, manageable
- **Daily vs hourly partitions:** More partitions ⇒ smaller partition size; pruning still critical; avoid 10K+ tiny files in Lake (coalesce to 100 MB–1 GB per partition)
- **Full scan vs pruned (365 partitions):** Pruned to 31 partitions ⇒ ~1/12 scan; full scan = 365× more bytes read and 365× worse latency
- **Rule of thumb:** At 10× data, enforce partition filter; otherwise cost and latency explode. In *this* system we require date_key in WHERE for all fact queries

## Query flow: from BI to result
- BI tool issues SQL → query planner → partition pruning (filter by partition key) → scan only selected partitions
- Join fact to dimensions (broadcast small dims or shuffle); aggregate; return result
- Diagram next: detailed query path

## Query flow: partition pruning and join
- 1) Parse query; extract partition filter (e.g. date range)
- 2) List partitions to read; skip others (pruning)
- 3) Scan fact partitions; join to dimensions; aggregate
- Diagram: week5_lecture_slide22_query_flow.puml

## Join size and cost intuition
- **Fact–dim join:** fact has FK; dimension small; cost ≈ scan fact (pruned) + lookup dim (often in memory)
- **Large join:** if dimension large or no pruning, shuffle and memory can dominate
- **Best practice:** partition fact by time; keep dimensions small or partition by key

## Failure Story 1: Full Scan Kills Dashboards
- **Trigger:** Table grew to 1 TB; “revenue by region” report had no date filter; new analyst copied an old query that omitted WHERE date_key
- **Symptom:** Report ran 15+ minutes or timed out; dashboard refresh failed; users thought “data is broken”
- **Root cause:** No partition key in query; optimizer scanned all partitions; full table scan at 1 TB
- **Design fix:** Enforce partition filter for fact tables above size threshold; BI template and governance require date range; monitor bytes/partitions read and alert on full scan; in *this* system we document “always WHERE date_key” and add checks

## Failure Story 2: Small-File Explosion in the Lake
- **Trigger:** Streaming inserts wrote one small file per micro-batch; partition “2025-12-01” had 50K files
- **Symptom:** Queries over that partition took minutes; metadata overhead and open cost dominated; same query on compacted data took seconds
- **Root cause:** Many small files per partition; scan cost = file open + read; 50K files ⇒ 50K× metadata and open overhead
- **Design fix:** Compaction job: coalesce small files into larger ones (e.g. 100 MB–1 GB per file); run periodically or on schedule; in Lake, use table formats (Delta, Iceberg) with automatic compaction where possible

## Pitfalls & Failure Modes (1/3)
- **No partition key in query:** full table scan; high latency and cost; common mistake in ad-hoc SQL
- **Schema evolution:** new columns in Lake; old readers ignore; DWH requires ALTER or new version
- **Small-file problem (Lake):** many tiny files per partition; overhead per file; coalesce into larger files

## Pitfalls: full scan when pruning is missed
- Query: "revenue by region" without WHERE on partition key (e.g. date)
- Engine scans all partitions ⇒ full scan; time and cost scale with total data
- Fix: require partition filter in critical reports; or constrain date range in BI

## Pitfalls: hot partition and skew
- One partition (e.g. today) gets most writes and reads; hot partition
- Can throttle writes and slow queries; in Lake, many small files in one partition
- Mitigation: partition by date + bucket by key; spread load; limit partition size

## Pitfalls: dimension too large
- If dimension is huge (e.g. all products), join with fact can cause large shuffle
- Options: pre-aggregate; keep only needed attributes in a "mini" dimension; or partition dimension
- Cost reasoning: join size ≈ O(|fact scan|) if dim fits in memory; else O(|fact| + |dim|) shuffle

## Pitfalls: detection
- Monitor: query scan size (rows/bytes read); partition pruning (partitions read vs total)
- Alert: full table scan (no partition filter); long-running joins; OOM on large dim join
- Metrics: per-query bytes read; partition count read; join spill

## Pitfalls: mitigation summary
- Always use partition filter in queries where possible; design fact partitioned by time
- Coalesce small files in Lake; avoid unbounded partitions; size partitions for 100MB–1GB range
- Next: diagram of full scan (pruning missed) vs pruned scan

## Engineering Judgment
- **Never expose a large fact table without a partition key** and governance that requires the filter. Default: partition by date; require date range in WHERE for BI.
- **If you’re unsure about query patterns,** default to partitioning the fact by time (date_key) and keeping dimensions small. Broadcast dimensions; stream fact with pruning.
- **In the Lake, never leave small-file problem unaddressed.** Target 100 MB–1 GB per file per partition; run compaction on a schedule.
- **Choose DWH for governed BI, Lake for raw + ML.** Hybrid (Lakehouse or sync curated to DWH) when you need both; in *this* system we show both and connect them to one logical star

## Rerun and idempotency (DWH/Lake)
- Incremental load into fact: watermark on date; same pattern as Week 4 ETL
- Rerun must not duplicate fact rows; use MERGE or partition-level overwrite
- Control table: last_loaded_date; update only after successful load

## Lake: small-file and compaction
- Many small writes (e.g. streaming) create many small files per partition
- Each file has metadata and open overhead; scan of 10K files slower than 10 large files
- Compaction: coalesce small files into larger ones; run periodically or on schedule

## DWH: partition key in every query
- Critical reports must filter by partition key (e.g. date range)
- Without filter: optimizer may still scan all partitions; cost = full scan
- Governance: require partition filter for tables above size threshold

## Cost recap: pruning vs full scan
- Pruned: scan size = (selected partitions / total) × table size; e.g. 1/365 of year
- Full scan: scan size = full table; 365× more I/O and time
- Engineering: enforce filters in BI; document partition key for operators

## Failure: what we want
- Query with date filter → few partitions read → low latency and cost
- Query without date filter → all partitions read → high latency; possible timeout
- Diagram next: left = pruned (good); right = full scan (failure mode)

## Failure scenario: full scan
- Left: query with date filter → few partitions read → low cost
- Right: same query without date filter → all partitions read → high cost and latency
- Diagram: week5_lecture_slide38_failure_partition.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor scan size, partition count read, join spill; alert on full scan
- **Mitigation:** enforce partition filters; coalesce files; size partitions; pre-aggregate or mini dimensions
- **Lake + DWH:** use Lake for raw and heavy ML; use DWH for governed BI; sync curated tables as needed

## BI Consumers and Dashboards

## What is a Dashboard?
- **Stephen Few (2004):** "A dashboard is a visual display of the most important information needed to achieve one or more objectives; consolidated and arranged on a single screen so the information can be monitored at a glance"
- **Big Book of Dashboards (2017):** "A dashboard is a visual display of data used to monitor conditions and/or facilitate understanding"
- **Key insight:** Dashboards are the primary consumer of DWH data; design DWH for dashboard query patterns

## What Makes a Good Dashboard?
1. Answers a set of questions
2. Follows a flow and invites interactivity
3. Primarily in the form of summaries and exceptions
4. Specific to and customized for the dashboard's audience and objectives
5. Makes strategic use of color

## UI/UX Design Principles for BI
- **User familiarity:** Interface based on user-oriented terms
- **Consistency:** Appropriate level of consistency in system display
- **Minimal surprise:** Predictable operation of comparable commands
- **User guidance:** Help systems, on-line manuals supplied
- **User diversity:** Interaction facilities for different types of users (e.g., larger text for those with seeing difficulties)

## Human Factors in Dashboard Design
- **Limited short-term memory:** People can instantaneously remember about 7 items; presenting more increases mistakes
- **People make mistakes:** Inappropriate alarms and messages can increase stress and likelihood of more mistakes
- **Different interaction preferences:** Some like pictures, some like text

## Color Use Guidelines
- Limit the number of colors used and be conservative
- Use color change to show change in system status
- Use color coding to support the task users are trying to perform
- Use color coding thoughtfully and consistently
- Be careful about color pairings (accessibility)

## Information Presentation Types
- **Static information:** Initialized at beginning of session; does not change during session (numeric or textual)
- **Dynamic information:** Changes during session; changes must be communicated to user (numeric or textual)
- **Engineering implication:** DWH must support both periodic batch updates and near-real-time refresh based on dashboard requirements

## BI Tools Connection to DWH
- BI tools connect to DWH via SQL, stored procedures, or APIs
- Common connections: SQL Server Management Studio, Excel Pivot Tables, Tableau, Power BI, Looker
- **Architecture:** DWH → Stored Procedures → BI Tool → Reports/Dashboards
- All these tools assume clean, well-modeled data in DWH (star schema, partitioned, indexed)

## Best Practices (1/2)
- Model analytics with star schema; partition fact table by date (or time range)
- Always include partition key in WHERE for large tables to enable pruning
- Use surrogate keys in fact for dimensions (SCD Type 2); keep dimensions small or partitioned
- In Lake: store in columnar format (Parquet/ORC); coalesce small files; schema evolution with care

## Best Practices (2/2)
- Document partition key and expected query patterns for operators
- Monitor query cost (bytes read, partitions read); alert on full scans
- Separate raw, processed, and curated zones; govern access to curated layer
- Trade-off: denormalization (star) for query speed vs normalization for storage
- Enforce: no fact query without partition filter above size threshold; target 100 MB–1 GB per file in Lake

## Recap (Engineering Judgment)
- **DWH vs Lake:** DWH for governed BI and low-latency reporting; Lake for raw landing and ML. Hybrid (Lakehouse or sync curated to DWH) when you need both. Don’t expose one huge table without a partition key.
- **Partition pruning is the lever.** Full scan at 1 TB kills dashboards and trust. Require date_key (or equivalent) in WHERE for all fact queries; enforce in governance and BI templates.
- **Star schema + partition by time:** Predictable joins and pruning. Keep dimensions small; broadcast them; stream fact with pruning. In Lake, coalesce small files—target 100 MB–1 GB per file.
- **Cost:** At 10× data, enforce partition filter or cost and latency explode. Monitor bytes/partitions read; alert on full scan.

## Pointers to Practice
- Build star schema (fact + ≥2 dimensions) with sample rows; write OLAP query with partition filter
- Show partition pruning: which partitions are read for a given WHERE clause
- Reason about join size and cost: fact scan vs dimension size; when shuffle dominates
- Optional: incremental load into fact (watermark) and idempotent rerun (from Week 4)
