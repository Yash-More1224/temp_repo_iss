const BASE_URL = "http://localhost:8000";

let score = 0;
let highScore = 0;
let currentQuestion = null;
let gameOver = false;
let attemptHistory = [];

const scoreDisplay = document.getElementById("scoreDisplay");
const questionDiv = document.getElementById("question");
const form = document.getElementById("answerForm");
const feedback = document.getElementById("feedback");
const resetBtn = document.getElementById("resetBtn");
const attemptList = document.getElementById("attemptList");
const attemptCount = document.getElementById("attemptCount");
const searchInput = document.getElementById("search");

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore}`;
}

function updateAttempts() {
  const search = searchInput.value.toLowerCase();
  const filtered = attemptHistory.filter(a =>
    a.question.toLowerCase().includes(search)
  );

  attemptList.innerHTML = filtered.map(a => `
    <div>
      <strong>${a.question}</strong><br/>
      Your answer: ${a.answer} — ${a.result}
    </div>
  `).join("");

  attemptCount.textContent = `Total attempts: ${filtered.length}`;
}

searchInput.addEventListener("input", updateAttempts);

async function loadHighScore() {
  try {
    const res = await fetch(`${BASE_URL}/quiz/highscore`);
    const data = await res.json();
    highScore = data.high_score;
    updateScoreDisplay();
  } catch {
    feedback.textContent = "Failed to load high score.";
  }
}

async function loadQuestion() {
  if (gameOver) return;

  try {
    const res = await fetch(`${BASE_URL}/quiz/question`);
    const data = await res.json();
    currentQuestion = data;

    questionDiv.textContent = data.text;

    form.innerHTML = data.options.map(option => `
      <label>
        <input type="radio" name="answer" value="${option}" required>
        ${option}
      </label><br/>
    `).join("") + `<button type="submit">Submit</button>`;

    form.dataset.id = data.id;
    feedback.textContent = "";
  } catch {
    feedback.textContent = "Failed to load question.";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (gameOver) return;

  const selected = form.querySelector("input[name=answer]:checked");
  if (!selected) return;

  const answer = selected.value;
  const id = parseInt(form.dataset.id);

  try {
    const res = await fetch(`${BASE_URL}/quiz/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer, score })
    });

    const data = await res.json();

    if (data.error) {
      feedback.textContent = data.error;
      return;
    }

    attemptHistory.push({
      question: currentQuestion.text,
      answer,
      result: data.is_correct ? "✅ Correct" : `❌ Wrong (Correct: ${data.correct_answer})`
    });

    updateAttempts();

    if (data.is_correct) {
      score = data.score;
      highScore = data.high_score;
      updateScoreDisplay();
      feedback.textContent = "✅ Correct!";
      await loadQuestion();
    } else {
      feedback.textContent = `❌ Incorrect. Correct answer: ${data.correct_answer}. Game Over.`;
      gameOver = true;
      form.innerHTML = "";
      resetBtn.classList.remove("hidden");
    }
  } catch {
    feedback.textContent = "Error submitting answer.";
  }
});

resetBtn.addEventListener("click", () => {
  score = 0;
  gameOver = false;
  attemptHistory = [];
  updateScoreDisplay();
  updateAttempts();
  resetBtn.classList.add("hidden");
  loadQuestion();
});

window.addEventListener("DOMContentLoaded", async () => {
  await loadHighScore();
  loadQuestion();
});

