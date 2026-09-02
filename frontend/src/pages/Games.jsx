import { Link } from "react-router-dom";

export default function Games() {
  return (
    <div className="page games-page">
      <section className="games-hero">
        <div>
          <span className="eyebrow">MEMORYMESH GAMES</span>
          <h1 className="brand">Learn by playing</h1>
          <p className="subtitle">
            Turn your study material into quick memory-building games.
          </p>
        </div>

        <div className="games-hero-icon">
          🎮
        </div>
      </section>

      <section className="games-grid">

        <Link to="/word-match" className="game-page-card game-page-card-active">
          <div className="game-page-icon">🧩</div>

          <div className="game-page-content">
            <span>AVAILABLE NOW</span>
            <h2>Word Match</h2>
            <p>
              Match each question with its correct answer.
            </p>
          </div>

          <strong>Play →</strong>
        </Link>

        <Link
          to="/rapid-fire"
          className="game-page-card game-page-card-active"
        >
          <div className="game-page-icon">⚡</div>

          <div className="game-page-content">
            <span>AVAILABLE NOW</span>
            <h2>Rapid Fire</h2>
            <p>
              Answer study questions as quickly as you can.
            </p>
          </div>

          <strong>Play →</strong>
        </Link>

        <Link
          to="/fill-in-story"
          className="game-page-card game-page-card-active"
        >
          <div className="game-page-icon">✍️</div>

          <div className="game-page-content">
            <span>AVAILABLE NOW</span>
            <h2>Fill in the Story</h2>
            <p>
              Recall and type your answers from memory.
            </p>
          </div>

          <strong>Play →</strong>
        </Link>

        <Link
          to="/timeline-drop"
          className="game-page-card game-page-card-active"
        >
          <div className="game-page-icon">⏱️</div>

          <div className="game-page-content">
            <span>AVAILABLE NOW</span>
            <h2>Timeline Drop</h2>
            <p>
              Put important events in chronological order.
            </p>
          </div>

          <strong>Play →</strong>
        </Link>

      </section>
    </div>
  );
}



