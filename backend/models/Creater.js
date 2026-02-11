// models/Creater.js
import mongoose from "mongoose";

const createrSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // profile fields (not used during login)
    name: String,
    mobile_no: String,
    college: String,
    faculty: String,
    school: String,
    programme: String,
    course: String,
    discipline: String,
    category: String,
    designation: String,
    aadhar: { type: String, select: false },

    role: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    blocked: {
      type: Boolean,
      default: false,
    },

    blocked_reason: String,
    blocked_at: Date,
    blocked_by: String,

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

const Creater = mongoose.model("Creater", createrSchema);
export default Creater;
