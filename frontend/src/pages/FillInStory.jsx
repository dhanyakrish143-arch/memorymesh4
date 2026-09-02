import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./FillInStory.css";

const QUESTIONS_PER_GAME = 10;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}'"`]/g, "")
    .replace(/\s+/g, " ");
}



const CONCEPT_GROUPS = [
  ["write", "wrote", "writes", "written", "letter", "note", "message"],
  ["ask", "asks", "asked", "asking", "request", "requested", "requesting"],
  ["god", "gods"],
  ["money", "cash", "payment", "funds"],
  ["help", "support", "assistance", "aid"],
  ["crop", "crops", "corn", "cornfield", "harvest", "farm", "field"],
  ["loss", "lost", "losing", "ruined", "ruin", "destroyed", "destruction", "damage", "damaged"],
  ["storm", "hail", "hailstorm", "disaster", "weather"],
  ["family", "families", "children", "household"],
  ["hungry", "hunger", "starvation", "starving", "food"],
  ["recover", "recovery", "replace", "replacement", "restore", "restoration"],
  ["make", "makes", "made", "prepare", "prepares", "prepared"],
  ["light", "ray", "rays", "reflection", "reflect"],
  ["plant", "plants", "green", "photosynthesis", "food"],
];

function stemWord(word) {
  let value = word.toLowerCase();

  value = value
    .replace(/ies$/, "y")
    .replace(/ing$/, "")
    .replace(/ed$/, "")
    .replace(/es$/, "")
    .replace(/s$/, "");

  return value;
}

function getConcepts(text) {
  const normalized = normalizeAnswer(text);

  const words = normalized
    .split(" ")
    .map(stemWord)
    .filter((word) => word.length >= 3);

  const concepts = new Set(words);

  for (const group of CONCEPT_GROUPS) {
    const normalizedGroup = group.map(stemWord);

    const found = words.some((word) =>
      normalizedGroup.includes(word)
    );

    if (found) {
      concepts.add(`group:${normalizedGroup[0]}`);
    }
  }

  return concepts;
}

