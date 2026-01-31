# Topic 04 — ETL & Ingestion — Engineering Practice (Step-by-Step)

## Scenario
A retail platform collects customer data from a CRM, purchases from an Orders DB, and user interactions from a Web/App event stream.
Support tickets are captured in a separate system and sometimes arrive late due to retries.
You must design an ETL pipeline that lands raw data, applies explicit deduplication rules, and serves clean tables for analytics.
The pipeline runs daily and must be idempotent when re-run for the same day.

## Input Data
### Source tables

#### CRM: `crm_customer_updates` (mutable records)
Schema:
| column | type |
|---|---|
| customer_id | INT |
| full_name | VARCHAR |
| email | VARCHAR |
| tier | VARCHAR |
| updated_at | TIMESTAMP |

Sample data:
| customer_id | full_name | email | tier | updated_at |
|---:|---|---|---|---|
| 101 | Ava Patel | ava@ex.com | bronze | 2025-03-01 09:10 |
| 102 | Ben Ruiz | ben@ex.com | silver | 2025-03-01 10:00 |
| 101 | Ava Patel | ava.p@ex.com | silver | 2025-03-02 08:30 |
| 103 | Choi Lee | choi@ex.com | bronze | 2025-03-02 11:45 |
| 102 | Ben Ruiz | ben@ex.com | gold | 2025-03-03 09:20 |

#### Orders DB: `order_updates` (mutable records)
Schema:
| column | type |
|---|---|
| order_id | INT |
| customer_id | INT |
| order_total | DECIMAL(10,2) |
| status | VARCHAR |
| updated_at | TIMESTAMP |

Sample data:
| order_id | customer_id | order_total | status | updated_at |
|---:|---:|---:|---|---|
| 9001 | 101 | 45.00 | placed | 2025-03-02 09:05 |
| 9002 | 102 | 80.00 | placed | 2025-03-02 09:20 |
| 9001 | 101 | 45.00 | shipped | 2025-03-02 18:40 |
| 9003 | 103 | 25.00 | placed | 2025-03-03 08:10 |
| 9002 | 102 | 80.00 | cancelled | 2025-03-03 12:30 |

#### Web/App: `app_events` (append-only events)
Schema:
| column | type |
|---|---|
| event_id | INT |
| customer_id | INT |
| event_type | VARCHAR |
| event_ts | TIMESTAMP |

Sample data:
| event_id | customer_id | event_type | event_ts |
|---:|---:|---|---|
| 50001 | 101 | view_product | 2025-03-02 08:55 |
| 50002 | 101 | add_to_cart | 2025-03-02 09:00 |
| 50003 | 102 | view_product | 2025-03-02 09:05 |
| 50004 | 103 | checkout | 2025-03-03 08:05 |

#### Support: `ticket_events` (late-arriving data)
Schema:
| column | type |
|---|---|
| ticket_id | INT |
| customer_id | INT |
| status | VARCHAR |
| event_ts | TIMESTAMP |
| ingested_at | TIMESTAMP |

Sample data:
| ticket_id | customer_id | status | event_ts | ingested_at |
|---:|---:|---|---|---|
| 7001 | 101 | opened | 2025-03-02 07:30 | 2025-03-02 07:45 |
| 7001 | 101 | resolved | 2025-03-02 11:10 | 2025-03-03 09:00 |
| 7002 | 102 | opened | 2025-03-03 08:40 | 2025-03-03 08:55 |

### Assumptions & rules
- CRM and Orders records are mutable. Deduplicate by business key (`customer_id`, `order_id`) and keep the row with the latest `updated_at` (“latest wins”).
- App events are append-only and must never be overwritten.
- Ticket events can arrive late. Use `event_ts` for business ordering, but `ingested_at` controls when the pipeline sees the record.
- All ingested records are first stored in a raw landing area with no transformation.
- The pipeline is rerun daily and must be idempotent for the same run date.

## Target / Goal
- Produce a serving layer with:
  - `dim_customer_current`: one row per customer with latest attributes.
  - `fact_order_current`: one row per order with latest status and total.
  - `fact_app_events_daily`: one row per day and event type with event counts.
- Grain:
  - `dim_customer_current`: customer.
  - `fact_order_current`: order.
  - `fact_app_events_daily`: day + event_type.
- Guarantees:
  - Raw landing is append-only.
  - Serving layer is correct for the latest data available at run time.
  - Idempotent re-runs for the same date do not create duplicates.

## Questions (7, easy → hard)

### Q1 — Data understanding
For each source table, state the grain and identify the business key(s). Explain which tables are mutable vs append-only.

### Q2 — Design decision
Choose between two ingestion strategies for `crm_customer_updates`:
- Strategy A: overwrite the entire raw table each day with a snapshot.
- Strategy B: append all changes and deduplicate in transformation.
Pick one and justify with at least two trade-offs.

