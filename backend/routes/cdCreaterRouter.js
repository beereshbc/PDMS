import express from "express";
import {
  createOrUpdateCD,
  getRecentVersions,
  getCDById,
  getLatestCD,
  uploadAndParseCD,
  getCDDashboardStats,
  getCDCreatorHistory,
  getAdminsForReview,
  getAssignedCDs, // <-- NEW
} from "../controllers/cdCreaterController.js";
import authCreater from "../middlewares/createrAuth.js";
import upload from "../middlewares/multer.js";

const cdCreaterRouter = express.Router();

// ── Protected Routes (Requires Creator JWT) ─────────────────────────────────
cdCreaterRouter.use(authCreater);

cdCreaterRouter.post("/save", createOrUpdateCD);
cdCreaterRouter.get("/history", getCDCreatorHistory);
cdCreaterRouter.get("/dashboard-stats", getCDDashboardStats);
cdCreaterRouter.get("/review-admins", getAdminsForReview);

// <-- NEW: Fetch courses assigned to this creator in PDs
cdCreaterRouter.get("/assigned", getAssignedCDs);

cdCreaterRouter.get("/versions/:courseCode", getRecentVersions);
cdCreaterRouter.get("/fetch/:id", getCDById);
cdCreaterRouter.get("/latest/:courseCode", getLatestCD);

// Wrapped Multer upload to gracefully handle File size/type errors
cdCreaterRouter.post(
  "/import",
  (req, res, next) => {
    upload.single("cdFile")(req, res, (err) => {
      if (err) {
        console.error("Multer Upload Error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  uploadAndParseCD,
);

export default cdCreaterRouter;
