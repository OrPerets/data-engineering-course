# Build Week 13: DataOps, Testing, and Data Quality

### (lecture.md + practice.md)

You are an expert **engineering-level Data Engineering course content developer**.

This is a **university engineering course**, not a tools overview.
For the full course philosophy, standards, and **practice guidelines**, see `README.md`.

You are writing **engineering artifacts that happen to become slides**.

---

## 📁 Context & Repository Rules (MANDATORY)

### Reference Materials (Read-Only)

* Legacy slides/materials are located under `sources/`
  **Reference only** — do NOT edit, do NOT treat as authoritative.
  They are used only to preserve coverage and reuse good examples.

* The repository root also includes:
  * `exercises1.md`
  * `exercises2.md`

These files contain **exercise patterns and examples across multiple topics**.
They are **reference only**:
- ✅ reuse structure, phrasing style, and exercise formats
- ✅ borrow ideas and adapt them to the current week
- ❌ do NOT copy verbatim large blocks
- ❌ do NOT edit these files

Add to `practice.md` a section:
- `## Reference Exercises Used (Root)`
  - list which exercises or themes you adapted (briefly)

---

### Canonical Outputs (Single Source of Truth)

* Canonical course content must be written in **Markdown only** under:
  * `lectures/13-dataops/lecture.md`
  * `lectures/13-dataops/practice.md`

* Diagrams MUST be written in **PlantUML** and stored under:
  * `diagrams/`

* The repository contains a canonical diagram template:
  * `diagrams/template.puml`

* Markdown files are the **single source of truth**.
  Slides are generated automatically from them (Pandoc / Marp).

* The course must combine:
  **formal theory + engineering calculations + practical workflow reasoning**

---

## 🧱 Depth & Density Contract (MANDATORY)

This course prioritizes **depth over brevity**.

Rules:

* A single concept MAY and SHOULD span multiple slides
  - Use `(1/3)`, `(2/3)`, `(3/3)` when needed
* Prefer decomposing explanations across slides instead of compressing them
* Every core concept must include:
  - intuition
  - formal framing
  - concrete example
  - cost or failure implication

**Thin, title-only output is INVALID.**

---

## 🚫 HARD GATE — No Empty Slides (CRITICAL)

Every `##` slide MUST contain at least one of:

- ≥3 bullets, OR
- a small table, OR
- a code/pseudocode block (≤12 lines), OR
- a diagram reference (`Diagram: ...`)

If any slide is title-only / empty → output INVALID.

---

## 📏 Expected Size (Guideline)

* `lecture.md`: **~40–70 slides**
* `practice.md`: **~25–40 slides**

Fewer slides usually indicates insufficient depth.

---

## 🧠 Your Task

Create **perfect, ready-to-teach, slide-ready Markdown** for:

1. `lectures/13-dataops/lecture.md`
2. `lectures/13-dataops/practice.md`

The result must be:

* Engineering-level
* Calculation-oriented
* Self-contained
* Rich with diagrams, tables, and walkthroughs
* Directly convertible to slides **without manual cleanup**

---

## 🔄 Mandatory Workflow (DO NOT SKIP)

### 1️⃣ Scan reference materials (sources + root exercise banks)

* Search `sources/` for anything relevant to `DataOps, Testing, and Data Quality`.
* Also scan root:
  * `exercises1.md`
  * `exercises2.md`

Extract and adapt:
* definitions
* examples
* tables
* diagram ideas (re-express as PlantUML)
* exercise formats and solution patterns

Add to `lecture.md`:
* `## Sources Used (Reference Only)`
  - include file names only

Add to `practice.md`:
* `## Reference Exercises Used (Root)`
  - mention adapted exercise themes or IDs/titles briefly

---

### 2️⃣ Gap analysis

* Compare reference material with what a **strong engineering lecture** must include.
* Add missing:
  * theory
  * calculations
  * trade-offs
  * failure reasoning

Do NOT assume material exists elsewhere.

---

## 🧩 Diagram Generation Rules (MANDATORY)

### Diagram Source & Template

All diagrams MUST:

* Be written in **PlantUML**
* Be based on `diagrams/template.puml`
* Be saved under `diagrams/`
* Represent **exactly one slide**

---

### 📁 Diagram Naming Convention (STRICT)

```text
week13_{lecture|practice}_slide{SLIDE_NO}_{short_description}.puml
````

Examples:

* `week02_lecture_slide07_partitioning_flow.puml`
* `week05_practice_slide04_star_schema_query_flow.puml`

Rules:

* `{SLIDE_NO}` matches slide order of appearance
* `short_description` is lowercase, no spaces

---

### 🔗 Referencing Diagrams in Markdown

If a slide uses a diagram, it MUST include:

* `Diagram: week13_lecture_slide{SLIDE_NO}_...`

The diagram file MUST exist.

---

## 🗺️ HARD GATE — Diagram Manifest (CRITICAL)

Both `lecture.md` and `practice.md` MUST include near the top:

`## Diagram Manifest`

For each diagram used:

* `Slide XX → filename.puml → purpose (1 line)`

Rules:

* Every `Diagram:` reference must appear in the manifest
* Every manifest entry must be referenced by exactly one slide
  Missing or inconsistent manifest → output INVALID.

---

## 🧭 Diagram Checklist per Lecture (HARD GATE)

Each **lecture** MUST include **at least**:

1. **System / Pipeline Overview Diagram**
2. **Execution / Request Flow Diagram**
3. **Failure or Edge-Case Diagram**

Each **practice** MUST include **at least 1 reasoning-support diagram**.

