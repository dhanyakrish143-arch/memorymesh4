import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/result", async (req, res) => {
  try {
    const {
      score,
      total,
      percentage,
      subject,
      chapter,
    } = req.body;

    const safeScore = Number(score);
    const safeTotal = Number(total);

    if (
      !Number.isFinite(safeScore) ||
      !Number.isFinite(safeTotal) ||
      safeTotal <= 0 ||
      safeScore < 0 ||
      safeScore > safeTotal
    ) {
      return res.status(400).json({
        error: "Invalid quiz result.",
      });
    }

    const safePercentage = Math.round(
      (safeScore / safeTotal) * 100
    );

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    user.quizHistory = user.quizHistory || [];

    user.quizHistory.push({
      score: safeScore,
      total: safeTotal,
      percentage: safePercentage,
      subject: subject || "General",
      chapter: chapter || "General",
      completedAt: new Date(),
    });

    if (user.quizHistory.length > 50) {
      user.quizHistory = user.quizHistory.slice(-50);
    }

    await user.save();

    res.json({
      success: true,
      result: user.quizHistory[user.quizHistory.length - 1],
    });
  } catch (err) {
    console.error("Failed to save quiz result:", err);

    res.status(500).json({
      error: "Failed to save quiz result.",
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "quizHistory"
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const history = [...(user.quizHistory || [])]
      .sort(
        (a, b) =>
          new Date(b.completedAt) -
          new Date(a.completedAt)
      )
      .slice(0, 50);

    res.json(history);
  } catch (err) {
    console.error("Failed to load quiz history:", err);

    res.status(500).json({
      error: "Failed to load quiz history.",
    });
  }
});

export default router;
