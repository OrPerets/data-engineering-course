# Homework 3 — Streaming & Feature Engineering

## Instructions
- Submission format: one PDF; include step-by-step updates for probabilistic counters.
- Allowed: calculator, notes. Not allowed: tool-specific APIs, vague explanations without numbers.
- Grading: partial credit based on logic; all computations must include units and stated assumptions.

## Data Context
A streaming platform processes events `(user_id, event_ts, event_type, value)`.
- Arrival rate: 200,000 events/sec
- 1 day = 86,400 sec
- Distinct users per day ≈ 50,000,000
- Memory budget for streaming state: 64 MB

You must compute streaming features over a 1-hour sliding window and a 1-day tumbling window.

## Questions
### Question 1 — Warm-up
You need the exact number of distinct users in the last 24 hours in a single pass. Prove that exact computation is impossible under the 64 MB memory budget. Use a counting lower bound and show a numeric contradiction.

### Question 2 — Engineering Reasoning
Apply the Morris counter with base 2. Start with counter X=0. For a stream of 12 events, assume the following random outcomes for increment trials (1 means increment, 0 means no increment):
`1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0`
Compute the final X and the estimated count `2^X - 1`.

### Question 3 — Cost / Scale Analysis
Estimate distinct users in one day using Flajolet–Martin with 64 registers (FM with stochastic averaging). Given the maximum trailing-zero count observed per register is:
`[5,4,6,5,7,5,4,6,5,5,6,4,5,7,6,5,5,4,6,5,6,5,4,7,5,6,5,5,6,4,5,7,5,6,5,4,6,5,7,5,4,6,5,6,4,5,7,5,6,5,4,6,5,7,5,4,6,5,6,4,5,7,6,5]`
Use the FM estimate: `E = alpha * m * 2^(avg(R))`, with `alpha = 0.77351`, `m=64`, and `avg(R)` the average of the list. Provide the estimated distinct count.

### Question 4 — Design Decision
Compare accuracy vs memory for:
A) Morris counter (single register)
B) FM with 64 registers
Assume both fit in memory. Which should be used for daily distinct users and which for hourly distinct users? Justify using error vs memory trade-offs and window semantics.

### Question 5 — Challenge (Optional)
Design a streaming feature pipeline to compute:
- 1-hour rolling average `value` per user
- 1-day distinct count of event types per user
- A leakage-safe training feature for next-day churn prediction
Provide the state stored, update rules, and justify how you avoid feature leakage.

## Solutions
### Solution 1
Exact distinct counting requires distinguishing among all possible subsets of users seen in the last 24 hours. With U = 50,000,000 possible users, the number of subsets is 2^U, requiring at least U bits to represent exactly. Minimum memory = 50,000,000 bits ≈ 6.25 MB just to store a bitmap, but for a 24-hour sliding window you must also remove users as they expire, which requires storing timestamps or a counting structure. With 200,000 events/sec, 1 day has 17,280,000,000 events. Storing even 1 byte per event is 17.28 GB, far above 64 MB. Therefore exact sliding-window distinct counting is impossible under the memory budget.

### Solution 2
Morris counter updates: increment X with probability 2^-X. Given the trial outcomes, increment X when outcome is 1.
Sequence of increments: positions 1,3,6,7,11 are increments → total increments = 5. Starting X=0, increments yield X=5.
Estimated count = 2^5 - 1 = 31.

### Solution 3
Compute average of R list: sum = 350, average = 350/64 = 5.46875.
Estimate:
- 2^(avg R) = 2^5.46875 ≈ 44.1
- E = 0.77351 × 64 × 44.1 ≈ 2182
Estimated distinct count ≈ 2.18 × 10^3 users.

### Solution 4
Morris counter uses O(1) memory but has high variance; good for rough scale with low memory. FM with 64 registers uses more memory but has much lower relative error (≈ 1/√m). For daily distinct users (large cardinality), use FM to reduce error. For hourly distinct users where memory budget is tighter and approximate scale is sufficient, a Morris counter can be acceptable, but if accuracy matters for hourly metrics, FM is still preferred since 64 registers is tiny.
Decision: FM for daily distinct; Morris only for coarse, low-stakes hourly estimates.

### Solution 5
Pipeline:
- State per user: rolling sum and count for 1-hour window using time-bucketed queues (e.g., 60 one-minute buckets), plus a per-user FM sketch for 1-day distinct event types.
- Updates: on each event, update the current minute bucket sum/count; expire buckets older than 60 minutes; update FM sketch with hashed event type.
- Leakage-safe churn feature: compute features using only events strictly before the prediction cutoff (e.g., end of day D) and label churn on day D+1. Store features with a watermark to ensure no future events enter the feature window.
Reasoning: time-bucketed state enables one-pass updates; FM gives distinct counts within memory; cutoff and watermark avoid future information leakage.

