import mongoose from "mongoose";

const PDSchema = new mongoose.Schema({
  program_id: { type: String, required: true, index: true },
  program_name: { type: String, required: true },

  // SCHEMA VERSION TRACKING
  scheme_year: {
    type: String,
    required: true,
    enum: ["2024", "2026"],
  },

  version_no: { type: String, required: true },
  effective_ay: { type: String },
  total_credits: { type: Number, default: 160 },
  academic_credits: { type: Number, default: 130 },

  status: {
    type: String,
    enum: ["draft", "pending", "under_review", "approved", "rejected"],
    default: "draft",
  },
  change_summary: { type: String },
  review_comment: { type: String, default: "" },

  // Polymorphic JSON payload. The structure inside changes based on scheme_year
  pd_data: { type: mongoose.Schema.Types.Mixed, required: true },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creater",
    required: true,
  },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "Creater" },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  approved_at: { type: Date },

  previous_version: { type: mongoose.Schema.Types.ObjectId, ref: "PD" },
});

PDSchema.index(
  { program_id: 1, scheme_year: 1, version_no: 1 },
  { unique: true },
);

PDSchema.pre("save", function () {
  this.updated_at = Date.now();
});

export default mongoose.model("PD", PDSchema);
