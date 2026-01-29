# Week 10: Streaming Data and Real-Time Processing

## Purpose
- Streaming is unbounded data: events arrive continuously; no fixed "end" of input
- Real-time pipelines power alerts, dashboards, and low-latency analytics
- Engineering trade-offs: latency vs throughput; event-time vs processing-time; correctness vs cost

## Learning Objectives (1/2)
- Define streaming data and contrast with batch: unbounded vs bounded input
- Distinguish event-time from processing-time; define watermark and late data
- Classify windows: tumbling, sliding, session; state the semantics of each
- State delivery guarantees: at-most-once, at-least-once, exactly-once

## Learning Objectives (2/2)
- Design a streaming pipeline: source → window/aggregate → sink; idempotent writes
- Estimate cost: throughput (events/sec), state size, latency; trade latency vs completeness
- Identify failure modes: late data, duplicate delivery, watermark too tight; mitigate with watermarks and idempotency

## The Real Problem This Lecture Solves
- **Production failure:** A team built dashboards on processing-time windows; same event stream replayed gave different numbers each run; alerts fired on "spikes" that were just replay order
- **Trigger:** Reprocessing after a bug fix; out-of-order events from mobile and cross-DC; stakeholders lost trust in "real-time" metrics
- **Root cause:** Event-time was ignored; no watermark ⇒ non-deterministic windows; at-least-once without idempotent sink ⇒ double-count on replay
- **Takeaway:** Streaming without event-time and idempotency doesn't scale to production. This lecture is about correct, deterministic streaming and the cost of getting it wrong.

## The System We Are Building
- **Domain:** Event analytics by user (clicks, spend) in tumbling windows; same lineage as Week 4 ingestion and Week 6 batch aggregation—now in real time
- **Source:** Event stream (user_id, event_time, amount); e.g. Kafka topic partitioned by user_id; ~1M events/day
- **Compute:** Tumbling 5-min windows by event_time; watermark to close windows; sum(amount) per user per window
- **Sink:** Table or API keyed by (window_start, user_id); idempotent upsert so replay does not duplicate
- **Consumers:** Dashboards, alerts, downstream batch; all expect same numbers on reprocess
- Every later example refers to *this* system unless stated otherwise

## Sources Used (Reference Only)
- sources/Lecture 6,7,8.pdf
- sources/Lecture 6,7,8.pptx
- sources/Spark.pdf
- exercises1.md (Failure and Reprocessing: Kafka exactly-once, idempotent sink)
- exercises2.md (Module 3: watermarking, incremental; Module 4: time-series, hot partition)

## Diagram Manifest
- Slide 13 → week10_lecture_slide13_system_overview.puml → Streaming pipeline system overview
- Slide 18 → week10_lecture_slide18_window_example.puml → Window example: event-time boundaries
- Slide 22 → week10_lecture_slide22_execution_flow.puml → Execution / request flow: producer → broker → consumer → sink
- Slide 38 → week10_lecture_slide38_failure_late_data.puml → Failure: late data and watermark

## Core Concepts (1/2)
- **Streaming:** unbounded sequence of events; processed as they arrive or in micro-batches
- **Event:** (key, value, event_time); event_time = when it happened; processing_time = when system saw it
- **Window:** group events by time for aggregation; close when watermark passes window end
- **Watermark:** progress of event-time; "no event with event_time < T will arrive"; used to close windows

## Core Concepts (2/2)
- **At-most-once:** emit once, may lose on failure
- **At-least-once:** retry on failure; duplicates possible; require idempotent sink
- **Exactly-once:** no loss, no duplicate; needs transactional sink or dedup by key
- **What breaks:** late data (event_time < watermark); hot keys; unbounded state if windows never close

## Event-Time vs Processing-Time
- **Event-time:** timestamp from data (e.g. click at 10:00); correct for analytics and windows
- **Processing-time:** time when pipeline processes event; non-deterministic under backpressure
- **Why event-time:** out-of-order arrival; reprocessing; same input ⇒ same result
- **Watermark:** function of processing-time or event-time; "event-time progress"; late events beyond watermark dropped or side-output

## Window Types (1/2)
- **Tumbling:** fixed, non-overlapping intervals; e.g. [10:00, 10:05), [10:05, 10:10)
- **Sliding:** fixed size, fixed slide; overlapping; e.g. size 5 min, slide 1 min
- **Session:** gap-based; close after idle threshold; variable length per key
- **Engineering:** tumbling = low state; sliding = more state; session = state per key until gap

