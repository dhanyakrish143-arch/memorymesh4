import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import Note from "./src/models/Note.js";
import Card from "./src/models/Card.js";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing from backend/.env");
}

const SUBJECT = "Mathematics";
const CHAPTER = "Real Numbers";
const CLASS_NUMBER = 10;

const noteContent = `
Real Numbers — Class 10 Mathematics

1. Euclid's Division Lemma
For positive integers a and b, there exist unique integers q and r such that:

a = bq + r

where 0 ≤ r < b.

This result is useful for finding the HCF of two positive integers using Euclid's division algorithm.

2. Euclid's Division Algorithm
To find the HCF of two numbers:
• Divide the larger number by the smaller number.
• Replace the larger number with the smaller number and the smaller number with the remainder.
• Continue until the remainder becomes 0.
• The last non-zero remainder is the HCF.

3. Fundamental Theorem of Arithmetic
Every composite number can be expressed as a product of primes, and this factorisation is unique apart from the order of the prime factors.

Example:
60 = 2 × 2 × 3 × 5 = 2² × 3 × 5.

4. Irrational Numbers
A real number that cannot be written in the form p/q, where p and q are integers and q ≠ 0, is irrational.

Examples include √2, √3 and √5.

5. Rational Numbers
A rational number can be written as p/q, where p and q are integers and q ≠ 0.

The decimal expansion of a rational number is either terminating or non-terminating recurring.

6. Decimal Expansions
For a rational number p/q in lowest form:
• The decimal expansion terminates if the prime factors of q are only 2 and/or 5.
• Otherwise, the decimal expansion is non-terminating recurring.

7. HCF and LCM using Prime Factorisation
If two positive integers are expressed as products of primes:
• HCF uses the smallest powers of common prime factors.
• LCM uses the greatest powers of all prime factors.

Remember:
HCF × LCM = Product of the two positive integers.
`;

const flashcards = [
  {
    question: "What is Euclid's Division Lemma?",
    answer: "For positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 ≤ r < b."
  },
  {
    question: "What is the main purpose of Euclid's Division Algorithm?",
    answer: "It is used to find the HCF of two positive integers."
  },
  {
    question: "In Euclid's division algorithm, when do we stop?",
    answer: "We stop when the remainder becomes 0. The last non-zero remainder is the HCF."
  },
  {
    question: "State the Fundamental Theorem of Arithmetic.",
    answer: "Every composite number can be expressed as a product of primes, and this factorisation is unique apart from the order of the prime factors."
  },
  {
    question: "Write the prime factorisation of 60.",
    answer: "60 = 2² × 3 × 5."
  },
  {
    question: "What is an irrational number?",
    answer: "A real number that cannot be written as p/q, where p and q are integers and q ≠ 0."
  },
  {
    question: "Give three examples of irrational numbers.",
    answer: "√2, √3 and √5."
  },
  {
    question: "What is a rational number?",
    answer: "A number that can be written as p/q, where p and q are integers and q ≠ 0."
  },
  {
    question: "What type of decimal expansion does a rational number have?",
    answer: "It is either terminating or non-terminating recurring."
  },
  {
    question: "When does the decimal expansion of p/q terminate?",
    answer: "When p/q is in lowest form and the prime factors of q are only 2 and/or 5."
  },
  {
    question: "When is the decimal expansion of p/q non-terminating recurring?",
    answer: "When, in lowest form, the denominator has a prime factor other than 2 or 5."
  },
  {
    question: "How is the HCF found using prime factorisation?",
    answer: "Take the smallest powers of the common prime factors."
  },
  {
    question: "How is the LCM found using prime factorisation?",
    answer: "Take the greatest powers of all prime factors."
  },
  {
    question: "What is the relationship between HCF and LCM for two positive integers?",
    answer: "HCF × LCM = Product of the two positive integers."
  }
];

try {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // ------------------------------------------------------------
  // Remove only our previous Chapter 1 seed data
  // ------------------------------------------------------------

  const deletedNotes = await Note.deleteMany({
    subject: SUBJECT,
    chapter: CHAPTER,
    class: CLASS_NUMBER,
    source: "seed"
  });

  const deletedCards = await Card.deleteMany({
    subject: SUBJECT,
    chapter: CHAPTER,
    class: CLASS_NUMBER,
    source: "seed"
  });

  console.log(`Removed ${deletedNotes.deletedCount} old seed note(s).`);
  console.log(`Removed ${deletedCards.deletedCount} old seed flashcard(s).`);

  // ------------------------------------------------------------
  // Create shared study note
  // ------------------------------------------------------------

  await Note.create({
    userId: null,
    subject: SUBJECT,
    chapter: CHAPTER,
    class: CLASS_NUMBER,
    board: "NCERT",
    content: noteContent.trim(),
    source: "seed",
    tags: [
      "NCERT",
      "Class 10",
      "Mathematics",
      "Real Numbers",
      "Euclid Division Lemma",
      "Prime Factorisation"
    ]
  });

  console.log("CREATED study note: Real Numbers");

  // ------------------------------------------------------------
  // Find Class 10 students
  // ------------------------------------------------------------

  const users = await User.find({
    class: CLASS_NUMBER
  }).select("_id name email");

  console.log(`Found ${users.length} Class 10 user(s).`);

  if (users.length === 0) {
    console.log("");
    console.log("WARNING: No Class 10 users found.");
    console.log("The shared Note was created, but no flashcards were created.");
  } else {

    // ----------------------------------------------------------
    // Create flashcards for every Class 10 user
    // ----------------------------------------------------------

    const documents = [];

    for (const user of users) {
      for (const card of flashcards) {
        documents.push({
          userId: user._id,
          question: card.question,
          answer: card.answer,
          subject: SUBJECT,
          chapter: CHAPTER,
          class: CLASS_NUMBER,
          source: "seed",
          p_l: 0.3,
          s_coefficient: 2.0,
          reviewCount: 0,
          correctCount: 0,
          mastered: false,
          bookmarked: false,
          reviewHistory: [],
          nextReviewDate: new Date()
        });
      }
    }

    await Card.insertMany(documents);

    console.log(`CREATED ${flashcards.length} flashcards per Class 10 user.`);
    console.log(`TOTAL flashcards created: ${documents.length}`);

    for (const user of users) {
      console.log(`  ${user.name || user.email}: ${flashcards.length} cards`);
    }
  }

  // ------------------------------------------------------------
  // Verification
  // ------------------------------------------------------------

  const noteCount = await Note.countDocuments({
    subject: SUBJECT,
    chapter: CHAPTER,
    class: CLASS_NUMBER,
    source: "seed"
  });

  const cardCount = await Card.countDocuments({
    subject: SUBJECT,
    chapter: CHAPTER,
    class: CLASS_NUMBER,
    source: "seed"
  });

  console.log("");
  console.log("==============================================");
  console.log("CLASS 10 MATHEMATICS — CHAPTER 1 SEED COMPLETE");
  console.log("==============================================");
  console.log(`Study notes: ${noteCount}`);
  console.log(`Flashcards:  ${cardCount}`);
  console.log(`Chapter:     ${CHAPTER}`);
  console.log(`Subject:     ${SUBJECT}`);
  console.log(`Class:       ${CLASS_NUMBER}`);
  console.log("");
  console.log("NCERT textbook:");
  console.log("https://ncert.nic.in/textbook.php?jemh1=1-14");
  console.log("");

} catch (error) {
  console.error("");
  console.error("SEED FAILED:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}
