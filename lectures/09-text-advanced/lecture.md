# Week 9: Advanced Text Processing Techniques

## Purpose
- Beyond TF-IDF: n-grams, regex, embeddings as features in data pipelines
- Engineering view: feature vs model; vocabulary growth; failure modes
- Pipelines must scale to large corpora and remain reproducible and debuggable

## Learning Objectives (1/2)
- Define word n-grams and character n-grams; extract them from text
- State vocabulary size growth: \(O(V^n)\) for word n-grams; implications for storage and shuffle
- Use regex in pipelines for cleaning and extraction; know catastrophic backtracking risk
- Describe embeddings as dense vectors (engineering view: lookup, dimension, versioning)

## Learning Objectives (2/2)
- Distinguish feature pipeline (tokenize → n-grams / TF-IDF / embedding lookup) from model training
- Design a MapReduce-style flow for n-gram extraction; identify skew (hot n-gram key)
- Estimate cost: map output size, shuffle size, reducer load from corpus and n
- Identify failure modes: regex timeout, encoding errors, hot n-gram reducer; mitigate

## Sources Used (Reference Only)
- sources/Regular Expressions.pptx
- sources/TF-IDF.pdf
- sources/Lecture 6,7,8.pdf
- sources/Lecture 6,7,8.pptx

## Diagram Manifest
- Slide 20 → week9_lecture_slide20_advanced_text_pipeline_overview.puml → Advanced text pipeline: docs → tokenize → n-grams → features → output
- Slide 26 → week9_lecture_slide26_mapreduce_ngram_flow.puml → MapReduce n-gram extraction: Map → Shuffle → Reduce
- Slide 29 → week9_lecture_slide29_failure_regex_ngram.puml → Failure: regex backtracking and n-gram skew; mitigations

## The Real Problem This Lecture Solves
- **Vocabulary and shuffle at scale:** N-gram vocabulary grows as \(V^n\); bigrams with V=50k ⇒ up to billions of types; map emits (doc_id, ngram, 1) per instance ⇒ shuffle size and reducer load explode; *data movement* and partition choice determine success.
- **Regex in production:** One malicious or malformed record with a backtracking-prone pattern can hang a mapper; CPU spike, timeout; pipeline blocked by a single record.
- **Hot n-gram key:** If a job partitions by ngram (e.g. for df), very common n-grams (e.g. "the_and") send most doc_ids to one reducer → OOM or straggler; same skew story as Week 7–8, different key space.

## Cost of Naïve Design (Advanced Text)
- **No combiner in n-gram job:** Emit (doc_id, ngram, 1) for every n-gram instance ⇒ shuffle size = total instances; 10^6 docs × 200 terms/doc × bigrams ⇒ ~2×10^8 pairs; combiner cuts to distinct (doc_id, ngram) per partition ⇒ order-of-magnitude reduction.
- **Partition by ngram for count job:** If you partition by ngram to compute counts, hot n-gram gets most doc_ids ⇒ one reducer OOM; partition by (doc_id, ngram) for per-doc counts; use separate pass for df with cap or filter.
- **No regex timeout:** Complex pattern on long or adversarial input ⇒ catastrophic backtracking; one record blocks mapper; timeout per record and non-backtracking or possessive patterns are production requirements.
- **Production cost:** Feature pipeline stalls, SLA misses, on-call; vocabulary cap and partition strategy must be designed up front; regex and encoding validation at ingest prevent one-record failures.

## Core Concepts (1/3)
- **Word n-gram:** contiguous sequence of \(n\) tokens (e.g. bigram: "data engineering")
- **Character n-gram:** contiguous substring of length \(n\) (e.g. "dat", "ata" for "data")
- **Use:** word n-grams capture local context; char n-grams handle morphology and typos
- **Engineering:** n-gram vocabulary size grows fast; storage and shuffle cost scale with it

