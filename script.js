// ===============================
// EXAMPRO - MAIN JAVASCRIPT
// ===============================

// ---------- STORAGE ----------
function getExams() {
    return JSON.parse(localStorage.getItem("exams") || "[]");
}

function saveExams(exams) {
    localStorage.setItem("exams", JSON.stringify(exams));
}

function getResults() {
    return JSON.parse(localStorage.getItem("results") || "[]");
}

function saveResults(results) {
    localStorage.setItem("results", JSON.stringify(results));
}

// ---------- SECURITY HELPERS ----------
function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function attr(value) {
    return esc(value);
}

// ===============================
// ADMIN LOGIN
// ===============================

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.onsubmit = function(e) {
        e.preventDefault();

        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;

        if (username === "admin" && password === "12345") {
            localStorage.setItem("adminLoggedIn", "true");
            window.location.href = "admin-dashboard.html";
        } else {
            alert("Invalid username or password.");
        }
    };
}

// ===============================
// ADMIN DASHBOARD
// ===============================

const createExamForm = document.getElementById("createExamForm");

if (
    createExamForm &&
    localStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "admin-login.html";
}

// ---------- LOGOUT ----------

const logoutButton = document.getElementById("adminLogout");

if (logoutButton) {
    logoutButton.onclick = function() {
        localStorage.removeItem("adminLoggedIn");
        window.location.href = "admin-login.html";
    };
}

// ---------- DASHBOARD ELEMENTS ----------

const examList = document.getElementById("examList");
const builder = document.getElementById("questionBuilderSection");
const fields = document.getElementById("questionFields");

let editingId = null;

// ---------- DASHBOARD ----------

