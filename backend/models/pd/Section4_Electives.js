import mongoose from "mongoose";

// Sub-schema for individual elective courses (Legacy 2024)
const ElectiveCourseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    credits: { type: Number, required: true },
    assignedCreater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creater",
      default: null,
    },
  },
  { _id: false },
);

// Sub-schema for Elective Groups (Legacy 2024)
const ElectiveGroupSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true },
    title: { type: String },
    courses: [ElectiveCourseSchema],
  },
  { _id: false },
);

const Section4Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true },
    version: { type: String, required: true },
    schemeYear: { type: String, default: "2024" }, // Discriminator

    // ─────────────────────────────────────────────────────────────
    // 2024 SCHEMA FIELDS (Legacy)
    // ─────────────────────────────────────────────────────────────
    professionalElectives: [ElectiveGroupSchema],
    openElectives: [ElectiveGroupSchema],

    // ─────────────────────────────────────────────────────────────
    // 2026 SCHEMA FIELDS (Polymorphic Institutional Data)
    // ─────────────────────────────────────────────────────────────
    technicalCompetencyCourses: [
      {
        code: String,
        title: String,
        description: String,
        credits: Number,
        resource: String,
      },
    ],
    programDeliveryAndAttainment: { type: String, default: "" },
    teachingLearningMethods: [{ type: String }],
    attendance: { type: String, default: "" },
    assessmentGrading: {
      description: { type: String, default: "" },
      components: [
        {
          name: String,
          weightage: Number,
        },
      ],
      gradeRules: { type: String, default: "" },
      passingCriteria: { type: String, default: "" },
    },
    awardOfDegree: { type: String, default: "" },
    studentSupport: [{ type: String }],
    qualityControlMeasures: [{ type: String }],
    notes: { type: String, default: "" },

    // --- Audit ---
    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section4Schema.index({ programId: 1, version: 1 }, { unique: true });
export default mongoose.model("PD_Section4_Electives", Section4Schema);
