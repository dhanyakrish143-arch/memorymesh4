import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

export default function StudyPlan() {
  const [cards, setCards] = useState([]);
  const [notes, setNotes] = useState([]);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(20);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

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
          "Failed to load study material:",
          err
        );

        setError(
          "Unable to load your study material."
        );
      } finally {
        setLoading(false);
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

    const key = subject.toLowerCase();

    const values = [
      ...cards
        .filter(
          (card) =>
            card.subject?.trim().toLowerCase() === key
        )
        .map((card) => card.chapter),

      ...notes
        .filter(
          (note) =>
            note.subject?.trim().toLowerCase() === key
        )
        .map((note) => note.chapter),
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [cards, notes, subject]);

  const generatePlan = async (e) => {
    e.preventDefault();

    if (!subject || generating) return;

    try {
      setGenerating(true);
      setError("");
      setPlan(null);

      const { data } = await client.post(
        "/study-plan/generate",
        {
          subject,
          chapter: chapter || undefined,
          minutesPerDay: Number(minutesPerDay),
        }
      );

      if (!data?.plan) {
        throw new Error(
          "No study plan was returned."
        );
      }

      setPlan(data.plan);
    } catch (err) {
      console.error(
        "Failed to generate study plan:",
        err
      );

      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to generate your study plan."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page study-plan-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>Preparing your study planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page study-plan-page">

      <section className="study-plan-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH AI
          </span>

          <h1 className="brand">
            AI Study Plan
          </h1>

          <p className="subtitle">
            Build a focused plan based on your notes,
            flashcards, and quiz performance.
          </p>
        </div>

        <div className="study-plan-hero-icon">
          ✓
        </div>
      </section>

      <section className="card study-plan-builder">

        <div className="study-plan-heading">
          <span className="eyebrow">
            PLAN BUILDER
          </span>

          <h2>
            Tell us how you want to study
          </h2>

          <p>
            MemoryMesh will build a practical plan around
            your existing study material.
          </p>
        </div>

        <form
          className="study-plan-form"
          onSubmit={generatePlan}
        >

          <label>
            <span>Subject</span>

            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setChapter("");
                setPlan(null);
              }}
              required
            >
              <option value="">
                Select a subject
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
              onChange={(e) => {
                setChapter(e.target.value);
                setPlan(null);
              }}
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

          <label>
            <span>
              Study time per day
            </span>

            <select
              value={minutesPerDay}
              onChange={(e) =>
                setMinutesPerDay(
                  Number(e.target.value)
                )
              }
            >
              <option value={10}>
                10 minutes
              </option>

              <option value={20}>
                20 minutes
              </option>

              <option value={30}>
                30 minutes
              </option>

              <option value={45}>
                45 minutes
              </option>

              <option value={60}>
                60 minutes
              </option>
            </select>
          </label>

          {error && (
            <div className="study-plan-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button study-plan-generate-button"
            disabled={!subject || generating}
          >
            {generating
              ? "Building your plan..."
              : "Generate Study Plan →"}
          </button>

        </form>

      </section>

      {plan && (
        <section className="study-plan-result">

          <div className="study-plan-result-header">

            <div>
              <span className="eyebrow">
                YOUR PLAN
              </span>

              <h2>
                {plan.title}
              </h2>

              <p>
                {plan.overview}
              </p>
            </div>

            <div className="study-plan-time">
              {minutesPerDay}
              <span>
                min/day
              </span>
            </div>

          </div>

          <div className="study-plan-days">

            {(plan.days || []).map((day, index) => (
              <article
                className="card study-plan-day"
                key={`${day.day}-${index}`}
              >

                <div className="study-plan-day-number">
                  {day.day}
                </div>

                <div className="study-plan-day-body">

                  <div className="study-plan-day-top">
                    <div>
                      <span className="eyebrow">
                        DAY {day.day}
                      </span>

                      <h3>
                        {day.title}
                      </h3>
                    </div>

                    <span className="study-plan-minutes">
                      {day.minutes} min
                    </span>
                  </div>

                  <div className="study-plan-tasks">

                    {(day.tasks || []).map(
                      (task, taskIndex) => (
                        <div
                          className="study-plan-task"
                          key={taskIndex}
                        >
                          <span>
                            {taskIndex + 1}
                          </span>

                          <p>
                            {task}
                          </p>
                        </div>
                      )
                    )}

                  </div>

                </div>

              </article>
            ))}

          </div>

        </section>
      )}

    </div>
  );
}
