import express from "express";
import {
  registerCreater,
  loginCreater,
  createOrUpdatePD,
  getRecentVersions,
  getPDById,
  getLatestPD,
  uploadAndParsePD,
  getDashboardStats,
  getCreatorHistory,
  searchCreaters,
  getCreaterProfile,
  getAdminsForReview,
} from "../controllers/createrController.js";
import authCreater from "../middlewares/createrAuth.js";
import upload from "../middlewares/multer.js";

const createrRouter = express.Router();

// ── Public Routes
createrRouter.post("/register", registerCreater);
createrRouter.post("/login", loginCreater);

// ── Protected Routes
createrRouter.use(authCreater);

createrRouter.get("/profile", getCreaterProfile);
createrRouter.get("/dashboard-stats", getDashboardStats);
createrRouter.get("/search", searchCreaters);

// PD Specific
createrRouter.post("/pd/save", createOrUpdatePD);
createrRouter.get("/pd/history", getCreatorHistory);
createrRouter.get("/pd/versions/:programId", getRecentVersions);
createrRouter.get("/pd/fetch/:id", getPDById);
createrRouter.get("/pd/latest/:programId", getLatestPD);
createrRouter.get("/pd/review-admins", getAdminsForReview);

// Parser
createrRouter.post("/pd/import", upload.single("pdFile"), uploadAndParsePD);

export default createrRouter;
