# PageRank Algorithm

## Learning Goal

- Build PageRank from the beginning: graphs, terms, iteration, Markov chains, damping, and MapReduce.
- Core idea: a page is important if important pages link to it.
- Engineering idea: each iteration is a large distributed aggregation over graph edges.

---

## Why PageRank Exists

- Search engines must rank pages, not only match query words.
- Text matching alone can be gamed by keyword repetition.
- Useful pages may not use exactly the same wording as the query.
- Link structure adds evidence: important pages point to other important pages.
- PageRank estimates structural importance from the directed web graph.

---

## Part 1: Graphs

The language PageRank is built on.

---

## What Is a Graph?

- A graph represents objects and relationships.
- Vertices / nodes are the objects.
- Edges are the relationships.

[[EQ:GRAPH_DEF]]

**Meaning:** `V` is the set of vertices; `E` is the set of edges.

---

## Directed Web Graph

- An undirected edge means mutual connection.
- A directed edge has a source and destination.
- A web link is directed: `A -> B` does not imply `B -> A`.
- PageRank operates on a directed graph.

[[EQ:WEB_GRAPH]]

---

## Neighbors, Inlinks, and Outlinks

- Outlinks: pages that `p` links to.
- Inlinks: pages that link to `p`.
- Out-degree: number of outgoing links.
- In-degree: number of incoming links.

[[EQ:GAMMA_DEF]]

[[EQ:OUTDEG_DEF]]

---

## PageRank Terms

- `PR(p)` is the structural importance score of page `p`.
- Higher rank means higher structural importance.
- Ranks are usually normalized so total rank is `1`.

[[EQ:RANK_SUM]]

**Interpretation:** PageRank can be treated as a probability distribution over pages.

---

## Rank Flow, Initialization, and Convergence

- Rank flow: each page distributes current rank equally among outlinks.

[[EQ:RANK_FLOW]]

- Equal initialization:

[[EQ:INITIAL_RANK]]

- Stop when the total change becomes small:

[[EQ:CONVERGENCE]]

---

## Part 2: First Algorithm

Rank flows through outgoing links.

---

## Simple PageRank Update

[[EQ:SIMPLE_UPDATE]]

- The new rank of page `p` sums contributions from pages that link to `p`.
- A page with many outlinks divides its rank across those outlinks.
- This first version assumes every page has at least one outlink.

---

## Simple Pseudocode

```text
initialize PR[p] = 1 / N for every page p

repeat until convergence:
    newPR[p] = 0 for every page p

    for each page q:
        contribution = PR[q] / number_of_outlinks(q)
        for each outlink p of q:
            newPR[p] += contribution

    PR = newPR
```

---

## What the Algorithm Is Doing

1. **Distribute:** every page sends rank mass to its out-neighbors.
2. **Collect:** every page sums the rank mass it receives from in-neighbors.

**Example:** A page with two outgoing links sends half of its current rank to each target.

---

## Numerical Example: Graph

[[EQ:EXAMPLE_V]]

[[EQ:EXAMPLE_EDGES]]

| Page | Outlinks | Out-degree |
|---|---|---:|
| A | `[B, C]` | 2 |
| B | `[C]` | 1 |
| C | `[A]` | 1 |

---

## Example Neighbors and Initialization

[[EQ:EXAMPLE_GAMMA]]

[[EQ:EXAMPLE_OUTDEG]]

[[EQ:EXAMPLE_INIT]]

---

## Iteration 1: Distribute Rank

[[EQ:ITER1_DISTRIBUTE]]

**Principle:** outgoing rank is split equally across outgoing links.

---

## Iteration 1: Collect Contributions

[[EQ:ITER1_COLLECT]]

| Page | `PR0` | Incoming contributions | `PR1` |
|---|---:|---|---:|
| A | `1/3` | from C: `1/3` | `1/3 = 0.3333` |
| B | `1/3` | from A: `1/6` | `1/6 = 0.1667` |
| C | `1/3` | from A: `1/6`, from B: `1/3` | `1/2 = 0.5000` |

---

## Iteration 2: Distribute Rank

Input ranks:

[[EQ:ITER2_INPUT]]

Distribution:

[[EQ:ITER2_DISTRIBUTE]]

---

## Iteration 2: Collect Contributions

[[EQ:ITER2_COLLECT]]

| Page | `PR1` | Incoming contributions | `PR2` |
|---|---:|---|---:|
| A | `1/3` | from C: `1/2` | `1/2 = 0.5000` |
| B | `1/6` | from A: `1/6` | `1/6 = 0.1667` |
| C | `1/2` | from A: `1/6`, from B: `1/6` | `1/3 = 0.3333` |

---

## Reading the Result

- After iteration 1, page `C` becomes strong because both `A` and `B` link to it.
- After iteration 2, page `A` becomes strong because strong page `C` links to it.
- The algorithm keeps moving rank through the graph.
- The final PageRank values are the stable scores produced by repeated flow.

