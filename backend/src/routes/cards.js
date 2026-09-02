import express from "express";
import Card from "../models/Card.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const cards = await Card.find({ userId: req.userId });
  res.json(cards);
});

router.post("/", async (req, res) => {
  const card = await Card.create({ ...req.body, userId: req.userId });
  res.json(card);
});

router.put("/:id", async (req, res) => {
  const card = await Card.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  res.json(card);
});

router.patch("/:id/bookmark", async (req, res) => {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!card) {
      return res.status(404).json({
        error: "Card not found",
      });
    }

    card.bookmarked = !card.bookmarked;
    await card.save();

    res.json({
      success: true,
      bookmarked: card.bookmarked,
    });
  } catch (err) {
    console.error(
      "Failed to update bookmark:",
      err
    );

    res.status(500).json({
      error: "Failed to update bookmark",
    });
  }
});

router.delete("/:id", async (req, res) => {
  await Card.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ success: true });
});

export default router;
