---
title: "End-to-End Text Processing Exercise"
subtitle: "TF-IDF, N-grams, Markov Language Models, and Embeddings"
author: "Data Engineering Course"
date: "Week 9"
---

# Problem to solve

A support team receives short incident notes. Each note begins with a ticket identifier that should be extracted as a structured field, not treated as a text feature.

Build a complete text-processing analysis for the five support tickets below. The goal is to show how the same small corpus can support regex preprocessing, unigram TF-IDF, bigram TF-IDF, an n-gram Markov language model, and embedding similarity.

The purpose is not to build a production NLP model. The purpose is to make every calculation visible so the data-engineering pipeline is clear.

| doc_id | raw_note |
|---|---|
| D1 | `TKT-1001 vpn not working today` |
| D2 | `TKT-1002 vpn not working now` |
| D3 | `TKT-1003 vpn not responding today` |
| D4 | `TKT-1004 printer working fine now` |
| D5 | `TKT-1005 printer not working` |

The corpus size is:

$$
N=5
$$

You must first turn the raw notes into clean text features. Then calculate unigram TF-IDF, bigram TF-IDF, a bigram Markov language-model probability, and embedding cosine similarity. Use all intermediate tables so that every number in the final answer can be traced.

# Exercises

Use the raw-note table above for all exercises. Unless stated otherwise, use `N=5` and base-10 logarithms.

1. Regex extraction and cleaning: use the regex `\bTKT-\d{4}\b` to extract the ticket id from each `raw_note`. For every document, show `ticket_id`, cleaned feature text after removing the ticket id, the token list after lowercasing and splitting on whitespace, and the token length `L_d`.
2. Unigram DF and IDF: using the tokens from Exercise 1, calculate document frequency for every unique unigram. Show a table with `term`, documents containing the term, `df`, `log10((N+1)/(df+1))`, and the final IDF. Do not use the natural logarithm (ln).
3. Unigram TF-IDF: using `tf(t,d)=f(t,d)/L_d` and `tfidf(t,d)=tf(t,d)*idf(t)`, calculate the unigram TF-IDF score for every term that appears in each document. Show the full score table and identify the highest unigram signals.
4. Bigram generation: for each cleaned document, generate all contiguous two-token windows. Show the bigram list for each document and calculate the bigram denominator `m_2(d)=L_d-1`.
5. Bigram DF, IDF, and TF-IDF: using the bigrams from Exercise 4, calculate document frequency and base-10 IDF for every unique bigram. Then calculate bigram TF-IDF for every bigram that appears in each document.
6. Bigram Markov counts: add `<s>` at the start and `</s>` at the end of each cleaned sentence. Count every transition from history `h` to next token `w`, then show `c(h,w)` and the total count `c(h)`.
7. Unsmoothed sentence probability: using `P(w|h)=c(h,w)/c(h)`, calculate the probability of the sentence `vpn not working today </s>` given `<s>`. Show the transition probabilities, the product, and the final decimal.
8. Zero probability and smoothing: for `printer not responding </s>`, identify the unseen transition that makes the unsmoothed probability zero. Then use add-one smoothing with `|V|=9` to calculate the smoothed probability.
9. Embedding similarity: use `Q=[0.80,0.10,0.60]`, `D1=[0.90,0.10,0.50]`, and `D4=[0.10,0.90,0.20]`. Calculate cosine similarity for `Q` against D1 and D4 by showing the dot product, vector norms, and final similarity.
10. Method choice: for each need in this example, choose the best method and justify it in one sentence: remove ticket ids, identify rare words, preserve phrase meaning, estimate sequence probability, and match similar meaning when exact words differ.

# Worked solution

## Step 1. Regex extraction and tokenization

### Extraction contract

Use the following regex to extract the ticket id:

```text
\bTKT-\d{4}\b
```

After extraction, remove the ticket id from the feature text, lowercase the text, and split on whitespace.

