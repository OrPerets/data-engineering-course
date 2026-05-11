# Week 9: Text Analytics for Industrial Engineering & Management: Advanced

---

## Purpose

- Build on Week 8 by adding order-aware text features, regex extraction at scale, and embeddings.
- Distinguish n-grams as TF-IDF features from n-gram language models with a Markov assumption.
- Choose the right method for operational text problems while controlling cost, skew, and drift.

---

## Learning Objectives

- Define word n-grams and compute how many n-grams a document produces.
- Explain an n-gram language model as an `(n-1)`-order Markov model.
- Apply TF-IDF to n-grams and explain the SQL/data-pipeline cost.
- Combine regex extraction with free-text features without mixing incompatible denominators.
- Explain when embeddings add value and what operational monitoring they require.

---

## Recall from Week 8

- TF-IDF ranks terms using local frequency and global rarity.
- Regex and normalization define the terms before the formulas ever run.
- Stable corpus and tokenizer versions are required for comparable rankings.
- Week 9 asks: what happens when single words are not enough?

---

## Why Unigrams Are Sometimes Not Enough

| Text | Unigram problem | Needed context |
|---|---|---|
| `not working` | `working` looks positive alone | negation |
| `memory leak` | `memory` is too broad | technical phrase |
| `late payment` | `late` and `payment` separate are weaker | business event |

- N-grams preserve local word order while staying simpler than full sequence models.

---

## Two Meanings of N-grams

- **N-gram feature:** a contiguous token sequence used as a feature, e.g., `not working`.
- **N-gram language model:** a probabilistic model for token sequences using a Markov assumption.
- The same counted phrases can support both ideas, but they answer different questions.

---

## N-gram Features: Definition

- A word n-gram is a contiguous sequence of `n` tokens.
- A unigram has `n=1`, a bigram has `n=2`, and a trigram has `n=3`.
- For document length `L`, the number of n-gram windows is:

$$
\max(L-n+1,0)
$$

---

## N-gram Feature Example

| Tokens | Bigrams | Trigrams |
|---|---|---|
| `not working today` | `not working`, `working today` | `not working today` |
| `vpn not responding` | `vpn not`, `not responding` | `vpn not responding` |

- Bigrams capture short local relationships.
- Trigrams capture more context but produce fewer repeated matches.

---

## N-gram Feature Growth

$$
|V_n| \le |V|^n
$$

- `|V|` is the unigram vocabulary size.
- The bound is theoretical; observed corpus n-grams are usually much fewer.
- The warning is still real: increasing `n` expands storage, shuffle, and model-feature space.

---

## N-grams as TF-IDF Features

- Replace `term` with `ngram` in the TF-IDF pipeline.
- The TF denominator should be the number of n-gram windows in the document, not raw token length.
- Example: `not working today` has two bigram windows, so `tf("not working",d)=1/2`.

---

## N-gram Language Model: Definition

- A language model assigns probability to a token sequence.
- An n-gram language model assumes the next token depends only on the previous `n-1` tokens.
- This is an `(n-1)`-order Markov assumption over tokens.

---

## N-gram Markov Formula

For a token sequence `w_1, ..., w_T`:

$$
P(w_{1:T})=\prod_{t=1}^{T}P(w_t\mid w_{1:t-1})
\approx
\prod_{t=1}^{T}P(w_t\mid w_{t-n+1:t-1})
$$

- Bigram model: first-order Markov, depends on one previous token.
- Trigram model: second-order Markov, depends on two previous tokens.

---

## Count-Based Probability Estimate

Let `h` be the history of length `n-1`.

$$
\hat P(w\mid h)=\frac{c(h,w)}{c(h)}
$$

- `c(h,w)` counts how often word `w` follows history `h`.
- `c(h)` counts how often the history appears.
- Without smoothing, unseen n-grams receive probability 0.

---

## Markov Example Corpus

```text
<s> not working </s>
<s> working now </s>
<s> not responding </s>
<s> not working </s>
```

- `<s>` and `</s>` mark sentence boundaries.
- Boundary tokens make sequence probabilities well-defined.
- The corpus is intentionally small so the probabilities can be computed by hand.

---

## Bigram Probability Example

$$
P(\text{not}\mid \langle s\rangle)=\frac{3}{4}
$$

$$
P(\text{working}\mid \text{not})=\frac{2}{3}
$$

$$
P(\langle /s\rangle\mid \text{working})=\frac{2}{3}
$$

- The model learned that `not` often starts a sentence and often leads to `working` or `responding`.

---

## Sentence Probability Example

$$
P(\text{not working } \langle /s\rangle \mid \langle s\rangle)
=\frac{3}{4}\times\frac{2}{3}\times\frac{2}{3}
=\frac{1}{3}
$$

- This is a language-model use of n-grams.
- It is different from using `not working` as a TF-IDF feature.
- Both depend on preprocessing and corpus counts.

---

## Smoothing and Backoff

- Zero probability is too harsh for unseen but plausible phrases.
- Smoothing adds small probability mass to unseen events.
- Backoff uses a shorter history when the longer n-gram is rare or unseen.
- In engineering systems, smoothing choices must be versioned like any other feature rule.

