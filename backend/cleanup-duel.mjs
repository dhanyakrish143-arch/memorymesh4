import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import Duel from "./src/models/Duel.js";

const email = process.argv[2];

if (!email) {
  throw new Error("Email is required.");
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({
  email: email.toLowerCase().trim(),
}).select("_id name email");

if (!user) {
  throw new Error("User not found.");
}

const result = await Duel.updateMany(
  {
    status: {
      $in: ["pending", "active"],
    },
    $or: [
      { challenger: user._id },
      { opponent: user._id },
    ],
  },
  {
    $set: {
      status: "cancelled",
      completedAt: new Date(),
    },
  }
);

console.log("");
console.log("========================================");
console.log("DUEL CLEANUP COMPLETE");
console.log("========================================");
console.log("User:", user.name);
console.log("Cancelled:", result.modifiedCount);
console.log("========================================");

await mongoose.disconnect();
