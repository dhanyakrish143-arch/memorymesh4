import express from "express";
import Card from "../models/Card.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import { updateMastery } from "../core/bkt.js";
import { computeNextReview } from "../core/schedule.js";

const router = express.Router();

router.use(requireAuth);

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function unlockAchievement(user, achievement) {
  const rewards = {
    first_review: 10,
    "10_correct": 20,
    "3_day_streak": 25,
    "7_day_streak": 50,
    "50_reviews": 50,
    "100_reviews": 100,
    first_mastered: 20,
    "10_mastered": 75,
  };

  if (!user.achievements.includes(achievement)) {
    user.achievements.push(achievement);
    user.gems = (user.gems || 0) + (rewards[achievement] || 0);
    return true;
  }

  return false;
}

/* =========================================================
   DUE CARDS
   ========================================================= */

router.get("/due", async (req, res) => {
  try {
    const now = new Date();

    const query = {
      userId: req.userId,
      nextReviewDate: { $lte: now },
    };

    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    if (req.query.chapter) {
      query.chapter = req.query.chapter;
    }

    let due = await Card.find(query);

    if (req.query.filter === "weak") {
      due = due.filter(
        (card) => Number(card.p_l ?? 0) < 0.4
      );
    }

    if (req.query.filter === "missed") {
      due = due.filter((card) => {
        const history = card.reviewHistory || [];

        if (history.length === 0) {
          return false;
        }

        const lastReview =
          history[history.length - 1];

        return lastReview.correct === false;
      });
    }

    due.sort((a, b) => {
      const masteryA = Number(a.p_l ?? 0);
      const masteryB = Number(b.p_l ?? 0);

      if (masteryA !== masteryB) {
        return masteryA - masteryB;
      }

      const historyA = a.reviewHistory || [];
      const historyB = b.reviewHistory || [];

      const lastA =
        historyA.length > 0
          ? new Date(
              historyA[historyA.length - 1].reviewedAt
            ).getTime()
          : 0;

      const lastB =
        historyB.length > 0
          ? new Date(
              historyB[historyB.length - 1].reviewedAt
            ).getTime()
          : 0;

      return lastA - lastB;
    });

    const result = due.map((card) => {
      const mastery = Number(card.p_l ?? 0);
      const history = card.reviewHistory || [];

      const lastReview =
        history.length > 0
          ? history[history.length - 1]
          : null;

      let priorityReason = "Due for review";

      if (mastery < 0.4) {
        priorityReason = "Weak card";
      } else if (
        lastReview &&
        lastReview.correct === false
      ) {
        priorityReason = "Recently missed";
      } else if (mastery < 0.7) {
        priorityReason = "Needs more practice";
      } else if (
        (card.reviewCount || 0) === 0
      ) {
        priorityReason = "New card";
      }

      return {
        ...card.toObject(),
        priorityReason,
      };
    });

    console.log(
      "Review due:",
      result.length,
      "| filter:",
      req.query.filter || "all",
      "| subject:",
      req.query.subject || "all",
      "| chapter:",
      req.query.chapter || "all"
    );

    res.json(result);
  } catch (err) {
    console.error(
      "Failed to load smart review cards:",
      err
    );

    res.status(500).json({
      error: "Failed to load review cards",
    });
  }
});
/* =========================================================
   SUBMIT REVIEW
   ========================================================= */

router.post("/submit", async (req, res) => {
  try {
    const { cardId, correct } = req.body;

    const card = await Card.findOne({
      _id: cardId,
      userId: req.userId,
    });

    if (!card) {
      return res.status(404).json({
        error: "Card not found",
      });
    }

    const wasCorrect = Boolean(correct);

    card.p_l = updateMastery(card.p_l, wasCorrect);

    const {
      s_coefficient,
      nextReviewDate,
    } = computeNextReview(
      card.s_coefficient,
      wasCorrect
    );

    card.s_coefficient = s_coefficient;
    card.nextReviewDate = nextReviewDate;

    card.reviewCount = (card.reviewCount || 0) + 1;

    if (wasCorrect) {
      card.correctCount = (card.correctCount || 0) + 1;
    }

    card.reviewHistory = card.reviewHistory || [];

    card.reviewHistory.push({
      reviewedAt: new Date(),
      correct: wasCorrect,
    });

    card.mastered = card.p_l > 0.9;

    await card.save();

    const user = await User.findById(req.userId);

    if (user) {
      const today = startOfDay(new Date());

      const lastActive = user.lastActiveDate
        ? startOfDay(user.lastActiveDate)
        : null;

      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastActive) {
        user.streak = 1;
      } else {
        const daysSinceLastActive = Math.round(
          (today - lastActive) / oneDay
        );

        if (daysSinceLastActive === 0) {
          if ((user.streak || 0) === 0) {
            user.streak = 1;
          }
        } else if (daysSinceLastActive === 1) {
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 1;
        }
      }

      user.lastActiveDate = new Date();

      const xpEarned = wasCorrect ? 10 : 2;

      user.xp = (user.xp || 0) + xpEarned;
      user.weeklyXp = (user.weeklyXp || 0) + xpEarned;
      user.level = Math.floor(user.xp / 100) + 1;

      const totals = await Card.aggregate([
        {
          $match: {
            userId: user._id,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: ["$reviewCount", 0],
              },
            },
            correct: {
              $sum: {
                $ifNull: ["$correctCount", 0],
              },
            },
          },
        },
      ]);

      const reviewStats = totals[0] || {
        total: 0,
        correct: 0,
      };

      const masteredCount = await Card.countDocuments({
        userId: user._id,
        mastered: true,
      });

      if (reviewStats.total >= 1) {
        unlockAchievement(user, "first_review");
      }

      if (reviewStats.total >= 50) {
        unlockAchievement(user, "50_reviews");
      }

      if (reviewStats.total >= 100) {
        unlockAchievement(user, "100_reviews");
      }

      if (reviewStats.correct >= 10) {
        unlockAchievement(user, "10_correct");
      }

      if (user.streak >= 3) {
        unlockAchievement(user, "3_day_streak");
      }

      if (user.streak >= 7) {
        unlockAchievement(user, "7_day_streak");
      }

      if (masteredCount >= 1) {
        unlockAchievement(user, "first_mastered");
      }

      if (masteredCount >= 10) {
        unlockAchievement(user, "10_mastered");
      }

      await user.save();
    }

    res.json(card);
  } catch (err) {
    console.error("Failed to submit review:", err);

    res.status(500).json({
      error: "Failed to submit review",
    });
  }
});

