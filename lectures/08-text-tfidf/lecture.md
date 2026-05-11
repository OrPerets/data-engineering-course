# Week 8: Text Analytics for Industrial Engineering & Management: TF-IDF Fundamentals

---

## Purpose

- Treat text as an operational data source: tickets, logs, complaints, surveys, and supplier notes.
- Learn the preprocessing path from raw text to clean tokens using regex, normalization, and tokenization.
- Compute TF-IDF by hand and explain how it becomes a scalable data-engineering pipeline.

---

## Learning Objectives

- Explain why raw text needs structured preprocessing before feature extraction.
- Read and write basic regex patterns for extraction, cleaning, validation, and masking.
- Compute TF, DF, IDF, and TF-IDF using clear notation and small examples.
- Map TF-IDF to SQL-style aggregation stages and identify the operational bottlenecks.
- Define monitoring signals for skew, vocabulary growth, and unstable tokenization.

---

## What Students Should Be Able To Do

- Given 5 short tickets, calculate TF-IDF scores and rank the most informative terms.
- Given a messy text field, choose a regex preprocessing step before tokenization.
- Given a SQL plan for TF-IDF, point to the expensive `GROUP BY`, `COUNT(DISTINCT)`, and join stages.
- Given a weekly dashboard drift, decide whether the cause is operational reality or text-pipeline instability.

---

## Why Text Analytics Matters for IEM

- Text is often the first place operational failures appear: complaints, incident notes, maintenance logs, and chat transcripts.
- Managers do not need "NLP for its own sake"; they need repeatable signals that improve prioritization.
- TF-IDF helps separate frequent background language from rare terms that may signal cost, risk, or urgent action.

---

## Operational Framing

- Each text record is a **document**: one ticket, complaint, log line, survey response, or report.
- Each cleaned word or phrase is a **term**: the signal we count and weight.
- A corpus is a versioned set of documents; changing the corpus changes global statistics and rankings.

---

## End-to-End Text Feature Pipeline

1. Ingest raw text with stable `doc_id` and timestamp.
2. Apply regex extraction, masking, and cleaning.
3. Normalize and tokenize into reproducible terms.
4. Compute TF, DF, IDF, and TF-IDF.
5. Store sparse features with tokenizer and corpus versions.

---

## Pipeline Contract: Stable Corpus

- TF-IDF depends on `N` and `df(t)`, so the corpus boundary must be explicit.
- Use one logical record per `doc_id` per corpus version; duplicated ingestion corrupts IDF.
- Late-arriving documents and backfills should produce a new corpus version, not silently rewrite old dashboards.

---

## Regex as Preprocessing

- Regex is a pattern language for finding, extracting, replacing, or validating text.
- In data pipelines, regex usually runs before tokenization so the tokenizer receives cleaner input.
- Good regex turns messy text into stable fields; bad regex creates silent errors or slow jobs.

---

## Regex: Literal Match

| Goal | Pattern | Example match |
|---|---|---|
| Find exact word | `delay` | `delay 3 days` |
| Find ticket prefix | `TKT` | `TKT-1042` |
| Find currency symbol | `USD` | `USD 1200` |

- Literal patterns are the simplest and safest regex building block.

---

## Regex: Character Classes

| Pattern | Meaning | Matches |
|---|---|---|
| `\d` | one digit | `7` in `delay 7 days` |
| `\d+` | one or more digits | `1200` in `USD 1200` |
| `[A-Z]+` | uppercase letters | `ERR` in `ERR-404` |
| `\w+` | word characters | `printer` |

- Use character classes when the exact text changes but the shape is stable.

---

## Regex: Quantifiers

| Pattern | Meaning | Example |
|---|---|---|
| `\d{4}` | exactly 4 digits | `2026` |
| `\d{1,2}` | 1 or 2 digits | `7`, `12` |
| `colou?r` | optional `u` | `color`, `colour` |
| `\s+` | one or more spaces | multiple spaces or tabs |

- Quantifiers describe repetition; bounded quantifiers are safer than open-ended ones.

---

## Regex: Anchors and Boundaries

| Pattern | Meaning | Example use |
|---|---|---|
| `^ERR` | starts with `ERR` | validate error-code prefix |
| `done$` | ends with `done` | detect final status |
| `\bdelay\b` | whole word `delay` | avoid matching `delayed` |

- Anchors are useful for validation because they force the pattern to match a specific position.
- Word boundaries reduce false positives in keyword extraction.

---

## Regex: Groups for Extraction

