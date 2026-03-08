// models/Creater.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
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

    // Profile fields
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

    /**
     * ASSIGNED DOCUMENTS
     * These store the ObjectIds of the documents this person is allowed to manage.
     */
    assigned_pd: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProgramDocument", // Links to your main ProgramDocument model
      },
    ],

    assigned_cd: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseDocument", // This will link to your upcoming CD model
      },
    ],

    role: {
      type: String,
      enum: ["creator", "reviewer", "admin"],
      default: "creator",
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

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
