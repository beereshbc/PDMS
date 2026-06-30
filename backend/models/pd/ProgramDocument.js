import mongoose from "mongoose";

const ProgramDocumentSchema = new mongoose.Schema(
  {
    programCode: { type: String, required: true, index: true }, // e.g., "BTECH-CSE"

    // SCHEMA VERSION TRACKING: Crucial for routing parsers and frontend rendering
    schemeYear: {
      type: String,
      required: true,
      enum: ["2024", "2026"], // Easily expandable for future schemas (e.g., "2027")
      default: "2026",
    },

    pdVersion: { type: String, required: true },

    // --- References to Specific Section Versions ---
    section1_info: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PD_Section1_Info",
      required: true,
    },
    section2_objectives: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PD_Section2_Objectives",
      required: true,
    },
    section3_structure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PD_Section3_Structure",
      required: true,
    },
    section4_electives: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PD_Section4_Electives",
      required: true,
    },

    // --- Meta Data ---
    effectiveAcademicYear: { type: String },
    status: {
      type: String,
      enum: ["Draft", "UnderReview", "Approved", "Archived"],
      default: "Draft",
    },

    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    approvalDate: { type: Date },
  },
  { timestamps: true },
);

ProgramDocumentSchema.index(
  { programCode: 1, schemeYear: 1, pdVersion: 1 },
  { unique: true },
);

export default mongoose.model("ProgramDocument", ProgramDocumentSchema);