```text
Pattern: delay\s+(\d+)\s+days?
Text:    delay 3 days due to customs
Group 1: 3
```

- Parentheses create capture groups.
- `days?` matches both `day` and `days`.
- The extracted number can become a structured feature such as `delay_days = 3`.

---

## Regex: Cleaning Example

```text
Raw:      "Printer   JAM!!!  Ticket=TKT-1042"
Step 1:   extract ticket id with TKT-\d+
Step 2:   lowercase
Step 3:   replace punctuation with spaces
Tokens:   printer, jam, ticket, tkt, 1042
```

- Regex should support the downstream analytical goal.
- If ticket IDs are not meaningful terms, mask them before tokenization.
- If IDs are operational keys, extract them into a separate column.

---

## Regex Use Cases in Text Analytics

| Use case | Example pattern | Pipeline output |
|---|---|---|
| Extract delay days | `delay\s+(\d+)\s+days?` | `delay_days` |
| Extract error code | `ERR-\d{3,5}` | `error_code` |
| Mask email | `[\w.]+@[\w.]+\.\w+` | `<EMAIL>` |
| Normalize whitespace | `\s+` | single spaces |

- The goal is not fancy syntax; the goal is reproducible fields and clean tokens.

---

## Regex Case: Ticket IDs

```text
Pattern: \bTKT-\d{4,6}\b
Matches: TKT-1042, TKT-998877
Rejects: TKT-12, XTKT-1042, TKT-1042A
```

- `\b` keeps the match aligned to a word boundary.
- `\d{4,6}` encodes the business rule: valid IDs contain 4 to 6 digits.
- Validation rules should be documented because they define which records are accepted or quarantined.

---

## Regex Case: Dates

| Raw text | Pattern | Extracted |
|---|---|---|
| `created 12-02-2026` | `\d{1,2}-\d{1,2}-\d{4}` | `12-02-2026` |
| `closed 2026-02-12` | `\d{4}-\d{2}-\d{2}` | `2026-02-12` |
| `ETA: 7/5/26` | not enough context | standardize separately |

- Regex can extract date-like strings, but date parsing should validate the actual calendar value.

---

## Regex Case: Amounts

```text
Pattern: (USD|ILS|EUR)\s?(\d+(?:\.\d{1,2})?)
Text:    refund USD 120.50 requested
Groups:  currency=USD, amount=120.50
```

- Groups separate the currency from the numeric value.
- `(?:...)` is a non-capturing group; it groups pattern logic without producing an output field.
- Keep structured numeric values out of the token vocabulary when possible.

---

## Regex Case: Masking PII

```text
Raw:     contact dana.levi@example.com today
Masked:  contact <EMAIL> today
```

- Masking prevents personal details from becoming searchable terms or model features.
- The placeholder keeps a useful signal: the record contained an email.
- PII masking should happen before tokens are persisted.

---

## Regex Pitfalls

- Overmatching: `.*delay.*` may swallow too much text and hide structure.
- Under-specification: `\d+` extracts any number, not necessarily the business value.
- Catastrophic backtracking: nested open-ended patterns can stall a pipeline on pathological inputs.
- Non-idempotent replacement: running the same cleaning step twice should not change the text again.

---

## Regex Safety Rules

- Prefer bounded patterns such as `\d{1,6}` over unbounded patterns when the business rule allows it.
- Cap input length for expensive expressions and quarantine records that exceed limits.
- Use regex engines with predictable runtime when available; test patterns on adversarial examples.
- Track regex timeout rate and bad-record counts as pipeline metrics.

---

## From Clean Text to Tokens

- Normalize case: `Printer JAM` becomes `printer jam`.
- Decide punctuation rules: keep `ERR-404` as one code or split it into terms.
- Remove or mark boilerplate: signatures, disclaimers, repeated templates.
- Tokenization rules must be versioned because changing them changes all downstream TF-IDF scores.

---

## TF-IDF: Intuition

- Term frequency asks: **how much does this document talk about the term?**
- Inverse document frequency asks: **how rare is this term across the corpus?**
- TF-IDF combines both: high local emphasis plus high global rarity.

---

## Symbols and Notation

| Symbol | Meaning |
|---|---|
| `t` | term after preprocessing |
| `d` | one document |
| `N` | number of documents in the corpus |
| `f_{t,d}` | count of term `t` in document `d` |
| `|d|` | number of tokens in document `d` |
| `df(t)` | number of documents containing `t` |

- In this lecture, `log` means natural logarithm.

---

## Term Frequency Formula