## Window Types (2/2)
- **Assignment:** event belongs to window(s) by event_time; window closes when watermark ≥ end
- **Emit:** when window closes, output aggregate (sum, count, etc.); retractions if late data allowed
- **State:** per (key, window); bounded for tumbling; unbounded for session until timeout
- **Cost:** state size ∝ keys × active windows; checkpoint cost for fault tolerance

## Guarantees and What Breaks at Scale
- **Throughput:** events/sec limited by slowest operator; backpressure propagates upstream
- **Latency:** time from event_time to result; watermark delay + processing delay
- **State:** grows with distinct keys and allowed lateness; OOM if unbounded
- **Late data:** watermark too aggressive ⇒ drop late events; too loose ⇒ long delay and large state

## Cost of Naïve Design (Streaming)
- **Processing-time windows:** same input, different output on replay or out-of-order ⇒ non-deterministic dashboards and broken backtests; production cost: lost trust, useless alerts
- **No watermark:** windows never close ⇒ unbounded state; one long-running job → OOM; no way to emit "final" result
- **At-least-once without idempotent sink:** consumer crash ⇒ replay ⇒ same (window, user) written twice ⇒ double-count in revenue or engagement; sink must upsert by (window_start, user_id)
- **Watermark too tight:** drop valid late events (e.g. mobile batch) ⇒ undercount; too loose ⇒ huge state and delayed results
- **Engineering rule:** event-time + watermark + idempotent sink by (key, window) are non-negotiable for production streaming

## Delivery Semantics (Detail)
- **At-most-once:** emit and forget; no retry; may lose on crash
- **At-least-once:** retry on failure; duplicates possible; idempotent sink required
- **Exactly-once:** transactional sink + checkpoint; or dedup by key at sink
- **Engineering:** at-least-once + upsert by (key, window) ⇒ effectively once per key per window

## Streaming System Overview
- **Sources:** event logs, IoT, message queue (e.g. Kafka); partitioned by key
- **Ingest:** subscribe / poll; assign event_time; optional parsing and filtering
- **Stream engine:** window by event_time; watermark; per-key state; checkpoint for recovery
- **Sink:** DB, API, or topic; idempotent write by (key, window) for at-least-once
- Diagram: week10_lecture_slide13_system_overview.puml

## Running Example — Data & Goal
- **Schema:** (user_id, event_time, amount); event_time in minutes (e.g. 10:00, 10:02)
- **Sample:** (A, 10:00, 5), (B, 10:02, 3), (A, 10:04, 2), (B, 10:06, 1)
- **Goal:** sum(amount) per user in tumbling 5-minute windows (event-time)
- **Output:** (window_start, user_id, sum_amount); engineering: reproducible given same events and window definition

## Running Example — Schema and Sample Rows
- **Events:** (user_id, event_time, amount); event_time = TIMESTAMP or epoch
- **Sample:** (A, 10:00, 5), (B, 10:02, 3), (A, 10:04, 2), (B, 10:06, 1)
- **Keys:** user_id for grouping; window (start, end) for sink idempotency
- **Scale (example):** 1M events/day; 10K distinct users; 5-min tumbling ⇒ 288 windows/day per user

## Running Example — Step-by-Step (1/4)
- **Step 1:** Ingest events; assign event_time from payload
- **Events:** (A,10:00,5), (B,10:02,3), (A,10:04,2), (B,10:06,1)
- **Watermark:** e.g. current_max_event_time - 1 min; or from source metadata
- **Window assignment:** [10:00,10:05) gets (A,5), (B,3), (A,2); [10:05,10:10) gets (B,1)

## Running Example — Step-by-Step (2/4)
- **Step 2:** For window [10:00, 10:05): group by user_id; sum(amount)
- **A:** 5 + 2 = 7; **B:** 3
- **Emit when:** watermark ≥ 10:05 ⇒ close window [10:00, 10:05); output (10:00, A, 7), (10:00, B, 3)
- **Window [10:05, 10:10):** (B,1) ⇒ (10:05, B, 1); emit when watermark ≥ 10:10

## Running Example — Window Example (Diagram)
- Tumbling 5 min: [10:00,10:05) gets e1,e2,e3; [10:05,10:10) gets e4,e5
- Watermark ≥ window end ⇒ close window; emit aggregate
- Late event (event_time in past window) ⇒ drop or allow lateness (retract + update)
- Diagram: week10_lecture_slide18_window_example.puml

## Running Example — Step-by-Step (3/4)
- **Step 3:** Sink writes: e.g. upsert by (window_start, user_id) so rerun does not duplicate
- **Idempotency:** same (window_start, user_id) overwrites same row; at-least-once safe
- **State:** after emit, window state can be discarded (tumbling); checkpoint offset for exactly-once
- **Late event:** e.g. (A, 10:01, 1) arrives after watermark passed 10:05; drop or allow lateness (retract + update)

