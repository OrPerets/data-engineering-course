# MapReduce: Formal Mappings, Explanations, and Worked Examples

Source: `MR.pptx`

This handout explains the formal MapReduce mappings used in the slides:

1. input records,
2. mapper,
3. intermediate key-value multiset,
4. partitioner,
5. shuffle/grouping,
6. reducer,
7. combiner,
8. common MapReduce patterns.

The goal is to make the notation readable and to show exactly what each function receives and emits.

## 1. Basic Notation

A MapReduce job starts with an input dataset:

$$
\mathcal{D} \in \mathcal{M}(K_1 \times V_1)
$$

where:

| Symbol | Meaning |
|---|---|
| $\mathcal{D}$ | The input dataset. |
| $\mathcal{M}(\cdot)$ | A multiset. Duplicates are allowed and meaningful. |
| $K_1$ | The input-key domain. Example: line number, byte offset, record ID. |
| $V_1$ | The input-value domain. Example: line text, order row, log event. |
| $K_1 \times V_1$ | The set of possible input key-value records. |

An input record is one pair:

$$
(k_1, v_1) \in K_1 \times V_1
$$

The mapper transforms input records into intermediate records:

$$
m : K_1 \times V_1 \to \mathcal{M}(K_2 \times V_2)
$$

The reducer transforms grouped intermediate records into output records:

$$
r : K_2 \times \mathcal{M}(V_2) \to \mathcal{M}(K_3 \times V_3)
$$

## 2. Full MapReduce Job Definition

One complete MapReduce job can be written as four steps.

### Step 1: Map All Records

Apply the mapper to every input record:

$$
I = \biguplus_{(k_1,v_1) \in \mathcal{D}} m(k_1,v_1)
$$

where:

| Symbol | Meaning |
|---|---|
| $I$ | The full multiset of intermediate key-value pairs. |
| $\biguplus$ | Multiset union. If the same pair appears many times, all occurrences are kept. |
| $m(k_1,v_1)$ | The mapper output for one input record. |

Important point: the mapper may emit zero, one, or many pairs for a single input record.

### Step 2: Partition by Intermediate Key

Each intermediate key is assigned to one reducer:

$$
p(k_2) = h(k_2) \bmod R
$$

where:

| Symbol | Meaning |
|---|---|
| $p(k_2)$ | The reducer partition for key $k_2$. |
| $h(k_2)$ | A hash function applied to the intermediate key. |
| $R$ | Number of reducers. |

Correctness invariant:

> Every occurrence of the same key $k_2$ must reach the same reducer.

### Step 3: Shuffle and Group Values

After partitioning, all values with the same intermediate key are grouped:

$$
G(k_2) = [v_2 : (k_2,v_2) \in I]
$$

where:

| Symbol | Meaning |
|---|---|
| $G(k_2)$ | The list or multiset of all values associated with key $k_2$. |
| $[v_2 : (k_2,v_2) \in I]$ | "Collect every value $v_2$ whose key is $k_2$." |

This is the expensive phase because data moves across the network and large groups may spill to disk.

### Step 4: Reduce Each Group

The reducer is applied once per grouped key:

$$
O = \biguplus_{k_2} r(k_2, G(k_2))
$$

where:

| Symbol | Meaning |
|---|---|
| $O$ | Final output multiset. |
| $r(k_2,G(k_2))$ | Reducer output for one complete key group. |

The job finishes only when the slowest reducer finishes.

## 3. Mapper: Definition and Example

The mapper chooses the intermediate key. This is the most important design decision in many MapReduce jobs, because it determines how data will be grouped later.

Formal definition:

$$
m : K_1 \times V_1 \to \mathcal{M}(K_2 \times V_2)
$$

Read this as:

> The mapper receives one input pair $(k_1,v_1)$ and emits a multiset of intermediate pairs $(k_2,v_2)$.

### Mapper Example: Word Count

Input dataset:

$$
\mathcal{D} =
\{
(0,\text{"A B R"}),
(1,\text{"C C R"}),
(2,\text{"A C B"})
\}
$$

Domains:

| Component | Value in this example |
|---|---|
| $K_1$ | Line number or byte offset. |
| $V_1$ | Line text. |
| $K_2$ | Word/token. |
| $V_2$ | Count contribution, always $1$. |

Mapper rule:

$$
m(k_1, \text{line}) = \{(w,1) : w \in \text{tokens(line)}\}
$$

Concrete mapping:

| Input $(k_1,v_1)$ | Mapper output $m(k_1,v_1)$ |
|---|---|
| $(0,\text{"A B R"})$ | $\{(A,1),(B,1),(R,1)\}$ |
| $(1,\text{"C C R"})$ | $\{(C,1),(C,1),(R,1)\}$ |
| $(2,\text{"A C B"})$ | $\{(A,1),(C,1),(B,1)\}$ |

