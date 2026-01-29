# **Pedagogical Framework for Advanced Data Engineering: A Comprehensive Laboratory Handbook**

## **Executive Summary**

The discipline of data engineering has evolved from simple database administration into a complex field requiring mastery of distributed systems, lambda architectures, and polyglot persistence. This report serves as a comprehensive resource for university-level instructors and senior teaching assistants tasked with designing a rigorous Data Engineering curriculum. It provides a structured bank of exercises, detailed schemas, and instructor-level solutions that bridge the gap between theoretical computer science concepts—such as CAP theorem, distributed consensus, and relational algebra—and the practical realities of building robust, scalable data pipelines.  
The curriculum design presented here moves beyond syntax proficiency. While students may know how to write a SQL SELECT statement, true engineering competency requires understanding the performance implications of window function framing, the disk I/O cost of MapReduce shuffles, and the partition-level throttling inherent in distributed NoSQL stores. Consequently, each module in this report is designed to simulate "production-grade" challenges, including handling dirty data, mitigating data skew, ensuring idempotency, and optimizing for specific access patterns.  
The report is divided into four primary modules: **Advanced Relational Modeling and Warehousing**, **Distributed Computation Primitives (MapReduce)**, **Robust Data Ingestion Architectures**, and **Non-Relational (NoSQL) Data Modeling**. Each section utilizes distinct, realistic datasets—ranging from banking transaction ledgers to high-velocity IoT telemetry and e-commerce clickstreams—to contextualize the technical challenges.

# **Module 1: Advanced Relational Modeling and Warehousing**

## **1.1 Theoretical Context: The Persistence of SQL**

Despite the rise of NoSQL and big data frameworks, the relational database remains the bedrock of enterprise data architecture, particularly for domains requiring strict consistency and complex analytical capabilities. In a data engineering context, SQL is not merely a query language but a programming environment for data transformation (ELT). This module focuses on the banking domain, a sector where data integrity is paramount and complex temporal relationships are the norm.

### **1.1.1 Schema Definition: The Banking Transaction Ledger**

To support the exercises in this module, we define a normalized schema representing a core banking system. This schema is designed to force students to navigate foreign key relationships, handle high-precision decimals, and manage temporal data.  
**Entity-Relationship Analysis:** The core entities are Customers, Accounts, and Transactions. A customer may hold multiple accounts (Savings, Checking, Loans), and each account accumulates a history of discrete transactions.  
**DDL Specification (PostgreSQL/Redshift Dialect):**  
`-- Customer Dimension: Stores slowly changing attributes like address`  
`CREATE TABLE Customers (`  
    `customer_id INTEGER PRIMARY KEY,`  
    `first_name VARCHAR(100) NOT NULL,`  
    `last_name VARCHAR(100) NOT NULL,`  
    `email VARCHAR(150) UNIQUE,`  
    `registration_date DATE DEFAULT CURRENT_DATE,`  
    `address_line1 VARCHAR(255),`  
    `city VARCHAR(100),`  
    `state VARCHAR(50),`  
    `zip_code VARCHAR(20)`  
`);`

`-- Account Entity: Links customers to financial products`  
`CREATE TABLE Accounts (`  
    `account_id INTEGER PRIMARY KEY,`  
    `customer_id INTEGER REFERENCES Customers(customer_id),`  
    `account_type VARCHAR(20) CHECK (account_type IN ('SAVINGS', 'CHECKING', 'LOAN', 'INVESTMENT')),`  
    `open_date DATE,`  
    `status VARCHAR(20) DEFAULT 'ACTIVE'`  
`);`

`-- Transaction Fact Table: The high-volume ledger`  
`CREATE TABLE Transactions (`  
    `transaction_id BIGINT PRIMARY KEY,`  
    `account_id INTEGER REFERENCES Accounts(account_id),`  
    `transaction_type VARCHAR(20) CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT')),`  
    `amount DECIMAL(18, 2) NOT NULL,`  
    `transaction_ts TIMESTAMP NOT NULL,`  
    `merchant_description VARCHAR(255),`  
    `metadata JSONB -- Flexible field for diverse banking notes`  
`);`

**Data Profiling and Sample Generation:** For the exercises to be effective, the sample data must exhibit realistic characteristics, including gaps in activity, varying transaction velocities, and potential duplicates from upstream retries.

| transaction\_id | account\_id | type | amount | transaction\_ts | description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 10001 | A882 | DEPOSIT | 5000.00 | 2023-10-01 08:30:00 | Payroll Deposit |
| 10002 | A882 | WITHDRAWAL | 45.50 | 2023-10-01 12:15:00 | Grocery Store |
| 10003 | A991 | DEPOSIT | 100.00 | 2023-10-02 09:00:00 | ATM Cash In |
| 10004 | A882 | TRANSFER\_OUT | 200.00 | 2023-10-03 14:00:00 | Utility Bill |
| 10005 | A882 | DEPOSIT | 5000.00 | 2023-10-15 08:30:00 | Payroll Deposit |

## **1.2 Exercise 1: Advanced Analytical SQL and Window Functions**

### **1.2.1 Learning Objective**

This exercise aims to transition students from basic aggregation (GROUP BY) to row-relative analytics using Window Functions. In financial reporting, simple summations are insufficient; analysts require running totals, moving averages, and rank-based filtering. The core engineering challenge is understanding how OVER clauses partition and sort data memory without collapsing rows.

### **1.2.2 Task Description**

**Scenario:** The fraud detection team requires a "Customer Financial Profile" for account A882. They need to analyze spending patterns relative to historical averages to identify anomalies.  
**Requirement:** Write a SQL query that produces a report containing:

1. **Transaction Details:** Date, Type, Amount.  
2. **Running Balance:** The account balance immediately after each transaction, assuming a starting balance of $0.  
3. **7-Day Moving Average:** The average transaction amount for the current day and the preceding 6 days.  
4. **Previous Transaction Gap:** The time difference (in hours) between the current transaction and the immediately preceding one.

