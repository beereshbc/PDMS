import mongoose from "mongoose";

const Section1Schema = new mongoose.Schema(
  {
    programId: { type: String, required: true, index: true }, // Links all versions of this section
    version: { type: String, required: true }, // e.g., "1.0.0", "1.0.1"

    // --- Organizational Details ---
    faculty: { type: String, default: "Engineering and Technology (FET)" },
    school: {
      type: String,
      default: "School of Computer Science and Technology (SCST)",
    },
    department: { type: String, required: true },
    programName: { type: String, required: true },

    // --- Key Personnel ---
    directorOfSchool: { type: String },
    headOfDepartment: { type: String },

    // --- Award Details ---
    awardTitle: { type: String, required: true },
    modeOfStudy: { type: String, default: "Full Time" },
    awardingInstitution: { type: String, default: "GM University" },
    jointAward: { type: String, default: "Not Applicable" },
    teachingInstitution: {
      type: String,
      default: "Faculty of Engineering and Technology, GM University",
    },

    // --- Dates & Approvals (Meta) ---
    dateOfProgramSpecs: { type: String },
    dateOfCourseApproval: { type: String, default: "---" },
    nextReviewDate: { type: String, default: "---" },
    approvingRegulatingBody: { type: String, default: "---" },

    // --- Accreditation ---
    accreditedBody: { type: String, default: "---" },
    gradeAwarded: { type: String, default: "---" },
    accreditationValidity: { type: String, default: "---" },
    programBenchmark: { type: String, default: "N/A" },

    // --- Audit ---
    createdBy: { type: String, required: true },
    approvedBy: { type: String, default: null },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index to ensure version uniqueness per program
Section1Schema.index({ programId: 1, version: 1 }, { unique: true });

export default mongoose.model("PD_Section1_Info", Section1Schema);
