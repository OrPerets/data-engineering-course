# Week 1: Introduction to Data Engineering — Practice

## Instructions
- Engineering course: show calculations and reasoning
- Every exercise requires explicit SQL queries
- Calculate intermediate result sizes
- Show cost reasoning for each query

## Data Context (MANDATORY BEFORE QUESTIONS)

### Schema: E-commerce Analytics System

**Table: `users`**
- Columns: user_id (INT), email (VARCHAR), country (VARCHAR), signup_date (DATE)
- Row count: 1,000,000 users
- Row size: ~154 bytes
- Total size: ~154 MB

**Table: `orders`**
- Columns: order_id (INT), user_id (INT), product_id (INT), amount (DECIMAL), order_date (DATE)
- Row count: 10,000,000 orders
- Row size: ~124 bytes
- Total size: ~1.24 GB

**Table: `products`**
- Columns: product_id (INT), name (VARCHAR), category (VARCHAR), price (DECIMAL)
- Row count: 10,000 products
- Row size: ~200 bytes
- Total size: ~2 MB

### Sample Data

**users (sample)**:
| user_id | email | country | signup_date |
|---------|-------|---------|-------------|
| 1 | alice@example.com | US | 2023-01-15 |
| 2 | bob@example.com | UK | 2023-02-20 |
| 3 | carol@example.com | US | 2023-03-10 |

**orders (sample)**:
| order_id | user_id | product_id | amount | order_date |
|----------|---------|------------|--------|------------|
| 101 | 1 | 501 | 29.99 | 2024-01-05 |
| 102 | 1 | 502 | 49.99 | 2024-01-10 |
| 103 | 2 | 501 | 29.99 | 2024-01-12 |

## Warm-up Exercises

## Exercise 1
Given the following SQL query:
```sql
SELECT country, COUNT(*) as user_count
FROM users
GROUP BY country;
```
**Questions**:
a) How many rows will this query scan?
b) What is the approximate data volume scanned (in MB)?
c) If there are 50 unique countries, how many rows in the output?

## Exercise 2
Given the following SQL query:
```sql
SELECT u.user_id, COUNT(o.order_id) as order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id;
```
**Questions**:
a) What is the maximum possible number of rows in the join result?
b) If each user has an average of 10 orders, estimate the join result size in MB.
c) What is the final output row count?

## Exercise 3
Given the following SQL query:
```sql
SELECT product_id, SUM(amount) as total_revenue
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY product_id;
```
**Questions**:
a) If 30% of orders are from 2024, how many rows are scanned?
b) Estimate the filtered result size before aggregation (in MB).
c) If there are 5,000 unique products in 2024 orders, what is the output size?

## Engineering Exercises

## Exercise 4
Consider this naive query:
```sql
SELECT u.country, AVG(o.amount) as avg_order_value
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE u.country = 'US'
GROUP BY u.country;
```
**Tasks**:
a) Calculate total data scanned (users + orders) in GB.
b) Calculate the intermediate join result size in MB.
c) Design an optimized version that filters users first.
d) Calculate the data scanned by the optimized query.
e) What is the improvement factor?

## Exercise 5
Given this query that finds top customers:
```sql
SELECT u.user_id, u.email, SUM(o.amount) as total_spent
FROM users u
JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.email
HAVING SUM(o.amount) > 1000
ORDER BY total_spent DESC
LIMIT 100;
```
**Tasks**:
a) Calculate the join result size (assume 10 orders per user average).
b) Calculate the size after GROUP BY (before HAVING).
c) Explain why HAVING is applied after aggregation.
d) Estimate the final output size (100 rows).

## Exercise 6
Analyze this two-stage aggregation query:
```sql
WITH daily_revenue AS (
  SELECT order_date, SUM(amount) as daily_total
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY order_date
)
SELECT AVG(daily_total) as avg_daily_revenue
FROM daily_revenue;
```
**Tasks**:
a) Calculate the size of the CTE result (assume 365 days in 2024).
b) Compare this to a single-query approach without CTE.
c) Explain the memory benefit of the CTE approach.
d) Calculate total data scanned in both approaches.

## Challenge Exercise

## Challenge: End-to-End Analytics Pipeline
You need to build a monthly revenue report by country and product category.

**Part 1: Data Quality Check**
Write a SQL query to identify data quality issues:
- Users with NULL country
- Orders with NULL user_id or amount
- Orders with invalid dates (future dates or before 2020)

**Part 2: Data Transformation**
Write a query to create a cleaned orders table that:
- Filters out orders with NULL user_id or amount
- Filters out orders with invalid dates
- Adds a month column extracted from order_date

**Part 3: Join and Aggregate**
Write a query that:
- Joins cleaned orders with users and products
- Groups by country, product category, and month
- Calculates total revenue and order count per group
- Filters to only 2024 data

**Part 4: Cost Analysis**
For the final query in Part 3:
- Calculate the data scanned from each table
- Estimate the join intermediate result size
- Calculate the final aggregated result size
- Propose one optimization to reduce scan size

## Solutions

## Solution 1
**a) Rows scanned**: 1,000,000 rows (entire users table)

**b) Data volume scanned**:
```
1,000,000 rows × 154 bytes = 154,000,000 bytes
= 154 MB
```

**c) Output rows**: 50 rows (one per country)

## Solution 2
**a) Maximum join rows**: 
```
1,000,000 users × 10,000,000 orders = 10,000,000,000,000 potential matches
But actual matches limited by user_id foreign key: 10,000,000 rows
```

**b) Join result size**:
```
Average 10 orders per user × 1,000,000 users = 10,000,000 join rows
Each row: user columns (154 bytes) + order columns (124 bytes) = 278 bytes
Total: 10,000,000 × 278 bytes = 2,780,000,000 bytes ≈ 2.78 GB
```

