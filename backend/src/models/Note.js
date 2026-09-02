import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    class: {
      type: Number,
      min: 5,
      max: 12,
    },

    board: {
      type: String,
      default: "NCERT",
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      enum: ["seed", "upload", "user"],
      default: "user",
    },

    tags: {
      type: [String],
      default: [],
    },

    bookmarkedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);
