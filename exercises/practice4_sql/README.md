# Practice 4 SQL: ETL and DWH

This folder contains two versions of the same teaching idea:

- `simple/` - the recommended classroom version. Use this first.
- the root SQL files - the fuller reference version with staging logs, deduplication, late returns, and more production-style ETL details.

## Recommended Classroom Version

Start with the simplified track:

```bash
createdb practice4_simple
psql -d practice4_simple -f exercises/practice4_sql/simple/00_run_all.sql
```

Teaching flow:

```text
simple_sources.raw_sales
  -> simple_staging.v_sales_clean
  -> simple_dwh.dim_date
  -> simple_dwh.dim_customer
  -> simple_dwh.dim_product
  -> simple_dwh.fact_sales
  -> analytics queries
```

This version uses one raw sales table, one staging view, three dimensions, one
fact table, and two demo queries. It is the best version for explaining the ETL
and star-schema process without losing students in table definitions.

## Simple Script Order

1. `simple/01_source_sales.sql` - one operational sales feed.
2. `simple/02_staging_clean.sql` - clean values and calculate revenue.
3. `simple/03_dwh_star_schema.sql` - create dimensions and fact table.
4. `simple/04_load_dimensions.sql` - load lookup/dimension rows.
5. `simple/05_load_fact_sales.sql` - load sales facts using dimension keys.
6. `simple/06_demo_queries.sql` - query the DWH model.

## What to Explain First

- A source table is how the business system stores events.
- Staging is where we clean and standardize data before loading the warehouse.
- Dimensions describe business entities: date, customer, product.
- The fact table stores measurable events: quantity, gross revenue, discount, net revenue.
- Analytics should read from the warehouse model, not directly from the raw source.

## Full Reference Version

Use the root SQL files after the simple version, or as a reference solution for
advanced discussion.

Run in a clean database:

```sql
\i exercises/practice4_sql/1-sources.sql
\i exercises/practice4_sql/2-staging.sql
\i exercises/practice4_sql/3-dwh.sql
\i exercises/practice4_sql/4-ETL_dims.sql
\i exercises/practice4_sql/5-ETL_fact.sql
\i exercises/practice4_sql/6-load_fact_sales.sql
\i exercises/practice4_sql/06_part_e_analytics_queries.sql
```

Full-version topics:

- multiple raw source tables: orders, order items, customers, returns.
- raw staging tables plus cleaned staging views.
- customer/channel/category standardization.
- latest-row selection with `ROW_NUMBER`.
- dimension upserts.
- fact-table loading with `MERGE`.
- late-return handling.
- analytical queries with window functions.

## Classroom Recommendation

Use `simple/` for the live explanation. Then show the full version as the
answer to: "What extra logic do real ETL pipelines need?"
