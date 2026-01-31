# SQL Practice — Marketplace Analytics (Joins + Window Functions)

## Scenario
You are a data engineer/analyst for an online marketplace.
The platform has customers, sellers, products, orders, and order line-items.

Your goal is to answer analytics questions using:
- `SELECT`, `WHERE`, `GROUP BY`, `HAVING`
- `INNER JOIN` / `LEFT JOIN`
- Window functions: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`,
  running totals, and moving averages

### Business rules
- Unless stated otherwise, use only orders with `status = 'completed'`.
- Line revenue = `quantity * unit_price * (1 - discount_pct/100)`
- Order revenue is the sum of its line items.

---

## Tables (Schema)

### customers
| column | type |
|---|---|
| customer_id | INT |
| full_name | VARCHAR |
| city | VARCHAR |
| signup_date | DATE |

### sellers
| column | type |
|---|---|
| seller_id | INT |
| seller_name | VARCHAR |
| tier | VARCHAR |

### products
| column | type |
|---|---|
| product_id | INT |
| seller_id | INT |
| category | VARCHAR |
| list_price | DECIMAL(10,2) |

### orders
| column | type |
|---|---|
| order_id | INT |
| customer_id | INT |
| order_date | DATE |
| status | VARCHAR |

### order_items
| column | type |
|---|---|
| order_id | INT |
| product_id | INT |
| quantity | INT |
| unit_price | DECIMAL(10,2) |
| discount_pct | DECIMAL(5,2) |

---

## Sample Data (as tables)

### customers
| customer_id | full_name        | city       | signup_date |
|---:|---|---|---|
| 1 | Dana Levi      | Tel Aviv  | 2025-01-05 |
| 2 | Amir Cohen     | Haifa     | 2025-02-10 |
| 3 | Noa Bar        | Tel Aviv  | 2025-02-15 |
| 4 | Yossi Mizrahi   | Jerusalem | 2025-03-01 |

### sellers
| seller_id | seller_name   | tier |
|---:|---|---|
| 10 | AlphaStore   | gold |
| 11 | BetaShop    | silver |
| 12 | GammaMarket | bronze |

### products
| product_id | seller_id | category     | list_price |
|---:|---:|---|---:|
| 100 | 10 | electronics | 200.00 |
| 101 | 10 | home        | 80.00  |
| 102 | 11 | electronics | 150.00 |
| 103 | 11 | books       | 40.00  |
| 104 | 12 | home        | 120.00 |
| 105 | 12 | books       | 55.00  |

### orders
| order_id | customer_id | order_date  | status |
|---:|---:|---|---|
| 500 | 1 | 2025-03-01 | completed |
| 501 | 1 | 2025-03-10 | completed |
| 502 | 2 | 2025-03-10 | cancelled |
| 503 | 3 | 2025-03-12 | completed |
| 504 | 2 | 2025-03-20 | completed |
| 505 | 4 | 2025-03-22 | completed |
| 506 | 4 | 2025-03-25 | returned |

### order_items
| order_id | product_id | quantity | unit_price | discount_pct |
|---:|---:|---:|---:|---:|
| 500 | 100 | 1 | 180.00 | 0.00 |
| 500 | 103 | 2 | 35.00  | 10.00 |
| 501 | 101 | 1 | 75.00  | 0.00 |
| 503 | 102 | 1 | 140.00 | 0.00 |
| 503 | 103 | 1 | 38.00  | 0.00 |
| 504 | 103 | 3 | 30.00  | 0.00 |
| 505 | 104 | 1 | 110.00 | 5.00 |
| 505 | 105 | 2 | 50.00  | 0.00 |
| 506 | 100 | 1 | 175.00 | 0.00 |

---

## Questions (10)

### Q1 (Easy) — Completed orders
Return all completed orders with columns: `order_id, customer_id, order_date`.
Sort by `order_date` ascending (and `order_id` for tie-break).

### Q2 (Easy) — Orders with customer names (JOIN)
List all orders with the customer name: `order_id, order_date, status, full_name`.
Include cancelled/returned too.

### Q3 (Easy→Medium) — Completed orders per customer (LEFT JOIN)
Compute total number of completed orders per customer:
`customer_id, full_name, completed_orders`.
Customers with 0 completed orders must appear with 0.

### Q4 (Medium) — Revenue per completed order (aggregation)
Compute revenue per completed order:
`order_id, order_date, customer_id, order_revenue`.

### Q5 (Medium) — Revenue per seller
Compute total revenue per seller (completed orders only):
`seller_id, seller_name, revenue`.

### Q6 (Medium→Hard) — Seller rank per category (DENSE_RANK)
For each category, compute revenue per seller and rank sellers within category:
`category, seller_id, seller_name, revenue_in_category, category_rank`.

### Q7 (Hard) — Running revenue per customer (running sum)
For each customer, list each completed order with:
`customer_id, full_name, order_id, order_date, order_revenue, running_revenue`.

### Q8 (Hard) — Days since previous completed order (LAG)
For each customer’s completed orders, compute:
`customer_id, order_id, order_date, prev_order_date, days_since_prev`.

### Q9 (Hard) — Moving average of order revenue (ROWS frame)
Compute a 2-order moving average of order revenue per customer:
`customer_id, order_id, order_date, order_revenue, mov_avg_2`.

### Q10 (Very Hard) — Top category per customer (ROW_NUMBER + tie-break)
For each customer, find the category where they spent the most (completed only):
`customer_id, full_name, top_category, top_spend`.
If multiple categories tie, pick the alphabetically smallest category.

---

## Solutions (No CTE)

### A1
```sql
SELECT order_id, customer_id, order_date
FROM orders
WHERE status = 'completed'
ORDER BY order_date, order_id;
```

### A2
```sql
SELECT o.order_id, o.order_date, o.status, c.full_name
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
ORDER BY o.order_id;
```

### A3
```sql
SELECT
  c.customer_id,
  c.full_name,
  COALESCE(COUNT(o.order_id), 0) AS completed_orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.status = 'completed'
