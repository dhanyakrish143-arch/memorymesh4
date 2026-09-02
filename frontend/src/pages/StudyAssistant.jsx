import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import client from "../api/client";

const QUICK_PROMPTS = [
  "Explain this topic in simple words.",
  "What are the most important things to remember?",
  "Give me a simple example.",
  "Quiz me on this topic.",
];

export default function StudyAssistant() {
  const [cards, setCards] = useState([]);
  const [notes, setNotes] = useState([]);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [showPlan, setShowPlan] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(20);
  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [generatingPlan, setGeneratingPlan] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudyMaterial = async () => {
      try {
        const [cardsResponse, notesResponse] =
          await Promise.all([
            client.get("/cards"),
            client.get("/notes"),
          ]);

        const cardData =
          Array.isArray(cardsResponse.data)
            ? cardsResponse.data
            : cardsResponse.data?.cards || [];

        const noteData =
          Array.isArray(notesResponse.data)
            ? notesResponse.data
            : notesResponse.data?.notes || [];

        setCards(cardData);
        setNotes(noteData);
      } catch (err) {
        console.error(
          "Failed to load TutorAgent material:",
          err
        );

        setError(
          "Unable to load your study material."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudyMaterial();
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

    const subjectKey =
      subject.toLowerCase();

    const values = [
      ...cards
        .filter(
          (card) =>
            card.subject
              ?.trim()
              .toLowerCase() ===
            subjectKey
        )
        .map((card) => card.chapter),

      ...notes
        .filter(
          (note) =>
            note.subject
              ?.trim()
              .toLowerCase() ===
            subjectKey
        )
        .map((note) => note.chapter),
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [cards, notes, subject]);

  const askQuestion = async (e) => {
    e.preventDefault();

    const trimmed = question.trim();

    if (!trimmed || asking) {
      return;
    }

    setAsking(true);
    setError("");

    const previousHistory =
      messages.slice(-10);

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setQuestion("");

    try {
      const { data } =
        await client.post(
          "/assistant/ask",
          {
            question: trimmed,
            subject:
              subject || undefined,
            chapter:
              chapter || undefined,
            history:
              previousHistory,
          }
        );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.answer ||
            "I couldn't generate an answer.",
        },
      ]);
    } catch (err) {
      console.error(
        "TutorAgent request failed:",
        err
      );

      setError(
        err.response?.data?.error ||
        "TutorAgent failed. Please try again."
      );

      setMessages((current) => {
        const next = [...current];
        next.pop();
        return next;
      });
    } finally {
      setAsking(false);
    }
  };

  const generatePlan = async () => {
    if (!subject || generatingPlan) {
      return;
    }

    try {
      setGeneratingPlan(true);
      setError("");
      setPlan(null);

      const { data } =
        await client.post(
          "/assistant/plan",
          {
            subject,
            chapter:
              chapter || undefined,
            minutesPerDay:
              Number(minutesPerDay),
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
        "TutorAgent plan failed:",
        err
      );

      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to generate the study plan."
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setQuestion("");
    setPlan(null);
    setError("");
  };

  if (loading) {
    return (
      <div className="page tutor-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>
            Preparing your TutorAgent...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page tutor-page">

      <section className="tutor-hero">
        <div>
          <span className="eyebrow">
            MEMORYMESH AI
          </span>

          <h1>
            Meet your TutorAgent
          </h1>

          <p>
            Ask doubts, simplify difficult ideas,
            create study plans, and learn directly
            from your MemoryMesh material.
          </p>
        </div>

        <div className="tutor-hero-icon">
          🤖
        </div>
      </section>

      <section className="card tutor-context">

        <div className="tutor-context-title">

          <div>
            <span className="eyebrow">
              STUDY CONTEXT
            </span>

            <h2>
              What are you studying?
            </h2>
          </div>

          <div className="tutor-context-actions">

            {messages.length > 0 && (
              <button
                type="button"
                className="tutor-new-chat"
                onClick={startNewChat}
              >
                + New chat
              </button>
            )}

            <button
              type="button"
              className={
                showPlan
                  ? "tutor-plan-toggle active"
                  : "tutor-plan-toggle"
              }
              onClick={() => {
                setShowPlan(
                  (current) => !current
                );
                setPlan(null);
              }}
            >
              📅 Study Plan
            </button>

          </div>

        </div>

        <div className="tutor-select-grid">

          <label>
            <span>Subject</span>

            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setChapter("");
                setPlan(null);
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

      </section>

      {showPlan && (
        <section className="tutor-plan-card">

          <div className="tutor-plan-header">
            <div>
              <span className="eyebrow">
                AI STUDY PLANNER
              </span>

              <h2>
                Build your study plan
              </h2>

              <p>
                TutorAgent will prioritize your
                notes, flashcards, mastery, and
                quiz performance.
              </p>
            </div>

            <div className="tutor-plan-icon">
              📅
            </div>
          </div>

          <div className="tutor-plan-controls">

            <label>
              <span>Study time per day</span>

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

            <button
              type="button"
              className="primary-button"
              disabled={
                !subject ||
                generatingPlan
              }
              onClick={generatePlan}
            >
              {generatingPlan
                ? "Building plan..."
                : "Generate Study Plan →"}
            </button>

          </div>

          {!subject && (
            <div className="tutor-plan-notice">
              Select a subject above to create
              your personalized plan.
            </div>
          )}

          {plan && (
            <div className="tutor-plan-result">

              <div className="tutor-plan-result-top">
                <div>
                  <span className="eyebrow">
                    YOUR PLAN
                  </span>

                  <h3>
                    {plan.title}
                  </h3>

                  <p>
                    {plan.overview}
                  </p>
                </div>

                <strong>
                  {minutesPerDay}
                  <small> min/day</small>
                </strong>
              </div>

              <div className="tutor-plan-days">

                {(plan.days || []).map(
                  (day, index) => (
                    <article
                      key={`${day.day}-${index}`}
                      className="tutor-plan-day"
                    >
                      <div className="tutor-plan-day-number">
                        {day.day}
                      </div>

                      <div>
                        <span>
                          DAY {day.day}
                        </span>

                        <h4>
                          {day.title}
                        </h4>

                        <div className="tutor-plan-task-list">
                          {(day.tasks || []).map(
                            (task, taskIndex) => (
                              <div
                                key={taskIndex}
                              >
                                <b>
                                  {taskIndex + 1}
                                </b>

                                <p>
                                  {task}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <small>
                        {day.minutes} min
                      </small>
                    </article>
                  )
                )}

              </div>

            </div>
          )}

        </section>
      )}

      <section className="tutor-chat">

        {messages.length === 0 ? (
          <div className="tutor-welcome">

            <div className="tutor-welcome-icon">
              ✦
            </div>

            <span className="eyebrow">
              YOUR AI TUTOR
            </span>

            <h2>
              What would you like to understand?
            </h2>

            <p>
              Ask about your selected subject or
              chapter. TutorAgent can explain,
              give examples, quiz you, or help plan
              your study.
            </p>

            <div className="tutor-quick-grid">

              {QUICK_PROMPTS.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() =>
                    setQuestion(prompt)
                  }
                >
                  {prompt}
                </button>
              ))}

            </div>

          </div>
        ) : (
          <div className="tutor-messages">

            {messages.map(
              (message, index) => (
                <div
                  key={index}
                  className={
                    message.role === "user"
                      ? "tutor-message tutor-message-user"
                      : "tutor-message tutor-message-ai"
                  }
                >
                  <span className="tutor-message-label">
                    {message.role === "user"
                      ? "YOU"
                      : "TUTORAGENT"}
                  </span>

                  <div className="tutor-message-body">
                    {message.role === "assistant" ? (
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              )
            )}

            {asking && (
              <div className="tutor-message tutor-message-ai">

                <span className="tutor-message-label">
                  TUTORAGENT
                </span>

                <div className="tutor-thinking">
                  <span />
                  <span />
                  <span />
                  <strong>
                    TutorAgent is thinking...
                  </strong>
                </div>

              </div>
            )}

          </div>
        )}

        {error && (
          <div className="tutor-error">
            {error}
          </div>
        )}

        <form
          className="tutor-input"
          onSubmit={askQuestion}
        >
          <textarea
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            placeholder={
              chapter
                ? `Ask about ${chapter}...`
                : subject
                  ? `Ask about ${subject}...`
                  : "Ask TutorAgent a question..."
            }
            rows={3}
            disabled={asking}
          />

          <div className="tutor-input-footer">

            <span>
              {subject
                ? `${subject}${chapter ? ` · ${chapter}` : ""}`
                : "All study material"}
            </span>

            <button
              type="submit"
              className="primary-button"
              disabled={
                !question.trim() ||
                asking
              }
            >
              {asking
                ? "Thinking..."
                : "Ask TutorAgent →"}
            </button>

          </div>
        </form>

      </section>

    </div>
  );
}
