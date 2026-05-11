-- Q1
SELECT order_id, customer_id, order_date
FROM orders
WHERE status = 'completed'
ORDER BY order_date, order_id;

-- Q2
SELECT o.order_id, o.order_date, o.status, c.full_name
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
ORDER BY o.order_id;

-- Q3
SELECT
  c.customer_id,
  c.full_name,
  COALESCE(COUNT(o.order_id), 0) AS completed_orders
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
 AND o.status = 'completed'
GROUP BY c.customer_id, c.full_name
ORDER BY completed_orders DESC, c.customer_id;

-- Q4
SELECT
  o.order_id,
  o.order_date,
  o.customer_id,
  SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status = 'completed'
GROUP BY o.order_id, o.order_date, o.customer_id
ORDER BY order_revenue DESC, o.order_id;

-- Q5
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

-- Q6
SELECT
  customer_id,
  order_id,
  order_date,
  ROW_NUMBER() OVER (PARTITION BY customer_id) AS cust_order_seq
FROM orders
WHERE status = 'completed'
ORDER BY customer_id, cust_order_seq, order_id;

-- Q7
WITH seller_rev AS (
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
)
SELECT
  seller_id,
  seller_name,
  revenue,
  RANK() OVER (ORDER BY revenue DESC) AS revenue_rank
FROM seller_rev
ORDER BY revenue_rank, seller_id;

-- Q8
WITH order_rev AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.order_date,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.order_id, o.customer_id, o.order_date
)
SELECT
  customer_id,
  order_id,
  order_date,
  order_revenue,
  LAG(order_revenue) OVER (PARTITION BY customer_id) AS prev_order_revenue
FROM order_rev
ORDER BY customer_id, order_date, order_id;

-- Q9
WITH order_rev AS (
  SELECT
    o.order_id,
    o.order_date,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.order_id, o.order_date
)
SELECT
  order_id,
  order_date,
  order_revenue,
  SUM(order_revenue) OVER (
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_revenue
FROM order_rev
ORDER BY order_date, order_id;

-- Q10
WITH lines AS (
  SELECT
    oi.order_id,
    oi.product_id,
    (oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS line_revenue
  FROM order_items oi
  JOIN orders o ON o.order_id = oi.order_id
  WHERE o.status = 'completed'
),
ranked AS (
  SELECT
    order_id,
    product_id,
    line_revenue,
    ROW_NUMBER() OVER (
      PARTITION BY order_id
      ORDER BY line_revenue DESC, product_id
    ) AS line_rank
  FROM lines
)
SELECT order_id, product_id, line_revenue, line_rank
FROM ranked
WHERE line_rank <= 2
ORDER BY order_id, line_rank, product_id;

-- Q11
WITH order_rev AS (
  SELECT
    o.order_id,
    o.order_date,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct/100.0)) AS order_revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.order_id, o.order_date
),
with_avg AS (
  SELECT
    order_id,
    order_date,
    order_revenue,
    AVG(order_revenue) OVER () AS avg_completed_order_revenue
  FROM order_rev
)
SELECT
  order_id,
  order_date,
  order_revenue,
  avg_completed_order_revenue,
  order_revenue - avg_completed_order_revenue AS diff_from_avg
FROM with_avg
ORDER BY order_date, order_id;
