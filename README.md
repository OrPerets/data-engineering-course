# 📘 מיפוי קורס: הנדסת נתונים (Data Engineering)

מסמך זה משמש כ־**README מרכזי** לקורס *הנדסת נתונים* (3103177) ומספק מיפוי מסודר של:

- נושאים נדרשים לפי הסילבוס
- דוגמאות ותרגילים רצויים (עם דגש הנדסי)
- חומרים קיימים (משנים קודמות) לצורך Reference
- פערים וחוסרים לפיתוח תוכן קנוני חדש

המסמך הוא בסיס עבודה למעבר מלא לתכנים מבוססי Markdown, מהם ניתן יהיה:
- לייצר מצגות (Pandoc / Marp / Quarto)
- לבנות מחברות תרגול
- לתחזק את הקורס בצורה גרסתית וברורה

> ⚠️ **דגש פדגוגי מרכזי**: זהו קורס לסטודנטים להנדסה. כל שיעור חייב לשלב:
> - תיאוריה פורמלית (הגדרות, מודלים, אלגוריתמים)
> - תרגילים חישוביים / אנליטיים (ידניים, פסאודו־קוד, ניתוח סיבוכיות/עלות)
> - דוגמאות פרקטיות מעולמות הנדסת הנתונים  
>
> זה **לא** קורס "סקירה טכנולוגית" בלבד — זה קורס הנדסי הדורש הבנה, חישוב והסקת מסקנות.

---

## 🧭 מבנה רפוזיטורי מומלץ (Canonical)