Intermediate multiset:

$$
I = \{(A,1),(B,1),(R,1),(C,1),(C,1),(R,1),(A,1),(C,1),(B,1)\}
$$

Important observation: duplicate pairs are not removed. For example, $(C,1)$ appears three times because the word `C` appears three times.

## 4. Shuffle/Grouping: Definition and Example

The shuffle groups all intermediate values by their intermediate key.

Formal grouping:

$$
G(k_2) = [v_2 : (k_2,v_2) \in I]
$$

### Shuffle Example: Word Count

From the intermediate multiset:

$$
I = \{(A,1),(B,1),(R,1),(C,1),(C,1),(R,1),(A,1),(C,1),(B,1)\}
$$

the shuffle produces:

| Intermediate key $k_2$ | Group $G(k_2)$ |
|---|---|
| $A$ | $[1,1]$ |
| $B$ | $[1,1]$ |
| $C$ | $[1,1,1]$ |
| $R$ | $[1,1]$ |

The shuffle does not compute the final answer. It only guarantees that each reducer receives a complete group for one key.

## 5. Reducer: Definition and Example

The reducer receives one key and all values for that key.

Formal definition:

$$
r : K_2 \times \mathcal{M}(V_2) \to \mathcal{M}(K_3 \times V_3)
$$

Read this as:

> The reducer receives $(k_2,G(k_2))$ and emits zero, one, or many final output pairs $(k_3,v_3)$.

### Reducer Example: Word Count

Reducer rule:

$$
r(w,[1,\ldots,1]) = \{(w,\sum_i 1)\}
$$

Concrete reduction:

| Reducer input $(k_2,G(k_2))$ | Reducer output |
|---|---|
| $(A,[1,1])$ | $(A,2)$ |
| $(B,[1,1])$ | $(B,2)$ |
| $(C,[1,1,1])$ | $(C,3)$ |
| $(R,[1,1])$ | $(R,2)$ |

Final output:

$$
O = \{(A,2),(B,2),(C,3),(R,2)\}
$$

## 6. Worked Mapping: Orders Per Customer

Business question:

> How many orders did each customer place?

Input dataset:

| OrderID | CustomerID | Amount |
|---|---|---:|
| O1 | C1 | 120 |
| O2 | C2 | 80 |
| O3 | C1 | 50 |
| O4 | C3 | 200 |
| O5 | C1 | 30 |

### Mapper

Input record:

$$
(k_1,v_1) = (\text{OrderID}, \text{order row})
$$

Mapper rule:

$$
m(\text{OrderID}, \text{row}) = \{(\text{CustomerID},1)\}
$$

Concrete mapper output:

$$
I = \{(C1,1),(C2,1),(C1,1),(C3,1),(C1,1)\}
$$

### Shuffle

$$
G(C1) = [1,1,1], \quad G(C2) = [1], \quad G(C3) = [1]
$$

### Reducer

Reducer rule:

$$
r(c,[1,\ldots,1]) = \{(c,\sum_i 1)\}
$$

Final output:

$$
O = \{(C1,3),(C2,1),(C3,1)\}
$$

SQL equivalent:

```sql
SELECT CustomerID, COUNT(*)
FROM Orders
GROUP BY CustomerID;
```

## 7. Combiner: Definition and Example

A combiner is a local pre-aggregation function. It runs after the mapper and before the shuffle, usually on the same machine as the mapper.

Formal role:

$$
c : K_2 \times \mathcal{M}(V_2) \to \mathcal{M}(K_2 \times V_2)
$$

The combiner has the same key domain as the reducer because it reduces local duplicate intermediate keys before network transfer.

### Combiner Example: Local Order Count

Suppose one mapper emits:

$$
\{(C1,1),(C1,1),(C2,1)\}
$$

Without combiner, all three pairs are sent through shuffle.

With combiner:

$$
c(C1,[1,1]) = \{(C1,2)\}
$$

$$
c(C2,[1]) = \{(C2,1)\}
$$

Combiner output:

$$
\{(C1,2),(C2,1)\}
$$

The number of pairs sent over the network drops from 3 to 2 for this mapper.

### Combiner Validity Rule

A combiner is safe only when partial results can be merged without changing the final answer.

Usually safe:

| Operation | Why safe? |
|---|---|
| Sum | Partial sums can be summed again. |
| Count | Partial counts can be summed again. |
| Min | Minimum of local minima is the global minimum. |
| Max | Maximum of local maxima is the global maximum. |

Usually unsafe directly:

| Operation | Why unsafe directly? |
|---|---|
| Median | Local medians do not determine global median. |
| Exact distinct count | Local distinct counts cannot simply be summed if values overlap. |
| Naive average | Average of local averages is wrong when local group sizes differ. |

## 8. Combiner Counterexample: Wrong Average

