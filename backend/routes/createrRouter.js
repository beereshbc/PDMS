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
} from "../controllers/createrController.js";
import authCreater from "../middlewares/createrAuth.js";
import upload from "../middlewares/multer.js";

const createrRouter = express.Router();

createrRouter.post("/register", registerCreater);
createrRouter.post("/login", loginCreater);

// PD Management
createrRouter.post("/pd/save", authCreater, createOrUpdatePD); // Intelligent save based on 'sectionsToUpdate'
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

export default createrRouter;
