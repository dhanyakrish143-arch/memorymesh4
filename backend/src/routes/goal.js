import express from "express";
import Card from "../models/Card.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/daily-goal", async (req, res) => {
  try {
    const target = 10;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const cards = await Card.find({
      userId: req.userId,
      "reviewHistory.0": { $exists: true },
    }).select("reviewHistory");

    let completed = 0;

    for (const card of cards) {
      for (const review of card.reviewHistory || []) {
        const reviewedAt = new Date(review.reviewedAt);

        if (reviewedAt >= start && reviewedAt < end) {
          completed += 1;
        }
      }
    }

    const progress = Math.min(
      Math.round((completed / target) * 100),
      100
    );

    res.json({
      success: true,
      target,
      completed,
      remaining: Math.max(target - completed, 0),
      progress,
      complete: completed >= target,
      date: start.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error("Failed to load daily goal:", err);

    res.status(500).json({
      error: "Failed to load daily goal.",
    });
  }
});

export default router;
