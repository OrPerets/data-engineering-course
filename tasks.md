# Tasks: Global Algorithmic Rigor & Approximation Logic Refinement

**Reference example:** Use `lecture_example.pdf` as the structural and content-quality example for all refinements.

## Sprint 0: Baseline Scan & Scope Map
**Goal:** Build a precise map of where rigorous framing is required and validate scope.

**Todo**
- [ ] Inventory all `lectures/{WEEK_FOLDER}/lecture.md` files.
- [ ] For each lecture, mark slides touching scale, distribution, approximation, aggregation, or probabilistic reasoning.
- [ ] Record slide IDs/titles needing refinement.
- [ ] Confirm no changes to `practice.md` files.
- [ ] Prepare a per-lecture validation checklist stub.

---

## Sprint 1: Distributed Computation & MapReduce Rigor
**Goal:** Enforce formal framing and guarantees for distributed computation topics.

**Todo**
- [ ] Add **Problem Framing** for global aggregation costs.
- [ ] Formalize Map/Shuffle/Reduce model with notation.
- [ ] State associativity/commutativity conditions explicitly.
- [ ] Explain communication vs local computation trade-offs.
- [ ] Treat data skew as probabilistic imbalance; add mitigation.
- [ ] Ensure equations have interpretation + engineering implication.
- [ ] Keep ≤6 bullets per slide, ≤12 words per bullet.

---

## Sprint 2: TF‑IDF & Text Pipelines Rigor
**Goal:** Formalize vector-space model and justify approximation/compute costs.

**Todo**
- [ ] Define input documents, vocabulary, and TF‑IDF output.
- [ ] Formalize sparsity and dimensionality growth constraints.
- [ ] Contrast exact counts vs approximate statistics.
- [ ] Justify batch computation costs and latency trade-offs.
- [ ] Add guarantees/limits (e.g., sampling error, hash collisions).
- [ ] Keep math to ≤2 equations per slide with bullets.

---

## Sprint 3: Streaming & Real‑Time Processing Rigor
**Goal:** Enforce streaming model, approximation rationale, and guarantees.

**Todo**
- [ ] State streaming constraints: one pass, bounded memory.
- [ ] Add formal models for Morris counter and Flajolet–Martin.
- [ ] Provide expected value/error bounds and intuition.
- [ ] Contrast exact vs approximate feasibility.
- [ ] Add engineering interpretation: when errors are acceptable.
- [ ] Keep slides split if math-heavy.

---

## Sprint 4: ETL/ELT & Pipeline Correctness
**Goal:** Formalize pipeline stages and correctness semantics.

**Todo**
- [ ] Define pipeline stages and dataflow formally.
- [ ] Define idempotence and its implications.
- [ ] Contrast exactly-once vs at-least-once semantics.
- [ ] Tie failure recovery to correctness conditions.
- [ ] Add monitoring signals for correctness drift.

---

## Sprint 5: Feature Engineering at Scale
**Goal:** Add algorithmic framing to large-scale aggregations and leakage.

**Todo**
- [ ] Formalize aggregations over massive datasets.
- [ ] Introduce approximate statistics and error trade-offs.
- [ ] Define leakage as assumption violation.
- [ ] Add engineering implications and detection signals.

---

## Sprint 6: Validation & Consistency Pass
**Goal:** Enforce required logic pattern and slide constraints across all lectures.

**Todo**
- [ ] Confirm all refined topics follow canonical structure.
- [ ] Ensure every equation has interpretation + implication bullets.
- [ ] Validate slide bullet limits and word count.
- [ ] Recheck all lectures against the checklist.
- [ ] Ensure no changes to `practice.md`.
