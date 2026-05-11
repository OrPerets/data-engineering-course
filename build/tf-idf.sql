WITH documents(doc_id, body) AS (
  VALUES
    ('D1', 'data science uses data.'),
    ('D2', 'data engineering builds pipelines.'),
    ('D3', 'science uses experiments.'),
    ('D4', 'engineering uses data pipelines.')
),

corpus AS (
  SELECT
    doc_id,
    body,
    COUNT(*) OVER () AS n_docs
  FROM documents
),

tokens AS (
  SELECT
    c.doc_id,
    c.n_docs,
    tok.term
  FROM corpus c
  CROSS JOIN LATERAL regexp_split_to_table(
    regexp_replace(lower(c.body), '[^a-z0-9]+', ' ', 'g'),
    '\s+'
  ) AS tok(term)
  WHERE tok.term <> ''
),

token_stats AS (
  SELECT
    doc_id,
    term,
    n_docs,
    COUNT(*) OVER (PARTITION BY doc_id, term) AS term_count,
    COUNT(*) OVER (PARTITION BY doc_id) AS doc_len,
    ROW_NUMBER() OVER (
      PARTITION BY doc_id, term
      ORDER BY term
    ) AS term_row
  FROM tokens
),

doc_terms AS (
  SELECT
    doc_id,
    term,
    n_docs,
    term_count,
    doc_len
  FROM token_stats
  WHERE term_row = 1
),

tfidf_input AS (
  SELECT
    doc_id,
    term,
    term_count,
    doc_len,
    n_docs,
    COUNT(*) OVER (PARTITION BY term) AS df
  FROM doc_terms
)

SELECT
  doc_id,
  term,
  term_count,
  doc_len,
  df,
  ROUND(
    (term_count::numeric / NULLIF(doc_len, 0))
    * LN((n_docs + 1.0) / (df + 1.0)),
    4
  ) AS tfidf
FROM tfidf_input
ORDER BY doc_id, term;
