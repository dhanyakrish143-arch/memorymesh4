import { useEffect, useState } from "react";
import client from "../api/client";

export default function QuizHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await client.get("/quiz/history");

        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load quiz history:", err);
        setError("Unable to load your quiz history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="page quiz-history-page">
        <div className="quiz-history-loading">
          <div className="quiz-history-spinner" />
          <p>Loading your quiz history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page quiz-history-page">
        <section className="card quiz-history-empty">
          <span className="eyebrow">QUIZ HISTORY</span>
          <h1>Something went wrong</h1>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  const totalAttempts = history.length;

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          history.reduce(
            (sum, item) => sum + Number(item.percentage || 0),
            0
          ) / totalAttempts
        )
      : 0;

  const bestScore =
    totalAttempts > 0
      ? Math.max(
          ...history.map((item) =>
            Number(item.percentage || 0)
          )
        )
      : 0;

  return (
    <div className="page quiz-history-page">

      <section className="progress-hero">
        <div>
          <span className="eyebrow">MEMORYMESH QUIZ</span>

          <h1 className="brand">
            Quiz History
          </h1>

          <p className="subtitle">
            Review your past quiz attempts and track your improvement.
          </p>
        </div>

        <div className="progress-hero-badge">
          <span>Attempts</span>
          <strong>{totalAttempts}</strong>
        </div>
      </section>

      {totalAttempts > 0 && (
        <div className="quiz-history-stats">

          <div className="quiz-history-stat card">
            <span>Attempts</span>
            <strong>{totalAttempts}</strong>
            <small>Total quizzes completed</small>
          </div>

          <div className="quiz-history-stat card">
            <span>Average</span>
            <strong>{averageScore}%</strong>
            <small>Average quiz score</small>
          </div>

          <div className="quiz-history-stat card">
            <span>Best score</span>
            <strong>{bestScore}%</strong>
            <small>Your highest score</small>
          </div>

        </div>
      )}

      <section className="card quiz-history-section">

        <div className="progress-section-header">
          <div>
            <span className="eyebrow">HISTORY</span>
            <h2>Recent quizzes</h2>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="quiz-history-empty">
            <div className="quiz-history-empty-icon">
              📝
            </div>

            <h3>No quizzes completed yet</h3>

            <p>
              Complete a quiz and your results will appear here.
            </p>
          </div>
        ) : (
          <div className="quiz-history-list">

            {history.map((item, index) => {
              const percentage = Number(
                item.percentage || 0
              );

              const score = Number(item.score || 0);
              const total = Number(item.total || 0);

              const date = item.completedAt
                ? new Date(item.completedAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "Unknown date";

              return (
                <div
                  className="quiz-history-row"
                  key={item._id || index}
                >

                  <div className="quiz-history-score">
                    <strong>{percentage}%</strong>
                    <span>{score} / {total}</span>
                  </div>

                  <div className="quiz-history-main">
                    <h3>
                      {item.subject || "General"}
                    </h3>

                    <p>
                      {item.chapter || "General"}
                    </p>
                  </div>

                  <div className="quiz-history-date">
                    {date}
                  </div>

                  <div
                    className={`quiz-history-result ${
                      percentage >= 80
                        ? "excellent"
                        : percentage >= 60
                          ? "good"
                          : "needs-practice"
                    }`}
                  >
                    {percentage >= 80
                      ? "Excellent"
                      : percentage >= 60
                        ? "Good"
                        : "Keep practicing"}
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>
    </div>
  );
}
