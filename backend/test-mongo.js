import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI is missing");
  process.exit(1);
}

console.log("MONGO_URI loaded");

try {
  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
  console.log("Database:", mongoose.connection.name);
} catch (error) {
  console.error("MongoDB connection failed:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
