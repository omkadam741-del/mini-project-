
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dataFile = path.join(__dirname, "data", "students.json");

app.use(express.json());
app.use(express.static(__dirname));

// Read students from JSON file
function readStudents() {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

// Save students to JSON file
function saveStudents(students) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(students, null, 2)
    );
}

// Get all students
app.get("/api/students", (req, res) => {
    res.json(readStudents());
});

// Add a student
app.post("/api/students", (req, res) => {
    const { name, rollNo, course, email } = req.body;

    if (!name || !rollNo || !course || !email) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    const students = readStudents();

    const exists = students.some(
        student => student.rollNo === rollNo.trim()
    );

    if (exists) {
        return res.status(409).json({
            message: "Roll number already exists."
        });
    }

    const newStudent = {
        id: Date.now().toString(),
        name: name.trim(),
        rollNo: rollNo.trim(),
        course: course.trim(),
        email: email.trim()
    };

    students.push(newStudent);
    saveStudents(students);

    res.status(201).json(newStudent);
});

// Update a student
app.put("/api/students/:id", (req, res) => {
    const students = readStudents();
    const index = students.findIndex(
        student => student.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    const { name, rollNo, course, email } = req.body;

    if (!name || !rollNo || !course || !email) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    const duplicate = students.some(
        student =>
            student.rollNo === rollNo.trim() &&
            student.id !== req.params.id
    );

    if (duplicate) {
        return res.status(409).json({
            message: "Roll number already exists."
        });
    }

    students[index] = {
        ...students[index],
        name: name.trim(),
        rollNo: rollNo.trim(),
        course: course.trim(),
        email: email.trim()
    };

    saveStudents(students);
    res.json(students[index]);
});

// Delete a student
app.delete("/api/students/:id", (req, res) => {
    const students = readStudents();
    const updatedStudents = students.filter(
        student => student.id !== req.params.id
    );

    if (updatedStudents.length === students.length) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    saveStudents(updatedStudents);

    res.json({
        message: "Student deleted successfully."
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

