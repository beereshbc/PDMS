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
  getGroupedCDReviews, // <-- NEW: Grouped CD Fetcher
  getAllPDsForAdmin, // <-- NEW: Fetch all PDs for admin
} from "../controllers/adminController.js";
import authAdmin from "../middlewares/adminAuth.js";

const adminRouter = express.Router();

adminRouter.post("/register", registerAdmin);
adminRouter.post("/login", loginAdmin);

// Protected
adminRouter.use(authAdmin);

adminRouter.get("/dashboard-stats", getAdminDashboardStats);
adminRouter.get("/reviews/pds", getPendingPDs);
adminRouter.get("/reviews/cds", getPendingCDs);
adminRouter.get("/reviews/cds/grouped", getGroupedCDReviews); // <-- NEW ROUTE
adminRouter.get("/approved/pds", getApprovedPDs);

adminRouter.get("/reviews/pd/:id", getPDDetail);
adminRouter.get("/reviews/pd/:programId/versions", getPDVersionsForAdmin);
adminRouter.put("/reviews/pd/:id", processPDReview);

adminRouter.get("/reviews/cd/:id", getCDDetail);
adminRouter.get("/reviews/cd/:courseCode/versions", getCDVersionsForAdmin);
adminRouter.put("/reviews/cd/:id", processCDReview);

adminRouter.get("/compiler/readiness/:programId", checkProgramReadiness);
adminRouter.get("/compiler/compile/:programId", compileCurriculumBook);
adminRouter.get("/pds/all", getAllPDsForAdmin);

export default adminRouter;