$$
\text{tf}(t,d)=\frac{f_{t,d}}{|d|}
$$

- `f_{t,d}` is local: it is counted inside one document.
- `|d|` normalizes for document length.
- Example: in `printer jam jam`, `tf(jam,T1)=2/3=0.67`.

---

## Document Frequency Formula

$$
\text{df}(t)=|\{d:t\in d\}|
$$

- DF counts documents, not raw occurrences.
- If `jam` appears twice in one ticket, that still contributes only one document to `df(jam)`.
- DF is global and requires aggregation across the corpus.

---

## Inverse Document Frequency Formula

$$
\text{idf}(t)=\log\left(\frac{N+1}{\text{df}(t)+1}\right)
$$

- The `+1` terms smooth the calculation and avoid division by zero.
- Common terms receive low IDF; terms in every document receive IDF close to 0.
- Rare terms receive higher IDF and can stand out in prioritization.

---

## TF-IDF Formula

$$
\text{tfidf}(t,d)=\text{tf}(t,d)\times\text{idf}(t)
$$

- Same TF but higher IDF means a term becomes more important.
- Same IDF but higher TF means the document focuses more heavily on that term.
- A high score is a signal for review, not an automatic business decision.

---

## Worked Example: Ticket Corpus

| ticket_id | text |
|---|---|
| T1 | `printer jam jam` |
| T2 | `printer offline` |
| T3 | `vpn outage` |
| T4 | `vpn slow` |
| T5 | `printer jam` |

- Corpus size: `N=5`.

---

## Worked Example: Token Counts

| ticket | document length | selected counts |
|---|---:|---|
| T1 | 3 | `printer=1`, `jam=2` |
| T2 | 2 | `printer=1`, `offline=1` |
| T3 | 2 | `vpn=1`, `outage=1` |
| T5 | 2 | `printer=1`, `jam=1` |

- Counting comes after regex cleaning and tokenization.

---

## Worked Example: TF

| Term/document | Calculation | TF |
|---|---:|---:|
| `jam` in T1 | `2/3` | `0.67` |
| `offline` in T2 | `1/2` | `0.50` |
| `outage` in T3 | `1/2` | `0.50` |

- TF is local; it says nothing yet about rarity across tickets.

---

## Worked Example: DF and IDF

| Term | Documents containing term | DF | IDF |
|---|---|---:|---:|
| `jam` | T1, T5 | 2 | `log(6/3)=0.69` |
| `offline` | T2 | 1 | `log(6/2)=1.10` |
| `outage` | T3 | 1 | `log(6/2)=1.10` |

- Rare terms receive higher IDF under the same corpus definition.

---

## Worked Example: TF-IDF Ranking

| Term/document | TF | IDF | TF-IDF |
|---|---:|---:|---:|
| `jam` in T1 | 0.67 | 0.69 | 0.46 |
| `offline` in T2 | 0.50 | 1.10 | 0.55 |
| `outage` in T3 | 0.50 | 1.10 | 0.55 |

- `offline` and `outage` rank higher despite fewer raw mentions.
- Managerial interpretation: rare operational states may deserve attention even when volume is small.

---

## Sanity Check

- Raw frequency alone would overemphasize `printer` and `jam` because they occur more often.
- TF-IDF raises terms that are focused in a document and uncommon in the corpus.
- If a term appears in every document, its IDF approaches 0 and it contributes little to ranking.

---

## Second Example: Customer Complaints

| complaint_id | text | top signal |
|---|---|---|
| C1 | `billing error refund` | `refund` |
| C2 | `billing error` | common billing issue |
| C3 | `refund delayed` | `delayed` |
| C4 | `app crash` | `crash` |
| C5 | `billing error` | common billing issue |

- The important lesson is contrast: `billing` is frequent, while `crash` is rare and operationally severe.

---

## SQL-Lens: Stage 1 Token Counts

```sql
SELECT
  doc_id,
  term,
  COUNT(*) AS term_count
FROM tokens
GROUP BY doc_id, term;
```

- This produces one row per non-zero `(doc_id, term)` pair.
- The output is sparse; we do not store every possible term for every document.
- Bottleneck: token explosion and high-cardinality grouping.

---

## SQL-Lens: Stage 2 Document Lengths

```sql
SELECT
  doc_id,
  COUNT(*) AS doc_len
FROM tokens
GROUP BY doc_id;
```

- `doc_len` must be derived explicitly; it is not magically available.
- Use numeric casting later to avoid integer division.
- Empty documents should be filtered or flagged before TF calculation.

