# תרגול 4 - DWH, ETL ו-STTM - פתרון

## חלק א - היכרות עם מקורות הנתונים

### א3.1 - גרעין ומפתח עסקי לכל טבלת מקור

| טבלת מקור | גרעין | מפתח עסקי |
|---|---|---|
| `orders_src` | שורה אחת לכל גרסת הזמנה | `order_id` ובפועל `updated_at` מזהה גרסאות |
| `order_items_src` | שורה אחת לכל שורת הזמנה | (`order_id`, `line_id`) |
| `products_src` | שורה אחת לכל גרסת מוצר | `product_id` |
| `customers_src` | שורה אחת לכל גרסת לקוח | `customer_id` |
| `returns_src` | שורה אחת לכל אירוע החזרה | `return_id` |

### א3.2 - סיווג טבלאות המקור

| טבלת מקור | סיווג | הסבר |
|---|---|---|
| `orders_src` | Mutable | סטטוס הזמנה יכול להשתנות, למשל `completed` ל-`refunded`. |
| `order_items_src` | Mutable | ייתכנו תיקונים לכמות, מחיר או הנחה. |
| `products_src` | Mutable | קטגוריה, מותג או פרטי מוצר יכולים להשתנות. |
| `customers_src` | Mutable | סגמנט הלקוח יכול להשתנות לאורך זמן. |
| `returns_src` | Late-arriving / append-only | אירועי החזרה מתווספים לאחר ההזמנה ולעיתים מגיעים בעיכוב. |

### א3.3 - שני סיכוני איכות נתונים

1. כפילויות או גרסאות מרובות לאותו מפתח עסקי.
   למשל ב-`orders_src` קיימות שתי רשומות עבור `order_id=7002`. ללא כלל dedup קבוע נקבל ספירה כפולה או שימוש בגרסה לא נכונה.

2. נתוני החזרות שמגיעים באיחור.
   אם נטען רק את נתוני "אתמול", החזרות מאוחרות לא יעדכנו את `net_revenue`, ולכן המדדים ההיסטוריים יהיו שגויים.

### א3.4 - דוגמת SQL ל-staging

```sql
CREATE TABLE staging.orders_src (
  order_id BIGINT NOT NULL,
  customer_id BIGINT NOT NULL,
  order_ts TIMESTAMP NOT NULL,
  channel VARCHAR(50),
  order_status VARCHAR(50),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE staging.order_items_src (
  order_id BIGINT NOT NULL,
  line_id INT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL
);
```

---

## חלק ב - מידול DWH

### ב3.1 - הגרעין של `fact_sales`

הגרעין הנכון הוא שורה אחת לכל שורת הזמנה, כלומר:
`order_id + line_id`

זהו הגרעין הנכון משום שההכנסה, ההנחות וההחזרות מחושבות ברמת שורת הזמנה ולא רק ברמת ההזמנה כולה.

### ב3.2 - סכמת `fact_sales`

| עמודה | טיפוס | תיאור |
|---|---|---|
| fact_sales_sk | BIGINT | מפתח סורוגטי פנימי |
| date_key | INT | FK אל `dim_date` |
| product_key | BIGINT | FK אל `dim_product` |
| customer_key | BIGINT | FK אל `dim_customer` |
| channel_key | INT | FK אל `dim_channel` |
| order_id | BIGINT | מימד דגנרטיבי לצורכי drill-down |
| line_id | INT | מימד דגנרטיבי |
| quantity | INT | כמות |
| gross_revenue | DECIMAL(14,2) | `quantity * unit_price` |
| discount_amount | DECIMAL(14,2) | סכום ההנחה |
| return_amount | DECIMAL(14,2) | סכום ההחזרה |
| net_revenue | DECIMAL(14,2) | `gross_revenue - discount_amount - return_amount` |
| load_ts | TIMESTAMP | חותמת זמן טעינה |

### ב3.3 - סכמת `dim_customer` עם SCD Type 2

