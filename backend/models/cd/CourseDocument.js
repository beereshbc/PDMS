import mongoose from "mongoose";

const CourseDocumentSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    programName: { type: String },

    // Combined CD version (e.g., 1.0.0)
    cdVersion: { type: String, required: true },

    // --- References to Specific Section Versions ---
    section1_identity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CD_Section1_Identity",
      required: true,
    },
    section2_outcomes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CD_Section2_Outcomes",
      required: true,
    },
    section3_syllabus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CD_Section3_Syllabus",
      required: true,
    },
    section4_resources: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CD_Section4_Resources",
      required: true,
    },

    // --- Meta Data & Workflow ---
    status: {
      type: String,
      enum: ["Draft", "UnderReview", "Approved", "Archived"],
      default: "Draft",
    },

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
    approvalDate: { type: Date },
  },
  { timestamps: true },
);

// Prevent duplicate versions for the same course
CourseDocumentSchema.index({ courseCode: 1, cdVersion: 1 }, { unique: true });

export default mongoose.model("CourseDocument", CourseDocumentSchema);
