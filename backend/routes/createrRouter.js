import express from "express";
import {
  registerCreater,
  loginCreater,
  createOrUpdatePD,
  getRecentVersions,
  getPDById,
  getLatestPD,
} from "../controllers/createrController.js";
import authCreater from "../middlewares/createrAuth.js";

const createrRouter = express.Router();

// --- Auth Routes ---
createrRouter.post("/register", registerCreater);
createrRouter.post("/login", loginCreater);

// --- PD Management Routes ---
// Save or Update PD (Versioning logic handles differentiation)
createrRouter.post("/pd/save", authCreater, createOrUpdatePD);

// Get list of last 5 versions for history dropdown
createrRouter.get("/pd/versions/:programId", authCreater, getRecentVersions);

// Get specific PD version by MongoDB _id (History selection)
createrRouter.get("/pd/fetch/:id", authCreater, getPDById);

// Get the absolute latest PD for a program code (Quick load)
createrRouter.get("/pd/latest/:programId", authCreater, getLatestPD);

export default createrRouter;
