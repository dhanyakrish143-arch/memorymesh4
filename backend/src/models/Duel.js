import mongoose from "mongoose";

const duelQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },

    answer: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const duelResponseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questionIndex: {
      type: Number,
      required: true,
    },

    selectedOption: {
      type: String,
      required: true,
    },

    correct: {
      type: Boolean,
      required: true,
    },

    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const duelSchema = new mongoose.Schema(
  {
    challenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "completed",
        "declined",
        "cancelled",
      ],
      default: "pending",
    },

    questions: {
      type: [duelQuestionSchema],
      default: [],
    },

    subject: {
      type: String,
      default: "General",
      trim: true,
    },

    currentQuestion: {
      type: Number,
      default: 0,
      min: 0,
    },

    responses: {
      type: [duelResponseSchema],
      default: [],
    },

    challengerScore: {
      type: Number,
      default: 0,
    },

    opponentScore: {
      type: Number,
      default: 0,
    },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Duel", duelSchema);


