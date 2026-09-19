import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_SUBJECTS = [];

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cards, setCards] = useState([]);
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [textbooks, setTextbooks] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLearningContent = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          cardsResponse,
          notesResponse,
          subjectsResponse,
          textbooksResponse,
        ] = await Promise.all([
          client.get("/cards"),
          client.get("/notes"),
          client.get("/notes/subjects"),
          client.get(`/textbooks?class=${user?.class}`),
        ]);

        const cardData = Array.isArray(cardsResponse.data)
          ? cardsResponse.data
          : cardsResponse.data?.cards || [];

        const noteData = Array.isArray(notesResponse.data)
          ? notesResponse.data
          : notesResponse.data?.notes || [];

        const noteSubjects = Array.isArray(subjectsResponse.data)
          ? subjectsResponse.data
          : subjectsResponse.data?.subjects || [];

        const textbookData =
          textbooksResponse.data?.textbooks || [];

        setTextbooks(textbookData);

        setCards(cardData);
        setNotes(noteData);

        const discoveredSubjects = [
          ...DEFAULT_SUBJECTS,
          ...noteSubjects,
          ...cardData
            .map((card) => card.subject?.trim())
            .filter(Boolean),
        ];

        setSubjects([...new Set(discoveredSubjects)]);
      } catch (err) {
        console.error("Failed to load Learn content:", err);
        setError("Unable to load your learning content.");
      } finally {
        setLoading(false);
      }
    };

    loadLearningContent();
  }, [user?.class]);

  const subjectCards = useMemo(() => {
    if (!selectedSubject) return [];

    return cards.filter(
      (card) =>
        card.subject?.trim().toLowerCase() ===
        selectedSubject.trim().toLowerCase()
    );
  }, [cards, selectedSubject]);

  const subjectNotes = useMemo(() => {
    if (!selectedSubject) return [];

    return notes.filter(
      (note) =>
        note.subject?.trim().toLowerCase() ===
        selectedSubject.trim().toLowerCase()
    );
  }, [notes, selectedSubject]);

  const chapters = useMemo(() => {
    const chapterSet = new Set();

    subjectCards.forEach((card) => {
      if (card.chapter?.trim()) {
        chapterSet.add(card.chapter.trim());
      }
    });

    subjectNotes.forEach((note) => {
      if (note.chapter?.trim()) {
        chapterSet.add(note.chapter.trim());
      }
    });

    return [...chapterSet].sort();
  }, [subjectCards, subjectNotes]);

  const chapterCards = useMemo(() => {
    if (!selectedChapter) return [];

    return subjectCards.filter(
      (card) =>
        (card.chapter?.trim() || "General") === selectedChapter
    );
  }, [subjectCards, selectedChapter]);

  const chapterNotes = useMemo(() => {
    if (!selectedChapter) return [];

    return subjectNotes.filter(
      (note) =>
        (note.chapter?.trim() || "General") === selectedChapter
    );
  }, [subjectNotes, selectedChapter]);

  const chapterMastery = useMemo(() => {
    if (!chapterCards.length) return 0;

    const mastered = chapterCards.filter(
      (card) => card.mastered
    ).length;

    return Math.round(
      (mastered / chapterCards.length) * 100
    );
  }, [chapterCards]);

  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
  };

  const openChapter = (chapter) => {
    setSelectedChapter(chapter);
  };

  const goBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedChapter(null);
  };

  const goBackToChapters = () => {
    setSelectedChapter(null);
  };

  if (loading) {
    return (
      <div className="page learn-page">
        <div className="learn-loading">
          <div className="review-spinner" />
          <p>Loading your subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page learn-page">
        <section className="card learn-error">
          <div className="learn-empty-icon">!</div>
          <p className="eyebrow">LEARN</p>
          <h2>Something went wrong</h2>
          <p>{error}</p>
        </section>
      </div>
    );
  }
  /*
    LEVEL 1 — SUBJECTS
  */
  if (!selectedSubject) {
    return (
      <div className="page learn-page">
        <section className="learn-hero">
          <div>
            <p className="eyebrow">
              MEMORYMESH LEARN · CLASS {user?.class || "—"}
            </p>

            <h1>
              What do you want to learn?
            </h1>

            <p>
              Choose a subject to explore chapters, notes,
              and flashcards.
            </p>
          </div>

          <div className="learn-hero-stat">
            <span>Subjects</span>
            <strong>{subjects.length}</strong>
          </div>
        </section>

        {subjects.length === 0 ? (
          <section className="card learn-empty">
            <div className="learn-empty-icon">📚</div>

            <h2>No subjects yet</h2>

            <p>
              Upload study material to start building your
              learning library.
            </p>

            <Link
              to="/upload"
              className="primary-button"
            >
              Upload Material
            </Link>
          </section>
        ) : (
          <section className="learn-subject-grid">
            {subjects.map((subject) => {
              const cardCount = cards.filter(
                (card) =>
                  card.subject?.trim().toLowerCase() ===
                  subject.toLowerCase()
              ).length;

              const noteCount = notes.filter(
                (note) =>
                  note.subject?.trim().toLowerCase() ===
                  subject.toLowerCase()
              ).length;

              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() =>
                    openSubject(subject)
                  }
                  className="learn-subject-card"
                >
                  <div className="learn-card-icon">
                    {subject
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="learn-card-body">
                    <span className="learn-card-label">
                      SUBJECT
                    </span>

                    <h2>
                      {subject}
                    </h2>

                    <p>
                      {cardCount} flashcard
                      {cardCount === 1 ? "" : "s"}
                      {" · "}
                      {noteCount} note
                      {noteCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <span className="learn-card-arrow">
                    →
                  </span>
                </button>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  /*
    LEVEL 2 — CHAPTERS
  */

  /*
    LEVEL 2 — CHAPTERS
  */
  if (!selectedChapter) {
    return (
      <div className="page learn-page">
        <button
          type="button"
          onClick={goBackToSubjects}
          className="learn-back-button"
        >
          ← All Subjects
        </button>

        <section className="learn-hero">
          <div>
            <p className="eyebrow">
              {selectedSubject.toUpperCase()}
            </p>

            <h1>Choose a chapter</h1>

            <p>
              Select a chapter to study notes and
              practice flashcards.
            </p>
          </div>

          <div className="learn-hero-stat">
            <span>Chapters</span>
            <strong>{chapters.length}</strong>
          </div>
        </section>

        {chapters.length === 0 ? (
          <section className="card learn-empty">
            <div className="learn-empty-icon">📖</div>

            <h2>No chapters yet</h2>

            <p>
              Upload study material for {selectedSubject}
              to create learning content.
            </p>

            <Link to="/upload" className="primary-button">
              Upload Material
            </Link>
          </section>
        ) : (
          <section className="learn-chapter-grid">
            {chapters.map((chapter) => {
              const cardCount = subjectCards.filter(
                (card) =>
                  (card.chapter?.trim() || "General") === chapter
              ).length;

              const noteCount = subjectNotes.filter(
                (note) =>
                  (note.chapter?.trim() || "General") === chapter
              ).length;

              return (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => openChapter(chapter)}
                  className="learn-chapter-card"
                >
                  <div className="chapter-number">
                    {chapters.indexOf(chapter) + 1}
                  </div>

                  <div className="learn-card-body">
                    <span className="learn-card-label">
                      CHAPTER
                    </span>

                    <h2>{chapter}</h2>

                    <p>
                      {cardCount} flashcard
                      {cardCount === 1 ? "" : "s"} ·{" "}
                      {noteCount} note
                      {noteCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <span className="learn-card-arrow">→</span>
                </button>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  /*
    LEVEL 3 — CHAPTER CONTENT
  */
  return (
    <div className="page learn-page">
      <div className="learn-breadcrumbs">
        <button
          type="button"
          onClick={goBackToChapters}
          className="learn-back-button"
        >
          ← Chapters
        </button>

        <button
          type="button"
          onClick={goBackToSubjects}
          className="learn-back-button"
        >
          All Subjects
        </button>
      </div>

      <section className="learn-hero">
        <div>
          <p className="eyebrow">
            {selectedSubject.toUpperCase()}
          </p>

          <h1>{selectedChapter}</h1>

          <p>
            Study the notes, then practice the flashcards.
          </p>
        </div>

        <div className="learn-hero-stat">
          <span>Mastery</span>
          <strong>{chapterMastery}%</strong>
        </div>
      </section>

      <section className="card learn-mastery-card">
        <div className="learn-mastery-top">
          <span>Chapter mastery</span>
          <strong>{chapterMastery}%</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill mastery-fill"
            style={{
              width: `${chapterMastery}%`,
            }}
          />
        </div>

        <p>
          {chapterCards.filter((card) => card.mastered).length} of{" "}
          {chapterCards.length} flashcards mastered.
        </p>
      </section>

      {chapterNotes.length > 0 && (
        <section className="learn-content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STUDY NOTES</p>
              <h2>Read and understand</h2>
            </div>
          </div>

          <div className="learn-content-grid">
            {chapterNotes.map((note) => (
              <article
                key={note._id}
                className="card learn-note-card"
              >
                <span className="learn-card-label">
                  {note.source === "seed"
                    ? "NCERT STUDY NOTE"
                    : "YOUR NOTE"}
                </span>

                <h3>{note.chapter}</h3>

                <p className="learn-note-content">
                  {note.content}
                </p>

                <span className="learn-tags">
                  {note.tags?.length
                    ? note.tags.join(" · ")
                    : "Study note"}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="learn-content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FLASHCARDS</p>
            <h2>Practice this chapter</h2>
          </div>

          {chapterCards.length > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate("/review", {
                  state: {
                    subject: selectedSubject,
                    chapter: selectedChapter,
                  },
                })
              }
              className="primary-button"
            >
              Start Review →
            </button>
          )}
        </div>

        {chapterCards.length === 0 ? (
          <section className="card learn-empty">
            <div className="learn-empty-icon">🧠</div>

            <h3>No flashcards yet</h3>

            <p>
              Upload study material to generate flashcards
              for this chapter.
            </p>

            <Link
              to="/upload"
              className="primary-button"
            >
              Upload Material
            </Link>
          </section>
        ) : (
          <div className="learn-content-grid">
            {chapterCards.map((card) => (
              <article
                key={card._id}
                className="card learn-flashcard"
              >
                <div className="learn-flashcard-top">
                  <span className="learn-card-label">
                    FLASHCARD
                  </span>

                  {card.mastered && (
                    <span className="learn-mastered-badge">
                      ✓ Mastered
                    </span>
                  )}
                </div>

                <h3>{card.question}</h3>

                <div className="learn-answer">
                  {card.answer}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}






