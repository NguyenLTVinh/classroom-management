CREATE TABLE students (
    number INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL,
    email1 VARCHAR(255) NOT NULL,
    email2 VARCHAR(255)
);
