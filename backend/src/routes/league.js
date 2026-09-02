import express from "express";
import League from "../models/League.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

function getWeekKey() {
  const now = new Date();

  const day = now.getUTCDay();
  const diff =
    now.getUTCDate() -
    day +
    (day === 0 ? -6 : 1);

  const monday = new Date(now);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);

  return monday.toISOString().slice(0, 10);
}

router.get("/current", async (req, res) => {
  try {
    const week = getWeekKey();

    let user = await User.findById(req.userId)
      .select(
        "name class board weeklyXp weeklyXpResetAt leagueTier leagueWeek"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (!user.leagueTier) {
      user.leagueTier = "bronze";
    }

    if (!user.leagueWeek) {
      await User.findByIdAndUpdate(req.userId, {
        $set: {
          leagueTier: user.leagueTier,
          leagueWeek: week,
          weeklyXpResetAt: new Date(),
        },
      });

      user.leagueWeek = week;
    }

    if (user.leagueWeek !== week) {
      await User.findByIdAndUpdate(req.userId, {
        $set: {
          weeklyXp: 0,
          leagueWeek: week,
          weeklyXpResetAt: new Date(),
        },
      });

      user.weeklyXp = 0;
      user.leagueWeek = week;
    }

    const tier = user.leagueTier || "bronze";

    const users = await User.find({
      leagueWeek: week,
      leagueTier: tier,
    })
      .select("name weeklyXp class")
      .sort({
        weeklyXp: -1,
        name: 1,
      })
      .limit(50)
      .lean();

    let league = await League.findOne({
      week,
      tier,
    });

    if (!league) {
      league = await League.create({
        week,
        tier,
        members: [],
      });
    }

    league.members = users.map((item) => ({
      userId: item._id,
      xp: item.weeklyXp || 0,
    }));

    league.promotions = users
      .slice(0, 3)
      .map((item) => item._id);

    league.demotions =
      users.length >= 5
        ? users.slice(-2).map((item) => item._id)
        : [];

    await league.save();

    const leaderboard = users.map(
      (item, index) => ({
        rank: index + 1,
        userId: item._id,
        name:
          item._id.toString() ===
          req.userId.toString()
            ? "You"
            : item.name,
        xp: item.weeklyXp || 0,
        class: item.class,
        promotion: index < 3,
        demotion:
          users.length >= 5 &&
          index >= users.length - 2,
      })
    );

    const currentIndex =
      leaderboard.findIndex(
        (item) =>
          item.userId.toString() ===
          req.userId.toString()
      );

    res.json({
      success: true,
      week,
      tier,
      weeklyXp: user.weeklyXp || 0,
      currentRank:
        currentIndex >= 0
          ? currentIndex + 1
          : leaderboard.length + 1,
      totalPlayers: leaderboard.length,
      promotionZone: [1, 2, 3],
      demotionZone:
        leaderboard.length >= 5
          ? [
              leaderboard.length - 1,
              leaderboard.length,
            ]
          : [],
      leaderboard,
    });
  } catch (err) {
    console.error("League fetch error:", err);

    res.status(500).json({
      error: "Failed to load league.",
    });
  }
});

export default router;
