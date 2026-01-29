# Week 10: Streaming Data and Real-Time Processing — Practice

## Instructions
- Engineering course: show reasoning and calculations
- Use concrete events, timestamps, and window boundaries in answers
- For cost and latency: state assumptions and units (events/sec, minutes, bytes)
- Failure scenarios: explain idempotency and late-data handling

## Data Context (MANDATORY)

### Event stream: clicks

**Schema:** `(event_id, user_id, event_time, amount)`  
- `event_id`: unique per event (INT)  
- `user_id`: user identifier (VARCHAR, e.g. 'A', 'B')  
- `event_time`: when the event occurred (TIMESTAMP, minute granularity)  
- `amount`: numeric value to aggregate (DECIMAL, e.g. spend or count)

**Sample events (ordered by event_time):**

| event_id | user_id | event_time | amount |
|----------|---------|------------|--------|
| e1       | A       | 10:00      | 5      |
| e2       | B       | 10:02      | 3      |
| e3       | A       | 10:04      | 2      |
| e4       | B       | 10:06      | 1      |
| e5       | A       | 10:08      | 4      |
| e6       | B       | 10:10      | 2      |
| e7 (late)| A       | 10:01      | 1      |

**Note:** e7 arrives late (processing_time after e6); event_time 10:01 belongs to window [10:00, 10:05).

**Sink table (window aggregates):**  
`window_agg(window_start TIMESTAMP, user_id VARCHAR, sum_amount DECIMAL, PRIMARY KEY (window_start, user_id))`  
- One row per (window, user); upsert for idempotency.

**Scale (for exercises):** 100K events/day; 5K distinct users; tumbling windows 5 min; watermark delay 2 min.

### Access patterns
- Events: append-only stream; consumed in event_time order (or out-of-order)
- Sink: write by (window_start, user_id); read by window_start or user_id for dashboards

## Reference Exercises Used (Root)
- exercises1.md: Failure and Reprocessing (Kafka duplicates, idempotent sink, exactly-once semantics); ETL dedup and MERGE style adapted to streaming upsert.
- exercises2.md: Module 3 Incremental Loading and High-Water Marking (safety buffer, watermark); idempotent merge; Module 4 time-series and hot partition (skew) adapted to hot key in streams.

## Diagram Manifest
- Slide 18 → week10_practice_slide18_window_late_reasoning.puml → Window aggregate and late-data reasoning

## Warm-up Exercises
- Short definitions and one-sentence reasoning
- Use the event stream and sink schema from Data Context
- Prepare for window and watermark questions in Engineering section

## Exercise 1
Define **event-time** and **processing-time** in one sentence each. Why do we use event-time for window aggregation?

## Exercise 2
What is a **watermark** in streaming? In one sentence, when does a tumbling window [10:00, 10:05) get closed and its result emitted?

## Exercise 3
List the **three** delivery semantics (at-most-once, at-least-once, exactly-once). Which one usually requires an idempotent sink?

## Exercise 4
For the sample events e1–e6 (ignore e7), assign each event to a **tumbling 5-minute** window (event_time). Give window start and the list of (user_id, amount) in that window.

## Exercise 5
Event e7 has event_time 10:01 but arrives after the pipeline has already closed window [10:00, 10:05) and emitted results. What are two options to handle e7? One sentence each.

## Engineering Exercises
- Use sample events e1–e6 (and e7 where noted); show calculations
- State assumptions for throughput, latency, and state size
- Idempotent sink and late-data handling required in answers

## Exercise 6
**Window aggregate (manual):** For events e1–e6 only, compute **sum(amount) per user** in window [10:00, 10:05). Then compute sum(amount) per user in window [10:05, 10:10). Show the two result rows (window_start, user_id, sum_amount).

## Exercise 7
**Late data:** Suppose window [10:00, 10:05) was closed and we emitted (10:00, A, 7), (10:00, B, 3). Then e7 (A, 10:01, 1) arrives. What is the **correct** sum for user A in [10:00, 10:05) if we include e7? If the sink is idempotent (upsert by (window_start, user_id)), what single write do we need to correct the result?

## Exercise 8
**Throughput and latency:** Assume 100K events/day, watermark delay 2 min, tumbling 5 min. Estimate (a) average events per window per user (5K users), and (b) minimum result latency (time from event_time 10:04 to emission of window [10:00, 10:05)) in minutes. State assumptions.

## Exercise 9
**State size:** For 5K users and tumbling 5-min windows, how many **active** window buffers do we hold per user at any time? What is the order of magnitude of state size if each buffer holds one sum (e.g. 8 bytes)? Assume no allowed lateness.

## Exercise 10
**Idempotent sink:** The job crashes after writing (10:00, A, 7) and (10:00, B, 3) but before committing the consumer offset. On restart, the job replays events e1–e6 and recomputes the same aggregates. Explain why writing (10:00, A, 7) and (10:00, B, 3) again to the sink does **not** create duplicate rows. What key constraint on the sink table is required?

## Challenge Exercise
- Multi-part: (a) diagram and handling of e7, (b) trade-off, (c) diagram reference
- Architecture-level reasoning: state, latency, correctness
- Diagram required: week10_practice_slide18_window_late_reasoning.puml