Goal:

> Compute average handle time per support agent.

Input for agent `A1`:

| Mapper | Values seen for A1 |
|---|---|
| Mapper 1 | $6,4$ |
| Mapper 2 | $20$ |

### Wrong Design

Mapper 1 computes local average:

$$
(6+4)/2 = 5
$$

Mapper 2 computes local average:

$$
20/1 = 20
$$

Reducer averages the two local averages:

$$
(5+20)/2 = 12.5
$$

But the true average is:

$$
(6+4+20)/3 = 10
$$

This fails because the two local averages represent different numbers of records.

## 9. Correct Average Mapping: Carry Sum and Count

To make average safe, the intermediate value must carry enough information.

Mapper rule:

$$
m(\text{CallID}, \text{row}) = \{(\text{AgentID},(\text{HandleTime},1))\}
$$

For values $6,4,20$ for `A1`:

$$
I = \{(A1,(6,1)),(A1,(4,1)),(A1,(20,1))\}
$$

Combiner output:

$$
\text{Mapper 1: } (A1,(10,2))
$$

$$
\text{Mapper 2: } (A1,(20,1))
$$

Reducer input:

$$
(A1,[(10,2),(20,1)])
$$

Reducer rule:

$$
r(a,[(s_1,n_1),\ldots,(s_t,n_t)])
=
\left\{
\left(a,\frac{\sum_i s_i}{\sum_i n_i}\right)
\right\}
$$

Final output:

$$
(A1,10)
$$

Key lesson:

> If the naive aggregation is not safely mergeable, change the intermediate value type so it preserves the state required for correct global aggregation.

## 10. Reduce-Side Join Mapping

Business question:

> Enrich each order with the customer's segment.

Inputs:

| Dataset | Records |
|---|---|
| Orders | $(O1,C1,120)$, $(O2,C2,80)$ |
| Customers | $(C1,\text{Enterprise})$, $(C2,\text{SMB})$ |

SQL equivalent:

```sql
SELECT *
FROM Orders o
JOIN Customers c
  ON o.CustomerID = c.CustomerID;
```

### Mapper

The mapper tags each record by source and keys by `CustomerID`.

Orders:

$$
m(O1,(C1,120)) = \{(C1,(\mathrm{O},O1,120))\}
$$

$$
m(O2,(C2,80)) = \{(C2,(\mathrm{O},O2,80))\}
$$

Customers:

$$
m(C1,\text{Enterprise}) = \{(C1,(\mathrm{C},\text{Enterprise}))\}
$$

$$
m(C2,\text{SMB}) = \{(C2,(\mathrm{C},\text{SMB}))\}
$$

Intermediate multiset:

$$
I =
\{
(C1,(\mathrm{O},O1,120)),
(C2,(\mathrm{O},O2,80)),
(C1,(\mathrm{C},\text{Enterprise})),
(C2,(\mathrm{C},\text{SMB}))
\}
$$

### Shuffle

$$
G(C1) = [(\mathrm{O},O1,120),(\mathrm{C},\text{Enterprise})]
$$

$$
G(C2) = [(\mathrm{O},O2,80),(\mathrm{C},\text{SMB})]
$$

### Reducer

Reducer logic:

1. Separate order records tagged `"O"` from customer records tagged `"C"`.
2. Match all orders with the customer segment in the same group.
3. Emit enriched order records.

Final output:

$$
O =
\{
(O1,C1,120,\text{Enterprise}),
(O2,C2,80,\text{SMB})
\}
$$

Cost implication:

> Reduce-side join shuffles both tables. Use it when both tables are large or when neither table fits comfortably in mapper memory.

## 11. Broadcast / Map-Side Join Mapping

Broadcast join is a different execution plan for the same logical join.

Use it when:

> One table is small enough to copy to every mapper.

Example:

| Table | Size |
|---|---:|
| Orders | 2 TB |
| Customers lookup | 10 MB |

Mapping idea:

1. Load the small table (`Customers`) into memory on every mapper.
2. Stream the large table (`Orders`) through the mapper.
3. For each order, lookup the customer locally.
4. Emit the joined result directly.

Mapper:

$$
m(O1,(C1,120)) = \{(O1,C1,120,\text{Enterprise})\}
$$

No global shuffle is needed for the large table.

Cost implication:

> Broadcast join can eliminate the main join shuffle, but it fails when the "small" table no longer fits in memory.

## 12. Salting Mapping for a Hot Key

Data skew occurs when one key has far more records than other keys.

Example:

$$
G(C1) \text{ has } 100{,}000{,}000 \text{ values}
$$

A normal shuffle sends all `C1` records to one reducer, causing one overloaded reducer.

### Stage 1: Salted Mapper

Choose a salt bucket count $S=10$.

Instead of emitting:

$$
(C1,1)
$$

emit one of:

