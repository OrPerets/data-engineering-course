# Tasks: Global Algorithmic Rigor & Approximation Logic Refinement

**Reference example:** Use `lecture_example.pdf` as the structural and content-quality example for all refinements.

## Sprint 0: Baseline Scan & Scope Map
**Goal:** Build a precise map of where rigorous framing is required and validate scope.

**Todo**
- [x] Inventory all `lectures/{WEEK_FOLDER}/lecture.md` files.
- [x] For each lecture, mark slides touching scale, distribution, approximation, aggregation, or probabilistic reasoning.
- [x] Record slide IDs/titles needing refinement.
- [x] Confirm no changes to `practice.md` files.
- [x] Prepare a per-lecture validation checklist stub.


### Sprint 0 Output

**Inventory**
- lectures/01-intro/lecture.md
- lectures/02-distributed-db/lecture.md
- lectures/03-parallelism/lecture.md
- lectures/04-etl-ingestion/lecture.md
- lectures/05-dwh-datalake/lecture.md
- lectures/06-mapreduce/lecture.md
- lectures/07-mapreduce-advanced/lecture.md
- lectures/08-text-tfidf/lecture.md
- lectures/09-text-advanced/lecture.md
- lectures/10-streaming/lecture.md
- lectures/11-feature-engineering/lecture.md
- lectures/12-feature-engineering-advanced/lecture.md
- lectures/13-dataops/lecture.md
- lectures/14-review/lecture.md

**Slides touching scale/distribution/approximation/aggregation/probabilistic reasoning**
- **Week 1 (Intro):** Constraints, Not Definitions; Core Problem Statement; Formal Volume Model; The Scale Problem; The Velocity Problem; The Reliability Problem; Storage; Processing; ETL vs ELT (1/2); ETL vs ELT (2/2); Batch vs Streaming; Step 3: Aggregation; Aggregation Example; Cost & Scaling Analysis (1/3); Time Model; Scaling Time; Time Cost Formula; Cost & Scaling Analysis (2/3); Memory Model; Storage Cost; Storage Scaling; Cost & Scaling Analysis (3/3); Network Model; Network Cost; Throughput Limits.
- **Week 2 (Distributed DB):** Partition and Replication Trade-offs; Formal Partition and Replication Model; Guarantees — Why Systems Break (1/2); Guarantees — Why Systems Break (2/2); What Breaks at Scale (1/2); What Breaks at Scale (2/2); Storage Limits; Throughput Limits; Availability Limits; What "Distributed" Really Means; Multiple Machines; Partial Failures; Network Uncertainty; Distributed System Overview; Transactions at Scale; Aggregate Window Functions; Window Functions in Distributed Systems; Horizontal Partitioning; Key-Based Distribution; Replicas; Read/Write Paths; CAP Theorem; Cost & Scaling Analysis (1/3); Time Model; Cost & Scaling Analysis (2/3); Memory and Storage; Cost & Scaling Analysis (3/3); Network, Throughput, Latency; Common Pitfall: Hot Partitions.
- **Week 3 (Parallelism):** Divide-and-Conquer; Determinism and Scalability; Formal Work and Span; Shuffle and Coordination; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Memory and Storage; Cost & Scaling Analysis (3/3); Network and Throughput; Example: Work and Span; Shuffle Size and Network Cost; Reducer Memory and Skew Risk; Execution Flow: Map–Shuffle–Reduce; Shared State and Stragglers; Stragglers: Causes and Impact; Skew: Hot Key and Hot Partition; Skew Detection; Mitigation 1: Combiner; Mitigation 3: Custom Partitioner; Skew Mitigation Trade-offs.
- **Week 4 (ETL Ingestion):** Formal Pipeline Stages; Delivery Semantics and Duplicates; Option A — ETL; Option B — ELT; ETL vs ELT Comparison; ETL Pipelining Concept; Building Batch ETL Pipeline; Option A — MERGE (Upsert); Option B — Partition Overwrite; Storage and Partitioning; Incremental Load: Watermark; Watermark and Late-Arriving Data; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Cost Intuition: What Changes at 10× Scale; Cost Summary; Pitfalls: Partial Failure and Resume; Pitfalls: Duplicate Source Data; Pitfalls: Non-idempotent Write.
- **Week 5 (DWH & Data Lake):** Partition Pruning Cost Model; Partition Key; Pruning Cost; Hot Partition Problem; Cost of Naïve Design (DWH / Lake); Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Join Size and Cost Intuition; Pitfalls: Full Scan When Pruning Missed; Pitfalls: Hot Partition and Skew; Lake: Small-File and Compaction; DWH: Partition Key in Every Query; Cost Recap: Pruning vs Full Scan.
- **Week 6 (MapReduce):** Formal Map and Shuffle; Formal Reduce and Correctness; Data Skew Metric; Formal Model: Input and Output Types; Formal Model: Key and Partitioning; Execution Flow: Shuffle Phase; Execution Flow: Reduce Phase; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Shuffle Size Calculation; Reducer Memory and Skew; Failure: Hot Reducer (Skew); Combiner: When and Why; Custom Partitioner; MapReduce vs SQL Aggregation; Summary: Phases and Cost.
- **Week 7 (Advanced MapReduce):** Hot Key Problem; Shuffle Cost; Combiner Cost Impact; Salting Hot Keys; Shuffle Anatomy; Partitioner; Data Skew Definition; Guarantees and What Breaks; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Execution Flow — Map to Reduce; Failure Scenario — Hot Key to OOM; Skew Detection; Skew Mitigation — Salting (Concept); Salting Cost; Skew Mitigation — Combiner and Partitioner.
- **Week 8 (TF-IDF):** Data Distribution Issue; Storage vs Compute; Engineering Challenge; TF and IDF Definitions; TF-IDF Vector and Sparsity; Formal TF Definitions; Formal IDF Definition; TF-IDF Formula and Vector; Sparse vs Dense Storage; TF-IDF Pipeline Overview; MapReduce for TF-IDF — Job 1; MapReduce for TF-IDF — Job 2; MapReduce for TF-IDF — Job 3; MapReduce Execution Flow; Key Design: Shuffle and Partitioning; Job 1 Partitioning; Job 2 Partitioning; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Shuffle Size Example (TF-IDF).
- **Week 9 (Advanced Text):** Vocabulary and Shuffle at Scale; N-gram Size Model; Partition by N-gram for Count Job; Character N-grams; N-gram Vocabulary Size (1/2); N-gram Vocabulary Size (2/2); MapReduce for N-gram Extraction; Shuffle Size (N-gram Job); N-gram Skew.
- **Week 10 (Streaming):** Morris Counter (Approximate Counting); Flajolet–Martin Cardinality; HyperLogLog (Intuition); Count-Min Sketch (Frequency Estimation); In-Lecture Exercise 2: Tumbling Window Aggregate; Guarantees and What Breaks at Scale; Cost & Scaling Analysis (1/3); Cost — Latency Breakdown; Cost & Scaling Analysis (2/3); Cost — State Size (Formula); Cost & Scaling Analysis (3/3); Pitfalls — Duplicate Delivery and Hot Keys; Watermark Tuning; Consumer Lag and Backpressure; Reprocessing and Replay; Too Fast Watermark.
- **Week 11 (Feature Engineering):** Point-in-Time Correctness; What Breaks at Scale; Cost of Naïve Design (Feature Engineering); Train/Serve Skew; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 12 (Advanced Feature Engineering):** Backfill vs Incremental Cost; Hot Entity in Aggregation; Formal Model: Idempotent Write; Incremental; Backfill; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Quantitative Cost Comparison; Cost & Scaling Analysis (3/3).
- **Week 13 (DataOps):** Formal Quality Metrics; What Breaks at Scale; Cost of Naïve Design (DataOps); Full-Table Tests at Scale; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Control Table and Watermark.
- **Week 14 (Review):** Review: Pipeline Cost Model; Formal Formulas to Recall; Cost of Naïve Design — Course Summary; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).

