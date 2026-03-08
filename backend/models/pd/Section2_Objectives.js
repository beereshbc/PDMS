import mongoose from "mongoose";

const Section2Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // --- Program Overview ---
    programOverview: { type: String, required: true }, // Long text field

    // --- Objectives & Outcomes ---
    // Using array of strings for flexibility
    peos: [{ type: String }], // Program Educational Objectives
    pos: [{ type: String }], // Program Outcomes (Graduate Attributes)
    psos: [{ type: String }], // Program Specific Outcomes

    // --- Audit ---
    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section2Schema.index({ programId: 1, version: 1 }, { unique: true });

export default mongoose.model("PD_Section2_Objectives", Section2Schema);
