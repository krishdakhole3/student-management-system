// ==========================================
// STUDENT MANAGEMENT SYSTEM
// Frontend JavaScript
// ==========================================

// Local backend API address
const API_URL = "https://student-management-api-8tlb.onrender.com/api/students";

// HTML elements
const studentForm = document.getElementById("studentForm");
const studentsTable = document.getElementById("studentsTable");
const searchInput = document.getElementById("searchInput");
const messageBox = document.getElementById("message");

const totalStudentsElement = document.getElementById("totalStudents");
const totalCoursesElement = document.getElementById("totalCourses");

const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");
const resetButton = document.getElementById("resetButton");

// Current student records
let students = [];

// Message timeout
let messageTimeout;


// ==========================================
// SHOW SUCCESS OR ERROR MESSAGE
// ==========================================

function showMessage(message, type = "success") {
    clearTimeout(messageTimeout);

    messageBox.textContent = message;
    messageBox.className = `message ${type}`;

    messageTimeout = setTimeout(() => {
        messageBox.className = "message";
        messageBox.textContent = "";
    }, 4000);
}


// ==========================================
// FETCH STUDENTS FROM BACKEND
// ==========================================

async function loadStudents() {
    studentsTable.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                Loading student records...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load student records.");
        }

        students = await response.json();

        renderStudents();
        updateStatistics();

    } catch (error) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Unable to connect to the server.
                    Please ensure the backend is running.
                </td>
            </tr>
        `;

        totalStudentsElement.textContent = "—";
        totalCoursesElement.textContent = "—";

        showMessage(
            "Could not connect to the backend. Check whether the server is running.",
            "error"
        );

        console.error("Load students error:", error);
    }
}


// ==========================================
// DISPLAY STUDENTS IN TABLE
// ==========================================

function renderStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter((student) => {
        return [
            student.studentId,
            student.name,
            student.email,
            student.course,
            String(student.semester)
        ].some((value) =>
            String(value ?? "").toLowerCase().includes(searchTerm)
        );
    });

    if (filteredStudents.length === 0) {
        const message = students.length === 0
            ? "No students added yet. Add your first student above."
            : "No matching students found.";

        studentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    ${message}
                </td>
            </tr>
        `;

        return;
    }

    studentsTable.replaceChildren();

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");

        const values = [
            student.studentId,
            student.name,
            student.email,
            student.course,
            `Semester ${student.semester}`
        ];

        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const actionButtons = document.createElement("div");
        actionButtons.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn-small btn-edit";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editStudent(student._id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn-small btn-delete";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteStudent(student._id);
        });

        actionButtons.append(editButton, deleteButton);
        actionCell.appendChild(actionButtons);
        row.appendChild(actionCell);

        studentsTable.appendChild(row);
    });
}


// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {
    totalStudentsElement.textContent = students.length;

    const uniqueCourses = new Set(
        students.map((student) => student.course)
    );

    totalCoursesElement.textContent = uniqueCourses.size;
}


// ==========================================
// ADD OR UPDATE A STUDENT
// ==========================================

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const editId = document.getElementById("editId").value;

    const studentData = {
        studentId: document.getElementById("studentId").value.trim(),
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        course: document.getElementById("course").value,
        semester: Number(document.getElementById("semester").value)
    };

    // Basic frontend validation
    if (
        !studentData.studentId ||
        !studentData.name ||
        !studentData.email ||
        !studentData.course ||
        !studentData.semester
    ) {
        showMessage("Please fill in all fields.", "error");
        return;
    }

    if (
        studentData.semester < 1 ||
        studentData.semester > 12
    ) {
        showMessage("Semester must be between 1 and 12.", "error");
        return;
    }

    const url = editId
        ? `${API_URL}/${encodeURIComponent(editId)}`
        : API_URL;

    const method = editId ? "PUT" : "POST";

    submitButton.disabled = true;
    submitButton.textContent = editId ? "Updating..." : "Adding...";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to save student."
            );
        }

        studentForm.reset();
        resetEditMode();

        await loadStudents();

        showMessage(
            editId
                ? "Student updated successfully!"
                : "Student added successfully!"
        );

    } catch (error) {
        showMessage(error.message, "error");
        console.error("Save student error:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add Student";
    }
});


// ==========================================
// EDIT STUDENT
// ==========================================

function editStudent(id) {
    const student = students.find((item) => item._id === id);

    if (!student) {
        showMessage("Student record not found.", "error");
        return;
    }

    document.getElementById("editId").value = student._id;
    document.getElementById("studentId").value = student.studentId;
    document.getElementById("name").value = student.name;
    document.getElementById("email").value = student.email;
    document.getElementById("course").value = student.course;
    document.getElementById("semester").value = String(student.semester);

    formTitle.textContent = "Update Student";
    submitButton.textContent = "Update Student";
    cancelEditButton.hidden = false;

    studentForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// RESET EDIT MODE
// ==========================================

function resetEditMode() {
    document.getElementById("editId").value = "";

    formTitle.textContent = "Add New Student";
    submitButton.textContent = "Add Student";

    cancelEditButton.hidden = true;
}


// ==========================================
// CANCEL EDIT
// ==========================================

cancelEditButton.addEventListener("click", () => {
    studentForm.reset();
    resetEditMode();

    messageBox.className = "message";
    messageBox.textContent = "";
});


// ==========================================
// CLEAR FORM
// ==========================================

resetButton.addEventListener("click", () => {
    setTimeout(() => {
        resetEditMode();
    }, 0);
});


// ==========================================
// DELETE STUDENT
// ==========================================

async function deleteStudent(id) {
    const student = students.find((item) => item._id === id);

    if (!student) {
        showMessage("Student record not found.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${student.name} (${student.studentId})?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to delete student."
            );
        }

        await loadStudents();

        showMessage("Student deleted successfully!");

    } catch (error) {
        showMessage(error.message, "error");
        console.error("Delete student error:", error);
    }
}


// ==========================================
// SEARCH STUDENTS
// ==========================================

searchInput.addEventListener("input", renderStudents);


// ==========================================
// INITIALIZE APPLICATION
// ==========================================

loadStudents();