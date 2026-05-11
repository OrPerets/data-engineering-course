\set ON_ERROR_STOP on

\ir 01_source_sales.sql
\ir 02_staging_clean.sql
\ir 03_dwh_star_schema.sql
\ir 04_load_dimensions.sql
\ir 05_load_fact_sales.sql
\ir 06_demo_queries.sql

\echo 'Practice 4 simple ETL/DWH pipeline finished.'