## Running Example — Step-by-Step (4/4)
- **Output:** (10:00, A, 7), (10:00, B, 3), (10:05, B, 1)
- **Engineering interpretation:** event-time windows give consistent results across runs; watermark trades latency for completeness; idempotent sink enables at-least-once without double-counting
- **Trade-off:** allow lateness ⇒ correct sum but delayed output and more state; drop late ⇒ lower latency, possible undercount

## Cost & Scaling Analysis (1/3)
- **Time model:** latency = max(ingest, window buffer, aggregate, sink); dominated by watermark delay + sink write
- **Throughput:** events/sec = min(partition throughput); scale by adding partitions and parallel consumers
- **Formula:** sustainable rate ≥ arrival rate; else backpressure; buffer size and checkpoint interval affect recovery time

## Cost — Latency Breakdown
- **Ingest:** poll interval + deserialize; typically ms
- **Window buffer:** wait for watermark; delay = watermark_lag (e.g. 1–5 min)
- **Aggregate:** per-key state update; O(1) per event
- **Sink:** write latency; batch size vs latency trade-off

## Cost & Scaling Analysis (2/3)
- **Memory / state:** per (key, active window); tumbling: O(keys × 1); sliding: O(keys × (size/slide)); session: O(keys) × avg sessions
- **Storage:** checkpoint = state + offset; size ∝ state; frequency trades recovery vs I/O cost
- **Bounded state:** watermark ensures old windows close; allow lateness ⇒ keep state until watermark + lateness

## Cost — State Size (Formula)
- **Tumbling:** active windows per key ≈ 1; state = O(keys × size_per_window)
- **Sliding:** active windows ≈ window_size / slide; state ∝ keys × (size/slide)
- **Session:** state ∝ keys × open_sessions; timeout closes session
- **Example:** 10K keys, 5-min tumbling ⇒ ~10K window buffers; 1-min slide, 5-min size ⇒ ~5× more

## Cost & Scaling Analysis (3/3)
- **Network:** producer → broker → consumer; throughput ∝ partitions; shuffle if key-based aggregation
- **Latency vs throughput:** low watermark delay ⇒ low latency but more late data dropped; high delay ⇒ complete but slower result
- **Backpressure:** slow sink ⇒ consumer lags ⇒ broker buffer grows; monitor lag and scale sink or partitions

## Execution Flow
- **Producer:** emit (key, value, event_time); optional partition by key
- **Broker:** persist by partition; offset per partition; consumer commits offset
- **Consumer:** poll batch; assign watermark; run window/aggregate; write sink; commit offset after ack
- **Order:** process → update watermark → close windows → emit → sink → commit
- Diagram: week10_lecture_slide22_execution_flow.puml

## Pitfalls & Failure Modes (1/3)
- **Ignoring event-time:** using processing-time for windows ⇒ non-deterministic; breaks reprocessing and out-of-order
- **No watermark:** windows never close ⇒ unbounded state; OOM
- **Watermark too tight:** many events classified "late" ⇒ wrong undercount or drop valid data
- **Watermark too loose:** long delay before window closes; large state; slow results

## Pitfalls — Duplicate Delivery and Hot Keys
- **At-least-once:** consumer crash ⇒ replay from last offset ⇒ same events again
- **Idempotent sink:** upsert by (window_start, user_id) or (event_id); same key overwrites
- **Hot key:** one key (e.g. user_id) gets most events ⇒ one partition/operator overloaded
- **Mitigation:** partition by key; salting for skew; or separate hot-path

## Watermark Tuning
- **Delay:** watermark = max_event_time - delay; delay = expected max lateness (e.g. 1–5 min)
- **Too small:** many late events; undercount or side output flood
- **Too large:** windows close late; high result latency and state held longer
- **Monitor:** late events count; adjust delay from P99 event lateness

## State and Checkpointing
- **State:** per (key, window); persisted for recovery
- **Checkpoint:** state + consumer offset; periodic (e.g. every 1 min)
- **Recovery:** restore state; reset offset to checkpoint; reprocess from there
- **Exactly-once:** checkpoint before sink ack; sink participates in transaction

## Sink Idempotency Design
- **Key:** (window_start, user_id) or (event_id) for dedup
- **Write:** upsert (INSERT ... ON CONFLICT UPDATE or MERGE)
- **Rerun:** same key ⇒ overwrite same row; no duplicate rows
- **Constraint:** sink must support upsert; or append + dedup at read

