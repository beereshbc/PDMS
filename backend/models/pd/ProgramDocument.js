import mongoose from "mongoose";

const ProgramDocumentSchema = new mongoose.Schema(
  {
    // This ID groups all versions of the "CSE B.Tech" document together
    programCode: { type: String, required: true, index: true }, // e.g., "BTECH-CSE"
    schemeYear: { type: String, required: true }, // e.g., "2024"

    // The version of the COMBINED document (e.g., PD v1.0.5)
    // This increments if ANY section increments
    pdVersion: { type: String, required: true },

    // --- References to Specific Section Versions ---
    // We store the ObjectId of the specific version of the section
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
    effectiveAcademicYear: { type: String }, // e.g., "2024-25"
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

// Ensure we don't have duplicate versions for the same program scheme
ProgramDocumentSchema.index(
  { programCode: 1, schemeYear: 1, pdVersion: 1 },
  { unique: true },
);

export default mongoose.model("ProgramDocument", ProgramDocumentSchema);
