import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const PAIRS_PER_GAME = 6;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function WordMatch() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  const [gamePairs, setGamePairs] = useState([]);
  const [terms, setTerms] = useState([]);
  const [definitions, setDefinitions] = useState([]);

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDefinition, setSelectedDefinition] = useState(null);

  const [matched, setMatched] = useState([]);
  const [wrongMatches, setWrongMatches] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const [mistakes, setMistakes] = useState(0);

  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);

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
          "Failed to load game cards:",
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
    if (!subject) return [];

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

  const availableCards = useMemo(() => {
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const resetSelections = () => {
    setSelectedTerm(null);
    setSelectedDefinition(null);
  };

  useEffect(() => {
    if (
      !gameStarted ||
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
    gameStarted,
    finished,
    startedAt,
  ]);

  const startGame = () => {
    const selectedCards = shuffle(
      availableCards
    ).slice(0, PAIRS_PER_GAME);

    if (selectedCards.length < 2) {
      return;
    }

    const pairs = selectedCards.map(
      (card, index) => ({
        id: String(index),
        term: card.question,
        definition: card.answer,
      })
    );

    setGamePairs(pairs);
    setTerms(shuffle(pairs));
    setDefinitions(shuffle(pairs));

    setSelectedTerm(null);
    setSelectedDefinition(null);

    setMatched([]);
    setWrongMatches([]);
    setAttempted([]);
    setMistakes(0);

    setElapsed(0);
    setResult(null);

    const start = Date.now();

    setStartedAt(start);
    setGameStarted(true);
    setFinished(false);
  };

  /*
    Every question gets exactly ONE attempt.

    Correct:
      - question becomes green
      - answer becomes green
      - pair is added to matched

    Wrong:
      - question becomes red
      - selected wrong answer becomes red
      - question is permanently locked
      - wrong answer is permanently locked
      - no retry
  */
  useEffect(() => {
    if (
      selectedTerm === null ||
      selectedDefinition === null
    ) {
      return;
    }

    const questionId = selectedTerm.id;
    const answerId = selectedDefinition.id;

    if (
      attempted.includes(questionId)
    ) {
      resetSelections();
      return;
    }

    setAttempted((current) => [
      ...current,
      questionId,
    ]);

    if (questionId === answerId) {
      setMatched((current) => [
        ...current,
        questionId,
      ]);

      resetSelections();

      return;
    }

    setMistakes((current) => current + 1);

    setWrongMatches((current) => [
      ...current,
      {
        questionId,
        answerId,
      },
    ]);

    resetSelections();
  }, [
    selectedTerm,
    selectedDefinition,
  ]);

  /*
    Finish immediately after all questions
    have received their one attempt.
  */
  useEffect(() => {
    if (
      !gameStarted ||
      finished ||
      gamePairs.length === 0
    ) {
      return;
    }

    if (
      attempted.length !== gamePairs.length
    ) {
      return;
    }

    const finalTime = startedAt
      ? Math.floor(
          (Date.now() - startedAt) / 1000
        )
      : elapsed;

    setElapsed(finalTime);

    const finishTimer = setTimeout(() => {
      setGameStarted(false);
      setFinished(true);
    }, 500);

    return () => clearTimeout(finishTimer);
  }, [
    attempted.length,
    gamePairs.length,
    gameStarted,
    finished,
    startedAt,
    elapsed,
  ]);

  /*
    Save score after completion.

    Score = successful matches only.
    Mistakes never subtract from the correct matches.
  */
  useEffect(() => {
    if (
      !finished ||
      gamePairs.length === 0 ||
      saving ||
      result
    ) {
      return;
    }

    const saveScore = async () => {
      setSaving(true);

      const score = matched.length;

      try {
        const { data } = await client.post(
          "/games/score",
          {
            gameType: "word-match",
            subject: subject || "General",
            chapter: chapter || "General",
            score,
            maxScore: gamePairs.length,
            timeTaken: elapsed,
          }
        );

        setResult(data);
      } catch (err) {
        console.error(
          "Failed to save Word Match result:",
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

    saveScore();
  }, [
    finished,
    gamePairs.length,
    matched.length,
    elapsed,
    subject,
    chapter,
    saving,
    result,
  ]);

  if (loading) {
    return (
      <div className="page word-match-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>
            Preparing Word Match...
          </p>
        </div>
      </div>
    );
  }

  /*
    SETUP
  */
  if (
    !gameStarted &&
    !finished
  ) {
    return (
      <div className="page word-match-page">

        <section className="word-match-hero">
          <div>
            <span className="eyebrow">
              MEMORYMESH GAMES
            </span>

            <h1 className="brand">
              Word Match
            </h1>

            <p className="subtitle">
              Match each study question with
              its correct answer.
            </p>
          </div>

          <div className="word-match-hero-icon">
            🧩
          </div>
        </section>

        <section className="card word-match-builder">

          <div className="word-match-builder-heading">
            <span className="eyebrow">
              GAME SETUP
            </span>

            <h2>
              Choose your study material
            </h2>

            <p>
              Each question gets one attempt.
            </p>
          </div>

          <div className="word-match-select-grid">

            <label>
              <span>
                Subject
              </span>

              <select
                value={subject}
                onChange={(e) => {
                  setSubject(
                    e.target.value
                  );
                  setChapter("");
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
                onChange={(e) =>
                  setChapter(
                    e.target.value
                  )
                }
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

          <div className="word-match-info">
            <strong>
              {Math.min(
                PAIRS_PER_GAME,
                availableCards.length
              )}{" "}
              pairs available
            </strong>

            <span>
              Wrong matches turn red and cannot
              be retried.
            </span>
          </div>

          <button
            type="button"
            className="primary-button word-match-start"
            disabled={
              availableCards.length < 2
            }
            onClick={startGame}
          >
            Start Word Match →
          </button>

        </section>

      </div>
    );
  }

  /*
    RESULT
  */
  if (finished) {
    const score = matched.length;

    const percentage =
      gamePairs.length > 0
        ? Math.round(
            (score /
              gamePairs.length) *
              100
          )
        : 0;

    return (
      <div className="page word-match-page">

        <section className="card word-match-result">

          <div className="word-match-result-icon">
            {percentage === 100
              ? "🏆"
              : "🧩"}
          </div>

          <span className="eyebrow">
            WORD MATCH COMPLETE
          </span>

          <h1>
            {percentage === 100
              ? "Perfect match!"
              : "Nice work!"}
          </h1>

          <p className="subtitle">
            You completed all the pairs.
          </p>

          <div className="word-match-result-score">
            <strong>
              {score}/{gamePairs.length}
            </strong>

            <span>
              {percentage}% score
            </span>
          </div>

          <div className="word-match-result-stats">

            <div>
              <strong>
                {mistakes}
              </strong>

              <span>
                Mistakes
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
            <p className="word-match-saving">
              Saving your result...
            </p>
          )}

          {result?.rewards && (
            <div className="word-match-rewards">

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

          <div className="word-match-result-actions">

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
                navigate("/activity")
              }
            >
              View Activity
            </button>

          </div>

        </section>

      </div>
    );
  }

  /*
    ACTIVE GAME
  */
  return (
    <div className="page word-match-page">

      <section className="word-match-running-header">

        <div>
          <span className="eyebrow">
            WORD MATCH
          </span>

          <h1>
            Match the pairs
          </h1>

          <p>
            {subject || "All subjects"}
            {chapter
              ? ` · ${chapter}`
              : ""}
          </p>
        </div>

        <div className="word-match-timer">
          <span>
            TIME
          </span>

          <strong>
            {formatTime(elapsed)}
          </strong>
        </div>

      </section>

      <div className="word-match-progress">

        <div>
          <span>
            Matched
          </span>

          <strong>
            {matched.length}/
            {gamePairs.length}
          </strong>
        </div>

        <div>
          <span>
            Attempts
          </span>

          <strong>
            {attempted.length}/
            {gamePairs.length}
          </strong>
        </div>

        <div>
          <span>
            Mistakes
          </span>

          <strong>
            {mistakes}
          </strong>
        </div>

      </div>

      <section className="word-match-board">

        <div className="word-match-column">

          <span className="word-match-column-label">
            QUESTIONS
          </span>

          {terms.map((pair) => {

            const isMatched =
              matched.includes(pair.id);

            const isWrong =
              wrongMatches.some(
                (item) =>
                  item.questionId ===
                  pair.id
              );

            const isAttempted =
              attempted.includes(pair.id);

            const isSelected =
              selectedTerm?.id === pair.id;

            return (
              <button
                type="button"
                key={pair.id}
                className={`word-match-tile ${
                  isMatched
                    ? "matched"
                    : ""
                } ${
                  isWrong
                    ? "wrong"
                    : ""
                } ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                disabled={
                  isAttempted ||
                  isWrong
                }
                onClick={() => {
                  if (
                    !isAttempted &&
                    !isWrong
                  ) {
                    setSelectedTerm(pair);
                  }
                }}
              >
                {pair.term}
              </button>
            );
          })}

        </div>

        <div className="word-match-column">

          <span className="word-match-column-label">
            ANSWERS
          </span>

          {definitions.map((pair) => {

            const isMatched =
              matched.includes(pair.id);

            const isWrong =
              wrongMatches.some(
                (item) =>
                  item.answerId ===
                  pair.id
              );

            const isUsed =
              matched.includes(pair.id) ||
              wrongMatches.some(
                (item) =>
                  item.answerId ===
                  pair.id
              );

            const isSelected =
              selectedDefinition?.id ===
              pair.id;

            return (
              <button
                type="button"
                key={pair.id}
                className={`word-match-tile ${
                  isMatched
                    ? "matched"
                    : ""
                } ${
                  isWrong
                    ? "wrong"
                    : ""
                } ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                disabled={isUsed}
                onClick={() => {
                  if (!isUsed) {
                    setSelectedDefinition(
                      pair
                    );
                  }
                }}
              >
                {pair.definition}
              </button>
            );
          })}

        </div>

      </section>

    </div>
  );
}
