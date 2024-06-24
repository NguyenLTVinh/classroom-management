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

// helpers for index
function getCurrentSchoolYear() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth >= 8 ? currentYear : currentYear - 1;
}

app.get('/getClassBlocks', async (req, res) => {
    const year = req.query.year;
    try {
        const blocks = await data.getClassBlocks(year);
        res.json(blocks);
    } catch (error) {
        res.status(500).send('Error fetching class blocks');
    }
});
  
app.get('/getClassNames', async (req, res) => {
    const year = req.query.year;
    const block = req.query.block;
    try {
        const classes = await data.getClassListByFilters(year, block);
        res.json(classes);
    } catch (error) {
        res.status(500).send('Error fetching class names');
    }
});

// add class page to upload a csv file to add the students all at once.
app.get('/add-class', (req, res) => {
    res.render('addclass');
});

app.get('/form', (req, res) => {
    res.render('form');
});

// upload endpoint parse csv and add each line to mysql database.
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
                    return res.status(400).send(`Invalid date format for ${name}`);
                }

                if (!validEmailRegex.test(email1) || (email2 && !validEmailRegex.test(email2))) {
                    return res.status(400).send(`Invalid email format for ${name}`);
                }
                const [day, month, year] = birthday.split('/');
                const formattedBirthday = `${year}-${month}-${day}`;

                data.insertStudent(name, className, gender, formattedBirthday, email1, email2, block, schoolYear, (err, result) => {
                    if (err) {
                        return res.status(500).send('Database error');
                    }
                });
            }

            fs.unlinkSync(filePath);
            res.send('Class data uploaded successfully');
        })
        .on('error', (error) => {
            res.status(500).send('Error reading the file');
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
