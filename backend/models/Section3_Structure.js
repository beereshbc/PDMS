import mongoose from "mongoose";

// Sub-schema for individual courses
const CourseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    credits: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "Theory",
        "Lab",
        "Theory + Lab",
        "Project",
        "Seminar",
        "Practical",
        "Internship",
      ],
      default: "Theory",
    },
    category: { type: String, default: "Core" }, // Core, Competency, Life Skills, etc.
  },
  { _id: false },
);

// Sub-schema for Semester
const SemesterSchema = new mongoose.Schema(
  {
    semNumber: { type: Number, required: true },
    courses: [CourseSchema],
    totalCredits: { type: Number, default: 0 },
  },
  { _id: false },
);

const Section3Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // --- Credit Definitions ---
    creditDefinition: {
      lecture: { type: Number, default: 1 },
      tutorial: { type: Number, default: 1 },
      practical: { type: Number, default: 1 },
    },

    // --- Programme Structure (The Summary Table) ---
    structureTable: [
      {
        category: { type: String }, // e.g., "Program-Core courses"
        code: { type: String }, // e.g., "SDTCD"
        credits: { type: Number },
      },
    ],
    totalProgramCredits: { type: Number, required: true },

    // --- Semester Wise Curriculum ---
    semesters: [SemesterSchema],

    // --- Audit ---
    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section3Schema.index({ programId: 1, version: 1 }, { unique: true });

export default mongoose.model("PD_Section3_Structure", Section3Schema);
