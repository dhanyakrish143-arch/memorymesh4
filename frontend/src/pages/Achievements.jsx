import { useEffect, useState } from "react";
import client from "../api/client";

const achievementDefinitions = [
  {
    id: "first_review",
    icon: "🥇",
    title: "First Review",
    description: "Complete your first review.",
    reward: 10,
    target: 1,
    getProgress: (stats) => stats.totalReviews ?? 0,
    unit: "reviews",
  },
  {
    id: "10_correct",
    icon: "🎯",
    title: "10 Correct",
    description: "Answer 10 questions correctly.",
    reward: 20,
    target: 10,
    getProgress: (stats) => stats.correct ?? 0,
    unit: "correct answers",
  },
  {
    id: "3_day_streak",
    icon: "🔥",
    title: "3-Day Streak",
    description: "Study for 3 days in a row.",
    reward: 25,
    target: 3,
    getProgress: (stats) => stats.streak ?? 0,
    unit: "days",
  },
  {
    id: "7_day_streak",
    icon: "🔥",
    title: "7-Day Streak",
    description: "Study for 7 days in a row.",
    reward: 50,
    target: 7,
    getProgress: (stats) => stats.streak ?? 0,
    unit: "days",
  },
  {
    id: "50_reviews",
    icon: "📚",
    title: "50 Reviews",
    description: "Complete 50 reviews.",
    reward: 50,
    target: 50,
    getProgress: (stats) => stats.totalReviews ?? 0,
    unit: "reviews",
  },
  {
    id: "100_reviews",
    icon: "🏆",
    title: "100 Reviews",
    description: "Complete 100 reviews.",
    reward: 100,
    target: 100,
    getProgress: (stats) => stats.totalReviews ?? 0,
    unit: "reviews",
  },
  {
    id: "first_mastered",
    icon: "🧠",
    title: "First Mastered",
    description: "Master your first card.",
    reward: 20,
    target: 1,
    getProgress: (stats) => stats.mastered ?? 0,
    unit: "mastered cards",
  },
  {
    id: "10_mastered",
    icon: "🧠",
    title: "10 Mastered",
    description: "Master 10 cards.",
    reward: 75,
    target: 10,
    getProgress: (stats) => stats.mastered ?? 0,
    unit: "mastered cards",
  },
];

export default function Achievements() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const { data } = await client.get("/review/stats");
        setStats(data);
      } catch (err) {
        console.error(
          "Failed to load achievements:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  if (loading) {
    return (
      <div className="page progress-page achievements-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Loading your achievements...</p>
        </div>
      </div>
    );
  }

  const safeStats = stats || {};

  const achievements =
    safeStats.achievements || [];

  const gems = safeStats.gems ?? 0;

  const unlockedCount =
    achievementDefinitions.filter(
      (achievement) =>
        achievements.includes(achievement.id)
    ).length;

  const unlockedRewards =
    achievementDefinitions
      .filter((achievement) =>
        achievements.includes(achievement.id)
      )
      .reduce(
        (sum, achievement) =>
          sum + achievement.reward,
        0
      );

  const completion =
    achievementDefinitions.length > 0
      ? Math.round(
          (unlockedCount /
            achievementDefinitions.length) *
            100
        )
      : 0;

  return (
    <div className="page achievements-page">

      <section className="achievements-hero">

        <div>
          <span className="eyebrow">
            MEMORYMESH REWARDS
          </span>

          <h1>
            Achievements
          </h1>

          <p>
            Keep learning, build streaks, master cards,
            and earn rewards along the way.
          </p>
        </div>

        <div className="achievements-hero-icon">
          🏆
        </div>

      </section>

      <section className="achievements-summary">

        <div className="achievement-summary-card">
          <span>UNLOCKED</span>
          <strong>
            {unlockedCount}
            <small>
              /{achievementDefinitions.length}
            </small>
          </strong>
          <div className="achievement-summary-track">
            <div
              style={{
                width: `${completion}%`,
              }}
            />
          </div>
          <p>{completion}% complete</p>
        </div>

        <div className="achievement-summary-card">
          <span>REWARDS EARNED</span>
          <strong>
            {unlockedRewards}
            <small> 💎</small>
          </strong>
          <p>Achievement gems</p>
        </div>

        <div className="achievement-summary-card">
          <span>YOUR GEMS</span>
          <strong>
            {gems}
            <small> 💎</small>
          </strong>
          <p>Total gem balance</p>
        </div>

      </section>

      <section className="achievements-section">

        <div className="achievements-section-heading">
          <div>
            <span className="eyebrow">
              YOUR ACHIEVEMENTS
            </span>

            <h2>
              Keep pushing forward
            </h2>

            <p>
              Complete these goals to unlock more rewards.
            </p>
          </div>
        </div>

        <div className="achievements-grid">

          {achievementDefinitions.map(
            (achievement) => {
              const unlocked =
                achievements.includes(
                  achievement.id
                );

              const rawProgress =
                Number(
                  achievement.getProgress(
                    safeStats
                  )
                ) || 0;

              const progress = Math.min(
                rawProgress,
                achievement.target
              );

              const percentage =
                achievement.target > 0
                  ? Math.min(
                      Math.round(
                        (progress /
                          achievement.target) *
                          100
                      ),
                      100
                    )
                  : 0;

              return (
                <article
                  key={achievement.id}
                  className={
                    unlocked
                      ? "achievement-card achievement-unlocked"
                      : "achievement-card achievement-locked"
                  }
                >

                  <div className="achievement-icon">
                    {unlocked
                      ? achievement.icon
                      : "🔒"}
                  </div>

                  <div className="achievement-content">

                    <div className="achievement-title-row">

                      <div>
                        <h3>
                          {achievement.title}
                        </h3>

                        <p>
                          {achievement.description}
                        </p>
                      </div>

                      {unlocked && (
                        <span className="achievement-unlocked-badge">
                          ✓ Unlocked
                        </span>
                      )}

                    </div>

                    {!unlocked && (
                      <div className="achievement-progress">

                        <div className="achievement-progress-top">
                          <span>
                            Progress
                          </span>

                          <strong>
                            {progress} /{" "}
                            {achievement.target}
                          </strong>
                        </div>

                        <div className="achievement-progress-track">
                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <small>
                          {progress}{" "}
                          {achievement.unit}
                        </small>

                      </div>
                    )}

                    <div className="achievement-bottom">

                      <span className="achievement-reward">
                        +{achievement.reward} 💎
                      </span>

                      {unlocked ? (
                        <span className="achievement-status">
                          Completed
                        </span>
                      ) : (
                        <span className="achievement-status">
                          {percentage}%
                        </span>
                      )}

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>
      </section>

      <section className="achievements-footer">

        <div className="achievements-footer-icon">
          💎
        </div>

        <div>
          <span className="eyebrow">
            KEEP EARNING
          </span>

          <h2>
            Every review moves you closer.
          </h2>

          <p>
            Review cards, build your streak, and master
            difficult topics to unlock more rewards.
          </p>
        </div>

      </section>

    </div>
  );
}