## Exercise 11
**Multi-part — architecture and late data:**  
(a) Draw or reference a diagram showing: stream (e1–e6 + late e7) → tumbling windows [10:00,10:05) and [10:05,10:10) → aggregate per user → sink. Show where e7 would be handled (dropped vs allowed lateness).  
(b) If we **allow lateness** 3 min, we can retract (10:00, A, 7) and emit (10:00, A, 8). What is the trade-off in state size and result latency when allowing 3 min lateness vs dropping late events?  
(c) Diagram: week10_practice_slide18_window_late_reasoning.puml — use it to support your reasoning.

## Solutions

## Solution 1
- **Event-time:** the timestamp when the event actually occurred (from the data).
- **Processing-time:** the time when the pipeline processes the event (system clock).
- **Why event-time for windows:** so that results are deterministic and correct under out-of-order arrival and reprocessing; same events ⇒ same window assignment and aggregates.

## Solution 2
- **Watermark:** a monotonically advancing bound on event-time; "no event with event_time < T will arrive."
- **When window closes:** when the watermark reaches or passes the window end (e.g. 10:05); then the window [10:00, 10:05) is closed and its aggregate is emitted.

## Solution 3
- **At-most-once:** emit once, may lose on failure.
- **At-least-once:** retry on failure; duplicates possible.
- **Exactly-once:** no loss, no duplicate (transactional sink or dedup).
- **Idempotent sink:** required for **at-least-once** so that duplicate processing does not create duplicate rows (upsert by key).

## Solution 4
- **Window [10:00, 10:05):** e1 (A,5), e2 (B,3), e3 (A,2)  
- **Window [10:05, 10:10):** e4 (B,1), e5 (A,4), e6 (B,2)  
- e7 (A,1) has event_time 10:01 ⇒ belongs to [10:00, 10:05) but arrives late.

## Solution 5
- **Option 1:** Drop e7; result for [10:00, 10:05) stays (A,7), (B,3); possible undercount for A.
- **Option 2:** Allow lateness: retract (10:00, A, 7) and emit (10:00, A, 8); correct sum, more state and delayed final result.

## Solution 6
- **Window [10:00, 10:05):** A: 5+2 = 7; B: 3. → (10:00, A, 7), (10:00, B, 3).
- **Window [10:05, 10:10):** A: 4; B: 1+2 = 3. → (10:05, A, 4), (10:05, B, 3).

## Solution 7
- **Correct sum for A in [10:00, 10:05):** 7 + 1 = 8 (include e7).
- **Idempotent sink:** upsert (window_start=10:00, user_id=A, sum_amount=8). Same key (10:00, A) overwrites the previous row; one write updates A’s row to 8.

## Solution 8
- **Assumptions:** 100K events/day ≈ 69.4 events/min; 5K users; uniform over time and users (simplified).
- **(a) Events per window per user:** 5 min × 69.4 ≈ 347 events per 5 min total; per user ≈ 347/5000 ≈ 0.07; in practice skew (e.g. 20 events per window per active user, 5K users ⇒ order 100K/288 windows ≈ 347 per window total).
- **(b) Min result latency:** window [10:00, 10:05) closes when watermark ≥ 10:05. Watermark delay 2 min ⇒ watermark reaches 10:05 when latest event_time seen is 10:05, typically 2 min after 10:05 in processing-time. So latency from event_time 10:04 to emission ≥ 2 min (watermark delay) + processing; **≥ 2 min**.

## Solution 9
- **Active windows per user:** tumbling 5 min ⇒ at most **1** active window per user (current open window).
- **State:** 5K users × 1 window × 8 bytes (one sum) ≈ 40 KB; plus key overhead (window_start, user_id) ⇒ order of magnitude **tens of KB to low hundreds of KB**. With allowed lateness, multiple windows per user can be open ⇒ state larger.

## Solution 10
- **No duplicate rows:** the sink has PRIMARY KEY (window_start, user_id). Writing (10:00, A, 7) again is an **upsert**: same key (10:00, A) overwrites the existing row. So we still have one row per (window_start, user_id).
- **Constraint required:** unique key on (window_start, user_id) — e.g. PRIMARY KEY or UNIQUE — so that repeated writes for the same window and user update the same row (idempotent).

## Solution 11
- **(a)** Diagram: week10_practice_slide18_window_late_reasoning.puml. Stream e1–e6 → windows [10:00,10:05) and [10:05,10:10); aggregate per user → (10:00, A, 7), (10:00, B, 3), (10:05, A, 4), (10:05, B, 3). Late e7: if **dropped**, no change; if **allowed lateness**, e7 joins [10:00,10:05), we retract (10:00, A, 7) and emit (10:00, A, 8).
- **(b) Trade-off:** **Allow 3 min lateness:** state must hold window [10:00,10:05) for 3 min after watermark; possible retractions; correct result; higher state and slightly delayed “final” result. **Drop late:** smaller state, lower latency, but A’s sum for [10:00,10:05) is 7 (undercount).
- **(c)** The diagram shows “without late” vs “with late (allowed)”: same window, sum 10 vs 11 when late event (A, 10:01, 1) is included; idempotent sink updates the same row so the final stored value is correct.