**c) Final output**: 1,000,000 rows (one per user, including users with 0 orders)

## Solution 3
**a) Rows scanned**:
```
10,000,000 orders × 30% = 3,000,000 rows
```

**b) Filtered result size**:
```
3,000,000 rows × 124 bytes = 372,000,000 bytes ≈ 372 MB
```

**c) Output size**:
```
5,000 products × (product_id: 4 bytes + total_revenue: 8 bytes)
= 5,000 × 12 bytes = 60,000 bytes ≈ 0.06 MB
```

## Solution 4
**a) Total data scanned (naive)**:
```
Users: 1,000,000 rows × 154 bytes = 154 MB
Orders: 10,000,000 rows × 124 bytes = 1,240 MB
Total: 1,394 MB ≈ 1.39 GB
```

**b) Intermediate join result**:
```
US users: 200,000 (20% of 1M)
Join matches: 200,000 users × 10 orders avg = 2,000,000 rows
Size: 2,000,000 × 278 bytes = 556,000,000 bytes ≈ 556 MB
```

**c) Optimized query**:
```sql
SELECT u.country, AVG(o.amount) as avg_order_value
FROM (SELECT * FROM users WHERE country = 'US') u
JOIN orders o ON u.user_id = o.user_id
GROUP BY u.country;
```

**d) Optimized data scanned**:
```
Filtered users: 200,000 rows × 154 bytes = 30.8 MB
Orders: 10,000,000 rows × 124 bytes = 1,240 MB
Total: 1,270.8 MB ≈ 1.27 GB
```

**e) Improvement**: Minimal (still scans all orders), but join is smaller.
Better optimization: filter orders by user_id IN (US user_ids) first.

## Solution 5
**a) Join result size**:
```
1,000,000 users × 10 orders = 10,000,000 rows
Size: 10,000,000 × 278 bytes = 2,780 MB ≈ 2.78 GB
```

**b) After GROUP BY**:
```
1,000,000 user groups × (user_id: 4 bytes + email: 100 bytes + total_spent: 8 bytes)
= 1,000,000 × 112 bytes = 112,000,000 bytes ≈ 112 MB
```

**c) HAVING after aggregation**: HAVING filters aggregated results, cannot use WHERE on aggregates.

**d) Final output**: 100 rows × 112 bytes = 11,200 bytes ≈ 0.01 MB

## Solution 6
**a) CTE result size**:
```
365 days × (order_date: 4 bytes + daily_total: 8 bytes)
= 365 × 12 bytes = 4,380 bytes ≈ 0.004 MB
```

**b) Single-query approach**:
```sql
SELECT AVG(daily_total) as avg_daily_revenue
FROM (
  SELECT order_date, SUM(amount) as daily_total
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY order_date
) subquery;
```
Same intermediate size, but CTE is more readable.

**c) Memory benefit**: CTE materializes small result (365 rows) before final aggregation.

**d) Total data scanned**: Same in both: 3,000,000 orders × 124 bytes = 372 MB

## Solution: Challenge Part 1
```sql
-- Data quality issues
SELECT 'NULL country users' as issue_type, COUNT(*) as count
FROM users
WHERE country IS NULL
UNION ALL
SELECT 'NULL user_id orders', COUNT(*)
FROM orders
WHERE user_id IS NULL
UNION ALL
SELECT 'NULL amount orders', COUNT(*)
FROM orders
WHERE amount IS NULL
UNION ALL
SELECT 'Invalid date orders', COUNT(*)
FROM orders
WHERE order_date > CURRENT_DATE OR order_date < '2020-01-01';
```

## Solution: Challenge Part 2
```sql
CREATE TABLE orders_cleaned AS
SELECT 
  order_id,
  user_id,
  product_id,
  amount,
  order_date,
  DATE_TRUNC('month', order_date) as order_month
FROM orders
WHERE user_id IS NOT NULL
  AND amount IS NOT NULL
  AND order_date >= '2020-01-01'
  AND order_date <= CURRENT_DATE;
```

## Solution: Challenge Part 3
```sql
SELECT 
  u.country,
  p.category,
  DATE_TRUNC('month', o.order_date) as month,
  SUM(o.amount) as total_revenue,
  COUNT(o.order_id) as order_count
FROM orders_cleaned o
JOIN users u ON o.user_id = u.user_id
JOIN products p ON o.product_id = p.product_id
WHERE o.order_date >= '2024-01-01'
GROUP BY u.country, p.category, DATE_TRUNC('month', o.order_date)
ORDER BY month, country, category;
```

## Solution: Challenge Part 4
**Data scanned**:
```
orders_cleaned: 3,000,000 rows (2024) × 140 bytes ≈ 420 MB
users: 1,000,000 rows × 154 bytes = 154 MB
products: 10,000 rows × 200 bytes = 2 MB
Total scan: 576 MB
```

**Join intermediate**:
```
3M orders × (order: 140 bytes + user: 154 bytes + product: 200 bytes)
= 3,000,000 × 494 bytes ≈ 1,482 MB ≈ 1.48 GB
```

**Final aggregated result**:
```
Assume 50 countries × 20 categories × 12 months = 12,000 groups
Each row: country (50) + category (50) + month (4) + revenue (8) + count (4)
= 116 bytes per row
Total: 12,000 × 116 bytes ≈ 1.4 MB
```

**Optimization**: Add WHERE clause on orders_cleaned first, then join:
```sql
SELECT ... 
FROM (SELECT * FROM orders_cleaned WHERE order_date >= '2024-01-01') o
JOIN users u ON o.user_id = u.user_id
JOIN products p ON o.product_id = p.product_id
...
```
This reduces initial scan from all orders to just 2024 orders.