### Q3 — Transformation plan (step sequence)
Provide the ordered steps from ingestion to serving for all four sources. Include when deduplication happens and how idempotency is ensured.

### Q4 — Output schema
Define the explicit schema for `fact_order_current` as a markdown table.

### Q5 — Worked example on sample data
Using the sample input, show the resulting rows for `dim_customer_current` and `fact_order_current` after deduplication.

### Q6 — Failure / edge case
A late-arriving ticket event for `ticket_id = 7001` with `event_ts = 2025-03-02 12:30` arrives on `2025-03-04`. What breaks in the serving layer and how should it be handled?

### Q7 — Engineering trade-off
When should you overwrite vs append vs version your serving tables? Provide one concrete case for each and explain why.

---

# Step-by-Step Solutions

## A1 — Data understanding
- `crm_customer_updates` grain: one row per customer change. Business key: `customer_id`. Mutable because the same customer appears multiple times with different `updated_at`.
- `order_updates` grain: one row per order change. Business key: `order_id`. Mutable due to status updates and corrections.
- `app_events` grain: one row per event. Business key: `event_id`. Append-only because events are never changed.
- `ticket_events` grain: one row per ticket status event. Business key: (`ticket_id`, `event_ts`). Late-arriving because `ingested_at` can be later than `event_ts`.

## A2 — Design decision
Choose Strategy B (append changes + deduplicate in transformation).
- Trade-off 1: Storage cost increases because raw history is kept, but it supports replay/backfills and auditability.
- Trade-off 2: Transform complexity increases due to dedup logic, but it enables idempotent reruns and preserves CDC history.
- Strategy A is simpler but loses historical change data and complicates late-arrival handling.

## A3 — Transformation plan
1. Ingest all four sources into raw landing tables as append-only daily partitions by ingestion date.
2. Create cleaned staging tables:
   - For CRM: deduplicate by `customer_id` using latest `updated_at`.
   - For Orders: deduplicate by `order_id` using latest `updated_at`.
   - For App events: validate required fields; no dedup.
   - For Ticket events: keep all rows, but order by `event_ts` for downstream logic.
3. Build serving tables:
   - `dim_customer_current` from CRM staging (latest wins).
   - `fact_order_current` from Orders staging (latest wins).
   - `fact_app_events_daily` by counting events per day and `event_type`.
4. Idempotency strategy: write serving tables with deterministic merge/upsert by business keys, so re-running the same date replaces the same logical rows without duplicates.

## A4 — Output schema
`fact_order_current`:
| column | type |
|---|---|
| order_id | INT |
| customer_id | INT |
| order_total | DECIMAL(10,2) |
| status | VARCHAR |
| last_updated_at | TIMESTAMP |
| load_date | DATE |

## A5 — Worked example (explicit output rows)
`dim_customer_current` (latest by `updated_at`):
| customer_id | full_name | email | tier | last_updated_at |
|---:|---|---|---|---|
| 101 | Ava Patel | ava.p@ex.com | silver | 2025-03-02 08:30 |
| 102 | Ben Ruiz | ben@ex.com | gold | 2025-03-03 09:20 |
| 103 | Choi Lee | choi@ex.com | bronze | 2025-03-02 11:45 |

`fact_order_current` (latest by `updated_at`):
| order_id | customer_id | order_total | status | last_updated_at |
|---:|---:|---:|---|---|
| 9001 | 101 | 45.00 | shipped | 2025-03-02 18:40 |
| 9002 | 102 | 80.00 | cancelled | 2025-03-03 12:30 |
| 9003 | 103 | 25.00 | placed | 2025-03-03 08:10 |

## A6 — Failure handling
- Problem: the serving layer for ticket analytics would be incomplete because an event with `event_ts` on 2025-03-02 arrived after the 2025-03-03 run.
- Resolution strategy:
  - Use incremental backfill for a late-arrival window (for example, reprocess the last 3 days) and recompute any ticket-derived aggregates for those days.
  - Maintain `event_ts`-based partitions so the backfill can replace the affected partitions deterministically.

## A7 — Engineering trade-off
- Overwrite: use for `dim_customer_current` because only the latest record per customer is needed, and the table is small enough to rebuild daily.
- Append: use for raw `app_events` landing because events are immutable and historical replay is valuable.
- Versioning (slowly changing history): use for `order_updates` or CRM history when tracking change timelines is required for audits.

---

## Common Pitfalls
- Deduplicating CRM updates by ingestion time instead of `updated_at`.
- Mixing raw landing data with cleaned serving tables.
- Treating app events as mutable and overwriting history.
- Ignoring late-arriving ticket events and producing incorrect historical counts.

## Optional Extensions
- Add a customer deletion record and define how it propagates to `dim_customer_current`.
- Introduce schema drift in CRM (new column) and define how raw vs serving layers react.
- Build a daily SLA report comparing raw ingestion counts vs serving counts.
