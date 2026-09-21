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
// EXAM PAGE
// ===============================

const questionText =
    document.getElementById("questionText");

if (questionText) {

    const exam =
        getExams().find(function(item) {

            return String(item.id) ===
                localStorage.getItem("currentExamId");
        });

    const student =
        JSON.parse(
            localStorage.getItem("currentStudent") || "null"
        );

    if (!exam || !student) {

        window.location.href =
            "student-login.html";

    } else {

        let currentIndex = 0;

        const answers =
            new Array(exam.questions.length).fill(null);

        let seconds =
            exam.duration * 60;

        let finished = false;

        const examTitle =
            document.getElementById("examTitle");

        const examSubject =
            document.getElementById("examSubject");

        const studentDisplay =
            document.getElementById("studentDisplay");

        const totalQuestions =
            document.getElementById("totalQuestions");

        const currentQuestion =
            document.getElementById("currentQuestion");

        const questionNumber =
            document.getElementById("questionNumber");

        const options =
            document.getElementById("options");

        const questionNumbers =
            document.getElementById("questionNumbers");

        const previousButton =
            document.getElementById("previousBtn");

        const nextButton =
            document.getElementById("nextBtn");

        const submitButton =
            document.getElementById("submitExam");

        const timer =
            document.getElementById("timer");

        examTitle.textContent =
            exam.name;

        examSubject.textContent =
            exam.subject;

        studentDisplay.textContent =
            student.name;

        totalQuestions.textContent =
            exam.questions.length;

        questionNumbers.innerHTML =
            exam.questions.map(function(_, index) {

                return `
                    <button data-i="${index}">
                        ${index + 1}
                    </button>
                `;

            }).join("");

        questionNumbers
            .querySelectorAll("button")
            .forEach(function(button) {

                button.onclick = function() {

                    currentIndex =
                        Number(button.dataset.i);

                    loadQuestion();
                };
            });

        function loadQuestion() {

            const question =
                exam.questions[currentIndex];

            currentQuestion.textContent =
                currentIndex + 1;

            questionNumber.textContent =
                currentIndex + 1;

            questionText.textContent =
                question.question;

            options.innerHTML =
                question.options.map(function(option, index) {

                    const letter =
                        String.fromCharCode(65 + index);

                    return `
                        <label class="option ${
                            answers[currentIndex] === letter
                                ? "selected"
                                : ""
                        }">

                            <input
                                type="radio"
                                name="answer"
                                value="${letter}"
                                ${
                                    answers[currentIndex] === letter
                                        ? "checked"
                                        : ""
                                }
                            >

                            <b>${letter}</b>

                            <span>
                                ${esc(option)}
                            </span>

                        </label>
                    `;

                }).join("");

            options
                .querySelectorAll("input")
                .forEach(function(radio) {

                    radio.onchange = function() {

                        answers[currentIndex] =
                            radio.value;

                        loadQuestion();
                    };
                });

            questionNumbers
                .querySelectorAll("button")
                .forEach(function(button, index) {

                    button.classList.toggle(
                        "active",
                        index === currentIndex
                    );

                    button.classList.toggle(
                        "answered",
                        !!answers[index]
                    );
                });

            previousButton.disabled =
                currentIndex === 0;

            nextButton.textContent =
                currentIndex === exam.questions.length - 1
                    ? "Finish"
                    : "Next →";
        }

        function updateTimer() {

            const minutes =
                Math.floor(seconds / 60);

            const remainingSeconds =
                seconds % 60;

            timer.textContent =
                `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

            if (seconds <= 0) {

                finishExam();

                return;
            }

            seconds--;
        }

        const timerInterval =
            setInterval(updateTimer, 1000);

        updateTimer();

        loadQuestion();

        previousButton.onclick =
            function() {

                if (currentIndex > 0) {

                    currentIndex--;

                    loadQuestion();
                }
            };

        nextButton.onclick =
            function() {

                if (
                    currentIndex <
                    exam.questions.length - 1
                ) {

                    currentIndex++;

                    loadQuestion();

                } else {

                    finishExam();
                }
            };

        submitButton.onclick =
            function() {

                if (
                    confirm(
                        "Submit your examination now?"
                    )
                ) {

                    finishExam();
                }
            };

        function finishExam() {

            if (finished) {
                return;
            }

            finished = true;

            clearInterval(timerInterval);

            let correct = 0;

            exam.questions.forEach(
                function(question, index) {

                    if (
                        answers[index] ===
                        question.answer
                    ) {
                        correct++;
                    }
                }
            );

            const result = {

                id: Date.now(),

                studentName:
                    student.name,

                studentId:
                    student.id,

                examName:
                    exam.name,

                score:
                    Math.round(
                        correct /
                        exam.questions.length *
                        100
                    ),

                correct:
                    correct,

                total:
                    exam.questions.length,

                date:
                    new Date().toISOString()
            };

            const results =
                getResults();

            results.push(result);

            saveResults(results);

            localStorage.setItem(
                "lastResult",
                JSON.stringify(result)
            );

            window.location.href =
                "result.html";
        }
    }
}

// ===============================
// RESULT PAGE
// ===============================

const resultScore =
    document.getElementById("resultScore");

if (resultScore) {

    const result =
        JSON.parse(
            localStorage.getItem("lastResult") ||
            "null"
        );

    if (!result) {

        window.location.href =
            "index.html";

    } else {

        const resultTitle =
            document.getElementById("resultTitle");

        const resultStudent =
            document.getElementById("resultStudent");

        const resultCorrect =
            document.getElementById("resultCorrect");

        const resultTotal =
            document.getElementById("resultTotal");

        resultTitle.textContent =
            result.examName;

        resultStudent.textContent =
            `${result.studentName} · ${result.studentId}`;

        resultScore.textContent =
            `${result.score}%`;

        resultCorrect.textContent =
            result.correct;

        resultTotal.textContent =
            result.total;
    }
}
