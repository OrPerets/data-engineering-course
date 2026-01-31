# Secondary Sort — MapReduce Practice (Step-by-Step)

## Scenario
You need per-user activity timelines ordered by timestamp.
A simple group-by on user ID loses ordering, so you apply secondary sort.
This requires composite keys and custom partitioning/grouping behavior.

## Input Data
### Input tables
User events:

| user_id | ts | event |
|---|---|---|
| U1 | 09:05 | login |
| U2 | 09:01 | login |
| U1 | 09:10 | click |
| U1 | 09:07 | view |
| U2 | 09:03 | click |
| U2 | 09:08 | logout |

### Processing rules
1. Group by `user_id`.
2. Within each user group, order events by `ts` ascending.

## Goal (Expected Output Format)

| user_id | ordered_events |
|---|---|
| U1 | 09:05@login,09:07@view,09:10@click |
| U2 | 09:01@login,09:03@click,09:08@logout |

## Questions

### Q1 — Key/Value Design
What composite key and value should the mapper emit for secondary sort?

### Q2 — Mapper Output (Explicit)
Write mapper outputs for all `U1` rows.

### Q3 — Shuffle / Sort
Show the sorted key order and grouped values the reducer receives for `U1`.

### Q4 — Reducer Logic
Explain how the reducer outputs ordered events without additional sorting.

### Q5 — Final Output (Explicit)
Write the final output lines for all users.

### Q6 — Combiner: Safe or Not?
Is a combiner useful here? Why or why not?

### Q7 — Engineering Insight
Explain the roles of partitioner, grouping comparator, and sort comparator.

---

# Step-by-Step Solution

## A1 — Key/Value Design
**Mapper emits:**
- **Key:** composite `(user_id, ts)`
- **Value:** `event`

This allows sorting by `user_id` then `ts`.

## A2 — Mapper Output
For `U1`:
- ((U1, 09:05), login)
- ((U1, 09:10), click)
- ((U1, 09:07), view)

## A3 — Shuffle / Sort
**Sort comparator:** sorts by `user_id` then `ts` ascending.
**Grouping comparator:** groups by `user_id` only.

Reducer for `U1` receives values in this order:
- key (U1, 09:05) → login
- key (U1, 09:07) → view
- key (U1, 09:10) → click

Grouped as:
U1 → [login, view, click] (already ordered by ts)

## A4 — Reducer Logic
Because the values arrive in time order:
1. Iterate in arrival order.
2. Append `ts@event` to a list.
3. Emit `user_id<TAB>ordered_events`.

## A5 — Final Output
- U1	09:05@login,09:07@view,09:10@click
- U2	09:01@login,09:03@click,09:08@logout

## A6 — Combiner Discussion
A combiner is **not useful** because ordering must be preserved across the full key range.
Partial combining could destroy the global ordering guarantees.

## A7 — Engineering Insight
- **Partitioner:** partitions by `user_id` so all events for a user reach the same reducer.
- **Grouping comparator:** groups keys by `user_id` (ignores `ts`) so reducer runs once per user.
- **Sort comparator:** sorts by `(user_id, ts)` so values arrive in time order.
All three are required for correct secondary sort.

---

## Common Pitfalls
- Grouping by full composite key (reduces per `(user_id, ts)` instead of per user).
- Partitioning by full key (same user split across reducers).
- Sorting by timestamp only (interleaves users).

## Optional Extensions
- Add secondary sort by event type within the same timestamp.
- Emit session boundaries when time gaps exceed a threshold.
- Use a custom writable to pack `(user_id, ts)` efficiently.