## Core Concepts (2/3)
- **Vocabulary size (word):** distinct word n-grams \(\leq V^n\); \(V\) = unigram vocabulary; bigrams \(\approx V^2\)
- **Vocabulary size (char):** bounded by alphabet size^\(n\); smaller than word n-grams for small \(n\)
- **Guarantees:** deterministic given tokenization and \(n\); same pipeline ⇒ comparable features
- **What breaks:** very common n-grams (e.g. "the_and") → hot key if aggregated by n-gram

## Core Concepts (3/3)
- **Feature pipeline:** raw text → tokenize → n-grams / TF-IDF / embedding lookup → feature vector
- **Model:** training (e.g. word2vec, BERT) produces embeddings; pipeline consumes them
- **Engineering:** version tokenization and embedding table; idempotent feature write by (doc_id, version)
- **Trade-off:** n-gram counts are interpretable; embeddings dense and powerful but opaque

## N-gram Definitions (Formal)
- **Word n-gram:** \(w_i \ldots w_{i+n-1}\) from token sequence \(w_1 \ldots w_m\); \(i \in [1, m-n+1]\)
- **Character n-gram:** substring of length \(n\) from character sequence (with or without spaces)
- **Sliding window:** one n-gram per position; overlapping; count or binary per (doc, ngram)
- **Example:** "data engineering" → bigrams: ("data", "engineering"); unigrams: "data", "engineering"

## Word vs Character N-grams
- **Word:** need tokenizer; vocab \(V^n\); good for phrases and local word order
- **Character:** no tokenizer; vocab \(\approx 26^n\) (English); good for prefixes/suffixes, typos
- **Storage:** word bigrams often \(10^5\)–\(10^7\) types; char trigrams \(26^3 \approx 17k\)
- **Use case:** search and ranking → word n-grams; spell-check / language ID → char n-grams

## N-gram Vocabulary Size (1/2)
- **Upper bound (word):** \(|V_n| \leq |V_1|^n\); in practice \(\ll |V_1|^n\) (sparsity)
- **Bigram example:** \(V=50k\) ⇒ up to \(2.5 \times 10^9\) bigrams; actual distinct often \(10^6\)–\(10^7\)
- **Cost:** Map emits (doc_id, ngram, 1); shuffle size ∝ total n-gram instances; reduce by (doc_id, ngram)
- **If aggregated by ngram only:** partition by ngram ⇒ hot n-gram gets many doc_ids

## N-gram Vocabulary Size (2/2)
- **Character n-gram:** alphabet size \(A\); distinct char n-grams \(\leq A^n\); \(A=26\) ⇒ \(26^3=17576\) for trigrams
- **Engineering:** cap vocabulary (top-K by df or count); or hash n-grams to fixed buckets
- **Reproducibility:** fix \(n\), tokenization, and vocabulary filter; document in pipeline config

## Regex in Pipelines
- **Use:** clean (strip tags, normalize whitespace), extract (dates, IDs), validate (format)
- **Engine:** PCRE / Java regex; greedy matching and backtracking
- **Risk:** nested quantifiers (e.g. \((a+)+b\)) on long non-matching input ⇒ catastrophic backtracking
- **Mitigation:** non-backtracking engine; timeout per record; simplify patterns; validate input length

## Regex Catastrophic Backtracking (Example)
- **Pattern:** \((a+)+b\) expects one or more 'a' then 'b'
- **Input:** "aaaaaaaaaaaaaaaaac" (no 'b'); engine backtracks over all splits of 'a'+ → exponential time
- **Result:** CPU spike; job timeout; one bad record blocks the pipeline
- **Fix:** possessive \((a++)+b\) or atomic group; or match \([a]+b\) and avoid nested quantifiers

## Embeddings: Engineering View (1/2)
- **Embedding:** term (or n-gram) → fixed-size dense vector; e.g. 300 dimensions
- **Lookup:** vocabulary maps term_id → vector; doc = aggregate (e.g. mean) of term vectors
- **Source:** pre-trained (Word2Vec, GloVe, FastText) or model output (BERT [CLS]); pipeline consumes
- **Storage:** \(V \times d\) floats; \(V=10^5\), \(d=300\) ⇒ 30M floats ≈ 120 MB

