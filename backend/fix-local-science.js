import "dotenv/config";
import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB connected");
console.log("Database:", mongoose.connection.name);

const result = await mongoose.connection.db.collection("textbooks").updateMany(
  {
    classNumber: 10,
    subject: "Science"
  },
  {
    $set: {
      sourceUrl: "/textbooks/Class-10/Science/English/Science.pdf"
    }
  }
);

console.log("Matched:", result.matchedCount);
console.log("Modified:", result.modifiedCount);

await mongoose.disconnect();
console.log("Done");