### **1.2.3 Solution and Engineering Reasoning**

**The Naive Approach (Self-Joins):** A novice engineer might attempt to calculate a running balance by joining the Transactions table to itself (t1 and t2) on t1.date \>= t2.date.

* **Engineering Critique:** This approach has a time complexity of O(N^2). If an account has 10,000 transactions, the database must perform 100,000,000 comparisons. In a data warehouse with billions of rows, this is computationally prohibitive and will likely result in a timeout or spill-to-disk.

**The Optimized Approach (Window Functions):** Window functions allow us to perform these calculations in a single pass over the data (specifically, O(N \\log N) due to the required sort operation).  
`SELECT`   
    `transaction_id,`  
    `transaction_ts,`  
    `transaction_type,`  
    `amount,`  
      
    `-- 1. Running Balance: Unbounded preceding summation`  
    `SUM(CASE`   
            `WHEN transaction_type IN ('DEPOSIT', 'TRANSFER_IN') THEN amount`   
            `WHEN transaction_type IN ('WITHDRAWAL', 'TRANSFER_OUT') THEN -amount`   
            `ELSE 0`   
        `END) OVER (`  
            `PARTITION BY account_id`   
            `ORDER BY transaction_ts`   
            `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`  
        `) as running_balance,`  
          
    `-- 2. 7-Day Moving Average: Range-based framing`  
    `AVG(amount) OVER (`  
        `PARTITION BY account_id`  
        `ORDER BY transaction_ts`  
        `RANGE BETWEEN INTERVAL '6 DAYS' PRECEDING AND CURRENT ROW`  
    `) as avg_7_day_amount,`  
      
    `-- 3. Time Gap Analysis: Lag function`  
    `EXTRACT(EPOCH FROM (transaction_ts - LAG(transaction_ts) OVER (`  
        `PARTITION BY account_id`   
        `ORDER BY transaction_ts`  
    `))) / 3600 as hours_since_last_txn`

`FROM Transactions`  
`WHERE account_id = 'A882'`  
`ORDER BY transaction_ts;`

**Deep Dive: Frame Specifications (ROWS vs. RANGE):** The distinction between ROWS and RANGE is a critical engineering detail often overlooked.

* **ROWS:** Counts physical rows. ROWS BETWEEN 1 PRECEDING AND CURRENT ROW looks at exactly the previous line in the result set. We use ROWS for the **Running Balance** because a ledger is a discrete sequence of events; we want to sum every physical record up to the current one.  
* **RANGE:** Operates on the logical value of the sort key (time). We use RANGE for the **7-Day Moving Average** because it correctly handles time gaps. If there were no transactions for 3 days, ROWS 6 PRECEDING would incorrectly grab transactions from weeks ago. RANGE INTERVAL '6 DAYS' strictly respects the calendar time, ensuring statistical accuracy.

## **1.3 Exercise 2: Idempotent Pipelines and Deduplication**

### **1.3.1 Learning Objective**

This exercise introduces the "Idempotent Consumer" pattern, a cornerstone of distributed data engineering. In real-world pipelines (e.g., Kafka to Snowflake), "exactly-once" delivery is mathematically impossible in the presence of network partitions; systems default to "at-least-once," resulting in duplicate records. Engineers must design pipelines that yield consistent results regardless of how many times the same data is ingested.

### **1.3.2 Task Description**

**Scenario:** You maintain a staging table Staging\_Transactions that acts as a buffer for raw JSON dumps from an upstream message queue. Due to network retries, the upstream producer occasionally resends the same transaction batch. Furthermore, sometimes a transaction is updated (e.g., a description change), resulting in a newer version of the same transaction\_id.  
**Data Sample (Staging Table with Duplicates):**

| transaction\_id | amount | transaction\_ts | ingestion\_ts | status |
| :---- | :---- | :---- | :---- | :---- |
| TXN\_101 | 50.00 | 10:00:00 | 10:00:05 | PENDING |
| TXN\_101 | 50.00 | 10:00:00 | 10:00:06 | COMPLETED |
| TXN\_102 | 20.00 | 10:05:00 | 10:05:05 | PENDING |
| TXN\_101 | 50.00 | 10:00:00 | 10:01:00 | COMPLETED |

**Requirement:** Write a robust SQL pipeline to merge Staging\_Transactions into the final Transactions table.

1. Eliminate duplicates within the staging batch itself.  
2. If a transaction\_id already exists in the target table, update it only if the staging version is newer.  
3. If it does not exist, insert it.  
4. Ensure the process is idempotent: running the script twice effectively does nothing the second time.

### **1.3.3 Solution and Engineering Reasoning**

**Step 1: In-Batch Deduplication using ROW\_NUMBER()** Before touching the target table, we must sanitize the input. We cannot simply use DISTINCT because the rows might differ slightly (e.g., ingestion\_ts or status). We need to pick the "best" version of each ID.  
`WITH DeduplicatedStaging AS (`  
    `SELECT`   
        `transaction_id,`   
        `account_id,`   
        `amount,`   
        `transaction_ts,`   
        `status,`  
        `-- Rank versions of the same ID by latest ingestion time`  
        `ROW_NUMBER() OVER (`  
            `PARTITION BY transaction_id`   
            `ORDER BY ingestion_ts DESC`  
        `) as rn`  
    `FROM Staging_Transactions`  
`)`  
`-- Only proceed with the top-ranked row for each ID`  
`SELECT * FROM DeduplicatedStaging WHERE rn = 1;`

**Step 2: The Merge (Upsert) Logic** Standard SQL provides MERGE, while PostgreSQL uses INSERT... ON CONFLICT. We will demonstrate the ANSI standard MERGE as it is common in enterprise data warehouses (Snowflake, SQL Server, BigQuery).  
`MERGE INTO Transactions AS Target`  
`USING (`  
    `SELECT * FROM (`  
        `SELECT *, ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY ingestion_ts DESC) as rn`  
        `FROM Staging_Transactions`  
    `) WHERE rn = 1`  
