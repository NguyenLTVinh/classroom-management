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

// api endpoints
app.get('/api/getClassBlocks', async (req, res) => {
    const year = req.query.year;
    try {
        const blocks = await data.getClassBlocks(year);
        res.json(blocks);
    } catch (error) {
        res.status(500).send('Error fetching class blocks');
    }
});
  
app.get('/api/getClassNames', async (req, res) => {
    const year = req.query.year;
    const block = req.query.block;
    try {
        const classes = await data.getClassListByFilters(year, block);
        res.json(classes);
    } catch (error) {
        res.status(500).send('Error fetching class names');
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const className = req.query['className'];
        const students = await data.getStudentsByClass(className);
        res.json(students);
    } catch (error) {
        res.status(500).send('Error fetching students');
    }
});

// index page display students information for each class.
app.get('/', async (req, res) => {
    const year = req.query.year || getCurrentSchoolYear();
    const block = req.query.block || '';
    const className = req.query.className || '';
  
    try {
      const [students, classes] = await Promise.all([
        data.getStudentsByFilters(year, block, className),
        data.getClassListByFilters(year, block)
      ]);
  
      if (req.xhr) {
        res.json({ students });
      } else {
        res.render('index', { students, classes, currentYear: getCurrentSchoolYear() });
      }
    } catch (error) {
      res.status(500).send('Error fetching data');
    }
});

// add class page to upload a csv file to add the students all at once.
app.get('/add-class', (req, res) => {
    res.render('addclass');
});

app.post('/upload-class', upload.single('file'), (req, res) => {
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
                    return res.redirect(`/add-class?error=Sai Định Dạng Ngày Sinh`);
                }

                if (!validEmailRegex.test(email1) || (email2 && !validEmailRegex.test(email2))) {
                    return res.redirect(`/add-class?error=Sai Định Dạng Email`);
                }
                
                const [day, month, year] = birthday.split('/');
                const formattedBirthday = `${year}-${month}-${day}`;

                data.insertStudent(name, className, gender, formattedBirthday, email1, email2, block, schoolYear, (err, result) => {
                    if (err) {
                        return res.redirect('/add-class?error=Lỗi Database');
                    }
                });
            }

            fs.unlinkSync(filePath);
            res.redirect('/add-class?message=Thêm Học Sinh Thành Công');
        })
        .on('error', (error) => {
            res.redirect('/add-class?error=Lỗi Khi Đọc File');
        });
});

// render add-grades form
app.get('/add-grades', async (req, res) => {
    try {
        const classes = await data.getClassList();
        const { message, error } = req.query;
        res.render('addgrades', { classes, message, error });
    } catch (error) {
        res.status(500).send('Error fetching classes');
    }
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

// grades display page
app.get('/grades', async (req, res) => {
    const year = req.query.year || getCurrentSchoolYear();
    const block = req.query.block || '';
    const className = req.query.className || '';
    const studentEmail = req.query.studentEmail || '';

    try {
        const students = await data.getGradesByFilters(year, block, className, studentEmail);
        res.render('grades', { students, currentYear: getCurrentSchoolYear() });
    } catch (error) {
        res.status(500).send('Error fetching grades');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