**Slides needing refinement (by lecture)**
- **Week 1 (Intro):** Formal Volume Model; Step 3: Aggregation; Aggregation Example; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 2 (Distributed DB):** Formal Partition and Replication Model; Guarantees — Why Systems Break (1/2); Guarantees — Why Systems Break (2/2); CAP Theorem; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Common Pitfall: Hot Partitions.
- **Week 3 (Parallelism):** Formal Work and Span; Shuffle and Coordination; Shuffle Size and Network Cost; Reducer Memory and Skew Risk; Execution Flow: Map–Shuffle–Reduce; Skew: Hot Key and Hot Partition.
- **Week 4 (ETL Ingestion):** Formal Pipeline Stages; Delivery Semantics and Duplicates; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Watermark and Late-Arriving Data.
- **Week 5 (DWH & Data Lake):** Partition Pruning Cost Model; Pruning Cost; Hot Partition Problem; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Join Size and Cost Intuition.
- **Week 6 (MapReduce):** Formal Map and Shuffle; Formal Reduce and Correctness; Data Skew Metric; Formal Model: Key and Partitioning; Shuffle Size Calculation; Reducer Memory and Skew; Combiner: When and Why; Custom Partitioner.
- **Week 7 (Advanced MapReduce):** Shuffle Cost; Combiner Cost Impact; Salting Hot Keys; Data Skew Definition; Guarantees and What Breaks; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Salting Cost.
- **Week 8 (TF-IDF):** TF and IDF Definitions; TF-IDF Vector and Sparsity; Formal TF Definitions; Formal IDF Definition; TF-IDF Formula and Vector; Sparse vs Dense Storage; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3); Shuffle Size Example (TF-IDF).
- **Week 9 (Advanced Text):** Vocabulary and Shuffle at Scale; N-gram Size Model; N-gram Vocabulary Size (1/2); N-gram Vocabulary Size (2/2); Shuffle Size (N-gram Job); N-gram Skew.
- **Week 10 (Streaming):** Morris Counter (Approximate Counting); Flajolet–Martin Cardinality; Count-Min Sketch (Frequency Estimation); Guarantees and What Breaks at Scale; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 11 (Feature Engineering):** Point-in-Time Correctness; What Breaks at Scale; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 12 (Advanced Feature Engineering):** Backfill vs Incremental Cost; Hot Entity in Aggregation; Formal Model: Idempotent Write; Quantitative Cost Comparison; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 13 (DataOps):** Formal Quality Metrics; Full-Table Tests at Scale; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).
- **Week 14 (Review):** Review: Pipeline Cost Model; Formal Formulas to Recall; Cost & Scaling Analysis (1/3); Cost & Scaling Analysis (2/3); Cost & Scaling Analysis (3/3).