---

## N-gram SQL-Lens

```sql
-- conceptual window generation
SELECT
  doc_id,
  token || ' ' || LEAD(token) OVER (
    PARTITION BY doc_id ORDER BY position
  ) AS bigram
FROM tokens;
```

- Real implementations must remove the final null bigram per document.
- Window generation expands rows and increases shuffle volume.
- Token order must be deterministic inside each document.

---

## N-gram Pipeline Stages

1. Tokenize and assign stable positions inside each document.
2. Generate n-gram windows with boundary rules.
3. Count `(doc_id, ngram)` pairs.
4. Compute `df(ngram)` across documents.
5. Compute TF-IDF or probability estimates, depending on the objective.

---

## N-gram Operational Hazards

- Common phrases such as `call back`, `not available`, or `thank you` can become hot keys.
- Long `n` increases feature sparsity and reduces repeated counts, limiting combiner benefits.
- Without vocabulary pruning, feature tables grow faster than students usually expect.

---

## N-gram Controls

| Control | Purpose |
|---|---|
| stop-phrase list | remove frequent low-value phrases |
| min-DF threshold | remove one-off noise |
| max-DF threshold | remove phrases that appear everywhere |
| top-K vocabulary freeze | stabilize model inputs for a training window |

- These controls are part of the data contract, not optional cleanup.

---

## Worked Example: Bigram TF-IDF

| call_id | notes | bigrams |
|---|---|---|
| A1 | `not working` | `not working` |
| A2 | `working now` | `working now` |
| A3 | `not responding` | `not responding` |
| A4 | `working fine` | `working fine` |
| A5 | `not working` | `not working` |

- Each document has one bigram window.

---

## Worked Example: Bigram DF and IDF

| Bigram | Documents | DF | IDF |
|---|---|---:|---:|
| `not working` | A1, A5 | 2 | `log(6/3)=0.69` |
| `not responding` | A3 | 1 | `log(6/2)=1.10` |
| `working now` | A2 | 1 | `log(6/2)=1.10` |

- Rare bigrams receive higher IDF under the same smoothing convention as Week 8.

---

## Worked Example: Bigram Interpretation

- `tf("not working",A1)=1/1=1.00`, so TF-IDF is `1.00 x 0.69 = 0.69`.
- `tf("not responding",A3)=1/1=1.00`, so TF-IDF is `1.00 x 1.10 = 1.10`.
- The phrase `not responding` is rarer and may signal a more urgent failure mode.

---

## Regex Plus TF-IDF: Why Combine Them?

- Regex extracts structured variables: days late, error codes, ticket IDs, phone numbers, or amounts.
- TF-IDF ranks the free-text reasons after extraction and masking.
- Combining both gives richer triage: numeric severity plus textual cause.

---

## Regex Plus TF-IDF Pipeline

1. Extract structured fields such as `delay_days`.
2. Mask or remove fields that should not become text features.
3. Build a cleaned reason text for TF-IDF.
4. Compute TF-IDF only on the defined feature text, not on mixed raw fields.

---

## Worked Example: Supplier Delay Input

| supplier_id | comment |
|---|---|
| S1 | `delay 3 days due to customs` |
| S2 | `delay 2 days due to weather` |
| S3 | `delay 10 days due to customs` |
| S4 | `delay due to strike` |
| S5 | `delay 1 day due to weather` |

- Goal: extract delay days and rank reasons.

---

## Worked Example: Extraction Contract

| supplier | `delay_days` | `reason_text` |
|---|---:|---|
| S1 | 3 | `customs` |
| S2 | 2 | `weather` |
| S3 | 10 | `customs` |
| S4 | null | `strike` |
| S5 | 1 | `weather` |

- TF-IDF will be computed only on `reason_text`.
- Therefore each document length is `1` in this example.

---

## Worked Example: Reason TF-IDF

| Reason | DF | IDF | Example TF-IDF |
|---|---:|---:|---:|
| `customs` | 2 | `log(6/3)=0.69` | `1.00 x 0.69 = 0.69` |
| `weather` | 2 | `log(6/3)=0.69` | `1.00 x 0.69 = 0.69` |
| `strike` | 1 | `log(6/2)=1.10` | `1.00 x 1.10 = 1.10` |

- `strike` is the rare reason and should be reviewed even if the day count is missing.

---

## Regex at Scale

- Regex in a local notebook feels cheap; regex in a distributed batch can stall many downstream tasks.
- A single pathological record can cause task timeouts if the pattern has catastrophic backtracking.
- Operational handling matters: timeout, quarantine, alert, and continue when appropriate.

---

## Catastrophic Backtracking

```text
High-risk pattern: (a+)+b
Bad input:         aaaaaaaaaaaaaaaaaaaaa
Problem:           engine tries many ways to partition the same a's
```

- Nested quantifiers and overlapping alternatives are common causes.
- Non-matching inputs can be worse than matching inputs.
- Prefer bounded or linear-time patterns for pipeline code.

---

## Regex Guardrails

- Precompile patterns and test them on normal and adversarial samples.
- Cap maximum input length before running expensive patterns.
- Set per-record timeout or use an engine designed for predictable runtime.
- Quarantine bad records instead of blocking the entire batch.

