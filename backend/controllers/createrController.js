import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Creater from "../models/Creater.js";
import ProgramDocument from "../models/pd/ProgramDocument.js";
import Section1_Info from "../models/pd/Section1_Info.js";
import Section2_Objectives from "../models/pd/Section2_Objectives.js";
import Section3_Structure from "../models/pd/Section3_Structure.js";
import Section4_Electives from "../models/pd/Section4_Electives.js";

// --- REQUIRED IMPORTS FOR FILE PARSING ---
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// NEW: PUBLIC INSTITUTIONAL DROPDOWN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
export const registerCreater = async (req, res) => {
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
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Creater.create({
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
      status: "inactive",
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted. Await admin approval.",
    });
  } catch (error) {
    console.error("registerCreater error:", error);
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

export const getCreaterProfile = async (req, res) => {
  try {
    const creater = await Creater.findById(req.id).select(
      "name email mobile_no college faculty school department programme discipline course programId programName designation category",
    );
    if (!creater)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, profile: creater });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// [ ... Keep your existing createOrUpdatePD, uploadAndParsePD, getDashboardStats etc ... ]

export const searchCreaters = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { status: "active" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { discipline: searchRegex },
      ];
    }

    const creaters = await Creater.find(query)
      .select("name email discipline _id")
      .limit(20);

    const formattedCreaters = creaters.map((c) => ({
      id: c._id,
      name: c.name || "Unknown Name",
      email: c.email || "No Email",
      dept: c.discipline || "No Dept",
    }));

    res.status(200).json({ success: true, creaters: formattedCreaters });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while searching creators",
    });
  }
};