**Per-lecture validation checklist stubs**
- **Week 1 (Intro)**
  - [ ] Problem framing states scale/distribution constraints.
  - [ ] Formal model/equations have interpretation + engineering implication.
  - [ ] Aggregation step includes correctness/assumptions.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 2 (Distributed DB)**
  - [ ] Partition/replication assumptions explicit.
  - [ ] Guarantees and CAP trade-offs are formalized.
  - [ ] Cost/latency equations have implications.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 3 (Parallelism)**
  - [ ] Work/span/shuffle models defined.
  - [ ] Skew/straggler reasoning explicit.
  - [ ] Communication vs compute trade-offs stated.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 4 (ETL Ingestion)**
  - [ ] Pipeline stages/semantics formalized.
  - [ ] Idempotency and watermark assumptions stated.
  - [ ] Cost models have interpretation + implication.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 5 (DWH & Data Lake)**
  - [ ] Pruning/partition models stated.
  - [ ] Join/scan cost equations interpreted.
  - [ ] Skew/partition hot spots addressed.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 6 (MapReduce)**
  - [ ] Map/Shuffle/Reduce formal model consistent.
  - [ ] Associativity/commutativity assumptions explicit.
  - [ ] Skew and combiner limits stated.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 7 (Advanced MapReduce)**
  - [ ] Hot key mitigation has probabilistic framing.
  - [ ] Shuffle and salting costs quantified.
  - [ ] Guarantees and breakpoints stated.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 8 (TF-IDF)**
  - [ ] TF/IDF formal definitions and outputs clear.
  - [ ] Sparsity/scale constraints stated.
  - [ ] Approximation limits noted (if used).
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 9 (Advanced Text)**
  - [ ] Vocabulary growth model defined.
  - [ ] Shuffle cost and skew reasoning explicit.
  - [ ] Approximation/limits stated when applicable.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 10 (Streaming)**
  - [ ] Streaming constraints (one pass, bounded memory) stated.
  - [ ] Approximate models include error bounds.
  - [ ] Exact vs approximate trade-offs explained.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 11 (Feature Engineering)**
  - [ ] Point-in-time correctness formalized.
  - [ ] Scale-driven aggregation constraints stated.
  - [ ] Leakage assumptions explicit.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 12 (Advanced Feature Engineering)**
  - [ ] Backfill vs incremental model/assumptions stated.
  - [ ] Hot entity aggregation mitigation noted.
  - [ ] Cost comparisons interpreted.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 13 (DataOps)**
  - [ ] Quality metrics formalized.
  - [ ] Scaling limits for tests stated.
  - [ ] Control table/watermark assumptions explicit.
  - [ ] Slide bullets ≤6 and ≤12 words.
- **Week 14 (Review)**
  - [ ] Key formulas rechecked for interpretation.
  - [ ] End-to-end cost model consistent.
  - [ ] Slide bullets ≤6 and ≤12 words.

---

## Sprint 1: Distributed Computation & MapReduce Rigor
**Goal:** Enforce formal framing and guarantees for distributed computation topics.

**Todo**
- [x] Add **Problem Framing** for global aggregation costs.
- [x] Formalize Map/Shuffle/Reduce model with notation.
- [x] State associativity/commutativity conditions explicitly.
- [x] Explain communication vs local computation trade-offs.
- [x] Treat data skew as probabilistic imbalance; add mitigation.
- [x] Ensure equations have interpretation + engineering implication.
- [x] Keep ≤6 bullets per slide, ≤12 words per bullet.

---

## Sprint 2: TF‑IDF & Text Pipelines Rigor
**Goal:** Formalize vector-space model and justify approximation/compute costs.

**Todo**
- [x] Define input documents, vocabulary, and TF‑IDF output.
- [x] Formalize sparsity and dimensionality growth constraints.
- [x] Contrast exact counts vs approximate statistics.
- [x] Justify batch computation costs and latency trade-offs.
- [x] Add guarantees/limits (e.g., sampling error, hash collisions).
- [x] Keep math to ≤2 equations per slide with bullets.

---

## Sprint 3: Streaming & Real‑Time Processing Rigor
**Goal:** Enforce streaming model, approximation rationale, and guarantees.

**Todo**
- [x] State streaming constraints: one pass, bounded memory.
- [x] Add formal models for Morris counter and Flajolet–Martin.
- [x] Provide expected value/error bounds and intuition.
- [x] Contrast exact vs approximate feasibility.
- [x] Add engineering interpretation: when errors are acceptable.
- [x] Keep slides split if math-heavy.

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
