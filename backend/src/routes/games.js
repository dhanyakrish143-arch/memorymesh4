import express from "express";
import GameScore from "../models/GameScore.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import { generateTimelineEvents } from "../ai/timelineGenerator.js";

const router = express.Router();

router.use(requireAuth);

/*
  WORD MATCH SCORE SUBMISSION
*/
/*
  AI TIMELINE GENERATION
*/
router.post("/timeline", async (req, res) => {
  try {
    const {
      subject,
      chapter,
      material,
    } = req.body;

    if (!material || !String(material).trim()) {
      return res.status(400).json({
        error: "Study material is required.",
      });
    }

    const events =
      await generateTimelineEvents(
        String(material)
      );

    if (events.length < 2) {
      return res.status(400).json({
        error:
          "Not enough reliable chronological events were found.",
      });
    }

    const timeline = await generateTimelineEvents(
      String(material)
    );

    res.json({
      success: true,
      subject: subject || "General",
      chapter: chapter || "General",
      type: timeline.type,
      events: timeline.events,
    });
  } catch (err) {
    console.error(
      "Failed to generate timeline:",
      err
    );

    res.status(500).json({
      error:
        "Failed to generate timeline events.",
    });
  }
});
router.post("/score", async (req, res) => {
  try {
    const {
      gameType,
      subject,
      chapter,
      score,
      maxScore,
      timeTaken,
    } = req.body;

    const safeScore = Number(score);
    const safeMaxScore = Number(maxScore);
    const safeTimeTaken = Number(timeTaken);

    if (!gameType) {
      return res.status(400).json({
        error: "Game type is required.",
      });
    }

    if (
      !Number.isFinite(safeScore) ||
      !Number.isFinite(safeMaxScore) ||
      safeMaxScore <= 0 ||
      safeScore < 0 ||
      safeScore > safeMaxScore
    ) {
      return res.status(400).json({
        error: "Invalid game score.",
      });
    }

    if (
      !Number.isFinite(safeTimeTaken) ||
      safeTimeTaken < 0
    ) {
      return res.status(400).json({
        error: "Invalid time.",
      });
    }

    /*
      Word Match rewards:
      Base: 10 XP + 5 gems.
      Small completion bonus for perfect score.
    */
    let xpEarned = 10;
    let gemsEarned = 5;

    if (safeScore === safeMaxScore) {
      xpEarned += 5;
      gemsEarned += 2;
    }

    const gameScore = await GameScore.create({
      userId: req.userId,
      gameType,
      subject: subject || "General",
      chapter: chapter || "General",
      score: safeScore,
      maxScore: safeMaxScore,
      timeTaken: safeTimeTaken,
      heartsUsed: 0,
    });

    const user = await User.findById(req.userId);

    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      user.weeklyXp = (user.weeklyXp || 0) + xpEarned;
      user.gems = (user.gems || 0) + gemsEarned;
      user.level = Math.floor(user.xp / 100) + 1;

      await user.save();
    }

    res.json({
      success: true,
      gameScore,
      rewards: {
        xp: xpEarned,
        gems: gemsEarned,
      },
      level: user?.level ?? 1,
      totalXp: user?.xp ?? 0,
      totalGems: user?.gems ?? 0,
    });
  } catch (err) {
    console.error(
      "Failed to save game score:",
      err
    );

    res.status(500).json({
      error: "Failed to save game score.",
    });
  }
});

/*
  RECENT GAME SCORES
*/
router.get("/history", async (req, res) => {
  try {
    const scores = await GameScore.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(scores);
  } catch (err) {
    console.error(
      "Failed to load game history:",
      err
    );

    res.status(500).json({
      error: "Failed to load game history.",
    });
  }
});

export default router;