`) AS Source`  
`ON (Target.transaction_id = Source.transaction_id)`

`-- Case 1: The ID exists. Check if we need to update.`  
`WHEN MATCHED AND Source.ingestion_ts > Target.last_updated_ts THEN`  
    `UPDATE SET`   
        `amount = Source.amount,`  
        `status = Source.status,`  
        `last_updated_ts = Source.ingestion_ts`

`-- Case 2: The ID is new. Insert it.`  
`WHEN NOT MATCHED THEN`  
    `INSERT (transaction_id, account_id, amount, transaction_ts, status, last_updated_ts)`  
    `VALUES (Source.transaction_id, Source.account_id, Source.amount, Source.transaction_ts, Source.status, Source.ingestion_ts);`

**Engineering Analysis:**

* **Idempotency Guarantee:** If this query runs a second time, the Source.ingestion\_ts \> Target.last\_updated\_ts condition will be false (since we just updated it). The WHEN NOT MATCHED clause will also not trigger. The state remains consistent.  
* **Performance:** The MERGE statement is generally more efficient than separate UPDATE and INSERT statements because it typically requires only a single join pass between the source and target tables.  
* **Race Conditions:** In high-concurrency environments, MERGE can sometimes suffer from race conditions if multiple processes try to merge the same ID simultaneously. In strict transactional systems, explicit table locking or transaction isolation levels (Serializable) might be required, though modern cloud warehouses handle this via Multi-Version Concurrency Control (MVCC).

## **1.4 Exercise 3: Temporal Data and Slowly Changing Dimensions (Type 2\)**

### **1.4.1 Learning Objective**

Data warehouses must often reconstruct history. For example, "What was the customer's address *on the date they applied for the loan*?" If we simply overwrite the address (SCD Type 1), we lose this historical context. This exercise challenges students to implement SCD Type 2, creating a full history of changes.

### **1.4.2 Task Description**

**Scenario:** The Customers table tracks current addresses. We need a Dim\_Customer\_History table that tracks every address the customer has ever had. **Input:** A stream of customer updates. **Target Schema (Dim\_Customer\_History):**

* customer\_sk (Surrogate Key, Auto-Increment)  
* customer\_id (Business Key)  
* address  
* valid\_from (Date)  
* valid\_to (Date, default '9999-12-31' for current)  
* is\_current (Boolean)

**Task:** Design a logic flow to process a batch of updates. If a customer's address has changed:

1. "Close" the old record (set valid\_to \= yesterday).  
2. Insert the new record (set valid\_from \= today).

### **1.4.3 Solution and Engineering Reasoning**

This is a multi-step engineering problem usually handled by ETL tools, but writing the SQL logic illuminates the complexity of temporal maintenance.  
**Step 1: Identify Changes** We first join the incoming batch with the *current* records in the dimension table to see if anything is different.  
**Step 2: The "Expire and Insert" Transaction** We typically execute this inside a transaction block to ensure data integrity.  
`BEGIN TRANSACTION;`

`-- 1. Expire the old records`  
`-- We update the existing 'current' record to set its end date`  
`UPDATE Dim_Customer_History`  
`SET`   
    `valid_to = CURRENT_DATE - INTERVAL '1 day',`  
    `is_current = FALSE`  
`FROM Customer_Updates_Staging Staging`  
`WHERE`   
    `Dim_Customer_History.customer_id = Staging.customer_id`  
    `AND Dim_Customer_History.is_current = TRUE`  
    `AND Dim_Customer_History.address <> Staging.address; -- Only if address actually changed`

`-- 2. Insert the new version`  
`-- We insert a new active record for the customers we just updated`  
`INSERT INTO Dim_Customer_History (customer_id, address, valid_from, valid_to, is_current)`  
`SELECT`   
    `Staging.customer_id,`  
    `Staging.address,`  
    `CURRENT_DATE,     -- Starts today`  
    `'9999-12-31',     -- Valid until forever`  
    `TRUE`  
`FROM Customer_Updates_Staging Staging`  
`JOIN Dim_Customer_History History`   
    `ON Staging.customer_id = History.customer_id`  
`WHERE`   
    `History.valid_to = CURRENT_DATE - INTERVAL '1 day' -- Logic link to previous step`  
    `AND History.is_current = FALSE;` 

`-- 3. Insert completely new customers (never seen before)`  
`INSERT INTO Dim_Customer_History (customer_id, address, valid_from, valid_to, is_current)`  
`SELECT`   
    `customer_id, address, CURRENT_DATE, '9999-12-31', TRUE`  
`FROM Customer_Updates_Staging`  
`WHERE customer_id NOT IN (SELECT customer_id FROM Dim_Customer_History);`

`COMMIT TRANSACTION;`

**Deep Dive: The Surrogate Key (customer\_sk):** Why do we need a surrogate key? Why not just use customer\_id?

* In Dim\_Customer\_History, customer\_id is **not unique**. Customer 101 will have a row for their 2021 address and another row for their 2023 address.  
* The customer\_sk provides a unique primary key for the table.  
* More importantly, Fact tables (like Transactions) should link to customer\_sk, not customer\_id. This allows a transaction to point to the *exact version* of the customer that existed at the time of the transaction, preserving perfect historical accuracy.

# **Module 2: Distributed Computation Primitives (MapReduce)**

## **2.1 Theoretical Context: The Anatomy of a Shuffle**

While modern engineers largely work with high-level abstractions like Apache Spark DataFrames, Hive, or Snowflake, the fundamental execution model of distributed data processing remains MapReduce (MR). Understanding MR is critical for debugging performance issues, particularly "data skew" and "shuffle" bottlenecks.  
The MapReduce paradigm consists of three phases:

1. **Map:** Processes input records in parallel, emitting key-value pairs.  
2. **Shuffle (Sort & Transfer):** The framework acts as a distributed "Group By." All intermediate data with the same key is transferred over the network to the same Reducer node. **This is the most expensive operation in distributed computing.**  
3. **Reduce:** Processes the list of values associated with a specific key.

