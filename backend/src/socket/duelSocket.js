import jwt from "jsonwebtoken";
import Duel from "../models/Duel.js";
import User from "../models/User.js";

function verifyToken(token) {
  if (!token) {
    throw new Error("Authentication required.");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  return decoded.userId;
}

function getPlayerRole(duel, userId) {
  const id = userId.toString();

  if (duel.challenger.toString() === id) {
    return "challenger";
  }

  if (duel.opponent.toString() === id) {
    return "opponent";
  }

  return null;
}

function publicQuestions(duel) {
  return duel.questions.map(
    (question, index) => ({
      index,
      question: question.question,
      options: question.options,
    })
  );
}

function buildState(duel, currentUserId) {
  const role = getPlayerRole(
    duel,
    currentUserId
  );

  const userResponses =
    duel.responses.filter(
      (response) =>
        response.userId.toString() ===
        currentUserId.toString()
    );

  const answeredIndexes =
    userResponses.map(
      (response) => response.questionIndex
    );

  return {
    duelId: duel._id,
    roomId: duel.roomId,
    status: duel.status,

    questions: publicQuestions(duel),

    currentQuestion:
      duel.currentQuestion || 0,

    challengerScore:
      duel.challengerScore || 0,

    opponentScore:
      duel.opponentScore || 0,

    yourScore:
      role === "challenger"
        ? duel.challengerScore || 0
        : duel.opponentScore || 0,

    opponentScore:
      role === "challenger"
        ? duel.opponentScore || 0
        : duel.challengerScore || 0,

    role,

    answeredIndexes,

    winner:
      duel.winner
        ? duel.winner.toString()
        : null,

    startedAt: duel.startedAt,
    completedAt: duel.completedAt,
  };
}

async function finishDuel(duel) {
  if (duel.status === "completed") {
    return;
  }

  const challengerDone = duel.questions.every(
    (_, index) =>
      duel.responses.some(
        (response) =>
          response.userId.toString() ===
            duel.challenger.toString() &&
          response.questionIndex === index
      )
  );

  const opponentDone = duel.questions.every(
    (_, index) =>
      duel.responses.some(
        (response) =>
          response.userId.toString() ===
            duel.opponent.toString() &&
          response.questionIndex === index
      )
  );

  if (!challengerDone || !opponentDone) {
    return;
  }

  if (
    duel.challengerScore >
    duel.opponentScore
  ) {
    duel.winner = duel.challenger;
  } else if (
    duel.opponentScore >
    duel.challengerScore
  ) {
    duel.winner = duel.opponent;
  } else {
    duel.winner = null;
  }

  duel.status = "completed";
  duel.completedAt = new Date();

  await duel.save();

  const winnerId = duel.winner;

  const users = await User.find({
    _id: {
      $in: [
        duel.challenger,
        duel.opponent,
      ],
    },
  });

  for (const user of users) {
    const isWinner =
      winnerId &&
      user._id.toString() ===
        winnerId.toString();

    const xp = isWinner ? 15 : 5;
    const gems = isWinner ? 5 : 2;

    user.xp = (user.xp || 0) + xp;
    user.weeklyXp =
      (user.weeklyXp || 0) + xp;
    user.gems =
      (user.gems || 0) + gems;
    user.level =
      Math.floor(user.xp / 100) + 1;

    await user.save();
  }
}

export function registerDuelSocket(io) {
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      const userId = verifyToken(token);

      socket.userId = userId;

      next();
    } catch (error) {
      next(
        new Error(
          "Socket authentication failed."
        )
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "[Duel Socket] Connected:",
      socket.id,
      "user:",
      socket.userId
    );

    socket.on(
      "duel:join",
      async ({ duelId }) => {
        try {
          const duel =
            await Duel.findById(duelId);

          if (!duel) {
            socket.emit(
              "duel:error",
              "Duel not found."
            );
            return;
          }

          const role = getPlayerRole(
            duel,
            socket.userId
          );

          if (!role) {
            socket.emit(
              "duel:error",
              "You are not a participant in this duel."
            );
            return;
          }

          socket.join(duel.roomId);

          if (
            duel.status === "active"
          ) {
            socket.emit(
              "duel:state",
              buildState(
                duel,
                socket.userId
              )
            );

            return;
          }

          if (
            duel.status === "pending"
          ) {
            socket.emit(
              "duel:waiting",
              {
                duelId: duel._id,
                roomId: duel.roomId,
              }
            );
          }

          io.to(duel.roomId).emit(
            "duel:presence",
            {
              connected: true,
              role,
            }
          );
        } catch (error) {
          console.error(
            "[Duel Socket] Join error:",
            error
          );

          socket.emit(
            "duel:error",
            "Could not join duel."
          );
        }
      }
    );

    socket.on(
      "duel:answer",
      async ({
        duelId,
        questionIndex,
        selectedOption,
      }) => {
        try {
          const duel =
            await Duel.findById(duelId);

          if (
            !duel ||
            duel.status !== "active"
          ) {
            return;
          }

          const role = getPlayerRole(
            duel,
            socket.userId
          );

          if (!role) {
            return;
          }

          const index = Number(
            questionIndex
          );

          if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >=
              duel.questions.length
          ) {
            return;
          }

          if (
            index !==
            Number(duel.currentQuestion || 0)
          ) {
            return;
          }

          const alreadyAnswered =
            duel.responses.some(
              (response) =>
                response.userId.toString() ===
                  socket.userId.toString() &&
                response.questionIndex ===
                  index
            );

          if (alreadyAnswered) {
            return;
          }

          const question =
            duel.questions[index];

          const correct =
            String(selectedOption)
              .trim() ===
            String(question.answer)
              .trim();

          duel.responses.push({
            userId: socket.userId,
            questionIndex: index,
            selectedOption,
            correct,
          });

          if (correct) {
            if (
              role === "challenger"
            ) {
              duel.challengerScore += 1;
            } else {
              duel.opponentScore += 1;
            }
          }

          await duel.save();

          const currentIndex =
            Number(duel.currentQuestion || 0);

          const challengerAnswered =
            duel.responses.some(
              (response) =>
                response.userId.toString() ===
                  duel.challenger.toString() &&
                response.questionIndex ===
                  currentIndex
            );

          const opponentAnswered =
            duel.responses.some(
              (response) =>
                response.userId.toString() ===
                  duel.opponent.toString() &&
                response.questionIndex ===
                  currentIndex
            );

          if (
            challengerAnswered &&
            opponentAnswered
          ) {
            if (
              currentIndex <
              duel.questions.length - 1
            ) {
              duel.currentQuestion =
                currentIndex + 1;

              await duel.save();
            }
          }

          await finishDuel(duel);

          io.to(duel.roomId).emit(
            "duel:update",
            {
              duelId: duel._id,
              status: duel.status,

              challengerScore:
                duel.challengerScore,

              opponentScore:
                duel.opponentScore,

              winner:
                duel.winner
                  ? duel.winner.toString()
                  : null,

              answeredBy: {
                userId:
                  socket.userId.toString(),
                questionIndex: index,
                correct,
              },
            }
          );

          const freshDuel =
            await Duel.findById(
              duel._id
            );

          if (freshDuel) {
            const roomSockets =
              await io.in(
                duel.roomId
              ).fetchSockets();

            for (
              const roomSocket
              of roomSockets
            ) {
              roomSocket.emit(
                "duel:state",
                buildState(
                  freshDuel,
                  roomSocket.userId
                )
              );
            }
          }
        } catch (error) {
          console.error(
            "[Duel Socket] Answer error:",
            error
          );

          socket.emit(
            "duel:error",
            "Could not submit answer."
          );
        }
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "[Duel Socket] Disconnected:",
          socket.id
        );
      }
    );
  });
}




