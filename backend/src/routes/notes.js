import express from "express";
import Note from "../models/Note.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/*
  GET /api/notes
  Returns notes available to the logged-in user.
  Includes global seed notes and the user's own notes.
*/
router.get("/", auth, async (req, res) => {
  try {
    const { subject, chapter } = req.query;

    const filter = {
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    };

    if (subject) {
      filter.subject = subject;
    }

    if (chapter) {
      filter.chapter = chapter;
    }

    const notes = await Note.find(filter)
      .sort({ subject: 1, chapter: 1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Notes fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notes.",
    });
  }
});

/*
  GET /api/notes/subjects
  Returns subjects available in the notes.
*/
router.get("/subjects", auth, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    })
      .select("subject")
      .lean();

    const subjects = [
      ...new Set(
        notes
          .map((note) => note.subject?.trim())
          .filter(Boolean)
      ),
    ].sort();

    res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error("Notes subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load note subjects.",
    });
  }
});

/*
  GET /api/notes/:id
  Get one note.
*/
router.get("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    }).lean();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Note fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load note.",
    });
  }
});

/*
  POST /api/notes
  Create a personal note.
*/
router.post("/", auth, async (req, res) => {
  try {
    const {
      subject,
      chapter,
      class: studentClass,
      board,
      content,
      tags,
    } = req.body;

    if (!subject || !chapter || !content) {
      return res.status(400).json({
        success: false,
        message: "Subject, chapter and content are required.",
      });
    }

    const note = await Note.create({
      userId: req.userId,
      subject,
      chapter,
      class: studentClass,
      board: board || "NCERT",
      content,
      source: "user",
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Note creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create note.",
    });
  }
});

/*
  POST /api/notes/:id/bookmark
  Toggle bookmark for a note.
*/
router.post("/:id/bookmark", auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { userId: null },
        { userId: req.userId },
      ],
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    const userId = req.userId;

    const index = note.bookmarkedBy.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let bookmarked;

    if (index >= 0) {
      note.bookmarkedBy.splice(index, 1);
      bookmarked = false;
    } else {
      note.bookmarkedBy.push(userId);
      bookmarked = true;
    }

    await note.save();

    res.json({
      success: true,
      bookmarked,
    });
  } catch (error) {
    console.error("Bookmark error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update bookmark.",
    });
  }
});

export default router;

