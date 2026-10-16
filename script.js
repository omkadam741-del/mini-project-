
const studentForm = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const studentCount = document.getElementById("studentCount");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");
const studentId = document.getElementById("studentId");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

let students = [];

async function loadStudents() {
    try {
        const response = await fetch("/api/students");

        if (!response.ok) {
            throw new Error("Could not load students");
        }

        students = await response.json();
        displayStudents();
    } catch (error) {
        studentTable.innerHTML =
            '<tr><td colspan="5">Could not load records. Check the server.</td></tr>';
    }
}

function displayStudents() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter(student =>
        [student.name, student.rollNo, student.course, student.email]
            .some(value => value.toLowerCase().includes(query))
    );

    studentCount.textContent = students.length;

    if (filteredStudents.length === 0) {
        studentTable.innerHTML =
            '<tr><td colspan="5">No student records found.</td></tr>';
        return;
    }

    studentTable.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${escapeHTML(student.rollNo)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.course)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>
                <button class="edit-btn"
                    data-action="edit" data-id="${escapeHTML(student.id)}">
                    Edit
                </button>
                <button class="delete-btn"
                    data-action="delete" data-id="${escapeHTML(student.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// Prevent entered text from being treated as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#d32f2f" : "#2e7d32";
}

function resetForm() {
    studentForm.reset();
    studentId.value = "";
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.hidden = true;
}

studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const data = {
        name: document.getElementById("name").value.trim(),
        rollNo: document.getElementById("rollNo").value.trim(),
        course: document.getElementById("course").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    const id = studentId.value;
    const url = id
        ? `/api/students/${encodeURIComponent(id)}`
        : "/api/students";
        // Validate Name
if (!/^[A-Za-z ]+$/.test(data.name.trim())) {
    alert("Name must contain letters only!");
    return;
}

// Validate Roll Number
if (!/^\d+$/.test(data.rollNo.trim())) {
    alert("Roll number must contain numbers only!");
    return;
}

// Validate Course
if (!/^[A-Za-z ]+$/.test(data.course.trim())) {
    alert("Course must contain letters only!");
    return;
}

    try {
        const response = await fetch(url, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const text = await response.text();
console.log("Server response:", text);

let result;

try {
    result = JSON.parse(text);
} catch {
    throw new Error("Server returned HTML instead of JSON. Check server.js.");
}

        if (!response.ok) {
            throw new Error(result.message || "Operation failed");
        }

        resetForm();
        showMessage(id
            ? "Student updated successfully!"
            : "Student added successfully!");

        await loadStudents();
    } catch (error) {
        showMessage(error.message, true);
    }
});

studentTable.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const student = students.find(
        item => item.id === button.dataset.id
    );

    if (!student) return;

    if (button.dataset.action === "edit") {
        studentId.value = student.id;
        document.getElementById("name").value = student.name;
        document.getElementById("rollNo").value = student.rollNo;
        document.getElementById("course").value = student.course;
        document.getElementById("email").value = student.email;

        formTitle.textContent = "Edit Student";
        submitBtn.textContent = "Update Student";
        cancelBtn.hidden = false;
        document.getElementById("name").focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (button.dataset.action === "delete") {
        if (!confirm(`Delete ${student.name}?`)) return;

        try {
            const response = await fetch(
                `/api/students/${encodeURIComponent(student.id)}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed");
            }

            if (studentId.value === student.id) resetForm();

            showMessage("Student deleted successfully!");
            await loadStudents();
        } catch (error) {
            showMessage(error.message, true);
        }
    }
});

cancelBtn.addEventListener("click", () => {
    resetForm();
    showMessage("");
});

searchInput.addEventListener("input", displayStudents);

loadStudents();
