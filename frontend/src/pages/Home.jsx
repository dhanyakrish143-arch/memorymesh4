import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import DailyGoal from "../components/DailyGoal";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [dueCards, setDueCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, dueResponse] = await Promise.all([
          client.get("/review/stats"),
          client.get("/review/due"),
        ]);

        setStats(statsResponse.data);
        setDueCards(dueResponse.data || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-loading">
          <div className="loading-spinner"></div>
          <h2>Loading your dashboard...</h2>
          <p>Getting your learning progress ready.</p>
        </div>
      </div>
    );
  }

  const totalCards = stats?.totalCards ?? 0;
  const mastered = stats?.mastered ?? 0;
  const accuracy = stats?.accuracy ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;
  const dueCount = dueCards.length;

  const streak = stats?.streak ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const gems = stats?.gems ?? 0;

  const levelXp = xp % 100;
  const xpToNext = 100 - levelXp;

  const mastery =
    totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">
            YOUR LEARNING DASHBOARD
          </span>

          <h1>
            Ready to <span>learn?</span>
          </h1>

          <p>
            Keep your memory sharp with focused reviews and
            consistent practice.
          </p>
        </div>

        <div className="mastery-ring-card">
          <div
            className="mastery-ring"
            style={{
              background: `conic-gradient(
                #58cc02 ${mastery * 3.6}deg,
                #e8edf0 ${mastery * 3.6}deg
              )`,
            }}
          >
            <div className="mastery-ring-inner">
              <strong>{mastery}%</strong>
              <span>Mastery</span>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEW CTA */}
      <section className="review-cta">
        <div className="review-cta-icon">
          ✓
        </div>

        <div className="review-cta-content">
          <span className="home-card-label">TODAY'S REVIEW</span>

          <h2>
            {dueCount > 0
              ? `${dueCount} cards ready for you`
              : "You're all caught up!"}
          </h2>

          <p>
            {dueCount > 0
              ? "A few minutes of review can make a big difference."
              : "Great work. Add some new cards when you're ready."}
          </p>
        </div>

        <div className="review-cta-action">
          {dueCount > 0 ? (
            <Link to="/review" className="home-primary-button">
              Start Review
              <span>→</span>
            </Link>
          ) : (
            <Link to="/upload" className="home-primary-button">
              Add Cards
              <span>→</span>
            </Link>
          )}
        </div>
      </section>

      {/* GAMIFICATION */}
      <section className="home-gamification">
        <div className="home-gamification-card">
          <div className="home-gamification-icon">🔥</div>

          <div>
            <span>STREAK</span>
            <strong>{streak} day{streak === 1 ? "" : "s"}</strong>
            <small>
              {streak > 0
                ? "Keep it alive!"
                : "Start reviewing today."}
            </small>
          </div>
        </div>

        <div className="home-gamification-card">
          <div className="home-gamification-icon">⭐</div>

          <div>
            <span>LEVEL</span>
            <strong>Level {level}</strong>

            <div className="home-xp-track">
              <div
                className="home-xp-fill"
                style={{
                  width: `${levelXp}%`,
                }}
              />
            </div>

            <small>
              {levelXp}/100 XP
              {levelXp > 0 && ` • ${xpToNext} to next level`}
            </small>
          </div>
        </div>

        <div className="home-gamification-card">
          <div className="home-gamification-icon">💎</div>

          <div>
            <span>GEMS</span>
            <strong>{gems}</strong>
            <small>Earned from achievements</small>
          </div>
        </div>
      </section>

      <DailyGoal />

      {/* STATS */}
      <section className="home-stats">

        <div className="home-stat-card">
          <div className="home-stat-icon blue">
            ▣
          </div>

          <div>
            <span>Total Cards</span>
            <strong>{totalCards}</strong>
            <small>Your learning deck</small>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon purple">
            ↗
          </div>

          <div>
            <span>Reviews</span>
            <strong>{totalReviews}</strong>
            <small>Completed sessions</small>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon blue">
            %
          </div>

          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
            <small>Correct answers</small>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon green">
            ★
          </div>

          <div>
            <span>Mastered</span>
            <strong>{mastered}</strong>
            <small>Cards mastered</small>
          </div>
        </div>

      </section>

      {/* PROGRESS */}
      <section className="home-panel">

        <div className="home-panel-header">
          <div>
            <span className="home-card-label">YOUR PROGRESS</span>
            <h2>Learning overview</h2>
            <p>Track how your memory is improving.</p>
          </div>

          <Link to="/progress" className="home-text-link">
            View details →
          </Link>
        </div>

        <div className="home-progress-list">

          <div className="home-progress-item">
            <div className="home-progress-top">
              <div>
                <span className="progress-dot accuracy"></span>
                <strong>Answer accuracy</strong>
              </div>

              <strong>{accuracy}%</strong>
            </div>

            <div className="home-progress-track">
              <div
                className="home-progress-fill accuracy"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <div className="home-progress-item">
            <div className="home-progress-top">
              <div>
                <span className="progress-dot mastery"></span>
                <strong>Card mastery</strong>
              </div>

              <strong>{mastery}%</strong>
            </div>

            <div className="home-progress-track">
              <div
                className="home-progress-fill mastery"
                style={{ width: `${mastery}%` }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="quick-actions">

        <Link to="/upload" className="quick-action-card">
          <div className="quick-action-icon green">
            +
          </div>

          <div>
            <h3>Add new cards</h3>
            <p>Upload study material and build your deck.</p>
          </div>

          <span className="quick-arrow">→</span>
        </Link>

        <Link to="/cards" className="quick-action-card">
          <div className="quick-action-icon blue">
            ▣
          </div>

          <div>
            <h3>Browse your cards</h3>
            <p>Review and manage your flashcard library.</p>
          </div>

          <span className="quick-arrow">→</span>
        </Link>

      </section>

      {/* GAMES */}
      <section className="home-games-section">

        <div className="home-panel-header">
          <div>
            <span className="home-card-label">GAMES</span>
            <h2>Learn by playing</h2>
            <p>Strengthen your memory with quick study games.</p>
          </div>
        </div>

        <div className="home-games-grid">

          <Link
            to="/word-match"
            className="home-game-card"
          >
            <div className="home-game-icon">
              🧩
            </div>

            <div className="home-game-content">
              <span>WORD MATCH</span>
              <h3>Match the pairs</h3>
              <p>
                Match each question with its correct answer.
              </p>
            </div>

            <span className="home-game-arrow">
              →
            </span>
          </Link>

        </div>

      </section>

      {/* MOTIVATION */}
      <section className="home-motivation">
        <div className="motivation-star">
          ★
        </div>

        <div>
          <span>KEEP GOING</span>
          <h3>Small reviews create strong memories.</h3>
          <p>
            Consistency matters more than studying for hours.
            Keep showing up and let MemoryMesh help you remember.
          </p>
        </div>
      </section>

    </div>
  );
}