The exercises in this module force students to think in terms of these primitives, implementing algorithms manually to understand the cost of data movement.

## **2.2 Exercise 1: Inverted Index Construction with Positions**

### **2.2.1 Learning Objective**

This exercise demonstrates the fundamental algorithm behind search engines (like Google or Elasticsearch). It illustrates how the "Shuffle" phase effectively pivots data from a "Document-centric" view to a "Term-centric" view.

### **2.2.2 Task Description**

**Scenario:** You have a corpus of web pages. You need to build an index that allows you to answer queries like "Find all documents containing the word 'Data' near the word 'Engineering'." **Input:** A set of documents (doc\_id, text\_content). **Goal:** Output a dictionary where Key \= Word and Value \= List of (DocID, Position).  
**Sample Data:**

* Doc 1: "Data Engineering is fun"  
* Doc 2: "Engineering Data Systems"

### **2.2.3 Solution and Engineering Reasoning**

**Mapper Logic:** The mapper is responsible for tokenization and emitting the location of every word.

* *Input:* (1, "Data Engineering is fun")  
* *Logic:* Split string. Loop through words. Emit (Word, (DocID, Position)).  
* *Emits:*  
  * ("data", (1, 0))  
  * ("engineering", (1, 1))  
  * ("is", (1, 2))  
  * ("fun", (1, 3))

**Reducer Logic:** The framework groups all values for a given key. The reducer receives an iterator.

* *Input Key:* "data"  
* *Input Values:* \[(1, 0), (2, 1)\] (from Doc 2\)  
* *Logic:* Collect all postings. Sort them by DocID (crucial for efficient query processing).  
* *Output:* "data": \[(1, 0), (2, 1)\]

**Pseudo-Code Implementation:**  
`class InvertedIndexMapper:`  
    `def map(self, doc_id, text):`  
        `words = text.lower().split()`  
        `for pos, word in enumerate(words):`  
            `# Emit Key: word, Value: (doc_id, position)`  
            `emit(word, (doc_id, pos))`

`class InvertedIndexReducer:`  
    `def reduce(self, word, values):`  
        `# values is an iterator of (doc_id, pos)`  
        `postings_list =`  
        `for val in values:`  
            `postings_list.append(val)`  
          
        `# Sort by DocID first, then Position`  
        `postings_list.sort()`  
          
        `emit(word, postings_list)`

**Deep Dive: Storage Optimization and Compression:** In a production system, storing \[(100, 5), (105, 2), (108, 10)\] as raw integers is inefficient.

* **Delta Encoding:** Instead of storing raw DocIDs, we store the *difference* (gap) between them.  
  * Raw: 100, 105, 108  
  * Delta: 100, 5, 3  
  * *Why?* Smaller numbers require fewer bits to encode.  
* **VarInt Compression:** Variable-byte encoding allows small numbers (like the deltas 5 and 3\) to be stored in a single byte, whereas standard integers take 4 bytes. This massively reduces the disk I/O required to read the index.

## **2.3 Exercise 2: Distributed Matrix Multiplication (One-Step)**

### **2.3.1 Learning Objective**

Linear algebra is the foundation of machine learning. Implementing matrix multiplication in MapReduce challenges students to understand data replication strategies. Since there is no shared memory, how do you multiply Row i of Matrix A with Column k of Matrix B when they reside on different servers?

### **2.3.2 Task Description**

**Goal:** Compute the product matrix C \= A \\times B. **Dimensions:** A is L \\times M, B is M \\times N. Result C is L \\times N. **Mathematical Definition:** C\_{ik} \= \\sum\_{j=1}^{M} A\_{ij} \\times B\_{jk}.  
To calculate cell C\_{ik}, the reducer needs the entire i-th row of A and the entire k-th column of B.

### **2.3.3 Solution and Engineering Reasoning**

**Strategy: The Replication Join (One-Step Algorithm)** We cannot simply "look up" values. We must proactively send the required data to the specific reducer responsible for calculating C\_{ik}.  
**Mapper Logic:** The mapper must duplicate data.

1. **For an element A\_{ij}:** This value is needed for every cell C\_{i1}, C\_{i2}, \\dots, C\_{iN} in the result. It contributes to the entire i-th row of the result.  
   * *Action:* Emit N pairs.  
   * *Keys:* (i, 1), (i, 2),..., (i, N)  
   * *Value:* ('A', j, A\_ij)  
2. **For an element B\_{jk}:** This value is needed for every cell C\_{1k}, C\_{2k}, \\dots, C\_{Lk} in the result. It contributes to the entire k-th column of the result.  
   * *Action:* Emit L pairs.  
   * *Keys:* (1, k), (2, k),..., (L, k)  
   * *Value:* ('B', j, B\_jk)

**Reducer Logic:** The reducer for key (i, k) receives all A\_{i \\cdot} values and all B\_{\\cdot k} values.

1. Separate the input values into two hashmaps/lists: RowA and ColB.  
2. Perform the dot product: Iterate through the common index j (from 1 to M), multiplying A\_{ij} \\times B\_{jk} and summing the results.

**Engineering Analysis: The Network Cost:**

* **Traffic Volume:** Every element of Matrix A is replicated N times. Every element of Matrix B is replicated L times.  
* **Complexity:** The total network traffic is roughly O(L \\cdot M \\cdot N).  
* **Implication:** For dense matrices, this generates massive network load. This algorithm highlights why **Block Matrix Multiplication** is preferred in practice. In Block multiplication, we divide the matrix into sub-squares (blocks). Instead of replicating individual numbers, we replicate blocks. This reduces the replication factor by the size of the block side length (e.g., if block size is 100x100, we replicate 100x less), significantly optimizing the Shuffle phase.

## **2.4 Exercise 3: Handling Data Skew (The "Hot Key" Problem)**

### **2.4.1 Learning Objective**

