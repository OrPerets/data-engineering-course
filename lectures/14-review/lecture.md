# Week 14: Course Review and Exam Preparation

## Purpose
- Integrate all course modules into one engineering decision framework
- Rehearse exam-style reasoning across design, cost, and failures
- Prepare for end-to-end problem solving under constraints

## Learning Objectives
- Map questions to the right architecture pattern quickly
- Apply core formulas for cost, skew, and quality decisions
- Diagnose failure modes and choose concrete mitigations
- Justify trade-offs across batch, streaming, SQL/NoSQL, and features

## Big Picture: One System
- Ingest raw data reliably
- Transform with scalable compute
- Model for analytics/serving
- Enforce quality via DataOps controls

## Core Mental Model
- Every design is a trade-off between correctness, latency, and cost
- Failures are expected; recovery behavior is part of design
- Idempotency + observability are non-negotiable
- Constraints drive architecture choices

## Essential Pipeline Pattern
- Extract incrementally with watermark
- Stage, validate, and deduplicate
- Load with idempotent `MERGE`/overwrite
- Test and promote via quality gate

## Must-Know Formulas
$$
T_{total}=T_{extract}+T_{transform}+T_{load}
$$
$$
partition(k)=hash(k)\bmod R
$$
$$
idf=\log\frac{N}{df}
$$
- Use formulas to support design choices, not memorize in isolation

## Topic Map (Weeks 1-5)
- Foundations and constraints mindset
- Distributed DB trade-offs and partitioning
- Parallelism and work/shuffle intuition
- ETL reliability: watermark, dedup, idempotency
- DWH/lake modeling and partition pruning

## Topic Map (Weeks 6-10)
- MapReduce fundamentals and advanced skew handling
- Text pipelines: TF-IDF, n-grams, regex safety, embeddings
- Streaming: windows, event-time, watermarks, delivery semantics
- Approximation sketches for bounded-memory analytics

## Topic Map (Weeks 11-13)
- Feature engineering with point-in-time correctness
- Advanced feature DAGs, backfills, orchestration safety
- DataOps: test strategy, quality gates, observability

## Common Exam Task: Design an Incremental Load
- Use control watermark and safety bound
- Stage + dedup by business key
- Publish with idempotent writes
- Add tests before promote

## Common Exam Task: Trace MapReduce
- Show map output pairs
- Group by key in shuffle
- Reduce per key and note skew risk
- Suggest combiner/salting when needed

## Common Exam Task: DWH Query Reasoning
- Use star schema joins on dimensions
- Apply partition filter first
- Explain pruning impact on scan cost
- Identify risks of full scans

## Common Failure Modes (Cross-Course)
- Duplicate rows on rerun (missing idempotency)
- Hot-key skew causing OOM/stragglers
- Late data mishandling in streaming windows
- Silent regressions from missing tests

## Cross-Course Mitigation Patterns
- `MERGE` or partition overwrite
- Partition-aware modeling and filters
- Event-time + watermark policy
- Quality gate + incident-driven test hardening

## End-to-End Reasoning Template
- Clarify SLA + correctness requirements
- Choose architecture and keying strategy
- Estimate cost/bottlenecks with formulas
- Define failure handling + monitoring

## High-Value Trade-offs to Explain
- ETL vs ELT (governance vs flexibility)
- Batch vs streaming (latency vs complexity)
- SQL vs NoSQL (joins/transactions vs horizontal scale)
- Exact vs approximate (accuracy vs resource limits)

## Exam Readiness Checklist
- Can you explain idempotent ingestion end-to-end?
- Can you detect leakage and train/serve skew?
- Can you reason about shuffle cost and skew fixes?
- Can you design quality-gated deployment flow?

## Final Best Practices
- State assumptions explicitly in answers
- Show both design and failure behavior
- Use concise formulas + practical mitigations
- Prioritize reliability and observability in every design

## Recap
- The course is one connected reliability story
- Strong answers combine architecture, cost, and operations
- If you can reason from constraints to mitigations, you are ready
