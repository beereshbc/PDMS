import mongoose from "mongoose";

const createrSchema = new mongoose.Schema(
  {
    // ── AUTHENTICATION ─────────────────────────────────────────────────────
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      // NOTE: explicitly select: false is NOT set here so that
      // loginCreater can do .select("+password") when needed.
      // Never return password in any other query.
    },

    // ── PERSONAL DETAILS ──────────────────────────────────────────────────
    name: { type: String, trim: true },
    mobile_no: { type: String, trim: true },
    designation: { type: String, trim: true }, // "Assistant Professor", etc.
    category: { type: String, trim: true }, // "Teaching Faculty", etc.
    aadhar: { type: String, select: false }, // never returned by default

    // ── INSTITUTIONAL AFFILIATION ─────────────────────────────────────────
    // Populated from the DB-driven cascading selects at registration.
    // Values must match what is stored in Section1_Info so that
    // CreatePD.jsx → buildProgramsFromProfile() can derive the program list.

    college: { type: String, trim: true }, // e.g. "GM University"
    faculty: { type: String, trim: true }, // e.g. "Engineering and Technology (FET)"
    school: { type: String, trim: true }, // e.g. "School of Computer Science and Technology (SCST)"
    department: { type: String, trim: true }, // e.g. "Computer Science & Engineering"

    // ── PROGRAMME / DISCIPLINE ────────────────────────────────────────────
    // These drive the program dropdown in CreatePD.jsx.

    programme: { type: String, trim: true }, // degree label e.g. "B.Tech"
    discipline: { type: String, trim: true }, // e.g. "Computer Science & Engineering"
    course: { type: String, trim: true }, // legacy alias — kept for backward compatibility

    // ── PROGRAMME IDENTITY (from Section1_Info) ───────────────────────────
    // programId  → the exact programId stored in Section1_Info
    //              e.g. "BTECH-CSE"
    //              CreatePD uses this to load version history and to set
    //              metaData.programCode when the PD manager opens.
    // programName → human-readable full programme name
    //               e.g. "Computer Science & Engineering"

    programId: { type: String, trim: true },
    programName: { type: String, trim: true },

    // ── ASSIGNED DOCUMENTS ────────────────────────────────────────────────
    assigned_pd: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProgramDocument",
      },
    ],
    assigned_cd: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseDocument",
      },
    ],

    // ── ROLE & ACCESS ─────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["creator"],
      default: "creator",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive", // admin must activate after registration
    },
    blocked: { type: Boolean, default: false },
    blocked_reason: { type: String },
    blocked_at: { type: Date },
    blocked_by: { type: String },

    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "last_updated",
    },
  },
);

// ── INDEXES for common queries ───────────────────────────────────────────────
createrSchema.index({ programId: 1 });
createrSchema.index({ faculty: 1, school: 1 });
createrSchema.index({ status: 1, blocked: 1 });

const Creater = mongoose.model("Creater", createrSchema);
export default Creater;
