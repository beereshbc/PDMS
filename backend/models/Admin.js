import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    // --- AUTHENTICATION ---
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
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },

    // --- INSTITUTIONAL AFFILIATION ---
    college: { type: String, trim: true, default: "GM University" },
    faculty: { type: String, trim: true },
    school: { type: String, trim: true },
    department: { type: String, trim: true },

    // --- PROGRAMME DETAILS ---
    programme: { type: String, trim: true },
    discipline: { type: String, trim: true },
    programId: { type: String, trim: true },
    programName: { type: String, trim: true },

    // --- ROLE & ACCESS ---
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive", // CHANGED: Admins are now inactive by default pending approval
    },
    blocked: {
      type: Boolean,
      default: false, // Added to track security blocks
    },
    last_login: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Admin", adminSchema);
