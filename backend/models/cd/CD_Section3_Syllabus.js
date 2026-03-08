import mongoose from "mongoose";

const TeachingPlanSchema = new mongoose.Schema(
  {
    number: { type: String, default: "" }, // lecture / session number
    topic: { type: String, default: "" },
    slides: { type: String, default: "" },
    videos: { type: String, default: "" },
  },
  { _id: false },
);

const Section3Schema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // ── Syllabus (HTML string from RichTextEditor) ────────────────────────────
    courseContent: { type: String, default: "" },

    // ── Lecture / Teaching Schedule ───────────────────────────────────────────
    teaching: { type: [TeachingPlanSchema], default: [] },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creater",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section3Schema.index({ courseCode: 1, version: 1 }, { unique: true });

export default mongoose.model("CD_Section3_Syllabus", Section3Schema);
