import express from "express";
import multer from "multer";
import fs from "fs";
import requireAuth from "../middleware/auth.js";
import { extractText } from "../ai/documentParser.js";
import { generateStudyContent } from "../ai/contentGenerator.js";
import Card from "../models/Card.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(requireAuth);

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const text = await extractText(req.file.path, req.file.mimetype);
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Could not extract readable text from this file" });
    }

    const generated = await generateStudyContent(text);

    fs.unlink(req.file.path, () => {});

    res.json(generated);
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Save selected generated flashcards into the user's deck
router.post("/save-cards", async (req, res) => {
  try {
    const { flashcards, subject, chapter, class: userClass } = req.body;
    const docs = flashcards.map((f) => ({
      userId: req.userId,
      question: f.question,
      answer: f.answer,
      subject,
      chapter,
      class: userClass,
      source: "upload",
    }));
    const saved = await Card.insertMany(docs);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;