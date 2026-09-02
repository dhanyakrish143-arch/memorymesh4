import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./TimelineDrop.css";

const EVENTS_PER_GAME = 5;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
}

export default function TimelineDrop() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  const [events, setEvents] = useState([]);
  const [userOrder, setUserOrder] = useState([]);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [score, setScore] = useState(0);

  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const { data } = await client.get("/cards");

        setCards(
          Array.isArray(data)
            ? data
            : data?.cards || []
        );
      } catch (err) {
        console.error(
          "Failed to load Timeline Drop cards:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const subjects = useMemo(() => {
    return [
      ...new Set(
        cards
          .map((card) => card.subject?.trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [cards]);

  const chapters = useMemo(() => {
    if (!subject) {
      return [];
    }

    return [
      ...new Set(
        cards
          .filter(
            (card) =>
              card.subject?.trim().toLowerCase() ===
              subject.toLowerCase()
          )
          .map((card) => card.chapter?.trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [cards, subject]);

  const materialCards = useMemo(() => {
    return cards.filter((card) => {
      const sameSubject =
        !subject ||
        card.subject?.trim().toLowerCase() ===
          subject.toLowerCase();

      const sameChapter =
        !chapter ||
        card.chapter?.trim().toLowerCase() ===
          chapter.toLowerCase();

      return (
        sameSubject &&
        sameChapter &&
        card.question &&
        card.answer
      );
    });
  }, [cards, subject, chapter]);

  useEffect(() => {
    if (
      !started ||
      finished ||
      !startedAt
    ) {
      return;
    }

    const timer = setInterval(() => {
      setElapsed(
        Math.floor(
          (Date.now() - startedAt) / 1000
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    started,
    finished,
    startedAt,
  ]);

  const startGame = async () => {
    if (
      generating ||
      materialCards.length === 0
    ) {
      return;
    }

    setGenerating(true);
    setGenerationError("");
    setResult(null);

    try {
      /*
        Send the user's existing study material to
        the backend AI generator.
      */
      const material = materialCards
        .map(
          (card, index) =>
            `Study item ${index + 1}:
Question: ${card.question}
Answer: ${card.answer}`
        )
        .join("\n\n");

      const { data } = await client.post(
        "/games/timeline",
        {
          subject: subject || "General",
          chapter: chapter || "General",
          material,
        }
      );

      const generatedEvents =
        Array.isArray(data?.events)
          ? data.events
          : [];

      if (generatedEvents.length < 2) {
        throw new Error(
          "Not enough reliable chronological events were found for this material."
        );
      }

      const usableEvents =
        generatedEvents
          .slice(0, EVENTS_PER_GAME)
          .map((event, index) => ({
            id: `${event.date ?? "process"}-${index}-${Date.now()}`,
            year:
              event.date === null ||
              event.date === undefined ||
              event.date === ""
                ? null
                : Number(event.date),
            event: event.title,
            description: event.description,
          }));

      if (usableEvents.length < 2) {
        throw new Error(
          "Timeline needs at least two events."
        );
      }

      const correctOrder = [...usableEvents].sort(
        (a, b) => a.year - b.year
      );

      setEvents(correctOrder);
      setUserOrder(shuffle(correctOrder));

      setStartedAt(Date.now());
      setElapsed(0);

      setScore(0);
      setChecked(false);
      setIsCorrect(false);

      setStarted(true);
      setFinished(false);
      setGenerationError("");
    } catch (err) {
      console.error(
        "Timeline generation failed:",
        err
      );

      setGenerationError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not generate the timeline."
      );
    } finally {
      setGenerating(false);
    }
  };

  const moveEvent = (index, direction) => {
    if (checked) {
      return;
    }

    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= userOrder.length
    ) {
      return;
    }

    const updated = [...userOrder];

    [
      updated[index],
      updated[nextIndex],
    ] = [
      updated[nextIndex],
      updated[index],
    ];

    setUserOrder(updated);
  };

  const checkTimeline = () => {
    if (
      checked ||
      userOrder.length === 0
    ) {
      return;
    }

    const correct =
      userOrder.every(
        (event, index) =>
          event.id === events[index]?.id
      );

    setIsCorrect(correct);
    setScore(correct ? 1 : 0);
    setChecked(true);
  };

  const finishGame = () => {
    const finalTime = startedAt
      ? Math.floor(
          (Date.now() - startedAt) / 1000
        )
      : elapsed;

    setElapsed(finalTime);
    setStarted(false);
    setFinished(true);
  };

  useEffect(() => {
    if (
      !finished ||
      events.length === 0 ||
      saving ||
      result
    ) {
      return;
    }

    const saveResult = async () => {
      setSaving(true);

      try {
        const { data } =
          await client.post(
            "/games/score",
            {
              gameType: "timeline-drop",
              subject:
                subject || "General",
              chapter:
                chapter || "General",
              score,
              maxScore: 1,
              timeTaken: elapsed,
            }
          );

        setResult(data);
      } catch (err) {
        console.error(
          "Failed to save Timeline Drop result:",
          err
        );

        setResult({
          rewards: {
            xp: 0,
            gems: 0,
          },
        });
      } finally {
        setSaving(false);
      }
    };

    saveResult();
  }, [
    finished,
    events.length,
    score,
    elapsed,
    subject,
    chapter,
    saving,
    result,
  ]);

  if (loading) {
    return (
      <div className="page timeline-drop-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>
            Preparing Timeline Drop...
          </p>
        </div>
      </div>
    );
  }

  if (!started && !finished) {
    return (
      <div className="page timeline-drop-page">

        <section className="timeline-drop-hero">
          <div>
            <span className="eyebrow">
              MEMORYMESH GAMES
            </span>

            <h1 className="brand">
              Timeline Drop
            </h1>

            <p className="subtitle">
              Put AI-generated study events in chronological order.
            </p>
          </div>

          <div className="timeline-drop-hero-icon">
            ⏱️
          </div>
        </section>

        <section className="card timeline-drop-builder">

          <div className="timeline-drop-heading">

            <span className="eyebrow">
              GAME SETUP
            </span>

            <h2>
              Choose your study material
            </h2>

            <p>
              MemoryMesh will create a timeline from
              your selected study material.
            </p>

          </div>

          <div className="timeline-drop-select-grid">

            <label>
              <span>
                Subject
              </span>

              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setChapter("");
                  setGenerationError("");
                }}
              >
                <option value="">
                  All subjects
                </option>

                {subjects.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                Chapter
              </span>

              <select
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setGenerationError("");
                }}
                disabled={!subject}
              >
                <option value="">
                  All chapters
                </option>

                {chapters.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </label>

          </div>

          <div className="timeline-drop-info">

            <strong>
              {materialCards.length} study items available
            </strong>

            <span>
              AI will generate up to {EVENTS_PER_GAME} reliable
              chronological events from this material.
            </span>

          </div>

          {generationError && (
            <div className="timeline-drop-feedback wrong">
              <strong>
                Could not create timeline
              </strong>

              <p>
                {generationError}
              </p>
            </div>
          )}

          <button
            type="button"
            className="primary-button timeline-drop-start"
            disabled={
              generating ||
              materialCards.length === 0
            }
            onClick={startGame}
          >
            {generating
              ? "Creating Timeline..."
              : "Generate Timeline →"}
          </button>

        </section>

      </div>
    );
  }

  if (finished) {
    const percentage =
      score === 1 ? 100 : 0;

    return (
      <div className="page timeline-drop-page">

        <section className="card timeline-drop-result">

          <div className="timeline-drop-result-icon">
            {percentage === 100
              ? "🏆"
              : "⏱️"}
          </div>

          <span className="eyebrow">
            TIMELINE DROP COMPLETE
          </span>

          <h1>
            {percentage === 100
              ? "Perfect timeline!"
              : "Keep practicing!"}
          </h1>

          <p className="subtitle">
            You completed the timeline challenge.
          </p>

          <div className="timeline-drop-score">

            <strong>
              {score}/1
            </strong>

            <span>
              {percentage}% score
            </span>

          </div>

          <div className="timeline-drop-stats">

            <div>
              <strong>
                {isCorrect ? 1 : 0}
              </strong>

              <span>
                Correct
              </span>
            </div>

            <div>
              <strong>
                {isCorrect ? 0 : 1}
              </strong>

              <span>
                Incorrect
              </span>
            </div>

            <div>
              <strong>
                {formatTime(elapsed)}
              </strong>

              <span>
                Time
              </span>
            </div>

          </div>

          {saving && (
            <p className="timeline-drop-saving">
              Saving your result...
            </p>
          )}

          {result?.rewards && (
            <div className="timeline-drop-rewards">

              <div>
                <strong>
                  +{result.rewards.xp}
                </strong>

                <span>
                  XP
                </span>
              </div>

              <div>
                <strong>
                  +{result.rewards.gems}
                </strong>

                <span>
                  Gems
                </span>
              </div>

            </div>
          )}

          <div className="timeline-drop-actions">

            <button
              type="button"
              className="primary-button"
              onClick={startGame}
            >
              Play Again
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/games")
              }
            >
              All Games
            </button>

          </div>

        </section>

      </div>
    );
  }

  return (
    <div className="page timeline-drop-page">

      <section className="timeline-drop-running-header">

        <div>
          <span className="eyebrow">
            TIMELINE DROP
          </span>

          <h1>
            Build the timeline
          </h1>

          <p>
            {subject || "All subjects"}
            {chapter
              ? ` · ${chapter}`
              : ""}
          </p>
        </div>

        <div className="timeline-drop-timer">

          <span>
            TIME
          </span>

          <strong>
            {formatTime(elapsed)}
          </strong>

        </div>

      </section>

      <section className="card timeline-drop-question">

        <div className="timeline-drop-instruction">
          <span>
            OLDEST
          </span>

          <strong>
            Arrange the events from oldest to newest
          </strong>

          <span>
            NEWEST
          </span>
        </div>

        <div className="timeline-drop-list">

          {userOrder.map(
            (event, index) => {

              const correctPosition =
                events[index]?.id === event.id;

              return (
                <div
                  key={event.id}
                  className={
                    checked
                      ? correctPosition
                        ? "timeline-drop-item correct"
                        : "timeline-drop-item wrong"
                      : "timeline-drop-item"
                  }
                >

                  <div className="timeline-drop-position">
                    {index + 1}
                  </div>

                  <div className="timeline-drop-content">

                    <span className="timeline-drop-year">
                      {event.year !== null
                        ? event.year
                        : `STEP ${index + 1}`}
                    </span>

                    <strong>
                      {event.event}
                    </strong>

                    <p>
                      {event.description}
                    </p>

                  </div>

                  {!checked && (
                    <div className="timeline-drop-controls">

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          moveEvent(index, -1)
                        }
                        aria-label="Move up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          userOrder.length - 1
                        }
                        onClick={() =>
                          moveEvent(index, 1)
                        }
                        aria-label="Move down"
                      >
                        ↓
                      </button>

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>

        {!checked && (
          <button
            type="button"
            className="primary-button timeline-drop-check"
            onClick={checkTimeline}
          >
            Check Timeline →
          </button>
        )}

        {checked && (
          <div
            className={
              isCorrect
                ? "timeline-drop-feedback correct"
                : "timeline-drop-feedback wrong"
            }
          >

            <strong>
              {isCorrect
                ? "Correct! ✓"
                : "Not quite. ✕"}
            </strong>

            <p>
              {isCorrect
                ? "You placed every event in the correct order."
                : "The correct chronological order is shown below."}
            </p>

            {!isCorrect && (
              <div className="timeline-drop-correct-order">

                {events.map(
                  (event, index) => (
                    <div
                      key={event.id}
                    >
                      <span>
                        {index + 1}
                      </span>

                      <strong>
                        {event.year}
                      </strong>

                      <p>
                        {event.event}
                      </p>
                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

        {checked && (
          <button
            type="button"
            className="primary-button timeline-drop-finish"
            onClick={finishGame}
          >
            See Result →
          </button>
        )}

      </section>

    </div>
  );
}


