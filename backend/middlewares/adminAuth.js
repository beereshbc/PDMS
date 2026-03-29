import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const authAdmin = async (req, res, next) => {
  try {
    const { admintoken } = req.headers;

    if (!admintoken) {
      return res
        .status(401)
        .json({
          success: false,
          message: "No token provided, authorization denied",
        });
    }

    const decoded = jwt.verify(admintoken, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied: Not an Admin." });
    }

    const admin = await Admin.findOne({
      _id: decoded.id,
      status: "active",
      blocked: false,
    }).select("-password");

    if (!admin) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Admin not found, or account inactive/blocked.",
        });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error.message);
    return res
      .status(401)
      .json({
        success: false,
        message: "Session expired or invalid token. Please login again.",
      });
  }
};

export default authAdmin;