---

## Part 3: Markov Chains

The probability view of PageRank.

---

## Random Surfer Interpretation

1. The user is currently on some page.
2. The user chooses one outgoing link uniformly at random.
3. The user moves to the linked page.
4. This repeats many times.

**PageRank score:** the long-run probability that the random surfer is on that page.

---

## What Is a Markov Chain?

- A Markov chain is a probabilistic process.
- The next state depends only on the current state, not the full history.
- For PageRank, states are pages and transitions are hyperlinks.
- If a page has three outlinks, each transition probability is `1/3`.

---

## Transition Matrix

For the example graph, define `M` as:

[[EQ:TRANSITION_DEF]]

Rows are destination pages; columns are source pages.

[[EQ:TRANSITION_MATRIX]]

---

## Matrix Update and Stationary Distribution

PageRank update:

[[EQ:MATRIX_UPDATE]]

At convergence:

[[EQ:STATIONARY]]

- The stable vector is a stationary distribution.
- It is also an eigenvector of `M` with eigenvalue `1`.

---

## Bridge to Data Engineering

PageRank has two equivalent views:

- Iterative graph algorithm: pages send messages along edges.
- Linear algebra: repeated sparse matrix-vector multiplication.

Both views matter for distributed systems.

---

## Part 4: Why the Simple Algorithm Is Not Enough

The web graph is messy.

---

## Dangling Nodes

- A dangling node is a page with no outlinks.
- The simple formula does not know where to send its rank.

[[EQ:DANGLING]]

**Problem:** if `D` has rank `0.25`, that rank disappears unless handled. This is rank leakage.

---

## Spider Traps and Disconnected Components

- A spider trap is a group of pages that point only to each other.
- Once the random surfer enters the trap, the simple algorithm may keep the surfer there forever.
- The web also contains separate communities, isolated pages, and weakly connected regions.
- A robust ranking algorithm must work even when the graph is messy.

---

## Part 5: Damping

Making PageRank robust on real web graphs.

---

## What Is Damping?

- With probability `d`, the surfer follows an outgoing link.
- With probability `1-d`, the surfer teleports to a random page.
- The parameter `d` is the damping factor.

[[EQ:DAMPING_VALUE]]

**Interpretation:** follow links 85% of the time; teleport 15% of the time.

---

## Why Damping Helps

- Prevents rank from getting stuck permanently in spider traps.
- Gives dangling-node rank a principled way to re-enter the graph.
- Makes every page reachable with positive probability.
- Helps guarantee a unique stable PageRank vector.

---

## Damped Update Formula

Let `N` be the number of pages, `d` the damping factor, and `M_t` the total dangling-node rank mass.

[[EQ:DAMPED_FORMULA]]

Three parts: teleportation mass, normal link contribution, and dangling-node redistribution.

---

## Damped Numerical Example: Setup

Use four pages:

[[EQ:DAMPED_GRAPH]]

Initialize:

[[EQ:DAMPED_INIT]]

---

## Damped Example: Terms

Dangling mass:

[[EQ:DANGLING_MASS]]

Equal dangling share:

[[EQ:DANGLING_SHARE]]

Teleportation term:

[[EQ:TELEPORT]]

---

## Damped Example: Incoming Contributions

[[EQ:INCOMING]]

Apply the damped update:

[[EQ:DAMPED_APPLY]]

---

## Damped Example: Output

| Page | Link contribution | Dangling share | Formula | `PR1` |
|---|---:|---:|---|---:|
| A | 0.2500 | 0.0625 | `0.0375 + 0.85(0.3125)` | 0.3031 |
| B | 0.1250 | 0.0625 | `0.0375 + 0.85(0.1875)` | 0.1969 |
| C | 0.3750 | 0.0625 | `0.0375 + 0.85(0.4375)` | 0.4094 |
| D | 0.0000 | 0.0625 | `0.0375 + 0.85(0.0625)` | 0.0906 |

---

## Damped Example: Rank Mass Check

[[EQ:DAMPED_TOTAL]]

The ranks still sum to `1.0000`, so no rank mass leaked.

---

## Part 6: PageRank as a Distributed Data Problem

Scaling one PageRank iteration.

---

## Why PageRank Needs Distributed Computing

- The web graph can contain billions of pages.
- The edge list can contain many billions of links.
- The graph is sparse but too large for one machine.
- PageRank is iterative: the full graph is processed many times.
- This makes PageRank natural for MapReduce and distributed data systems.

---

## Data Representation

Each page can be represented as:

[[EQ:RECORD]]

| Page | Current rank | Adjacency list |
|---|---:|---|
| A | 0.25 | `[B, C]` |
| B | 0.25 | `[C]` |
| C | 0.25 | `[A]` |
| D | 0.25 | `[]` |

