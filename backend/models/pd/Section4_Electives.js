import mongoose from "mongoose";

// Sub-schema for individual elective courses
const ElectiveCourseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    credits: { type: Number, required: true },

    // --- NEW: Assigned Creator for the CD ---
    assignedCreater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creater",
      default: null,
    },
  },
  { _id: false },
);

// Sub-schema for Elective Groups (e.g., Professional Elective - 1)
const ElectiveGroupSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true },
    title: { type: String }, // e.g., "Professional Elective - 1"
    courses: [ElectiveCourseSchema],
  },
  { _id: false },
);

const Section4Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true },
    version: { type: String, required: true },

    // --- Professional Electives ---
    professionalElectives: [ElectiveGroupSchema],

    // --- Open Electives ---
    openElectives: [ElectiveGroupSchema],

    // --- Audit ---
    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

Section4Schema.index({ programId: 1, version: 1 }, { unique: true });

export default mongoose.model("PD_Section4_Electives", Section4Schema);
