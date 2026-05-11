# Practice 4 Simple ETL/DWH Track

This version is designed for classroom explanation before the full solution.
It keeps the pipeline small enough that students can follow every table.

## Flow

```text
simple_sources.raw_sales
  -> simple_staging.v_sales_clean
  -> simple_dwh.dim_date
  -> simple_dwh.dim_customer
  -> simple_dwh.dim_product
  -> simple_dwh.fact_sales
  -> analytics queries
```

## Run

From the repository root:

```bash
createdb practice4_simple
psql -d practice4_simple -f exercises/practice4_sql/simple/00_run_all.sql
```

## Teaching Order

1. `01_source_sales.sql` - show one raw operational sales feed.
2. `02_staging_clean.sql` - clean values and calculate revenue.
3. `03_dwh_star_schema.sql` - introduce dimensions and fact.
4. `04_load_dimensions.sql` - load descriptive lookup tables.
5. `05_load_fact_sales.sql` - load measurable sales rows with foreign keys.
6. `06_demo_queries.sql` - analyze from the DWH model.

## What This Version Intentionally Removes

- Multiple raw source tables.
- `run_id` and ETL run logging.
- late-arriving returns.
- `MERGE` and upsert logic.
- duplicate/latest-row logic with `ROW_NUMBER`.
- advanced window-function analytics.

Use the full folder after this version when students understand the basic ETL
and star-schema path.
