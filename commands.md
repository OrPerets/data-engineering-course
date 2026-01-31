pandoc lectures/01-intro/lecture.md  -o build/01-introduction.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week01  --pdf-engine=xelatex

pandoc lectures/02-distributed-db/lecture.md  -o build/02-distributed-dbs.pptx     --reference-doc=reference.pptx  --resource-path=diagrams/week02 --pdf-engine=xelatex

pandoc lectures/03-parallelism/lecture.md  -o build/03-parallelism.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week03 --pdf-engine=xelatex

pandoc lectures/04-etl-ingestion/lecture.md  -o build/04-ingestion.pptx     --reference-doc=reference.pptx
--resource-path=diagrams/week04 --pdf-engine=xelatex

pandoc lectures/05-dwh-datalake/lecture.md  -o build/05-DWH.pptx     --reference-doc=reference.pptx
--resource-path=diagrams/week05 --pdf-engine=xelatex

pandoc lectures/06-mapreduce/lecture.md  -o build/06-map-reduce.pptx     --reference-doc=reference.pptx
--resource-path=diagrams/week06 --pdf-engine=xelatex

pandoc lectures/07-mapreduce-advanced/lecture.md  -o build/07-map-reduce.pptx     --reference-doc=reference.pptx  --resource-path=diagrams/week7  --pdf-engine=xelatex

pandoc lectures/08-text-tfidf/lecture.md  -o build/08-TF-IDF.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week8  --pdf-engine=xelatex

pandoc lectures/09-text-advanced/lecture.md  -o build/09-text-processing.pptx     --reference-doc=reference.pptx
--resource-path=diagrams/week9 --pdf-engine=xelatex

pandoc lectures/10-streaming/lecture.md  -o build/10-streaming.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week10 --pdf-engine=xelatex

pandoc lectures/11-feature-engineering/lecture.md  -o build/11-feature-engineering.pptx     --reference-doc=reference.pptx
--resource-path=diagrams/week11 --pdf-engine=xelatex

pandoc lectures/12-feature-engineering-advanced/lecture.md  -o build/11-feature-engineering-advanced.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week11 --pdf-engine=xelatex