import mongoose from "mongoose";

// Sub-schema for individual courses (Remains exactly the same for backward compatibility)
const CourseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    credits: { type: Number, required: true },
    type: { type: String, default: "Theory" },
    category: { type: String, default: "Core" },
    assignedCreater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creater",
      default: null,
    },
  },
  { _id: false },
);

// NEW: Dynamic Category Schema to handle flexible groupings (2024 separate sections vs 2026 merged sections)
const SemesterCategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true }, // e.g., "Academic", "Professional Skills" (2026) or "Life Skills" (2024)
    totalCategoryCredits: { type: Number, default: 0 },
    courses: [CourseSchema],
  },
  { _id: false },
);

// Sub-schema for Semester
const SemesterSchema = new mongoose.Schema(
  {
    semNumber: { type: Number, required: true },
    totalCredits: { type: Number, default: 0 },

    // BACKWARD COMPATIBILITY: Legacy 2024 flat courses array
    // (Existing documents won't break)
    courses: [CourseSchema],

    // SCALABLE APPROACH: For 2026 and future schemas using grouped/merged sections
    categories: [SemesterCategorySchema],
  },
  { _id: false },
);

const Section3Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // Added schemaYear reference inside sections to easily validate sub-documents without populating parents
    schemeYear: { type: String, default: "2024" },

    creditDefinition: {
      lecture: { type: Number, default: 1 },
      tutorial: { type: Number, default: 1 },
      practical: { type: Number, default: 1 },
    },

    structureTable: [
      {
        category: { type: String },
        code: { type: String },
        credits: { type: Number },
      },
    ],
    totalProgramCredits: { type: Number, required: true },

    // The polymorphic semesters array
    semesters: [SemesterSchema],

    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section3Schema.index({ programId: 1, version: 1 }, { unique: true });

export default mongoose.model("PD_Section3_Structure", Section3Schema);
