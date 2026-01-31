# PlantUML Diagrams Template — Week 01 Reference

This document defines the canonical styling, text conventions, flow patterns, and color palette for Data Engineering course diagrams. Use it as the reference when refining diagrams across all weeks.

---

## 1. Philosophy & Principles

- **No titles** — Diagrams stand on their own; no `title` directive
- **No icons/emojis** — Text only; keep it professional
- **Concise text** — Short labels; full ideas with minimal words
- **Mixed flow** — Combine top-down, left-right, up; avoid pure linear layouts
- **Generous spacing** — Clear separation between elements

---

## 2. Global Styling (skinparam)

### 2.1 Base Settings

```plantuml
skinparam defaultFontName "Segoe UI, Helvetica, sans-serif"
skinparam defaultFontSize 16
skinparam defaultFontColor #2C3E50
skinparam roundcorner 12
skinparam shadowing true
skinparam linetype ortho
skinparam handwritten false
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `defaultFontName` | Segoe UI, Helvetica, sans-serif | Readable sans-serif stack |
| `defaultFontSize` | 16 | Base font for node content |
| `defaultFontColor` | #2C3E50 | Dark gray text |
| `roundcorner` | 12 | Rounded box corners |
| `shadowing` | true | Subtle depth |
| `linetype` | ortho | Orthogonal (90°) arrows |
| `handwritten` | false | Clean, not sketchy |

### 2.2 Spacing

```plantuml
skinparam nodesep 50
skinparam ranksep 65
```

| Parameter | Typical Range | Purpose |
|-----------|---------------|---------|
| `nodesep` | 50–70 | Horizontal gap between nodes |
| `ranksep` | 65–85 | Vertical gap between ranks |

Use **larger values** for busy diagrams; **smaller** for simple flows.

### 2.3 Arrow Styling

```plantuml
skinparam arrow {
    Thickness 2.5
    FontSize 12
    FontColor #546E7A
    FontStyle italic
    Color #607D8B
}
```

- **Thickness**: 2–4 (use 4 for emphasis, e.g. failure paths)
- **Font**: italic for labels; size 11–13

---

## 3. Element Styles

### 3.1 Generic Box Types

| Element | Background | Border | Usage |
|---------|------------|--------|-------|
| `rectangle` | #F8F9FA | #90A4AE, 2px | Generic container |
| `component` | #FFFFFF | #78909C, 1.5px | Process, pipeline step |
| `database` | #ECEFF1 | #546E7A, 1.5px | Storage, DB, warehouse |
| `storage` | — | — | File/object storage (like S3) |
| `cloud` | — | — | External/service boundary |
| `card` | varies | 2.5px | Concept cards, 4V's, DIKW |

### 3.2 Semantic Stereotypes

Use `<<stereotype>>` for semantic coloring:

| Stereotype | Background | Border | Usage |
|------------|------------|--------|-------|
| `<<success>>` | #E8F5E9 | #2E7D32 | Successful step |
| `<<failure>>` | #FFEBEE | #C62828 | Failed step |
| `<<up>>` | #E8F5E9 | #2E7D32 | Operational / healthy |
| `<<down>>` | #FFEBEE | #C62828 | Down / blocked |
| `<<Agent>>` | #E1F5FE | #0288D1 | Active agent/actor |
| `<<Tool>>` | #E8F5E9 | #2E7D32 | Processing tool |
| `<<UI>>` | #F3E5F5 | #8E24AA | User-facing component |
| `<<Config>>` | #FFF3E0 | #F57C00 | Configuration |

---

## 4. Color Palette

### 4.1 Primary Flow Colors

| Color Name | Hex | Usage |
|------------|-----|-------|
| Blue | #1976D2 / #0D47A1 / #1565C0 | Extract, ingest, read, batch |
| Purple | #7B1FA2 / #4A148C / #6A1B9A | Transform, processing, ETL |
| Green | #388E3C / #1B5E20 / #2E7D32 | Load, success, output, stream |
| Orange | #F57C00 / #E65100 | Ingestion, write, alert |
| Red | #C62828 / #B71C1C | Failure, crash, blocked |

### 4.2 Node Background Colors (by semantic role)

| Role | Background | Example |
|------|------------|---------|
| Sources / Input | #E3F2FD, #B3E5FC | Raw data, logs |
| Ingestion | #FFF9C4, #FFF59D | Extract step |
| Storage | #ECEFF1, #CFD8DC | Data lake, raw storage |
| Processing | #E1F5FE, #B3E5FC | Transform, aggregate |
| Consumption | #C8E6C9, #A5D6A7 | BI, ML |
| Concepts (Scale) | #FFCDD2 | 4V's — Scale |
| Concepts (Variety) | #FFE0B2 | 4V's — Variety |
| Concepts (Velocity) | #B3E5FC | 4V's — Velocity |
| Concepts (Reliability) | #C8E6C9 | 4V's — Reliability |
| Analytics layer | #F3E5F5, #E1BEE7 | Dashboards, reports |

---

## 5. Text Formatting

### 5.1 General Rules

- **Bold for titles**: `**Node Title**`
- **No icons/emojis** in labels
- **One `<size>` per line** — wrap each row separately

### 5.2 Size Tags (per row)

```plantuml
' WRONG — one size for multiple lines
storage "**Raw Data**\n<size:14>• Logs\n• DBs\n• Events</size>"

