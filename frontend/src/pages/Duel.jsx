import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import client from "../api/client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SOCKET_URL =
  API_URL.replace(/\/api\/?$/, "");

export default function Duel() {
  const [searchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const opponentId =
    searchParams.get("opponent");

  const duelId =
    searchParams.get("duel");

  const [duel, setDuel] =
    useState(null);

  const [gameState, setGameState] =
    useState(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selected, setSelected] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [opponentConnected, setOpponentConnected] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const creatingChallengeRef =
    useRef(false);

  const socketRef = useRef(null);

  useEffect(() => {
    let socket;

    const start = async () => {
      try {
        setLoading(true);
        setError("");

        let currentDuel = null;

        if (duelId) {
          const { data } =
            await client.get(
              `/duel/${duelId}`
            );

          currentDuel =
            data?.duel || null;
        } else if (opponentId) {
          if (creatingChallengeRef.current) {
            return;
          }

          creatingChallengeRef.current = true;
          setCreating(true);

          const { data } =
            await client.post(
              `/duel/challenge/${opponentId}`
            );

          currentDuel =
            data?.duel || null;

          if (!currentDuel?.id) {
            throw new Error(
              "Duel could not be created."
            );
          }

          navigate(
            `/duel?duel=${currentDuel.id}`,
            { replace: true }
          );

          return;
        }

        if (!currentDuel) {
          throw new Error(
            "Duel not found."
          );
        }

        setDuel(currentDuel);

        const token =
          localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        socket = io(
          SOCKET_URL,
          {
            auth: {
              token,
            },
          }
        );

        socketRef.current =
          socket;

        socket.on("connect", () => {
          setSocketConnected(true);

          socket.emit(
            "duel:join",
            {
              duelId:
                currentDuel._id ||
                currentDuel.id,
            }
          );
        });

        socket.on(
          "disconnect",
          () => {
            setSocketConnected(false);
          }
        );

        socket.on(
          "duel:state",
          (state) => {
            setGameState(state);

            setOpponentConnected(true);

            if (
              state.status ===
              "completed"
            ) {
              setCompleted(true);
            }
          }
        );

        socket.on(
          "duel:presence",
          () => {
            setOpponentConnected(true);
          }
        );

        socket.on(
          "duel:update",
          (update) => {
            setGameState(
              (current) => ({
                ...(current || {}),
                ...update,
              })
            );

            if (
              update.status ===
              "completed"
            ) {
              setCompleted(true);
            }
          }
        );

        socket.on(
          "duel:error",
          (message) => {
            setError(message);
          }
        );

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.error(
          "Duel setup failed:",
          err
        );

        setError(
          err.response?.data?.error ||
          err.message ||
          "Failed to open duel."
        );
      } finally {
        creatingChallengeRef.current = false;
        setCreating(false);
        setLoading(false);
      }
    };

    start();
  }, [
    duelId,
    opponentId,
    navigate,
  ]);

  useEffect(() => {
    if (
      Number.isInteger(
        Number(gameState?.currentQuestion)
      )
    ) {
      setCurrentQuestion(
        Number(gameState.currentQuestion)
      );
      setSelected(null);
    }
  }, [gameState?.currentQuestion]);

  const questions =
    gameState?.questions ||
    [];

  const question =
    questions[currentQuestion];

  const answeredIndexes =
    gameState?.answeredIndexes ||
    [];

  const isAnswered =
    answeredIndexes.includes(
      currentQuestion
    );

  const answerQuestion = (
    option
  ) => {
    if (
      !socketRef?.current ||
      selected !== null ||
      isAnswered ||
      !question
    ) {
      return;
    }

    setSelected(option);

    socketRef.current.emit(
      "duel:answer",
      {
        duelId:
          duelId ||
          duel?._id ||
          duel?.id,

        questionIndex:
          currentQuestion,

        selectedOption: option,
      }
    );
  };

  const resultText = useMemo(() => {
    if (!gameState) {
      return "";
    }

    if (
      !gameState.winner
    ) {
      return "It's a draw!";
    }

    const winnerIsYou =
      gameState.role ===
        "challenger"
        ? gameState.winner ===
          duel?.challenger?.toString()
        : gameState.winner ===
          duel?.opponent?.toString();

    return winnerIsYou
      ? "You won! 🎉"
      : "Your friend won.";
  }, [
    gameState,
    duel,
  ]);

  if (loading || creating) {
    return (
      <div className="page duel-page">
        <section className="duel-loading">
          <div className="duel-icon">
            ⚔️
          </div>

          <span className="eyebrow">
            MEMORYMESH DUEL
          </span>

          <h1>
            {creating
              ? "Sending challenge..."
              : "Preparing duel..."}
          </h1>

          <p>
            Connecting your match.
          </p>

          <div className="duel-spinner" />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page duel-page">
        <section className="duel-error">
          <div className="duel-error-icon">
            !
          </div>

          <span className="eyebrow">
            MEMORYMESH DUEL
          </span>

          <h1>
            Duel unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/friends")
            }
          >
            Back to Friends
          </button>
        </section>
      </div>
    );
  }

  if (
    duel?.status ===
      "pending" &&
    !gameState
  ) {
    return (
      <div className="page duel-page">
        <section className="duel-hero">
          <div>
            <span className="eyebrow">
              MEMORYMESH DUEL
            </span>

            <h1>
              Challenge sent ⚔️
            </h1>

            <p>
              Waiting for your friend
              to accept.
            </p>
          </div>
        </section>

        <section className="card duel-lobby-card">

          <div className="duel-status-pill">
            WAITING FOR OPPONENT
          </div>

          <div className="duel-versus">
            <div className="duel-player">
              <div className="duel-avatar">
                YOU
              </div>

              <strong>
                You
              </strong>
            </div>

            <div className="duel-vs">
              VS
            </div>

            <div className="duel-player">
              <div className="duel-avatar duel-avatar-opponent">
                ?
              </div>

              <strong>
                Opponent
              </strong>
            </div>
          </div>

          <div className="duel-waiting-message">
            <span>⏳</span>

            <div>
              <strong>
                Waiting for your friend
              </strong>

              <p>
                The live match will begin
                after acceptance.
              </p>
            </div>
          </div>

          <div className="duel-connection-status">
            {socketConnected
              ? "● Live connection active"
              : "○ Connecting..."}
          </div>

          <button
            type="button"
            className="duel-back-button"
            onClick={() =>
              navigate("/friends")
            }
          >
            ← Back to Friends
          </button>

        </section>
      </div>
    );
  }

  if (
    gameState?.status ===
      "completed" ||
    completed
  ) {
    return (
      <div className="page duel-page">
        <section className="duel-result-card">

          <div className="duel-result-icon">
            🏆
          </div>

          <span className="eyebrow">
            DUEL COMPLETE
          </span>

          <h1>
            {resultText}
          </h1>

          <p>
            Final score
          </p>

          <div className="duel-final-score">
            <div>
              <strong>
                {gameState?.yourScore ||
                  0}
              </strong>
              <span>
                You
              </span>
            </div>

            <div className="duel-final-vs">
              -
            </div>

            <div>
              <strong>
                {gameState?.opponentScore ||
                  0}
              </strong>
              <span>
                Opponent
              </span>
            </div>
          </div>

          <div className="duel-reward-row">
            <span>
              🎉 Winner: +15 XP · +5 💎
            </span>

            <span>
              ⚡ Participation: +5 XP · +2 💎
            </span>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/friends")
            }
          >
            Back to Friends
          </button>

        </section>
      </div>
    );
  }

  if (
    questions.length === 0
  ) {
    return (
      <div className="page duel-page">
        <section className="duel-error">
          <h1>
            No questions available
          </h1>

          <p>
            This duel does not have enough
            study questions.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/friends")
            }
          >
            Back to Friends
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page duel-page">

      <section className="duel-game-header">

        <div>
          <span className="eyebrow">
            LIVE DUEL
          </span>

          <h1>
            Question{" "}
            {currentQuestion + 1}
            {" "}
            of{" "}
            {questions.length}
          </h1>
        </div>

        <div className="duel-live-pill">
          {socketConnected
            ? "● LIVE"
            : "○ CONNECTING"}
        </div>

      </section>

      <section className="duel-scoreboard">

        <div className="duel-score-you">
          <span>
            YOU
          </span>

          <strong>
            {gameState?.yourScore ||
              0}
          </strong>
        </div>

        <div className="duel-score-middle">
          VS
        </div>

        <div className="duel-score-opponent">
          <span>
            OPPONENT
          </span>

          <strong>
            {gameState?.opponentScore ||
              0}
          </strong>
        </div>

      </section>

      <section className="card duel-question-card">

        <span className="eyebrow">
          QUESTION {currentQuestion + 1}
        </span>

        <h2>
          {question?.question}
        </h2>

        <div className="duel-options">

          {(
            question?.options ||
            []
          ).map((option) => {

            const active =
              selected === option;

            return (
              <button
                type="button"
                key={option}
                className={`duel-option ${
                  active
                    ? "duel-option-selected"
                    : ""
                }`}
                disabled={
                  selected !== null ||
                  isAnswered
                }
                onClick={() =>
                  answerQuestion(
                    option
                  )
                }
              >
                {option}
              </button>
            );
          })}

        </div>

        {selected !== null && (
          <>
            <div className="duel-answer-status">
              Answer submitted ✓
            </div>

            {currentQuestion === questions.length - 1 && (
              <div className="duel-waiting-final">
                <strong>Final answer submitted</strong>
                <span>
                  Waiting for your opponent to finish the duel...
                </span>
              </div>
            )}
          </>
        )}

        <div className="duel-question-navigation">

          <span>
            {!opponentConnected
              ? "Waiting for opponent..."
              : selected !== null
                ? currentQuestion <
                  questions.length - 1
                  ? "Answer submitted · Waiting for opponent..."
                  : "Final answer submitted · Waiting for opponent..."
                : "Choose your answer"}
          </span>

        </div>

      </section>

      <p className="duel-footer-hint">
        Both players answer the same five
        study questions. Scores update live.
      </p>

    </div>
  );
}







