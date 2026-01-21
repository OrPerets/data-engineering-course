# Week 1: Introduction to Data Engineering  
**From SQL Statements to Data Pipelines**

---

## Purpose
- Understand why data engineering exists
- Learn why SQL alone is not enough
- Shift mindset: SQL as a dataflow system, not syntax

---

## Learning Objectives
By the end of this lecture, students will be able to:
- Define the role of a data engineer in modern systems
- Compare data engineering and data science responsibilities
- Place SQL correctly inside a data pipeline architecture
- Estimate query cost using data volume reasoning
- Identify naive vs engineered SQL patterns
- Design SQL queries with intermediate size awareness
- Apply cost thinking to query optimization

---

## What Is Data Engineering?
Data engineering focuses on building systems, not models.

A data engineer:
- Builds infrastructure for data systems
- Bridges raw data sources to analytics
- Ensures reliability, scalability, and efficiency
- Optimizes data movement, storage, and cost

**Key idea:**  
Data engineering is about how data flows, not what model runs.

---

## Why Data Engineering Exists
SQL is powerful — but it lives inside a larger system.

### High-Level Data Pipeline
```
Sources (APIs, Logs, Apps)
        ↓
   Ingestion Layer
        ↓
 Raw Storage (Cheap, Large, Messy)
        ↓
 Transformation Layer (SQL, Spark)
        ↓
 Processed Storage
        ↓
 Analytics / BI / ML
```

**Teaching point:**  
SQL is not end-to-end. It is the transformation layer.

---

## Data Engineering vs Data Science

### Responsibility Boundary
```
Raw Data → Clean Data → Features → Models → Decisions
     ↑         ↑
 Data Engineer  Data Scientist
```

- **Data Engineer**
  - Infrastructure
  - Pipelines
  - Reliability
  - Scale
  - Cost

- **Data Scientist**
  - Models
  - Features
  - Experiments
  - Accuracy
  - Insights

**Rule of thumb:**  
Engineers optimize systems. Scientists optimize predictions.

---

## Where SQL Fits in the Pipeline
SQL operates inside the transformation layer.

```
Ingestion → Raw Storage
                ↓
          SQL Transformations
                ↓
          Structured Storage
                ↓
           Analytics / BI
```

**Important:**  
SQL is a means, not the system itself.

---

## Running Example: Simple Analytics System

### Scenario
An e-commerce platform tracks user purchases.

### Tables
- `users`
- `orders`
- `products`

### Data Sizes
| Table    | Rows        | Bytes / Row | Total Size |
|---------|-------------|-------------|------------|
| users   | 1,000,000   | 50          | 50 MB      |
| orders  | 10,000,000  | 100         | 1 GB       |
| products| 10,000      | 200         | 2 MB       |

---

## Query as a Data Pipeline
A SQL query is not one step — it is a pipeline.

### Logical Steps
1. Filter (`WHERE`)
2. Join (`JOIN`)
3. Aggregate (`GROUP BY`)
4. Output (`SELECT`)

---

## SQL as a Dataflow Graph (With Sizes)
```
Users (1M rows, 50 MB)
    ↓ WHERE country='US'
Users_filtered (200K rows, 10 MB)
    ↓ JOIN Orders
Join_Result (2M rows, 496 MB)
    ↓ GROUP BY user_id
Output (200K rows, 30 MB)
```

**Key realization:**  
Intermediate results can be larger than inputs.

---

## Quantitative Cost Example
Let’s compute the cost explicitly.

- Scan Users: 50 MB
- Scan Orders: 1 GB
- Join Intermediate: 496 MB
- Total Data Scanned: ~1.55 GB
- Network Transfer: 496 MB
- Minimum Memory Required: 496 MB

SQL is expensive because data moves.

---

## Naive vs Engineered Query Design

### Naive Pattern
```sql
SELECT u.user_id, COUNT(o.order_id)
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE u.country = 'US'
GROUP BY u.user_id;
```

**Problem:**
- Join first
- Filter late
- Large intermediate results

---

### Engineered Pattern
```sql
SELECT u.user_id, COUNT(o.order_id)
FROM (
    SELECT * FROM users WHERE country = 'US'
) u
JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id;
```

**Improvement:**
- Filter early
- Smaller join input
- Fewer rows processed

---

## Visual Comparison: Query Pipelines

### Naive
```
Users (1M)
   ↓
Join Orders (10M)
   ↓
Filter
```

### Engineered
```
Users (1M)
   ↓ Filter
Users (200K)
   ↓
Join Orders
```

**Result:**  
~6× reduction in processed data

---

## Cost Thinking in SQL
Every query has hidden costs.

```
Total Query Cost =
  Data Scanned (IO)
+ Data Moved (Network)
+ Working Set (Memory)
+ Operations (CPU)
```

SQL optimization is cost minimization, not syntax tricks.

---

## Common SQL Mistakes
- Joining before filtering
- Late aggregation
- Ignoring table sizes
- Forgetting intermediate results
- Treating SQL as “free”

---

## Best Practices (Week 1 Takeaways)
- Filter early
- Aggregate early
- Estimate sizes before writing queries
- Think in dataflow graphs
- Ask: where does data grow?

---

## Mental Checklist (Exam & Real Life)
Before writing any SQL query, ask:
1. What is the biggest table?
2. Can I reduce rows earlier?
3. What is the largest intermediate?
4. Where does data move?
5. Who pays for it?

---

## Recap
- Data engineering builds data infrastructure
- SQL is a transformation layer
- Queries are pipelines, not statements
- Cost comes from data movement
- Engineering means thinking before coding

---

## Pointers to Practice
- Estimate query cost before execution
- Compare naive vs engineered queries
- Draw dataflow graphs for SQL
- Optimize by reducing intermediate sizes
