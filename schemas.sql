CREATE TABLE students (
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL,
    email1 VARCHAR(255) NOT NULL,
    email2 VARCHAR(255)
    block INT,
    year INT,
    UNIQUE (name, class, birthday, email1)
);

CREATE TABLE grades (
    email1 VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    term VARCHAR(10) NOT NULL,
    grade FLOAT,
    passfail CHAR(1),
    year INT,
    UNIQUE (email1, subject, term, year)
);
