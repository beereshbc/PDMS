import express from "express";
import { loginAdmin, registerAdmin } from "../controllers/adminController.js";

const adminRouter = express.Router();

// --- PUBLIC ROUTES ---

// Route to register a new admin (You can use this via Postman for the initial setup)
adminRouter.post("/register", registerAdmin);

// Route for admin login
adminRouter.post("/login", loginAdmin);

export default adminRouter;
