import jwt from "jsonwebtoken";
import Creater from "../models/Creater.js";

export const devLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verify Email against ENV
    const isEmailValid = email === process.env.DEV_EMAIL;

    // 2. Verify Password (Cipher) against ENV
    const isPasswordValid = password === process.env.DEV_CIPHER;

    if (!isEmailValid || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid System ID or Access Cipher",
      });
    }

    // 3. Create JWT Token
    // We use a specific payload to identify this as a 'developer' session
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
export const getAllCreators = async (req, res) => {
  try {
    const creators = await Creater.find({})
      .sort({ created_at: -1 })
      .select("-password");

    res.status(200).json({ success: true, creators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCreatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., { status: 'inactive' } or { blocked: true }

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