| doc_id | ticket_id | cleaned feature text | tokens |
|---|---|---|---|
| D1 | TKT-1001 | `vpn not working today` | `vpn`, `not`, `working`, `today` |
| D2 | TKT-1002 | `vpn not working now` | `vpn`, `not`, `working`, `now` |
| D3 | TKT-1003 | `vpn not responding today` | `vpn`, `not`, `responding`, `today` |
| D4 | TKT-1004 | `printer working fine now` | `printer`, `working`, `fine`, `now` |
| D5 | TKT-1005 | `printer not working` | `printer`, `not`, `working` |

The document lengths are:

| doc_id | token length L_d |
|---|---:|
| D1 | 4 |
| D2 | 4 |
| D3 | 4 |
| D4 | 4 |
| D5 | 3 |

## Step 2. Unigram TF-IDF

For a term t in document d:

$$
\operatorname{tf}(t,d)=\frac{f_{t,d}}{L_d}
$$

The document frequency is:

$$
\operatorname{df}(t)=|\{d:t\in d\}|
$$

Use smoothed inverse document frequency with a base-10 logarithm. In this exercise, do not use the natural logarithm (ln).

$$
\operatorname{idf}(t)=\log_{10}\left(\frac{N+1}{\operatorname{df}(t)+1}\right)
$$

The final score is:

$$
\operatorname{tfidf}(t,d)=\operatorname{tf}(t,d)\cdot \operatorname{idf}(t)
$$

### Unigram DF and IDF

| term | documents | df | idf calculation | idf |
|---|---|---:|---|---:|
| `vpn` | D1, D2, D3 | 3 | `log10(6/4)` | 0.176 |
| `not` | D1, D2, D3, D5 | 4 | `log10(6/5)` | 0.079 |
| `working` | D1, D2, D4, D5 | 4 | `log10(6/5)` | 0.079 |
| `today` | D1, D3 | 2 | `log10(6/3)` | 0.301 |
| `now` | D2, D4 | 2 | `log10(6/3)` | 0.301 |
| `responding` | D3 | 1 | `log10(6/2)` | 0.477 |
| `printer` | D4, D5 | 2 | `log10(6/3)` | 0.301 |
| `fine` | D4 | 1 | `log10(6/2)` | 0.477 |

### Worked unigram scores

Every term appears once in its document, so the local term count is 1. For D1:

$$
\operatorname{tf}(\text{vpn},D1)=\frac{1}{4}=0.25
$$

$$
\operatorname{tfidf}(\text{vpn},D1)=0.25\cdot0.176=0.044
$$

$$
\operatorname{tfidf}(\text{today},D1)=0.25\cdot0.301=0.075
$$

For D3:

$$
\operatorname{tfidf}(\text{responding},D3)=0.25\cdot0.477=0.119
$$

The complete selected unigram score table is:

| doc_id | term | tf | idf | tf-idf |
|---|---|---:|---:|---:|
| D1 | `vpn` | 0.250 | 0.176 | 0.044 |
| D1 | `not` | 0.250 | 0.079 | 0.020 |
| D1 | `working` | 0.250 | 0.079 | 0.020 |
| D1 | `today` | 0.250 | 0.301 | 0.075 |
| D2 | `vpn` | 0.250 | 0.176 | 0.044 |
| D2 | `not` | 0.250 | 0.079 | 0.020 |
| D2 | `working` | 0.250 | 0.079 | 0.020 |
| D2 | `now` | 0.250 | 0.301 | 0.075 |
| D3 | `vpn` | 0.250 | 0.176 | 0.044 |
| D3 | `not` | 0.250 | 0.079 | 0.020 |
| D3 | `responding` | 0.250 | 0.477 | 0.119 |
| D3 | `today` | 0.250 | 0.301 | 0.075 |
| D4 | `printer` | 0.250 | 0.301 | 0.075 |
| D4 | `working` | 0.250 | 0.079 | 0.020 |
| D4 | `fine` | 0.250 | 0.477 | 0.119 |
| D4 | `now` | 0.250 | 0.301 | 0.075 |
| D5 | `printer` | 0.333 | 0.301 | 0.100 |
| D5 | `not` | 0.333 | 0.079 | 0.026 |
| D5 | `working` | 0.333 | 0.079 | 0.026 |

