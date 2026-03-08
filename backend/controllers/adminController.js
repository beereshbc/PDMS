import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

// --- Register Admin ---
export const registerAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      college,
      faculty,
      school,
      department,
      programme,
      discipline,
      programId,
      programName,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password and name are required",
      });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Admin email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      college: college || "GM University",
      faculty,
      school,
      department,
      programme,
      discipline,
      programId,
      programName,
      role: "admin",
      status: "inactive", // CHANGED: Requires approval before they can login
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted. Await super-admin/developer approval.",
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// --- Login Admin ---
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (admin.blocked) {
      return res
        .status(403)
        .json({ success: false, message: "Admin account is blocked." });
    }

    // CHANGED: Specific message for pending approvals
    if (admin.status !== "active") {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Account pending approval. Please contact the system administrator.",
        });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Update last login timestamp
    admin.last_login = new Date();
    await admin.save();

    // Sign JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};
