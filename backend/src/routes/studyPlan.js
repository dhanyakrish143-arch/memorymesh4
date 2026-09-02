import express from "express";
import requireAuth from "../middleware/auth.js";
import Card from "../models/Card.js";
import Note from "../models/Note.js";
import User from "../models/User.js";
import { generateStudyPlan } from "../ai/studyPlanner.js";

const router = express.Router();

router.use(requireAuth);

router.post("/generate", async (req, res) => {
  try {
    const {
      subject,
      chapter,
      minutesPerDay,
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        error: "Subject is required.",
      });
    }

    const minutes = Number(minutesPerDay);

    if (
      !Number.isFinite(minutes) ||
      minutes < 10 ||
      minutes > 180
    ) {
      return res.status(400).json({
        error: "Study time must be between 10 and 180 minutes.",
      });
    }

    const cardQuery = {
      userId: req.userId,
      subject: subject.trim(),
    };

    const noteQuery = {
      userId: req.userId,
      subject: subject.trim(),
    };

    if (chapter && chapter.trim()) {
      cardQuery.chapter = chapter.trim();
      noteQuery.chapter = chapter.trim();
    }

    const [cards, notes, user] = await Promise.all([
      Card.find(cardQuery)
        .select(
          "question answer p_l reviewCount correctCount chapter"
        )
        .lean(),

      Note.find(noteQuery)
        .select("chapter content tags source")
        .lean(),

      User.findById(req.userId)
        .select("quizHistory")
        .lean(),
    ]);

    const quizHistory = (user?.quizHistory || []).filter(
      (quiz) => {
        if (
          quiz.subject &&
          quiz.subject.toLowerCase() !==
            subject.trim().toLowerCase()
        ) {
          return false;
        }

        if (
          chapter &&
          quiz.chapter &&
          quiz.chapter.toLowerCase() !==
            chapter.trim().toLowerCase()
        ) {
          return false;
        }

        return true;
      }
    );

    const plan = await generateStudyPlan({
      subject: subject.trim(),
      chapter: chapter?.trim() || "",
      minutesPerDay: minutes,
      cards,
      notes,
      quizHistory,
    });

    res.json({
      success: true,
      plan,
    });
  } catch (err) {
    console.error(
      "Study Plan generation error:",
      err
    );

    res.status(500).json({
      error:
        err.message ||
        "Failed to generate study plan.",
    });
  }
});

export default router;
