import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import "dotenv/config";
import Textbook from "../src/models/Textbook.js";

const ROOT = path.resolve(process.cwd(), "..", "textbooks");

function walk(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (path.extname(entry.name).toLowerCase() === ".pdf") {
      results.push(fullPath);
    }
  }

  return results;
}

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function extractMetadata(filePath) {
  const relativePath = path.relative(ROOT, filePath);
  const parts = relativePath.split(path.sep);

  const fileName = path.basename(
    filePath,
    path.extname(filePath)
  );

  const className = clean(parts[0]);
  const subject = clean(parts[1]);
  const language = clean(parts[2]) || "English";
  const title = clean(fileName);

  const classMatch = className.match(/\d+/);
  const classNumber = classMatch
    ? Number(classMatch[0])
    : null;

  return {
    classNumber,
    subject,
    language,
    title,
    chapter: "",
    chapterNumber: null,
    relativePath,
  };
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    throw new Error(`Textbook folder not found: ${ROOT}`);
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  const files = walk(ROOT);

  console.log("");
  console.log("========================================");
  console.log("MEMORYMESH LOCAL TEXTBOOK DATABASE IMPORT");
  console.log("========================================");
  console.log("PDF files found:", files.length);
  console.log("");

  await mongoose.connect(process.env.MONGO_URI);

  let imported = 0;

  for (const filePath of files) {
    const book = extractMetadata(filePath);

    if (!Number.isFinite(book.classNumber)) {
      console.log("SKIP:", book.relativePath);
      continue;
    }

    const sourceUrl =
      "/textbooks/" +
      book.relativePath
        .split(path.sep)
        .map(encodeURIComponent)
        .join("/");

    await Textbook.findOneAndUpdate(
      {
        classNumber: book.classNumber,
        subject: book.subject,
        language: book.language,
        title: book.title,
      },
      {
        $set: {
          classNumber: book.classNumber,
          subject: book.subject,
          language: book.language,
          title: book.title,
          chapter: book.chapter,
          chapterNumber: book.chapterNumber,
          sourceUrl,
          source: "NCERT",
          active: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `IMPORTED: Class-${book.classNumber} / ${book.subject} / ${book.title}`
    );
    console.log(`URL: ${sourceUrl}`);
    console.log("");

    imported++;
  }

  console.log("========================================");
  console.log("DATABASE IMPORT COMPLETE");
  console.log("Imported:", imported);
  console.log("========================================");
  console.log("");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("");
  console.error("IMPORT FAILED:");
  console.error(error);
  process.exit(1);
});
