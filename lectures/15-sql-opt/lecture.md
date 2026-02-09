# Week 15: SQL Optimization and Advanced Querying

## Lecture Context
- Business Intelligence — Lecture 4
- Instructor: Or Peretz

---

## Purpose
- Strengthen SQL fundamentals needed for optimization work
- Practice join patterns and NULL handling for reliable analytics
- Use subqueries and window functions to express complex logic efficiently

---

## Learning Objectives
- Differentiate SQL DML vs. DDL and apply each correctly
- Choose the right join type and understand NULL results
- Use subqueries with `ALL`, `IN`, and `EXISTS`
- Apply window functions for aggregation, ranking, and value navigation

---

## SQL Foundations (DML vs. DDL)
- **SQL** is a query language that is table-oriented and optimized for fast access to data.
- **CRUD** operations: Create, Read, Update, Delete.
- **DML (Data Manipulation Language):** `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- **DDL (Data Definition Language):** `CREATE`, `DROP`, `ALTER`

---

## Create + Insert + Verify (Example)
```sql
CREATE TABLE Students (
  Id int NOT NULL,
  First_Name text,
  Last_Name text,
  Birth_Date date,
  Hour_Salary float
);

INSERT INTO Students
VALUES (123456789, 'Israel', 'Israeli', '1980-03-20', 120.40);

SELECT *
FROM Students;
```

---

## Joining Tables — Why We Need Joins
When we want to handle multiple related tables, we must join them using primary/foreign keys.

---

## Example: Students Table

| FirstName | LastName | StudentID |
| --- | --- | --- |
| Avi | Cohen | 111 |
| Dan | Israeli | 222 |
| Ofer | Bar | 333 |

---

## Example: Courses Table

| StudentID | CourseNumber | CourseName | Grade |
| --- | --- | --- | --- |
| 111 | 289 | DB | 96 |
| 111 | 281 | Algo | 85 |
| 222 | 281 | Algo | 78 |

---

## Primary Key and Foreign Key
- **Primary Key:** StudentID in Students
- **Foreign Key:** StudentID in Courses

---

## How to Merge Two Tables? — Option 1
```sql
SELECT FirstName, CourseName, Grade
FROM Students AS S, Courses AS C
WHERE (S.StudentID = C.StudentID)
  AND (C.CourseName = 'Algo');
```

---

## Option 2 (Explicit JOIN)
```sql
SELECT FirstName, CourseName, Grade
FROM Students AS S
JOIN Courses AS C
  ON S.StudentID = C.StudentID
