import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "./src/models/User.js";
import Textbook from "./src/models/Textbook.js";
import Card from "./src/models/Card.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const users = await User.find({
    class: { $gte: 5, $lte: 12 },
  })
    .select("_id name email class")
    .lean();

  console.log(`Students found: ${users.length}`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const textbooks = await Textbook.find({
      classNumber: user.class,
      active: true,
    })
      .sort({
        subject: 1,
        chapterNumber: 1,
      })
      .lean();

    console.log(
      `\n${user.name || user.email} | Class ${user.class} | ${textbooks.length} chapters`
    );

    for (const book of textbooks) {
      const existing = await Card.findOne({
        userId: user._id,
        subject: book.subject,
        chapter: book.chapter,
        source: "ncert",
      });

      if (existing) {
        skipped++;
        console.log(`  EXISTS  ${book.subject} | ${book.chapter}`);
        continue;
      }

      await Card.create({
        userId: user._id,

        question: `What are the key concepts of ${book.chapter}?`,
        answer: `Study the NCERT textbook chapter "${book.chapter}" in ${book.subject}. Review the definitions, concepts, examples, formulas, diagrams, and important points from this chapter.`,

        subject: book.subject,
        chapter: book.chapter,
        class: user.class,

        source: "ncert",

        p_l: 0.3,
        s_coefficient: 2.0,

        reviewCount: 0,
        correctCount: 0,
        mastered: false,
        bookmarked: false,

        reviewHistory: [],

        nextReviewDate: new Date(),
      });

      created++;

      console.log(
        `  CREATED ${book.subject} | ${book.chapter}`
      );
    }
  }

  console.log("\n==============================================");
  console.log("BULK NCERT FLASHCARD SEED COMPLETE");
  console.log("==============================================");
  console.log(`Created: ${created}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Total students: ${users.length}`);

  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
}

seed().catch(async (error) => {
  console.error("\nFLASHCARD SEED ERROR:", error);

  try {
    await mongoose.connection.close();
  } catch {}

  process.exit(1);
});
