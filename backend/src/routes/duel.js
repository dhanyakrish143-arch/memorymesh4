import express from "express";
import crypto from "crypto";
import Duel from "../models/Duel.js";
import User from "../models/User.js";
import Friendship from "../models/Friendship.js";
import Card from "../models/Card.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

/*
  SEND DUEL CHALLENGE
*/
router.post("/challenge/:userId", async (req, res) => {
  try {
    const opponentId = req.params.userId;

    if (
      opponentId.toString() ===
      req.userId.toString()
    ) {
      return res.status(400).json({
        error: "You cannot challenge yourself.",
      });
    }

    const opponent = await User.findById(opponentId)
      .select("name")
      .lean();

    if (!opponent) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const friendship = await Friendship.findOne({
      status: "accepted",
      $or: [
        {
          requester: req.userId,
          recipient: opponentId,
        },
        {
          requester: opponentId,
          recipient: req.userId,
        },
      ],
    });

    if (!friendship) {
      return res.status(400).json({
        error: "You can only challenge a friend.",
      });
    }

    const existing = await Duel.findOne({
      status: {
        $in: ["pending", "active"],
      },
      $or: [
        {
          challenger: req.userId,
          opponent: opponentId,
        },
        {
          challenger: opponentId,
          opponent: req.userId,
        },
      ],
    });

    if (existing) {
      return res.json({
        success: true,
        existing: true,
        duel: {
          id: existing._id,
          roomId: existing.roomId,
          status: existing.status,
          opponent,
        },
      });
    }

    const roomId = crypto.randomUUID();

    const duel = await Duel.create({
      challenger: req.userId,
      opponent: opponentId,
      roomId,
    });

    res.status(201).json({
      success: true,
      duel: {
        id: duel._id,
        roomId: duel.roomId,
        status: duel.status,
        opponent,
      },
    });
  } catch (err) {
    console.error(
      "Duel challenge error:",
      err
    );

    res.status(500).json({
      error: "Failed to create duel challenge.",
    });
  }
});

/*
  GET INCOMING DUEL CHALLENGES
*/
router.get("/challenges", async (req, res) => {
  try {
    const duels = await Duel.find({
      opponent: req.userId,
      status: "pending",
    })
      .populate(
        "challenger",
        "name class board"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      duels,
    });
  } catch (err) {
    console.error(
      "Duel challenges error:",
      err
    );

    res.status(500).json({
      error: "Failed to load duel challenges.",
    });
  }
});

/*
  ACCEPT / DECLINE DUEL
*/
router.post("/:id/respond", async (req, res) => {
  try {
    const { action } = req.body;

    if (
      !["accept", "decline"].includes(action)
    ) {
      return res.status(400).json({
        error: "Invalid duel response.",
      });
    }

    const duel = await Duel.findOne({
      _id: req.params.id,
      opponent: req.userId,
      status: "pending",
    });

    if (!duel) {
      return res.status(404).json({
        error: "Duel challenge not found.",
      });
    }

    if (action === "decline") {
      duel.status = "declined";
      await duel.save();

      return res.json({
        success: true,
        status: "declined",
      });
    }

    /*
      Build a coherent duel from a single subject.

      Pick the subject with the most cards owned by
      the challenger. Do not mix subjects.
    */

    const challengerCards =
      await Card.find({
        userId: duel.challenger,
        question: { $exists: true, $ne: "" },
        answer: { $exists: true, $ne: "" },
      })
        .select(
          "question answer subject chapter"
        )
        .lean();

    if (challengerCards.length < 5) {
      return res.status(400).json({
        error:
          "You need at least 5 study questions to start a duel.",
      });
    }

    const subjectGroups = new Map();

    for (const card of challengerCards) {
      const subject =
        (card.subject || "General").trim();

      if (!subjectGroups.has(subject)) {
        subjectGroups.set(subject, []);
      }

      subjectGroups
        .get(subject)
        .push(card);
    }

    const eligibleGroups =
      [...subjectGroups.entries()]
        .filter(
          ([, cards]) => cards.length >= 5
        )
        .sort(
          (a, b) =>
            b[1].length - a[1].length
        );

    if (eligibleGroups.length === 0) {
      return res.status(400).json({
        error:
          "You need 5 questions from the same subject to start a duel.",
      });
    }

    const [selectedSubject, source] =
      eligibleGroups[0];

    const selected =
      [...source]
        .sort(
          () => Math.random() - 0.5
        )
        .slice(0, 5);

    if (selected.length !== 5) {
      return res.status(400).json({
        error:
          "Could not build a five-question duel.",
      });
    }

    duel.subject = selectedSubject;

    duel.questions =
      selected.map((card) => {
        const wrongAnswers =
          source
            .filter(
              (item) =>
                item._id.toString() !==
                  card._id.toString() &&
                item.answer &&
                item.answer.trim() !==
                  card.answer.trim()
            )
            .map(
              (item) =>
                item.answer.trim()
            );

        const uniqueWrongAnswers =
          [
            ...new Set(
              wrongAnswers
            ),
          ]
            .sort(
              () =>
                Math.random() -
                0.5
            )
            .slice(0, 3);

        const options =
          [
            card.answer.trim(),
            ...uniqueWrongAnswers,
          ].sort(
            () =>
              Math.random() - 0.5
          );

        return {
          question:
            card.question.trim(),
          answer:
            card.answer.trim(),
          options,
        };
      });

    duel.status = "active";
    duel.currentQuestion = 0;
    duel.challengerScore = 0;
    duel.opponentScore = 0;
    duel.startedAt = new Date();

    await duel.save();

    res.json({
      success: true,
      duel: {
        id: duel._id,
        roomId: duel.roomId,
        status: duel.status,
        subject: duel.subject,
        challenger: duel.challenger,
        opponent: duel.opponent,
        questions: duel.questions,
      },
    });
  } catch (err) {
    console.error(
      "Duel response error:",
      err
    );

    res.status(500).json({
      error: "Failed to respond to duel.",
    });
  }
});

/*
  GET DUEL
*/
router.get("/:id", async (req, res) => {
  try {
    const duel = await Duel.findOne({
      _id: req.params.id,
      $or: [
        { challenger: req.userId },
        { opponent: req.userId },
      ],
    }).lean();

    if (!duel) {
      return res.status(404).json({
        error: "Duel not found.",
      });
    }

    res.json({
      success: true,
      duel,
    });
  } catch (err) {
    console.error(
      "Duel fetch error:",
      err
    );

    res.status(500).json({
      error: "Failed to load duel.",
    });
  }
});

export default router;






