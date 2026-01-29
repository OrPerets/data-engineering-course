# Build Week 1: Introduction to Data Engineering

### (lecture.md + practice.md)

You are an expert **engineering-level Data Engineering course content developer**.

This is a **university engineering course**, not a tools overview.
For the full course philosophy, standards, and **practice guidelines**, see `README.md`.

You are writing **engineering artifacts that happen to become slides**.

---

## 📁 Context & Repository Rules (MANDATORY)

* Legacy materials are located under `sources/`
  **Reference only** — do NOT edit, do NOT treat as authoritative.
  They are used only to preserve coverage and reuse good examples.

* Canonical course content must be written in **Markdown only** under:
  * `lectures/01-intro/lecture.md`
  * `lectures/01-intro/practice.md`

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

## 📏 Expected Size (Guideline)

* `lecture.md`: **~40–70 slides**
* `practice.md`: **~25–40 slides**

Fewer slides usually indicates insufficient depth.

---

## 🧠 Your Task

Create **perfect, ready-to-teach, slide-ready Markdown** for:

1. `lectures/01-intro/lecture.md`
2. `lectures/01-intro/practice.md`

The result must be:

* Engineering-level
* Calculation-oriented
* Self-contained
* Rich with diagrams, tables, and walkthroughs
* Directly convertible to slides **without manual cleanup**

---

## 🔄 Mandatory Workflow (DO NOT SKIP)

### 1️⃣ Scan existing sources

* Search `sources/` for anything relevant to `Introduction to Data Engineering`.
* Extract and reorganize:
  * definitions
  * examples
  * tables
  * diagrams (re-express as PlantUML)

Add to `lecture.md`:
* `## Sources Used (Reference Only)`
  - include file names only

---

### 2️⃣ Gap analysis

* Compare legacy material with what a **strong engineering lecture** must include.
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

```

week1_{lecture|practice}*slide{SLIDE_NO}*{short_description}.puml

```

Examples:
* `week02_lecture_slide07_partitioning_flow.puml`
* `week05_practice_slide04_star_schema_query_flow.puml`

Rules:
* `{SLIDE_NO}` matches slide order of appearance
* `short_description` is lowercase, no spaces

---

### 🔗 Referencing Diagrams in Markdown

If a slide uses a diagram, it MUST include:

```

* Diagram: week1*lecture_slide{SLIDE_NO}*...

````

The diagram file MUST exist.

---

## 🧭 Diagram Checklist per Lecture (HARD GATE)

Each **lecture** MUST include **at least**:

1. **System / Pipeline Overview Diagram**
   - Components + data movement

2. **Execution / Request Flow Diagram**
   - Query, job, or task execution path

3. **Failure or Edge-Case Diagram**
   - What breaks
   - How failure propagates

Each **practice** MUST include **at least 1 reasoning-support diagram**.

Missing any required diagram ⇒ output INVALID.

---

## 🧠 Worked Example Rule (MANDATORY)

Every lecture MUST include:

* At least **1 worked example** spanning **≥4 slides**
* The example must:
  - start from concrete data
  - apply steps explicitly
  - include at least one diagram
  - end with an engineering conclusion or trade-off

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

## 📐 Slide-Ready Markdown Rules (STRICT)

### Headings

* `#` → title slide
* `##` → exactly one slide

---

### Per-slide limits

* One idea only
* Max **6 bullets**
* Max **12 words per bullet**
* No paragraphs

Multiple slides per concept REQUIRED when needed.

---

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

---

### Forbidden

❌ Prose paragraphs  
❌ Textbook exposition  
❌ Multi-topic slides  
❌ Inline ASCII diagrams instead of PlantUML  

---

## 📄 `lecture.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 1: Introduction to Data Engineering

## Purpose
- Why this topic matters in data engineering

## Learning Objectives
- 6–10 measurable objectives

## Sources Used (Reference Only)
- sources/...

## Core Concepts (1/2)
- Definitions
- Formal models

## Core Concepts (2/2)
- Guarantees
- What breaks at scale

## Running Example — Data & Goal
- Concrete dataset
- Engineering objective

## Running Example — Step-by-Step (1/4)
- Step 1
- Diagram: week1_lecture_slideXX_...

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
````

---

## 🧪 `practice.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 1: Introduction to Data Engineering — Practice

## Instructions
- Engineering course
- Show reasoning and calculations

## Data Context (MANDATORY)
- Tables / streams / files
- Columns and meanings
- Keys / partitions
- Approx sizes
- Access patterns

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

* `lectures/01-intro/lecture.md`
* `lectures/01-intro/practice.md`

AND create all required `.puml` files under `diagrams/`.

Do NOT output explanations, commentary, or meta text.

---

## 🧠 Final Reminder

You are building an **engineering course**.
If it feels easy, shallow, or tool-centric — it is WRONG.

```
