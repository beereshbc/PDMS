import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const authAdmin = async (req, res, next) => {
  try {
    // 1. Extract token from standard 'Authorization' header OR custom 'admintoken' header
    let token = req.headers.admintoken;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Verify Role
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied: Not an Admin." });
    }

    // 5. Find Admin & verify status
    const admin = await Admin.findOne({
      _id: decoded.id,
      status: "active",
      blocked: false,
    }).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found, or account inactive/blocked.",
      });
    }

    // 6. Attach admin to request and proceed
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please login again.",
    });
  }
};

export default authAdmin;
