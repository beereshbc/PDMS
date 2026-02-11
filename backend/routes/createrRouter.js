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

createrRouter.post("/register", registerCreater);
createrRouter.post("/login", loginCreater);

// PD Management
createrRouter.post("/pd/save", authCreater, createOrUpdatePD); // Intelligent save based on 'sectionsToUpdate'
createrRouter.get("/pd/versions/:programId", authCreater, getRecentVersions);
createrRouter.get("/pd/fetch/:id", authCreater, getPDById);
createrRouter.get("/pd/latest/:programId", authCreater, getLatestPD);

export default createrRouter;
