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
const port = 3000;

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
    const className = req.query.className || '6CI1'; // default
    try {
        const [students, classes] = await Promise.all([
            data.getStudentsByClass(className),
            data.getClassList()
        ]);
        if (req.xhr) {
            res.json({ students });
        } else {
            res.render('index', { students, classes });
        }
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

// add class page to upload a csv file to add the students all at once.
app.get('/add-class', (req, res) => {
    res.render('addclass');
});

// upload endpoint parse csv and add each line to mysql database.
app.post('/upload-class', upload.single('file'), (req, res) => {
    const className = req.body['className'];
    const filePath = req.file.path;

    const results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

            for (let row of results) {
                const { name, gender, birthday, email1, email2 } = row;
                
                if (!validDateRegex.test(birthday)) {
                    return res.status(400).send(`Invalid date format for ${name}`);
                }

                if (!validEmailRegex.test(email1) || (email2 && !validEmailRegex.test(email2))) {
                    return res.status(400).send(`Invalid email format for ${name}`);
                }
                const [day, month, year] = birthday.split('/');
                const formattedBirthday = `${year}-${month}-${day}`

                data.insertStudent(name, className, gender, formattedBirthday, email1, email2, (err, result) => {
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