$$
(C1\#0,1), (C1\#1,1), \ldots, (C1\#9,1)
$$

Formal salted key:

$$
k_2' = (k_2, \text{salt})
$$

where:

$$
\text{salt} \in \{0,\ldots,S-1\}
$$

Stage 1 reducer output:

$$
(C1\#0,\text{partial}_0), \ldots, (C1\#9,\text{partial}_9)
$$

### Stage 2: Remove Salt and Aggregate

Stage 2 mapper removes the salt:

$$
m(C1\#i,\text{partial}_i) = \{(C1,\text{partial}_i)\}
$$

Stage 2 reducer merges partials:

$$
r(C1,[\text{partial}_0,\ldots,\text{partial}_9])
=
\{(C1,\sum_i \text{partial}_i)\}
$$

Trade-off:

> Salting adds a second aggregation stage, but it prevents one reducer from owning the full hot key.

## 13. Cost and Runtime Formulas

### Shuffle Cost

$$
C_{\mathrm{shuffle}} = E \cdot s
$$

where:

| Symbol | Meaning |
|---|---|
| $E$ | Number of emitted intermediate key-value pairs. |
| $s$ | Average serialized size of one pair in bytes. |

Optimization target:

> Reduce $E$ with filtering, combiners, or in-mapper aggregation; reduce $s$ with compact keys and values.

### Runtime Decomposition

$$
T_{\mathrm{total}} = T_{\mathrm{map}} + T_{\mathrm{shuffle}} + T_{\mathrm{reduce}}
$$

Practical interpretation:

| Stage | What usually matters |
|---|---|
| Map | Local CPU and disk read. Usually scales well. |
| Shuffle | Network, disk spill, serialization, merge. Often dominant. |
| Reduce | Size of largest key group. Slowest reducer controls job completion. |

### Skew Imbalance Ratio

One simple skew metric:

$$
\rho = \frac{\max_r B_r}{\mathrm{median}_r B_r}
$$

where $B_r$ is the input bytes received by reducer $r$.

High $\rho$ means one reducer is receiving much more data than a typical reducer.

## 14. Determinism and Retry Safety

MapReduce assumes failed tasks can be retried on another worker. Therefore:

> A mapper or reducer must produce the same output when rerun on the same input.

Avoid inside mappers and reducers:

| Risk | Why it is dangerous |
|---|---|
| Current timestamp | Retry may produce a different value. |
| Random values without fixed seeds | Same input can produce different output. |
| Hidden mutable shared state | Different workers may see different state. |
| Non-idempotent external writes | Retry can duplicate side effects. |

If a KPI changes only because the job was rerun, the pipeline is not production reliable.

## 15. Summary Table of MapReduce Components

| Component | Formal view | Plain explanation | Example |
|---|---|---|---|
| Input dataset | $\mathcal{D} \in \mathcal{M}(K_1 \times V_1)$ | Multiset of input records. | Lines of text; order rows. |
| Mapper | $m:K_1 \times V_1 \to \mathcal{M}(K_2 \times V_2)$ | Emits intermediate pairs from each input record. | `"A B"` -> $(A,1),(B,1)$ |
| Intermediate output | $I = \biguplus m(k_1,v_1)$ | All mapper outputs together. | All emitted word-count pairs. |
| Partitioner | $p(k_2)=h(k_2)\bmod R$ | Assigns each key to one reducer. | `hash("A") mod R`. |
| Shuffle/group | $G(k_2)=[v_2:(k_2,v_2)\in I]$ | Collects all values for the same key. | $A -> [1,1]$ |
| Reducer | $r:K_2 \times \mathcal{M}(V_2) \to \mathcal{M}(K_3 \times V_3)$ | Aggregates one complete key group. | $A,[1,1] -> (A,2)$ |
| Combiner | $c:K_2 \times \mathcal{M}(V_2) \to \mathcal{M}(K_2 \times V_2)$ | Local pre-aggregation before shuffle. | $(C1,1),(C1,1) -> (C1,2)$ |
| Salting | $k_2'=(k_2,\text{salt})$ | Splits hot keys across reducers. | `C1` -> `C1#0` ... `C1#9`. |

## 16. Checklist for Solving a MapReduce Mapping Question

When asked to design or explain a MapReduce job, answer in this order:

1. Define the input dataset $\mathcal{D}$.
2. State what $K_1$ and $V_1$ are.
3. Define the mapper output key $K_2$ and value $V_2$.
4. Write the mapper rule $m(k_1,v_1)$.
5. Show concrete mapper outputs for a small example.
6. Group the mapper outputs by key to show shuffle output $G(k_2)$.
7. Write the reducer rule $r(k_2,G(k_2))$.
8. Show final output $O$.
9. Decide whether a combiner is safe.
10. Discuss shuffle cost, skew risk, and retry determinism.
