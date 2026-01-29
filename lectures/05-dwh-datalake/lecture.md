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

## Best Practices
- Model analytics with star schema; partition fact table by date (or time range)
- Always include partition key in WHERE for large tables to enable pruning
- Use surrogate keys in fact for dimensions (SCD Type 2); keep dimensions small or partitioned
- In Lake: store in columnar format (Parquet/ORC); coalesce small files; schema evolution with care
- Document partition key and expected query patterns for operators
- Monitor query cost (bytes read, partitions read); alert on full scans
- Separate raw, processed, and curated zones; govern access to curated layer
- Trade-off: denormalization (star) for query speed vs normalization for storage

## Recap
- DWH: schema-on-write, SQL, curated; Lake: schema-on-read, flexible, raw + processed
- Star schema: fact + dimensions; partition fact by date for pruning
- Partition pruning reduces scan and cost; missing partition filter causes full scan
- Join and aggregate cost depend on scan size and dimension size; design for pruning first
- Pipeline: sources → ETL/ELT → DWH and/or Lake → BI/analytics

## Pointers to Practice
- Build star schema (fact + ≥2 dimensions) with sample rows; write OLAP query with partition filter
- Show partition pruning: which partitions are read for a given WHERE clause
- Reason about join size and cost: fact scan vs dimension size; when shuffle dominates
- Optional: incremental load into fact (watermark) and idempotent rerun (from Week 4)