Interpretation: `responding` in D3 and `fine` in D4 receive the highest unigram scores because each appears in only one document. This is useful, but it misses the phrase-level meaning of `not working`.

## Step 3. Bigram features

A word n-gram is a contiguous sequence of n tokens. For document length `L_d`, the number of n-gram windows is:

$$
m_n(d)=\max(L_d-n+1,0)
$$

For bigrams, `n=2`:

$$
m_2(d)=L_d-1
$$

| doc_id | tokens | bigram windows m_2(d) | bigrams |
|---|---|---:|---|
| D1 | `vpn not working today` | 3 | `vpn not`, `not working`, `working today` |
| D2 | `vpn not working now` | 3 | `vpn not`, `not working`, `working now` |
| D3 | `vpn not responding today` | 3 | `vpn not`, `not responding`, `responding today` |
| D4 | `printer working fine now` | 3 | `printer working`, `working fine`, `fine now` |
| D5 | `printer not working` | 2 | `printer not`, `not working` |

For a bigram g:

$$
\operatorname{tf}_2(g,d)=\frac{f_{g,d}}{m_2(d)}
$$

The important denominator is the number of bigram windows, not the number of tokens.

### Bigram DF and IDF

| bigram | documents | df | idf |
|---|---|---:|---:|
| `vpn not` | D1, D2, D3 | 3 | 0.176 |
| `not working` | D1, D2, D5 | 3 | 0.176 |
| `working today` | D1 | 1 | 0.477 |
| `working now` | D2 | 1 | 0.477 |
| `not responding` | D3 | 1 | 0.477 |
| `responding today` | D3 | 1 | 0.477 |
| `printer working` | D4 | 1 | 0.477 |
| `working fine` | D4 | 1 | 0.477 |
| `fine now` | D4 | 1 | 0.477 |
| `printer not` | D5 | 1 | 0.477 |

### Worked bigram scores

For D1:

$$
\operatorname{tf}_2(\text{not working},D1)=\frac{1}{3}=0.333
$$

$$
\operatorname{tfidf}_2(\text{not working},D1)=0.333\cdot0.176=0.059
$$

$$
\operatorname{tfidf}_2(\text{working today},D1)=0.333\cdot0.477=0.159
$$

For D5:

$$
\operatorname{tf}_2(\text{not working},D5)=\frac{1}{2}=0.500
$$

$$
\operatorname{tfidf}_2(\text{not working},D5)=0.500\cdot0.176=0.088
$$

The complete bigram score table is:

| doc_id | bigram | tf | idf | bigram tf-idf |
|---|---|---:|---:|---:|
| D1 | `vpn not` | 0.333 | 0.176 | 0.059 |
| D1 | `not working` | 0.333 | 0.176 | 0.059 |
| D1 | `working today` | 0.333 | 0.477 | 0.159 |
| D2 | `vpn not` | 0.333 | 0.176 | 0.059 |
| D2 | `not working` | 0.333 | 0.176 | 0.059 |
| D2 | `working now` | 0.333 | 0.477 | 0.159 |
| D3 | `vpn not` | 0.333 | 0.176 | 0.059 |
| D3 | `not responding` | 0.333 | 0.477 | 0.159 |
| D3 | `responding today` | 0.333 | 0.477 | 0.159 |
| D4 | `printer working` | 0.333 | 0.477 | 0.159 |
| D4 | `working fine` | 0.333 | 0.477 | 0.159 |
| D4 | `fine now` | 0.333 | 0.477 | 0.159 |
| D5 | `printer not` | 0.500 | 0.477 | 0.239 |
| D5 | `not working` | 0.500 | 0.176 | 0.088 |

