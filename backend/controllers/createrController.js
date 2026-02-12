import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Creater from "../models/Creater.js";

// Import Section Models
import ProgramDocument from "../models/ProgramDocument.js";
import Section1_Info from "../models/Section1_Info.js";
import Section2_Objectives from "../models/Section2_Objectives.js";
import Section3_Structure from "../models/Section3_Structure.js";
import Section4_Electives from "../models/Section4_Electives.js";

// --- REQUIRED IMPORTS FOR FILE PARSING ---
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AUTHENTICATION FUNCTIONS ---

export const registerCreater = async (req, res) => {
  try {
    const { email, password, name, role, status, ...otherDetails } = req.body;

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
      role: role || "creator",
      status: status || "inactive",
      ...otherDetails,
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
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const creater = await Creater.findOne({ email }).select("+password");

    if (!creater) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (creater.blocked) {
      return res
        .status(403)
        .json({ success: false, message: "Account blocked." });
    }

    if (creater.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "Account pending approval" });
    }

    const isMatch = await bcrypt.compare(password, creater.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: creater._id, role: creater.role },
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

// --- PARSING FUNCTION (FIXED) ---
export const uploadAndParsePD = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Resolve path to the Python script
    // __dirname is .../backend/controllers
    // .. goes to .../backend
    // scripts goes to .../backend/scripts
    const scriptPath = path.join(__dirname, "..", "scripts", "pd_parser.py");

    console.log(`Processing file: ${filePath}`);
    console.log(`Using script: ${scriptPath}`);

    const pythonProcess = spawn("python", [scriptPath, filePath]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Clean up uploaded file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      if (code !== 0) {
        console.error("Python Error:", errorString);
        return res.status(500).json({
          success: false,
          message:
            "Parsing failed. Ensure Python and pdfplumber are installed on the server.",
          details: errorString,
        });
      }

      try {
        const parsedData = JSON.parse(dataString);

        if (parsedData.error) {
          return res
            .status(400)
            .json({ success: false, message: parsedData.error });
        }

        res.json({ success: true, parsedData });
      } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Raw Output:", dataString);
        res
          .status(500)
          .json({ success: false, message: "Error processing parsed data" });
      }
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// --- PROGRAM DOCUMENT (PD) FUNCTIONS ---

// Helper to increment version string (e.g., "1.0.0" -> "1.0.1")
const incrementVersion = (version) => {
  if (!version) return "1.0.0";
  const parts = version.split(".");
  if (parts.length < 3) return "1.0.0";
  // Simple increment of patch version.
  parts[2] = parseInt(parts[2]) + 1;
  return parts.join(".");
};

/**
 * INTELLIGENT VERSION CONTROL LOGIC:
 * 1. Checks if it's a new program -> Creates everything v1.0.0
 * 2. If update ->
 * a. Fetches previous PD to get current Section IDs.
 * b. Checks 'sectionsToUpdate' array from frontend.
 * c. REUSES existing section IDs for sections NOT in the list.
 * d. CREATES new versions ONLY for sections in the list.
 * e. Creates new Master PD v1.0.X linking the mix of old and new sections.
 */
