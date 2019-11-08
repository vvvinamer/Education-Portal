let admin = require("firebase-admin");
let firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
require('firebase/database');

const Joi = require('@hapi/joi');
const express = require('express');
const config = require('./config');
const app = express();
app.use(express.json());

// Initialize Firebase
let serviceAccount = require("/home/noble/Akshit/sem 5/soe/Education-Portal/express-first-app-firebase-adminsdk-evqga-220eb31416.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://express-first-app.firebaseio.com"
});

firebase.initializeApp(config.firebaseConfig);

const CURRENT_YEAR = 2019;
const COLLEGE_NAME = "IIITA";
const STUDENTS_KEY = "students";
const FACULTIES_KEY = "faculties";
const DEPARTMENTS_KEY = "departments";
const dbReference = firebase.database().ref(COLLEGE_NAME);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// To ADD DEPARTMENT, post request on "/departments" with departmentName, courseName, courseCode and credits 
// To REGISTER STUDENT, post request on "/students" with name, email, dob, batchYear and department
// To REGISTER NEW FACULTY, post request on "/faculties" with name, email and courses
// To ASSIGN COURSE TO A FACULTY, put request on "/faculties/assignCourse" with email and courseCode

app.post(`/${FACULTIES_KEY}`, (req, res) => {
    const { email } = req.body;
    dbReference.child(FACULTIES_KEY).child(email).set(req.body, error => {
        if (!error) {
            res.send(successMessage("Registration Completed"));
        } else {
            res.send(failureMessage(error.message));
        }
    });
});

app.put(`/${FACULTIES_KEY}/assignCourse`, (req, res) => {
    const { email, courseCode } = req.body;

    assignCourseToFaculty(email, courseCode, res);
});

app.post("/students/", (req, res) => {
    const { batchYear, department } = req.body;

    const batchRef = dbReference.child(CURRENT_YEAR).child(department).child(batchYear);
    batchRef.once('value', function(snapshot) {
        registerNewStudent(snapshot.val(), req.body, res);
    })
});

app.post("/departments/", (req, res) => {
    const { departName, courseName, courseCode, credits } = req.body;

    dbReference.child('departments').child(departName).child(courseCode).set({
        courseName: courseName,
        code: code,
        credits: credits
    }, error => {
        if (!error) {
            console.log(`New Course added successfuly with code: ${courseCode}`);
            res.send(successMessage('Department created successfuly'));
        } else {
            console.log(`There is some error: ${error}`);
            res.send(failureMessage('Something went wrong'));
        }
    })
});

function assignCourseToFaculty(email, courseCode, response) {
    dbReference.child(FACULTIES_KEY).child(email).child("courses").child(courseCode)
    .set(1, error => {
        if (!error) {
            response.send(successMessage("Course registered."))
        } else {
            response.send(failureMessage(error.message));
        }
    });
}

function registerNewStudent(classmates, newStudent, response) {
    let studentNumber = 1;
    if (classmates !== null) {
        studentNumber = Object.keys(classmates).length + 1;
    }
    if (studentNumber < 10) studentNumber = "00" + studentNumber;
    else if (studentNumber < 100) studentNumber = "0" + studentNumber;

    const { name, email, dob, batchYear, department } = newStudent;
    let rollNo = `I${department.substring(0, 2)}${batchYear}${studentNumber}`;
    
    const collegeEmail = `${rollNo.toLowerCase()}@${COLLEGE_NAME}.ac.in`;
    const password = Math.round(Math.random() * 100000000).toString();
        
    admin.auth().createUser({
        name: name,
        email: collegeEmail,
        password: password,
        disabled: true
    }).then(function(userRecord) {
        dbReference.child(CURRENT_YEAR).child(department).child(batchYear).child(rollNo).set(1);
        dbReference.child("students").child(rollNo).set({
            name: name,
            email: email,
            dob: dob,
            batchYear: batchYear, 
            departName: department
        }, error => {
            if (!error) {
                response.send(successMessage(`Registered with uid: ${userRecord.uid} password: ${password}`));
            } else {
                response.send(failureMessage(`Some error occured: ${error.message}`));
            }
        });
    }).catch(function(error) {
        response.send(failureMessage(error.message, error.code));
    });
}

function successMessage(message, code = 200) {
    return {
        code: code,
        message: message
    }
}

function failureMessage(message, code = 404) {
    return {
        code: code,
        message: message
    }
}

const port = 6969;
app.listen(port, () => console.log(`Listening on port ${port}...`));