## Embeddings: Engineering View (2/2)
- **Versioning:** embedding table has version; feature pipeline records (doc_id, version, vector)
- **Update:** new table ⇒ new version; reprocess docs or backfill; idempotent write by (doc_id, version)
- **Failure:** missing term in table ⇒ OOV; use default vector or skip; log for monitoring
- **Trade-off:** dense vectors better for similarity; sparse TF-IDF interpretable and no OOV table

## Feature vs Model
- **Feature pipeline:** deterministic transform: text → tokenize → n-grams / TF-IDF / lookup → vector
- **Model training:** produces embeddings or weights; separate job; versioned artifact
- **Boundary:** pipeline reads model artifact (vocabulary, embedding table); does not train
- **Engineering:** same code path for batch and online; model version in config; A/B test by version

## Skip-grams and Co-occurrence (Brief)
- **Skip-gram:** pair of terms within a window (e.g. "data" and "systems" with gap 2); not contiguous
- **Co-occurrence:** count (term_i, term_j) in same window; used for PMI or embedding training
- **Engineering:** more pairs than n-grams; shuffle size grows; same skew risk (hot term pair)
- **Use:** word2vec-style training; or PMI matrix for feature engineering

## Running Example — Data & Goal
- **Corpus:** 3 short documents. D1: "data engineering data"; D2: "engineering systems"; D3: "data data data"
- **Schema:** (doc_id, text); tokenize → terms; extract bigrams; goal: (doc_id, ngram, count)
- **Engineering objective:** reproducible n-gram counts; same pipeline scales to N docs and vocabulary \(V_n\)

## Running Example — Pipeline Overview
- Documents → tokenize (split, lowercase) → sliding window n=2 → (doc_id, ngram, 1)
- Shuffle by (doc_id, ngram); reduce sum → (doc_id, ngram, count)
- Optional: df(ngram), IDF; then TF-IDF per (doc_id, ngram) as in Week 8
- Diagram: week9_lecture_slide20_advanced_text_pipeline_overview.puml

## Running Example — Step-by-Step (1/4)
- **Step 1: Tokenize.** D1: [data, engineering, data]; D2: [engineering, systems]; D3: [data, data, data]
- **Step 2: Bigrams.** D1: (data_engineering, 1), (engineering_data, 1); D2: (engineering_systems, 1); D3: (data_data, 2)
- **Convention:** ngram as "w1_w2" or (w1, w2); count per (doc_id, ngram)
- **Doc lengths (bigrams):** D1: 2; D2: 1; D3: 1 (unique bigrams per doc)

## Running Example — Step-by-Step (2/4)
- **Step 3: Counts (after reduce).** (1, data_engineering, 1), (1, engineering_data, 1), (2, engineering_systems, 1), (3, data_data, 2)
- **Step 4: Document frequency (optional).** df(data_engineering)=1, df(engineering_data)=1, df(engineering_systems)=1, df(data_data)=1; N=3
- **IDF:** all bigrams in one doc only ⇒ same IDF for all; \(\text{idf} = \log\frac{N+1}{df+1}\)
- **TF-IDF (if applied):** TF = count/|doc_bigrams|; then tfidf = TF × IDF per (doc_id, ngram)

## Running Example — Step-by-Step (3/4)
- **Output (counts only):** (doc_id, ngram, count) for search or downstream TF-IDF
- **Output (with TF-IDF):** (doc_id, ngram, tfidf) sparse vector; same as Week 8 with n-grams as terms
- **Interpretation:** D3 has repeated "data data" ⇒ high count for (data_data); D1 has two distinct bigrams
- **Scale:** N docs, avg T terms/doc ⇒ up to \(N \times (T-n+1)\) n-gram instances; vocabulary \(V_n \leq V^n\)

