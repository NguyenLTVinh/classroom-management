const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const pug = require('pug');
const data = require('./data');

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", "templates");
app.set("view engine", "pug");
app.use('/css', express.static('resources/css'));
app.use('/js', express.static('resources/js'));
app.use('/images', express.static('resources/images'));
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
});
  
const upload = multer({ storage: storage });


// HELPERS
function getCurrentSchoolYear() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth >= 8 ? currentYear : currentYear - 1;
}

// API ENDPOINTS FOR DATA FETCHING
app.get('/api/getClassBlocks', async (req, res) => {
    const year = req.query.year;
    try {
        const blocks = await data.getClassBlocks(year);
        res.json(blocks);
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});
  
app.get('/api/getClassNames', async (req, res) => {
    const year = req.query.year;
    const block = req.query.block;
    try {
        const classes = await data.getClassListByFilters(year, block);
        res.json(classes);
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const className = req.query['className'];
        const students = await data.getStudentsByClass(className);
        res.json(students);
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

app.get('/api/grades', async (req, res) => {
    const year = req.query.year || getCurrentSchoolYear();
    const block = req.query.block || '';
    const className = req.query.className || '';
    const studentEmail = req.query.studentEmail || '';

    try {
        const gradesData = await data.getGradesByFilters(year, block, className, studentEmail);
        res.json(gradesData);
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

app.get('/api/index', async (req, res) => {
    const year = req.query.year || getCurrentSchoolYear();
    const block = req.query.block || '';
    const className = req.query.className || '';

    try {
        const [students, classes] = await Promise.all([
            data.getStudentsByFilters(year, block, className),
            data.getClassListByFilters(year, block)
        ]);
        res.json({ students, classes });
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

// GET REQUEST TO RENDER TEMPLATES
// index page display students information for each class.
app.get('/', (req, res) => {
    const currentYear = getCurrentSchoolYear();
    res.render('index', { currentYear, students: [], classes: [] });
});

// add class page to upload a csv file to add the students all at once.
app.get('/add-students', (req, res) => {
    res.render('addstudents');
});

// render add-grades form
app.get('/add-grades', async (req, res) => {
    try {
        const classes = await data.getClassList();
        const { message, error } = req.query;
        res.render('addgrades', { classes, message, error });
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

// grades display page
app.get('/grades', (req, res) => {
    res.render('grades', {
        currentYear: getCurrentSchoolYear(),
        studentsHK1: [],
        studentsHK2: []
    });
});

// attendance page
app.get('/attendance', async (req, res) => {
    const className = req.query.className;
    const year = getCurrentSchoolYear();

    try {
        const students = await data.getStudentsByClassForAttendance(className, year);
        res.render('attendance', { className, students });
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

// form page
app.get('/form', async (req, res) => {
    const className = req.query.className;
    if (!className) {
        return res.status(400).send('Lỗi: Phải Chọn Một Lớp');
    }

    try {
        const students = await data.getStudentsByClass(className);
        res.render('form', { className, students });
    } catch (error) {
        res.status(500).send('Lỗi Database');
    }
});

// POST ENDPOINTS FOR DATA SUBMISSION
// Endpoint to handle uploading a csv to add students.
app.post('/add-students', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

            for (let row of results) {
                const { 'Họ Và Tên': name, 'Khối': block, 'Lớp': className, 'Giới Tính': gender, 'Ngày Sinh': birthday, 'Email 1': email1, 'Email 2': email2, 'Năm Học': schoolYear} = row;

                if (!validDateRegex.test(birthday)) {
                    return res.redirect(`/add-students?error=Sai Định Dạng Ngày Sinh`);
                }

                if (!validEmailRegex.test(email1) || (email2 && !validEmailRegex.test(email2))) {
                    return res.redirect(`/add-students?error=Sai Định Dạng Email`);
                }
                
                const [day, month, year] = birthday.split('/');
                const formattedBirthday = `${year}-${month}-${day}`;

                data.insertStudent(name, className, gender, formattedBirthday, email1, email2, block, schoolYear, (err, result) => {
                    if (err) {
                        return res.redirect('/add-students?error=Lỗi Database');
                    }
                });
            }

            fs.unlinkSync(filePath);
            res.redirect('/add-students?message=Thêm Học Sinh Thành Công');
        })
        .on('error', (error) => {
            res.redirect('/add-students?error=Lỗi Khi Đọc File');
        });
});



// Endpoint to handle form submission
app.post('/add-grades', async (req, res) => {
    try {
        const schoolYear = getCurrentSchoolYear();
        const { info, subjectGrades } = req.body;

        // Convert checkbox values
        for (let key in subjectGrades) {
            if (subjectGrades[key] === 'on') {
                subjectGrades[key] = 'D';
            } else if (!subjectGrades[key]) {
                subjectGrades[key] = 'K';
            }
        }
       
        const grades = Object.keys(subjectGrades).map(subject => {
            const gradeValue = (subjectGrades[subject] === 'D') ? 10 : (subjectGrades[subject] === 'K') ? 0 : parseFloat(subjectGrades[subject]);

            return {
                email1: info.email1,
                subject: subject,
                term: info.term,
                grade: gradeValue,
                passfail: (subjectGrades[subject] === 'D' || subjectGrades[subject] === 'K') ? subjectGrades[subject] : null,
                year: schoolYear
            };
        });

        for (const grade of grades) {
            await data.insertGrade(grade);
        }

        res.redirect('/add-grades?message=Thêm Điểm Thành Công');
    } catch (error) {
        res.redirect('/add-grades?error=Có Lỗi Khi Thêm Điểm');
    }
});

// update attendace
app.post('/attendance', async (req, res) => {
    const { attendance } = req.body;

    try {
        await data.updateAttendance(attendance);
        res.status(200).send('Lưu Thông Tin Điểm Danh Thành Công');
    } catch (error) {
        res.status(500).send('Lỗi: Lưu Thông Tin Điểm Danh');
    }
});

// submit form
app.post('/submit-form', async (req, res) => {
    const { className, student, ...formData } = req.body;

    try {
        for (const [key, value] of Object.entries(formData)) {
            let section, question;
            if (key.includes('_')) {
                [section, question] = key.split('_');
            } else {
                section = key;
                question = key;
            }
            await data.insertFormSubmission(className, student, section, question, value);
        }

        res.send('Nộp Form Thành Công');
    } catch (error) {
        console.error('Lỗi Khi Nộp Form:', error);
        res.status(500).send('Lỗi Khi Nộp Form');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
