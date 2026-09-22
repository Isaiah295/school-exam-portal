// =====================================================
// EXAMPRO - MAIN JAVASCRIPT
// =====================================================

// =====================================================
// SUPABASE CONNECTION
// =====================================================

const SUPABASE_URL = "https://etlprlshdntcddgtfcbo.supabase.co";

const SUPABASE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

async function saveExamToSupabase(record) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/exam_records`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(record)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Supabase error:", error);
            return false;
        }

        console.log("Exam record saved successfully.");
        return true;

    } catch (error) {
        console.error("Supabase connection error:", error);
        return false;
    }
}


// =====================================================
// STORAGE
// =====================================================

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


// =====================================================
// SECURITY HELPERS
// =====================================================

function esc(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}

function attr(value) {
    return esc(value);
}


// =====================================================
// ADMIN LOGIN
// =====================================================

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {

    adminLoginForm.onsubmit = function(e) {

        e.preventDefault();

        const username =
            document.getElementById("adminUsername").value.trim();

        const password =
            document.getElementById("adminPassword").value;

        if (username === "admin" && password === "12345") {

            localStorage.setItem("adminLoggedIn", "true");

            location.href = "admin-dashboard.html";

        } else {

            alert("Invalid username or password.");

        }
    };
}


// =====================================================
// ADMIN DASHBOARD
// =====================================================

const createExamForm =
    document.getElementById("createExamForm");

if (
    createExamForm &&
    localStorage.getItem("adminLoggedIn") !== "true"
) {
    location.href = "admin-login.html";
}


const logout =
    document.getElementById("adminLogout");

if (logout) {

    logout.onclick = () => {

        localStorage.removeItem("adminLoggedIn");

        location.href = "admin-login.html";

    };
}


// =====================================================
// DASHBOARD
// =====================================================

const examList =
    document.getElementById("examList");

const builder =
    document.getElementById("questionBuilderSection");

const fields =
    document.getElementById("questionFields");

let editingId = null;


function dashboard() {

    const exams = getExams();

    const results = getResults();

    const set = (id, value) => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };


    set("totalExams", exams.length);

    set(
        "totalQuestions",
        exams.reduce(
            (number, exam) =>
                number + (exam.questions?.length || 0),
            0
        )
    );

    set(
        "totalStudents",
        new Set(
            results.map(result => result.studentId)
        ).size
    );

    set("totalResults", results.length);


    if (examList) {

        examList.innerHTML = exams.length
            ? exams.map(exam => `
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

                        <button
                            class="small-btn"
                            data-q="${exam.id}">
                            Questions
                        </button>

                        <button
                            class="small-btn danger"
                            data-d="${exam.id}">
                            Delete
                        </button>

                    </div>

                </div>
            `).join("")

            : `
                <div class="empty-state">
                    📝<br>
                    <b>No examinations yet</b><br>
                    Create your first examination above.
                </div>
            `;


        examList
            .querySelectorAll("[data-q]")
            .forEach(button => {

                button.onclick = () =>
                    openBuilder(+button.dataset.q);

            });


        examList
            .querySelectorAll("[data-d]")
            .forEach(button => {

                button.onclick = () =>
                    delExam(+button.dataset.d);

            });
    }
}


// =====================================================
// QUESTION BUILDER
// =====================================================

function openBuilder(id) {

    const exam =
        getExams().find(item => item.id === id);

    if (!exam) return;

    editingId = id;

    builder.classList.remove("hidden");

    document.getElementById("builderSubtitle").textContent =
        `${exam.name} — add ${exam.numberOfQuestions} question(s).`;

    fields.innerHTML = "";


    for (
        let i = 0;
        i < exam.numberOfQuestions;
        i++
    ) {

        const question =
            exam.questions[i] || {
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
                        required>
                </label>


                <div class="form-row">

                    <label>
                        Option A
                        <input
                            class="option-a"
                            value="${attr(question.options[0])}"
                            required>
                    </label>

                    <label>
                        Option B
                        <input
                            class="option-b"
                            value="${attr(question.options[1])}"
                            required>
                    </label>

                </div>


                <div class="form-row">

                    <label>
                        Option C
                        <input
                            class="option-c"
                            value="${attr(question.options[2])}"
                            required>
                    </label>

                    <label>
                        Option D
                        <input
                            class="option-d"
                            value="${attr(question.options[3])}"
                            required>
                    </label>

                </div>


                <label>
                    Correct Answer

                    <select
                        class="correct-answer"
                        required>

                        <option value="">
                            Select correct answer
                        </option>

                        ${["A", "B", "C", "D"]
                            .map(letter => `
                                <option
                                    value="${letter}"
                                    ${question.answer === letter ? "selected" : ""}>
                                    ${letter}
                                </option>
                            `)
                            .join("")}

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


function delExam(id) {

    if (confirm("Delete this examination?")) {

        saveExams(
            getExams().filter(
                exam => exam.id !== id
            )
        );

        dashboard();
    }
}


// =====================================================
// CREATE EXAM
// =====================================================

if (createExamForm) {

    createExamForm.onsubmit = function(e) {

        e.preventDefault();


        const code =
            document
                .getElementById("examCode")
                .value
                .trim()
                .toUpperCase();


        const exams = getExams();


        if (
            exams.some(
                exam => exam.code === code
            )
        ) {

            alert("That exam code already exists.");

            return;
        }


        const exam = {

            id: Date.now(),

            name:
                document
                    .getElementById("examName")
                    .value
                    .trim(),

            subject:
                document
                    .getElementById("examSubject")
                    .value
                    .trim(),

            code: code,

            duration:
                +document
                    .getElementById("examDuration")
                    .value,

            numberOfQuestions:
                +document
                    .getElementById("numberOfQuestions")
                    .value,

            questions: []

        };


        exams.push(exam);

        saveExams(exams);

        createExamForm.reset();

        dashboard();

        openBuilder(exam.id);
    };
}


// =====================================================
// SAVE QUESTIONS
// =====================================================

const qform =
    document.getElementById("questionBuilderForm");


if (qform) {

    qform.onsubmit = function(e) {

        e.preventDefault();


        const exams = getExams();

        const exam =
            exams.find(
                item => item.id === editingId
            );


        const cards =
            [
                ...fields.querySelectorAll(
                    ".question-builder-card"
                )
            ];


        exam.questions =
            cards.map(card => ({

                question:
                    card
                        .querySelector(".question-input")
                        .value
                        .trim(),

                options: [
                    ".option-a",
                    ".option-b",
                    ".option-c",
                    ".option-d"
                ].map(
                    selector =>
                        card
                            .querySelector(selector)
                            .value
                            .trim()
                ),

                answer:
                    card
                        .querySelector(".correct-answer")
                        .value

            }));


        saveExams(exams);

        alert(
            "Questions saved. The examination is ready."
        );


        builder.classList.add("hidden");

        dashboard();
    };
}


// =====================================================
// CREATE EXAM BUTTON
// =====================================================

const focusCreate =
    document.getElementById("focusCreate");


if (focusCreate) {

    focusCreate.onclick = () =>
        document
            .getElementById("createExamSection")
            .scrollIntoView({
                behavior: "smooth"
            });
}


if (examList) {
    dashboard();
}


// =====================================================
// STUDENT LOGIN
// =====================================================

const studentLoginForm =
    document.getElementById("studentLoginForm");


if (studentLoginForm) {

    studentLoginForm.onsubmit = function(e) {

        e.preventDefault();


        const code =
            document
                .getElementById("examCode")
                .value
                .trim()
                .toUpperCase();


        const exam =
            getExams().find(
                item => item.code === code
            );


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


        localStorage.setItem(
            "currentStudent",
            JSON.stringify({

                name:
                    document
                        .getElementById("studentName")
                        .value
                        .trim(),

                id:
                    document
                        .getElementById("studentId")
                        .value
                        .trim()

            })
        );


        localStorage.setItem(
            "currentExamId",
            exam.id
        );


        location.href = "exam.html";
    };
}


// =====================================================
// EXAM ENGINE
// =====================================================

const questionText =
    document.getElementById("questionText");


if (questionText) {

    const exam =
        getExams().find(
            item =>
                String(item.id) ===
                localStorage.getItem("currentExamId")
        );


    const student =
        JSON.parse(
            localStorage.getItem("currentStudent") ||
            "null"
        );


    if (!exam || !student) {

        location.href = "student-login.html";

    } else {

        let currentIndex = 0;

        const answers =
            new Array(
                exam.questions.length
            ).fill(null);


        let seconds =
            exam.duration * 60;


        let finished = false;


        document.getElementById("examTitle").textContent =
            exam.name;


        document.getElementById("examSubject").textContent =
            exam.subject;


        document.getElementById("studentDisplay").textContent =
            student.name;


        document.getElementById("totalQuestions").textContent =
            exam.questions.length;


        const questionNumbers =
            document.getElementById(
                "questionNumbers"
            );


        const options =
            document.getElementById(
                "options"
            );


        questionNumbers.innerHTML =
            exam.questions
                .map(
                    (_, index) =>
                        `<button data-i="${index}">
                            ${index + 1}
                        </button>`
                )
                .join("");


        questionNumbers
            .querySelectorAll("button")
            .forEach(button => {

                button.onclick = () => {

                    currentIndex =
                        +button.dataset.i;

                    loadQuestion();

                };

            });


        function loadQuestion() {

            const question =
                exam.questions[currentIndex];


            document.getElementById(
                "currentQuestion"
            ).textContent =
                currentIndex + 1;


            document.getElementById(
                "questionNumber"
            ).textContent =
                currentIndex + 1;


            questionText.textContent =
                question.question;


            options.innerHTML =
                question.options
                    .map((option, index) => {

                        const letter =
                            String.fromCharCode(
                                65 + index
                            );


                        return `
                            <label
                                class="option ${
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
                                    }>

                                <b>${letter}</b>

                                <span>
                                    ${esc(option)}
                                </span>

                            </label>
                        `;

                    })
                    .join("");


            options
                .querySelectorAll("input")
                .forEach(radio => {

                    radio.onchange = () => {

                        answers[currentIndex] =
                            radio.value;

                        loadQuestion();

                    };

                });


            questionNumbers
                .querySelectorAll("button")
                .forEach((button, index) => {

                    button.classList.toggle(
                        "active",
                        index === currentIndex
                    );


                    button.classList.toggle(
                        "answered",
                        !!answers[index]
                    );

                });


            document.getElementById(
                "previousBtn"
            ).disabled =
                currentIndex === 0;


            document.getElementById(
                "nextBtn"
            ).textContent =
                currentIndex ===
                exam.questions.length - 1
                    ? "Finish"
                    : "Next →";
        }


        function tick() {

            const minutes =
                Math.floor(seconds / 60);

            const secs =
                seconds % 60;


            document.getElementById(
                "timer"
            ).textContent =
                `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

                     if (seconds <= 0) {

                finish();

                return;
            }


            seconds--;
        }


        const timerInterval =
            setInterval(
                tick,
                1000
            );


        tick();

        loadQuestion();


        document.getElementById(
            "previousBtn"
        ).onclick = () => {

            if (currentIndex > 0) {

                currentIndex--;

                loadQuestion();

            }
        };


        document.getElementById(
            "nextBtn"
        ).onclick = () => {

            if (
                currentIndex <
                exam.questions.length - 1
            ) {

                currentIndex++;

                loadQuestion();

            } else {

                finish();

            }
        };


        document.getElementById(
            "submitExam"
        ).onclick = () => {

            if (
                confirm(
                    "Submit your examination now?"
                )
            ) {

                finish();

            }
        };


        // =================================================
        // FINISH EXAM
        // =================================================

        async function finish() {

            if (finished) return;

            finished = true;

            clearInterval(timerInterval);


            const correct =
                exam.questions.reduce(
                    (total, question, index) =>
                        total +
                        (
                            answers[index] ===
                            question.answer
                                ? 1
                                : 0
                        ),
                    0
                );


            const total =
                exam.questions.length;


            const percentage =
                Math.round(
                    (correct / total) * 100
                );


            // Grade
            let grade;

            if (percentage >= 70) {
                grade = "A";
            } else if (percentage >= 60) {
                grade = "B";
            } else if (percentage >= 50) {
                grade = "C";
            } else if (percentage >= 45) {
                grade = "D";
            } else if (percentage >= 40) {
                grade = "E";
            } else {
                grade = "F";
            }


            // Local result
            const result = {

                id: Date.now(),

                studentName:
                    student.name,

                studentId:
                    student.id,

                examName:
                    exam.name,

                examCode:
                    exam.code,

                score:
                    correct,

                correct:
                    correct,

                total:
                    total,

                percentage:
                    percentage,

                grade:
                    grade,

                date:
                    new Date().toISOString()

            };


            // Keep existing localStorage system
            const results =
                getResults();


            results.push(result);

            saveResults(results);


            localStorage.setItem(
                "lastResult",
                JSON.stringify(result)
            );


            // =================================================
            // SAVE PERMANENT ONLINE RECORD TO SUPABASE
            // =================================================

            const onlineRecord = {

                student_name:
                    student.name,

                student_id:
                    student.id,

                exam_name:
                    exam.name,

                exam_code:
                    exam.code,

                score:
                    correct,

                total_questions:
                    total,

                percentage:
                    percentage,

                grade:
                    grade,

                submitted_at:
                    new Date().toISOString()

            };


            const savedOnline =
                await saveExamToSupabase(
                    onlineRecord
                );


            if (!savedOnline) {

                alert(
                    "Your exam result was calculated, but the online record could not be saved. Please inform the administrator."
                );

            }


            location.href =
                "result.html";
        }
    }
}


// =====================================================
// RESULT PAGE
// =====================================================

const resultScore =
    document.getElementById(
        "resultScore"
    );


if (resultScore) {

    const result =
        JSON.parse(
            localStorage.getItem(
                "lastResult"
            ) || "null"
        );


    if (!result) {

        location.href = "index.html";

    } else {

        document.getElementById(
            "resultTitle"
        ).textContent =
            result.examName;


        document.getElementById(
            "resultStudent"
        ).textContent =
            `${result.studentName} · ${result.studentId}`;


        resultScore.textContent =
            `${result.percentage ?? result.score}%`;


        document.getElementById(
            "resultCorrect"
        ).textContent =
            result.correct;


        document.getElementById(
            "resultTotal"
        ).textContent =
            result.total;
    }
                                                       }