## Running Example — Step-by-Step (4/4)
- **Result:** (doc_id, ngram, count) or (doc_id, ngram, tfidf) suitable for index or feature store
- **Conclusion:** Pipeline = tokenize → n-gram extract → optional df/N → optional TF-IDF; combiner cuts shuffle
- **Trade-off:** Bigrams add context vs unigrams but vocab and shuffle grow; filter low-df n-grams to cap size
- **Relation to Week 8:** Same TF-IDF formula; "term" = n-gram; df and N over n-grams

## Cost & Scaling Analysis (1/3)
- **Time model:** \(T = T_{\text{map}} + T_{\text{shuffle}} + T_{\text{reduce}}\)
- **Map:** one pass per doc; tokenize \(O(|d|)\); emit \((doc\_id, ngram, 1)\) per n-gram position; \(O(\sum_d (|d|-n+1))\)
- **Shuffle:** size = total (doc_id, ngram, 1) emitted; with combiner: (doc_id, ngram, count) per (doc, ngram)
- **Reduce:** group by (doc_id, ngram); sum; output (doc_id, ngram, count)

## Cost & Scaling Analysis (2/3)
- **Memory (map):** per-doc token list and n-gram buffer; \(O(|d|)\) per task
- **Memory (reduce):** one key and list of 1s per (doc_id, ngram); bounded by partition size
- **Storage:** output (doc_id, ngram, count) sparse; size \(\propto\) distinct (doc_id, ngram) pairs
- **Vocabulary:** store \(V_n\) or top-K n-grams; incremental index: append new n-grams with version

## Cost & Scaling Analysis (3/3)
- **Network:** shuffle dominates; combiner reduces (doc_id, ngram, 1) to (doc_id, ngram, count) before send
- **Throughput:** limited by shuffle bandwidth; partition by (doc_id, ngram) spreads load
- **Latency:** single job for counts; add job for df/N if doing TF-IDF (like Week 8)
- **Example:** 10^6 docs, 100 terms/doc, bigrams ⇒ ~10^8 (doc_id, ngram) pairs; combiner cuts to ~10^7 distinct

## Cost Example (Numeric)
- **Input:** 1M docs, 200 terms/doc avg, bigrams; 100 mappers, 100 reducers
- **Map output (no combiner):** 1M × 199 ≈ 2×10^8 (key, 1) pairs; ~16 B per pair ⇒ ~3.2 GB
- **With combiner:** distinct (doc_id, ngram) per partition; assume 10^7 distinct ⇒ ~1.6 GB shuffle
- **Reducer:** avg 10^5 keys per reducer; max can be 2–5× if skew; monitor max/median

## MapReduce for N-gram Extraction
- **Map:** input (doc_id, text) → tokenize → for each n-gram position emit ((doc_id, ngram), 1)
- **Combiner:** same as reduce: sum 1s → ((doc_id, ngram), count); reduces shuffle size
- **Partition:** by (doc_id, ngram) so one reducer gets all counts for same (doc_id, ngram)
- **Reduce:** key (doc_id, ngram), values [counts] → sum → emit (doc_id, ngram, total_count)
- Diagram: week9_lecture_slide26_mapreduce_ngram_flow.puml

## Shuffle Size (N-gram Job)
- **No combiner:** map emits one (key, 1) per n-gram instance; shuffle size = total n-gram instances
- **With combiner:** map output combined per (doc_id, ngram); shuffle size = distinct (doc_id, ngram) × (size of value)
- **Assumptions:** 10^6 docs, 200 terms/doc, bigrams ⇒ 10^6 × 199 ≈ 2×10^8 instances; distinct pairs smaller
- **Skew:** if partition by ngram only (e.g. for df), common n-gram → one reducer gets many doc_ids

