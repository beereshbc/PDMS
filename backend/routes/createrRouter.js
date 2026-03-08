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
} from "../controllers/createrController.js";
import authCreater from "../middlewares/createrAuth.js";
import upload from "../middlewares/multer.js";

const createrRouter = express.Router();

// Public Routes
createrRouter.post("/register", registerCreater);
createrRouter.post("/login", loginCreater);
// Protected Routes
createrRouter.post("/pd/save", authCreater, createOrUpdatePD);
createrRouter.get("/pd/versions/:programId", authCreater, getRecentVersions);
createrRouter.get("/pd/fetch/:id", authCreater, getPDById);
createrRouter.get("/pd/latest/:programId", authCreater, getLatestPD);
createrRouter.post(
  "/pd/import",
  authCreater,
  upload.single("pdFile"),
  uploadAndParsePD,
);
createrRouter.get("/dashboard-stats", authCreater, getDashboardStats);
createrRouter.get("/pd/history", authCreater, getCreatorHistory);
createrRouter.get("/search", searchCreaters);
createrRouter.get("/profile", authCreater, getCreaterProfile);

export default createrRouter;
