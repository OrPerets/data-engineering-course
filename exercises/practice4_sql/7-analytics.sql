WITH daily_revenue AS (
  SELECT
    d.calendar_date,
    c.region,
    p.category,
    SUM(f.net_revenue) AS daily_net_revenue
  FROM dwh.fact_sales AS f
  JOIN dwh.dim_date AS d
    ON d.date_key = f.date_key
  JOIN dwh.dim_customer AS c
    ON c.customer_key = f.customer_key
  JOIN dwh.dim_product AS p
    ON p.product_key = f.product_key
  GROUP BY
    d.calendar_date,
    c.region,
    p.category
)
SELECT
  calendar_date,
  region,
  category,
  daily_net_revenue,
  SUM(daily_net_revenue) OVER (
    PARTITION BY region, category
    ORDER BY calendar_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_net_revenue
FROM daily_revenue
ORDER BY
  calendar_date,
  region,
  category;

-- D1.2 Weekly fulfillment rate by canonical channel,
-- plus weekly channel rank by fulfillment rate.
WITH weekly_fulfillment AS (
  SELECT
    date_trunc('week', o.order_ts)::date AS week_start,
    o.channel_name,
    COUNT(*) FILTER (WHERE o.order_status = 'completed')::decimal(14,4)
      / NULLIF(COUNT(*), 0) AS fulfillment_rate,
    COUNT(*) FILTER (WHERE o.order_status = 'completed') AS completed_orders,
    COUNT(*) AS total_orders
  FROM staging.v_orders_latest AS o
  GROUP BY
    date_trunc('week', o.order_ts)::date,
    o.channel_name
)
SELECT
  week_start,
  channel_name,
  fulfillment_rate,
  completed_orders,
  total_orders,
  RANK() OVER (
    PARTITION BY week_start
    ORDER BY fulfillment_rate DESC, channel_name
  ) AS weekly_channel_rank
FROM weekly_fulfillment
ORDER BY
  week_start,
  weekly_channel_rank,
  channel_name;

-- D1.3 Monthly net revenue by canonical customer segment,
-- plus previous month and month-over-month change.
WITH monthly_segment_revenue AS (
  SELECT
    d.year_month,
    c.segment,
    SUM(f.net_revenue) AS monthly_net_revenue
  FROM dwh.fact_sales AS f
  JOIN dwh.dim_date AS d
    ON d.date_key = f.date_key
  JOIN dwh.dim_customer AS c
    ON c.customer_key = f.customer_key
  GROUP BY
    d.year_month,
    c.segment
)
SELECT
  year_month,
  segment,
  monthly_net_revenue,
  LAG(monthly_net_revenue) OVER (
    PARTITION BY segment
    ORDER BY year_month
  ) AS previous_month_net_revenue,
  monthly_net_revenue
    - LAG(monthly_net_revenue) OVER (
        PARTITION BY segment
        ORDER BY year_month
      ) AS month_over_month_change
FROM monthly_segment_revenue
ORDER BY
  year_month,
  segment,
  monthly_net_revenue DESC;

-- D1.4 Top 5 products by net revenue in the last 30 available days,
-- using ROW_NUMBER for top-N selection.
WITH anchor AS (
  SELECT MAX(calendar_date) AS max_calendar_date
  FROM dwh.dim_date
),
product_revenue_30d AS (
  SELECT
    p.product_id,
    p.product_name,
    p.category,
    SUM(f.net_revenue) AS net_revenue_30d
  FROM dwh.fact_sales AS f
  JOIN dwh.dim_date AS d
    ON d.date_key = f.date_key
  JOIN dwh.dim_product AS p
    ON p.product_key = f.product_key
  CROSS JOIN anchor AS a
  WHERE d.calendar_date >= a.max_calendar_date - INTERVAL '30 days'
  GROUP BY
    p.product_id,
    p.product_name,
    p.category
),
ranked_products AS (
  SELECT
    product_id,
    product_name,
    category,
    net_revenue_30d,
    ROW_NUMBER() OVER (
      ORDER BY net_revenue_30d DESC, product_id
    ) AS product_rank
  FROM product_revenue_30d
)
SELECT
  product_rank,
  product_id,
  product_name,
  category,
  net_revenue_30d
FROM ranked_products
WHERE product_rank <= 5
ORDER BY
  product_rank;
