# Topic 05 — Data Warehouse & Data Lake — Engineering Practice (Step-by-Step)

## Scenario
A marketplace wants to track seller performance and category KPIs for monthly business reviews.
Raw data is stored in a data lake, but analysts need a curated star schema in the warehouse.
You must design the fact and dimensions, define the grain, and determine what stays in the lake vs what is modeled in the warehouse.
The output must support revenue and units sold by seller, product, and day.

## Input Data
### Source tables

#### Lake: `orders_raw`
Schema:
| column | type |
|---|---|
| order_id | INT |
| order_date | DATE |
| customer_id | INT |
| status | VARCHAR |

Sample data:
| order_id | order_date | customer_id | status |
|---:|---|---:|---|
| 3001 | 2025-02-01 | 901 | completed |
| 3002 | 2025-02-01 | 902 | completed |
| 3003 | 2025-02-02 | 901 | cancelled |
| 3004 | 2025-02-03 | 903 | completed |

#### Lake: `order_items_raw`
Schema:
| column | type |
|---|---|
| order_id | INT |
| product_id | INT |
| quantity | INT |
| unit_price | DECIMAL(10,2) |

Sample data:
| order_id | product_id | quantity | unit_price |
|---:|---:|---:|---:|
| 3001 | 501 | 1 | 120.00 |
| 3001 | 502 | 2 | 30.00 |
| 3002 | 503 | 1 | 75.00 |
| 3004 | 501 | 1 | 115.00 |
| 3004 | 504 | 3 | 20.00 |

#### Lake: `products_raw`
Schema:
| column | type |
|---|---|
| product_id | INT |
| product_name | VARCHAR |
| category | VARCHAR |
| seller_id | INT |

Sample data:
| product_id | product_name | category | seller_id |
|---:|---|---|---:|
| 501 | Noise Cancelling Headphones | electronics | 201 |
| 502 | Coffee Mug | home | 202 |
| 503 | USB Hub | electronics | 201 |
| 504 | Notebook | stationery | 203 |

#### Lake: `sellers_raw`
Schema:
| column | type |
|---|---|
| seller_id | INT |
| seller_name | VARCHAR |
| region | VARCHAR |

Sample data:
| seller_id | seller_name | region |
|---:|---|---|
| 201 | SonicStore | north |
| 202 | HomeBasics | west |
| 203 | PaperWorks | south |

### Assumptions & rules
- Only `status = 'completed'` orders contribute to analytics.
- Revenue per line item = `quantity * unit_price`.
- Products and sellers are relatively stable but can be updated; warehouse dims use surrogate keys.
- The warehouse is refreshed daily with idempotent loads for the same date.

## Target / Goal
- Build a star schema in the warehouse for monthly seller performance analytics.
- Fact table: `fact_sales` with explicit grain and measures.
- Dimension tables: at least `dim_date`, `dim_product`, `dim_seller`.
- Guarantees:
  - Fact grain supports aggregations by day, seller, product, and category.
  - Dimensions have stable surrogate keys independent of source IDs.

## Questions (8, easy → hard)

### Q1 — Data understanding
State the grain of each raw lake table and identify the primary business keys.

### Q2 — Design decision
Define the grain of the `fact_sales` table. Explain why this grain is appropriate for seller and category KPIs.

### Q3 — Transformation plan (step sequence)
List the ordered steps to move data from the lake into the warehouse, including filtering, joins, surrogate key assignment, and load ordering.

### Q4 — Output schema
Provide the explicit schema for `fact_sales` as a markdown table, including surrogate keys and measures.

### Q5 — Worked example on sample data
Using the sample data, show the resulting `fact_sales` rows for completed orders only. Include surrogate keys for dimensions (you may assign simple integers).

### Q6 — Lake vs warehouse
Which specific tables or data stay in the lake (bronze/silver), and which are modeled in the warehouse (gold)? Justify with at least two reasons.

### Q7 — Engineering trade-off
Discuss one trade-off between storing all raw history in the lake vs only curated warehouse tables, focusing on cost, flexibility, and correctness.

