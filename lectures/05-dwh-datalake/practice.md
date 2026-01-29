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