function checkAnswer(userAnswer, correctAnswer) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (!user || !correct) {
    return false;
  }

  // Exact answer.
  if (user === correct) {
    return true;
  }

  // One complete answer contains the other.
  if (
    user.length >= 20 &&
    correct.length >= 20 &&
    (user.includes(correct) ||
      correct.includes(user))
  ) {
    return true;
  }

  const userConcepts = getConcepts(userAnswer);
  const correctConcepts = getConcepts(correctAnswer);

  let conceptMatches = 0;

  for (const concept of userConcepts) {
    if (correctConcepts.has(concept)) {
      conceptMatches += 1;
    }
  }

  /*
    Accept answers that contain at least two important
    concepts from the stored answer.

    Example:
    "Lencho wrote a letter to God because a destructive
     hailstorm ruined his cornfield..."

    vs.

    "He writes to God asking for money to recover from
     the loss of his crop."

    Shared concepts:
      God
      writing/request
      crop/loss
  */
  if (conceptMatches >= 2) {
    return true;
  }

  /*
    Also allow strong literal overlap for answers where
    the wording is naturally very similar.
  */
  const stopWords = new Set([
    "the",
    "and",
    "or",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "that",
    "this",
    "from",
    "by",
    "as",
  ]);

  const userWords = new Set(
    user
      .split(" ")
      .map(stemWord)
      .filter(
        (word) =>
          word.length >= 3 &&
          !stopWords.has(word)
      )
  );

  const correctWords = new Set(
    correct
      .split(" ")
      .map(stemWord)
      .filter(
        (word) =>
          word.length >= 3 &&
          !stopWords.has(word)
      )
  );

  let matches = 0;

  for (const word of userWords) {
    if (correctWords.has(word)) {
      matches += 1;
    }
  }

  return (
    matches >= 3 &&
    matches / Math.max(userWords.size, 1) >= 0.25 &&
    matches / Math.max(correctWords.size, 1) >= 0.20
  );
}
export default function FillInStory() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);

  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentCorrect, setCurrentCorrect] = useState(false);

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
          "Failed to load Fill in the Story cards:",
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
    startedAt
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

    setQuestions(
      selectedCards.map(
        (card, questionIndex) => ({
          id: `${card._id}-${questionIndex}`,
          question: card.question,
          answer: card.answer
        })
      )
    );

    setIndex(0);

    setAnswer("");
    setSubmitted(false);
    setCurrentCorrect(false);

    setCorrectCount(0);
    setIncorrectCount(0);

    setElapsed(0);
    setResult(null);

    const start = Date.now();

    setStartedAt(start);
    setStarted(true);
    setFinished(false);
  };

  const submitAnswer = () => {
    if (
      submitted ||
      !questions[index]
    ) {
      return;
    }

    const correct = checkAnswer(
      answer,
      questions[index].answer
    );

    setCurrentCorrect(correct);
    setSubmitted(true);

    if (correct) {
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

    setAnswer("");
    setSubmitted(false);
    setCurrentCorrect(false);
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
              gameType: "fill-in-story",
              subject:
                subject || "General",
              chapter:
                chapter || "General",
              score: correctCount,
              maxScore:
                questions.length,
              timeTaken: elapsed
            }
          );

        setResult(data);
      } catch (err) {
        console.error(
          "Failed to save Fill in the Story result:",
          err
        );

        setResult({
          rewards: {
            xp: 0,
            gems: 0
          }
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
    result
  ]);

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

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
      <div className="page fill-story-page">
        <div className="progress-loading">
          <div className="loader" />
          <p>
            Preparing Fill in the Story...
          </p>
        </div>
      </div>
    );
  }

  if (
    !started &&
    !finished
  ) {
    return (
      <div className="page fill-story-page">

        <section className="fill-story-hero">

          <div>
            <span className="eyebrow">
              MEMORYMESH GAMES
            </span>

            <h1 className="brand">
              Fill in the Story
            </h1>

            <p className="subtitle">
              Recall the answer and type it
              from memory.
            </p>
          </div>

          <div className="fill-story-hero-icon">
            ✍️
          </div>

        </section>

        <section className="fill-story-builder card">

          <div className="fill-story-heading">

            <span className="eyebrow">
              GAME SETUP
            </span>

            <h2>
              Choose your study material
            </h2>

            <p>
              Up to {QUESTIONS_PER_GAME}
              {" "}questions with one attempt each.
            </p>

          </div>

          <div className="fill-story-select-grid">

            <label>
              <span>
                Subject
              </span>

              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
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

          <div className="fill-story-info">

            <strong>
              {Math.min(
                QUESTIONS_PER_GAME,
                availableCards.length
              )}{" "}
              questions available
            </strong>

            <span>
              Wrong answers are shown in red
              and cannot be retried.
            </span>

          </div>

          <button
            type="button"
            className="primary-button fill-story-start"
            disabled={
              availableCards.length === 0
            }
            onClick={startGame}
          >
            Start Fill in the Story →
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
      <div className="page fill-story-page">

        <section className="fill-story-result card">

          <div className="fill-story-result-icon">
            {percentage === 100
              ? "🏆"
              : "✍️"}
          </div>

          <span className="eyebrow">
            FILL IN THE STORY COMPLETE
          </span>

          <h1>
            {percentage === 100
              ? "Perfect recall!"
              : "Nice work!"}
          </h1>

          <p className="subtitle">
            You completed all the questions.
          </p>

          <div className="fill-story-score">

            <strong>
              {correctCount}/
              {questions.length}
            </strong>

            <span>
              {percentage}% score
            </span>

          </div>

          <div className="fill-story-stats">

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
            <p className="fill-story-saving">
              Saving your result...
            </p>
          )}

          {result?.rewards && (
            <div className="fill-story-rewards">

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

          <div className="fill-story-actions">

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

  return (
    <div className="page fill-story-page">

      <section className="fill-story-running-header">

        <div>
          <span className="eyebrow">
            FILL IN THE STORY
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

        <div className="fill-story-timer">
          <span>
            TIME
          </span>

          <strong>
            {formatTime(elapsed)}
          </strong>
        </div>

      </section>

      <div className="fill-story-progress">

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

      <section className="fill-story-question card">

        <span className="fill-story-question-label">
          RECALL
        </span>

        <h2>
          {currentQuestion.question}
        </h2>

        <textarea
          value={answer}
          onChange={(e) =>
            setAnswer(e.target.value)
          }
          disabled={submitted}
          placeholder="Type your answer here..."
          rows={4}
        />

        {!submitted && (
          <button
            type="button"
            className="primary-button fill-story-submit"
            disabled={!answer.trim()}
            onClick={submitAnswer}
          >
            Check Answer →
          </button>
        )}

        {submitted && (
          <div
            className={
              currentCorrect
                ? "fill-story-feedback correct"
                : "fill-story-feedback wrong"
            }
          >

            <strong>
              {currentCorrect
                ? "Correct! ✓"
                : "Not quite. ✕"}
            </strong>

            <p>
              {currentCorrect
                ? "Excellent recall."
                : `Correct answer: ${currentQuestion.answer}`}
            </p>

          </div>
        )}

        {submitted && (
          <button
            type="button"
            className="primary-button fill-story-next"
            onClick={nextQuestion}
          >
            {index + 1 === questions.length
              ? "See Result"
              : "Next Question →"}
          </button>
        )}

        <div className="fill-story-progress-bar">
          <div
            style={{
              width: `${progress}%`
            }}
          />
        </div>

      </section>

    </div>
  );
}



