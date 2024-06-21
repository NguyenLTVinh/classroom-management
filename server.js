const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
