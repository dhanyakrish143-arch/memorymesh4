import { useEffect, useState } from "react";
import client from "../api/client";

export default function League() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeague = async () => {
      try {
        const response =
          await client.get("/league/current");

        setData(response.data);
      } catch (err) {
        console.error(
          "Failed to load league:",
          err
        );

        setError(
          err.response?.data?.error ||
          "Unable to load your league."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLeague();
  }, []);

  if (loading) {
    return (
      <div className="page league-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Loading your league...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page league-page">
        <section className="card league-error">
          <div>🏆</div>
          <h1>League unavailable</h1>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  const tier =
    data?.tier || "bronze";

  return (
    <div className="page league-page">

      <section className="league-hero">

        <div>
          <span className="eyebrow">
            MEMORYMESH COMPETITION
          </span>

          <h1>
            Weekly League
          </h1>

          <p>
            Earn XP this week and climb the leaderboard.
          </p>
        </div>

        <div className={`league-tier league-tier-${tier}`}>
          <span>YOUR TIER</span>
          <strong>
            {tier.toUpperCase()}
          </strong>
        </div>

      </section>

      <section className="league-stats">

        <div>
          <span>YOUR XP</span>
          <strong>
            {data?.weeklyXp || 0}
          </strong>
        </div>

        <div>
          <span>YOUR RANK</span>
          <strong>
            #{data?.currentRank || "-"}
          </strong>
        </div>

        <div>
          <span>PLAYERS</span>
          <strong>
            {data?.totalPlayers || 0}
          </strong>
        </div>

      </section>

      <section className="card league-board">

        <div className="league-board-header">

          <div>
            <span className="eyebrow">
              THIS WEEK
            </span>

            <h2>
              Leaderboard
            </h2>
          </div>

          <span>
            Week of {data?.week}
          </span>

        </div>

        <div className="league-zones">

          <span className="league-zone promotion">
            ↑ Promotion zone
          </span>

          <span className="league-zone demotion">
            ↓ Demotion zone
          </span>

        </div>

        <div className="league-list">

          {(data?.leaderboard || []).map(
            (player) => {

              const isYou =
                player.name === "You";

              const isPromotion =
                player.rank <= 3;

              const isDemotion =
                player.rank >
                Math.max(
                  (data?.totalPlayers || 0) - 2,
                  3
                );

              return (
                <div
                  key={player.userId}
                  className={
                    isYou
                      ? "league-player league-player-you"
                      : "league-player"
                  }
                >

                  <div
                    className={
                      player.rank <= 3
                        ? "league-rank top"
                        : "league-rank"
                    }
                  >
                    {player.rank === 1
                      ? "🥇"
                      : player.rank === 2
                        ? "🥈"
                        : player.rank === 3
                          ? "🥉"
                          : player.rank}
                  </div>

                  <div className="league-player-info">
                    <strong>
                      {player.name}
                    </strong>

                    <span>
                      Class {player.class || "-"}
                    </span>
                  </div>

                  <strong className="league-player-xp">
                    {player.xp} XP
                  </strong>

                  {isYou && (
                    <span className="league-you-badge">
                      YOU
                    </span>
                  )}

                  {!isYou && isPromotion && (
                    <span className="league-arrow-up">
                      ↑
                    </span>
                  )}

                  {!isYou && isDemotion && (
                    <span className="league-arrow-down">
                      ↓
                    </span>
                  )}

                </div>
              );
            }
          )}

        </div>

      </section>

    </div>
  );
}
