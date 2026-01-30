# Lecture & Diagram Quality — Task List

**Goals:**
1. Review each week's `lecture.md` + existing diagrams.
2. Add relevant diagrams to enrich the lecture (create `.puml` → render → reference in `lecture.md`).
3. Fix **empty-slide** issues for pandoc→pptx: slides that are only a title (e.g. `## Core Concepts (1/3)` or `## Data Pipeline` with only bullets below) — either **add a diagram** on that slide or **remove/merge the title** so no slide is title-only.
4. Work in sprints to keep each batch focused and reviewable.

---

## Empty-slide rule (pandoc → pptx)

- A slide that is **only** `## Some Title` with no image and no body text can render as an empty slide.
- **Fix:** For every such slide, either:
  - **Option A:** Add a diagram (create `.puml` in `diagrams/weekNN/`, render to PNG, add `![](path/to/diagram.png)` under the title in `lecture.md`), or
  - **Option B:** Remove the standalone title (merge into previous/next section or fold under a parent heading).

---

## Sprint 1 — Weeks 01–04 (Intro, Distributed DB, Parallelism, ETL)

### Week 01 — Introduction
- [x] Review `lectures/01-intro/lecture.md` and `diagrams/week01/`.
- [x] List all `##` headings that are title-only or title + bullets with no diagram.
- [x] For each empty-slide candidate: add a diagram (Option A) or remove/merge title (Option B).
  - Examples to fix: `## Core Concepts (1/3)`, `## Data Pipeline`, `## Business Intelligence Context`, `## Data Engineering vs Data Science`, etc.
- [x] Add new diagrams where they would enrich the narrative (e.g. pipeline flow, BI context, Data-to-Wisdom, DE vs DS).
- [x] Create `.puml` files, render PNGs, and add `![](...)` references in `lecture.md`.
- [x] Re-run pandoc to pptx and confirm no empty slides.

### Week 02 — Distributed DB
- [x] Review `lectures/02-distributed-db/lecture.md` and `diagrams/week02/`.
- [x] Identify title-only / empty-slide sections; fix with diagram or title merge.
- [x] Propose and add 1–3 new diagrams that clarify distributed DB concepts.
- [x] Create `.puml`, render, reference in `lecture.md`; verify pptx.

### Week 03 — Parallelism
- [x] Review `lectures/03-parallelism/lecture.md` and `diagrams/week03/`.
- [x] Fix empty slides (diagram or merge).
- [x] Add diagrams where they help (e.g. parallelism vs concurrency, execution flow).
- [x] Create `.puml`, render, reference; verify pptx.

### Week 04 — ETL / Ingestion
- [x] Review `lectures/04-etl-ingestion/lecture.md` and `diagrams/week04/`.
- [x] Fix empty slides (diagram or merge).
- [x] Enrich with diagrams (e.g. ETL flow, idempotency/rerun).
- [x] Create `.puml`, render, reference; verify pptx.

**Sprint 1 done when:** All weeks 01–04 reviewed, empty slides fixed, new diagrams added and referenced, pptx build clean. **Done.**

---

## Sprint 2 — Weeks 05–08 (DWH/Data Lake, MapReduce, Text/TF-IDF)

### Week 05 — DWH & Data Lake
- [ ] Review `lectures/05-dwh-datalake/lecture.md` and `diagrams/week05/`.
- [ ] Fix empty slides; add diagrams (e.g. DWH vs data lake, schema layers).
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 06 — MapReduce
- [ ] Review `lectures/06-mapreduce/lecture.md` and `diagrams/week06/`.
- [ ] Fix empty slides; add diagrams (map/reduce flow, shuffle, failure).
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 07 — MapReduce Advanced
- [ ] Review `lectures/07-mapreduce-advanced/lecture.md` and `diagrams/week7/`.
- [ ] Fix empty slides; add diagrams where they clarify advanced patterns.
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 08 — Text & TF-IDF
- [ ] Review `lectures/08-text-tfidf/lecture.md` and `diagrams/week8/`.
- [ ] Fix empty slides; add diagrams (text pipeline, TF-IDF flow).
- [ ] Create `.puml`, render, reference; verify pptx.

**Sprint 2 done when:** Weeks 05–08 reviewed, empty slides fixed, diagrams added and referenced, pptx build clean.

---

## Sprint 3 — Weeks 09–11 (Text Advanced, Streaming, Feature Engineering)

### Week 09 — Text Advanced
- [ ] Review `lectures/09-text-advanced/lecture.md` and `diagrams/week9/`.
- [ ] Fix empty slides; add diagrams to enrich advanced text topics.
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 10 — Streaming
- [ ] Review `lectures/10-streaming/lecture.md` and `diagrams/week10/`.
- [ ] Fix empty slides; add diagrams (streaming vs batch, windows, late data).
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 11 — Feature Engineering
- [ ] Review `lectures/11-feature-engineering/lecture.md` and `diagrams/week11/`.
- [ ] Fix empty slides; add diagrams (feature pipeline, leakage, rerun).
- [ ] Create `.puml`, render, reference; verify pptx.

**Sprint 3 done when:** Weeks 09–11 reviewed, empty slides fixed, diagrams added and referenced, pptx build clean.

---

## Sprint 4 — Weeks 12–14 (Feature Eng Advanced, DataOps, Review)

### Week 12 — Feature Engineering Advanced
- [ ] Review `lectures/12-feature-engineering-advanced/lecture.md` and `diagrams/week12/`.
- [ ] Fix empty slides; add diagrams where they help.
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 13 — DataOps
- [ ] Review `lectures/13-dataops/lecture.md` and `diagrams/week13/`.
- [ ] Fix empty slides; add diagrams (CI/CD for data, monitoring, versioning).
- [ ] Create `.puml`, render, reference; verify pptx.

### Week 14 — Review
- [ ] Review `lectures/14-review/lecture.md` and `diagrams/week14/`.
- [ ] Fix empty slides; add summary/recap diagrams if useful.
- [ ] Create `.puml`, render, reference; verify pptx.

**Sprint 4 done when:** Weeks 12–14 reviewed, empty slides fixed, diagrams added and referenced, pptx build clean.

---

## Checklist per week (copy when working)

- [ ] Read full `lecture.md` and list every `##` that could be an empty slide.
- [ ] For each: add diagram **or** remove/merge title.
- [ ] Decide 1–3 new diagrams that would enrich the lecture.
- [ ] Add `.puml` under `diagrams/weekNN/`, run render script, add `![](...)` in `lecture.md`.
- [ ] Run pandoc to pptx for that week and confirm no empty slides.