WHERE C.CourseName = 'Algo';
```

---

## ON vs. USING
- Use **`ON`** when join column names differ.
- Use **`USING`** when column names are the same.

---

## Option 3 (USING)
```sql
SELECT FirstName, CourseName, Grade
FROM Students
JOIN Courses USING (StudentID)
WHERE CourseName = 'Algo';
```

---

## Join Types
- **INNER JOIN**
- **OUTER JOIN**
  - LEFT OUTER JOIN
  - RIGHT OUTER JOIN
  - FULL OUTER JOIN

---

## Join Types: LEFT / RIGHT / FULL
Given 2 tables called `R1` and `R2` with a mutual column named `Name`.

- **LEFT OUTER JOIN:** All rows from `R1`, matched rows from `R2`. Unmatched values become NULL.
- **RIGHT OUTER JOIN:** All rows from `R2`, matched rows from `R1`. Unmatched values become NULL.
- **FULL OUTER JOIN:** All rows from both tables; unmatched values become NULL on either side.

---

## Handling NULL Values
- NULL values can come from:
  - Left/Right/Full outer joins
  - Missing data during inserts
  - Other data quality issues

---

## Example: Find Rows with Missing Course Data
```sql
SELECT FirstName, LastName, CourseNumber
FROM Student
LEFT OUTER JOIN Courses
USING (StudentID);
```

---

## Store Query in NewCourses; Filter NULLs
```sql
SELECT *
FROM NewCourses
WHERE CourseNumber IS NULL;
```

---

## Important: NULL Is Not a String
- Use `IS NULL` / `IS NOT NULL`.
- Wrong usage: `FirstName = 'NULL'` — **NULL is not a string.**

---

## Subqueries: ALL
Find the city whose average amount is greater than or equal to all city averages:

```sql
SELECT City
FROM Students
GROUP BY City
HAVING AVG(Amount) >= ALL (
  SELECT AVG(Amount)
  FROM Students
  GROUP BY City
);
```

---

## Subqueries: IN
Find all names living in specific cities:

```sql
SELECT Name
FROM Students
WHERE City IN ('Eilat', 'Haifa', 'Jerusalem');
```

---

## Subqueries: EXISTS
```sql
SELECT SUM(Amount)
FROM Students
WHERE EXISTS (
  SELECT *
  FROM AgudaMembers AS AM
  WHERE AM.Name = Students.Name
);
```

---

## Window Functions — Idea
Window functions perform calculations on a set of rows (the *window*) and return a value for **each row**, preserving row identity.

---

## Window Functions: Syntax
```sql
window_function_name([ALL] expression)
OVER ([PARTITION BY ...] [ORDER BY ...])
```

---

## Window Functions: Clauses
- **OVER:** defines the window.
- **PARTITION BY:** splits rows into partitions for independent calculations.
- **ORDER BY:** defines row order within each partition.

---

## Types of Window Functions
- **Aggregate window functions:** `SUM`, `MAX`, `MIN`, `AVG`, `COUNT`
- **Ranking window functions:** `RANK`, `DENSE_RANK`, `ROW_NUMBER`, `NTILE`
- **Value window functions:** `LAG`, `LEAD`, `FIRST_VALUE`, `LAST_VALUE`

---

## Example — Sales Table
```sql
CREATE TABLE Sales (
  Employee VARCHAR(45) NOT NULL,
  Year INT NOT NULL,
  Country VARCHAR(45) NOT NULL,
  Product VARCHAR(45) NOT NULL,
  Amount DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (Employee, Year)
);
```

---

## Aggregate Window Functions — SUM
```sql
SELECT Employee, Year, Country, Product, Amount,
       SUM(Amount) OVER (PARTITION BY Country) AS Total
FROM Sales;
```

---

## SUM Output

| Employee | Year | Country | Product | Amount | Total |
| --- | --- | --- | --- | --- | --- |
| Or Peretz | 2017 | Israel | Computer | 15000 | 45000 |
| Or Peretz | 2018 | Israel | Computer | 10000 | 45000 |
| Or Peretz | 2019 | Israel | TV | 20000 | 45000 |
| Omer Doron | 2018 | USA | TV | 20000 | 30000 |
| Omer Doron | 2019 | USA | Mobile | 10000 | 30000 |

---

## Aggregate Window Functions — AVG
```sql
SELECT Employee, Year, Country, Product, Amount,
       AVG(Amount) OVER (PARTITION BY Country, YEAR(Year)) AS AvgSales
FROM Sales;
```

---

## AVG Output

| Employee | Year | Country | Product | Amount | AvgSales |
| --- | --- | --- | --- | --- | --- |
| Or Peretz | 2017 | Israel | Computer | 15000 | 15000 |
| Or Peretz | 2018 | Israel | Computer | 10000 | 15000 |
| Or Peretz | 2019 | Israel | TV | 20000 | 15000 |
| Omer Doron | 2018 | USA | TV | 20000 | 15000 |
| Omer Doron | 2019 | USA | Mobile | 10000 | 15000 |

---

## Aggregate Window Functions — COUNT
```sql
SELECT Employee, Year, Country, Product, Amount,
       COUNT(Product) OVER (PARTITION BY Country) AS TotalProduct
FROM Sales;
```

---

## Aggregate Window Functions — MAX
```sql
SELECT Employee, Year, Country, Product, Amount,
       MAX(Product) OVER (PARTITION BY Country) AS TotalProduct
FROM Sales;
```

---

## Ranking Window Functions — Data for Examples

| FirstName | LastName | City |
| --- | --- | --- |
| Luisa | Evans | Texas |
| Paul | Ward | Alaska |
| Peter | Bennett | California |
| Carlos | Patterson | New York |
| Rose | Huges | Florida |
| Marielia | Simmons | Texas |
| Antonio | Butler | New York |
| Diego | Cox | California |

---

## Example — RANK
```sql
SELECT FirstName, LastName, City,
       RANK() OVER (ORDER BY City) AS RankNo
