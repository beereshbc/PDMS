import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Creater from "../models/Creater.js";
import Admin from "../models/Admin.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEV AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export const devLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isEmailValid = email === process.env.DEV_EMAIL;
    const isPasswordValid = password === process.env.DEV_CIPHER;

    if (!isEmailValid || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid System ID or Access Cipher",
      });
    }

    const token = jwt.sign(
      { role: "developer", access: "root" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      success: true,
      message: "Terminal Access Granted",
      token,
    });
  } catch (error) {
    console.error("Dev Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during authentication",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DASHBOARD STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getDevDashboardStats = async (req, res) => {
  try {
    const totalCreators = await Creater.countDocuments({});
    const totalAdmins = await Admin.countDocuments({});

    res.status(200).json({
      success: true,
      stats: {
        totalAdmins,
        totalCreators,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CREATOR MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const getAllCreators = async (req, res) => {
  try {
    const creators = await Creater.find({})
      .sort({ createdAt: -1 }) // Make sure this matches your schema timestamps
      .select("-password");

    res.status(200).json({ success: true, creators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCreator = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      mobile_no,
      aadhar,
      designation,
      category,
      college,
      faculty,
      school,
      department,
      programme,
      discipline,
      course,
      programId,
      programName,
      status,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password and name are required",
      });
    }

    const existing = await Creater.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Creator email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCreator = await Creater.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      mobile_no,
      aadhar,
      designation,
      category,
      college: college || "GM University",
      faculty,
      school,
      department,
      programme,
      discipline,
      course: course || discipline || department,
      programId,
      programName,
      role: "creator",
      status: status || "active", // Dev can set active/inactive right away
    });

    res.status(201).json({
      success: true,
      message: `Creator ${newCreator.name} created successfully.`,
    });
  } catch (error) {
    console.error("Dev Add Creator error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create Creator" });
  }
};

export const updateCreatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedCreator = await Creater.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Creator updated successfully",
      creator: updatedCreator,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCreator = async (req, res) => {
  try {
    await Creater.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Creator deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({})
      .sort({ createdAt: -1 })
      .select("-password");

    res.status(200).json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAdmin = async (req, res) => {
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
      status,
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

    const newAdmin = await Admin.create({
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
      status: status || "active", // Can set active/inactive right away
    });

    res.status(201).json({
      success: true,
      message: `Admin ${newAdmin.name} created successfully.`,
    });
  } catch (error) {
    console.error("Dev Add Admin error:", error);
    res.status(500).json({ success: false, message: "Failed to create Admin" });
  }
};

export const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
