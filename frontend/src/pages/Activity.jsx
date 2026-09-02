import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

export default function Activity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/review/activity")
      .then(({ data }) => {
        setActivity(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load activity:", err);
        setActivity([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const totalReviews = activity.reduce(
      (sum, day) => sum + Number(day.reviews || 0),
      0
    );

    const totalCorrect = activity.reduce(
      (sum, day) => sum + Number(day.correct || 0),
      0
    );

    const accuracy =
      totalReviews > 0
        ? Math.round((totalCorrect / totalReviews) * 100)
        : 0;

    const activeDays = activity.filter(
      (day) => Number(day.reviews || 0) > 0
    ).length;

    const maxReviews = Math.max(
      ...activity.map((day) => Number(day.reviews || 0)),
      1
    );

    return {
      totalReviews,
      totalCorrect,
      accuracy,
      activeDays,
      maxReviews,
    };
  }, [activity]);

  const calendarDays = useMemo(() => {
    const activityMap = new Map(
      activity.map((day) => [
        day.date,
        {
          reviews: Number(day.reviews || 0),
          correct: Number(day.correct || 0),
        },
      ])
    );

    const days = [];

    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = date.toISOString().slice(0, 10);

      days.push({
        date: key,
        reviews: activityMap.get(key)?.reviews || 0,
        correct: activityMap.get(key)?.correct || 0,
        dayNumber: date.getDate(),
        weekday: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
      });
    }

    return days;
  }, [activity]);

  const getCalendarLevel = (reviews) => {
    if (reviews === 0) return 0;
    if (reviews <= 3) return 1;
    if (reviews <= 7) return 2;
    if (reviews <= 12) return 3;
    return 4;
  };

  if (loading) {
    return (
      <div className="page progress-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Loading your activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page progress-page activity-page">

      <div className="progress-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH ACTIVITY
          </span>

          <h1 className="brand">
            Review Activity
          </h1>

          <p className="subtitle">
            See your review history and daily performance.
          </p>
        </div>
      </div>

      <div className="activity-stats-grid">

        <div className="activity-stat-card">
          <span>Reviews</span>
          <strong>{summary.totalReviews}</strong>
          <small>Last 30 days</small>
        </div>

        <div className="activity-stat-card">
          <span>Correct</span>
          <strong>{summary.totalCorrect}</strong>
          <small>Questions answered</small>
        </div>

        <div className="activity-stat-card">
          <span>Accuracy</span>
          <strong>{summary.accuracy}%</strong>
          <small>Overall performance</small>
        </div>

        <div className="activity-stat-card">
          <span>Active days</span>
          <strong>{summary.activeDays}</strong>
          <small>Days you studied</small>
        </div>

      </div>

      <div className="card activity-calendar-card">

        <div className="progress-section-header">

          <div>
            <span className="eyebrow">
              CONSISTENCY
            </span>

            <h2>
              Study calendar
            </h2>

            <p>
              Your review activity over the last 30 days.
            </p>
          </div>

          <div className="activity-period">
            {summary.activeDays} active days
          </div>

        </div>

        <div className="activity-calendar-weekdays">

          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
            (day) => (
              <span key={day}>{day}</span>
            )
          )}

        </div>

        <div className="activity-calendar">

          {calendarDays.map((day) => {

            const level = getCalendarLevel(day.reviews);

            const isToday =
              day.date ===
              new Date().toISOString().slice(0, 10);

            return (
              <div
                key={day.date}
                className={`activity-calendar-day level-${level} ${
                  isToday
                    ? "activity-calendar-today"
                    : ""
                }`}
                title={`${day.date}: ${day.reviews} review${
                  day.reviews === 1 ? "" : "s"
                }`}
              >
                <strong>
                  {day.dayNumber}
                </strong>

                <small>
                  {day.reviews}
                </small>
              </div>
            );
          })}

        </div>

        <div className="activity-calendar-legend">

          <span>Less</span>

          <i className="level-0"></i>
          <i className="level-1"></i>
          <i className="level-2"></i>
          <i className="level-3"></i>
          <i className="level-4"></i>

          <span>More</span>

        </div>

      </div>

      <div className="card activity-section">

        <div className="progress-section-header">

          <div>
            <span className="eyebrow">
              ACTIVITY
            </span>

            <h2>
              Last 30 days
            </h2>
          </div>

          <div className="activity-period">
            {summary.activeDays} active days
          </div>

        </div>

        {activity.length === 0 ? (

          <div className="activity-empty">

            <div className="activity-empty-icon">
              📚
            </div>

            <h3>
              No review activity yet
            </h3>

            <p>
              Complete some flashcard reviews and your study history
              will appear here.
            </p>

          </div>

        ) : (

          <div className="activity-list">

            {activity.map((day) => {

              const reviews = Number(day.reviews || 0);
              const correct = Number(day.correct || 0);

              const width =
                reviews > 0
                  ? Math.max(
                      Math.round(
                        (reviews / summary.maxReviews) * 100
                      ),
                      6
                    )
                  : 0;

              const formattedDate =
                new Date(
                  `${day.date}T00:00:00`
                ).toLocaleDateString(
                  "en-IN",
                  {
                    month: "short",
                    day: "numeric",
                  }
                );

              return (
                <div
                  className="activity-row"
                  key={day.date}
                >

                  <div className="activity-date">

                    <strong>
                      {formattedDate}
                    </strong>

                    <span>
                      {day.date}
                    </span>

                  </div>

                  <div className="activity-bar-area">

                    <div className="activity-bar-track">

                      <div
                        className="activity-bar"
                        style={{
                          width: `${width}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="activity-number">

                    <strong>
                      {reviews}
                    </strong>

                    <span>
                      reviews
                    </span>

                  </div>

                  <div className="activity-correct">

                    <strong>
                      {correct}
                    </strong>

                    <span>
                      correct
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      <div className="card activity-insight">

        <div className="activity-insight-icon">
          💡
        </div>

        <div>

          <span className="eyebrow">
            YOUR PROGRESS
          </span>

          <h2>
            {summary.accuracy >= 80
              ? "Excellent consistency!"
              : summary.accuracy >= 60
                ? "You're making good progress!"
                : "Keep building your memory!"}
          </h2>

          <p>
            You've completed {summary.totalReviews} review
            {summary.totalReviews === 1 ? "" : "s"} in the last 30 days
            with {summary.accuracy}% accuracy.
          </p>

        </div>

      </div>

    </div>
  );
}
