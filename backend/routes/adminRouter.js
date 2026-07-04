// backend/routes/adminRouter.js
import express from "express";
import {
  loginAdmin,
  registerAdmin,
  getPendingPDs,
  getPendingCDs,
  getApprovedPDs,
  getPDDetail,
  getCDDetail,
  processPDReview,
  processCDReview,
  getAdminDashboardStats,
  compileCurriculumBook,
  checkProgramReadiness,
  getPDVersionsForAdmin,
  getCDVersionsForAdmin,
  getGroupedCDReviews,
  getAllPDsForAdmin,
  // ─── NEW IMPORT ──────────────────────────────────────────────────────────
  downloadCurriculumBook,
} from "../controllers/adminController.js";
import authAdmin from "../middlewares/adminAuth.js";

const adminRouter = express.Router();

// Public routes
adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

// ─── PROTECTED ROUTES (require admin authentication) ─────────────────────
adminRouter.use(authAdmin);

// Dashboard
adminRouter.get("/dashboard-stats", getAdminDashboardStats);

// PD Reviews
adminRouter.get("/reviews/pds", getPendingPDs);
adminRouter.get("/approved/pds", getApprovedPDs);
adminRouter.get("/reviews/pd/:id", getPDDetail);
adminRouter.get("/reviews/pd/:programId/versions", getPDVersionsForAdmin);
adminRouter.put("/reviews/pd/:id", processPDReview);

// CD Reviews
adminRouter.get("/reviews/cds", getPendingCDs);
adminRouter.get("/reviews/cds/grouped", getGroupedCDReviews);
adminRouter.get("/reviews/cd/:id", getCDDetail);
adminRouter.get("/reviews/cd/:courseCode/versions", getCDVersionsForAdmin);
adminRouter.put("/reviews/cd/:id", processCDReview);

// Curriculum Compiler
adminRouter.get("/compiler/readiness/:programId", checkProgramReadiness);
adminRouter.get("/compiler/compile/:programId", compileCurriculumBook);

// ─── NEW: Download Curriculum Book (Merged with Cover PDF) ──────────────
adminRouter.get("/compiler/download/:programId", downloadCurriculumBook);

// Admin PD List
adminRouter.get("/pds/all", getAllPDsForAdmin);

export default adminRouter;