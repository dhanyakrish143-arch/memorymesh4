import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

const TIME_OPTIONS = [15, 25, 45, 60];

export default function FocusMode() {
  const [cards, setCards] = useState([]);
  const [notes, setNotes] = useState([]);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [minutes, setMinutes] = useState(25);

  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    const loadMaterial = async () => {
      try {
        const [cardsResponse, notesResponse] =
          await Promise.all([
            client.get("/cards"),
            client.get("/notes"),
          ]);

        const cardData = Array.isArray(cardsResponse.data)
          ? cardsResponse.data
          : cardsResponse.data?.cards || [];

        const noteData = Array.isArray(notesResponse.data)
          ? notesResponse.data
          : notesResponse.data?.notes || [];

        setCards(cardData);
        setNotes(noteData);
      } catch (err) {
        console.error(
          "Failed to load focus mode material:",
          err
        );
      }
    };

    loadMaterial();
  }, []);

  const subjects = useMemo(() => {
    const values = [
      ...cards.map((card) => card.subject),
      ...notes.map((note) => note.subject),
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [cards, notes]);

  const chapters = useMemo(() => {
    if (!subject) return [];

    const subjectKey = subject.toLowerCase();

    const values = [
      ...cards
        .filter(
          (card) =>
            card.subject?.trim().toLowerCase() === subjectKey
        )
        .map((card) => card.chapter),

      ...notes
        .filter(
          (note) =>
            note.subject?.trim().toLowerCase() === subjectKey
        )
        .map((note) => note.chapter),
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [cards, notes, subject]);

  useEffect(() => {
    if (!running || finished) return;

    if (remaining <= 0) {
      setRunning(false);
      setFinished(true);

      const sessions = JSON.parse(
        localStorage.getItem("memorymesh_focus_sessions") || "[]"
      );

      sessions.push({
        subject: subject || "General",
        chapter: chapter || "General",
        minutes,
        completedAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "memorymesh_focus_sessions",
        JSON.stringify(sessions)
      );

      return;
    }

    const timer = setInterval(() => {
      setRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    running,
    finished,
    remaining,
    subject,
    chapter,
    minutes,
  ]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  const startSession = () => {
    setRemaining(minutes * 60);
    setFinished(false);
    setRunning(true);
    setSessionStarted(true);
  };

  const resetSession = () => {
    setRunning(false);
    setFinished(false);
    setSessionStarted(false);
    setRemaining(minutes * 60);
  };

  const changeMinutes = (value) => {
    setMinutes(value);

    if (!sessionStarted) {
      setRemaining(value * 60);
    }
  };

  const progress = Math.round(
    ((minutes * 60 - remaining) /
      (minutes * 60)) *
      100
  );

  if (finished) {
    return (
      <div className="page focus-page">
        <section className="card focus-complete">
          <div className="focus-complete-icon">
            ✓
          </div>

          <span className="eyebrow">
            FOCUS SESSION COMPLETE
          </span>

          <h1>
            Great work!
          </h1>

          <p className="subtitle">
            You completed {minutes} minutes of focused study.
          </p>

          <div className="focus-complete-time">
            {minutes}
            <span>minutes focused</span>
          </div>

          {(subject || chapter) && (
            <div className="focus-complete-context">
              {subject || "General"}
              {chapter ? ` · ${chapter}` : ""}
            </div>
          )}

          <div className="focus-actions">
            <button
              type="button"
              className="primary-button"
              onClick={resetSession}
            >
              Start Again
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                window.location.href = "/"
              }
            >
              Back to Home
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (sessionStarted) {
    return (
      <div className="page focus-page">
        <section className="focus-running">

          <span className="eyebrow">
            FOCUS MODE
          </span>

          <h1>
            Stay focused
          </h1>

          {(subject || chapter) && (
            <p className="focus-context">
              {subject || "General"}
              {chapter ? ` · ${chapter}` : ""}
            </p>
          )}

          <div className="focus-timer">
            {formatTime(remaining)}
          </div>

          <div className="focus-progress-track">
            <div
              className="focus-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="focus-progress-text">
            {progress}% complete
          </p>

          <div className="focus-running-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setRunning((current) => !current)
              }
            >
              {running ? "Pause" : "Resume"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetSession}
            >
              End Session
            </button>
          </div>

        </section>
      </div>
    );
  }

  return (
    <div className="page focus-page">

      <section className="focus-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH
          </span>

          <h1 className="brand">
            Focus Mode
          </h1>

          <p className="subtitle">
            Put distractions aside and give your study session
            your full attention.
          </p>
        </div>

        <div className="focus-hero-icon">
          ⏱
        </div>
      </section>

      <section className="card focus-builder">

        <div className="focus-heading">
          <span className="eyebrow">
            SESSION SETUP
          </span>

          <h2>
            What are you studying?
          </h2>
        </div>

        <div className="focus-select-grid">

          <label>
            <span>Subject</span>

            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setChapter("");
              }}
            >
              <option value="">
                General study
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
            <span>Chapter</span>

            <select
              value={chapter}
              onChange={(e) =>
                setChapter(e.target.value)
              }
              disabled={!subject}
            >
              <option value="">
                Entire subject
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

        <div className="focus-time-section">

          <span>
            Study time
          </span>

          <div className="focus-time-options">

            {TIME_OPTIONS.map((option) => (
              <button
                type="button"
                key={option}
                className={
                  minutes === option
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeMinutes(option)
                }
              >
                {option} min
              </button>
            ))}

          </div>

        </div>

        <div className="focus-tip">
          <span>💡</span>
          <p>
            During Focus Mode, keep only your study material
            open and work until the timer ends.
          </p>
        </div>

        <button
          type="button"
          className="primary-button focus-start-button"
          onClick={startSession}
        >
          Start Focus Session →
        </button>

      </section>

    </div>
  );
}
