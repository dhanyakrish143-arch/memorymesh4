import mongoose from "mongoose";

const textbookSchema = new mongoose.Schema(
  {
    classNumber: {
      type: Number,
      required: true,
      min: 5,
      max: 12,
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
      required: true,
      trim: true,
      default: "English",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    bookCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    chapterNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      default: "NCERT",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

textbookSchema.index({
  classNumber: 1,
  subject: 1,
  language: 1,
  chapterNumber: 1,
});

textbookSchema.index({
  classNumber: 1,
  subject: 1,
  language: 1,
  bookCode: 1,
});

export default mongoose.model("Textbook", textbookSchema);
