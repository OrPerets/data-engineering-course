# Week 9 Text Processing Diagram Additions

Standalone assets for `build/09-text-processing.pptx`.

Each diagram is exported as:

- `PNG`: 16:9, 3998 x 2250 px, suitable for direct PowerPoint insertion.
- `SVG`: vector version for editing or high-quality scaling.
- `PDF`: vector version for print/export workflows.

## Diagrams

| File stem | Suggested placement | Purpose |
|---|---:|---|
| `01_sliding_ngram_windows` | after slide 8 or 9 | Shows unigrams, bigrams, and trigrams as sliding windows over one token sequence. |
| `02_feature_vs_language_model` | after slide 7 or 18 | Separates n-gram TF-IDF features from n-gram language-model probabilities. |
| `03_markov_chain_bigram_probabilities` | after slide 16 or 17 | Visualizes the example bigram transition probabilities and sentence probability. |
| `04_ngram_pipeline_execution_flow` | after slide 20 or 21 | Shows the data-engineering pipeline from documents to TF-IDF or probability estimates. |
| `05_regex_tfidf_contract_flow` | after slide 30 or 31 | Shows how regex extraction, masking, and TF-IDF feature text should stay separated. |
| `06_embedding_versioning_drift_flow` | after slide 41 or 45 | Shows embedding inference with version registry, quality monitoring, and drift monitoring. |

## Regeneration

Run from the repository root:

```bash
python3 diagrams/week9/text_processing_additions/create_text_processing_diagrams.py
```

The generator uses a colorblind-safe palette and exports PNG, SVG, and PDF files in this folder.
