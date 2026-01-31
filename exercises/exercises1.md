# Data Engineering Exercises and Solutions

## Topic: SQL Joins and Aggregations

### Context & Data {#context-data}

We have a small **e-commerce** dataset for online sales. Each order is recorded with customer and product details. We want to perform analytical queries combining these tables.

### Tables / files / streams {#tables-files-streams}

- **customers** table: customer information.
- **products** table: product details.
- **orders** table: individual sales orders.

### Schema definitions

- `customers(customer_id INT, name VARCHAR, region VARCHAR)`
- `products(product_id INT, name VARCHAR, category VARCHAR)`
- `orders(order_id INT, customer_id INT, product_id INT, quantity INT, unit_price FLOAT, order_date DATE)`

### Sample rows

- `customers`: (1, \'Alice\', \'North\'), (2, \'Bob\', \'East\'), (3, \'Charlie\', \'West\')
- `products`: (101, \'T-shirt\', \'Clothing\'), (102, \'Coffee Mug\', \'Home\'), (103, \'Notebook\', \'Office\')
- `orders`: (1001, 1, 101, 2, 9.99, \'2025-12-01\'), (1002, 2, 103, 5, 3.49, \'2025-12-03\'), (1003, 1, 102, 1, 12.95, \'2025-11-28\')

### Approximate scale

- `customers`: \~10,000 rows (1 GB)
- `products`: \~1,000 rows (100 MB)
- `orders`: \~10 million rows per year (\~1 TB)

#### Exercise 1

Calculate the total revenue (quantity \* unit_price) by region for orders placed in December 2025, and list the regions in descending order of revenue. Assume an index exists on `orders(order_date)`. **Constraint:** Must run on 10M orders table in \<30 seconds.

#### Solution 1

**Step-by-step reasoning:** - Join `orders` with `customers` on `customer_id`.  
- Filter orders by `order_date` between \'2025-12-01\' and \'2025-12-31\'.  
- Compute revenue as `quantity * unit_price`.  
- Group by `region` and sum revenue.  
- Order by sum descending.

**SQL query:**

    SELECT c.region, SUM(o.quantity * o.unit_price) AS total_revenue
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    WHERE o.order_date >= '2025-12-01' AND o.order_date <= '2025-12-31'
    GROUP BY c.region
    ORDER BY total_revenue DESC;

**Explanation of correctness:**  
This query joins the tables and aggregates revenue per region for December 2025. It uses an index on `order_date` to filter rows efficiently. Grouping by `region` and summing yields total revenue per region.

**Engineering notes:**  
- An index on `(order_date, customer_id)` speeds up the filter and join.  
- If the data is partitioned by date, the query scans only the December partition.  
- Ensure `unit_price` is numeric to avoid precision loss.  
- Watch out for NULLs in `quantity` or `unit_price`; filter them out or treat as zero if needed.

#### Exercise 2

List all product categories that had **no sales** in the first week of December 2025. We define \"first week\" as \'2025-12-01\' to \'2025-12-07\'. **Constraint:** Avoid full table scans on `orders`.

#### Solution 2

**Step-by-step reasoning:** - Identify products sold in that week by joining `orders` and `products`.  
- Find categories of those sold products.  
- Use a subquery or `NOT EXISTS` to find categories without any orders in that date range.

**SQL query:**

    SELECT DISTINCT p.category
    FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.product_id = p.product_id
          AND o.order_date BETWEEN '2025-12-01' AND '2025-12-07'
    );

**Explanation of correctness:**  
This query selects product categories for which no corresponding orders exist in the specified date range. The `NOT EXISTS` clause effectively filters out categories that had any sales in the first week.

**Engineering notes:**  
- Ensure an index on `(product_id, order_date)` to speed up the subquery.  
- Alternatively, use a left join: select categories from `products` left-joined with the filtered orders and pick where `orders.product_id IS NULL`.  
- If categories are few, an anti-join is efficient.  
- Products with no orders ever will appear as "no sales", which is correct here.

## Topic: SQL in ETL/ELT Pipelines

### Context & Data {#context-data-1}

An analytics pipeline receives daily raw user event logs that need to be cleaned and loaded into a production data table. The raw logs contain duplicate events and inconsistent timestamp formats.

### Tables / files / streams {#tables-files-streams-1}

- **raw_events** (staging table, append-only logs)
- **events_clean** (final table in the data warehouse)

### Schema definitions

- `raw_events(event_id INT, user_id INT, event_type VARCHAR, event_timestamp VARCHAR, details JSON)`
- `events_clean(event_id INT, user_id INT, event_type VARCHAR, event_time TIMESTAMP, details JSON)`

### Sample rows

- `raw_events`: (1, 101, \'click\', \'2025/12/01 08:00:00\', \'{\"page\": \"home\"}\'), (2, 102, \'view\', \'2025-12-01T09:30:00\', \'{\"page\": \"product\"}\'), (1, 101, \'click\', \'2025-12-01 08:00:00\', \'{\"page\": \"home\"}\')
- `events_clean`: (empty initially)

### Approximate scale

- `raw_events`: \~100 million rows per day (10 GB/day)
- `events_clean`: \~1 billion rows total (100 GB)

#### Exercise 1

Transform and load the initial data from `raw_events` into `events_clean`:  
- Remove duplicate events (same `event_id`).  
- Normalize the timestamp to a proper `TIMESTAMP`.  
- Only keep events of types \'click\', \'view\', \'purchase\'.

**Constraint:** The batch job must finish within 10 minutes for 100M rows.

#### Solution 1

**Step-by-step reasoning:** - Filter `raw_events` for the allowed types (\'click\',\'view\',\'purchase\').  
- Deduplicate by `event_id`, keeping one row per ID (e.g., earliest).  
- Cast `event_timestamp` to `TIMESTAMP`.  
- Insert cleaned rows into `events_clean`.

**SQL pseudocode:**

    WITH filtered AS (
      SELECT event_id, user_id, event_type,
             CAST(event_timestamp AS TIMESTAMP) AS event_time,
             details
      FROM raw_events
      WHERE event_type IN ('click','view','purchase')
    ), deduped AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
      FROM filtered
    )
    INSERT INTO events_clean (event_id, user_id, event_type, event_time, details)
    SELECT event_id, user_id, event_type, event_time, details
    FROM deduped
    WHERE rn = 1;

**Explanation of correctness:**  
This pipeline filters out unwanted types, then uses `ROW_NUMBER()` to keep only one row per `event_id`, effectively removing duplicates. It also casts `event_timestamp` to `TIMESTAMP`. The `WHERE rn = 1` ensures exactly one row per event ID.

**Engineering notes:**  
- The window function handles deduplication but requires sorting by `event_id`.  
- Ensure the database can parallelize the INSERT (consider batching or bulk load).  
- Alternatively, use `SELECT DISTINCT ON (event_id)` if supported (e.g., in PostgreSQL).  
- In a distributed SQL engine, ensure sufficient memory for the window operation.  
- Storing `events_clean` partitioned by date improves downstream query performance.

#### Exercise 2

A new batch of events (the next day\'s data) arrives each morning. Describe how to update `events_clean` incrementally with the new data from `raw_events`, avoiding duplicate inserts if the job is re-run.

#### Solution 2

**Step-by-step reasoning:** - The new data is also in `raw_events` (assume partitioned by date).  
- We need an **upsert** (merge) logic: insert new events and skip already-present ones.  
- Apply the same filtering/dedup logic as in the initial load.  
- Use a `MERGE` or `INSERT ... ON CONFLICT DO NOTHING` so rerunning doesn't duplicate.

**SQL pseudocode:**

    WITH filtered AS (
      SELECT event_id, user_id, event_type,
             CAST(event_timestamp AS TIMESTAMP) AS event_time,
             details
      FROM raw_events
      WHERE event_type IN ('click','view','purchase')
    ), deduped AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_time) AS rn
      FROM filtered
    ), to_upsert AS (
      SELECT event_id, user_id, event_type, event_time, details
      FROM deduped
      WHERE rn = 1
    )
    MERGE INTO events_clean AS target
    USING to_upsert AS src
    ON target.event_id = src.event_id
    WHEN NOT MATCHED THEN
      INSERT (event_id, user_id, event_type, event_time, details)
      VALUES (src.event_id, src.user_id, src.event_type, src.event_time, src.details);

**Explanation of correctness:**  
This incremental pipeline uses the same cleaning logic, then merges into `events_clean`. The `MERGE` (or `ON CONFLICT DO NOTHING`) ensures that if an `event_id` already exists, it is not inserted again, making the job idempotent (re-runs are safe)[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A).

**Engineering notes:**  
- Partition `events_clean` by date to limit the scope of queries.  
- If `raw_events` is append-only, track which partitions are processed to skip old data.  
- The `MERGE` assumes `event_id` is unique (primary key).  
- Monitor late-arriving or backfilled data; ensure idempotent reprocessing handles it.  
- For large scale, use a data warehouse with efficient `MERGE` (e.g., Snowflake, BigQuery).

## Topic: Batch Data Ingestion

### Context & Data {#context-data-2}

Every evening, a new batch of sales data is delivered as a CSV file. We need to ingest these files into a relational database.

### Tables / files / streams {#tables-files-streams-2}

- **daily_sales.csv**: CSV file in a landing directory.
- **sales** table: final table to store all sales.

### Schema definitions

- `daily_sales.csv` has columns `(sale_id INT, product_id INT, sale_date DATE, quantity INT, amount FLOAT)`.
- `sales(sale_id INT PRIMARY KEY, product_id INT, sale_date DATE, quantity INT, amount FLOAT)`.

### Sample rows

- `daily_sales.csv`: (1001, 500, \'2025-12-01\', 2, 19.98), (1002, 501, \'2025-12-01\', 1, 9.99)
- `sales` table (before load): (1000, 499, \'2025-11-30\', 5, 49.95)

### Approximate scale

- Daily file: \~5 million rows (\~500 MB).
- `sales` table: \~100 million rows.

#### Exercise 1

Design a batch ingestion process to load `daily_sales.csv` into the `sales` table: 1. Read the CSV file.  
2. Load data into the `sales` table.  
3. Ensure duplicates in `daily_sales.csv` (rows with the same `sale_id`) are ignored.

#### Solution 1

**Step-by-step pseudocode:** - **Step 1:** Bulk load into a staging table, e.g., using `COPY`:

    CREATE TEMP TABLE sales_staging (sale_id INT, product_id INT, sale_date DATE, quantity INT, amount FLOAT);
    COPY sales_staging FROM 'daily_sales.csv' WITH (FORMAT csv, HEADER);

\- **Step 2:** Remove duplicates in staging:

    DELETE FROM sales_staging
    WHERE sale_id IN (
      SELECT sale_id FROM sales_staging
      GROUP BY sale_id
      HAVING COUNT(*) > 1
    ) AND ctid NOT IN (
      SELECT min(ctid) FROM sales_staging
      GROUP BY sale_id
    );

\- **Step 3:** Insert into `sales` (assuming no conflicts with existing data for this run):

    INSERT INTO sales (sale_id, product_id, sale_date, quantity, amount)
    SELECT sale_id, product_id, sale_date, quantity, amount
    FROM sales_staging;

\- **Step 4:** Clean up:

    DROP TABLE sales_staging;

**Explanation of correctness:**  
The process bulk loads the file into a staging area, deduplicates by `sale_id`, and then inserts into `sales`. The `DELETE ... HAVING COUNT(*)` pattern keeps only one row per `sale_id`.

**Engineering notes:**  
- Staging allows safe transformations (dedup, type fixes) before touching the main table.  
- Ensure enough disk/memory for 5M-row staging table.  
- The `COPY` (or similar bulk load) handles large files efficiently.  
- Alternatively, use `INSERT ... ON CONFLICT DO NOTHING` to ignore rare duplicates.  
- Monitor for load errors (e.g., malformed rows) and log them.

#### Exercise 2

Suppose the daily file may contain some records that already exist in the `sales` table (e.g., a re-delivered file). How would you modify the ingestion process to **upsert** the data: insert new rows and update existing rows by `sale_id`?

#### Solution 2

**Step-by-step reasoning:** - Perform initial load into staging as before.  
- Use an upsert (`INSERT ... ON CONFLICT`) to handle existing `sale_id`s.  
- If a `sale_id` exists, update it; otherwise insert it.

**SQL pseudocode:**

    INSERT INTO sales (sale_id, product_id, sale_date, quantity, amount)
    SELECT sale_id, product_id, sale_date, quantity, amount
    FROM (
      SELECT DISTINCT ON (sale_id) sale_id, product_id, sale_date, quantity, amount
      FROM sales_staging
      ORDER BY sale_id, sale_date DESC
    ) AS deduped_staging
    ON CONFLICT (sale_id) DO UPDATE
    SET product_id = EXCLUDED.product_id,
        sale_date = EXCLUDED.sale_date,
        quantity = EXCLUDED.quantity,
        amount = EXCLUDED.amount;

**Explanation of correctness:**  
This query inserts new sales and updates any existing records with the same `sale_id`. The subquery ensures one row per `sale_id` (e.g., latest). `ON CONFLICT DO UPDATE` handles the upsert logic.

**Engineering notes:**  
- Requires `sale_id` to be UNIQUE or PRIMARY KEY.  
- Makes the pipeline idempotent on re-runs.  
- In large tables, updating can be costly; monitor performance.  
- Use transactions so partial failures don't corrupt data.  
- For high throughput, only update changed rows if possible.

## Topic: Incremental Data Ingestion

### Context & Data {#context-data-3}

A data pipeline ingests daily updates from an operational database. Changes (inserts/updates) are exported to a file `daily_updates.csv`. We need to apply these changes to our warehouse table.

### Tables / files / streams {#tables-files-streams-3}

- **daily_updates.csv**: incremental changes (`product_id`, `price`, `last_updated`).
- **products** table: current product data (`product_id, price, last_updated`).

### Schema definitions

- `daily_updates.csv(product_id INT, price FLOAT, last_updated DATE)`.
- `products(product_id INT PRIMARY KEY, price FLOAT, last_updated DATE)`.

### Sample rows

- `daily_updates.csv`: (500, 19.99, \'2025-12-02\'), (501, 9.49, \'2025-12-02\'), (502, 12.00, \'2025-12-01\')
- `products`: (500, 18.99, \'2025-12-01\'), (501, 9.49, \'2025-12-01\'), (503, 15.00, \'2025-12-01\')

### Approximate scale

- Daily updates: \~100,000 rows.
- `products` table: \~10 million rows.

#### Exercise 1

Apply changes from `daily_updates.csv` to `products` so that: - If `product_id` exists and `last_updated` in CSV is newer, update its price and timestamp. - If it does not exist, insert it. Assume no duplicate `product_id`s in the CSV.

#### Solution 1

**Step-by-step reasoning:** - Load `daily_updates.csv`.  
- For each row, if `product_id` exists in `products` and CSV's `last_updated` is newer, update; otherwise insert.

**SQL pseudocode (MERGE):**

    WITH updates AS (
      SELECT product_id, price, last_updated FROM daily_updates_csv
    )
    MERGE INTO products AS p
    USING updates AS u
    ON p.product_id = u.product_id
    WHEN MATCHED AND u.last_updated > p.last_updated THEN
      UPDATE SET price = u.price, last_updated = u.last_updated
    WHEN NOT MATCHED THEN
      INSERT (product_id, price, last_updated)
      VALUES (u.product_id, u.price, u.last_updated);

**Explanation of correctness:**  
This `MERGE` applies only newer updates and inserts new products. Stale data (older `last_updated`) is ignored. The condition `u.last_updated > p.last_updated` ensures idempotency on reprocessing.

**Engineering notes:**  
- This is essentially **change data capture (CDC)**[\[2\]](https://en.wikipedia.org/wiki/Change_data_capture#:~:text=In%20databases%2C%20change%20data%20capture,driven%20dataset), applying deltas.  
- Use transactions to make the merge atomic.  
- If out-of-order updates can occur, more logic is needed (e.g., compare timestamps).  
- Indexes on `product_id` speed up the match.  
- After processing, verify inserted vs updated counts for monitoring.

#### Exercise 2

Now assume `daily_updates.csv` might be processed more than once, or it may contain duplicate `product_id`s. How can you make the load **idempotent** and handle duplicates?

#### Solution 2

**Step-by-step reasoning:** - To make reprocessing safe, ensure the load yields the same final state on repeats.  
- Use the unique `product_id` key in `MERGE` or `INSERT...ON CONFLICT`.  
- If duplicates exist in the CSV, deduplicate by keeping the row with the latest `last_updated`.

**SQL pseudocode:**

    WITH updates AS (
      SELECT product_id, price, last_updated,
             ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY last_updated DESC) AS rn
      FROM daily_updates_csv
    ), deduped AS (
      SELECT product_id, price, last_updated
      FROM updates
      WHERE rn = 1
    )
    MERGE INTO products AS p
    USING deduped AS u
    ON p.product_id = u.product_id
    WHEN MATCHED AND u.last_updated > p.last_updated THEN
      UPDATE SET price = u.price, last_updated = u.last_updated
    WHEN NOT MATCHED THEN
      INSERT (product_id, price, last_updated)
      VALUES (u.product_id, u.price, u.last_updated);

**Explanation of correctness:**  
The `ROW_NUMBER()` step ensures one row per `product_id` (the newest). The `MERGE` then safely applies the changes. If the same CSV is loaded twice, nothing changes the second time, achieving idempotency[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A).

**Engineering notes:**  
- Running multiple times yields the same result (idempotent)[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A).  
- Ensure the staging/dedup step is efficient (sorting 100K rows is usually fine).  
- Audit logs of rows inserted/updated help trace duplicates.  
- For streaming, consider watermarks or exactly-once sinks to avoid duplicates.

## Topic: MapReduce (Manual Execution)

### Context & Data {#context-data-4}

We have a distributed data processing framework using the MapReduce model[\[3\]](https://www.ibm.com/think/topics/mapreduce#:~:text=MapReduce%20is%20a%20programming%20model,servers%20within%20a%20Hadoop%20cluster). Input is a small collection of records. We will manually perform the map and reduce steps.

### Input records

Each record is a sentence: 1. \"the quick brown fox\"  
2. \"the quick brown dog\"  
3. \"quick brown fox jumps\"

#### Exercise 1

Perform a word count: list the map outputs, the shuffled groupings, and the final reduce outputs (word frequencies).

#### Solution 1

**Step-by-step reasoning:** - **Map step:** For each record, emit `(word, 1)` for every word.  
- **Shuffle/Grouping:** Collect values by word key.  
- **Reduce step:** Sum the counts for each word.

**Map outputs (key, value) for each input:**  
- Record1: (\"the\",1), (\"quick\",1), (\"brown\",1), (\"fox\",1)  
- Record2: (\"the\",1), (\"quick\",1), (\"brown\",1), (\"dog\",1)  
- Record3: (\"quick\",1), (\"brown\",1), (\"fox\",1), (\"jumps\",1)

**Shuffle (group by key):**  
- \"the\": \[1, 1\]  
- \"quick\": \[1, 1, 1\]  
- \"brown\": \[1, 1, 1\]  
- \"fox\": \[1, 1\]  
- \"dog\": \[1\]  
- \"jumps\": \[1\]

**Reduce outputs (sum per key):**  
- \"the\": 2  
- \"quick\": 3  
- \"brown\": 3  
- \"fox\": 2  
- \"dog\": 1  
- \"jumps\": 1

#### Exercise 2

Given sales transaction records, compute total sales per product using MapReduce. Input records (each is `product_id, sales_amount`):  
- (101, 10.0)  
- (102, 5.5)  
- (101, 7.5)  
- (103, 3.0)  
- (102, 4.5)

Show map outputs, grouped data, and reduce outputs.

#### Solution 2

**Step-by-step reasoning:** - **Map step:** Emit `(product_id, sales_amount)` for each record.  
- **Shuffle/Grouping:** Collect values by `product_id`.  
- **Reduce step:** Sum the `sales_amount` for each `product_id`.

**Map outputs:**  
- (101, 10.0)  
- (102, 5.5)  
- (101, 7.5)  
- (103, 3.0)  
- (102, 4.5)

**Shuffle (group by** `product_id`**):**  
- 101: \[10.0, 7.5\]  
- 102: \[5.5, 4.5\]  
- 103: \[3.0\]

**Reduce outputs (total sales):**  
- 101: 17.5  
- 102: 10.0  
- 103: 3.0

This demonstrates how MapReduce partitions data by key and aggregates it.

## Topic: SQL vs NoSQL Decision Making

### Context & Data {#context-data-5}

We need to choose a database storage model (SQL or NoSQL) based on application requirements and data characteristics.

#### Exercise 1

A large-scale social media application needs to store user profiles and their followers graph. Requirements:  
- Users have variable-profile fields (flexible schema).  
- Queries include fetching a user\'s posts and their followers (graph structure).  
- Data volume is huge and growing fast; the schema may evolve frequently.

Should you use a SQL (relational) or NoSQL (e.g., document or graph) database? Justify your answer.

#### Solution 1

- The followers relationships form a graph/hierarchical structure.
- Schema is flexible (users have different attributes).
- Data is large, mutates rapidly, and schema changes often.  
  These characteristics match NoSQL use-cases[\[4\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=Generally%2C%20NoSQL%20is%20preferred%20for%3A). A graph or document store (NoSQL) handles large, evolving, connected data well. SQL would struggle with schema changes and massive scale. Therefore, **NoSQL** is the better choice (e.g., a document DB or graph DB)[\[4\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=Generally%2C%20NoSQL%20is%20preferred%20for%3A)[\[5\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=SQL%20is%20more%20appropriate%20when,the%20data%20is).

#### Exercise 2

A financial transaction system requires strong consistency and complex queries (joins) across multiple related tables (e.g., accounts, transactions, customers). Data volume is large but mostly append-only. Access patterns need ACID guarantees. Should this use SQL or NoSQL? Explain.

#### Solution 2

- Data is well-structured and relational (accounts, transactions, customers).
- Strong consistency and transactions (ACID) are critical.
- Queries involve joins and aggregations.  
  These requirements align with relational databases. SQL provides robust ACID support and complex queries[\[5\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=SQL%20is%20more%20appropriate%20when,the%20data%20is). NoSQL typically lacks strong transactional guarantees. Thus, **SQL** (relational DB) is the appropriate choice for this scenario[\[5\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=SQL%20is%20more%20appropriate%20when,the%20data%20is).

## Topic: Failure and Reprocessing

### Context & Data {#context-data-6}

Consider a data pipeline that processes daily event data into a reporting table. Due to failures, parts of the pipeline may need to be re-run.

#### Exercise 1

An ETL job reads raw data partitions for 3 days (2025-12-01 to 2025-12-03) sequentially and writes results into a database. The job fails after loading the 2025-12-02 partition (i.e., only the first two days were processed). Describe how to re-run or resume the job so that 2025-12-03 data is processed **without duplicating** the already loaded data.

#### Solution 1

**Step-by-step reasoning:** - Design the job to be idempotent: re-running should not duplicate processed partitions.  
- Use partition-based loading: write each day\'s results into a separate partition or table (e.g., by date).  
- On failure after 2025-12-02, restart the job to process only 2025-12-03.  
- If using staging, truncate only the partition for 2025-12-03 before loading, leaving earlier partitions intact.  
- Track completed partitions in metadata (a control table) and skip them on re-run.

**Pseudocode:**

    for day in [2025-12-01, 2025-12-02, 2025-12-03]:
        if not processed(day):
            data = load_raw_data(day)
            result = transform(data)
            write_to_db(result, partition=day)
            mark_processed(day)

On failure, the loop resumes with the next unprocessed day, avoiding duplicates.

**Engineering explanation:**  
By recording which partitions are processed, the job avoids reprocessing them. If reprocessing the same day is needed, ensure writes are idempotent (e.g., `INSERT ... ON CONFLICT DO NOTHING`). Ensuring **idempotency** is critical: running the pipeline multiple times yields the same result[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A). Use transactions or atomic swap (load to temp table then rename on success) to prevent partial writes. Logging checkpoints or using a workflow scheduler can also help reliably resume.

#### Exercise 2

A streaming pipeline consumes Kafka events and writes aggregates to a database. Occasionally, due to Kafka retries or task restarts, duplicate events are processed. How can the pipeline ensure **exactly-once semantics** or at least avoid counting duplicates in the final output?

#### Solution 2

**Step-by-step reasoning:** - Kafka guarantees at-least-once delivery, so duplicates can occur.  
- Use deduplication in the consumer/sink:  
- Assign a unique key to each event (e.g., event ID).  
- When writing, use idempotent upsert (e.g., `INSERT ... ON CONFLICT DO NOTHING`) keyed by event ID.  
- Maintain state of processed offsets or IDs to avoid reprocessing.  
- Some streaming frameworks offer exactly-once sinks (e.g., Kafka transactions, Flink checkpoints).

**Engineering explanation:**  
Ensure idempotent writes: using unique keys or windowed deduplication means processing the same event twice has no effect. For aggregations, use stateful processing with a watermark and track processed events. Idempotency here means retrying doesn't alter the final result[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A). Use transactional sinks or changelog tables for exactly-once semantics. Monitoring Kafka offsets and leveraging the stream processor's fault-tolerance features will also help achieve correct reprocessing.

[\[1\]](https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj#:~:text=A%20process%20is%20idempotent%20if%3A) Why Idempotence Is So Important in Data Engineering - DEV Community

<https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj>

[\[2\]](https://en.wikipedia.org/wiki/Change_data_capture#:~:text=In%20databases%2C%20change%20data%20capture,driven%20dataset) Change data capture - Wikipedia

<https://en.wikipedia.org/wiki/Change_data_capture>

[\[3\]](https://www.ibm.com/think/topics/mapreduce#:~:text=MapReduce%20is%20a%20programming%20model,servers%20within%20a%20Hadoop%20cluster) What is MapReduce? \| IBM

<https://www.ibm.com/think/topics/mapreduce>

[\[4\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=Generally%2C%20NoSQL%20is%20preferred%20for%3A) [\[5\]](https://www.talend.com/resources/sql-vs-nosql/#:~:text=SQL%20is%20more%20appropriate%20when,the%20data%20is) SQL vs NoSQL: Differences, Databases, and Decisions \| Talend

<https://www.talend.com/resources/sql-vs-nosql/>