### Q8 — Grain failure
If `fact_sales` were mistakenly defined at the order level (one row per order), what analyses become incorrect or impossible? Provide two concrete examples based on the sample data.

---

# Step-by-Step Solutions

## A1 — Data understanding
- `orders_raw` grain: one row per order. Business key: `order_id`.
- `order_items_raw` grain: one row per order line item. Business key: (`order_id`, `product_id`).
- `products_raw` grain: one row per product. Business key: `product_id`.
- `sellers_raw` grain: one row per seller. Business key: `seller_id`.

## A2 — Design decision
Define `fact_sales` grain as one row per order line item per day.
- This grain preserves product and seller detail needed for category and seller KPIs.
- It supports correct aggregation of units and revenue by product, category, seller, and date.

## A3 — Transformation plan
1. Ingest raw tables into lake landing partitions by load date.
2. Filter `orders_raw` to completed orders only.
3. Join completed orders to `order_items_raw` to get line items.
4. Join line items to `products_raw` and `sellers_raw` for dimensions.
5. Assign surrogate keys:
   - `dim_date` key from `order_date`.
   - `dim_product` key from `product_id`.
   - `dim_seller` key from `seller_id`.
6. Load dimension tables first, then load `fact_sales` referencing surrogate keys.
7. Use deterministic upserts on business keys to keep loads idempotent.

## A4 — Output schema
`fact_sales`:
| column | type |
|---|---|
| fact_sales_id | INT |
| date_key | INT |
| product_key | INT |
| seller_key | INT |
| order_id | INT |
| quantity | INT |
| unit_price | DECIMAL(10,2) |
| line_revenue | DECIMAL(10,2) |

## A5 — Worked example (explicit output rows)
Assume surrogate keys:
- `dim_date`: 2025-02-01 → 1, 2025-02-03 → 2
- `dim_product`: 501 → 10, 502 → 11, 503 → 12, 504 → 13
- `dim_seller`: 201 → 20, 202 → 21, 203 → 22

Completed orders are 3001, 3002, 3004.

Resulting `fact_sales` rows:
| fact_sales_id | date_key | product_key | seller_key | order_id | quantity | unit_price | line_revenue |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 10 | 20 | 3001 | 1 | 120.00 | 120.00 |
| 2 | 1 | 11 | 21 | 3001 | 2 | 30.00 | 60.00 |
| 3 | 1 | 12 | 20 | 3002 | 1 | 75.00 | 75.00 |
| 4 | 2 | 10 | 20 | 3004 | 1 | 115.00 | 115.00 |
| 5 | 2 | 13 | 22 | 3004 | 3 | 20.00 | 60.00 |

## A6 — Lake vs warehouse
- Lake (bronze/silver): raw `orders_raw`, `order_items_raw`, `products_raw`, `sellers_raw`, including historical changes and late arrivals for audit and replay.
- Warehouse (gold): `dim_date`, `dim_product`, `dim_seller`, and `fact_sales` with curated business logic.
- Reasons: the lake preserves raw lineage and flexible reprocessing, while the warehouse provides optimized analytics with stable schemas and surrogate keys.

## A7 — Engineering trade-off
Keeping all raw history in the lake increases storage cost but allows backfills, audits, and new use cases without re-extracting from source systems. Storing only curated warehouse tables reduces cost and complexity but limits flexibility and can hide upstream data quality issues.

## A8 — Grain failure
If `fact_sales` is at the order level:
- Category-level revenue becomes incorrect because multi-category orders cannot be split by product category. For order 3001, revenue would be lumped together and category-level analysis would be distorted.
- Units sold by product or seller are impossible because quantities per line item are lost; order 3004 contains two products from different sellers/categories.

---

## Common Pitfalls
- Defining the fact grain at order level and losing product detail.
- Assigning surrogate keys after loading facts, causing mismatched references.
- Forgetting to filter out cancelled orders.
- Treating product category as a fact attribute instead of a dimension attribute.

## Optional Extensions
- Add a `dim_customer` and analyze repeat purchase rates by seller.
- Introduce product price changes and design a slowly changing dimension strategy.
- Add a returns dataset and design a negative revenue adjustment process.
