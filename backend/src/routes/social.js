import express from "express";
import User from "../models/User.js";
import Friendship from "../models/Friendship.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

/*
  SEARCH USERS
*/
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        {
          name: {
            $regex: q,
            $options: "i",
          },
        },
        {
          email: {
            $regex: q,
            $options: "i",
          },
        },
      ],
    })
      .select("name email class board")
      .limit(20)
      .lean();

    const friendships = await Friendship.find({
      $or: [
        { requester: req.userId },
        { recipient: req.userId },
      ],
    })
      .lean();

    const results = users.map((user) => {
      const friendship = friendships.find(
        (item) =>
          item.requester.toString() ===
            user._id.toString() ||
          item.recipient.toString() ===
            user._id.toString()
      );

      let relationship = "none";

      if (friendship) {
        if (friendship.status === "accepted") {
          relationship = "friends";
        } else if (
          friendship.status === "pending"
        ) {
          relationship =
            friendship.requester.toString() ===
            req.userId.toString()
              ? "request_sent"
              : "request_received";
        }
      }

      return {
        ...user,
        relationship,
        friendshipId:
          friendship?._id || null,
      };
    });

    res.json({
      success: true,
      users: results,
    });
  } catch (err) {
    console.error(
      "Friend search error:",
      err
    );

    res.status(500).json({
      error: "Failed to search users.",
    });
  }
});

/*
  SEND FRIEND REQUEST
*/
router.post("/request/:userId", async (req, res) => {
  try {
    const targetId = req.params.userId;

    if (
      targetId.toString() ===
      req.userId.toString()
    ) {
      return res.status(400).json({
        error:
          "You cannot send yourself a friend request.",
      });
    }

    const target = await User.findById(targetId);

    if (!target) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const existing = await Friendship.findOne({
      $or: [
        {
          requester: req.userId,
          recipient: targetId,
        },
        {
          requester: targetId,
          recipient: req.userId,
        },
      ],
    });

    if (existing) {
      return res.status(400).json({
        error:
          existing.status === "accepted"
            ? "You are already friends."
            : "A friend request already exists.",
      });
    }

    const friendship =
      await Friendship.create({
        requester: req.userId,
        recipient: targetId,
        status: "pending",
      });

    res.json({
      success: true,
      friendship,
    });
  } catch (err) {
    console.error(
      "Friend request error:",
      err
    );

    res.status(500).json({
      error:
        err.code === 11000
          ? "A friend request already exists."
          : "Failed to send friend request.",
    });
  }
});

/*
  PENDING REQUESTS
*/
router.get("/requests", async (req, res) => {
  try {
    const requests =
      await Friendship.find({
        recipient: req.userId,
        status: "pending",
      })
        .populate(
          "requester",
          "name email class board"
        )
        .sort({ createdAt: -1 })
        .lean();

    res.json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error(
      "Friend requests error:",
      err
    );

    res.status(500).json({
      error: "Failed to load friend requests.",
    });
  }
});

/*
  ACCEPT / DECLINE
*/
router.post(
  "/request/:id/respond",
  async (req, res) => {
    try {
      const { action } = req.body;

      if (
        !["accept", "decline"].includes(
          action
        )
      ) {
        return res.status(400).json({
          error: "Invalid response.",
        });
      }

      const friendship =
        await Friendship.findOne({
          _id: req.params.id,
          recipient: req.userId,
          status: "pending",
        });

      if (!friendship) {
        return res.status(404).json({
          error: "Friend request not found.",
        });
      }

      friendship.status =
        action === "accept"
          ? "accepted"
          : "declined";

      await friendship.save();

      res.json({
        success: true,
        status: friendship.status,
      });
    } catch (err) {
      console.error(
        "Friend response error:",
        err
      );

      res.status(500).json({
        error:
          "Failed to respond to friend request.",
      });
    }
  }
);

/*
  FRIEND LIST
*/
router.get("/", async (req, res) => {
  try {
    const friendships =
      await Friendship.find({
        $or: [
          {
            requester: req.userId,
            status: "accepted",
          },
          {
            recipient: req.userId,
            status: "accepted",
          },
        ],
      }).lean();

    const friendIds =
      friendships.map((item) =>
        item.requester.toString() ===
        req.userId.toString()
          ? item.recipient
          : item.requester
      );

    const friends = await User.find({
      _id: { $in: friendIds },
    })
      .select(
        "name email class board xp weeklyXp streak leagueTier"
      )
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      friends,
    });
  } catch (err) {
    console.error(
      "Friend list error:",
      err
    );

    res.status(500).json({
      error: "Failed to load friends.",
    });
  }
});

export default router;
