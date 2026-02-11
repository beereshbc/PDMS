import express from "express";
import {
  deleteCreator,
  devLogin,
  getAllCreators,
  updateCreatorStatus,
} from "../controllers/devController.js";

const devRouter = express.Router();

devRouter.post("/login", devLogin);
devRouter.get("/list", getAllCreators);
devRouter.put("/update/:id", updateCreatorStatus);
devRouter.delete("/delete/:id", deleteCreator);
export default devRouter;