' CORRECT — each row gets its own size
storage "**Raw Data**\n\n<size:14>• Logs</size>\n<size:14>• DBs</size>\n<size:14>• Events</size>"
```

### 5.3 Size Guidelines

| Context | Size | Example |
|---------|------|---------|
| Node title | default (16) + bold | `**ETL Pipeline**` |
| Bullet list | 14 | `• Integration` |
| Dense / package content | 11–12 | `Read & validate` |
| Arrow labels | 12–13 | `**Extract**` |

### 5.4 Structure Pattern

```
**TITLE**

<size:14>• Bullet 1</size>
<size:14>• Bullet 2</size>
<size:14>• Bullet 3</size>
```

For single-line body: `"**Title**\n<size:12>Single line</size>"`

---

## 6. Flow & Layout

### 6.1 Direction Keywords

Use **directional arrows** to mix flow:

| Syntax | Direction | Example |
|--------|-----------|---------|
| `-down[...]->` | Top → Bottom | Main vertical flow |
| `-right[...]->` | Left → Right | Horizontal continuation |
| `-left[...]->` | Right → Left | Branch (e.g. failure) |
| `-up[...]->` | Bottom → Top | Feedback, return |
| `-[...]->` | Auto (by `direction`) | When using `left to right` or `top to bottom` |

### 6.2 Layout Patterns

**Simple pipeline (left → right):**
```plantuml
left to right direction
A -[#1976D2,thickness=3]-> B : <color:#0D47A1>label</color>
B -[#388E3C,thickness=3]-> C : <color:#1B5E20>label</color>
```

**Mixed flow (zigzag / branching):**
```plantuml
A -down[#1976D2,thickness=3]-> B
B -right[#1976D2,thickness=3]-> C
C -down[#388E3C,thickness=3]-> D
D -left[#C62828,thickness=4]-> E  ' failure branch
```

**Failure propagation:**
- Main flow: green (success) or blue (read)
- Failure path: red, `thickness=4`, `dashed` for blocked

### 6.3 Arrow Label Format

```plantuml
R -[#1976D2,thickness=3]-> E : <size:13><color:#0D47A1>**Extract**</color></size>
```

Or simpler (inherits arrow skinparam):
```plantuml
R -[#1976D2,thickness=3]-> E : <color:#0D47A1><b>Extract</b></color>
```

---

## 7. Diagram Types & When to Use

### 7.1 Simple Concept (card-based)

- **Use**: 4V's, DIKW pyramid, comparison cards
- **Elements**: `card`
- **Direction**: `left to right` or `top to bottom`; mix with `-down`, `-right`, `-up`
- **Example**: `week1_why_de_exists`, `week1_data_to_wisdom`

### 7.2 Linear Pipeline

- **Use**: BI context, data pipeline, what-is-DE
- **Elements**: `storage`, `component`, `database`, `cloud`
- **Direction**: `left to right`
- **Example**: `week1_bi_context`, `week1_what_is_de`, `week1_data_pipeline`

### 7.3 Detailed Pipeline (canonical template)

- **Use**: Lifecycle, ingestion, failure propagation
- **Elements**: `package`, `component`, `database`, stereotypes
- **Flow**: Mixed (down, right, left)
- **Example**: `week1_lecture_slide12_lifecycle`, `week1_lecture_slide20_ingestion`, `week1_lecture_slide35_failure`

### 7.4 Architecture (layered)

- **Use**: End-to-end system (e.g. news platform)
- **Elements**: `package` per layer, `database`, `component`, `cloud`
- **Flow**: down (sources→ingest), right (ingest→storage), down (storage→processing), etc.
- **Example**: `week1_practice_slide15_architecture`

---

## 8. Package Colors

For layered/architecture diagrams:

| Layer | Fill (top/bottom) | Example |
|-------|-------------------|---------|
| Sources | #E3F2FD / #B3E5FC | SOURCES |
| Ingestion | #FFF9C4 / #FFF59D | INGESTION |
| Storage | #ECEFF1 / #CFD8DC | STORAGE |
| Processing | #E1F5FE / #B3E5FC | PROCESSING |
| Analytics | #F3E5F5 / #E1BEE7 | ANALYTICS |
| Consumption | #C8E6C9 / #A5D6A7 | CONSUMPTION |

```plantuml
package "SOURCES" #E3F2FD/B3E5FC {
    storage "**Logs**\n<size:12>10M/day JSON</size>" as S1
}
```

---

## 9. Checklist for Refining a Diagram

1. [ ] Remove `title`
2. [ ] Remove all icons/emojis
3. [ ] Wrap each text row in its own `<size:X>...</size>`
4. [ ] Use mixed flow (`-down`, `-right`, `-left`, `-up`) where appropriate
5. [ ] Set `nodesep` 50–70, `ranksep` 65–85
6. [ ] Use palette colors for arrows and nodes
7. [ ] Keep labels concise

---

## 10. Quick Reference — Canonical Template Header

Copy this header for new detailed diagrams:

```plantuml
@startuml
'=================================================
' CANONICAL DIAGRAM TEMPLATE - DATA ENGINEERING
'=================================================

skinparam linetype ortho
skinparam shadowing true
skinparam roundcorner 12
skinparam handwritten false
skinparam nodesep 55
skinparam ranksep 70

skinparam defaultFontName "Segoe UI, Helvetica, sans-serif"
skinparam defaultFontSize 16
skinparam defaultFontColor #2C3E50

skinparam rectangle { BackgroundColor #F8F9FA BorderColor #90A4AE BorderThickness 2 FontColor #263238 FontSize 14 FontStyle bold Padding 20 }
skinparam component { BackgroundColor #FFFFFF BorderColor #78909C BorderThickness 1.5 FontSize 14 Padding 12 }
skinparam database { BackgroundColor #ECEFF1 BorderColor #546E7A BorderThickness 1.5 FontSize 14 FontColor #263238 }
skinparam arrow { Color #607D8B Thickness 2.5 FontSize 12 FontColor #546E7A FontStyle italic }
skinparam package { BorderThickness 2.5 FontSize 15 FontStyle bold }

' Stereotypes: <<success>> <<failure>> <<up>> <<down>> <<Agent>> <<Tool>> <<UI>>
' ... your diagram content ...

@enduml
```

---

## 11. Week 01 Diagram Inventory

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week1_bi_context` | Linear pipeline | storage, component, database, cloud | left→right |
| `week1_lecture_slide35_failure` | Failure propagation | component, database, stereotypes | mixed (down, left, right) |
| `week1_why_de_exists` | Concept cards | card | down, right |
| `week1_what_is_de` | Linear pipeline | storage, component, database | left→right |
| `week1_lifecycle_phases` | Linear pipeline | component, database, cloud | left→right |
| `week1_de_vs_ds` | Comparison | card | down, right, up |
| `week1_de_vs_analytics` | Comparison | card | down, right, up |
| `week1_data_to_wisdom` | Pyramid | card | top→bottom |
| `week1_data_pipeline` | Linear pipeline | storage, component, database | left→right |
| `week1_core_concepts_2` | Comparison | card, package | down (2→1) |
| `week1_lecture_slide12_lifecycle` | Layered pipeline | package, component, database | mixed |
| `week1_lecture_slide20_ingestion` | Step pipeline | storage, component, database | mixed zigzag |
| `week1_practice_slide15_architecture` | Layered architecture | package, database, component, cloud | mixed |

---

## 12. Week 02 Diagram Inventory (Distributed DB)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week2_lecture_slide13_system_overview` | System overview | component, database, rectangle | top→down |
| `week2_lecture_slide14_system_overview` | System overview | component, database, rectangle | top→down |
| `week2_lecture_slide24_query_flow` | Query flow | component, database | mixed |
| `week2_lecture_slide35_query_flow` | Query flow | component, database | mixed |
| `week2_lecture_slide42_failure_partition` | Failure / split-brain | rectangle, component, database, stereotypes | mixed |
| `week2_lecture_slide45_failure_partition` | Failure / split-brain | rectangle, component, database | mixed |
| `week2_practice_slide18_architecture` | Layered architecture | package, database, component | mixed |
| `week2_partition_replication_model` | Concept / model | rectangle, database | left→right |
| `week2_single_node_limits` | Concept cards | card | top→down |
| `week2_partitioning_key_based` | Pipeline | component, database | top→down |
| `week2_replication_read_write` | Read/write paths | component, database, stereotype <<up>> | left→right, down |
| `week2_cap_tradeoffs` | Concept cards | card | left→right, down |
| `week2_sql_vs_nosql` | Comparison | card | left→right, down |
| `week2_join_across_machines` | Data movement | database, component | left→right |
| `week2_2pc_blocking` | Failure propagation | component, database, stereotype <<down>> | top→down |

---

## 13. Week 03 Diagram Inventory (Parallelism)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week3_lecture_slide13_system_overview` | Parallel pipeline overview | database, component, rectangle | left→right |
| `week3_lecture_slide22_execution_flow` | Partition–group–merge | rectangle, component, database | left→right |
| `week3_lecture_slide38_failure_skew` | Failure: hot key / OOM | component, database, stereotypes | top→down |
| `week3_practice_slide18_skew_mitigation` | Skew mitigation (salting) | rectangle, component | left→right, down |
| `week3_divide_conquer` | Divide–Conquer–Combine | database, component, rectangle | left→right |
| `week3_parallelism_vs_concurrency` | Comparison | rectangle | left→right, down |
| `week3_work_span` | Work W, Span S, time bound | rectangle | top→down |
| `week3_local_aggregation` | Local aggregation before repartition | rectangle, component, database | left→right, down |
| `week3_straggler` | One slow worker delays job | component, rectangle, stereotypes | top→down |

---

## 14. Week 04 Diagram Inventory (ETL / Ingestion)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week4_lecture_slide13_pipeline_overview` | ETL pipeline overview | rectangle, component, database | left→right |
| `week4_lecture_bad_architecture` | Bad architecture (no staging/MERGE) | component, database | mixed |
| `week4_lecture_evolution_v1_v2` | v1 full refresh vs v2 incremental | rectangle, component, database | mixed |
| `week4_lecture_slide22_execution_flow` | Trigger to commit, watermark | component, database <<Config>> | right, down, up |
| `week4_lecture_slide38_failure_rerun` | Partial failure and idempotent rerun | component, database, stereotypes | mixed |
| `week4_practice_slide18_incremental_rerun` | Incremental rerun flow | component, database | mixed |
| `week4_etl_vs_elt` | ETL vs ELT comparison | rectangle, database | left→right |
| `week4_idempotency` | f(f(D))=f(D); rerun safe | rectangle | top→down |
| `week4_watermark_incremental` | Control table, watermark, slice | database, component <<Config>> | left→right, up |
| `week4_merge_vs_overwrite` | MERGE vs partition overwrite | rectangle | left→right, down |
| `week4_dlq_flow` | Valid to target, invalid to DLQ | database, component, stereotype <<down>> | left→right, down |

---

## 15. Week 05 Diagram Inventory (DWH / Data Lake)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week5_lecture_slide13_system_overview` | DWH and Lake in pipeline | rectangle, component, database | top→down |
| `week5_lecture_bad_architecture` | Bad: no partition filter, full scan | rectangle, component, database | mixed |
| `week5_lecture_evolution_v1_v2` | v1 single table vs v2 star + partitioned | rectangle, database, component | mixed |
| `week5_lecture_slide22_query_flow` | OLAP query path, partition pruning | rectangle, component, database | top→down |
| `week5_lecture_slide38_failure_partition` | Full scan vs pruned (failure) | package, component, database | mixed |
| `week5_practice_slide18_star_query_flow` | Star schema query path | component, database | top→down |
| `week5_star_schema` | Star schema: fact + dims (FK, partition) | database | top→down |
| `week5_dwh_vs_lake` | DWH vs Data Lake comparison | rectangle | left→right, down |
| `week5_partition_pruning_cost` | Full scan vs pruned scan cost | rectangle, database, stereotypes | left→right |
| `week5_schema_on_read_vs_write` | Schema-on-write vs schema-on-read | rectangle | left→right, down |
| `week5_dimension_hierarchy` | Time and product hierarchies (OLAP) | rectangle | top→down |
| `week5_star_vs_snowflake` | Star vs Snowflake schema | rectangle, database | left→right, down |
| `week5_inmon_characteristics` | Inmon DWH: four characteristics | rectangle | left→right |

---

## 16. Week 06 Diagram Inventory (MapReduce)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week6_lecture_slide17_system_overview` | MapReduce pipeline | rectangle, component, database | top→down |
| `week6_lecture_slide20_execution_flow` | Map–Shuffle–Reduce flow | rectangle, component, database | left→right |
| `week6_lecture_slide29_failure_skew` | Failure: hot key / skew | component, database, stereotypes | mixed |
| `week6_practice_slide18_skew_mitigation` | Skew mitigation (salting) | rectangle, component | mixed |
| `week6_shuffle_cost` | Shuffle cost C = E×s | rectangle, component, database | left→right |
| `week6_combiner_flow` | Combiner before shuffle | component, database | left→right |
| `week6_join_reduce_vs_broadcast` | Reduce-side vs broadcast join | database, component | left→right, down |

---

## 17. Week 07 Diagram Inventory (Advanced MapReduce)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week7_lecture_slide12_system_overview` | System overview | rectangle, component, database | mixed |
| `week7_lecture_slide19_example_shuffle` | Example shuffle | component, database | mixed |
| `week7_lecture_slide24_execution_flow` | Execution flow | rectangle, component, database | mixed |
| `week7_lecture_slide28_failure_skew` | Failure: skew | component, database, stereotypes | mixed |
| `week7_practice_slide18_skew_salting` | Skew salting flow | rectangle, component | mixed |
| `week7_salting_two_phase` | Two-phase salting | rectangle, component | left→right |
| `week7_join_decision` | Join algorithm decision | component | top→down |
| `week7_combiner_valid` | Combiner valid / trick / invalid | rectangle, component | left→right |

---

## 18. Week 10 Diagram Inventory (Streaming)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week10_lecture_slide13_system_overview` | Streaming pipeline | rectangle, component, database | top→down |
| `week10_lecture_slide18_window_example` | Window example (event-time) | rectangle | top→down |
| `week10_lecture_slide22_execution_flow` | Execution flow | rectangle, component, database | mixed |
| `week10_lecture_slide38_failure_late_data` | Failure: late data | component, database, stereotypes | mixed |
| `week10_practice_slide18_window_late_reasoning` | Window and late reasoning | rectangle, component | mixed |
| `week10_batch_vs_stream` | Batch vs stream | rectangle, component | left→right, down |
| `week10_streaming_constraints` | Streaming constraints | database, rectangle, component | top→down |
| `week10_epsilon_delta` | (ε,δ) approximation | component | top→down |
| `week10_morris_flow` | Morris counter flow | database, component | left→right |
| `week10_window_types` | Tumbling / sliding / session | rectangle, component | top→down |
| `week10_watermark_tradeoff` | Watermark aggressive vs conservative | component, rectangle | left→right, down |
| `week10_delivery_guarantees` | At-most / at-least / exactly-once | component | top→down |

---

## 19. Week 11 Diagram Inventory (Feature Engineering)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week11_lecture_slide08_feature_pipeline_overview` | Feature pipeline overview | rectangle, component, database | top→down |
| `week11_lecture_slide12_execution_flow` | Execution flow | rectangle, component, database | mixed |
| `week11_lecture_slide16_failure_leakage_rerun` | Failure: leakage and rerun | component, database, stereotypes | mixed |
| `week11_practice_slide20_reasoning_feature_flow` | Practice: reasoning feature flow | rectangle, component | mixed |
| `week11_point_in_time` | Point-in-time correctness | database, component | top→down |
| `week11_offline_vs_online` | Offline vs online | rectangle, component, database | left→right, down |
| `week11_key_merge` | Key and MERGE vs append | rectangle, component | left→right, down |
| `week11_leakage_vs_correct` | Leakage vs correct | rectangle, component | top→down |

---

## 20. Week 12 Diagram Inventory (Advanced Feature Engineering)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week12_lecture_slide09_advanced_pipeline_overview` | Advanced pipeline overview | rectangle, component, database | top→down |
| `week12_lecture_slide15_execution_flow` | Execution flow | rectangle, component, database | mixed |
| `week12_lecture_slide17_failure_backfill_skew` | Failure: backfill and skew | component, database, stereotypes | mixed |
| `week12_practice_slide22_backfill_reasoning` | Practice: backfill reasoning | rectangle, component | mixed |
| `week12_backfill_vs_incremental` | Backfill vs incremental | rectangle, component | left→right, down |
| `week12_pipeline_dag` | Pipeline DAG | database, rectangle, component | top→down |
| `week12_control_watermark` | Control table and watermark | database, component | left→right |
| `week12_full_grid_vs_observed` | Full grid vs observed pairs | rectangle, component | left→right, down |

---

## 21. Week 13 Diagram Inventory (DataOps)

| File | Type | Key Elements | Flow |
|------|------|--------------|------|
| `week13_lecture_slide12_dataops_pipeline_overview` | DataOps pipeline overview | rectangle, component, database | top→down |
| `week13_lecture_slide22_test_execution_flow` | Test execution flow | rectangle, component, database | mixed |
| `week13_lecture_slide38_failure_silent_regression` | Failure: silent regression | component, database, stereotypes | mixed |
| `week13_practice_slide20_quality_gate_flow` | Practice: quality gate flow | rectangle, component | mixed |
| `week13_dataops_definition` | DataOps: CI/CD, tests, monitoring | component | top→down |
| `week13_test_types` | Schema, row, freshness, volume tests | rectangle, component | top→down |
| `week13_quality_gate` | Quality gate: pass promote, fail block | component, rectangle | left→right, down |
| `week13_silent_regression_vs_gate` | No gate vs quality gate | rectangle, component | left→right, down |
