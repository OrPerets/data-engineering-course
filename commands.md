python3 create_prompt.py --week 1  --folder 01-intro                    --topic "Introduction to Data Engineering"

python3 create_prompt.py --week 2  --folder 02-distributed-db           --topic "Distributed Databases: SQL vs NoSQL"
python3 create_prompt.py --week 3  --folder 03-parallelism              --topic "Parallelism and Divide-and-Conquer"
python3 create_prompt.py --week 4  --folder 04-etl-ingestion            --topic "Data Ingestion and ETL Pipelines"
python3 create_prompt.py --week 5  --folder 05-dwh-datalake             --topic "Data Warehousing and Data Lakes"
python3 create_prompt.py --week 6  --folder 06-mapreduce                --topic "MapReduce Fundamentals"
python3 create_prompt.py --week 7  --folder 07-mapreduce-advanced       --topic "Advanced MapReduce and Data Skew"
python3 create_prompt.py --week 8  --folder 08-text-tfidf               --topic "Text Processing at Scale: TF-IDF"
python3 create_prompt.py --week 9  --folder 09-text-advanced            --topic "Advanced Text Processing Techniques"
python3 create_prompt.py --week 10 --folder 10-streaming                --topic "Streaming Data and Real-Time Processing"
python3 create_prompt.py --week 11 --folder 11-feature-engineering      --topic "Feature Engineering for Data Systems"
python3 create_prompt.py --week 12 --folder 12-feature-engineering-advanced --topic "Advanced Feature Engineering Pipelines"
python3 create_prompt.py --week 13 --folder 13-dataops                  --topic "DataOps, Testing, and Data Quality"
python3 create_prompt.py --week 14 --folder 14-review                   --topic "Course Review and Exam Preparation"



pandoc lectures/01-intro/lecture.md  -o build/01-introduction.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week01  --pdf-engine=xelatex
pandoc lectures/01-intro/practice.md  -o build/01-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/02-distributed-db/lecture.md  -o build/02-Distributed-DBs.pptx     --reference-doc=reference.pptx  --resource-path=diagrams/week02
pandoc lectures/02-distributed-db/practice.md  -o build/02-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/03-parallelism/lecture.md  -o build/03-Parallelism.pptx     --reference-doc=reference.pptx
pandoc lectures/03-parallelism/practice.md  -o build/03-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/04-etl-ingestion/lecture.md  -o build/04-Ingestion.pptx     --reference-doc=reference.pptx
pandoc lectures/04-etl-ingestion/practice.md  -o build/04-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/05-dwh-datalake/lecture.md  -o build/05-DWH.pptx     --reference-doc=reference.pptx
pandoc lectures/05-dwh-datalake/practice.md  -o build/05-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/06-mapreduce/lecture.md  -o build/06-MapReduce.pptx     --reference-doc=reference.pptx
pandoc lectures/06-mapreduce/practice.md  -o build/06-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/07-mapreduce-advanced/lecture.md  -o build/07-MapReduce.pptx     --reference-doc=reference.pptx
pandoc lectures/07-mapreduce-advanced/practice.md  -o build/07-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/08-text-tfidf/lecture.md  -o build/08-TF-IDF.pptx     --reference-doc=reference.pptx
pandoc lectures/08-text-tfidf/practice.md  -o build/08-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/09-text-advanced/lecture.md  -o build/09-TextProcessing.pptx     --reference-doc=reference.pptx
pandoc lectures/09-text-advanced/practice.md  -o build/09-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/10-streaming/lecture.md  -o build/10-Streaming.pptx     --reference-doc=reference.pptx --resource-path=diagrams/week10 --pdf-engine=xelatex
pandoc lectures/10-streaming/practice.md  -o build/10-practice.pptx     --reference-doc=reference.pptx

pandoc lectures/11-feaure-engineering/lecture.md  -o build/11-feaure-engineering.pptx     --reference-doc=reference.pptx
pandoc lectures/11-feature-engineering/practice.md  -o build/11-practice.pptx     --reference-doc=reference.pptx