/* =========================================================
   ACTIVITY
   ========================================================= */

router.get("/activity", async (req, res) => {
  try {
    const cards = await Card.find({
      userId: req.userId,
      "reviewHistory.0": {
        $exists: true,
      },
    }).select("reviewHistory");

    const activity = {};

    for (const card of cards) {
      for (const review of card.reviewHistory || []) {
        const date = new Date(review.reviewedAt)
          .toISOString()
          .slice(0, 10);

        if (!activity[date]) {
          activity[date] = {
            date,
            reviews: 0,
            correct: 0,
          };
        }

        activity[date].reviews += 1;

        if (review.correct) {
          activity[date].correct += 1;
        }
      }
    }

    const result = Object.values(activity)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    res.json(result);
  } catch (err) {
    console.error("Failed to load review activity:", err);

    res.status(500).json({
      error: "Failed to load review activity",
    });
  }
});

/* =========================================================
   STATS
   ========================================================= */

router.get("/stats", async (req, res) => {
  try {
    const cards = await Card.find({
      userId: req.userId,
    });

    const totalReviews = cards.reduce(
      (sum, card) => sum + (card.reviewCount || 0),
      0
    );

    const correct = cards.reduce(
      (sum, card) => sum + (card.correctCount || 0),
      0
    );

    const mastered = cards.filter(
      (card) => card.mastered === true
    ).length;

    const accuracy =
      totalReviews > 0
        ? Math.round((correct / totalReviews) * 100)
        : 0;

    const user = await User.findById(req.userId).select(
      "streak lastActiveDate xp level achievements gems"
    );

    const subjectsMap = {};

    for (const card of cards) {
      const subject = card.subject || "General";

      if (!subjectsMap[subject]) {
        subjectsMap[subject] = {
          subject,
          total: 0,
          mastered: 0,
          reviews: 0,
          correct: 0,
        };
      }

      subjectsMap[subject].total += 1;
      subjectsMap[subject].reviews +=
        card.reviewCount || 0;
      subjectsMap[subject].correct +=
        card.correctCount || 0;

      if (card.mastered === true) {
        subjectsMap[subject].mastered += 1;
      }
    }

    const subjects = Object.values(subjectsMap).map(
      (subject) => ({
        subject: subject.subject,
        total: subject.total,
        mastered: subject.mastered,
        mastery:
          subject.total > 0
            ? Math.round(
                (subject.mastered / subject.total) * 100
              )
            : 0,
        accuracy:
          subject.reviews > 0
            ? Math.round(
                (subject.correct / subject.reviews) * 100
              )
            : 0,
      })
    );

    const weeklyMap = {};

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const key = date
        .toISOString()
        .slice(0, 10);

      weeklyMap[key] = {
        date: key,
        reviews: 0,
      };
    }

    for (const card of cards) {
      for (const review of card.reviewHistory || []) {
        const key = new Date(review.reviewedAt)
          .toISOString()
          .slice(0, 10);

        if (weeklyMap[key]) {
          weeklyMap[key].reviews += 1;
        }
      }
    }

    const weeklyActivity = Object.values(
      weeklyMap
    );

    res.json({
      success: true,

      overview: {
        totalReviews,
        totalCorrect: correct,
        accuracy,
        masteredCards: mastered,
        totalCards: cards.length,
      },

      subjects,

      weeklyActivity,

      totalReviews,
      correct,
      accuracy,
      mastered,
      totalCards: cards.length,

      streak: user?.streak ?? 0,
      lastActiveDate:
        user?.lastActiveDate ?? null,

      xp: user?.xp ?? 0,
      level: user?.level ?? 1,

      achievements:
        user?.achievements ?? [],

      gems: user?.gems ?? 0,
    });
  } catch (err) {
    console.error("Failed to load review stats:", err);

    res.status(500).json({
      error: "Failed to load review stats",
    });
  }
});

export default router;







