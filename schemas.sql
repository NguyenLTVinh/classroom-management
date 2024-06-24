CREATE TABLE students (
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL,
    email1 VARCHAR(255) NOT NULL,
    email2 VARCHAR(255)
    block INT,
    year INT
);

CREATE TABLE grades (
    email1 VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    term VARCHAR(10) NOT NULL,
    grade FLOAT,
    passfail CHAR(1)
);
