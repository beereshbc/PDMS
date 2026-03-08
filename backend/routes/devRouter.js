import express from "express";
import {
  devLogin,
  getDevDashboardStats,
  getAllCreators,
  addCreator,
  updateCreatorStatus,
  deleteCreator,
  getAllAdmins,
  addAdmin,
  updateAdminStatus,
  deleteAdmin,
} from "../controllers/devController.js";
import authDev from "../middlewares/devAuth.js";

const devRouter = express.Router();

// Public Route
devRouter.post("/login", devLogin);

// Protected Routes (Require devtoken)
devRouter.use(authDev);

devRouter.get("/dashboard-stats", getDevDashboardStats);

// Creator Routes
devRouter.get("/list", getAllCreators);
devRouter.post("/creators", addCreator);
devRouter.put("/update/:id", updateCreatorStatus);
devRouter.delete("/delete/:id", deleteCreator);

// Admin Routes
devRouter.get("/admins", getAllAdmins);
devRouter.post("/admins", addAdmin);
devRouter.put("/admins/:id", updateAdminStatus);
devRouter.delete("/admins/:id", deleteAdmin);

export default devRouter;