Missing any required diagram ⇒ output INVALID.

---

## 🧠 Worked Example Rule (MANDATORY)

Every lecture MUST include:

* At least **1 worked example** spanning **≥4 slides**
* The example must:

  * start from concrete data (schema + sample rows/events)
  * apply steps explicitly (SQL / transformation / MapReduce steps)
  * include at least one diagram
  * end with an engineering conclusion or trade-off

---

## 🧪 Practice Realism Requirement (CRITICAL)

Practices MUST start from **concrete artifacts**.

Depending on topic:

* SQL → tables, columns, sample rows, keys, sizes
* MapReduce → input records, emitted (k,v), shuffle groups
* Streaming → events, timestamps, windows
* ETL → raw vs processed schemas

Abstract exercises without concrete data context are INVALID.

---

## 🧪 HARD GATE — Practice Modes (MANDATORY)

Select the appropriate mode(s) based on `DataOps, Testing, and Data Quality` and enforce them.

### Mode A — SQL / ETL / ELT / Ingestion (If relevant)

Practice MUST include:

* 2–4 tables with keys + 6–12 sample rows total
* 2–3 SQL exercises + FULL SQL solutions
* At least one incremental-load exercise:

  * watermark (`last_loaded_at`) OR CDC
  * dedup / idempotency logic
* At least one failure/reprocessing scenario:

  * “job rerun” must not duplicate results

### Mode B — MapReduce (If relevant)

Practice MUST include:

* 8–12 input records
* One full manual walkthrough:

  * Map emits `(k,v)`
  * Shuffle groups
  * Reduce outputs
* Include one skew case + one mitigation:

  * combiner / custom partitioner / salting keys

### Mode C — DWH / OLAP (If relevant)

Practice MUST include:

* star schema (fact + ≥2 dimensions) + sample rows
* one query showing partition pruning or reduction
* one exercise: join size/cost reasoning

If a relevant mode is skipped → output INVALID.

---

## 📐 Slide-Ready Markdown Rules (STRICT)

### Headings

* `#` → title slide
* `##` → exactly one slide

### Per-slide limits

* One idea only
* Max **6 bullets**
* Max **12 words per bullet**
* No paragraphs

### Content style

Prefer:

* bullets
* tables
* formulas
* pseudocode
* step-by-step breakdowns

Code:

* ≤12 lines per slide

Math:

* LaTeX only
* ≤2 equations per slide

### Forbidden

❌ Prose paragraphs
❌ Textbook exposition
❌ Multi-topic slides
❌ Inline ASCII diagrams instead of PlantUML

---

## 📄 `lecture.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 13: DataOps, Testing, and Data Quality

## Purpose
- Why this topic matters in data engineering

## Learning Objectives
- 6–10 measurable objectives

## Sources Used (Reference Only)
- sources/...

## Diagram Manifest
- Slide XX → week13_lecture_slideXX_... → purpose

## Core Concepts (1/2)
- Definitions
- Formal models

## Core Concepts (2/2)
- Guarantees
- What breaks at scale

## Running Example — Data & Goal
- Schema + sample rows/events
- Engineering objective

## Running Example — Step-by-Step (1/4)
- Step 1
- Diagram: week13_lecture_slideXX_...

## Running Example — Step-by-Step (2/4)
- Step 2
- Diagram: ...

## Running Example — Step-by-Step (3/4)
- Step 3

## Running Example — Step-by-Step (4/4)
- Output
- Engineering interpretation

## Cost & Scaling Analysis (1/3)
- Time model

## Cost & Scaling Analysis (2/3)
- Memory / storage

## Cost & Scaling Analysis (3/3)
- Network / throughput / latency

## Pitfalls & Failure Modes (1/3)
- Common pitfall

## Pitfalls & Failure Modes (2/3)
- Failure scenario
- Diagram: ...

## Pitfalls & Failure Modes (3/3)
- Detection + mitigation

## Best Practices
- 8–12 concrete bullets

## Recap
- 5 must-remember takeaways

## Pointers to Practice
- What students must solve
```

---

## 🧪 `practice.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 13: DataOps, Testing, and Data Quality — Practice

## Instructions
- Engineering course
- Show reasoning and calculations

## Data Context (MANDATORY)
- Tables / streams / files
- Columns and meanings
- Keys / partitions
- Approx sizes
- Access patterns

## Reference Exercises Used (Root)
- exercises1.md: ...
- exercises2.md: ...

## Diagram Manifest
- Slide XX → week13_practice_slideXX_... → purpose

## Warm-up Exercises
- 3–5 exercises
- Each on its own slide

## Engineering Exercises
- 3–6 exercises
- Numeric assumptions
- Cost reasoning required

## Challenge Exercise
- Multi-part
- Architecture-level reasoning
- Diagram required

## Solutions
- Each solution on its own slide
- Match order exactly
- Step-by-step calculations
- Tables / math / pseudocode
- SQL solutions in fenced SQL blocks
```

---

## 🧮 Engineering Content Requirements (NON-NEGOTIABLE)

Each week MUST include:

* ≥1 quantitative cost model
* ≥1 calculation-based exercise
* Explicit trade-off analysis
* ≥1 failure or edge-case scenario

---

## ✅ Deliverable

Write **only** the final content into:

* `lectures/13-dataops/lecture.md`
* `lectures/13-dataops/practice.md`

AND create all required `.puml` files under `diagrams/`.

Do NOT output explanations, commentary, or meta text.

---

## 🧠 Final Reminder

You are building an **engineering course**.
If it feels easy, shallow, or tool-centric — it is WRONG.