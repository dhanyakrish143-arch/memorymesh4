import express from "express";
import requireAuth from "../middleware/auth.js";
import Note from "../models/Note.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import { askStudyAssistant } from "../ai/studyAssistant.js";
import { generateStudyPlan } from "../ai/studyPlanner.js";

const router = express.Router();

router.use(requireAuth);

/*
  TUTORAGENT CHAT
*/
router.post("/ask", async (req, res) => {
  try {
    const {
      question,
      subject,
      chapter,
      history,
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question.",
      });
    }

    const noteQuery = {
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    };

    const cardQuery = {
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    };

    if (subject) {
      noteQuery.subject = subject;
      cardQuery.subject = subject;
    }

    if (chapter) {
      noteQuery.chapter = chapter;
      cardQuery.chapter = chapter;
    }

    const [notes, cards] = await Promise.all([
      Note.find(noteQuery)
        .select("subject chapter content tags source")
        .limit(30)
        .lean(),

      Card.find(cardQuery)
        .select("subject chapter question answer p_l reviewCount correctCount")
        .limit(50)
        .lean(),
    ]);

    const answer = await askStudyAssistant({
      question,
      subject,
      chapter,
      notes,
      cards,
      history,
    });

    res.json({
      success: true,
      answer,
      subject: subject || "General",
      chapter: chapter || "General",
    });
  } catch (err) {
    console.error(
      "TutorAgent error:",
      err
    );

    res.status(500).json({
      error:
        err.message ||
        "TutorAgent failed. Please try again.",
    });
  }
});

/*
  TUTORAGENT STUDY PLAN
*/
router.post("/plan", async (req, res) => {
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
        error:
          "Study time must be between 10 and 180 minutes.",
      });
    }

    const cardQuery = {
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
      subject: subject.trim(),
    };

    const noteQuery = {
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
      subject: subject.trim(),
    };

    if (chapter && chapter.trim()) {
      cardQuery.chapter = chapter.trim();
      noteQuery.chapter = chapter.trim();
    }

    const [cards, notes, user] =
      await Promise.all([
        Card.find(cardQuery)
          .select(
            "question answer p_l reviewCount correctCount chapter"
          )
          .limit(80)
          .lean(),

        Note.find(noteQuery)
          .select(
            "chapter content tags source"
          )
          .limit(30)
          .lean(),

        User.findById(req.userId)
          .select("quizHistory")
          .lean(),
      ]);

    const quizHistory =
      (user?.quizHistory || []).filter(
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

    const plan =
      await generateStudyPlan({
        subject: subject.trim(),
        chapter:
          chapter?.trim() || "",
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
      "TutorAgent plan error:",
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
