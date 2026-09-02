import mongoose from "mongoose";

const textbookSchema = new mongoose.Schema(
  {
    classNumber: {
      type: Number,
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    language: {
      type: String,
      default: "English",
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    chapter: {
      type: String,
      default: "",
      trim: true,
    },

    chapterNumber: {
      type: Number,
      default: null,
    },

    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      default: "NCERT",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

textbookSchema.index({
  classNumber: 1,
  subject: 1,
  chapterNumber: 1,
});

export default mongoose.model(
  "Textbook",
  textbookSchema
);