Data skew is the single most common reason for distributed job failure. It occurs when one key has significantly more data than others (Zipfian distribution). This causes one reducer to work for hours while others finish in seconds, or crash entirely due to Out-Of-Memory (OOM) errors. This exercise teaches the "Salting" technique.

### **2.4.2 Task Description**

**Scenario:** You are joining a Users table (1 GB) with a Clicks table (10 TB). **The Skew:** One user, User\_ID \= 888 (a web crawler bot), has 1 billion clicks. All other users have \< 1000 clicks. **Failure:** A standard MapReduce join sends all 1 billion records for User\_ID 888 to Reducer \#5. Reducer \#5 runs out of heap space and crashes. **Task:** Design a "Salted Key" algorithm to distribute the load of User\_ID 888 across 10 reducers.

### **2.4.3 Solution and Engineering Reasoning**

**The Solution: Salt and Replicate (Divide and Conquer)** We cannot send all 888 records to one node. We must split the "heavy" key in the large table and replicate the matching key in the small table.  
**Step 1: Modify the Large Table (Clicks)** In the Mapper for Clicks, if we encounter User\_ID \= 888, we don't just emit 888\. We append a random suffix (salt) from 1 to 10\.

* *Input:* (888, Click\_Data)  
* *Emit:* (888-1, Click\_Data) OR (888-5, Click\_Data) OR... (888-10, Click\_Data).  
* *Result:* The 1 billion clicks are now split into 10 buckets of 100 million each. They will go to 10 different reducers.

**Step 2: Modify the Small Table (Users)** For the join to work, the Users record for 888 must be present at *all 10* reducers. In the Mapper for Users, if we encounter User\_ID \= 888, we replicate it 10 times.

* *Input:* (888, User\_Name="Bot")  
* *Emit:*  
  * (888-1, "Bot")  
  * (888-2, "Bot")  
  * ...  
  * (888-10, "Bot")

**Step 3: The Join** The framework joins 888-1 (Clicks) with 888-1 (User). Since 888-1 is just a fraction of the total clicks, the reducer can handle it.  
**Engineering Trade-offs:**

* **Explosion of Small Table:** We increased the size of the specific key in the small table by a factor of N (number of salt buckets). This is acceptable because the Users table is small.  
* **Code Complexity:** The application logic must know *which* keys are skewed (or apply salting to all keys, which increases overhead).  
* **Adaptive Skew Handling:** Modern engines like Spark 3.0+ implement **Adaptive Query Execution (AQE)**, which detects these skewed partitions at runtime and automatically splits them, essentially performing this "salting" logic under the hood without manual code.

# **Module 3: Robust Data Ingestion Architectures**

## **3.1 Theoretical Context: The First Mile of Data**

Data Ingestion is the process of moving data from source to storage. It is the most fragile part of the pipeline because it interfaces with external systems (APIs, FTPs, IoT devices) that are often unreliable. This module focuses on the principles of **Schema-on-Read**, **Watermarking**, and **Handling Partial Failures**.

## **3.2 Exercise 1: Robust Batch Ingestion (Schema-on-Read vs. Write)**

### **3.2.1 Learning Objective**

Traditional databases enforce "Schema-on-Write"—if the data doesn't match the table definition (e.g., a string in an integer column), the load fails. In Big Data ingestion, failing a 1TB load because of one bad row is unacceptable. This exercise teaches the ELT (Extract, Load, Transform) pattern with a Dead Letter Queue (DLQ).

### **3.2.2 Task Description**

**Scenario:** An IoT system sends telemetry data via CSV files. A batch of 1 million records arrives. **The Quality Issue:** 0.01% of the rows are corrupted (e.g., "NA" in the temperature field, or missing timestamps). **Goal:** Ingest the valid 99.99% of data into Sensor\_Readings. Capture the 0.01% invalid rows in a DLQ\_Table for analysis. The pipeline must not crash.  
**Schema (Target):**

* device\_id (VARCHAR)  
* temp (DECIMAL)  
* ts (TIMESTAMP)

### **3.2.3 Solution and Engineering Reasoning**

**Strategy: The Staging Buffer** We never load directly into the final typed table. We load into a "Text-Only" staging table first. This is **Schema-on-Read**.  
**Step 1: Load to Raw Staging** Create a table Staging\_Raw where every column is VARCHAR or TEXT.

* *Action:* COPY the CSV into Staging\_Raw.  
* *Result:* 100% success. Even "Bad" data loads successfully as text strings.

**Step 2: Conditional Insert (The Router)** We use SQL regex or TRY\_CAST logic to split the data.  
`-- Insert Valid Data`  
`INSERT INTO Sensor_Readings (device_id, temp, ts)`  
`SELECT`   
    `device_id,`   
    `CAST(temp_str AS DECIMAL),`   
    `CAST(ts_str AS TIMESTAMP)`  
`FROM Staging_Raw`  
`WHERE temp_str ~ '^[0-9.-]+$'       -- Regex: Is numeric?`  
  `AND ts_str ~ '^\d{4}-\d{2}-\d{2}' -- Regex: Is date format?`  
  `AND ts_str IS NOT NULL;`

`-- Insert Invalid Data to Dead Letter Queue`  
`INSERT INTO DLQ_Table (device_id, raw_temp, raw_ts, error_reason, ingest_ts)`  
`SELECT`   
    `device_id,`   
    `temp_str,`   
    `ts_str,`   
    `'Type Conversion Failed',`   
    `NOW()`  
`FROM Staging_Raw`  
`WHERE temp_str!~ '^[0-9.-]+$'`   
   `OR ts_str IS NULL;`

**Step 3: Cleanup** Truncate Staging\_Raw for the next batch.  
**Engineering Analysis:**

* **Observability:** By keeping the bad data in the DLQ, we can analyze patterns. Are all failures coming from device\_id\_55? If we simply dropped the rows, we would never know a specific sensor was broken.  
* **Formats:** In production, engineers often prefer formats like **Parquet** or **Avro** over CSV/JSON. Avro, in particular, carries its schema with the data, allowing for schema evolution (e.g., adding a new sensor field) without breaking downstream readers.