| עמודה | טיפוס | תיאור |
|---|---|---|
| customer_key | BIGINT | מפתח סורוגטי |
| customer_id | BIGINT | מפתח עסקי |
| full_name | VARCHAR | שם הלקוח |
| segment | VARCHAR | סגמנט |
| city | VARCHAR | עיר |
| region | VARCHAR | אזור |
| valid_from | TIMESTAMP | תחילת תוקף הרשומה |
| valid_to | TIMESTAMP | סוף תוקף הרשומה |
| is_current | BOOLEAN | האם זו הגרסה הנוכחית |

### ב3.4 - למה טבלת עובדות ברמת הזמנה אינה נכונה

- הזמנה אחת יכולה לכלול כמה מוצרים מכמה קטגוריות.
- החזרות מתבצעות ברמת שורת הזמנה.
- הנחות מחושבות ברמת שורה.

אם נבחר גרעין של הזמנה בלבד, לא נוכל לחשב בצורה מדויקת הכנסה לפי קטגוריית מוצר או לייחס החזרות לשורה הנכונה.

### ב3.5 - קשרי סכמת הכוכב

טבלת `fact_sales` מכילה את המפתחות:
- `date_key` אל `dim_date`
- `product_key` אל `dim_product`
- `customer_key` אל `dim_customer`
- `channel_key` אל `dim_channel`

מבנה סכמטי:

```text
fact_sales
  -> dim_date
  -> dim_product
  -> dim_customer
  -> dim_channel
```

---

## חלק ג - ETL, טעינה אינקרמנטלית ו-STTM

### ג2.1 - שלבי Extract, Transform, Load

**Extract**
- שליפת נתונים מהמקורות לפי `updated_at` או `ingested_at`.
- שימוש ב-watermark כדי להביא רק דלתא.

**Transform**
- dedup לרשומות משתנות.
- חיבור בין `orders_src`, `order_items_src`, `products_src`, `customers_src`, `returns_src`.
- חישוב מדדים נגזרים.
- lookup למפתחות סורוגטיים במימדים.

**Load**
- טעינה אל טבלאות מימד.
- טעינה idempotent לטבלת `fact_sales` באמצעות `MERGE`.
- עדכון watermark רק לאחר הצלחה מלאה.

### ג2.2 - עמודות טבלת בקרה

| עמודה | תיאור |
|---|---|
| job_key | מזהה תהליך |
| source_name | שם טבלת המקור |
| watermark_column | שם עמודת ה-watermark |
| last_success_value | הערך האחרון שעובד בהצלחה |
| lower_bound | גבול תחתון לריצה |
| upper_bound | גבול עליון לריצה |
| run_id | מזהה ריצה |
| status | סטטוס הריצה |
| rows_read | מספר רשומות שנקראו |
| rows_loaded | מספר רשומות שנטענו |
| rows_rejected | מספר רשומות שנדחו |
| started_at | תחילת ריצה |
| finished_at | סיום ריצה |

### ג2.3 - פסאודו-קוד ל-watermark

```text
last_wm = read_last_successful_watermark(job_key)
lookback_hours = 72
safety_buffer_minutes = 10

extract_from = last_wm - interval '72 hours'
extract_to = now_utc() - interval '10 minutes'

read rows
where updated_at > extract_from
  and updated_at <= extract_to

if load_success:
    new_wm = extract_to
    update_control_table(new_wm)
else:
    keep_previous_watermark()
```

### ג2.4 - כלל dedup דטרמיניסטי

- עבור `orders_src`:
  בוחרים את הרשומה עם `updated_at` הגבוה ביותר לכל `order_id`.

- עבור `customers_src`:
  בוחרים את הרשומה עם `updated_at` הגבוה ביותר לכל `customer_id` עבור current view.
  עבור SCD2 שומרים את כל הגרסאות, ומגדירים חלונות תוקף.

### ג2.5 - מיפוי STTM

