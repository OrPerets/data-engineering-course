# 📘 מיפוי קורס: הנדסת נתונים (Data Engineering)

מסמך זה נועד לשמש כ־**README מרכזי** לקורס *הנדסת נתונים* (3103177), ולספק מיפוי מסודר של:

* נושאים נדרשים לפי הסילבוס
* דוגמאות ותרגילים רצויים
* חומרים קיימים (מהזיפ של שנים קודמות)
* פערים וחוסרים

המסמך משמש כבסיס עבודה למעבר מלא לפיתוח תכנים מבוססי Markdown, שמהם ניתן יהיה:

* לייצר מצגות (Pandoc / Marp / Quarto)
* לבנות מחברות תרגול
* לתחזק את הקורס בצורה גרסתית

> ⚠️ **דגש פדגוגי מרכזי**: זהו קורס לסטודנטים להנדסה. כל שיעור חייב לשלב:
>
> * תיאוריה פורמלית (הגדרות, מודלים, אלגוריתמים)
> * תרגילים חישוביים / אנליטיים (ידניים, פסאודו־קוד, ניתוח סיבוכיות)
> * דוגמאות פרקטיות מעולמות הנדסת הנתונים
>
> אין מדובר בקורס "סקירה טכנולוגית" בלבד, אלא בקורס הנדסי הדורש הבנה, חישוב והסקת מסקנות.

---

## 🧭 מבנה מומלץ לרפוזיטורי הקורס