## Pitfalls & Failure Modes (1/3)
- **Regex catastrophic backtracking:** complex pattern on long or malicious input ⇒ CPU explosion, timeout
- **Encoding:** non-UTF-8 or mixed encoding ⇒ replacement chars or crash; normalize encoding at ingest
- **Empty or short docs:** \(|d| < n\) ⇒ no n-grams; filter or skip; avoid division by zero in TF
- **OOV in embeddings:** term not in table ⇒ use default vector or skip; log and monitor OOV rate

## Pitfalls & Failure Modes (2/3)
- **Hot n-gram key:** if aggregating by ngram (e.g. df), very frequent n-gram → one reducer gets most (ngram, doc_id) pairs
- **Failure:** OOM or straggler; job latency = that reducer's time
- **Mitigation:** filter stop-ngrams (e.g. "the_and") in map; or partition by (doc_id, ngram) for count job; aggregate df in separate pass with cap
- Diagram: week9_lecture_slide29_failure_regex_ngram.puml

## Pitfalls & Failure Modes (3/3)
- **Detection:** monitor reducer input size variance; profile n-gram df distribution; regex timeout metrics
- **Idempotency:** feature write keyed by (doc_id, version); rerun overwrites same keys; no duplicate rows
- **Tokenization drift:** change in lowercase/stem/stop list ⇒ different n-grams and scores; version pipeline
- **Best practice:** timeout per record in regex; encoding validation; vocabulary and config versioned

## Failure Scenario — Regex and N-gram Skew
- **Regex:** \((a+)+b\) on "a" repeated 50 times + "c" ⇒ backtracking can take seconds or hang
- **N-gram skew:** Job that partitions by ngram for df; "the_and" in 80% of docs ⇒ one reducer gets 0.8×N doc_ids
- **Result:** regex → single record blocks mapper; n-gram skew → one reducer OOM or straggler
- **Mitigation:** simplify regex; timeout per record; filter high-df n-grams; partition by (doc_id, ngram) for counts

## Best Practices (1/2)
- Version tokenization (lowercase, stemmer, stop list, n) and embedding table; document in pipeline config
- Use combiner in n-gram count job to cut shuffle size
- Partition by (doc_id, ngram) for per-doc counts; avoid partitioning by ngram alone for count job
- Validate encoding (UTF-8) and input length before regex; set timeout per record
- Cap vocabulary: top-K by df or count; or hash n-grams to fixed buckets for bounded size

## Best Practices (2/2)
- Store features keyed by (doc_id, version) for idempotent overwrite and reprocessing
- Monitor: reducer input size variance, regex time per record, OOV rate for embeddings
- Filter stop-ngrams or high-df n-grams when computing df to avoid hot reducer
- Prefer non-backtracking or possessive regex for untrusted or variable-length input
- Separate feature pipeline (deterministic) from model training (versioned artifact)

## Recap — Engineering Judgment
- **Vocabulary and partition choice:** N-gram vocab grows as \(V^n\); shuffle and reducer load scale with it; partition by (doc_id, ngram) for per-doc counts; avoid partitioning by ngram alone for count job; cap vocabulary (top-K or hash) for bounded size.
- **Regex and encoding:** Timeout per record and validate encoding at ingest; one bad record must not block the pipeline; use non-backtracking or possessive patterns for untrusted input.
- **Skew is the same story:** Hot n-gram in df aggregation → one reducer; filter stop-ngrams or high-df n-grams; storage vs compute: sparse (doc_id, ngram, count) and versioned vocabulary.
- **Feature vs model boundary:** Pipeline consumes versioned vocabulary/embeddings; idempotent write by (doc_id, version); separate feature pipeline (deterministic) from model training (versioned artifact).

## Pointers to Practice
- Extract bigrams by hand from 3–5 docs; compute counts and optional TF-IDF
- MapReduce walkthrough: 8–12 input lines → map (doc_id, ngram, 1) → shuffle → reduce
- Cost: estimate map output and shuffle size from N docs, terms/doc, n
- One failure case: hot n-gram or regex timeout; diagram mitigation (filter, partition, timeout)