| target_table | target_column | source_table.source_column | transform_rule | key_type | null_policy |
|---|---|---|---|---|---|
| fact_sales | date_key | orders_src.order_ts | המרה ל-`YYYYMMDD` או lookup ל-`dim_date` | FK | reject |
| fact_sales | product_key | order_items_src.product_id | lookup ב-`dim_product` | FK | reject |
| fact_sales | customer_key | orders_src.customer_id | lookup ב-`dim_customer` לפי חלון SCD2 תקף | FK | reject |
| fact_sales | channel_key | orders_src.channel | lookup ב-`dim_channel` | FK | default unknown |
| fact_sales | gross_revenue | quantity, unit_price | `quantity * unit_price` | measure | default 0 |
| fact_sales | discount_amount | discount_amount | `coalesce(discount_amount, 0)` | measure | default 0 |
| fact_sales | return_amount | returns_src.return_amount | סכימה לפי `order_id, line_id` | measure | default 0 |
| fact_sales | net_revenue | derived | `gross_revenue - discount_amount - return_amount` | measure | reject אם חריג |

### ג2.6 - שלד `MERGE` idempotent

```sql
MERGE INTO dwh.fact_sales t
USING (
  SELECT
    d.date_key,
    p.product_key,
    c.customer_key,
    ch.channel_key,
    oi.order_id,
    oi.line_id,
    oi.quantity,
    oi.quantity * oi.unit_price AS gross_revenue,
    COALESCE(oi.discount_amount, 0) AS discount_amount,
    COALESCE(r.return_amount, 0) AS return_amount,
    oi.quantity * oi.unit_price
      - COALESCE(oi.discount_amount, 0)
      - COALESCE(r.return_amount, 0) AS net_revenue
  FROM staging.orders_dedup o
  JOIN staging.order_items_src oi
    ON o.order_id = oi.order_id
  JOIN dwh.dim_date d
    ON d.date_key = TO_CHAR(o.order_ts::DATE, 'YYYYMMDD')::INT
  JOIN dwh.dim_product p
    ON p.product_id = oi.product_id
  JOIN dwh.dim_customer c
    ON c.customer_id = o.customer_id
   AND o.order_ts >= c.valid_from
   AND (c.valid_to IS NULL OR o.order_ts < c.valid_to)
  JOIN dwh.dim_channel ch
    ON ch.channel_name = o.channel
  LEFT JOIN (
    SELECT order_id, line_id, SUM(return_amount) AS return_amount
    FROM staging.returns_src
    GROUP BY order_id, line_id
  ) r
    ON r.order_id = oi.order_id
   AND r.line_id = oi.line_id
) s
ON t.order_id = s.order_id
AND t.line_id = s.line_id
WHEN MATCHED THEN UPDATE SET
  date_key = s.date_key,
  product_key = s.product_key,
  customer_key = s.customer_key,
  channel_key = s.channel_key,
  quantity = s.quantity,
  gross_revenue = s.gross_revenue,
  discount_amount = s.discount_amount,
  return_amount = s.return_amount,
  net_revenue = s.net_revenue,
  load_ts = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  date_key,
  product_key,
  customer_key,
  channel_key,
  order_id,
  line_id,
  quantity,
  gross_revenue,
  discount_amount,
  return_amount,
  net_revenue,
  load_ts
) VALUES (
  s.date_key,
  s.product_key,
  s.customer_key,
  s.channel_key,
  s.order_id,
  s.line_id,
  s.quantity,
  s.gross_revenue,
  s.discount_amount,
  s.return_amount,
  s.net_revenue,
  CURRENT_TIMESTAMP
);
```

### ג2.7 - טיפול בנתונים מאוחרים מ-`returns_src`

- מגדירים חלון lookback של 72 שעות.
- בכל ריצה טוענים מחדש החזרות שהגיעו בטווח הזה.
- מעדכנים את אותן שורות ב-`fact_sales` לפי `order_id + line_id`.
- לא יוצרים שורה חדשה, אלא מתקנים `return_amount` ו-`net_revenue`.

---

## חלק ד - שאילתות אנליטיות וביצועים

### ד1.1 - הכנסה נטו יומית לפי אזור וקטגוריה

```sql
SELECT
  d.calendar_date,
  c.region,
  p.category,
  SUM(f.net_revenue) AS daily_net_revenue
FROM dwh.fact_sales f
JOIN dwh.dim_date d
  ON f.date_key = d.date_key
JOIN dwh.dim_customer c
  ON f.customer_key = c.customer_key
JOIN dwh.dim_product p
  ON f.product_key = p.product_key
GROUP BY d.calendar_date, c.region, p.category
ORDER BY d.calendar_date, c.region, p.category;
```

