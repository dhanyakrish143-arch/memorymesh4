import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./RapidFire.css";

const QUESTIONS_PER_GAME = 10;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function RapidFire() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);

  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const [started, setStarted] = useState(false);
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
          "Failed to load Rapid Fire cards:",
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

  useEffect(() => {
    if (!started || finished || !startedAt) {
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

  const startGame = () => {
    const selectedCards = shuffle(
      availableCards
    ).slice(
      0,
      QUESTIONS_PER_GAME
    );

    if (selectedCards.length === 0) {
      return;
    }

    const gameQuestions = selectedCards.map(
      (card, questionIndex) => {
        const correctAnswer = card.answer;

        const otherAnswers = shuffle(
          availableCards
            .filter(
              (other) =>
                other._id !== card._id &&
                other.answer &&
                other.answer !== correctAnswer
            )
            .map((other) => other.answer)
        ).slice(0, 3);

        const options = shuffle([
          correctAnswer,
          ...otherAnswers,
        ]).slice(0, 4);

        return {
          id: `${card._id}-${questionIndex}`,
          question: card.question,
          options,
          correctIndex:
            options.indexOf(correctAnswer),
          answer: correctAnswer,
        };
      }
    );

    setQuestions(gameQuestions);
    setIndex(0);

    setSelected(null);
    setAnswered(false);

    setCorrectCount(0);
    setIncorrectCount(0);

    setElapsed(0);
    setResult(null);

    const start = Date.now();

    setStartedAt(start);
    setStarted(true);
    setFinished(false);
  };

  const chooseAnswer = (optionIndex) => {
    if (
      answered ||
      !questions[index]
    ) {
      return;
    }

    setSelected(optionIndex);
    setAnswered(true);

    const currentQuestion =
      questions[index];

    if (
      optionIndex ===
      currentQuestion.correctIndex
    ) {
      setCorrectCount(
        (current) => current + 1
      );
    } else {
      setIncorrectCount(
        (current) => current + 1
      );
    }
  };

  const nextQuestion = () => {
    if (
      index + 1 >= questions.length
    ) {
      const finalTime = startedAt
        ? Math.floor(
            (Date.now() - startedAt) / 1000
          )
        : elapsed;

      setElapsed(finalTime);
      setStarted(false);
      setFinished(true);

      return;
    }

    setIndex(
      (current) => current + 1
    );

    setSelected(null);
    setAnswered(false);
  };

  useEffect(() => {
    if (
      !finished ||
      questions.length === 0 ||
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
              gameType: "rapid-fire",
              subject:
                subject || "General",
              chapter:
                chapter || "General",
              score: correctCount,
              maxScore:
                questions.length,
              timeTaken: elapsed,
            }
          );

        setResult(data);
      } catch (err) {
        console.error(
          "Failed to save Rapid Fire result:",
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
    questions.length,
    correctCount,
    elapsed,
    subject,
    chapter,
    saving,
    result,
  ]);

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  if (loading) {
    return (
      <div className="page rapid-fire-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>
            Preparing Rapid Fire...
          </p>
        </div>
      </div>
    );
  }

  if (!started && !finished) {
    return (
      <div className="page rapid-fire-page">

        <section className="rapid-fire-hero">

          <div>
            <span className="eyebrow">
              MEMORYMESH GAMES
            </span>

            <h1 className="brand">
              Rapid Fire
            </h1>

            <p className="subtitle">
              Answer quickly. Think clearly.
              Build recall speed.
            </p>
          </div>

          <div className="rapid-fire-hero-icon">
            ⚡
          </div>

        </section>

        <section className="card rapid-fire-builder">

          <div className="rapid-fire-heading">

            <span className="eyebrow">
              GAME SETUP
            </span>

            <h2>
              Choose your study material
            </h2>

            <p>
              You will get up to{" "}
              {QUESTIONS_PER_GAME} questions,
              one attempt each.
            </p>

          </div>

          <div className="rapid-fire-select-grid">

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

                {subjects.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
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

                {chapters.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </label>

          </div>

          <div className="rapid-fire-info">

            <strong>
              {Math.min(
                QUESTIONS_PER_GAME,
                availableCards.length
              )}{" "}
              questions available
            </strong>

            <span>
              One attempt per question.
            </span>

          </div>

          <button
            type="button"
            className="primary-button rapid-fire-start"
            disabled={
              availableCards.length < 1
            }
            onClick={startGame}
          >
            Start Rapid Fire →
          </button>

        </section>

      </div>
    );
  }

  if (finished) {
    const percentage =
      questions.length > 0
        ? Math.round(
            (correctCount /
              questions.length) *
              100
          )
        : 0;

    return (
      <div className="page rapid-fire-page">

        <section className="card rapid-fire-result">

          <div className="rapid-fire-result-icon">
            {percentage === 100
              ? "🏆"
              : "⚡"}
          </div>

          <span className="eyebrow">
            RAPID FIRE COMPLETE
          </span>

          <h1>
            {percentage === 100
              ? "Perfect run!"
              : "Nice work!"}
          </h1>

          <p className="subtitle">
            You finished all the questions.
          </p>

          <div className="rapid-fire-score">

            <strong>
              {correctCount}/
              {questions.length}
            </strong>

            <span>
              {percentage}% score
            </span>

          </div>

          <div className="rapid-fire-stats">

            <div>
              <strong>
                {correctCount}
              </strong>

              <span>
                Correct
              </span>
            </div>

            <div>
              <strong>
                {incorrectCount}
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
            <p className="rapid-fire-saving">
              Saving your result...
            </p>
          )}

          {result?.rewards && (
            <div className="rapid-fire-rewards">

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

          <div className="rapid-fire-actions">

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

  const currentQuestion =
    questions[index];

  const progress =
    questions.length > 0
      ? Math.round(
          ((index + 1) /
            questions.length) *
            100
        )
      : 0;

  const isCurrentAnswerCorrect =
    selected !== null &&
    selected ===
      currentQuestion.correctIndex;

  return (
    <div className="page rapid-fire-page">

      <section className="rapid-fire-running-header">

        <div>
          <span className="eyebrow">
            RAPID FIRE
          </span>

          <h1>
            Question {index + 1}
          </h1>

          <p>
            {subject || "All subjects"}
            {chapter
              ? ` · ${chapter}`
              : ""}
          </p>
        </div>

        <div className="rapid-fire-timer">

          <span>
            TIME
          </span>

          <strong>
            {formatTime(elapsed)}
          </strong>

        </div>

      </section>

      <div className="rapid-fire-progress-card">

        <div>
          <span>
            Progress
          </span>

          <strong>
            {index + 1}/
            {questions.length}
          </strong>
        </div>

        <div>
          <span>
            Score
          </span>

          <strong>
            {correctCount}
          </strong>
        </div>

      </div>

      <section className="card rapid-fire-question">

        <span className="rapid-fire-question-label">
          QUESTION {index + 1}
        </span>

        <h2>
          {currentQuestion.question}
        </h2>

        <div className="rapid-fire-options">

          {currentQuestion.options.map(
            (option, optionIndex) => {

              const isSelected =
                selected === optionIndex;

              const isCorrect =
                optionIndex ===
                currentQuestion.correctIndex;

              let className =
                "rapid-fire-option";

              if (
                answered &&
                isCorrect
              ) {
                className +=
                  " correct";
              }

              if (
                answered &&
                isSelected &&
                !isCorrect
              ) {
                className +=
                  " wrong";
              }

              return (
                <button
                  type="button"
                  key={optionIndex}
                  className={className}
                  disabled={answered}
                  onClick={() =>
                    chooseAnswer(
                      optionIndex
                    )
                  }
                >

                  <span className="rapid-fire-letter">
                    {String.fromCharCode(
                      65 + optionIndex
                    )}
                  </span>

                  <span className="rapid-fire-option-text">
                    {option}
                  </span>

                  {answered &&
                    isCorrect && (
                      <span className="rapid-fire-option-result">
                        ✓
                      </span>
                    )}

                  {answered &&
                    isSelected &&
                    !isCorrect && (
                      <span className="rapid-fire-option-result">
                        ✕
                      </span>
                    )}

                </button>
              );
            }
          )}

        </div>

        {answered && (
          <div
            className={
              isCurrentAnswerCorrect
                ? "rapid-fire-feedback correct"
                : "rapid-fire-feedback wrong"
            }
          >

            <strong>
              {isCurrentAnswerCorrect
                ? "Correct!"
                : "Not quite."}
            </strong>

            <p>
              {isCurrentAnswerCorrect
                ? "Great job. You remembered it."
                : `The correct answer is: ${currentQuestion.answer}`}
            </p>

          </div>
        )}

        {answered && (
          <button
            type="button"
            className="primary-button rapid-fire-next"
            onClick={nextQuestion}
          >
            {index + 1 === questions.length
              ? "See Result"
              : "Next Question →"}
          </button>
        )}

      </section>

    </div>
  );
}