## **3.3 Exercise 2: Incremental Loading and High-Water Marking**

### **3.3.1 Learning Objective**

Batch loading an entire database every night is inefficient. Engineers must implement "Incremental Ingestion"—fetching only what changed. This introduces the complexity of **Watermarking** and handling **Late Arriving Data**.

### **3.3.2 Task Description**

**Scenario:** You are syncing a legacy SQL database Source\_Orders to a Data Lake. You run a job every 15 minutes. **Source Table:** Has an auto-incrementing id and a modified\_at timestamp. **The Edge Case:** Transactions in the source system can take time to commit. A transaction might start at 12:00:00 but commit at 12:05:00. If your job runs at 12:02:00, it misses this "uncommitted" row. When the job runs again at 12:15:00, the "new" row has a timestamp of 12:00:00, which is *older* than the last check time. It is skipped. This is **Data Loss**.

### **3.3.3 Solution and Engineering Reasoning**

**Strategy: High-Water Mark with Safety Buffer**  
**1\. State Management:** We maintain a metadata table Etl\_Job\_State that stores the last\_successful\_watermark (timestamp).  
**2\. The Extraction Query:** We do *not* fetch up to NOW(). We fetch up to NOW() \- Buffer.  
`-- 1. Get the last watermark (e.g., 2023-10-01 12:00:00)`  
`VAR watermark = SELECT val FROM Etl_Job_State WHERE key = 'orders_sync';`

`-- 2. Define the new upper bound (Current Time minus 5 minutes safety buffer)`  
`-- This ensures all transactions in the window are fully committed.`  
`VAR upper_bound = CURRENT_TIMESTAMP - INTERVAL '5 minutes';`

`-- 3. Extract the slice`  
`SELECT * FROM Source_Orders`  
`WHERE modified_at > watermark`   
  `AND modified_at <= upper_bound;`

`-- 4. Update the watermark only after successful load`  
`UPDATE Etl_Job_State SET val = upper_bound WHERE key = 'orders_sync';`

**Engineering Analysis:**

* **The Safety Buffer:** By stopping 5 minutes in the past, we allow "long-running transactions" on the source system to settle/commit. We trade **Latency** (data is 5 minutes old) for **Consistency** (no data loss).  
* **Hard Deletes:** This watermark strategy only detects *Updates* and *Inserts*. It cannot detect if a row was *Deleted* in the source (since the row is gone). To handle deletes, we need **Change Data Capture (CDC)** tools (like Debezium) that read the database transaction logs (WAL/Binlog) rather than querying the tables directly.

# **Module 4: Non-Relational (NoSQL) Data Modeling**

## **4.1 Theoretical Context: Query-First Design**

In the Relational world, we design the schema based on the data entities (Normalization) and then write queries. In the NoSQL world (Cassandra, DynamoDB), this is an anti-pattern. We must use **Query-First Design**. We cannot design the table until we know *exactly* the access patterns (e.g., "Will we query by UserID, or by Date, or both?").  
The primary trade-off in NoSQL is governed by the **CAP Theorem**:

* **Consistency:** Every read receives the most recent write.  
* **Availability:** Every request receives a (non-error) response.  
* **Partition Tolerance:** The system continues to operate despite an arbitrary number of messages being dropped by the network.  
* *Theorem:* You can only pick two. NoSQL databases typically prioritize P and A (AP systems like Cassandra) or P and C (CP systems like HBase).

## **4.2 Exercise 1: Time-Series Modeling in Cassandra (Wide Partitions)**

### **4.2.1 Learning Objective**

Cassandra is a Wide-Column store optimized for heavy writes. A common mistake is creating "unbounded partitions." This exercise demonstrates how to use compound keys to "bucket" time-series data.

### **4.2.2 Task Description**

**Scenario:** Store temperature readings from weather sensors. **Volume:** Sensors report every 1 second. We keep 5 years of data. **Query:** "Give me all readings for Sensor\_A for August 2023."  
**Task:** Compare two schema designs. Explain why Design A will catastrophic failure and Design B will succeed.  
**Design A:**  
`PRIMARY KEY (sensor_id, timestamp)`

**Design B:**  
`PRIMARY KEY ((sensor_id, month_bucket), timestamp)`

### **4.2.3 Solution and Engineering Reasoning**

**Analysis of Design A (The Anti-Pattern):**

* **Partition Key:** sensor\_id.  
* **Clustering Key:** timestamp.  
* **The Physics:** All data for Sensor\_A is stored on a single physical partition on disk (a single wide row).  
* **Calculation:** 1 reading/sec \* 86400 sec/day \* 365 days \* 5 years ≈ 157,000,000 columns in one row.  
* **Failure Mode:** Cassandra partitions should optimally be \< 100MB. This partition will grow to gigabytes. Compaction (merging SSTables) will fail or take days. Reading a specific date range requires scanning this massive structure, causing heap exhaustion (GC death) on the JVM.

**Analysis of Design B (Bucketing):**

* **Partition Key:** (sensor\_id, month\_bucket). (e.g., ('Sensor\_A', '2023-08'))  
* **The Fix:** We have artificially broken the data into monthly chunks.  
* **Write Path:** The application logic calculates the bucket: bucket \= date.format('YYYY-MM').  
* **Read Path:** For the query "August 2023", the database calculates the hash of ('Sensor\_A', '2023-08') and jumps directly to that specific, manageable partition. This is an O(1) lookup followed by a sequential scan of a small dataset.

## **4.3 Exercise 2: DynamoDB Write Sharding (The Hot Partition Problem)**

### **4.3.1 Learning Objective**

DynamoDB provides predictable performance by splitting data across partitions. However, each partition has a hard throughput limit (e.g., 1000 Write Capacity Units (WCU)/sec). If a single item (single Primary Key) receives 10,000 writes/sec, the partition throttles the requests. This is the **Hot Partition** problem.

### **4.3.2 Task Description**