function dashboard() {
    const exams = getExams();
    const results = getResults();

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    setText("totalExams", exams.length);

    setText(
        "totalQuestions",
        exams.reduce(function(total, exam) {
            return total + (exam.questions?.length || 0);
        }, 0)
    );

    setText(
        "totalStudents",
        new Set(results.map(function(result) {
            return result.studentId;
        })).size
    );

    setText("totalResults", results.length);

    if (examList) {
        if (exams.length) {
            examList.innerHTML = exams.map(function(exam) {
                return `
                    <div class="exam-card">
                        <div>
                            <h3>${esc(exam.name)}</h3>

                            <div class="exam-meta">
                                ${esc(exam.subject)}
                                · Code: ${esc(exam.code)}
                                · ${exam.duration} minutes
                                · ${exam.questions.length}/${exam.numberOfQuestions} questions
                            </div>
                        </div>

                        <div class="exam-actions">
                            <button class="small-btn" data-q="${exam.id}">
                                Questions
                            </button>

                            <button class="small-btn danger" data-d="${exam.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        } else {
            examList.innerHTML = `
                <div class="empty-state">
                    📝<br>
                    <b>No examinations yet</b><br>
                    Create your first examination above.
                </div>
            `;
        }

        examList.querySelectorAll("[data-q]").forEach(function(button) {
            button.onclick = function() {
                openBuilder(Number(button.dataset.q));
            };
        });

        examList.querySelectorAll("[data-d]").forEach(function(button) {
            button.onclick = function() {
                deleteExam(Number(button.dataset.d));
            };
        });
    }
}

// ===============================
// QUESTION BUILDER
// ===============================

function openBuilder(id) {
    const exams = getExams();

    const exam = exams.find(function(item) {
        return item.id === id;
    });

    if (!exam) {
        return;
    }

    editingId = id;

    if (builder) {
        builder.classList.remove("hidden");
    }

    const builderSubtitle =
        document.getElementById("builderSubtitle");

    if (builderSubtitle) {
        builderSubtitle.textContent =
            `${exam.name} — add ${exam.numberOfQuestions} question(s).`;
    }

    if (!fields) {
        return;
    }

    fields.innerHTML = "";

    for (let i = 0; i < exam.numberOfQuestions; i++) {

        const question = exam.questions[i] || {
            question: "",
            options: ["", "", "", ""],
            answer: ""
        };

        fields.insertAdjacentHTML(
            "beforeend",
            `
            <div class="question-builder-card">

                <h3>Question ${i + 1}</h3>

                <label>
                    Question
                    <input
                        class="question-input"
                        value="${attr(question.question)}"
                        required
                    >
                </label>

                <div class="form-row">

                    <label>
                        Option A
                        <input
                            class="option-a"
                            value="${attr(question.options[0])}"
                            required
                        >
                    </label>

                    <label>
                        Option B
                        <input
                            class="option-b"
                            value="${attr(question.options[1])}"
                            required
                        >
                    </label>

                </div>

                <div class="form-row">

                    <label>
                        Option C
                        <input
                            class="option-c"
                            value="${attr(question.options[2])}"
                            required
                        >
                    </label>

                    <label>
                        Option D
                        <input
                            class="option-d"
                            value="${attr(question.options[3])}"
                            required
                        >
                    </label>

                </div>

                <label>
                    Correct Answer

                    <select class="correct-answer" required>

                        <option value="">
                            Select correct answer
                        </option>

                        <option value="A" ${question.answer === "A" ? "selected" : ""}>
                            A
                        </option>

                        <option value="B" ${question.answer === "B" ? "selected" : ""}>
                            B
                        </option>

                        <option value="C" ${question.answer === "C" ? "selected" : ""}>
                            C
                        </option>

                        <option value="D" ${question.answer === "D" ? "selected" : ""}>
                            D
                        </option>

                    </select>
                </label>

            </div>
            `
        );
    }

    builder.scrollIntoView({
        behavior: "smooth"
    });
}

// ---------- DELETE EXAM ----------

function deleteExam(id) {

    if (confirm("Delete this examination?")) {

        const exams = getExams().filter(function(exam) {
            return exam.id !== id;
        });

        saveExams(exams);

        dashboard();
    }
}

// ===============================
// CREATE EXAM
// ===============================

if (createExamForm) {

    createExamForm.onsubmit = function(e) {

        e.preventDefault();

        const examNameInput =
            document.getElementById("examName");

        const examSubjectInput =
            document.getElementById("examSubject");

        const examCodeInput =
            document.getElementById("examCode");

        const examDurationInput =
            document.getElementById("examDuration");

        const numberOfQuestionsInput =
            document.getElementById("numberOfQuestions");

        const code =
            examCodeInput.value.trim().toUpperCase();

        const exams = getExams();

        if (
            exams.some(function(exam) {
                return exam.code === code;
            })
        ) {
            alert("That exam code already exists.");
            return;
        }

        const exam = {

            id: Date.now(),

            name: examNameInput.value.trim(),

            subject: examSubjectInput.value.trim(),

            code: code,

            duration: Number(examDurationInput.value),

            numberOfQuestions:
                Number(numberOfQuestionsInput.value),

            questions: []
        };

        exams.push(exam);

        saveExams(exams);

        createExamForm.reset();

        dashboard();

        openBuilder(exam.id);
    };
}

// ===============================
// SAVE QUESTIONS
// ===============================

const questionBuilderForm =
    document.getElementById("questionBuilderForm");

if (questionBuilderForm) {

    questionBuilderForm.onsubmit = function(e) {

        e.preventDefault();

        const exams = getExams();

        const exam = exams.find(function(item) {
            return item.id === editingId;
        });

        if (!exam) {
            alert("Examination not found.");
            return;
        }

        const cards = [
            ...fields.querySelectorAll(".question-builder-card")
        ];

        exam.questions = cards.map(function(card) {

            return {

                question:
                    card.querySelector(".question-input")
                        .value.trim(),

                options: [

                    card.querySelector(".option-a")
                        .value.trim(),

                    card.querySelector(".option-b")
                        .value.trim(),

                    card.querySelector(".option-c")
                        .value.trim(),

                    card.querySelector(".option-d")
                        .value.trim()

                ],

                answer:
                    card.querySelector(".correct-answer")
                        .value
            };
        });

        saveExams(exams);

        alert(
            "Questions saved. The examination is ready."
        );

        builder.classList.add("hidden");

        dashboard();
    };
}

// ---------- CREATE EXAM BUTTON ----------

const focusCreate =
    document.getElementById("focusCreate");

if (focusCreate) {

    focusCreate.onclick = function() {

        const section =
            document.getElementById("createExamSection");

        if (section) {

            section.scrollIntoView({
                behavior: "smooth"
            });
        }
    };
}

// ---------- LOAD DASHBOARD ----------

if (examList) {
    dashboard();
}

// ===============================
// STUDENT LOGIN
// ===============================

const studentLoginForm =
    document.getElementById("studentLoginForm");

if (studentLoginForm) {

    studentLoginForm.onsubmit = function(e) {

        e.preventDefault();

        const examCodeInput =
            document.getElementById("examCode");

        const studentNameInput =
            document.getElementById("studentName");

        const studentIdInput =
            document.getElementById("studentId");

        const code =
            examCodeInput.value.trim().toUpperCase();

        const exams = getExams();

        const exam = exams.find(function(item) {
            return item.code === code;
        });

        if (!exam) {

            alert("Exam code not found.");

            return;
        }

        if (
            exam.questions.length !==
            exam.numberOfQuestions
        ) {

            alert(
                "This examination is not ready yet. Please contact the administrator."
            );

            return;
        }

        const student = {

            name: studentNameInput.value.trim(),

            id: studentIdInput.value.trim()
        };

        localStorage.setItem(
            "currentStudent",
            JSON.stringify(student)
        );

        localStorage.setItem(
            "currentExamId",
            exam.id
        );

        window.location.href = "exam.html";
    };
}

// ===============================
// EX