FROM table;
```

---

## RANK Output

| FirstName | LastName | City | RankNo |
| --- | --- | --- | --- |
| Paul | Ward | Alaska | 1 |
| Peter | Bennett | California | 2 |
| Diego | Cox | California | 2 |
| Rose | Huges | Florida | 4 |
| Carlos | Patterson | New York | 5 |
| Antonio | Butler | New York | 5 |
| Luisa | Evans | Texas | 7 |
| Marielia | Simmons | Texas | 7 |

---

## Example — DENSE_RANK
```sql
SELECT FirstName, LastName, City,
       DENSE_RANK() OVER (ORDER BY City) AS RankNo
FROM table;
```

---

## DENSE_RANK Output

| FirstName | LastName | City | RankNo |
| --- | --- | --- | --- |
| Paul | Ward | Alaska | 1 |
| Peter | Bennett | California | 2 |
| Diego | Cox | California | 2 |
| Rose | Huges | Florida | 3 |
| Carlos | Patterson | New York | 4 |
| Antonio | Butler | New York | 4 |
| Luisa | Evans | Texas | 5 |
| Marielia | Simmons | Texas | 5 |

---

## Example — NTILE
```sql
SELECT FirstName, LastName, City,
       NTILE(3) OVER (ORDER BY City) AS RankNo
FROM table;
```

---

## NTILE Output

| FirstName | LastName | City | RankNo |
| --- | --- | --- | --- |
| Paul | Ward | Alaska | 1 |
| Peter | Bennett | California | 1 |
| Diego | Cox | California | 1 |
| Rose | Huges | Florida | 2 |
| Carlos | Patterson | New York | 2 |
| Antonio | Butler | New York | 2 |
| Luisa | Evans | Texas | 3 |
| Marielia | Simmons | Texas | 3 |

---

## Value Window Functions — LEAD
```sql
SELECT Year, Product, Country, Amount,
       LEAD(Amount, 1) OVER (PARTITION BY Year ORDER BY Country) AS NextAmount
FROM Sales;
```

---

## LEAD Output

| Year | Product | Country | Amount | NextAmount |
| --- | --- | --- | --- | --- |
| 2017 | Computer | Canada | 15000 | 10000 |
| 2017 | Laptop | Israel | 10000 | 20000 |
| 2017 | TV | Israel | 20000 | NULL |
| 2018 | TV | Canada | 20000 | 10000 |
| 2018 | Mobile | USA | 10000 | NULL |

---

## Value Window Functions — LAG
```sql
SELECT Year, Product, Country, Amount,
       LAG(Amount, 1) OVER (PARTITION BY Year ORDER BY Country) AS PrevAmount
FROM Sales;
```

---

## LAG Output

| Year | Product | Country | Amount | PrevAmount |
| --- | --- | --- | --- | --- |
| 2017 | Computer | Canada | 15000 | NULL |
| 2017 | Laptop | Israel | 10000 | 15000 |
| 2017 | TV | Israel | 20000 | 10000 |
| 2018 | TV | Canada | 20000 | NULL |
| 2018 | Mobile | USA | 10000 | 20000 |

---

## FIRST_VALUE / LAST_VALUE
```sql
SELECT Year, Product, Country, Amount,
       FIRST_VALUE(Amount) OVER (PARTITION BY Country ORDER BY Country) AS FirstAmount,
       LAST_VALUE(Amount) OVER (PARTITION BY Country ORDER BY Country) AS LastAmount
FROM Sales;
```

---

## FIRST_VALUE / LAST_VALUE Output

| Year | Product | Country | Amount | FirstAmount | LastAmount |
| --- | --- | --- | --- | --- | --- |
| 2017 | Computer | Canada | 15000 | 15000 | 10000 |
| 2018 | Laptop | Canada | 10000 | 15000 | 10000 |
| 2017 | TV | Israel | 10000 | 10000 | 20000 |
| 2018 | TV | Israel | 15000 | 10000 | 20000 |
| 2019 | Mobile | Israel | 20000 | 10000 | 20000 |

---

## Key Takeaways
- Correct join choice controls both correctness and NULL behavior.
- Subqueries with `ALL`, `IN`, and `EXISTS` express different logical checks.
- Window functions enable analytics patterns without losing row-level detail.
