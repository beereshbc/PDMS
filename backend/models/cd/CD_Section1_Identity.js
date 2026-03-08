import mongoose from "mongoose";

// ── Nested identity sub-document ─────────────────────────────────────────────
const IdentitySubSchema = new mongoose.Schema(
  {
    courseCode: { type: String, default: "" },
    courseTitle: { type: String, default: "" },
    programCode: { type: String, default: "" },
    programTitle: { type: String, default: "" },
    schoolCode: { type: String, default: "" },
    schoolTitle: { type: String, default: "" },
    departmentCode: { type: String, default: "" },
    department: { type: String, default: "" },
    facultyCode: { type: String, default: "" },
    facultyTitle: { type: String, default: "" },
    offeringDepartment: { type: String, default: "" },
    facultyMember: { type: String, default: "" },
    semesterDuration: { type: String, default: "" },
    totalHours: { type: Number, default: 0 },
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────
const Section1Schema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, index: true },
    version: { type: String, required: true },

    identity: { type: IdentitySubSchema, default: () => ({}) },

    credits: {
      L: { type: Number, default: 0 },
      T: { type: Number, default: 0 },
      P: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
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

Section1Schema.index({ courseCode: 1, version: 1 }, { unique: true });

export default mongoose.model("CD_Section1_Identity", Section1Schema);