Interpretation: bigrams preserve local order. The unigram `working` can appear in both a problem phrase (`not working`) and a positive phrase (`working fine`). The bigram representation separates these cases.

## Step 4. Bigram Markov language model

Now use the same cleaned sentences for a language-model task. Add sentence boundary tokens:

| doc_id | boundary sequence |
|---|---|
| D1 | `<s> vpn not working today </s>` |
| D2 | `<s> vpn not working now </s>` |
| D3 | `<s> vpn not responding today </s>` |
| D4 | `<s> printer working fine now </s>` |
| D5 | `<s> printer not working </s>` |

An n-gram language model estimates the probability of a token sequence. The bigram model uses a first-order Markov assumption:

$$
P(w_{1:T})\approx \prod_{t=1}^{T+1}P(w_t\mid w_{t-1}),\qquad w_0=\langle s\rangle,\quad w_{T+1}=\langle /s\rangle
$$

The count-based maximum-likelihood estimate is:

$$
\hat{P}(w\mid h)=\frac{c(h,w)}{c(h)}
$$

### Bigram counts

| history h | next-token counts | total c(h) |
|---|---|---:|
| `<s>` | `vpn`: 3, `printer`: 2 | 5 |
| `vpn` | `not`: 3 | 3 |
| `not` | `working`: 3, `responding`: 1 | 4 |
| `working` | `today`: 1, `now`: 1, `fine`: 1, `</s>`: 1 | 4 |
| `today` | `</s>`: 2 | 2 |
| `now` | `</s>`: 2 | 2 |
| `printer` | `working`: 1, `not`: 1 | 2 |
| `responding` | `today`: 1 | 1 |
| `fine` | `now`: 1 | 1 |

### Transition probabilities

Selected probabilities are:

$$
\hat{P}(\text{vpn}\mid\langle s\rangle)=\frac{3}{5}=0.600
$$

$$
\hat{P}(\text{not}\mid\text{vpn})=\frac{3}{3}=1.000
$$

$$
\hat{P}(\text{working}\mid\text{not})=\frac{3}{4}=0.750
$$

$$
\hat{P}(\text{today}\mid\text{working})=\frac{1}{4}=0.250
$$

$$
\hat{P}(\langle /s\rangle\mid\text{today})=\frac{2}{2}=1.000
$$

### Sentence probability

Compute the probability of the sentence `vpn not working today`:

$$
P(\text{vpn not working today}\ \langle /s\rangle\mid \langle s\rangle)
$$

$$
=\hat{P}(\text{vpn}\mid\langle s\rangle)
\hat{P}(\text{not}\mid\text{vpn})
\hat{P}(\text{working}\mid\text{not})
\hat{P}(\text{today}\mid\text{working})
\hat{P}(\langle /s\rangle\mid\text{today})
$$

$$
=\frac{3}{5}\cdot\frac{3}{3}\cdot\frac{3}{4}\cdot\frac{1}{4}\cdot\frac{2}{2}
$$

$$
=\frac{9}{80}=0.1125
$$

This is a language-model use of n-grams. It is different from using `not working` as a TF-IDF feature.

### Zero probability example

The sentence `printer not responding` contains the unseen transition `responding -> </s>`.

$$
\hat{P}(\langle /s\rangle\mid\text{responding})=\frac{0}{1}=0
$$

Therefore the whole sentence receives probability zero under the unsmoothed model.

One simple smoothing option is add-one smoothing:

$$
\hat{P}_{+1}(w\mid h)=\frac{c(h,w)+1}{c(h)+|V|}
$$

If the next-token vocabulary is:

$$
V=\{\text{vpn},\text{printer},\text{not},\text{working},\text{responding},\text{today},\text{now},\text{fine},\langle /s\rangle\}
$$

then `|V|=9`. The smoothed probability of `printer not responding </s>` is:

$$
P_{+1}(\text{printer not responding}\ \langle /s\rangle\mid\langle s\rangle)
$$