```text
Data-Engineering-Course/
│
├── README.md                 # מסמך זה
├── syllabus/
│   └── syllabus.md           # סילבוס רשמי
│
├── exercises1.md             # ✅ exercise bank (reference only)
├── exercises2.md             # ✅ exercise bank (reference only)
│
├── sources/                  # 🔒 חומרים היסטוריים (PDF / PPT) — Reference בלבד
│   ├── Lecture 1.pptx
│   ├── Lecture 2.pptx
│   ├── Lecture 3.pptx
│   ├── Introduction & Recap.pdf
│   ├── MapReduce_Intro.pdf
│   ├── TF-IDF.pdf
│   ├── Spark.pdf
│   └── RegularExpressions.pptx
│
├── lectures/                 # ✨ תוכן קנוני — Markdown בלבד (Single Source of Truth)
│   ├── 01-intro/
│   │   ├── lecture.md
│   │   └── practice.md
│   ├── 02-distributed-db/
│   │   ├── lecture.md
│   │   └── practice.md
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
├── diagrams/                 # ✅ PlantUML בלבד + template.puml
│   └── template.puml
│
├── datasets/
└── build/                    # פלט מצגות / PDF (Generated)
````

---

## 📦 מדיניות עבודה עם `sources/` (Read-Only)

תיקיית `sources/` מכילה **אך ורק** חומרים משנים קודמות (PDF / PPT / DOC).

כללים:

* ❌ אין לערוך קבצים בתיקייה זו
* ❌ אין להתייחס אליהם כ־Single Source of Truth
* ✅ הם משמשים כ־Reference: השראה, בדיקת כיסוי, ושאיבת דוגמאות

כל תוכן רשמי של הקורס **חייב** להופיע תחת `lectures/*/*.md`.

---

## 📚 Exercise Banks (Root) — Reference Only

ברוט של הריפו קיימים:

* `exercises1.md`
* `exercises2.md`

מטרתם: לשמש **בנק תרגילים/פתרונות** ודפוסי כתיבה ל־`practice.md`.

כללים:

* ✅ מותר לשאוב רעיונות, מבנה, וסגנון פתרון
* ✅ מותר להתאים תרגיל לנושא השבוע ולדאטה של השבוע
* ❌ אסור להעתיק בלוקים ארוכים מילה-במילה
* ❌ אסור לערוך את הקבצים הללו

חובה בכל `practice.md`:

* להוסיף שקף: `## Reference Exercises Used (Root)`
* לציין בקצרה אילו תבניות/תרגילים שימשו כהשראה

---

## 🧩 דיאגרמות (PlantUML) — כלל מחייב

הקורס משתמש בדיאגרמות כדי להעמיק הבנה של:

* pipeline / זרימה
* execution flow (שאילתה, job, streaming)
* failure propagation (מה נשבר ואיך)

כללים:

* ✅ כל דיאגרמה משמעותית **חייבת להיות PlantUML**
* ✅ הדיאגרמות נשמרות תחת `diagrams/` בלבד
* ✅ כל דיאגרמה מתחילה מהטמפלייט: `diagrams/template.puml`
* ❌ אסור להחליף PlantUML ב־ASCII עבור תרשימים אמיתיים
  (מותר ASCII קטן מאוד שורה-שתיים לאינטואיציה נקודתית בלבד)

---

## 🗂️ מיפוי שיעור־שיעור (Coverage Map)

> לכל שיעור מצוינים גם **תרגילים הנדסיים נדרשים** — תרגילים הכוללים חישובים, ניתוח אלגוריתמי, הערכת עלויות/סקייל, או ניתוח תרחישים פורמליים.

### שיעור 1 – מבוא להנדסת נתונים

**נושאים נדרשים**

* מהי Data Engineering (הבדל מ־Data Science / Analytics)
* Centralized vs Distributed systems
* NoSQL – למה ומתי
* תפקידי Data Engineer בארגון מודרני

**קיים (sources/)**

* `Lecture 1.pptx`
* `Introduction & Recap.pdf`

**פערים**

* framing ברור של "בעיית סקייל"
* narrative ארגוני: מי צורך את הדאטה ולמה

**דוגמאות להוספה**

* התפתחות: Excel → DB → Data Lake → Lakehouse
* Flow: source → raw → processed → consumer

---

### שיעור 2 – בסיסי נתונים מבוזרים: SQL מול NoSQL

**נושאים נדרשים**

* למה להפיץ? (limits של node יחיד)
* SQL vs NoSQL – מודלים, לא כלים
* trade-offs (latency/consistency/availability)

**קיים (sources/)**

* `Lecture 2.pptx`

**פערים**

* תרגיל החלטה (requirements → DB choice)
* חיבור ל־use cases אמיתיים

**דוגמאות להוספה**

* תרחיש: מערכת לוגים / clickstream
* טבלת "דרישות → בחירת DB"

---

### שיעור 3 – Parallelism & Divide and Conquer

**נושאים נדרשים**

* Divide & Conquer
* מקביליות vs קונקרנציה
* פונקציונליות כבסיס לחישוב מבוזר

**קיים (sources/)**

* `Lecture 3.pptx`

**פערים**

* חיבור מפורש ל־MapReduce
* דוגמה ידנית פשוטה

---

### שיעור 4 – Data Ingestion & ETL Pipelines

**נושאים נדרשים**

* סוגי מקורות נתונים
* ETL vs ELT
* זרימת דאטה בארגון
* idempotency + reruns + failure handling

**קיים (sources/)**

* `Lecture 4.pptx`

**פערים**

* pipeline מלא מקצה לקצה
* טיפול בכשלים + incremental loads

---

### שיעור 5 – Data Warehousing & Data Lakes

**נושאים נדרשים**

* DWH vs Data Lake
* schema-on-read / schema-on-write
* partitioning / pruning / cost intuition

**פערים**

* חיבור מפורש ל־Analytics/BI

---

### שיעורים 6–7 – MapReduce

**נושאים נדרשים**

* אלגוריתם MapReduce
* חשיבה מבוזרת: map/shuffle/reduce
* data skew + mitigations

**פערים**

* walkthrough ידני מלא (map → shuffle → reduce)
* צמצום חזרתיות

---

### שיעור 8 – עיבוד טקסט: TF-IDF

**נושאים נדרשים**

* TF-IDF
* שימושים בהנדסת נתונים

**פערים**

* חיבור לצינור הנדסי (ingestion → cleaning → features → store)

---

### שיעור 9 – עיבוד טקסט מתקדם

**נושאים נדרשים**

* n-grams / embeddings (engineering view)
* feature vs model

**פערים**

* הרצאה ייעודית + דוגמאות מתקדמות

---

### שיעור 10 – Streaming & Real-Time Processing

**נושאים נדרשים**

* streaming data
* windows
* latency vs throughput
* event-time vs processing-time

**פערים**

* מסגור Streaming + דוגמאות event-based

---

### שיעורים 11–12 – Feature Engineering

**נושאים נדרשים**

* feature pipelines
* leakage
* offline vs online features (conceptual)

**פערים**

* חומר מלא + דוגמאות לפני/אחרי

---

### שיעור 13 – DataOps

**נושאים נדרשים**

* CI/CD
* בדיקות דאטה
* ניטור, איכות, incident thinking

**פערים**

* הרצאה מלאה + דוגמה Great Expectations / dbt tests

---

## 🧪 תרגולים (Practices) — עקרונות ותכנון

מטרת התרגולים היא **לבסס חשיבה הנדסית**, לא רק שליטה תחבירית.
כל תרגול:

* מחזק את התיאוריה מההרצאה
* מאמן חישוב, ניתוח ועלויות (זמן/זיכרון/רשת)
* מכין לקריאה וניתוח של מערכות הנדסת נתונים אמיתיות

---

## 📐 עקרונות חובה לכל `practice.md`

> ⚠️ **דרישת פורמט קריטית**: כל קובץ Markdown בקורס חייב להיות **slide-ready**
> (להמרה אוטומטית ל־PPT/PDF ללא ניקוי ידני).

כל `practice.md` חייב לכלול:

1. **Data Context קונקרטי**

   * טבלאות / קבצים / events
   * columns + meanings
   * keys/partitions
   * sizes (גם הערכה)

2. **תרגילים חישוביים**

   * נפחים (rows/bytes/partitions)
   * עלות (זמן/רשת/זיכרון)
   * cardinality / intermediate results

3. **תרגילי reasoning**

   * trade-offs
   * bottlenecks
   * “מה יקרה אם…”

4. **מעט קוד – הרבה חשיבה**

   * SQL רק כשצריך
   * פסאודו־קוד מועדף על boilerplate

5. **קושי מדורג**

   * Warm-up → Engineering → Challenge

6. **פתרונות מלאים**

   * כל תרגיל מקבל פתרון תואם
   * פתרון כולל הנחות + חישוב + בדיקה

---

## 🧪 Practice Modes (לפי נושא) — מחייב

כדי למנוע תרגילים אבסטרקטיים, בכל שבוע בוחרים Mode בהתאם לנושא:

### Mode A — SQL / ETL / ELT / Ingestion

חובה לכלול:

* 2–4 טבלאות עם keys + 6–12 שורות דוגמה
* 2–3 תרגילי SQL + פתרונות SQL מלאים
* תרגיל טעינה אינקרמנטלית (watermark/CDC) + דה-דופ + אידמפוטנטיות
* תרחיש כשל: rerun לא יוצר כפילויות

### Mode B — MapReduce

חובה לכלול:

* 8–12 רשומות קלט
* walkthrough מלא ידני: Map emits → Shuffle groups → Reduce output
* מקרה skew + פתרון (combiner / partitioner / salting)

### Mode C — DWH / OLAP

חובה לכלול:

* סכמת Star (Fact + לפחות 2 Dimensions) + שורות דוגמה
* תרגיל שמדגים partition pruning / reduction
* תרגיל על join size/cost reasoning

---

## 🧠 הנחיות־על לכתיבת `lecture.md` / `practice.md` (Slide-ready)

### מבנה

* `#` — כותרת מסמך (שקף פתיחה אחד)
* `##` — כותרת שקף (שקף אחד בלבד לכל `##`)

### מגבלות שקף

* נושא אחד בלבד לכל שקף
* עד 6 bullets
* עד 12 מילים לכל bullet
* ❌ אין פסקאות טקסט ארוכות

### סגנון תוכן

* הפרד בין: הגדרה → דוגמה → חישוב → מסקנה
* פריסה הדרגתית (progressive disclosure)
* קוד קצר בלבד (עד ~12 שורות לשקף)
* נוסחאות LaTeX פשוטות בלבד (1–2 לשקף)

### דיאגרמות

* דיאגרמות משמעותיות: PlantUML בלבד (`diagrams/`)
* בכל קובץ חייב להיות `## Diagram Manifest`
  (מיפוי שקף → קובץ → מטרה)

---

## ✅ Quality Gates (חובה לפני שמקבלים תוצר)

כל תוצר (`lecture.md` / `practice.md`) חייב לעבור את הבדיקות:

### שקפים

* [ ] אין שקפים ריקים: כל `##` כולל לפחות 3 bullets / טבלה / קוד / Diagram
* [ ] אין ערבוב נושאים בשקף
* [ ] אם נושא גדול → מפצלים (1/3), (2/3), (3/3)

### דיאגרמות

* [ ] קיימת כותרת: `## Diagram Manifest` בתחילת הקובץ
* [ ] כל `Diagram:` שמוזכר בשקף מופיע ב-Manifest
* [ ] כל manifest entry משויך לשקף יחיד
* [ ] שמות קבצים לפי סטנדרט:
  `week{WEEK_NO}_{lecture|practice}_slide{SLIDE_NO}_{desc}.puml`

### תרגולים

* [ ] `## Data Context` מופיע בתחילת practice עם דאטה קונקרטי
* [ ] `## Reference Exercises Used (Root)` קיים ומציין השראות
* [ ] לכל תרגיל יש שקף פתרון תואם בסדר זהה
* [ ] לפחות תרגיל אחד כולל חישוב/עלות/סקייל
* [ ] לפחות תרגיל אחד כולל כשל + rerun/אידמפוטנטיות

---

## 🧾 Solution Format Contract (חובה ב־Solutions)

כל שקף פתרון ב־`practice.md` חייב להיות במבנה:

* **Assumptions**: נתונים/סקייל/keys/חלונות זמן
* **Plan**: מה עושים ולמה
* **Execution**: SQL / פסאודו־קוד / (k,v)
* **Check**: איך מאמתים נכונות + מה יכול להשתבש

---

## 🎯 מטרת־על

כל קובץ Markdown צריך להיות **מוכן להמרה למצגת בלחיצת כפתור אחת** —
עם עומק הנדסי אמיתי: דאטה קונקרטי, חישובים, trade-offs, וחשיבה על כשל.
