# Week 10: Streaming Data and Real-Time Processing

## Purpose
- Streaming is unbounded data: events arrive continuously
- Real-time pipelines power alerts, dashboards, and low-latency analytics
- Trade-offs: latency vs throughput; event-time vs processing-time

## Learning Objectives (1/2)
- Define streaming data and contrast with batch
- Distinguish event-time from processing-time
- Define watermark and late data
- Classify windows: tumbling, sliding, session

## Learning Objectives (2/2)
- State delivery guarantees: at-most-once, at-least-once, exactly-once
- Design a streaming pipeline: source → window → sink
- Estimate cost: throughput, state size, latency
- Identify failure modes: late data, duplicate delivery

## The Real Problem This Lecture Solves

## Production Failure
- Team built dashboards on processing-time windows
- Same event stream replayed gave different numbers each run
- Alerts fired on "spikes" that were just replay order

## Root Cause
- Event-time was ignored; no watermark
- ⇒ non-deterministic windows
- At-least-once without idempotent sink ⇒ double-count on replay

## Takeaway
- Streaming without event-time and idempotency doesn't scale
- This lecture is about correct, deterministic streaming

## The System We Are Building

## Domain Overview
- **Domain:** event analytics by user (clicks, spend) in tumbling windows
- Same lineage as Week 4 ingestion and Week 6 batch
- **Source:** event stream (user_id, event_time, amount)
- E.g. Kafka topic partitioned by user_id; ~1M events/day

## Pipeline Design
- **Compute:** tumbling 5-min windows by event_time
- Watermark to close windows; sum(amount) per user per window
- **Sink:** table or API keyed by (window_start, user_id)
- Idempotent upsert so replay does not duplicate
- **Consumers:** dashboards, alerts; expect same numbers on reprocess

## Diagram Manifest
- Slide 13 → week10_lecture_slide13_system_overview.puml
- Slide 18 → week10_lecture_slide18_window_example.puml
- Slide 22 → week10_lecture_slide22_execution_flow.puml
- Slide 38 → week10_lecture_slide38_failure_late_data.puml

## Core Concepts (1/2)
- **Streaming:** unbounded sequence of events; processed as they arrive
- **Event:** (key, value, event_time)
- event_time = when it happened; processing_time = when system saw it
- **Window:** group events by time for aggregation
- Close when watermark passes window end

## Core Concepts (2/2)
- **Watermark:** progress of event-time
- "No event with event_time < T will arrive"
- **At-most-once:** emit once, may lose on failure
- **At-least-once:** retry on failure; duplicates possible
- **Exactly-once:** no loss, no duplicate; transactional sink

## Streaming Model: Constraints
- **One pass:** events cannot be rewound
- **Bounded memory:** state << stream size
- **Per-event update:** \(O(1)\) or \(O(\log n)\)
- **Approximation:** trade exactness for feasibility
- **Guarantee:** error bounds or confidence stated

## Morris Counter (Approximate Counting)
- Counter state \(X\) increments with probability \(2^{-X}\)
$$
P(\text{inc}) = 2^{-X}
$$
- Interpretation: large counts advance slowly
- Engineering implication: \(O(1)\) space, one pass
- Estimator uses the counter value
$$
\hat{n} = 2^{X} - 1
$$
- Interpretation: unbiased estimate, \(E[\hat{n}] = n\)
- Error intuition: variance is high for one counter
- Engineering implication: average \(k\) counters ⇒ error \(\propto 1/\sqrt{k}\)

## Flajolet–Martin Cardinality
- Hash each item, track max trailing-zero count \(\rho(h(x))\)
$$
R = \max_x \rho(h(x))
$$
- Interpretation: more distinct items ⇒ larger \(R\)
- Engineering implication: constant memory, one pass
- Cardinality estimate
$$
\hat{N} = 2^{R}
$$
- Interpretation: accurate up to a constant factor
- Error intuition: variance high for one register
- Engineering implication: \(m\) registers ⇒ error \(\propto 1/\sqrt{m}\)

## HyperLogLog (Intuition)
- FM with many small registers and harmonic mean aggregation
- Reduces variance while keeping sublinear memory
- Engineering implication: standard for distinct counts in data systems

## Count-Min Sketch (Frequency Estimation)
- Let \(N\) be total updates, estimate \(\hat{f}(x)\)
$$
\hat{f}(x) \le f(x) + \epsilon N
$$
- Interpretation: overestimation bounded by \(\epsilon N\)
- Engineering implication: choose width by \(\epsilon\) tolerance
- Probability of meeting the error bound
$$
P(\hat{f}(x) \le f(x) + \epsilon N) \ge 1-\delta
$$
- Interpretation: confidence controlled by sketch depth
- Engineering implication: set depth \(d = \lceil \ln(1/\delta) \rceil\)

