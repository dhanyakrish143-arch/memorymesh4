import { useEffect, useState } from "react";
import client from "../api/client";

export default function Progress() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data } = await client.get("/review/stats");

        if (data?.success) {
          setStats(data);
        } else {
          setStats(null);
        }
      } catch (err) {
        console.error("Failed to load progress:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  if (loading) {
    return (
      <div className="page progress-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  const overview = stats?.overview ?? {};

  const totalReviews = overview.totalReviews ?? 0;
  const correct = overview.totalCorrect ?? 0;
  const accuracy = overview.accuracy ?? 0;
  const mastered = overview.masteredCards ?? 0;
  const totalCards = overview.totalCards ?? 0;

  const subjects = stats?.subjects ?? [];
  const weeklyActivity = stats?.weeklyActivity ?? [];

  const streak = stats?.streak ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const gems = stats?.gems ?? 0;

  const currentLevelXp = xp % 100;
  const xpToNextLevel = 100 - currentLevelXp;

  const mastery =
    totalCards > 0
      ? Math.round((mastered / totalCards) * 100)
      : 0;

  const remaining = Math.max(totalCards - mastered, 0);

  return (
    <div className="page progress-page">
      <div className="progress-hero">
        <div>
          <span className="eyebrow">MEMORYMESH ANALYTICS</span>
          <h1 className="brand">Your Progress</h1>
          <p className="subtitle">
            See how your memory is improving over time.
          </p>
        </div>

        <div className="progress-hero-actions">
          <div className="progress-hero-badge">
            <span>Mastery</span>
            <strong>{mastery}%</strong>
          </div>
        </div>
      </div>

      <div className="progress-stats-grid">
        <div className="progress-stat-card">
          <div className="progress-stat-icon blue-icon">R</div>
          <div>
            <span>Total reviews</span>
            <strong>{totalReviews}</strong>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-icon green-icon">?</div>
          <div>
            <span>Correct answers</span>
            <strong>{correct}</strong>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-icon purple-icon">%</div>
          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="progress-stat-icon amber-icon">M</div>
          <div>
            <span>Cards mastered</span>
            <strong>{mastered}</strong>
          </div>
        </div>
      </div>

      <div className="progress-gamification-grid">
        <div className="card gamification-card">
          <div className="gamification-icon">🔥</div>

          <div>
            <span className="eyebrow">STREAK</span>
            <h2>{streak} day{streak === 1 ? "" : "s"}</h2>

            <p>
              {streak > 0
                ? "Keep your learning streak alive!"
                : "Start reviewing to begin your streak."}
            </p>
          </div>
        </div>

        <div className="card gamification-card">
          <div className="gamification-icon">⭐</div>

          <div>
            <span className="eyebrow">LEVEL</span>
            <h2>Level {level}</h2>

            <div className="xp-progress-track">
              <div
                className="xp-progress-fill"
                style={{
                  width: `${currentLevelXp}%`,
                }}
              />
            </div>

            <p>
              {currentLevelXp} / 100 XP
              {level < 100 && ` • ${xpToNextLevel} XP to next level`}
            </p>
          </div>
        </div>

        <div className="card gamification-card">
          <div className="gamification-icon">💎</div>

          <div>
            <span className="eyebrow">GEMS</span>
            <h2>{gems}</h2>

            <p>Earn gems by completing achievements.</p>
          </div>
        </div>
      </div>

      <div className="card progress-section">
        <div className="progress-section-header">
          <div>
            <span className="eyebrow">PERFORMANCE</span>
            <h2>Learning progress</h2>
          </div>
        </div>

        <div className="metric">
          <div className="metric-header">
            <span>Answer accuracy</span>
            <strong>{accuracy}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill accuracy-fill"
              style={{
                width: `${Math.min(accuracy, 100)}%`,
              }}
            />
          </div>

          <p>
            {accuracy >= 80
              ? "Excellent work. Keep it up!"
              : accuracy >= 60
                ? "Good progress. Keep practicing."
                : "Keep reviewing to improve your accuracy."}
          </p>
        </div>

        <div className="metric">
          <div className="metric-header">
            <span>Card mastery</span>
            <strong>{mastery}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill mastery-fill"
              style={{
                width: `${Math.min(mastery, 100)}%`,
              }}
            />
          </div>

          <p>
            {mastered} of {totalCards} cards mastered.
          </p>
        </div>
      </div>


      <div className="card progress-section">
        <div className="progress-section-header">
          <div>
            <span className="eyebrow">SUBJECTS</span>
            <h2>Subject mastery</h2>
          </div>
        </div>

        {subjects.length === 0 ? (
          <p>No subject progress yet. Start reviewing cards.</p>
        ) : (
          subjects.map((subject) => (
            <div className="metric" key={subject.subject}>
              <div className="metric-header">
                <span>{subject.subject}</span>
                <strong>{subject.mastery}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill mastery-fill"
                  style={{
                    width: `${Math.min(subject.mastery, 100)}%`,
                  }}
                />
              </div>

              <p>
                {subject.mastered} of {subject.total} cards mastered •{" "}
                {subject.accuracy}% accuracy
              </p>
            </div>
          ))
        )}
      </div>


      <div className="card progress-section">
        <div className="progress-section-header">
          <div>
            <span className="eyebrow">LAST 7 DAYS</span>
            <h2>Study activity</h2>
          </div>
        </div>

        {weeklyActivity.length === 0 ? (
          <p>No review activity yet.</p>
        ) : (
          <div className="weekly-activity">
            {weeklyActivity.map((day) => (
              <div className="activity-day" key={day.date}>
                <strong>{day.reviews}</strong>
                <span>{new Date(day.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-bottom-grid">
        <div className="card progress-summary-card">
          <span className="eyebrow">YOUR DECK</span>

          <h2>{totalCards} cards</h2>

          <p>
            {remaining === 0
              ? "Amazing! You've mastered every card."
              : `${remaining} card${remaining === 1 ? "" : "s"} still to master.`}
          </p>
        </div>

        <div className="card progress-summary-card">
          <span className="eyebrow">REVIEWS</span>

          <h2>{totalReviews} completed</h2>

          <p>
            You answered {correct} question
            {correct === 1 ? "" : "s"} correctly.
          </p>
        </div>
      </div>

      <div className="card progress-message">
        <div className="message-icon">?</div>

        <div>
          <h2>Keep going!</h2>

          <p>
            Consistent reviews are the key to remembering what you learn.
            Come back regularly and keep building your memory.
          </p>
        </div>
      </div>
    </div>
  );
}