export const createOrUpdatePD = async (req, res) => {
  try {
    const {
      programId, // Identifier (e.g. 'BTECH-CSE')
      metaData, // { schemeYear, versionNo, effectiveAy, status }
      section1Data,
      section2Data,
      section3Data,
      section4Data,
      isNewProgram,
      sectionsToUpdate = [], // ['section2', 'section3'] or ['all']
    } = req.body;

    const creatorId = req.id || "Admin"; // From auth middleware

    let s1_Id, s2_Id, s3_Id, s4_Id;
    let newPdVersion = metaData.versionNo || "1.0.0";

    // --- SCENARIO 1: NEW PROGRAM ---
    if (isNewProgram) {
      console.log(`Creating New Program Document: ${programId}`);

      // Create all sections fresh
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

      s1_Id = s1._id;
      s2_Id = s2._id;
      s3_Id = s3._id;
      s4_Id = s4._id;
      newPdVersion = "1.0.0";
    } else {
      // --- SCENARIO 2: UPDATE EXISTING ---
      console.log(
        `Updating ${programId}. Changed Sections: ${sectionsToUpdate}`,
      );

      // 1. Get the Previous PD to find existing links
      const previousPD = await ProgramDocument.findOne({
        programCode: programId,
      }).sort({ createdAt: -1 });

      if (!previousPD) {
        // Fallback: If logic says update but no DB record exists, treat as new
        return createOrUpdatePD(
          { ...req, body: { ...req.body, isNewProgram: true } },
          res,
        );
      }

      // 2. Increment Version
      newPdVersion = incrementVersion(previousPD.pdVersion);

      // 3. Initialize IDs with the OLD ones (Default to reusing)
      s1_Id = previousPD.section1_info;
      s2_Id = previousPD.section2_objectives;
      s3_Id = previousPD.section3_structure;
      s4_Id = previousPD.section4_electives;

      const updateAll = sectionsToUpdate.includes("all");

      // 4. Create NEW versions ONLY for dirty sections

      // Section 1
      if (updateAll || sectionsToUpdate.includes("section1")) {
        const s1 = await Section1_Info.create({
          ...section1Data,
          programId,
          version: newPdVersion,
          createdBy: creatorId,
        });
        s1_Id = s1._id; // Link to new
      }

      // Section 2
      if (updateAll || sectionsToUpdate.includes("section2")) {
        const s2 = await Section2_Objectives.create({
          ...section2Data,
          programId,
          version: newPdVersion,
          createdBy: creatorId,
        });
        s2_Id = s2._id; // Link to new
      }

      // Section 3
      if (updateAll || sectionsToUpdate.includes("section3")) {
        const s3 = await Section3_Structure.create({
          ...section3Data,
          programId,
          version: newPdVersion,
          createdBy: creatorId,
        });
        s3_Id = s3._id; // Link to new
      }

      // Section 4
      if (updateAll || sectionsToUpdate.includes("section4")) {
        const s4 = await Section4_Electives.create({
          ...section4Data,
          programId,
          version: newPdVersion,
          createdBy: creatorId,
        });
        s4_Id = s4._id; // Link to new
      }
    }

    // --- FINAL STEP: CREATE MASTER SNAPSHOT ---
    const masterPD = await ProgramDocument.create({
      programCode: programId,
      schemeYear: metaData.schemeYear,
      pdVersion: newPdVersion,
      effectiveAcademicYear: metaData.effectiveAy,
      section1_info: s1_Id,
      section2_objectives: s2_Id,
      section3_structure: s3_Id,
      section4_electives: s4_Id,
      status: metaData.status || "Draft",
      createdBy: creatorId,
    });

    res.json({
      success: true,
      message: isNewProgram
        ? "Program Created Successfully"
        : `Program Updated to v${newPdVersion}`,
      version: newPdVersion,
      data: masterPD,
    });
  } catch (error) {
    console.error("PD Save Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Fetch the 5 most recent versions of a specific program for History Sidebar
export const getRecentVersions = async (req, res) => {
  try {
    const { programId } = req.params;
    const versions = await ProgramDocument.find({ programCode: programId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("pdVersion createdAt status schemeYear");
    res.json({ success: true, versions });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch full data for a specific Master PD ID (Used for loading history)
export const getPDById = async (req, res) => {
  try {
    const { id } = req.params;
    const pd = await ProgramDocument.findById(id)
      .populate("section1_info")
      .populate("section2_objectives")
      .populate("section3_structure")
      .populate("section4_electives");

    if (!pd) return res.json({ success: false, message: "Document not found" });

    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch the absolute latest version for a program Code (Used for 'Fetch Latest')
export const getLatestPD = async (req, res) => {
  try {
    const { programId } = req.params;
    const pd = await ProgramDocument.findOne({ programCode: programId })
      .sort({ createdAt: -1 })
      .populate("section1_info")
      .populate("section2_objectives")
      .populate("section3_structure")
      .populate("section4_electives");

    if (!pd) return res.json({ success: false, message: "No history found" });

    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const creatorId = req.id; // From auth middleware

    // 1. Get Counts
    const total = await ProgramDocument.countDocuments({
      createdBy: creatorId,
    });
    const drafts = await ProgramDocument.countDocuments({
      createdBy: creatorId,
      status: "Draft",
    });
    const underReview = await ProgramDocument.countDocuments({
      createdBy: creatorId,
      status: "UnderReview",
    });
    const approved = await ProgramDocument.countDocuments({
      createdBy: creatorId,
      status: "Approved",
    });

    // 2. Get 5 Most Recent Documents
    // Populate section1_info to get the Program Name
    const recentDocs = await ProgramDocument.find({ createdBy: creatorId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("section1_info", "programName");

    res.json({
      success: true,
      stats: {
        total,
        drafts,
        underReview,
        approved,
      },
      recentDocs,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
};
export const getCreatorHistory = async (req, res) => {
  try {
    const creatorId = req.id; // Extracted from auth middleware

    // Fetch all PDs created by this user
    // We strictly sort by updatedAt to show most recent work first
    const pds = await ProgramDocument.find({ createdBy: creatorId })
      .sort({ updatedAt: -1 })
      .populate("section1_info", "programName department"); // Only fetch needed fields

    res.json({
      success: true,
      count: pds.length,
      pds,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch document history" });
  }
};
