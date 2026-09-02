import mongoose from "mongoose";

const leagueMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    xp: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const leagueSchema = new mongoose.Schema(
  {
    week: {
      type: String,
      required: true,
    },

    tier: {
      type: String,
      enum: [
        "bronze",
        "silver",
        "gold",
        "diamond",
      ],
      default: "bronze",
    },

    members: {
      type: [leagueMemberSchema],
      default: [],
    },

    promotions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    demotions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    finalized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

leagueSchema.index(
  { week: 1, tier: 1 },
  { unique: true }
);

export default mongoose.model(
  "League",
  leagueSchema
);

