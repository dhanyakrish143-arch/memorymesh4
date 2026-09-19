import "dotenv/config";
import mongoose from "mongoose";
import Textbook from "./src/models/Textbook.js";
import Note from "./src/models/Note.js";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing from backend/.env");
}

try {
  await mongoose.connect(MONGO_URI);

  console.log("Connected to MongoDB.");

  const textbooks = await Textbook.find({
    classNumber: {
      $gte: 5,
      $lte: 12
    },
    active: true
  })
    .sort({
      classNumber: 1,
      subject: 1,
      chapterNumber: 1
    })
    .lean();

  console.log("Found " + textbooks.length + " textbook chapters.");

  let created = 0;
  let skipped = 0;

  const createdByClass = {};
  const skippedByClass = {};

  for (const textbook of textbooks) {
    const existing = await Note.findOne({
      userId: null,
      class: textbook.classNumber,
      subject: textbook.subject,
      chapter: textbook.chapter
    }).lean();

    if (existing) {
      skipped++;

      skippedByClass[textbook.classNumber] =
        (skippedByClass[textbook.classNumber] || 0) + 1;

      continue;
    }

    const content = [
      textbook.chapter,
      "",
      "Class " + textbook.classNumber + " - " + textbook.subject,
      "",
      "NCERT Study Note",
      "",
      "Chapter " + textbook.chapterNumber + ": " + textbook.chapter,
      "",
      "This study note is linked to the NCERT textbook chapter.",
      "",
      "Subject: " + textbook.subject,
      "Class: " + textbook.classNumber,
      "Chapter Number: " + textbook.chapterNumber,
      "Textbook: " + textbook.title,
      "",
      "Source:",
      textbook.sourceUrl,
      "",
      "Detailed chapter content should be added from the corresponding NCERT textbook source."
    ].join("\n");

    await Note.create({
      userId: null,
      subject: textbook.subject,
      chapter: textbook.chapter,
      class: textbook.classNumber,
      board: textbook.source || "NCERT",
      content: content,
      source: "seed",
      tags: [
        "NCERT",
        "Class " + textbook.classNumber,
        textbook.subject,
        textbook.chapter,
        "Chapter " + textbook.chapterNumber
      ]
    });

    created++;

    createdByClass[textbook.classNumber] =
      (createdByClass[textbook.classNumber] || 0) + 1;

    console.log(
      "CREATED | Class " +
      textbook.classNumber +
      " | " +
      textbook.subject +
      " | Chapter " +
      textbook.chapterNumber +
      " | " +
      textbook.chapter
    );
  }

  console.log("");
  console.log("==============================================");
  console.log("CLASS 5-12 NOTE SEED COMPLETE");
  console.log("==============================================");
  console.log("Textbook chapters found: " + textbooks.length);
  console.log("Notes created: " + created);
  console.log("Notes already existed: " + skipped);
  console.log("");

  console.log("CREATED BY CLASS:");
  console.table(createdByClass);

  console.log("SKIPPED BY CLASS:");
  console.table(skippedByClass);

  const totalNotes = await Note.countDocuments({
    class: {
      $gte: 5,
      $lte: 12
    },
    userId: null,
    source: "seed"
  });

  console.log("");
  console.log("TOTAL CLASS 5-12 SEED NOTES: " + totalNotes);

} catch (error) {
  console.error("");
  console.error("NOTE SEED FAILED:");
  console.error(error);
  process.exitCode = 1;

} finally {
  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}