**Scenario:** A Reality TV voting app. **Event:** During the final 5 minutes, 10 million users vote for "Contestant\_X". **Schema:** PK \= Candidate\_Name. Value \= Total\_Votes. **Task:** Explain why UPDATE Candidates SET votes \= votes \+ 1 WHERE Candidate\_Name \= 'X' fails. Design a "Write Sharding" solution.

### **4.3.3 Solution and Engineering Reasoning**

**The Failure:** All 10 million writes target the hash key "Contestant\_X". This maps to **one** physical partition. The partition's limit is 1000 writes/sec. The incoming load is \~33,000 writes/sec (10M / 300 sec). 97% of requests will receive 400 ThrottlingException.  
**The Solution: Scatter-Gather (Write Sharding)** We must spread the heat.  
**1\. The Scatter (Write Path):** We do not write to Contestant\_X. We create N shards (e.g., 100). When a vote comes in, the application generates a random number r (1-100). It increments the item: PK \= "Contestant\_X\_r".

* *Result:* The load is split 100 ways. Each partition sees \~330 writes/sec, which is well within the 1000 limit.

**2\. The Gather (Read Path):** To get the vote total, we cannot just read one item. Query: SELECT \* FROM Votes WHERE PK BEGINS\_WITH "Contestant\_X\_". The application receives 100 items and sums the counters: Total \= Sum(Vote\_1... Vote\_100).  
**Deep Dive: Engineering Trade-off:** This solution exemplifies the complexities of distributed engineering.

* **Pros:** Infinite write scalability.  
* **Cons:** Read complexity increases (must read 100 items). Read consistency is weaker (Eventual Consistency across 100 items).  
* **Context:** For a voting app, "Eventual Consistency" (results lagging by 1 second) is acceptable. For a banking ledger, it is not.

## **4.4 Exercise 3: Architectural Decision Matrix (SQL vs. NoSQL)**

### **4.4.1 Learning Objective**

Students often incorrectly assume NoSQL is "better" or "faster" than SQL. In reality, NoSQL optimizes for *specific access patterns* at the cost of flexibility. This exercise requires students to justify architectural choices.

### **4.4.2 Task Description**

Fill in the "Recommendation" and "Technical Justification" for the following scenarios.  
**Scenario A: E-Commerce Product Catalog**

* *Requirements:* High read volume. Flexible schema (attributes vary by product category—shirts have sizes, laptops have RAM).  
* *Recommendation:* **NoSQL (Document Store \- e.g., MongoDB/DynamoDB)**  
* *Reasoning:* The "Flexible Schema" requirement aligns with JSON document storage. In SQL, this would require complex EAV (Entity-Attribute-Value) tables or many null columns. The high read volume benefits from the denormalized document structure where all product info is in one object (no joins).

**Scenario B: Financial Stock Trading System**

* *Requirements:* ACID compliance is non-negotiable. Complex queries joining Users, Portfolios, Orders, and Settlements.  
* *Recommendation:* **Relational SQL (PostgreSQL/Oracle)**  
* *Reasoning:* ACID transactions are required to ensure money is not created or destroyed. The "Complex Joins" requirement is the strength of the Relational model. Implementing these joins in NoSQL (application-side) is error-prone and slow.

**Scenario C: User Session Management**

* *Requirements:* Extreme write velocity (every click). Data expires after 24 hours. Simple lookup by SessionID.  
* *Recommendation:* **Key-Value Store (Redis/DynamoDB)**  
* *Reasoning:*  
  1. **TTL (Time-To-Live):** NoSQL stores natively support auto-deletion of records after a set time.  
  2. **Performance:** Key-Value lookups are O(1). There is no need for the overhead of a SQL parser or query planner for simple GET / SET operations.

# **Conclusion**

The transition from academic computer science to professional data engineering requires a shift in mindset: from "getting the code to work" to "getting the system to scale." The exercises presented in this handbook—ranging from handling the mechanics of a MapReduce shuffle to designing idempotent SQL pipelines and mitigating hot partitions in NoSQL—are designed to simulate the failure modes of large-scale systems. By mastering these concepts, students gain the ability to reason about trade-offs in consistency, availability, and latency, preparing them for the architectural challenges of the modern data landscape.

#### **Works cited**