## Consumer Lag and Backpressure
- **Lag:** offset difference between producer and consumer; high lag ⇒ delay
- **Backpressure:** slow consumer ⇒ broker buffer grows; may hit retention limit
- **Mitigation:** scale consumers; increase partitions; optimize sink; or throttle producer
- **Alert:** lag > threshold ⇒ pipeline cannot keep up

## Reprocessing and Replay
- **Replay:** reset offset to earlier time; reprocess all events from there
- **Event-time windows:** same events ⇒ same results (deterministic)
- **Idempotent sink:** reprocessed writes overwrite; no duplicate in sink
- **Use case:** fix bug in aggregation; backfill new field

## Late Data — Side Output and Allowed Lateness
- **Side output:** route late events to separate stream/topic; human or batch correction
- **Allowed lateness:** keep window state for watermark + L; late event within L triggers retract + update
- **Retract:** emit (key, old_value, retract); then (key, new_value); sink must support upsert
- **Trade-off:** L large ⇒ correct but more state and delayed final result

## Monitoring and Alerts
- **Metrics:** events/sec; consumer lag; watermark lag; late events count; sink write latency
- **Alerts:** lag > threshold; late events spike; sink errors; checkpoint failure
- **Dashboard:** throughput by partition; latency p50/p99; state size
- **Action:** scale; tune watermark; fix sink or schema

## Failure — Partial Write and Recovery
- **Scenario:** consumer writes to sink then crashes before commit; sink has partial data
- **Recovery:** restore from checkpoint; replay from last committed offset
- **Idempotent sink:** replay writes same keys; overwrite; no duplicate rows
- **Exactly-once:** checkpoint + sink in same transaction; atomic commit

## Failure — Watermark Stuck or Too Fast
- **Stuck:** no new events ⇒ watermark does not advance ⇒ windows never close
- **Too fast:** watermark advances ahead of real event-time ⇒ many events "late"
- **Mitigation:** bounded watermark delay; periodic watermark when idle; monitor late count
- **Trade-off:** periodic watermark ⇒ windows close but may drop in-flight events

## Pitfalls — Late Data Scenario
- **Scenario:** window [10:00,10:05) closed at watermark 10:05; emitted (A, 7), (B, 3)
- **Late event:** (A, 10:01, 1) arrives at processing_time 10:06; event_time 10:01 < watermark 10:05
- **Correctness:** true sum for A in that window = 7 + 1 = 8; already emitted 7
- **Options:** drop (undercount); allow lateness ⇒ retract (10:00, A, 7), emit (10:00, A, 8); or side output
- Diagram: week10_lecture_slide38_failure_late_data.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor late events count; consumer lag; sink write errors; watermark lag
- **Mitigation:** watermark = max_event_time - bounded_delay; allow lateness with side output or retractions; idempotent sink by (business key, window); exactly-once with transactional sink and checkpoint
- **Trade-off:** bounded delay + drop late ⇒ predictable latency, possible undercount; allow lateness ⇒ correct but more state and complexity

## Best Practices (1/2)
- Use event-time and watermarks for windowing; avoid processing-time for analytics
- Set watermark delay from domain (e.g. max network delay); monitor late events
- Design idempotent sink: upsert by (key, window) or dedup by event_id before write
- Bound state: close windows via watermark; limit allowed lateness or use side output

## Best Practices (2/2)
- Scale by partitions and parallel consumers; monitor consumer lag and sink latency
- Checkpoint state and offsets for recovery; test failover and rerun
- Prefer exactly-once sinks when sink supports it; otherwise at-least-once + idempotent write
- Document watermark policy and late-data handling in pipeline config

## Recap — Engineering Judgment
- **Event-time is non-negotiable:** processing-time windows are non-deterministic; reprocessing and out-of-order break correctness; always window by event_time and use watermarks
- **Watermark trade-off:** delay too small ⇒ drop late events (undercount); too large ⇒ big state and slow results; set from P99 event lateness and monitor late-event count
- **Idempotent sink by (key, window):** at-least-once without upsert ⇒ double-count on replay; key = (window_start, user_id) or event_id; same key overwrites
- **Cost levers:** throughput = min(partition rate); state ∝ keys × active windows; latency = watermark delay + sink; tune watermark and allowed lateness for your completeness vs latency SLA

## Pointers to Practice
- Compute window aggregates from concrete event streams (schema + sample events)
- Reason about event-time vs processing-time and watermark placement
- Design idempotent sink and handle late data; cost and failure scenarios
- Draw window boundaries and execution flow; quantify state and latency
