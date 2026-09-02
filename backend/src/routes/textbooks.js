import express from "express";
import Textbook from "../models/Textbook.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const classNumber =
      Number(req.query.class);

    if (
      !Number.isInteger(classNumber) ||
      classNumber < 1 ||
      classNumber > 12
    ) {
      return res.status(400).json({
        error: "Valid class is required.",
      });
    }

    const subject =
      req.query.subject?.trim();

    const filter = {
      classNumber,
      active: true,
    };

    if (subject) {
      filter.subject = subject;
    }

    const textbooks =
      await Textbook.find(filter)
        .sort({
          subject: 1,
          chapterNumber: 1,
          title: 1,
        })
        .lean();

    res.json({
      success: true,
      classNumber,
      textbooks,
    });
  } catch (error) {
    console.error(
      "Textbook fetch error:",
      error
    );

    res.status(500).json({
      error: "Failed to load textbooks.",
    });
  }
});

export default router;