## Data Context: Sample Stream
- e1(A,10:00,5), e2(B,10:02,3), e3(A,10:04,2)
- e4(B,10:06,1), e5(A,10:08,4), e6(B,10:10,2)
- e7 late: A at 10:01 arrives after e6

## In-Lecture Exercise 1: Event-Time vs Processing-Time
- Define event-time and processing-time
- Why do windows use event-time?

## In-Lecture Exercise 1: Solution (1/2)
- Event-time: when the event occurred in the real world
- Processing-time: when the system processes it

## In-Lecture Exercise 1: Solution (2/2)
- Event-time makes window aggregates deterministic on replay
- Processing-time depends on arrival order and backpressure

## In-Lecture Exercise 1: Takeaway
- Event-time plus watermarks ensure reproducible aggregates

## Event-Time vs Processing-Time
- **Event-time:** timestamp from data (e.g. click at 10:00)
- Correct for analytics and windows
- **Processing-time:** time when pipeline processes event
- Non-deterministic under backpressure
- **Why event-time:** out-of-order arrival; reprocessing; same input ⇒ same result

## Watermark
- Function of processing-time or event-time
- "Event-time progress"
- Late events beyond watermark dropped or side-output

## Window Types (1/2)
- **Tumbling:** fixed, non-overlapping intervals
- E.g. [10:00, 10:05), [10:05, 10:10)
- **Sliding:** fixed size, fixed slide; overlapping
- E.g. size 5 min, slide 1 min
- **Session:** gap-based; close after idle threshold

## Window Types (2/2)
- **Engineering:** tumbling = low state; sliding = more state
- Session = state per key until gap
- **Assignment:** event belongs to window(s) by event_time
- Window closes when watermark ≥ end
- **State:** per (key, window); bounded for tumbling

## In-Lecture Exercise 2: Tumbling Window Aggregate
- Use e1–e6 only; 5-minute tumbling windows
- Compute sum(amount) per user for [10:00, 10:05)
- Compute sum(amount) per user for [10:05, 10:10)

## In-Lecture Exercise 2: Solution (1/2)
- [10:00,10:05): A = 5+2 = 7; B = 3
- Output: (10:00,A,7), (10:00,B,3)

## In-Lecture Exercise 2: Solution (2/2)
- [10:05,10:10): A = 4; B = 1+2 = 3
- Output: (10:05,A,4), (10:05,B,3)

## In-Lecture Exercise 2: Takeaway
- Window boundaries are defined by event-time
- Aggregates are per (window_start, user_id)

## Guarantees and What Breaks at Scale
- **Throughput:** events/sec limited by slowest operator
- Backpressure propagates upstream
- **Latency:** time from event_time to result
- Watermark delay + processing delay
- **State:** grows with distinct keys and allowed lateness
- **Late data:** watermark too aggressive ⇒ drop late events

## Cost of Naïve Design (Streaming)

## Processing-Time Windows
- Same input, different output on replay or out-of-order
- ⇒ non-deterministic dashboards; broken backtests

## No Watermark
- Windows never close ⇒ unbounded state
- Long-running job → OOM; no way to emit "final" result

## In-Lecture Exercise 3: Late Event Correction
- Window [10:00,10:05) already emitted: (A,7), (B,3)
- Late event e7 arrives: (A,10:01,1)
- What is the correct sum for A in that window?
- What single sink write fixes it with upsert?

## In-Lecture Exercise 3: Solution (1/2)
- Correct sum for A: 7 + 1 = 8
- Late event belongs to [10:00,10:05)

## In-Lecture Exercise 3: Solution (2/2)
- Upsert row (10:00, A, 8) by primary key
- Idempotent sink overwrites previous value

## In-Lecture Exercise 3: Takeaway
- Late data requires correction or explicit dropping
- Idempotent sinks make corrections safe

## At-Least-Once Without Idempotent Sink
- Consumer crash ⇒ replay ⇒ same (window, user) written twice
- ⇒ double-count in revenue
- **Engineering rule:** event-time + watermark + idempotent sink

## Delivery Semantics (Detail)
- **At-most-once:** emit and forget; no retry; may lose
- **At-least-once:** retry on failure; duplicates possible
- Idempotent sink required
- **Exactly-once:** transactional sink + checkpoint; or dedup by key
- **Engineering:** at-least-once + upsert ⇒ effectively once per key

## Streaming System Overview
- **Sources:** event logs, IoT, message queue (e.g. Kafka)
- Partitioned by key
- **Ingest:** subscribe/poll; assign event_time
- **Stream engine:** window by event_time; watermark; per-key state
- **Sink:** DB, API, or topic; idempotent write by (key, window)
![](../../diagrams/week10/week10_lecture_slide13_system_overview.png)

