import express from "express";
import Card from "../models/Card.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const cards = await Card.find({ userId }).lean();

    const totalCards = cards.length;

    const masteredCards = cards.filter(
      (card) => card.mastered === true
    ).length;

    const totalReviews = cards.reduce(
      (sum, card) => sum + (card.reviewCount || 0),
      0
    );

    const totalCorrect = cards.reduce(
      (sum, card) => sum + (card.correctCount || 0),
      0
    );

    const accuracy =
      totalReviews > 0
        ? Math.round((totalCorrect / totalReviews) * 100)
        : 0;

    const mastery =
      totalCards > 0
        ? Math.round((masteredCards / totalCards) * 100)
        : 0;

    const subjectMap = {};

    for (const card of cards) {
      const subject = card.subject?.trim() || "Other";

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          total: 0,
          mastered: 0,
          reviews: 0,
          correct: 0,
        };
      }

      subjectMap[subject].total += 1;
      subjectMap[subject].reviews += card.reviewCount || 0;
      subjectMap[subject].correct += card.correctCount || 0;

      if (card.mastered) {
        subjectMap[subject].mastered += 1;
      }
    }

    const subjects = Object.values(subjectMap).map((item) => ({
      subject: item.subject,
      total: item.total,
      mastered: item.mastered,
      mastery:
        item.total > 0
          ? Math.round((item.mastered / item.total) * 100)
          : 0,
      accuracy:
        item.reviews > 0
          ? Math.round((item.correct / item.reviews) * 100)
          : 0,
    }));

    const recentReviews = [];

    for (const card of cards) {
      if (!card.reviewHistory?.length) continue;

      for (const review of card.reviewHistory) {
        recentReviews.push({
          date: review.reviewedAt,
          correct: review.correct,
          subject: card.subject || "Other",
          chapter: card.chapter || "General",
        });
      }
    }

    recentReviews.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const now = new Date();
    const weeklyActivity = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayReviews = recentReviews.filter((review) => {
        const reviewDate = new Date(review.date);

        return reviewDate >= date && reviewDate < nextDate;
      });

      weeklyActivity.push({
        date: date.toISOString().split("T")[0],
        reviews: dayReviews.length,
        correct: dayReviews.filter((review) => review.correct).length,
      });
    }

    res.json({
      success: true,
      overview: {
        totalCards,
        masteredCards,
        totalReviews,
        totalCorrect,
        accuracy,
        mastery,
      },
      subjects,
      weeklyActivity,
      recentReviews: recentReviews.slice(0, 20),
    });
  } catch (error) {
    console.error("Progress error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load progress.",
    });
  }
});

export default router;

