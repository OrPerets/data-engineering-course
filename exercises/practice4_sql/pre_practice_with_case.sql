DROP TABLE IF EXISTS students_scores;

CREATE TEMP TABLE students_scores (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(50),
    score INT
);

INSERT INTO students_scores (student_id, student_name, score) VALUES
(1, 'Noa', 95),
(2, 'Avi', 78),
(3, 'Dana', 62),
(4, 'Yossi', 45);

SELECT
    student_name,
    score,
    CASE
        WHEN score >= 90 THEN 'Excellent'
        WHEN score >= 70 THEN 'Good'
        WHEN score >= 50 THEN 'Pass'
        ELSE 'Fail'
    END AS result_level
FROM students_scores;


WITH passed_students AS (
    SELECT
        student_id,
        student_name,
        score
    FROM students_scores
    WHERE score >= 50
)
SELECT
    student_name,
    score
FROM passed_students;

WITH passed_students AS (
    SELECT
        student_name,
        score
    FROM students_scores
    WHERE score >= 50
)
SELECT
    student_name,
    score,
    CASE
        WHEN score >= 90 THEN 'Top Pass'
        WHEN score >= 70 THEN 'Regular Pass'
        ELSE 'Low Pass'
    END AS pass_type
FROM passed_students;