$$
=\frac{2+1}{5+9}\cdot\frac{1+1}{2+9}\cdot\frac{1+1}{4+9}\cdot\frac{0+1}{1+9}
$$

$$
=\frac{3}{14}\cdot\frac{2}{11}\cdot\frac{2}{13}\cdot\frac{1}{10}
$$

$$
\approx 0.0006
$$

Smoothing prevents impossible probabilities, but it must be versioned because it changes model behavior.

## Step 5. Embedding similarity

TF-IDF and n-grams are lexical. Embeddings represent text as dense numeric vectors. Use the following small 3-dimensional toy vectors to demonstrate the calculation:

| item | text | vector |
|---|---|---|
| query Q | `vpn outage` | `[0.80, 0.10, 0.60]` |
| ticket D1 | `vpn not working today` | `[0.90, 0.10, 0.50]` |
| ticket D4 | `printer working fine now` | `[0.10, 0.90, 0.20]` |

Cosine similarity is:

$$
\cos(a,b)=\frac{a\cdot b}{\|a\|\|b\|}
$$

### Query compared with D1

Dot product:

$$
Q\cdot D1=(0.80)(0.90)+(0.10)(0.10)+(0.60)(0.50)=1.030
$$

Vector norms:

$$
\|Q\|=\sqrt{0.80^2+0.10^2+0.60^2}=\sqrt{1.01}=1.005
$$

$$
\|D1\|=\sqrt{0.90^2+0.10^2+0.50^2}=\sqrt{1.07}=1.034
$$

Cosine similarity:

$$
\cos(Q,D1)=\frac{1.030}{(1.005)(1.034)}\approx 0.991
$$

### Query compared with D4

Dot product:

$$
Q\cdot D4=(0.80)(0.10)+(0.10)(0.90)+(0.60)(0.20)=0.290
$$

Vector norm:

$$
\|D4\|=\sqrt{0.10^2+0.90^2+0.20^2}=\sqrt{0.86}=0.927
$$

Cosine similarity:

$$
\cos(Q,D4)=\frac{0.290}{(1.005)(0.927)}\approx 0.311
$$

Interpretation: the query `vpn outage` is much closer to D1 than to D4, even though `outage` is not a literal token in D1. That is the operational value of embeddings when semantic similarity matters.

## Step 6. Method choice and data-engineering consequences

| Need | Best method in this example | Why |
|---|---|---|
| Remove ticket ids from the vocabulary | regex extraction | ticket ids are structured identifiers, not meaningful terms |
| Identify rare single-word signals | unigram TF-IDF | `responding` and `fine` are rare terms |
| Preserve phrase meaning | bigram TF-IDF | `not working` is different from `working fine` |
| Estimate sequence probability | bigram Markov model | the next word is modeled from the previous word |
| Match similar meanings with weak lexical overlap | embeddings | `vpn outage` can be close to `vpn not working` |

Operational controls:

| Risk | Signal to monitor | Example control |
|---|---|---|
| n-gram explosion | vocabulary size and non-zero feature count | min-DF, max-DF, top-K vocabulary freeze |
| hot-key skew | max partition load divided by median load | stop phrases and salting for extreme keys |
| regex mistakes | extraction failure rate and quarantine count | bounded patterns and adversarial tests |
| embedding drift | score-distribution drift by model version | store embedding model and vector version |

## Final answer for the exercise

1. The regex step extracts `TKT-1001` to `TKT-1005` and removes those ids from text features.
2. Unigram TF-IDF highlights rare words such as `responding` and `fine`, but it does not represent phrase meaning.
3. Bigram TF-IDF separates `not working` from `working fine` and uses the bigram-window denominator `m_2(d)=L_d-1`.
4. The bigram Markov model estimates sequence probabilities, for example `P(vpn not working today)=0.1125` under the unsmoothed model.
5. Add-one smoothing avoids zero probability for unseen transitions.
6. Embedding cosine similarity shows how a query such as `vpn outage` can match `vpn not working today` even without exact word overlap.