### ד1.2 - שיעור מימוש הזמנות שבועי לפי ערוץ

```sql
SELECT
  d.week_start,
  ch.channel_name,
  COUNT(DISTINCT CASE WHEN o.order_status = 'completed' THEN o.order_id END) * 1.0
    / NULLIF(COUNT(DISTINCT o.order_id), 0) AS fulfillment_rate
FROM staging.orders_dedup o
JOIN dwh.dim_channel ch
  ON ch.channel_name = o.channel
JOIN dwh.dim_date d
  ON d.date_key = TO_CHAR(o.order_ts::DATE, 'YYYYMMDD')::INT
GROUP BY d.week_start, ch.channel_name
ORDER BY d.week_start, ch.channel_name;
```

### ד1.3 - הכנסה נטו חודשית לפי סגמנט

```sql
SELECT
  d.year_month,
  c.segment,
  SUM(f.net_revenue) AS monthly_net_revenue
FROM dwh.fact_sales f
JOIN dwh.dim_date d
  ON f.date_key = d.date_key
JOIN dwh.dim_customer c
  ON f.customer_key = c.customer_key
GROUP BY d.year_month, c.segment
ORDER BY d.year_month, c.segment;
```

### ד1.4 - חמשת המוצרים המובילים לפי הכנסה נטו ב-30 הימים האחרונים

```sql
SELECT
  p.product_name,
  SUM(f.net_revenue) AS net_revenue_30d
FROM dwh.fact_sales f
JOIN dwh.dim_product p
  ON f.product_key = p.product_key
JOIN dwh.dim_date d
  ON f.date_key = d.date_key
WHERE d.calendar_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.product_name
ORDER BY net_revenue_30d DESC
LIMIT 5;
```

### ד2.1 - Partition pruning

אם טבלת `fact_sales` מחולקת לפי `date_key`, אז כל שאילתה שמגבילה תאריכים תסרוק רק את המחיצות הרלוונטיות ולא את כל הטבלה. כך מתקבלים פחות I/O, פחות זמן ריצה, ופחות עלות חישוב.

### ד2.2 - דוגמת anti-pattern

דוגמה לא טובה:

```sql
SELECT *
FROM dwh.fact_sales
WHERE CAST(date_key AS VARCHAR) LIKE '202506%';
```

זו שאילתה בעייתית כי היא מונעת שימוש יעיל ב-partition pruning ובאינדקסים.

גרסה טובה יותר:

```sql
SELECT *
FROM dwh.fact_sales
WHERE date_key BETWEEN 20250601 AND 20250630;
```

### ד2.3 - למה חייבים תנאי SCD2 ב-join

אם נחבר את `fact_sales` ל-`dim_customer` רק לפי `customer_id`, נקבל לפעמים את הגרסה הנוכחית של הלקוח ולא את הגרסה שהייתה תקפה בזמן ההזמנה. במקרה כזה KPI היסטוריים לפי סגמנט יעוותו את המציאות.

### ד2.4 - מדדי ניטור מוצעים

1. freshness lag בין זמן האירוע לזמן הטעינה למחסן.
2. מספר שורות שנדחו או נכשלו בולידציה.
3. מספר שורות שעודכנו ב-`MERGE` לעומת מספר שורות חדשות.
4. נפח סריקה ממוצע או זמן ריצה של שאילתות דשבורד מרכזיות.

---

## שאלות בונוס - כיוון לפתרון

### בונוס 1
אפשר להוסיף `risk_events_src` כטבלת אירועים נפרדת שמתחברת לפי `order_id` או `order_id + line_id`, או להוסיף דגלים מחושבים ל-fact בלי לשנות את הגרעין.

### בונוס 2
ב-backfill עדיף לעבוד לפי טווח תאריכים או partitions, למחוק או לדרוס רק את הטווח המושפע, ואז לבצע טעינה מחדש בצורה מבוקרת.

### בונוס 3
כדאי להגדיר במילון מדדים:
- `gross_revenue = quantity * unit_price`
- `net_revenue = gross_revenue - discount_amount - return_amount`

כך נמנעים מפירושים שונים של אותם KPI בין צוותים שונים.