GROUP BY c.customer_id, c.full_name
ORDER BY completed_orders DESC, c.customer_id;
```

### A4
```sql
SELECT
  o.order_id,
  o.order_date,
  o.customer_id,
  SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'completed'
GROUP BY o.order_id, o.order_date, o.customer_id
ORDER BY order_revenue DESC, o.order_id;
```

### A5
```sql
SELECT
  s.seller_id,
  s.seller_name,
  SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
JOIN sellers s ON s.seller_id = p.seller_id
WHERE o.status = 'completed'
GROUP BY s.seller_id, s.seller_name
ORDER BY revenue DESC, s.seller_id;
```

### A6
```sql
SELECT
  t.category,
  t.seller_id,
  t.seller_name,
  t.revenue_in_category,
  DENSE_RANK() OVER (
    PARTITION BY t.category
    ORDER BY t.revenue_in_category DESC
  ) AS category_rank
FROM (
  SELECT
    p.category,
    s.seller_id,
    s.seller_name,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS revenue_in_category
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  JOIN sellers s ON s.seller_id = p.seller_id
  WHERE o.status = 'completed'
  GROUP BY p.category, s.seller_id, s.seller_name
) t
ORDER BY t.category, category_rank, t.seller_id;
```

### A7
```sql
SELECT
  c.customer_id,
  c.full_name,
  r.order_id,
  r.order_date,
  r.order_revenue,
  SUM(r.order_revenue) OVER (
    PARTITION BY r.customer_id
    ORDER BY r.order_date, r.order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_revenue
FROM (
  SELECT
    o.customer_id,
    o.order_id,
    o.order_date,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id, o.order_id, o.order_date
) r
JOIN customers c ON c.customer_id = r.customer_id
ORDER BY c.customer_id, r.order_date, r.order_id;
```

### A8
```sql
SELECT
  x.customer_id,
  x.order_id,
  x.order_date,
  x.prev_order_date,
  (x.order_date - x.prev_order_date) AS days_since_prev
FROM (
  SELECT
    o.customer_id,
    o.order_id,
    o.order_date,
    LAG(o.order_date) OVER (
      PARTITION BY o.customer_id
      ORDER BY o.order_date, o.order_id
    ) AS prev_order_date
  FROM orders o
  WHERE o.status = 'completed'
) x
ORDER BY x.customer_id, x.order_date, x.order_id;
```

### A9
```sql
SELECT
  y.customer_id,
  y.order_id,
  y.order_date,
  y.order_revenue,
  AVG(y.order_revenue) OVER (
    PARTITION BY y.customer_id
    ORDER BY y.order_date, y.order_id
    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
  ) AS mov_avg_2
FROM (
  SELECT
    o.customer_id,
    o.order_id,
    o.order_date,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.customer_id, o.order_id, o.order_date
) y
ORDER BY y.customer_id, y.order_date, y.order_id;
```

### A10
```sql
SELECT
  c.customer_id,
  c.full_name,
  t.category AS top_category,
  t.spend AS top_spend
FROM customers c
LEFT JOIN (
  SELECT customer_id, category, spend
  FROM (
    SELECT
      o.customer_id,
      p.category,
      SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS spend,
      ROW_NUMBER() OVER (
        PARTITION BY o.customer_id
        ORDER BY
          SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) DESC,
          p.category ASC
      ) AS rn
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p ON p.product_id = oi.product_id
    WHERE o.status = 'completed'
    GROUP BY o.customer_id, p.category
  ) z
  WHERE rn = 1
) t ON t.customer_id = c.customer_id
ORDER BY c.customer_id;
```

---

## Common pitfalls
- Forgetting to filter `status='completed'` for revenue questions.
- Double-counting revenue by joining orders directly to products (must go through `order_items`).
- Missing tie-breakers in window `ORDER BY` (can cause non-deterministic results).
- Using `INNER JOIN` when the question requires keeping “all customers” (use `LEFT JOIN`).