---

## Embeddings: What They Add

- TF-IDF is sparse and interpretable but mostly lexical.
- Embeddings map words, documents, or queries into dense numeric vectors.
- Similar meanings can be close even when they use different words.
- This helps clustering, semantic search, duplicate-ticket detection, and recommendations.

---

## Embedding Similarity Formula

For vectors `a` and `b`, cosine similarity is:

$$
\cos(a,b)=\frac{a\cdot b}{\|a\|\|b\|}
$$

- Higher cosine similarity means the vectors point in a more similar direction.
- A ticket embedding can be compared against past resolved incidents.
- This is useful when keyword overlap is weak but meaning is similar.

---

## TF-IDF vs Embeddings

| Dimension | TF-IDF | Embeddings |
|---|---|---|
| Interpretability | high | lower |
| Compute cost | usually lower | often higher |
| Semantic matching | lexical | stronger semantic matching |
| Governance | tokenizer and corpus versions | model, tokenizer, vector versioning |

- Use the simpler method when it answers the operational question reliably.

---

## Embedding Operational Risks

- OOV or unknown tokens reduce quality if the model cannot represent new language.
- Embedding model upgrades can shift vector space and break historical comparisons.
- Dense vectors are harder to inspect than TF-IDF terms.
- Monitoring must include OOV rate, version mismatches, and similarity-score drift.

---

## OOV Handling Options

| Option | Behavior | Trade-off |
|---|---|---|
| skip unknown token | ignore it | loses signal |
| `<UNK>` vector | map to fallback | stable but generic |
| subword model | compose from pieces | more robust, more complex |
| retrain/update vocab | learn new terms | governance and cost |

- The chosen policy must be consistent between training and inference.

---

## Method Choice Checklist

- Use **unigram TF-IDF** when keywords are enough and interpretability matters.
- Use **n-gram TF-IDF** when local order changes meaning, such as negation or technical phrases.
- Use **regex extraction** when structured facts are embedded in free text.
- Use **embeddings** when semantic similarity matters more than exact wording.

---

## Case Study: Call-Center Triage

- Method: bigram TF-IDF to distinguish `not working`, `not responding`, and `working now`.
- Failure: common phrases create hot keys in the DF aggregation stage.
- Fallback: stop-phrase filtering and max-DF thresholds before daily dashboards.

---

## Case Study: Manufacturing Defects

- Method: unigram and bigram TF-IDF over defect descriptions.
- Failure: serial numbers and machine IDs explode vocabulary.
- Fallback: extract IDs into structured fields and mask them from text features.

---

## Case Study: Supplier Delays

- Method: regex extracts `delay_days`; TF-IDF ranks cleaned `reason_text`.
- Failure: missing day values and inconsistent phrasing create quality gaps.
- Fallback: data-quality flags plus reason-vocabulary monitoring.

---

## Case Study: Employee Survey Comments

- Method: embeddings cluster semantically similar comments such as workload and burnout.
- Failure: new organizational jargon increases OOV rate or shifts similarity behavior.
- Fallback: track OOV trend and review clusters before managerial action.

---

## Failure Modes Summary

| Failure mode | Symptom | Monitoring signal |
|---|---|---|
| n-gram explosion | feature table grows quickly | vocabulary size and nnz trend |
| hot-key skew | one partition runs much longer | max/median partition load |
| regex catastrophe | tasks stall or timeout | regex timeout rate |
| embedding drift | similarity scores shift | vector-version and score drift |

- These are data-engineering failures, not only modeling failures.

---

## Common Mistake Drill

| Mistake | Correction |
|---|---|
| Saying n-grams themselves are Markov processes | the language model makes the Markov assumption |
| Using token length as bigram TF denominator | use n-gram window count |
| Computing TF-IDF on mixed raw and extracted text | define one feature text field |
| Assuming embeddings always improve results | compare against simpler baselines |

- Precision in definitions prevents bad pipeline designs.

---

## Practice

1. For `not working today`, list all bigrams and compute the bigram TF denominator.
2. From the four-sentence Markov corpus, compute `P(responding | not)`.
3. Write a regex extraction contract for `delay 12 days due to customs`.
4. Choose TF-IDF, n-grams, regex, or embeddings for three operational cases and justify the cost.

---

## Instructor Notes: Flow

- 10 min: Week 8 bridge and why unigrams fail.
- 25 min: n-gram features, n-gram language model, and Markov formula.
- 20 min: bigram TF-IDF example and SQL/data-pipeline costs.
- 15 min: regex plus TF-IDF and regex safety.
- 15 min: embeddings and method selection.
- 10 min: failure modes and practice.

---

## Instructor Notes: Blackboard Flow

1. Write `not working today` and mark the bigram windows.
2. Write the Markov approximation and contrast bigram vs trigram.
3. Compute the supplier delay extraction table and explain the TF denominator.
4. Draw the method-choice ladder: regex fields, TF-IDF terms, n-gram phrases, embeddings.

---

## Sources Used (Reference Only)

- `sources/text1.md`
- `sources/text2.md`
- `README.md`
