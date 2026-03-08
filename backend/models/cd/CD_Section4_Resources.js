import mongoose from "mongoose";

const AssessmentWeightSchema = new mongoose.Schema(
  {
    co: { type: String, default: "" }, // e.g. "CO1"
    q1: { type: Number, default: 0 },
    q2: { type: Number, default: 0 },
    q3: { type: Number, default: 0 },
    t1: { type: Number, default: 0 },
    t2: { type: Number, default: 0 },
    t3: { type: Number, default: 0 },
    a1: { type: Number, default: 0 },
    a2: { type: Number, default: 0 },
    see: { type: Number, default: 0 },
    cie: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const Section4Schema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // ── Course Resources ──────────────────────────────────────────────────────
    resources: {
      textBooks: [{ type: String }],
      references: [{ type: String }],
      otherResources: [{ type: String }],
    },

    // ── Assessment Weight Distribution ────────────────────────────────────────
    assessmentWeight: { type: [AssessmentWeightSchema], default: [] },
    assessmentWeightHtml: { type: String, default: "" }, // HTML table for display/print

    // ── Grading (HTML string from RichTextEditor) ─────────────────────────────
    gradingCriterion: { type: String, default: "" },

    // ── Attainment Calculations (HTML strings) ────────────────────────────────
    attainmentCalculations: {
      recordingMarks: { type: String, default: "" },
      settingTargets: { type: String, default: "" },
    },

    // ── Other Details (HTML strings) ─────────────────────────────────────────
    otherDetails: {
      assignmentDetails: { type: String, default: "" },
      academicIntegrity: { type: String, default: "" },
    },

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

Section4Schema.index({ courseCode: 1, version: 1 }, { unique: true });

export default mongoose.model("CD_Section4_Resources", Section4Schema);
