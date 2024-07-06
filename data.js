const mysql = require(`mysql-await`);
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function getStudentsByClass(class_name) {
    const query = 'SELECT email1, name FROM students WHERE class = ?';
    try {
        const results = await connection.awaitQuery(query, [class_name]);
        return results;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}

async function getClassList() {
    const query = 'SELECT DISTINCT class FROM students';
    try {
        const results = await connection.awaitQuery(query);
        return results.map(row => row.class);
    } catch (error) {
        console.error('Error fetching class list:', error);
        throw error;
    }
}

async function insertStudent(name, class_name, gender, birthday, email1, email2, block, year, callback) {
    const query = 'INSERT IGNORE INTO students (name, class, gender, birthday, email1, email2, block, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    try {
        const results = await connection.awaitQuery(query, [name, class_name, gender, birthday, email1, email2, block, year], callback);
        return results;
    } catch (error) {
        console.error('Error adding student:', error);
        throw error;
    }
}

async function insertGrade({ email1, subject, term, grade, passfail, year }) {
    const query = 'INSERT IGNORE INTO grades (email1, subject, term, grade, passfail, year) VALUES (?, ?, ?, ?, ?, ?)';
    try {
        await connection.awaitQuery(query, [email1, subject, term, grade, passfail, year]);
    } catch (error) {
        console.error('Error adding grade:', error);
        throw error;
    }
}

async function getStudentsByFilters(year, block, className) {
    let query = 'SELECT * FROM students WHERE year = ?';
    const params = [year];

    if (block) {
        query += ' AND block = ?';
        params.push(block);
    }
    if (className) {
        query += ' AND class = ?';
        params.push(className);
    }

    try {
        const results = await connection.awaitQuery(query, params);
        return results;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function getClassListByFilters(year, block) {
    let query = 'SELECT DISTINCT class FROM students WHERE year = ?';
    const params = [year];

    if (block) {
        query += ' AND block = ?';
        params.push(block);
    }

    try {
        const results = await connection.awaitQuery(query, params);
        return results.map(row => row.class);
    } catch (error) {
        console.error('Error fetching class list:', error);
        throw error;
    }
}

async function getClassBlocks(year) {
    const query = 'SELECT DISTINCT block FROM students WHERE year = ?';
    try {
        const results = await connection.awaitQuery(query, [year]);
        return results.map(row => row.block);
    } catch (error) {
        console.error('Error fetching class blocks:', error);
        throw error;
    }
}

async function getGradesByFilters(year, block, className, studentEmail) {
    let query = `
        SELECT s.name, s.email1, g.subject, g.term, g.grade, g.passfail
        FROM students s
        LEFT JOIN grades g ON s.email1 = g.email1
        WHERE s.year = ?
    `;
    const params = [year];

    if (block) {
        query += ' AND s.block = ?';
        params.push(block);
    }

    if (className) {
        query += ' AND s.class = ?';
        params.push(className);
    }

    if (studentEmail) {
        query += ' AND s.email1 = ?';
        params.push(studentEmail);
    }

    try {
        const results = await connection.awaitQuery(query, params);
        const students = {};
        results.forEach(row => {
            if (!students[row.email1]) {
                students[row.email1] = {
                    name: row.name,
                    email1: row.email1,
                    grades: {}
                };
            }
            const gradeValue = row.passfail !== null ? row.passfail : row.grade;
            if (!students[row.email1].grades[row.term]) {
                students[row.email1].grades[row.term] = {};
            }
            students[row.email1].grades[row.term][row.subject] = gradeValue;
        });

        const studentsHK1 = [];
        const studentsHK2 = [];

        Object.values(students).forEach(student => {
            const studentHK1 = { ...student, grades: student.grades['HK1'] || {} };
            const studentHK2 = { ...student, grades: student.grades['HK2'] || {} };
            studentsHK1.push(studentHK1);
            studentsHK2.push(studentHK2);
        });

        return { HK1: studentsHK1, HK2: studentsHK2 };
    } catch (error) {
        console.error('Error fetching grades:', error);
        throw error;
    }
}

async function getStudentsByClassForAttendance(class_name, year) {
    const query = 'SELECT name, email1, late, excused, unexcused FROM students WHERE class = ? AND year = ?';
    try {
        const results = await connection.awaitQuery(query, [class_name, year]);
        return results;
    } catch (error) {
        console.error('Error fetching students for attendance:', error);
        throw error;
    }
}

async function logAttendanceIncident(email1, type, period, time) {
    const query = `
        INSERT INTO attendance (email1, type, period, time)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        type = VALUES(type), time = VALUES(time)
    `;
    try {
        await connection.awaitQuery(query, [email1, type, period, time]);
    } catch (error) {
        console.error('Error logging attendance incident:', error);
        throw error;
    }
}

async function updateAttendanceRecords(attendanceData, period) {
    const currentTime = new Date();
    const queries = attendanceData.map(async student => {
        const { email, type } = student;
        await logAttendanceIncident(email, type, period, currentTime);

        let lateCount = type === 'late' ? 1 : 0;
        let excusedCount = type === 'excused' ? 1 : 0;
        let unexcusedCount = type === 'unexcused' ? 1 : 0;

        const query = 'UPDATE students SET late = late + ?, excused = excused + ?, unexcused = unexcused + ? WHERE email1 = ?';
        return connection.awaitQuery(query, [lateCount, excusedCount, unexcusedCount, email]);
    });

    try {
        await Promise.all(queries);
    } catch (error) {
        console.error('Error updating attendance records:', error);
        throw error;
    }
}

async function insertFormSubmission(className, studentEmail, section, question, response) {
    const query = 'INSERT INTO form_submissions (className, studentEmail, section, question, response) VALUES (?, ?, ?, ?, ?)';
    try {
        await connection.awaitQuery(query, [className, studentEmail, section, question, response]);
    } catch (error) {
        console.error('Error inserting form submission:', error);
        throw error;
    }
}

module.exports = {
    getStudentsByClass,
    getClassList,
    insertStudent,
    getStudentsByFilters,
    getClassListByFilters,
    getClassBlocks,
    insertGrade,
    getGradesByFilters,
    getStudentsByClassForAttendance,
    logAttendanceIncident,
    updateAttendanceRecords,
    insertFormSubmission
};
