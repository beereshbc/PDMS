import mongoose from "mongoose";

const CourseOutcomeSchema = new mongoose.Schema(
  {
    code: { type: String, default: "" }, // e.g. "CO1"
    description: { type: String, default: "" },
    mapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const Section2Schema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // ── Aims & Objectives (HTML strings from RichTextEditor) ─────────────────
    aimsSummary: { type: String, default: "" },
    objectives: { type: String, default: "" },

    // ── Course Outcomes ───────────────────────────────────────────────────────
    courseOutcomes: { type: [CourseOutcomeSchema], default: [] },
    courseOutcomesHtml: { type: String, default: "" }, // HTML table for display/print

    // ── Outcome Map (CO × PO/PSO) ─────────────────────────────────────────────
    outcomeMap: {
      raw: { type: String, default: "" }, // raw text from PDF
      matrix: { type: [[String]], default: [] }, // structured 2-D array
    },
    outcomeMapHtml: { type: String, default: "" }, // HTML table for display/print

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

Section2Schema.index({ courseCode: 1, version: 1 }, { unique: true });

export default mongoose.model("CD_Section2_Outcomes", Section2Schema);
