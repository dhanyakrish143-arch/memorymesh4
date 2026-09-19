import "dotenv/config";
import mongoose from "mongoose";

const textbookSchema = new mongoose.Schema({}, { strict: false });
const Textbook = mongoose.model("Textbook", textbookSchema, "textbooks");

try {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected");
  console.log("Database:", mongoose.connection.name);

  const result = await Textbook.updateMany(
    {
      classNumber: 10,
      subject: "Mathematics",
      language: "English",
      chapterNumber: { $gte: 1, $lte: 14 }
    },
    {
      $set: {
        sourceUrl: "/textbooks/Class-10/Mathematics/English/Mathematics.pdf"
      }
    }
  );

  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
} catch (err) {
  console.error("Error:", err);
} finally {
  await mongoose.disconnect();
}
