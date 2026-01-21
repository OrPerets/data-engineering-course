# Build Week {WEEK_NO}: {TOPIC}

### (lecture.md + practice.md)

You are an expert **engineering-level Data Engineering course content developer**.

This is a **university engineering course**, not a tools overview.
For the full course philosophy, standards, and **practice guidelines**, see `README.md`.

---

## 📁 Context & Repository Rules (MANDATORY)

* Legacy materials are located under `sources/`
  **Reference only** — do NOT edit, do NOT treat as authoritative.

* Canonical course content must be written in **Markdown only** under:

  * `lectures/{WEEK_FOLDER}/lecture.md`
  * `lectures/{WEEK_FOLDER}/practice.md`

* Markdown files are the **single source of truth**.
  Slides are generated automatically from them (Pandoc / Marp).

* The course must combine:
  **formal theory + engineering calculations + practical workflow reasoning**

---

## 🧠 Your Task

Create **perfect, ready-to-teach, slide-ready Markdown** for:

1. `lectures/{WEEK_FOLDER}/lecture.md`
2. `lectures/{WEEK_FOLDER}/practice.md`

The result must be:

* Engineering-level
* Calculation-oriented
* Self-contained
* Directly convertible to slides **without manual cleanup**

---

## 🔄 Mandatory Workflow (DO NOT SKIP)

### 1️⃣ Scan existing sources

* Search `sources/` for anything relevant to `{TOPIC}`.
* Extract:

  * definitions
  * examples
  * diagrams (describe them textually)
  * useful structure
* Add a **“Sources Used (Reference Only)”** section in `lecture.md`
  (file names only).

---

### 2️⃣ Gap analysis

* Compare what exists in `sources/` with what a **strong engineering lecture**
  on `{TOPIC}` must include.
* Add missing theory, calculations, trade-offs, and reasoning.
* Do NOT assume material exists elsewhere.

---

### 3️⃣ Write canonical Markdown

* Use a **clear, consistent structure**
* Avoid tool marketing and buzzwords
* Focus on:

  * models
  * costs
  * limits
  * trade-offs
* Use **realistic data-engineering scenarios**

---

### 4️⃣ Engineering exercises (MANDATORY)

* **Read and follow the practice guidelines defined in `README.md`.**
* Exercises must require **calculations and reasoning**, not prose.
* Provide **full solutions** in `practice.md`
  (step-by-step, with calculations).

---

### 5️⃣ Slide-ready formatting (CRITICAL)

Markdown must be written so it can be converted directly to slides.

---

## 📐 Slide-Ready Markdown Rules (STRICT)

These rules apply to **both** `lecture.md` and `practice.md`.

### Headings

* `#` → title slide (one per file)
* `##` → exactly **one slide**

---

### Per-slide limits

* **One idea only** per `##`
* Max **6 bullets**
* Max **12 words per bullet**
* ❌ No long paragraphs

---

### Content style

* Prefer:

  * bullets
  * tables
  * formulas
  * pseudocode
* Code blocks:

  * max ~12 lines
  * split across slides if longer
* Math:

  * LaTeX only
  * max 1–2 equations per slide

---

### Large topics

* Split into multiple slides:

  * `## Topic (1/3)`
  * `## Topic (2/3)`

---

### Forbidden

* ❌ Prose paragraphs
* ❌ “Explain in your own words”
* ❌ Textbook-style exposition
* ❌ Multi-topic slides

---

## 📄 `lecture.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week {WEEK_NO}: {TOPIC}

## Purpose
- Why this topic matters in data engineering

## Learning Objectives
- 5–8 measurable objectives

## Sources Used (Reference Only)
- sources/...

## Core Concepts
- Definitions
- Formal models
- Assumptions

## Running Example
- One coherent example
- Step-by-step transformations

## Cost & Scaling Analysis
- Quantitative models:
  - time
  - memory
  - network
  - partitions
  - throughput / latency

## Pitfalls & Failure Modes
- Common mistakes
- How to detect them

## Best Practices
- 8–12 concrete, actionable bullets

## Recap
- 5 bullets: what must be remembered

## Pointers to Practice
- What students must be able to solve
```

---

## 🧪 `practice.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week {WEEK_NO}: {TOPIC} — Practice

## Instructions
- Engineering course
- Show calculations and reasoning

## Data Context (if applicable)
- Describe tables / schemas / data assumptions
- Include column meanings and sizes if relevant

## Warm-up Exercises
- Each exercise on its own slide
- Questions only (no solutions)

## Engineering Exercises
- Each exercise on its own slide
- Require calculations and reasoning

## Challenge Exercise
- Multi-part problem
- Each part clearly separated

## Solutions
- **Each solution must be on a separate slide**
- Match solution order exactly to questions
- Full step-by-step reasoning
- Clear calculations
- Tables / math / pseudocode where needed
```

---

## 🧮 Engineering Content Requirements (NON-NEGOTIABLE)

Every week must include:

* At least **one quantitative cost model**
* At least **one calculation-based exercise**
* Explicit trade-off analysis

Examples (choose what fits `{TOPIC}`):

* shuffle/network cost
* data volume estimation
* partition sizing
* cardinality explosion
* latency vs throughput
* parallel speedup limits
* data skew impact

---

## 📌 Placeholders (ONLY if missing)

If you cannot infer these from the repo, use defaults and proceed:

* `{WEEK_NO}` — week number
* `{WEEK_FOLDER}` — folder name
* `{TOPIC}` — topic title
* `{COURSE_STYLE}` — default: concise, engineering-first
* `{TOOLS_ALLOWED}` — default: Python + SQL + pseudocode

---

## ✅ Deliverable

Write **only** the final content into:

* `lectures/{WEEK_FOLDER}/lecture.md`
* `lectures/{WEEK_FOLDER}/practice.md`

Do **not** output explanations, commentary, or meta text.

---

## 🧠 Remember

You are not writing slides.
You are writing **engineering artifacts that happen to become slides**.
