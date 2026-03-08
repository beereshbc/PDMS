import express from "express";
import {
  createOrUpdateCD,
  getRecentVersions,
  getCDById,
  getLatestCD,
  uploadAndParseCD,
  getCDDashboardStats,
  getCDCreatorHistory,
} from "../controllers/cdCreaterController.js";
import authCreater from "../middlewares/createrAuth.js";
import upload from "../middlewares/multer.js";

const cdCreaterRouter = express.Router();

cdCreaterRouter.post("/save", authCreater, createOrUpdateCD);
cdCreaterRouter.get("/versions/:courseCode", authCreater, getRecentVersions);
cdCreaterRouter.get("/fetch/:id", authCreater, getCDById);
cdCreaterRouter.get("/latest/:courseCode", authCreater, getLatestCD);

// Wrapped Multer upload to gracefully handle File size/type errors
cdCreaterRouter.post(
  "/import",
  authCreater,
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

cdCreaterRouter.get("/dashboard-stats", authCreater, getCDDashboardStats);
cdCreaterRouter.get("/history", authCreater, getCDCreatorHistory);

export default cdCreaterRouter;