````text
Data-Engineering-Course/
│
├── README.md                # מיפוי הקורס (מסמך זה)
├── syllabus/                # סילבוס רשמי
│   └── syllabus.md
├── sources/                 # 🔒 חומרים היסטוריים (PDF / PPT)
│   │                          # Reference בלבד – לא לעריכה
│   ├── Lecture 1.pptx
│   ├── Lecture 2.pptx
│   ├── Lecture 3.pptx
│   ├── Introduction & Recap.pdf
│   ├── MapReduce_Intro.pdf
│   ├── TF-IDF.pdf
│   ├── Spark.pdf
│   └── RegularExpressions.pptx
├── lectures/                # ✨ תוכן קנוני – Markdown בלבד
│   ├── 01-intro/
│   │   ├── lecture.md
│   │   └── exercises.md
│   ├── 02-distributed-db/
│   ├── 03-parallelism/
│   ├── 04-etl-ingestion/
│   ├── 05-dwh-datalake/
│   ├── 06-mapreduce/
│   ├── 07-mapreduce-advanced/
│   ├── 08-text-tfidf/
│   ├── 09-text-advanced/
│   ├── 10-streaming/
│   ├── 11-feature-engineering/
│   ├── 12-feature-engineering-advanced/
│   ├── 13-dataops/
│   └── 14-review/
│
├── datasets/
├── diagrams/
└── build/                   # פלט מצגות / PDF
```text
Data-Engineering-Course/
│
├── README.md                # מיפוי הקורס (מסמך זה)
├── syllabus/                # סילבוס רשמי
│   └── syllabus.md
├── lectures/
│   ├── 01-intro/
│   │   ├── lecture.md
│   │   └── exercises.md
│   ├── 02-distributed-db/
│   ├── 03-parallelism/
│   ├── 04-etl-ingestion/
│   ├── 05-dwh-datalake/
│   ├── 06-mapreduce/
│   ├── 07-mapreduce-advanced/
│   ├── 08-text-tfidf/
│   ├── 09-text-advanced/
│   ├── 10-streaming/
│   ├── 11-feature-engineering/
│   ├── 12-feature-engineering-advanced/
│   ├── 13-dataops/
│   └── 14-review/
│
├── datasets/
├── diagrams/
└── build/                   # פלט מצגות / PDF
````

---

## 📦 מדיניות עבודה עם sources/

תיקיית `sources/` מכילה **אך ורק** חומרים משנים קודמות (PDF / PPT / DOC).

כללים:

* ❌ אין לערוך קבצים בתיקייה זו
* ❌ אין להסתמך עליהם כ־Single Source of Truth
* ✅ הם משמשים כ־reference, השראה ובדיקת כיסוי בלבד

כל תוכן רשמי של הקורס **חייב** להופיע ב־`lectures/*.md`.

---

## 🗂️ מיפוי שיעור־שיעור

> לכל שיעור מצוינים גם **תרגילים הנדסיים נדרשים** – תרגילים הכוללים חישובים, ניתוח אלגוריתמי, הערכת סיבוכיות, או ניתוח תרחישים פורמליים. אלו אינם בגדר העשרה, אלא חלק אינטגרלי מהקורס.

> כל החומרים ההיסטוריים מהזיפ ימוקמו בתיקייה `sources/` וישמשו כ־**reference בלבד**. אין כוונה לערוך אותם, אלא למפות מהם ידע, דוגמאות ושקפים שימושיים.

### שיעור 1 – מבוא להנדסת נתונים

**נושאים נדרשים**

* מהי Data Engineering (הבדל מ־Data Science / Analytics)
* Centralized vs Distributed systems
* NoSQL – למה ומתי
* תפקידי Data Engineer בארגון מודרני

**קיים (sources/)**

* `Lecture 1.pptx`
* `Introduction & Recap.pdf`

**מה יש בפועל**

* הגדרות טובות והקשר היסטורי
* השוואה בסיסית בין מערכות

**מה חסר / פערים**

* framing ברור של "בעיית סקייל"
* אין narrative ארגוני (מי צורך את הדאטה ולמה)

**דוגמאות מומלצות להוספה**

* סיפור התפתחות: Excel → DB → Data Lake
* דיאגרמת flow: source → raw → processed → consumer

**Best Practices להדגשה**

* Data engineering מתחיל משאלות עסקיות, לא מטכנולוגיה
* אין פתרון אחד שמתאים לכולם

---

### שיעור 2 – בסיסי נתונים מבוזרים: SQL מול NoSQL

**נושאים נדרשים**

* Distributed databases – למה בכלל לפזר?
* SQL vs NoSQL – מודלים, לא כלים
* Trade-offs

**קיים (sources/)**

* `Lecture 2.pptx`

**מה יש בפועל**

* השוואה טבלאית טובה
* דוגמאות קלאסיות

**מה חסר / פערים**

* תרגיל קבלת החלטות
* חיבור ל־use cases אמיתיים

**דוגמאות מומלצות להוספה**

* תרחיש: מערכת המלצות / מערכת לוגים
* טבלת "דרישות → בחירת DB"

**Best Practices**

* SQL vs NoSQL זו לא דיכוטומיה
* לרוב ארגונים משתמשים בשילוב

---

### שיעור 3 – Parallelism & Divide and Conquer

**נושאים נדרשים**

* Divide & Conquer
* מקביליות לעומת קונקרנציה
* פונקציונליות כבסיס לחישוב מבוזר

**קיים (sources/)**

* `Lecture 3.pptx`

**מה יש בפועל**

* דוגמאות אלגוריתמיות
* בסיס תאורטי טוב

**מה חסר / פערים**

* חיבור מפורש ל־MapReduce
* דוגמה ידנית פשוטה

**דוגמאות מומלצות להוספה**

* פירוק בעיית ספירה גדולה
* המחשה של bottleneck

**Best Practices**

* מקביליות לא תמיד משפרת ביצועים
* overhead הוא חלק מהשיקול

---

### שיעור 4 – Data Ingestion & ETL Pipelines

**נושאים נדרשים**

* סוגי מקורות נתונים
* ETL vs ELT
* זרימת דאטה בארגון

**קיים (sources/)**

* `Lecture 4.pptx`

**מה יש בפועל**

* הגדרות ברורות
* הבחנה נכונה בין ETL ל־ELT

**מה חסר / פערים**

* pipeline מלא מקצה לקצה
* טיפול בכשלים

**דוגמאות מומלצות להוספה**

* ingest של clickstream
* batch יומי מול streaming

**Best Practices**

* לשמור raw data תמיד
* ingestion חייב להיות idempotent

---

### שיעור 5 – Data Warehousing & Data Lakes

**נושאים נדרשים**

* DWH vs Data Lake
* schema-on-read / schema-on-write

**דוגמאות / תרגילים רצויים**

* ארכיטקטורת BI טיפוסית
* clickstream example

**קיים**

* Lecture 5

**חסר**

* חיבור מפורש ל־Analytics ו־BI

---

### שיעורים 6–7 – MapReduce

**נושאים נדרשים**

* אלגוריתם MapReduce
* חשיבה מבוזרת

**דוגמאות / תרגילים רצויים**

* Word Count
* Join ב־MapReduce

**קיים**

* Introduction to MapReduce
* Lectures 6–8

**חסר**

* תרגיל ידני מלא (map → shuffle → reduce)
* צמצום חזרתיות

---

### שיעור 8 – עיבוד טקסט: TF-IDF

**נושאים נדרשים**

* TF-IDF
* שימושים בהנדסת נתונים

**דוגמאות / תרגילים רצויים**

* חישוב ידני על מסמכים קצרים

**קיים**

* TF-IDF
* Regular Expressions

**חסר**

* חיבור לצינור הנדסי

---

### שיעור 9 – עיבוד טקסט מתקדם

**נושאים נדרשים**

* n-grams / embeddings
* הבחנה feature vs model

**קיים**

* חלקי בלבד

**חסר**

* הרצאה ייעודית
* דוגמאות מתקדמות

---

### שיעור 10 – Streaming & Real-Time Processing

**נושאים נדרשים**

* Streaming data
* Real-time vs batch

**קיים**

* Spark (כללי)

**חסר**

* מסגור Streaming
* דוגמאות Event-based

---

### שיעורים 11–12 – Feature Engineering

**נושאים נדרשים**

* Feature pipelines
* הקשר בין data ל־ML

**קיים**

* כמעט ולא

**חסר**

* חומר מלא
* דוגמאות לפני/אחרי

---

### שיעור 13 – DataOps

**נושאים נדרשים**

* CI/CD
* בדיקות נתונים
* ניטור

**קיים**

* לא קיים

**חסר**

* הרצאה מלאה
* דוגמה עם Great Expectations / dbt tests

---

## 🧪 תרגולים (Practices) – עקרונות ותכנון

מטרת התרגולים בקורס היא **לבסס חשיבה הנדסית** ולא רק שליטה תחבירית.
כל תרגול הוא חלק אינטגרלי מהקורס, ומיועד:

* לחזק את התיאוריה מההרצאה
* לאמן חישוב, ניתוח ועלויות
* להכין לקריאה וניתוח של מערכות הנדסת נתונים אמיתיות

---

## 📐 עקרונות חובה לכל תרגול

> ⚠️ **דרישת פורמט קריטית**: כל קובץ Markdown בקורס (lecture.md / practice.md) חייב להיות כתוב במבנה **מוחלק, אחיד ו־slide-ready**, כך שניתן יהיה להמיר אותו אוטומטית למצגת (Pandoc / Marp) ללא עריכה ידנית.

כל קובץ `practice.md` **חייב** לכלול:

1. **הקשר הנדסי ברור**

   * למה התרגול חשוב בהנדסת נתונים
   * לאיזה חלק בקורס / מערכת הוא מתקשר

2. **תרגילים חישוביים**

   * חישובי גודל נתונים (rows, bytes, partitions)
   * הערכת עלות (זמן / זיכרון / רשת)
   * ניתוח cardinality ו־intermediate results

3. **תרגילי חשיבה וניתוח**

   * "מה יקרה אם…"
   * זיהוי bottlenecks
   * בחירה בין חלופות

4. **מעט קוד – הרבה חשיבה**

   * קוד רק כשצריך
   * פסאודו־קוד מועדף על boilerplate

5. **קושי מדורג**

   * Warm-up (יישור קו)
   * Engineering (לב הקורס)
   * Challenge (אינטגרטיבי)

---

## 🧭 מיפוי תרגול־לפי־שבוע (שלד)

### Practice 1 – SQL & Tools Recap (Foundation)

**מטרה**: יישור קו והפיכת SQL לכלי הנדסי.

**נושאים**

* SELECT / WHERE / GROUP BY / HAVING
* JOIN כפעולה יקרה
* Aggregation כ־data reduction

**מה חייב להיות**

* חישוב גודל תוצאות JOIN
* ניתוח intermediate results
* פירוק query לצינור שלבים

**דגשים ל־Agent**

* לא ללמד SQL מאפס
* להכריח חישוב והסקת מסקנות

---

### Practice 2 – Parallelism & Divide-and-Conquer

**מטרה**: להבין מקביליות מעבר לסינטקס.

**נושאים**

* חלוקת עבודה
* overhead של מקביליות
* bottlenecks

**מה חייב להיות**

* חישוב speedup תיאורטי
* זיהוי נקודת רוויה

**דגשים ל־Agent**

* להראות שמקביליות לא תמיד משתלמת

---

### Practice 3 – ETL & Data Pipelines

**מטרה**: חשיבה בצינורות נתונים.

**נושאים**

* ETL vs ELT
* raw vs processed
* כשלים

**מה חייב להיות**

* תרגיל תכנון pipeline
* ניתוח failure scenarios

**דגשים ל־Agent**

* להתמקד בזרימה, לא בכלים

---

### Practice 4 – Data Warehousing & Data Lakes

**מטרה**: חיבור בין אחסון לאנליטיקה.

**נושאים**

* schema-on-read / write
* partitioning

**מה חייב להיות**

* חישוב נפחי אחסון
* השפעת partitioning על queries

**דגשים ל־Agent**

* לחשוב כמו data architect

---

### Practice 5 – MapReduce (Core)

**מטרה**: שליטה בחישוב מבוזר בסיסי.

**נושאים**

* Map / Shuffle / Reduce
* data skew

**מה חייב להיות**

* חישוב עלות shuffle
* זיהוי skew

**דגשים ל־Agent**

* חישוב לפני קוד

---

### Practice 6 – Text Processing at Scale

**מטרה**: עיבוד טקסט כהנדסת נתונים.

**נושאים**

* TF-IDF
* sparsity

**מה חייב להיות**

* חישוב ידני TF-IDF
* הערכת גודל מטריצה

**דגשים ל־Agent**

* פחות NLP, יותר דאטה

---

### Practice 7 – Streaming & Real-Time Reasoning

**מטרה**: חשיבה בזמן אמת.

**נושאים**

* windows
* latency vs throughput

**מה חייב להיות**

* חישוב קצבים
* ניתוח איחורים

**דגשים ל־Agent**

* להכריח trade-offs

---

### Practice 8 – Feature Engineering

**מטרה**: גישור בין דאטה למודלים.

**נושאים**

* feature pipelines
* leakage

**מה חייב להיות**

* לפני / אחרי feature engineering
* ניתוח השפעה על מודל

**דגשים ל־Agent**

* לא להיכנס למודל עצמו

---

### Practice 9 – DataOps & Quality

**מטרה**: יציבות ואמינות.

**נושאים**

* בדיקות דאטה
* ניטור

**מה חייב להיות**

* תכנון בדיקות
* ניתוח תקלות

**דגשים ל־Agent**

* לחשוב כמו production

---

## 🧠 הנחיות־על ל־Agent (חובה)

כאשר אתה מייצר `lecture.md` או `practice.md`:

### מבנה ופורמט (Slide-ready)

* השתמש ב־Markdown תקני בלבד
* `#` — כותרת מסמך (שקף פתיחה)
* `##` — כותרת שקף
* אין פסקאות ארוכות: כל תוכן חייב להיות

  * bullets
  * טבלאות קצרות
  * קוד / פסאודו־קוד
* לכל `##` מותר לכלול:

  * עד 6 bullets
  * עד 12 מילים לכל bullet
* נושא אחד בלבד לכל `##`
* אם נושא גדול → פצל ל־(1/2), (2/2)

### תוכן

* העדף פירוק הדרגתי (progressive disclosure)
* הפרד בין:

  * הגדרה
  * דוגמה
  * חישוב
  * מסקנות
* קוד קצר בלבד (עד ~12 שורות)

### תרגולים

* כל תרגיל צריך להיות מתאים לשקף אחד או שניים
* פתרונות מפוצלים לשלבים
* חישובים כתובים בצורה קריאה (כולל יחידות)

### אסור

* ❌ פסקאות טקסט ארוכות
* ❌ ערבוב נושאים בשקף אחד
* ❌ תוכן "מאמרי"

### מותר ומומלץ

* טבלאות קטנות
* דיאגרמות בטקסט (ASCII / תיאור מילולי)
* נוסחאות LaTeX פשוטות

מטרה: כל קובץ Markdown צריך להיות **מוכן להמרה למצגת בלחיצת כפתור אחת**, ללא ניקוי ידני.
