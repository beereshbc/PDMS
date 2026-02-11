// models/PD.js
import mongoose from "mongoose";

const PDSchema = new mongoose.Schema({
  // Basic Info
  program_id: {
    type: String,
    required: true,
    index: true,
  },
  program_name: {
    type: String,
    required: true,
  },
  scheme_year: {
    type: String,
    required: true,
  },
  version_no: {
    type: String,
    required: true,
  },
  effective_ay: {
    type: String,
  },
  total_credits: {
    type: Number,
    default: 160,
  },
  academic_credits: {
    type: Number,
    default: 130,
  },

  // Status & Workflow
  status: {
    type: String,
    enum: ["draft", "pending", "under_review", "approved", "rejected"],
    default: "draft",
  },
  change_summary: {
    type: String,
  },

  // Complete PD Data (JSON structure)
  pd_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creater",
    required: true,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creater",
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Admin/Director
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  approved_at: {
    type: Date,
  },

  // Version History
  previous_version: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PD",
  },
});

// Compound index for unique version per program+scheme
PDSchema.index(
  { program_id: 1, scheme_year: 1, version_no: 1 },
  { unique: true },
);

// Update timestamp on save
PDSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const PD = mongoose.model("PD", PDSchema);
export default PD;
