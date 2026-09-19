import "dotenv/config";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import cardRoutes from "./routes/cards.js";
import reviewRoutes from "./routes/review.js";
import uploadRoutes from "./routes/upload.js";
import progressRoutes from "./routes/progress.js";
import notesRoutes from "./routes/notes.js";
import assistantRoutes from "./routes/assistant.js";
import studyPlanRoutes from "./routes/studyPlan.js";
import gamesRoutes from "./routes/games.js";
import quizRoutes from "./routes/quiz.js";
import goalRoutes from "./routes/goal.js";
import leagueRoutes from "./routes/league.js";
import socialRoutes from "./routes/social.js";
import textbookRoutes from "./routes/textbooks.js";
import duelRoutes from "./routes/duel.js";
import { startLeagueCron } from "./cron/league.js";
import { registerDuelSocket } from "./socket/duelSocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXTBOOK_ROOT = path.resolve(
  __dirname,
  "../../textbooks"
);

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

/*
  Serve local NCERT textbook PDFs.

  Example:
  http://localhost:5000/textbooks/Class-10/Science/English/Science.pdf
*/
app.use(
  "/textbooks",
  express.static(TEXTBOOK_ROOT, {
    fallthrough: false,
    index: false,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/league", leagueRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/textbooks", textbookRoutes);
app.use("/api/duel", duelRoutes);

/*
  Socket.io connection test.
*/
registerDuelSocket(io);

/* Basic Socket.io connection logging */
io.on("connection", (socket) => {
  console.log(
    "[Socket.io] Client connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "[Socket.io] Client disconnected:",
      socket.id
    );
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(
      process.env.PORT,
      () => {
        console.log(
          "Server on port " +
            process.env.PORT
        );

        startLeagueCron();
      }
    );
  })
  .catch((err) => {
    console.error(
      "MongoDB connection failed:",
      err
    );

    process.exit(1);
  });
