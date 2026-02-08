# Week 10: Streaming Data and Approximation Algorithms

## Purpose
- Design real-time pipelines for unbounded event streams
- Use sketch/approximation methods when exact state is too expensive
- Balance accuracy, latency, and resource usage in production


---

## Learning Objectives
- Explain stream-processing constraints and window semantics
- Choose approximation algorithms for count/distinct/frequency queries
- Size sketch parameters from error requirements
- Build reliable event-time pipelines with watermarks and idempotent sinks


---

## Why This Lecture Matters
- Stream systems cannot rely on full-history scans
- Exact answers are often too costly in memory/time
- Approximation gives controlled error with strong efficiency gains
- Correctness depends on time semantics and replay safety


---

## Streaming Model
- Data arrives continuously and may be out of order
- Processing must be online (single pass)
- Memory is bounded relative to stream size
- Per-event update cost must stay low

![](../../diagrams/week10/week10_streaming_constraints.png)


---

## Batch vs Stream
- Batch: finite input, full recomputation possible
- Stream: unbounded input, incremental state updates
- Batch optimizes throughput; stream optimizes freshness
- Many systems combine both modes

![](../../diagrams/week10/week10_batch_vs_stream.png)


---

## Why Approximation Is Needed
- Exact distinct counting requires large state at scale
- Exact per-key frequency for huge domains is expensive
- Latency targets conflict with heavy exact structures
- Approximate sketches trade tiny error for major savings


---

## Error Framework
$$
P(|\hat{X} - X| \le \epsilon X) \ge 1-\delta
$$
- `epsilon`: error tolerance
- `delta`: failure probability
- Smaller error/confidence risk requires more memory
- This is the core tuning contract

![](../../diagrams/week10/week10_epsilon_delta.png)


---

## Algorithm 1: Morris Counter
- Approximates large counts with very small state
- Probabilistic increment reduces memory footprint
- Good for conceptual foundation
- High variance unless averaged across replicas

![](../../diagrams/week10/week10_morris_flow.png)


---

## Algorithm 2: Flajolet-Martin
- Estimates distinct count via hash trailing-zero behavior
- Single estimator is noisy
- Multiple hashes improve stability
- Foundation for modern cardinality sketches


---

## Algorithm 3: HyperLogLog (Practical Distinct)
- Uses many registers + harmonic mean estimator
- Mergeable across partitions
- Memory-efficient and production-proven
- Relative error roughly `1.04 / sqrt(m)`


---

## Algorithm 4: Count-Min Sketch (Frequency)
- Estimates per-key counts with bounded additive error
- Fast updates and queries
- Overestimates due to hash collisions
- Great for heavy-hitter and traffic monitoring use cases

![](../../diagrams/week10/week10_hll_vs_cms_comparison.png){width=88%}


---

## Sketch Selection Guide
- Need distinct count -> HyperLogLog
- Need per-key frequency -> Count-Min Sketch
- Need tiny-memory rough count -> Morris-style
- Need mergeability across shards -> HLL/CMS

![](../../diagrams/week10/week10_sketch_selection_activity.png){width=74%}


---

## Window Semantics
- **Tumbling:** fixed non-overlapping windows
- **Sliding:** overlapping windows with finer cadence
- **Session:** user/activity gap-based windows
- Window choice defines state size and business meaning

![](../../diagrams/week10/week10_window_types.png)


---

## Event Time vs Processing Time
- Event time reflects when event actually happened
- Processing time reflects when system saw it
- Event time yields replay-stable results
- Processing time is simpler but less deterministic

![](../../diagrams/week10/week10_event_vs_processing_sequence.png){width=86%}


---

## Watermarks and Late Data
- Watermark approximates completeness boundary
- Aggressive watermark lowers latency, drops more late data
- Conservative watermark improves completeness, increases delay
- Tune from SLA and lateness distribution

![](../../diagrams/week10/week10_watermark_tradeoff.png)


---

## Delivery Guarantees
- At-most-once: may lose, no duplicates
- At-least-once: no loss, duplicates possible
- Exactly-once: strongest semantics, more complexity
- Most systems combine at-least-once with idempotent sink logic

![](../../diagrams/week10/week10_delivery_guarantees.png)


---

## Idempotent Sink Pattern
- Sink key includes window + business key
- Writes are upserts/merge-safe
- Retries replay safely without double counting
- Essential for reliable production reprocessing


---

## State Sizing Intuition
- State grows with keys x active windows x value size
- Sliding/session windows can grow state quickly
- Watermark and TTL policies bound state
- Monitor checkpoint duration and state growth trends

![](../../diagrams/week10/week10_state_sizing_relation.png){width=82%}


---

## Failure Modes
- Unbounded late data inflates state
- Incorrect watermark drops valid events
- Consumer lag causes stale outputs
- Sketch parameter mis-sizing causes poor accuracy

![](../../diagrams/week10/week10_lecture_slide38_failure_late_data.png)


---

## Monitoring Signals
- Consumer lag and throughput
- Late event percentage
- State size and checkpoint time
- Accuracy drift from sampled exact comparisons


---

## Engineering Checklist
- Are event-time and watermark policies explicit?
- Is sink idempotent under retries?
- Are sketch params derived from `epsilon/delta` goals?
- Are state growth and lag alerts configured?


---

## Recap
- Streaming systems optimize freshness under bounded resources
- Approximation algorithms make large-scale queries feasible
- Correctness depends on windowing, time semantics, and idempotency
- Next: feature engineering pipelines for ML and analytics
