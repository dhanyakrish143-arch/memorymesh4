import mongoose from "mongoose";

const quizHistorySchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    subject: {
      type: String,
      default: "General",
    },
    chapter: {
      type: String,
      default: "General",
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    class: {
      type: Number,
      min: 5,
      max: 12,
      required: true,
    },

    board: {
      type: String,
      enum: ["CBSE", "ICSE", "State"],
      default: "CBSE",
    },

    streak: {
      type: Number,
      default: 0,
    },

    streakFreezes: {
      type: Number,
      default: 0,
    },

    gems: {
      type: Number,
      default: 20,
    },

    achievements: {
      type: [String],
      default: [],
    },

    xp: {
      type: Number,
      default: 0,
    },

    weeklyXp: {
      type: Number,
      default: 0,
    },

    weeklyXpResetAt: {
      type: Date,
      default: Date.now,
    },

    leagueTier: {
      type: String,
      enum: ["bronze", "silver", "gold", "diamond"],
      default: "bronze",
    },

    leagueWeek: {
      type: String,
      default: "",
    },

    level: {
      type: Number,
      default: 1,
    },

    hearts: {
      type: Number,
      default: 5,
    },

    lastHeartRefill: {
      type: Date,
      default: Date.now,
    },

    lastActiveDate: {
      type: Date,
      default: Date.now,
    },

    quizHistory: {
      type: [quizHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);