## Running Example — Data & Goal
- **Schema:** (user_id, event_time, amount)
- event_time in minutes (e.g. 10:00, 10:02)
- **Sample:** (A, 10:00, 5), (B, 10:02, 3), (A, 10:04, 2), (B, 10:06, 1)
- **Goal:** sum(amount) per user in tumbling 5-minute windows

## Running Example — Schema and Sample Rows
- **Events:** (user_id, event_time, amount)
- **Sample:** (A, 10:00, 5), (B, 10:02, 3), (A, 10:04, 2), (B, 10:06, 1)
- **Keys:** user_id for grouping; window for sink idempotency
- **Scale:** 1M events/day; 10K users; 288 windows/day per user

## Running Example — Step-by-Step (1/4)
- **Step 1:** Ingest events; assign event_time from payload
- **Watermark:** e.g. current_max_event_time - 1 min
- **Window assignment:** [10:00,10:05) gets (A,5), (B,3), (A,2)
- [10:05,10:10) gets (B,1)

## Running Example — Step-by-Step (2/4)
- **Step 2:** For window [10:00, 10:05): group by user_id
- Sum(amount): A = 5 + 2 = 7; B = 3
- **Emit when:** watermark ≥ 10:05 ⇒ close window
- **Output:** (10:00, A, 7), (10:00, B, 3)

## Running Example — Window Example (Diagram)
- Tumbling 5 min: [10:00,10:05) gets e1,e2,e3
- [10:05,10:10) gets e4,e5
- Watermark ≥ window end ⇒ close; emit aggregate
- Late event ⇒ drop or allow lateness (retract + update)
![](../../diagrams/week10/week10_lecture_slide18_window_example.png)

## Running Example — Step-by-Step (3/4)
- **Step 3:** Sink writes with upsert by (window_start, user_id)
- **Idempotency:** same key overwrites same row; at-least-once safe
- **State:** after emit, window state can be discarded (tumbling)
- **Late event:** e.g. (A, 10:01, 1) arrives after watermark passed 10:05

## Running Example — Step-by-Step (4/4)
- **Output:** (10:00, A, 7), (10:00, B, 3), (10:05, B, 1)
- **Engineering:** event-time windows give consistent results
- Watermark trades latency for completeness
- Idempotent sink enables at-least-once without double-counting

## Cost & Scaling Analysis (1/3)
- **Time model:** latency = max(ingest, window buffer, aggregate, sink)
- Dominated by watermark delay + sink write
- **Throughput:** events/sec = min(partition throughput)
- Scale by adding partitions and parallel consumers

## Cost — Latency Breakdown
- **Ingest:** poll interval + deserialize; typically ms
- **Window buffer:** wait for watermark; delay = watermark_lag
- **Aggregate:** per-key state update; O(1) per event
- **Sink:** write latency; batch size vs latency trade-off

## Cost & Scaling Analysis (2/3)
- **Memory / state:** per (key, active window)
- Tumbling: O(keys × 1); sliding: O(keys × size/slide)
- **Storage:** checkpoint = state + offset; size ∝ state
- **Bounded state:** watermark ensures old windows close

## Cost — State Size (Formula)
- **Tumbling:** active windows per key ≈ 1
- State = O(keys × size_per_window)
- **Sliding:** active windows ≈ window_size / slide
- **Session:** state ∝ keys × open_sessions
- **Example:** 10K keys, 5-min tumbling ⇒ ~10K window buffers

## Cost & Scaling Analysis (3/3)
- **Network:** producer → broker → consumer
- Throughput ∝ partitions; shuffle if key-based aggregation
- **Latency vs throughput:** low watermark delay ⇒ low latency but more late data
- **Backpressure:** slow sink ⇒ consumer lags; monitor lag

## Execution Flow
- **Producer:** emit (key, value, event_time); partition by key
- **Broker:** persist by partition; offset per partition
- **Consumer:** poll batch; assign watermark; run window/aggregate
- Write sink; commit offset after ack
![](../../diagrams/week10/week10_lecture_slide22_execution_flow.png)

## Pitfalls & Failure Modes (1/3)
- **Ignoring event-time:** processing-time windows ⇒ non-deterministic
- Breaks reprocessing and out-of-order
- **No watermark:** windows never close ⇒ unbounded state; OOM
- **Watermark too tight:** many events classified "late"
- **Watermark too loose:** long delay before window closes

## Pitfalls — Duplicate Delivery and Hot Keys
- **At-least-once:** consumer crash ⇒ replay ⇒ same events again
- **Idempotent sink:** upsert by (window_start, user_id)
- **Hot key:** one key gets most events ⇒ one partition overloaded
- **Mitigation:** partition by key; salting for skew

