
# Build Week 2: Distributed Databases — SQL, NoSQL & CAP Intuition

### (lecture.md + practice.md)

You are an expert **engineering-level Data Engineering course content developer**.

This is **Week 2** of the course and establishes the **distributed-systems mindset** required for all later topics.

This is a **university engineering course**, not a tools overview.
You **must** follow the course standards defined in `README.md`, especially the **Practice Guidelines** section.

---

## 📁 Context & Repository Rules (MANDATORY)

* Legacy materials are located under `sources/`
  **Reference only** — do NOT edit.
  For Week 2 lecture, they are **authoritative for coverage**.

* Canonical course content must be written in **Markdown only** under:

  * `lectures/02-distributed-db/lecture.md`
  * `lectures/02-distributed-db/practice.md`

* Markdown files are the **single source of truth**.
  Slides are generated automatically from them (Pandoc / Marp).

---

## 🧠 Your Task

Create **perfect, ready-to-teach, slide-ready Markdown** for:

1. `lectures/02-distributed-db/lecture.md`
2. `lectures/02-distributed-db/practice.md`

The result must be:

* Engineering-level
* Distributed-systems oriented
* Calculation-aware
* Self-contained
* Directly convertible to slides **without manual cleanup**

---

## 🔄 Mandatory Workflow (DO NOT SKIP)

### 0️⃣ Mandatory Week 2 legacy coverage (CRITICAL)

For Week 2, you MUST reconstruct and reorganize the lecture using **existing materials** under:

* `sources/` related to:

  * Distributed databases
  * SQL vs NoSQL
  * Scalability / availability
  * CAP or consistency trade-offs

**Rule:**
If the final `lecture.md` is missing major topics that appear in legacy sources, the output is **incorrect**.

You must add to `lecture.md`:

* `## Sources Used (Reference Only)`
* `## Coverage Checklist (Legacy)`

---

### 1️⃣ Scan existing sources

* Search `sources/` for anything related to:

  * Distributed DB concepts
  * NoSQL motivation
  * Scalability limits of relational databases

* Extract:

  * definitions
  * diagrams (describe textually)
  * comparison tables
  * example schemas or access patterns

---

### 2️⃣ Gap analysis (CRITICAL FOR WEEK 2)

Assume students:

* Know **basic SQL**
* Do NOT yet understand **distributed constraints**

Ensure the lecture:

* Does NOT teach specific DB products
* DOES explain:

  * why distribution breaks assumptions
  * why SQL semantics become expensive
  * why NoSQL exists at all

Add missing:

* replication intuition
* partitioning intuition
* consistency trade-offs

---

### 3️⃣ Write canonical Markdown (lecture)

* Week 2 lecture must be **conceptual but engineering-driven**
* Avoid marketing language (“scales infinitely”, “cloud-native”)
* Focus on:

  * constraints
  * trade-offs
  * impossibility results (informal)

---

### 3️⃣.5 Distributed-systems depth enforcement (MANDATORY)

Week 2 lecture MUST include:

* At least **2 numeric scalability examples**
  (e.g., nodes, partitions, replicas, latency)
* At least **1 failure scenario**
  (network partition, replica lag, split-brain)
* At least **1 SQL vs NoSQL trade-off** explained quantitatively
* At least **1 CAP-style trade-off** using a concrete scenario

If any are missing, the lecture is **incomplete**.

---

### 4️⃣ Engineering exercises (MANDATORY)

You **must** read and follow the **Practice Guidelines in `README.md`**.

For **Week 2 specifically**:

Practice must focus on **reasoning**, not syntax.

Exercises must involve:

* choosing between SQL / NoSQL
* partitioning decisions
* replication trade-offs
* reasoning about consistency, availability, latency

Include:

* 3 warm-up exercises (conceptual but precise)
* 3 engineering exercises (design + calculations)
* 1 multi-part challenge (architecture-level reasoning)

---

## 📐 Slide-Ready Markdown Rules (STRICT)

Apply to **both** files.

* `#` → title slide
* `##` → exactly **one slide**

Per slide:

* One idea only
* Max 6 bullets
* Max 12 words per bullet
* ❌ No long paragraphs

---

## 📄 `lecture.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 2: Distributed Databases — SQL, NoSQL & CAP

## Purpose
- Why databases must be distributed
- Why distribution changes everything

## Learning Objectives
- 5–8 measurable objectives

## Sources Used (Reference Only)
- sources/...

## Coverage Checklist (Legacy)
- [ ] Distributed DB motivation
- [ ] SQL scalability limits
- [ ] NoSQL motivation
- [ ] Consistency trade-offs

## Why Single-Node Databases Break
- Storage limits
- Throughput limits
- Availability limits

## What “Distributed” Really Means
- Multiple machines
- Partial failures
- Network uncertainty

## SQL in a Distributed World
- Joins across machines
- Transactions at scale
- Cost explosion

## Why NoSQL Exists
- Relaxed guarantees
- Simplified access patterns
- Predictable scaling

## Visual Comparison: SQL vs NoSQL
- MUST include a comparison table

## Partitioning Intuition
- Horizontal partitioning
- Key-based distribution

## Replication Intuition
- Replicas
- Read/write paths

## CAP Intuition (Engineering View)
- Concrete scenario
- Trade-offs explained

## Failure Scenarios
- Network partition
- Replica lag
- Node failure

## Best Practices (Week 2)
- Distributed design mindset

## Recap
- 5 key takeaways

## Pointers to Practice
- What students should now reason about
```

📊 **Lecture visual requirements (MANDATORY)**

* At least **2** diagrams (partitioning, replication, request flow)
* At least **1** comparison table (SQL vs NoSQL)
* At least **1** failure scenario slide

---

## 🧪 `practice.md` — REQUIRED STRUCTURE (EXACT ORDER)

```md
# Week 2: Distributed Databases — Practice

## Instructions
- Engineering course
- Show reasoning and calculations

## Warm-up Exercises
- Conceptual but precise
- Each exercise on its own slide

## Engineering Exercises
- Design-oriented
- Include numeric assumptions
- Reason about trade-offs

## Challenge Exercise
- Multi-part system design
- Partitioning + replication + consistency

## Solutions
- Each solution on its own slide
- Step-by-step reasoning
- Clear assumptions
```

---

## 🧮 Engineering Content Requirements (WEEK 2–SPECIFIC)

Must include:

* At least one **partition sizing calculation**
* At least one **replication factor trade-off**
* At least one **latency vs consistency discussion**
* At least one **failure-mode reasoning exercise**

---

## ✅ Deliverable

Write **only** the final content into:

* `lectures/02-distributed-db/lecture.md`
* `lectures/02-distributed-db/practice.md`

Do **not** output explanations, commentary, or meta text.

---

## 🧠 Final Reminder (IMPORTANT)

If:

* you skip legacy topics
* you reduce this to a product overview
* you avoid failure scenarios
* you omit quantitative reasoning

then the output is **incorrect**.

You are writing **engineering artifacts that happen to become slides**.