---

## SQL-Lens: Stage 3 Document Frequency

```sql
SELECT
  term,
  COUNT(DISTINCT doc_id) AS df
FROM tokens
GROUP BY term;
```

- DF requires a global aggregation by term.
- Stop words and common boilerplate create hot keys or skewed shuffle partitions.
- This is often the expensive stage in distributed execution.

---

## SQL-Lens: Final TF-IDF Join

```sql
SELECT
  tc.doc_id,
  tc.term,
  (tc.term_count * 1.0 / dl.doc_len)
    * LOG((c.n_docs + 1.0) / (df.df + 1.0)) AS tfidf
FROM term_counts tc
JOIN doc_lengths dl USING (doc_id)
JOIN document_frequency df USING (term)
CROSS JOIN (SELECT COUNT(DISTINCT doc_id) AS n_docs FROM tokens) c;
```

- The scalar `N` is explicit.
- The multiplication by `1.0` prevents integer division in SQL engines that need it.
- Production pipelines usually materialize stages for debugging and replay.

---

## SQL Cost Consequences

| Operation | Cardinality driver | Bottleneck |
|---|---|---|
| Tokenization | total token count | parsing and row explosion |
| Term counts | unique `(doc, term)` pairs | large `GROUP BY` |
| DF | unique terms and common terms | hot-key aggregation |
| Final join | sparse feature rows | join memory and shuffle |

- SQL can express TF-IDF; the issue is predictable cost and stability at scale.

---

## Operational Risk: Stop-Word Skew

- Terms like `the`, `and`, `please`, or repeated templates appear in many documents.
- They create large DF groups but usually have low analytical value.
- Mitigation: stop-word filtering, maximum DF threshold, and monitoring max/median partition load.

---

## Operational Risk: Vocabulary Explosion

- IDs, URLs, serial numbers, typos, and random hashes can become unique terms.
- Large vocabularies increase memory, storage, broadcast size, and dashboard instability.
- Mitigation: masking, canonicalization, minimum DF thresholds, and vocabulary-size alerts.

---

## Operational Risk: Edge Cases

| Edge case | Risk | Handling |
|---|---|---|
| Empty text | division by zero | filter or mark invalid |
| All stop words | no useful features | keep record-level quality flag |
| Very short text | unstable ranking | combine with business rules |
| Numeric-heavy text | vocabulary explosion | extract fields or mask patterns |

- Quality flags should be visible to analysts and managers.

---

## Reproducibility Contract

- Store tokenizer version, regex-cleaning version, stop-word-list version, and corpus version.
- Persist sparse output keyed by `(corpus_version, doc_id, term)`.
- A rerun of the same corpus version should produce the same feature table.

---

## Managerial Decision Checklist

- Is the high TF-IDF term actionable, or merely rare noise?
- Did preprocessing remove or mask identifiers that should not become features?
- Are weekly trends comparable under the same corpus and tokenizer versions?
- Are skew and vocabulary-growth alerts monitored before dashboard deadlines?

---

## Common Mistake Drill

| Mistake | Correction |
|---|---|
| Counting raw occurrences as DF | DF counts documents containing the term |
| Comparing TF-IDF across different corpora | compare within a defined corpus version |
| Treating regex as free | monitor timeouts and bad-record rates |
| Keeping every token | bound vocabulary for cost and quality |

- These mistakes create incorrect rankings even when the formulas look right.

---

## Practice

1. Compute TF-IDF for a rare term that appears once in one of six tickets.
2. Add a stop word that appears in all documents and compute its IDF.
3. Write a regex to extract `delay_days` from `delay 12 days due to customs`.
4. Sketch the SQL stages needed to compute TF-IDF and mark the bottleneck.

---

## Instructor Notes: Flow

- 10 min: operational framing and stable corpus definition.
- 25 min: regex syntax, examples, safety, and preprocessing order.
- 30 min: TF-IDF formulas and worked example.
- 15 min: SQL-lens and operational risks.
- 10 min: drill questions and bridge to Week 9.

---

## Instructor Notes: Blackboard Flow

1. Draw raw text -> regex extraction/masking -> tokens -> TF-IDF table.
2. Compute TF, DF, IDF, and TF-IDF on the five-ticket example.
3. Circle the SQL stage that creates hot-key skew.
4. End with the versioning contract: same corpus, same tokenizer, same metrics.

---

## Sources Used (Reference Only)

- `sources/text1.md`
- `sources/text2.md`
- `README.md`
