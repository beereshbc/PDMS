import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Creater from "../models/Creater.js"; // Ensure this matches your Creator model file name

// Import Section Models
import ProgramDocument from "../models/ProgramDocument.js";
import Section1_Info from "../models/Section1_Info.js";
import Section2_Objectives from "../models/Section2_Objectives.js";
import Section3_Structure from "../models/Section3_Structure.js";
import Section4_Electives from "../models/Section4_Electives.js";

// --- AUTHENTICATION FUNCTIONS ---

export const registerCreater = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      mobile_no,
      aadhar,
      designation,
      college,
      school,
      faculty,
      programme,
      discipline,
      course,
      semester,
      category,
      role,
      status,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, password and name are required",
      });
    }

    const existing = await Creater.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Creater.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
      mobile_no,
      aadhar,
      designation,
      college,
      school,
      faculty,
      programme,
      discipline,
      course,
      semester,
      category,
      role: role || "creator",
      status: status || "inactive",
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted. Await admin approval.",
    });
  } catch (error) {
    console.error("Creater register error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginCreater = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const creater = await Creater.findOne({ email }).select("+password");

    if (!creater) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (creater.blocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked. Contact administrator.",
      });
    }

    if (creater.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account pending approval",
      });
    }

    const isMatch = await bcrypt.compare(password, creater.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: creater._id,
        role: creater.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      creater: {
        id: creater._id,
        email: creater.email,
        name: creater.name,
        role: creater.role,
      },
    });
  } catch (error) {
    console.error("Creater login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// --- PROGRAM DOCUMENT (PD) FUNCTIONS ---

// Helper to increment version string (e.g., "1.0.0" -> "1.0.1")
const incrementVersion = (version) => {
  if (!version) return "1.0.0";
  const parts = version.split(".");
  if (parts.length < 3) return "1.0.0";
  parts[2] = parseInt(parts[2]) + 1;
  return parts.join(".");
};

export const createOrUpdatePD = async (req, res) => {
  try {
    const {
      programId, // Used as programCode identifier in schema (e.g., 'BTECH-CSE')
      metaData, // Contains schemeYear, versionNo, etc.
      section1Data,
      section2Data,
      section3Data,
      section4Data,
      isNewProgram, // Boolean flag from frontend
    } = req.body;

    // Use ID from auth middleware, fallback to 'Admin' if testing without auth
    const creatorId = req.id || "Admin";

    let newSection1Id, newSection2Id, newSection3Id, newSection4Id;
    let newPdVersion = metaData.versionNo || "1.0.0";

    if (isNewProgram) {
      // --- CREATE NEW PROGRAM LOGIC ---
      console.log("Creating New Program Document:", programId);

      const s1 = await Section1_Info.create({
        ...section1Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });
      const s2 = await Section2_Objectives.create({
        ...section2Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });
      const s3 = await Section3_Structure.create({
        ...section3Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });
      const s4 = await Section4_Electives.create({
        ...section4Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });

      newSection1Id = s1._id;
      newSection2Id = s2._id;
      newSection3Id = s3._id;
      newSection4Id = s4._id;
      newPdVersion = "1.0.0";
    } else {
      // --- UPDATE EXISTING PROGRAM LOGIC (VERSION CONTROL) ---
      console.log("Updating Program Document:", programId);

      // 1. Get the Previous PD to find current version
      const previousPD = await ProgramDocument.findOne({
        programCode: programId,
      }).sort({ createdAt: -1 });

      if (!previousPD) {
        // Fallback if frontend said it's update but DB is empty
        newPdVersion = "1.0.0";
      } else {
        // Increment Version
        newPdVersion = incrementVersion(previousPD.pdVersion);
      }

      // 2. Create NEW Section Documents (Snapshot Pattern)
      // We create fresh copies of all sections for the new version to ensure immutability of history
      const s1 = await Section1_Info.create({
        ...section1Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      const s2 = await Section2_Objectives.create({
        ...section2Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      const s3 = await Section3_Structure.create({
        ...section3Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      const s4 = await Section4_Electives.create({
        ...section4Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });

      newSection1Id = s1._id;
      newSection2Id = s2._id;
      newSection3Id = s3._id;
      newSection4Id = s4._id;
    }

    // 3. Create the Master Program Document linking the new sections
    const masterPD = await ProgramDocument.create({
      programCode: programId,
      schemeYear: metaData.schemeYear,
      pdVersion: newPdVersion,
      effectiveAcademicYear: metaData.effectiveAy,
      section1_info: newSection1Id,
      section2_objectives: newSection2Id,
      section3_structure: newSection3Id,
      section4_electives: newSection4Id,
      status: metaData.status || "Draft",
      createdBy: creatorId,
    });

    res.json({
      success: true,
      message: isNewProgram
        ? `Program Document Created (v${newPdVersion})`
        : `Program Document Updated to v${newPdVersion}`,
      data: masterPD,
      version: newPdVersion,
    });
  } catch (error) {
    console.error("PD Save Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Fetch the 5 most recent versions of a specific program
export const getRecentVersions = async (req, res) => {
  try {
    const { programId } = req.params;

    // Find all documents with this program code, sort desc by creation, limit 5
    const versions = await ProgramDocument.find({ programCode: programId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("pdVersion createdAt status schemeYear effectiveAcademicYear");

    res.json({ success: true, versions });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch full data for a specific Master PD ID (Used for History View)
export const getPDById = async (req, res) => {
  try {
    const { id } = req.params;

    const pd = await ProgramDocument.findById(id)
      .populate("section1_info")
      .populate("section2_objectives")
      .populate("section3_structure")
      .populate("section4_electives");

    if (!pd) {
      return res.json({ success: false, message: "Document not found" });
    }

    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch the absolute latest version for a program ID (Used for "Fetch Latest")
export const getLatestPD = async (req, res) => {
  try {
    const { programId } = req.params;

    const pd = await ProgramDocument.findOne({ programCode: programId })
      .sort({ createdAt: -1 }) // Sort by newest
      .populate("section1_info")
      .populate("section2_objectives")
      .populate("section3_structure")
      .populate("section4_electives");

    if (!pd) {
      return res.json({
        success: false,
        message: "No history found for this program",
      });
    }

    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