export const uploadAndParsePD = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const filePath = req.file.path;
  let responseSent = false;

  const cleanupFile = () => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Cleanup error", e);
      }
    }
  };

  try {
    const scriptPath = path.join(__dirname, "..", "scripts", "pd_parser.py");
    const pythonCommand =
      process.env.NODE_ENV === "production" ? "python3" : "python";

    // Check script exists
    if (!fs.existsSync(scriptPath)) {
      cleanupFile();
      return res
        .status(500)
        .json({ success: false, message: "Parser script missing." });
    }

    const pythonProcess = spawn(pythonCommand, [scriptPath, filePath]);

    let dataString = "";
    let errorString = "";

    // INCREASE TIMEOUT TO 60 SECONDS for large files
    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        pythonProcess.kill("SIGKILL");
        responseSent = true;
        cleanupFile();
        res
          .status(504)
          .json({
            success: false,
            message:
              "Parsing timed out. The PDF is too large for the current server limits.",
          });
      }
    }, 60000);

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });
    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      cleanupFile();
      if (!responseSent) {
        responseSent = true;
        res
          .status(500)
          .json({
            success: false,
            message: "Python failed to start",
            details: error.message,
          });
      }
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      cleanupFile();

      if (responseSent) return;
      responseSent = true;

      if (code !== 0) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Parsing failed",
            details: errorString,
          });
      }

      try {
        const jsonStartIndex = dataString.indexOf("{");
        const jsonEndIndex = dataString.lastIndexOf("}") + 1;
        if (jsonStartIndex === -1) throw new Error("No JSON found");

        const parsedData = JSON.parse(
          dataString.slice(jsonStartIndex, jsonEndIndex),
        );
        res.json({ success: true, parsedData });
      } catch (e) {
        res
          .status(500)
          .json({
            success: false,
            message: "Invalid data format from parser",
            raw: dataString,
          });
      }
    });
  } catch (error) {
    cleanupFile();
    if (!responseSent)
      res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Helper to increment version string (e.g., "1.0.0" -> "1.0.1")
const incrementVersion = (version) => {
  if (!version) return "1.0.0";
  const parts = version.split(".");
  if (parts.length < 3) return "1.0.0";
  parts[2] = parseInt(parts[2]) + 1;
  return parts.join(".");
};

/**
 * INTELLIGENT PD VERSION CONTROL LOGIC:
 * 1. New Program -> Creates v1.0.0
 * 2. Workflow Update -> Updates Assignments/Status in-place (No Version Bump)
 * 3. Draft Update -> Updates content in-place without bumping version.
 * 4. Content Update on Approved/UnderReview -> Creates new sections and bumps version.
 */
export const createOrUpdatePD = async (req, res) => {
  try {
    const {
      programId,
      metaData,
      section1Data,
      section2Data,
      section3Data,
      section4Data,
      isNewProgram,
      sectionsToUpdate = [],
      isWorkflowUpdate = false, // FLAG: Set true if ONLY assigning users or changing status
    } = req.body;

    const creatorId = req.id || "Admin"; // From auth middleware

    let s1_Id, s2_Id, s3_Id, s4_Id;
    let newPdVersion = metaData.versionNo || "1.0.0";

    const updateAll = sectionsToUpdate.includes("all");

    // --- DATA MAPPING HELPER ---
    const mapCourses = (courses = []) => {
      return courses.map((c) => ({
        code: c.code,
        title: c.title,
        credits: c.credits,
        type: c.type,
        category: c.category,
        assignedCreater: c.assigneeId || null,
      }));
    };

    const mapElectiveGroups = (groups = []) => {
      return groups.map((g) => ({
        semester: g.semester,
        title: g.title,
        courses: mapCourses(g.courses),
      }));
    };

    const mappedSection3Data = section3Data
      ? {
          ...section3Data,
          semesters: section3Data.semesters?.map((sem) => ({
            semNumber: sem.semNumber,
            courses: mapCourses(sem.courses),
          })),
        }
      : {};

    const mappedSection4Data = section4Data
      ? {
          ...section4Data,
          professionalElectives: mapElectiveGroups(
            section4Data.professionalElectives,
          ),
          openElectives: mapElectiveGroups(section4Data.openElectives),
        }
      : {};

    // --- SCENARIO 1: NEW PROGRAM DOCUMENT ---
    if (isNewProgram) {
      console.log(`Creating New Program Document: ${programId}`);

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
        ...mappedSection3Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });
      const s4 = await Section4_Electives.create({
        ...mappedSection4Data,
        programId,
        version: "1.0.0",
        createdBy: creatorId,
      });

      const masterPD = await ProgramDocument.create({
        programCode: programId,
        schemeYear: metaData.schemeYear,
        pdVersion: "1.0.0",
        effectiveAcademicYear: metaData.effectiveAy,
        section1_info: s1._id,
        section2_objectives: s2._id,
        section3_structure: s3._id,
        section4_electives: s4._id,
        status: metaData.status || "Draft",
        createdBy: creatorId,
      });

      return res.json({
        success: true,
        message: "Program Created Successfully",
        version: "1.0.0",
        data: masterPD,
      });
    }

    // --- SCENARIO 2: UPDATE EXISTING PROGRAM ---
    console.log(`Updating ${programId}. Changed Sections: ${sectionsToUpdate}`);

    const previousPD = await ProgramDocument.findOne({
      programCode: programId,
    }).sort({ createdAt: -1 });

    if (!previousPD) {
      // Fallback: If DB record doesn't exist somehow, create as new
      return createOrUpdatePD(
        { ...req, body: { ...req.body, isNewProgram: true } },
        res,
      );
    }

    // --- 2A: WORKFLOW/ASSIGNMENT UPDATE ONLY (NO VERSION BUMP) ---
    if (isWorkflowUpdate) {
      console.log(
        `Workflow update detected. Updating assignments in-place for v${previousPD.pdVersion}`,
      );

      if (updateAll || sectionsToUpdate.includes("section3")) {
        await Section3_Structure.findByIdAndUpdate(
          previousPD.section3_structure,
          { ...mappedSection3Data },
        );
      }
      if (updateAll || sectionsToUpdate.includes("section4")) {
        await Section4_Electives.findByIdAndUpdate(
          previousPD.section4_electives,
          { ...mappedSection4Data },
        );
      }

      if (metaData.status && metaData.status !== previousPD.status) {
        previousPD.status = metaData.status;
        await previousPD.save();
      }

      return res.json({
        success: true,
        message: `Assignments updated for v${previousPD.pdVersion}`,
        version: previousPD.pdVersion,
        data: previousPD,
      });
    }

    // --- 2B: DRAFT IN-PLACE UPDATE (NO VERSION BUMP) ---
    if (previousPD.status === "Draft") {
      console.log(
        `Updating existing Draft in-place for v${previousPD.pdVersion}`,
      );

      if (updateAll || sectionsToUpdate.includes("section1")) {
        await Section1_Info.findByIdAndUpdate(previousPD.section1_info, {
          ...section1Data,
        });
      }
      if (updateAll || sectionsToUpdate.includes("section2")) {
        await Section2_Objectives.findByIdAndUpdate(
          previousPD.section2_objectives,
          { ...section2Data },
        );
      }
      if (updateAll || sectionsToUpdate.includes("section3")) {
        await Section3_Structure.findByIdAndUpdate(
          previousPD.section3_structure,
          { ...mappedSection3Data },
        );
      }
      if (updateAll || sectionsToUpdate.includes("section4")) {
        await Section4_Electives.findByIdAndUpdate(
          previousPD.section4_electives,
          { ...mappedSection4Data },
        );
      }

      previousPD.schemeYear = metaData.schemeYear;
      previousPD.effectiveAcademicYear = metaData.effectiveAy;
      if (metaData.status) previousPD.status = metaData.status;

      await previousPD.save();

      return res.json({
        success: true,
        message:
          metaData.status === "UnderReview"
            ? `Program Submitted for Review (v${previousPD.pdVersion})`
            : `Draft Updated Successfully (v${previousPD.pdVersion})`,
        version: previousPD.pdVersion,
        data: previousPD,
      });
    }

    // --- 2C: CONTENT UPDATE ON APPROVED/UNDER REVIEW (INCREMENT VERSION) ---
    newPdVersion = incrementVersion(previousPD.pdVersion);

    // FIXED: Removed the 'let' keywords here so we just assign to the variables declared at the top of the function
    s1_Id = previousPD.section1_info;
    s2_Id = previousPD.section2_objectives;
    s3_Id = previousPD.section3_structure;
    s4_Id = previousPD.section4_electives;

    if (updateAll || sectionsToUpdate.includes("section1")) {
      const s1 = await Section1_Info.create({
        ...section1Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      s1_Id = s1._id;
    }

    if (updateAll || sectionsToUpdate.includes("section2")) {
      const s2 = await Section2_Objectives.create({
        ...section2Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      s2_Id = s2._id;
    }

    if (updateAll || sectionsToUpdate.includes("section3")) {
      const s3 = await Section3_Structure.create({
        ...mappedSection3Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      s3_Id = s3._id;
    }

    if (updateAll || sectionsToUpdate.includes("section4")) {
      const s4 = await Section4_Electives.create({
        ...mappedSection4Data,
        programId,
        version: newPdVersion,
        createdBy: creatorId,
      });
      s4_Id = s4._id;
    }

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
      message: `Program Updated to v${newPdVersion}`,
      version: newPdVersion,
      data: masterPD,
    });
  } catch (error) {
    console.error("PD Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- HELPER: Format Populated Data for Frontend ---
// Maps the populated 'assignedCreater' object back into 'assigneeId' and 'assigneeName' for the React UI.
const formatPopulatedPD = (pd) => {
  const pdObj = pd.toObject ? pd.toObject() : pd;

  const mapCourses = (courses) => {
    return courses.map((c) => {
      if (c.assignedCreater) {
        c.assigneeId = c.assignedCreater._id;
        c.assigneeName = c.assignedCreater.name;
        delete c.assignedCreater; // Clean up payload
      }
      return c;
    });
  };

  if (pdObj.section3_structure?.semesters) {
    pdObj.section3_structure.semesters = pdObj.section3_structure.semesters.map(
      (sem) => ({
        ...sem,
        courses: mapCourses(sem.courses),
      }),
    );
  }

  if (pdObj.section4_electives?.professionalElectives) {
    pdObj.section4_electives.professionalElectives =
      pdObj.section4_electives.professionalElectives.map((grp) => ({
        ...grp,
        courses: mapCourses(grp.courses),
      }));
  }

  if (pdObj.section4_electives?.openElectives) {
    pdObj.section4_electives.openElectives =
      pdObj.section4_electives.openElectives.map((grp) => ({
        ...grp,
        courses: mapCourses(grp.courses),
      }));
  }

  return pdObj;
};

// --- CONTROLLERS ---

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
      // Deep populate for Section 3 Courses
      .populate({
        path: "section3_structure",
        populate: {
          path: "semesters.courses.assignedCreater",
          select: "name email _id",
        },
      })
      // Deep populate for Section 4 Electives
      .populate({
        path: "section4_electives",
        populate: [
          {
            path: "professionalElectives.courses.assignedCreater",
            select: "name email _id",
          },
          {
            path: "openElectives.courses.assignedCreater",
            select: "name email _id",
          },
        ],
      });

    if (!pd) return res.json({ success: false, message: "Document not found" });

    // Format to inject assigneeName/assigneeId for frontend UI
    const formattedPD = formatPopulatedPD(pd);

    res.json({ success: true, pd: formattedPD });
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
      // Deep populate for Section 3 Courses
      .populate({
        path: "section3_structure",
        populate: {
          path: "semesters.courses.assignedCreater",
          select: "name email _id",
        },
      })
      // Deep populate for Section 4 Electives
      .populate({
        path: "section4_electives",
        populate: [
          {
            path: "professionalElectives.courses.assignedCreater",
            select: "name email _id",
          },
          {
            path: "openElectives.courses.assignedCreater",
            select: "name email _id",
          },
        ],
      });

    if (!pd) return res.json({ success: false, message: "No history found" });

    // Format to inject assigneeName/assigneeId for frontend UI
    const formattedPD = formatPopulatedPD(pd);

    res.json({ success: true, pd: formattedPD });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Dashboard Stats for PD
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

// Full Creator History for PDs
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
