# הרצאה 4 - ETL ו־Ingestion

### שאלה 1
מהו ההבדל המרכזי בין Batch Ingestion ל־Streaming Ingestion?

A. ב־Batch נתונים מגיעים ברצף קבוע בזמן אמת, וב־Streaming רק פעם ביום
B. ב־Batch הנתונים נאספים ומעובדים במנות, וב־Streaming הם נכנסים ומעובדים כמעט בזמן אמת
C. ב־Batch יש צורך ב־CDC, וב־Streaming אין אפשרות ל־CDC
D. ב־Batch משתמשים רק ב־SQL, וב־Streaming רק ב־Python

**תשובה נכונה:** B

### שאלה 2
מהי המשמעות של תהליך Ingestion אידמפוטנטי (Idempotent)?

A. אפשר להריץ אותו רק פעם אחת
B. ניתן להריץ אותו מספר פעמים בלי לשנות את התוצאה הסופית
C. הוא תמיד יוצר כפילויות
D. הוא מחייב שימוש ב־Schema Registry

**תשובה נכונה:** B

### שאלה 3
מערכת Ingestion קוראת 600,000 רשומות בקצב של 2,500 רשומות לשנייה. כמה זמן ייקח התהליך?

A. 4 דקות
B. 240 שניות
C. 10 דקות
D. 600 שניות

**תשובה נכונה:** B

### שאלה 4
איזה מנגנון מתאים ביותר לצורך קליטה של שינויים בלבד (Insert/Update/Delete) ממערכת מקור?

A. Full Load תקופתי
B. CDC (Change Data Capture)
C. Data Masking
D. File Compaction

**תשובה נכונה:** B
