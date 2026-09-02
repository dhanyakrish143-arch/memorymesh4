import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);

  useEffect(() => {
    const incomingQuiz =
      location.state?.quiz ||
      JSON.parse(
        localStorage.getItem("memorymesh_quiz") || "[]"
      );

    const safeQuiz = Array.isArray(incomingQuiz)
      ? incomingQuiz.filter(
          (item) =>
            item &&
            typeof item.question === "string" &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            Number.isInteger(item.correct_index)
        )
      : [];

    setQuiz(safeQuiz);
  }, [location.state]);

  useEffect(() => {
    const saveResult = async () => {
      if (!finished || quiz.length === 0 || resultSaved) {
        return;
      }

      setSavingResult(true);

      try {
        const percentage = Math.round(
          (score / quiz.length) * 100
        );

        const subject =
          localStorage.getItem("memorymesh_quiz_subject") ||
          "General";

        const chapter =
          localStorage.getItem("memorymesh_quiz_chapter") ||
          "General";

        await client.post("/quiz/result", {
          score,
          total: quiz.length,
          percentage,
          subject,
          chapter,
        });

        setResultSaved(true);
      } catch (err) {
        console.error(
          "Failed to save quiz result:",
          err
        );
      } finally {
        setSavingResult(false);
      }
    };

    saveResult();
  }, [finished, quiz.length, score, resultSaved]);

  if (quiz.length === 0) {
    return (
      <div className="page quiz-page">
        <div className="quiz-empty card">
          <div className="quiz-empty-icon">📝</div>

          <span className="eyebrow">QUIZ MODE</span>

          <h1>No quiz available</h1>

          <p>
            Generate study content first, then start a quiz
            from the generated material.
          </p>

          <div className="quiz-empty-actions">
            <Link to="/upload" className="primary-button">
              Upload Material
            </Link>

            <Link to="/learn" className="secondary-button">
              Go to Learn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round(
      (score / quiz.length) * 100
    );

    let message = "Keep practicing!";

    if (percentage >= 80) {
      message = "Excellent work! 🎉";
    } else if (percentage >= 60) {
      message = "Good job! Keep improving.";
    }

    return (
      <div className="page quiz-page">
        <div className="quiz-result-card card">
          <div className="quiz-result-icon">
            {percentage >= 80 ? "🏆" : "🎯"}
          </div>

          <span className="eyebrow">
            QUIZ COMPLETE
          </span>

          <h1>{message}</h1>

          <p className="quiz-result-subtitle">
            You completed all {quiz.length} questions.
          </p>

          <div className="quiz-score-circle">
            <strong>{percentage}%</strong>
            <span>Score</span>
          </div>

          <div className="quiz-result-stats">
            <div>
              <strong>{score}</strong>
              <span>Correct</span>
            </div>

            <div>
              <strong>{quiz.length - score}</strong>
              <span>Incorrect</span>
            </div>

            <div>
              <strong>{quiz.length}</strong>
              <span>Total</span>
            </div>
          </div>

          {savingResult && (
            <p style={{
              marginTop: "15px",
              color: "#718096",
              fontSize: "12px"
            }}>
              Saving your quiz result...
            </p>
          )}

          {resultSaved && (
            <p style={{
              marginTop: "15px",
              color: "#4ca900",
              fontSize: "12px",
              fontWeight: 800
            }}>
              Quiz result saved ✓
            </p>
          )}

          <div className="quiz-result-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setIndex(0);
                setSelected(null);
                setScore(0);
                setFinished(false);
                setResultSaved(false);
              }}
            >
              Try Again
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/activity")}
            >
              View Activity
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz[index];
  const hasAnswered = selected !== null;

  const progress = Math.round(
    ((index + (hasAnswered ? 1 : 0)) /
      quiz.length) *
      100
  );

  const chooseAnswer = (optionIndex) => {
    if (hasAnswered) return;

    setSelected(optionIndex);

    if (
      optionIndex === currentQuestion.correct_index
    ) {
      setScore((current) => current + 1);
    }
  };

  const nextQuestion = () => {
    if (index + 1 >= quiz.length) {
      setFinished(true);
      return;
    }

    setIndex((current) => current + 1);
    setSelected(null);
  };

  return (
    <div className="page quiz-page">

      <section className="quiz-header">
        <div>
          <span className="eyebrow">
            MEMORYMESH QUIZ
          </span>

          <h1>Test your knowledge</h1>

          <p>
            Question {index + 1} of {quiz.length}
          </p>
        </div>

        <div className="quiz-score-badge">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
      </section>

      <div className="quiz-progress-card">
        <div className="quiz-progress-top">
          <span>Quiz progress</span>
          <strong>{progress}%</strong>
        </div>

        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <section className="quiz-question-card card">

        <span className="quiz-question-number">
          QUESTION {index + 1}
        </span>

        <h2>
          {currentQuestion.question}
        </h2>

        <div className="quiz-options">
          {currentQuestion.options.map(
            (option, optionIndex) => {
              const isSelected =
                selected === optionIndex;

              const isCorrect =
                optionIndex ===
                currentQuestion.correct_index;

              let className = "quiz-option";

              if (hasAnswered && isCorrect) {
                className +=
                  " quiz-option-correct";
              } else if (
                hasAnswered &&
                isSelected &&
                !isCorrect
              ) {
                className +=
                  " quiz-option-wrong";
              } else if (isSelected) {
                className +=
                  " quiz-option-selected";
              }

              return (
                <button
                  type="button"
                  key={optionIndex}
                  className={className}
                  onClick={() =>
                    chooseAnswer(optionIndex)
                  }
                  disabled={hasAnswered}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(
                      65 + optionIndex
                    )}
                  </span>

                  <span className="quiz-option-text">
                    {option}
                  </span>

                  {hasAnswered && isCorrect && (
                    <span className="quiz-option-result">
                      ✓
                    </span>
                  )}

                  {hasAnswered &&
                    isSelected &&
                    !isCorrect && (
                      <span className="quiz-option-result">
                        ✕
                      </span>
                    )}
                </button>
              );
            }
          )}
        </div>

        {hasAnswered && (
          <div className="quiz-explanation">
            <span className="quiz-explanation-icon">
              💡
            </span>

            <div>
              <strong>
                {selected ===
                currentQuestion.correct_index
                  ? "Correct!"
                  : "Not quite."}
              </strong>

              <p>
                {currentQuestion.explanation ||
                  "Review the material and try again."}
              </p>
            </div>
          </div>
        )}

        {hasAnswered && (
          <button
            type="button"
            className="quiz-next-button"
            onClick={nextQuestion}
          >
            {index + 1 === quiz.length
              ? "Finish Quiz"
              : "Next Question →"}
          </button>
        )}
      </section>

      <Link
        to="/upload"
        className="quiz-back-link"
      >
        ← Generate another quiz
      </Link>
    </div>
  );
}