## Watermark Tuning
- **Delay:** watermark = max_event_time - delay
- Delay = expected max lateness (e.g. 1–5 min)
- **Too small:** many late events; undercount
- **Too large:** windows close late; high state
- **Monitor:** late events count; adjust delay from P99 lateness

## State and Checkpointing
- **State:** per (key, window); persisted for recovery
- **Checkpoint:** state + consumer offset; periodic (e.g. every 1 min)
- **Recovery:** restore state; reset offset; reprocess from checkpoint
- **Exactly-once:** checkpoint before sink ack; sink in transaction

## Sink Idempotency Design
- **Key:** (window_start, user_id) or event_id for dedup
- **Write:** upsert (INSERT ON CONFLICT UPDATE or MERGE)
- **Rerun:** same key ⇒ overwrite same row; no duplicate rows
- **Constraint:** sink must support upsert; or append + dedup at read

## Consumer Lag and Backpressure
- **Lag:** offset difference between producer and consumer
- High lag ⇒ delay
- **Backpressure:** slow consumer ⇒ broker buffer grows
- May hit retention limit
- **Mitigation:** scale consumers; increase partitions; optimize sink

## Reprocessing and Replay
- **Replay:** reset offset to earlier time; reprocess all events
- **Event-time windows:** same events ⇒ same results (deterministic)
- **Idempotent sink:** reprocessed writes overwrite; no duplicate
- **Use case:** fix bug in aggregation; backfill new field

## Late Data — Side Output and Allowed Lateness

## Side Output
- Route late events to separate stream/topic
- Human or batch correction

## Allowed Lateness
- Keep window state for watermark + L
- Late event within L triggers retract + update
- **Trade-off:** L large ⇒ correct but more state

## Monitoring and Alerts
- **Metrics:** events/sec; consumer lag; watermark lag; late events
- **Alerts:** lag > threshold; late spike; sink errors; checkpoint failure
- **Dashboard:** throughput by partition; latency p50/p99; state size
- **Action:** scale; tune watermark; fix sink

## Failure — Partial Write and Recovery
- **Scenario:** consumer writes to sink then crashes before commit
- Sink has partial data
- **Recovery:** restore from checkpoint; replay from last committed offset
- **Idempotent sink:** replay writes same keys; overwrite; no duplicates

## Failure — Watermark Stuck or Too Fast

## Stuck Watermark
- No new events ⇒ watermark does not advance
- Windows never close
- **Mitigation:** periodic watermark when idle

## Too Fast Watermark
- Watermark advances ahead of real event-time
- Many events "late"
- **Mitigation:** bounded watermark delay; monitor late count

## Pitfalls — Late Data Scenario
- **Scenario:** window [10:00,10:05) closed at watermark 10:05
- Emitted (A, 7), (B, 3)
- **Late event:** (A, 10:01, 1) arrives at processing_time 10:06
- **Correctness:** true sum for A = 7 + 1 = 8; already emitted 7
- **Options:** drop (undercount); allow lateness (retract + update)
![](../../diagrams/week10/week10_lecture_slide38_failure_late_data.png)

## Pitfalls & Failure Modes (3/3)
- **Detection:** late events count; consumer lag; sink errors
- **Mitigation:** watermark with bounded delay; allow lateness
- Idempotent sink by (key, window); exactly-once with transactional sink
- **Trade-off:** bounded delay + drop late ⇒ predictable latency

## Best Practices (1/2)
- Use event-time and watermarks for windowing
- Avoid processing-time for analytics
- Set watermark delay from domain (max network delay)
- Monitor late events
- Design idempotent sink: upsert by (key, window)
- Bound state: close windows via watermark

## Best Practices (2/2)
- Scale by partitions and parallel consumers
- Monitor consumer lag and sink latency
- Checkpoint state and offsets for recovery; test failover
- Prefer exactly-once sinks when supported
- Otherwise at-least-once + idempotent write
- Document watermark policy and late-data handling

## Recap — Engineering Judgment
- **Event-time is non-negotiable:** processing-time windows are non-deterministic
- Always window by event_time and use watermarks
- **Watermark trade-off:** delay too small ⇒ drop late (undercount)
- Too large ⇒ big state and slow results
- **Idempotent sink by (key, window):** at-least-once without upsert ⇒ double-count
- **Cost levers:** throughput = min(partition rate); state ∝ keys × windows

## Pointers to Practice
- Compute window aggregates from concrete event streams
- Reason about event-time vs processing-time and watermark placement
- Design idempotent sink and handle late data
- Draw window boundaries and execution flow

## Additional Diagrams
### Practice: Window Late Reasoning
![](../../diagrams/week10/week10_practice_slide18_window_late_reasoning.png)