1\. How to Design a Database for Online Banking System \- GeeksforGeeks, https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-online-banking-system/ 2\. Creating a Database Design for a Banking System \- Redgate Software, https://www.red-gate.com/blog/database-design-for-banking-system 3\. Using the window function row\_number to remove duplicates in PostgreSQL \- Medium, https://medium.com/@walttonm/using-the-window-function-row-number-to-remove-duplicates-in-postgresql-5aef1edfb78c 4\. SQL ROW\_NUMBER() Function: Syntax and Applications \- StrataScratch, https://www.stratascratch.com/blog/sql-row\_number-function-syntax-and-applications/ 5\. Database schema: SQL schema examples and best practices \- CockroachDB, https://www.cockroachlabs.com/blog/database-schema-beginners-guide/ 6\. The Importance of Idempotent Data Pipelines for Resilience \- Prefect, https://www.prefect.io/blog/the-importance-of-idempotent-data-pipelines-for-resilience 7\. Idempotency in Data Engineering: Why It Matters and How to Embrace It, https://blog.dataengineerthings.org/idempotency-in-data-engineering-why-it-matters-and-how-to-embrace-it-ec3fb0aec118 8\. Why Idempotence Is So Important in Data Engineering \- DEV Community, https://dev.to/chaets/why-idempotency-is-so-important-in-data-engineering-24mj 9\. Eliminating Duplicate Rows using The PARTITION BY clause \- SQLServerCentral, https://www.sqlservercentral.com/articles/eliminating-duplicate-rows-using-the-partition-by-clause 10\. Merge Statement for SCD Type 2 \- DuckDB, https://duckdb.org/docs/stable/guides/sql\_features/merge 11\. Implementing SCD Type 2 with merge statement \- sql \- Stack Overflow, https://stackoverflow.com/questions/79396741/implementing-scd-type-2-with-merge-statement 12\. Slowly changing dimensions using T-SQL MERGE \- SQLServerCentral, https://www.sqlservercentral.com/articles/slowly-changing-dimensions-using-t-sql-merge 13\. Idempotency in Data Pipelines \- ApX Machine Learning, https://apxml.com/courses/building-scalable-data-warehouses/chapter-3-high-throughput-ingestion/idempotency-pipelines 14\. How to Build SCD Type 2 in One MERGE | by Evgeny Pintus \- Medium, https://medium.com/@evgeniy.pintus/how-to-build-scd-type-2-in-one-merge-4da7f155a8a3 15\. Design Tip \#107 Using the SQL MERGE Statement for Slowly Changing Dimension Processing \- Kimball Group, https://www.kimballgroup.com/2008/11/design-tip-107-using-the-sql-merge-statement-for-slowly-changing-dimension-processing/ 16\. MapReduce Algorithm for Matrix Multiplication \- Computer Science at Emory, http://www.cs.emory.edu/\~cheung/Courses/554/Syllabus/9-parallel/matrix-mult.html 17\. Reduce Side Join MapReduce Example \- Edureka, https://www.edureka.co/blog/mapreduce-example-reduce-side-join/ 18\. MapReduce, http://www.ugr.es/\~essir2013/slides/ESSIR\_MapReduce\_for\_Indexing.pdf 19\. Of Ivory and Smurfs: Loxodontan MapReduce Experiments for Web Search \- Text REtrieval Conference, https://trec.nist.gov/pubs/trec18/papers/umd-yahoo.WEB.pdf 20\. Chapter 4: Inverted Indexing for Text Retrieval, https://student.cs.uwaterloo.ca/\~cs451/F21/content/MapReduce-algorithms-ch4-20171225.pdf 21\. Matrix Multiplication With 1 MapReduce Step \- GeeksforGeeks, https://www.geeksforgeeks.org/computer-science-fundamentals/matrix-multiplication-with-1-mapreduce-step/ 22\. MapReduce : Matrix Multiplication \- YouTube, https://www.youtube.com/watch?v=jGnPWZVcUYI 23\. Matrix Multiplication in MapReduce Overview, https://users.csc.calpoly.edu/\~dekhtyar/369-Winter2017/lectures/lec14.369.pdf 24\. Matrix-Vector Multiplication by MapReduce, https://userweb.ucs.louisiana.edu/\~vvr3254/CMPS598/Notes/Matrix-Vector%20Multiplication%20by%20MapReduce-v2.pdf 25\. Handling Data Skew in MapReduce Cluster by Using Partition Tuning \- PMC \- NIH, https://pmc.ncbi.nlm.nih.gov/articles/PMC5415866/ 26\. How to Handle Data Skew in Distributed Systems (Apache Spark)? \- Reddit, https://www.reddit.com/r/dataengineering/comments/1fpp6kb/how\_to\_handle\_data\_skew\_in\_distributed\_systems/ 27\. Comparative Analysis of Skew-Join Strategies for Large-Scale Datasets with MapReduce and Spark \- MDPI, https://www.mdpi.com/2076-3417/12/13/6554 28\. Hadoop handling data skew in reducer \- Stack Overflow, https://stackoverflow.com/questions/32627836/hadoop-handling-data-skew-in-reducer 29\. Making sense of IoT data \- IBM Developer, https://developer.ibm.com/tutorials/iot-lp301-iot-manage-data/ 30\. Patterns for AWS IoT time series data ingestion with Amazon Timestream, https://aws.amazon.com/blogs/database/patterns-for-aws-iot-time-series-data-ingestion-with-amazon-timestream/ 31\. IoT Telemetry Demo Notebook \- Kaggle, https://www.kaggle.com/code/garystafford/iot-telemetry-demo-notebook 32\. How to proactively avoid micro-batch data loss or duplication during Structured Streaming in high-volume Kafka-to-Azure SQL pipeline? \- Microsoft Learn, https://learn.microsoft.com/en-us/answers/questions/2282440/how-to-proactively-avoid-micro-batch-data-loss-or 33\. RDBMS Design | Apache Cassandra Documentation, https://cassandra.apache.org/doc/4.0/cassandra/data\_modeling/data\_modeling\_rdbms.html 34\. AWS DynamoDB vs SQL Server \- InfluxData, https://www.influxdata.com/comparison/dynamodb-vs-sqlserver 35\. Apache Cassandra Data Partitioning \- NetApp Instaclustr, https://www.instaclustr.com/blog/cassandra-data-partitioning/ 36\. Cassandra Time Series Data Modeling For Massive Scale \- The Last Pickle, https://thelastpickle.com/blog/2017/08/02/time-series-data-modeling-massive-scale.html 37\. Getting Started with Time Series Data Modeling \- DataStax Docs, https://docs.datastax.com/en/tutorials/Time\_Series.pdf 38\. Cassandra for time series data: how to size the partition? \- Stack Overflow, https://stackoverflow.com/questions/45958085/cassandra-for-time-series-data-how-to-size-the-partition 39\. What is a DynamoDB Hot Partition? Definition & FAQs | ScyllaDB, https://www.scylladb.com/glossary/dynamodb-hot-partition/ 40\. Solving the Hot Partition Problem: Optimising Data Distribution Across Partitions | by harsh savasil, https://harshsavasil.medium.com/solving-the-hot-partition-problem-optimising-data-distribution-across-partitions-c5ed5ca17c3e 41\. Scaling DynamoDB: How partitions, hot keys, and split for heat impact performance (Part 2: Querying) | AWS Database Blog, https://aws.amazon.com/blogs/database/part-2-scaling-dynamodb-how-partitions-hot-keys-and-split-for-heat-impact-performance/ 42\. When is RDS really the better choice over something NoSQL like DynamoDb? \- Reddit, https://www.reddit.com/r/ExperiencedDevs/comments/1bw84qt/when\_is\_rds\_really\_the\_better\_choice\_over/