---

## Part 7: MapReduce Version of PageRank

One PageRank iteration becomes one distributed job.

---

## High-Level Plan

1. Map: each page emits rank contributions to its outlinks.
2. Map: each page also emits its adjacency list to preserve graph structure.
3. Shuffle: contributions are grouped by destination page.
4. Reduce: each page sums incoming contributions and applies the damped formula.
5. Repeat: run another iteration using the new ranks.

---

## PageRank MapReduce Flow

![](../../diagrams/week7/week7_pagerank_iteration_flow.png){width=86%}

---

## Mapper: Inputs and Contributions

Input:

[[EQ:MAPPER_INPUT]]

If `p` has outlinks:

[[EQ:MAPPER_EMIT]]

---

## Mapper: Structure and Dangling Nodes

Also preserve graph structure:

[[EQ:MAPPER_STRUCTURE]]

If `p` is dangling:

[[EQ:MAPPER_DANGLING]]

---

## Reducer: Inputs and Sum

Reducer input for page `p`:

[[EQ:REDUCER_INPUT]]

Values contain numeric contributions and one adjacency list.

[[EQ:SUM_IN]]

---

## Reducer: Update and Emit

[[EQ:REDUCER_UPDATE]]

Reducer emits:

[[EQ:REDUCER_EMIT]]

---

## Formal MapReduce Pseudocode

```text
map(page p, rank r, adjacency list L):
    emit(p, STRUCTURE(L))
    if L is empty:
        add r to DANGLING_MASS
    else:
        c = r / length(L)
        for each destination q in L:
            emit(q, CONTRIBUTION(c))
```

---

## Combiner and Reducer Pseudocode

```text
combine(page p, values):
    sum numeric CONTRIBUTION values
    pass STRUCTURE values unchanged

reduce(page p, values):
    L = adjacency list from STRUCTURE value
    s = sum all CONTRIBUTION values
    newRank = (1-d)/N + d*(s + DANGLING_MASS/N)
    emit(p, newRank, L)
```

---

## Step-by-Step MapReduce Example: Input

| Page | Rank | Outlinks |
|---|---:|---|
| A | 0.25 | `[B, C]` |
| B | 0.25 | `[C]` |
| C | 0.25 | `[A]` |
| D | 0.25 | `[]` |

---

## Step-by-Step Map Output

| Source | Emitted key | Emitted value |
|---|---|---|
| A | B | contribution 0.125 |
| A | C | contribution 0.125 |
| A | A | structure `[B, C]` |
| B | C | contribution 0.250 |
| B | B | structure `[C]` |
| C | A | contribution 0.250 |
| C | C | structure `[A]` |
| D | D | structure `[]` |
| D | global | dangling mass 0.250 |

---

## After Shuffle

| Key | Values |
|---|---|
| A | contribution 0.250, structure `[B, C]` |
| B | contribution 0.125, structure `[C]` |
| C | contribution 0.125, contribution 0.250, structure `[A]` |
| D | structure `[]` |

---

## Reducer Output

| Page | New rank | Preserved structure |
|---|---:|---|
| A | 0.3031 | `[B, C]` |
| B | 0.1969 | `[C]` |
| C | 0.4094 | `[A]` |
| D | 0.0906 | `[]` |

---

## Engineering Notes: Combiner and Dangling Mass

- Combiner: safe for numeric contribution sums because addition is associative and commutative.
- The combiner must not discard the adjacency list.
- Dangling mass can be tracked by a counter, special key, or separate aggregation job.
- If counters are integer-only, store scaled values:

[[EQ:SCALED_DANGLING]]

---

## Engineering Notes: Convergence, Cost, and Skew

- Reducers can emit the absolute rank difference:

[[EQ:CONVERGENCE_DIFF]]

- Another aggregation step can sum these values to test convergence.
- Each iteration scans the full graph and shuffles one contribution per edge:

[[EQ:SHUFFLE_COST]]

- Popular pages can create reducer skew; mitigate with two-stage aggregation.

---

## Summary

- A web graph is directed: pages are nodes, links are edges.
- Basic PageRank repeatedly sends each page's rank through outgoing links.
- PageRank is also a Markov chain: ranks are long-run visit probabilities.
- Damping adds teleportation, handles dangling nodes, and prevents rank traps.
- MapReduce implements each iteration as contribution emission, shuffle, and reduction.

---

## Practice Questions

1. Given pages `A,B,C,D` with links `A->B`, `B->C`, `C->A`, and `D->C`, compute one simple PageRank iteration from equal initialization.
2. For the same graph, write the transition matrix `M`.
3. Add damping with `d=0.85`. If there are no dangling nodes, what changes in the formula?
4. Explain why the adjacency list must be passed through the mapper and reducer.
5. Suppose one page receives `40%` of all graph links. What bottleneck might appear, and how could you reduce it?
