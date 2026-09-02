import { useEffect, useState } from "react";
import client from "../api/client";

export default function DailyGoal() {
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const { data } = await client.get("/goal/daily-goal");

        if (data?.success) {
          setGoal(data);
        }
      } catch (err) {
        console.error("Failed to load daily goal:", err);
      }
    };

    loadGoal();
  }, []);

  if (!goal) {
    return null;
  }

  return (
    <section className="daily-goal-card">

      <div className="daily-goal-icon">
        {goal.complete ? "✓" : "🎯"}
      </div>

      <div className="daily-goal-content">

        <div className="daily-goal-header">
          <div>
            <span className="home-card-label">
              TODAY'S GOAL
            </span>

            <h2>
              {goal.complete
                ? "Goal complete!"
                : `${goal.target} reviews today`}
            </h2>
          </div>

          <strong>
            {goal.completed} / {goal.target}
          </strong>
        </div>

        <div className="daily-goal-track">
          <div
            className="daily-goal-fill"
            style={{
              width: `${goal.progress}%`,
            }}
          />
        </div>

        <p>
          {goal.complete
            ? "Amazing! You completed today's study goal. 🎉"
            : `${goal.remaining} review${
                goal.remaining === 1 ? "" : "s"
              } remaining to reach your goal.`}
        </p>

      </div>

    </section>
  );
}
