import mongoose from "mongoose";

const gameScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gameType: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      default: "General",
      trim: true,
    },

    chapter: {
      type: String,
      default: "General",
      trim: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },

    timeTaken: {
      type: Number,
      required: true,
      min: 0,
    },

    heartsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "GameScore",
  gameScoreSchema
);
