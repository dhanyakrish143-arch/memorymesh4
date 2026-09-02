import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client from "../api/client";

const QUESTION_OPTIONS = [10, 20, 30];
const TIME_OPTIONS = [5, 10, 20];

export default function Exam() {
  const location = useLocation();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const incomingQuiz = useMemo(() => {
    const stored = localStorage.getItem(
      "memorymesh_quiz"
    );

    const source =
      location.state?.quiz ||
      (stored ? JSON.parse(stored) : []);

    return Array.isArray(source)
      ? source.filter(
          (item) =>
            item &&
            typeof item.question === "string" &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            Number.isInteger(item.correct_index)
        )
      : [];
  }, [location.state]);

  useEffect(() => {
    setQuiz(incomingQuiz);
  }, [incomingQuiz]);

  const availableCount = quiz.length;

  const examCount = Math.min(
    Number(questionCount),
    availableCount
  );

  const examQuestions = useMemo(() => {
    return quiz.slice(0, examCount);
  }, [quiz, examCount]);

  useEffect(() => {
    if (!started || finished) return;

    if (remainingSeconds <= 0) {
      setFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) =>
        Math.max(current - 1, 0)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished, remainingSeconds]);

  useEffect(() => {
    if (!finished || examQuestions.length === 0 || saved) {
      return;
    }

    const saveExamResult = async () => {
      setSaving(true);

      const correct = examQuestions.reduce(
        (total, question, questionIndex) => {
          return (
            total +
            (answers[questionIndex] ===
            question.correct_index
              ? 1
              : 0)
          );
        },
        0
      );

      const percentage = Math.round(
        (correct / examQuestions.length) * 100
      );

      const subject =
        localStorage.getItem(
          "memorymesh_quiz_subject"
        ) || "General";

      const chapter =
        localStorage.getItem(
          "memorymesh_quiz_chapter"
        ) || "General";

      try {
        await client.post("/quiz/result", {
          score: correct,
          total: examQuestions.length,
          percentage,
          subject,
          chapter,
        });

        setSaved(true);
      } catch (err) {
        console.error(
          "Failed to save exam result:",
          err
        );
      } finally {
        setSaving(false);
      }
    };

    saveExamResult();
  }, [
    finished,
    examQuestions,
    answers,
    saved,
  ]);

  const correctCount = useMemo(() => {
    return examQuestions.reduce(
      (total, question, questionIndex) =>
        total +
        (answers[questionIndex] ===
        question.correct_index
          ? 1
          : 0),
      0
    );
  }, [examQuestions, answers]);

  const incorrectCount =
    examQuestions.length - correctCount;

  const percentage =
    examQuestions.length > 0
      ? Math.round(
          (correctCount / examQuestions.length) * 100
        )
      : 0;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const startExam = () => {
    if (examQuestions.length === 0) return;

    setAnswers({});
    setIndex(0);
    setFinished(false);
    setSaved(false);
    setRemainingSeconds(
      Number(timeLimit) * 60
    );
    setStarted(true);
  };

  const chooseAnswer = (optionIndex) => {
    if (finished) return;

    setAnswers((current) => ({
      ...current,
      [index]: optionIndex,
    }));
  };

  const previousQuestion = () => {
    setIndex((current) =>
      Math.max(current - 1, 0)
    );
  };

  const nextQuestion = () => {
    if (index + 1 >= examQuestions.length) {
      setFinished(true);
      return;
    }

    setIndex((current) => current + 1);
  };

  const finishExam = () => {
    setFinished(true);
  };

  if (quiz.length === 0) {
    return (
      <div className="page exam-page">
        <div className="exam-empty card">
          <div className="exam-empty-icon">
            📝
          </div>

          <span className="eyebrow">
            EXAM MODE
          </span>

          <h1>
            No exam available
          </h1>

          <p>
            Generate quiz material first, then start
            an exam from those questions.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/upload")}
          >
            Generate Questions
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="page exam-page">

        <section className="exam-hero">
          <div>
            <span className="eyebrow">
              MEMORYMESH EXAM
            </span>

            <h1 className="brand">
              Exam Mode
            </h1>

            <p className="subtitle">
              Test yourself without seeing answers
              until the exam is complete.
            </p>
          </div>

          <div className="exam-hero-icon">
            ⏱
          </div>
        </section>

        <section className="card exam-builder">

          <div className="exam-builder-heading">
            <span className="eyebrow">
              EXAM SETUP
            </span>

            <h2>
              Prepare your exam
            </h2>

            <p>
              You have {availableCount} available
              question
              {availableCount === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="exam-setup-grid">

            <div className="exam-setting">
              <span>
                Questions
              </span>

              <div className="exam-setting-options">
                {QUESTION_OPTIONS.map((count) => {
                  const actual =
                    Math.min(
                      count,
                      availableCount
                    );

                  if (actual === 0) return null;

                  const isDuplicate =
                    QUESTION_OPTIONS.some(
                      (otherCount) =>
                        otherCount < count &&
                        Math.min(
                          otherCount,
                          availableCount
                        ) === actual
                    );

                  if (isDuplicate) return null;

                  return (
                    <button
                      type="button"
                      key={count}
                      className={
                        questionCount === count
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setQuestionCount(count)
                      }
                    >
                      {availableCount <= count
                        ? `All ${availableCount} questions`
                        : `${count} questions`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="exam-setting">
              <span>
                Time limit
              </span>

              <div className="exam-setting-options">
                {TIME_OPTIONS.map((minutes) => (
                  <button
                    type="button"
                    key={minutes}
                    className={
                      timeLimit === minutes
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setTimeLimit(minutes)
                    }
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="exam-rules">

            <div>
              <span>✓</span>
              <p>
                No correct or incorrect feedback
                during the exam.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                You can move between questions.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Your score is shown only after
                submission.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="primary-button exam-start-button"
            onClick={startExam}
          >
            Start Exam →
          </button>

        </section>

      </div>
    );
  }

  if (finished) {
    return (
      <div className="page exam-page">

        <div className="exam-result-card card">

          <div className="exam-result-icon">
            {percentage >= 80 ? "🏆" : "🎯"}
          </div>

          <span className="eyebrow">
            EXAM COMPLETE
          </span>

          <h1>
            {percentage >= 80
              ? "Excellent work!"
              : percentage >= 60
                ? "Good job!"
                : "Keep practicing!"}
          </h1>

          <p className="subtitle">
            You completed your exam.
          </p>

          <div className="exam-score-circle">
            <strong>
              {percentage}%
            </strong>

            <span>
              Score
            </span>
          </div>

          <div className="exam-result-stats">

            <div>
              <strong>
                {correctCount}
              </strong>

              <span>
                Correct
              </span>
            </div>

            <div>
              <strong>
                {incorrectCount}
              </strong>

              <span>
                Incorrect
              </span>
            </div>

            <div>
              <strong>
                {examQuestions.length}
              </strong>

              <span>
                Total
              </span>
            </div>

          </div>

          {saving && (
            <p className="exam-save-message">
              Saving your exam result...
            </p>
          )}

          {saved && (
            <p className="exam-save-message exam-save-success">
              Exam result saved ✓
            </p>
          )}

          <div className="exam-result-actions">

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setStarted(false);
                setFinished(false);
                setAnswers({});
                setIndex(0);
                setSaved(false);
              }}
            >
              Try Again
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/quiz")
              }
            >
              Back to Quiz
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/activity")
              }
            >
              View Activity
            </button>

          </div>

        </div>

        <section className="exam-review-card card">

          <span className="eyebrow">
            ANSWER REVIEW
          </span>

          <h2>
            Review your answers
          </h2>

          <div className="exam-answer-review">

            {examQuestions.map(
              (question, questionIndex) => {
                const selected =
                  answers[questionIndex];

                const correct =
                  selected ===
                  question.correct_index;

                return (
                  <div
                    className={`exam-answer-row ${
                      correct
                        ? "correct"
                        : "incorrect"
                    }`}
                    key={questionIndex}
                  >
                    <div>
                      <strong>
                        Question {questionIndex + 1}
                      </strong>

                      <p>
                        {question.question}
                      </p>
                    </div>

                    <span>
                      {correct
                        ? "✓ Correct"
                        : "✕ Incorrect"}
                    </span>
                  </div>
                );
              }
            )}

          </div>

        </section>

      </div>
    );
  }

  const currentQuestion =
    examQuestions[index];

  const selected =
    answers[index];

  const answeredCount =
    Object.keys(answers).length;

  const progress = Math.round(
    ((index + 1) /
      examQuestions.length) *
      100
  );

  return (
    <div className="page exam-page">

      <section className="exam-running-header">

        <div>
          <span className="eyebrow">
            EXAM MODE
          </span>

          <h1>
            Question {index + 1} of{" "}
            {examQuestions.length}
          </h1>
        </div>

        <div
          className={`exam-timer ${
            remainingSeconds <= 60
              ? "warning"
              : ""
          }`}
        >
          <span>TIME</span>

          <strong>
            {formatTime(remainingSeconds)}
          </strong>
        </div>

      </section>

      <div className="exam-progress-card">

        <div className="exam-progress-top">
          <span>
            {answeredCount} answered
          </span>

          <strong>
            {progress}%
          </strong>
        </div>

        <div className="exam-progress-track">
          <div
            className="exam-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </div>

      <section className="card exam-question-card">

        <span className="exam-question-number">
          QUESTION {index + 1}
        </span>

        <h2>
          {currentQuestion.question}
        </h2>

        <div className="exam-options">

          {currentQuestion.options.map(
            (option, optionIndex) => (
              <button
                type="button"
                key={optionIndex}
                className={
                  selected === optionIndex
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  chooseAnswer(optionIndex)
                }
              >
                <span>
                  {String.fromCharCode(
                    65 + optionIndex
                  )}
                </span>

                <strong>
                  {option}
                </strong>
              </button>
            )
          )}

        </div>

        <div className="exam-navigation">

          <button
            type="button"
            className="secondary-button"
            onClick={previousQuestion}
            disabled={index === 0}
          >
            ← Previous
          </button>

          {index + 1 ===
          examQuestions.length ? (
            <button
              type="button"
              className="primary-button"
              onClick={finishExam}
            >
              Finish Exam
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={nextQuestion}
            >
              Next →
            </button>
          )}

        </div>

      </section>

    </div>
  );
}