document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quizContainer');
    const submitQuizButton = document.getElementById('submitQuiz');
    const quizResults = document.getElementById('quizResults');
    const token = localStorage.getItem('token'); // BUGFIX: Need token for authenticated requests

    // BUGFIX: Check if token exists before proceeding
    if (!token) {
        alert('Please log in to take the quiz.');
        window.location.href = '/'; // Redirect to login
        return;
    }

    let currentQuestions = []; // To store fetched questions

    const fetchQuizQuestions = async () => {
        try {
            // BUGFIX: Correct API endpoint and add Authorization header
            const response = await fetch('/api/quiz/questions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                // BUGFIX: Handle unauthorized or other errors
                if (response.status === 401) {
                    alert('Session expired or invalid. Please log in again.');
                    localStorage.removeItem('token');
                    window.location.href = '/';
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }
            currentQuestions = await response.json();
            displayQuizQuestions(currentQuestions);
        } catch (error) {
            console.error('Failed to fetch quiz questions:', error);
            // BUGFIX: Provide user feedback
            if (quizContainer) quizContainer.innerHTML = '<p>Failed to load quiz questions.</p>';
        }
    };

    const displayQuizQuestions = (questions) => {
        if (!quizContainer) {
            console.error('Quiz container not found.'); // BUGFIX: Error if container missing
            return;
        }
        quizContainer.innerHTML = ''; // Clear previous content
        questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.classList.add('question'); // BUGFIX: Add class for potential styling
            // BUGFIX: Assuming question object has `id`, `text`, and `options` array
            questionElement.innerHTML = `
                <p><strong>Question ${index + 1}:</strong> ${q.text}</p>
                <form id="question-${q.id}">
                    ${q.options.map((option, i) => `
                        <div>
                            <input type="radio" id="option-${q.id}-${i}" name="answer-${q.id}" value="${option}">
                            <label for="option-${q.id}-${i}">${option}</label>
                        </div>
                    `).join('')}
                </form>
            `;
            quizContainer.appendChild(questionElement);
        });
        // BUGFIX: Show submit button only after questions are loaded
        if (submitQuizButton) submitQuizButton.style.display = 'block';
    };

    if (submitQuizButton) {
        // BUGFIX: Hide submit button initially
        submitQuizButton.style.display = 'none';

        submitQuizButton.addEventListener('click', async () => {
            const answers = [];
            currentQuestions.forEach(q => {
                const form = document.getElementById(`question-${q.id}`);
                const selectedOption = form ? form.querySelector(`input[name="answer-${q.id}"]:checked`) : null;
                // BUGFIX: Ensure an answer is selected, handle case where it might not be
                answers.push({
                    question_id: q.id,
                    // BUGFIX: Send the selected answer value, or null/empty if none selected
                    selected_answer: selectedOption ? selectedOption.value : null
                });
            });

            // BUGFIX: Check if all questions have been answered (optional, based on requirements)
            const unanswered = answers.some(a => a.selected_answer === null);
            if (unanswered) {
                // BUGFIX: Alert user about unanswered questions
                if (!confirm('You have unanswered questions. Submit anyway?')) {
                    return; // Stop submission if user cancels
                }
            }

            try {
                // BUGFIX: Correct API endpoint and add Authorization header
                const response = await fetch('/api/quiz/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ answers })
                });

                if (!response.ok) {
                    // BUGFIX: Handle unauthorized or other errors
                    if (response.status === 401) {
                        alert('Session expired or invalid. Please log in again.');
                        localStorage.removeItem('token');
                        window.location.href = '/';
                    } else {
                         // Try to get error detail from response
                        let errorDetail = 'Failed to submit quiz.';
                        try {
                            const errorData = await response.json();
                            errorDetail = errorData.detail || errorDetail;
                        } catch (jsonError) { /* Ignore */ }
                        throw new Error(`HTTP error! status: ${response.status}. ${errorDetail}`);
                    }
                    return;
                }

                const result = await response.json();
                // BUGFIX: Display quiz results clearly
                if (quizResults) {
                    // BUGFIX: Assuming result object has `score` and `total` properties
                    quizResults.innerHTML = `<h3>Quiz Results</h3><p>Your score: ${result.score} out of ${result.total}</p>`;
                    quizResults.style.display = 'block'; // Show results section
                } else {
                    console.error('Quiz results container not found.'); // BUGFIX: Error if container missing
                }
                // BUGFIX: Hide submit button after submission
                submitQuizButton.style.display = 'none';
                // BUGFIX: Optionally disable radio buttons after submission
                quizContainer.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);

            } catch (error) {
                console.error('Failed to submit quiz:', error);
                // BUGFIX: Provide user feedback on submission failure
                if (quizResults) {
                    quizResults.innerHTML = `<p>Error submitting quiz: ${error.message}</p>`;
                    quizResults.style.display = 'block';
                }
            }
        });
    }

    // Initial fetch of questions
    fetchQuizQuestions();
});
