import cron from "node-cron";
import User from "../models/User.js";
import League from "../models/League.js";

const TIER_UP = {
  bronze: "silver",
  silver: "gold",
  gold: "diamond",
  diamond: "diamond",
};

const TIER_DOWN = {
  bronze: "bronze",
  silver: "bronze",
  gold: "silver",
  diamond: "gold",
};

function getWeekKey(date = new Date()) {
  const day = date.getUTCDay();

  const diff =
    date.getUTCDate() -
    day +
    (day === 0 ? -6 : 1);

  const monday = new Date(date);

  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);

  return monday.toISOString().slice(0, 10);
}

function getPreviousWeekKey() {
  const previous = new Date();

  previous.setUTCDate(
    previous.getUTCDate() - 7
  );

  return getWeekKey(previous);
}

async function processWeeklyLeagues() {
  const currentWeek = getWeekKey();
  const previousWeek = getPreviousWeekKey();

  console.log(
    `[League] Processing ${previousWeek} → ${currentWeek}`
  );

  const tiers = [
    "bronze",
    "silver",
    "gold",
    "diamond",
  ];

  for (const tier of tiers) {
    const users = await User.find({
      leagueWeek: previousWeek,
      leagueTier: tier,
    })
      .select("_id weeklyXp")
      .sort({
        weeklyXp: -1,
      })
      .lean();

    if (users.length === 0) {
      continue;
    }

    const promotionCount =
      Math.min(3, users.length);

    const demotionCount =
      users.length >= 5 ? 2 : 0;

    for (
      let index = 0;
      index < users.length;
      index += 1
    ) {
      const player = users[index];

      let nextTier = tier;

      if (index < promotionCount) {
        nextTier = TIER_UP[tier];
      } else if (
        demotionCount > 0 &&
        index >= users.length - demotionCount
      ) {
        nextTier = TIER_DOWN[tier];
      }

      await User.findByIdAndUpdate(
        player._id,
        {
          $set: {
            weeklyXp: 0,
            leagueTier: nextTier,
            leagueWeek: currentWeek,
            weeklyXpResetAt: new Date(),
          },
        }
      );
    }

    await League.findOneAndUpdate(
      {
        week: previousWeek,
        tier,
      },
      {
        $set: {
          finalized: true,
          promotions: users
            .slice(0, promotionCount)
            .map((player) => player._id),
          demotions:
            demotionCount > 0
              ? users
                  .slice(-demotionCount)
                  .map(
                    (player) => player._id
                  )
              : [],
        },
      }
    );

    console.log(
      `[League] ${tier}: ${users.length} players processed.`
    );
  }

  console.log(
    "[League] Weekly reset completed."
  );
}

export function startLeagueCron() {
  cron.schedule(
    "5 0 * * 1",
    async () => {
      try {
        await processWeeklyLeagues();
      } catch (error) {
        console.error(
          "[League] Weekly reset failed:",
          error
        );
      }
    },
    {
      timezone: "UTC",
    }
  );

  console.log(
    "[League] Weekly reset scheduler started."
  );
}

export { processWeeklyLeagues };
