import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import CourseDocument from "../models/cd/CourseDocument.js";
import CD_Section1_Identity from "../models/cd/CD_Section1_Identity.js";
import CD_Section2_Outcomes from "../models/cd/CD_Section2_Outcomes.js";
import CD_Section3_Syllabus from "../models/cd/CD_Section3_Syllabus.js";
import CD_Section4_Resources from "../models/cd/CD_Section4_Resources.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** "1.0.3"  →  "1.0.4"  (patch bump) */
const incrementVersion = (version = "1.0.0") => {
  const parts = version.split(".");
  if (parts.length < 3) return "1.0.1";
  parts[2] = String(parseInt(parts[2], 10) + 1);
  return parts.join(".");
};

/**
 * Reconstruct the flat object that EditCD.jsx's transformFetchedToFrontend
 * + sanitizeCDData expect.  All populated section refs must already be
 * attached (via .populate()).
 */
const buildFormattedCD = (cd) => {
  const s1 = cd.section1_identity || {};
  const s2 = cd.section2_outcomes || {};
  const s3 = cd.section3_syllabus || {};
  const s4 = cd.section4_resources || {};

  return {
    // ── Master metadata ───────────────────────────────────────────────────────
    courseCode: cd.courseCode,
    courseTitle: cd.courseTitle,
    programName: cd.programName,
    cdVersion: cd.cdVersion,
    status: cd.status,

    // ── Section 1 – Identity & Credits ───────────────────────────────────────
    // Spread nested identity so sanitizeCDData can read flat fields
    ...(s1.identity || {}),
    identity: s1.identity || {}, // keep nested copy too (used by transformFetchedToFrontend)
    credits: s1.credits || {},

    // ── Section 2 – Aims, Objectives, Outcomes, Outcome Map ─────────────────
    aimsSummary: s2.aimsSummary || "",
    objectives: s2.objectives || "",
    courseOutcomes: s2.courseOutcomes || [],
    courseOutcomesHtml: s2.courseOutcomesHtml || "",
    outcomeMap: s2.outcomeMap || {},
    outcomeMapHtml: s2.outcomeMapHtml || "",

    // ── Section 3 – Syllabus & Teaching ─────────────────────────────────────
    courseContent: s3.courseContent || "",
    teaching: s3.teaching || [],

    // ── Section 4 – Resources, Assessment, Grading, Attainment, Other ───────
    resources: s4.resources || {
      textBooks: [],
      references: [],
      otherResources: [],
    },
    assessmentWeight: s4.assessmentWeight || [],
    assessmentWeightHtml: s4.assessmentWeightHtml || "",
    gradingCriterion: s4.gradingCriterion || "",
    attainmentCalculations: s4.attainmentCalculations || {
      recordingMarks: "",
      settingTargets: "",
    },
    otherDetails: s4.otherDetails || {
      assignmentDetails: "",
      academicIntegrity: "",
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE / IMPORT
// ─────────────────────────────────────────────────────────────────────────────

export const uploadAndParseCD = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const filePath = req.file.path;
  let responseSent = false;

  const cleanupFile = () => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
  };

  try {
    const scriptPath = path.join(__dirname, "..", "scripts", "cd_parser.py");

    if (!fs.existsSync(scriptPath)) {
      cleanupFile();
      return res.status(500).json({
        success: false,
        message: `Parser script not found at: ${scriptPath}`,
      });
    }

    const pythonProcess = spawn("python", [scriptPath, filePath]);
    let dataString = "";
    let errorString = "";

    const timeoutId = setTimeout(() => {
      pythonProcess.kill("SIGKILL");
      errorString += "\nKilled: exceeded 25s timeout.";
    }, 25_000);

    pythonProcess.stdout.on("data", (d) => (dataString += d.toString()));
    pythonProcess.stderr.on("data", (d) => (errorString += d.toString()));

    pythonProcess.on("error", (err) => {
      clearTimeout(timeoutId);
      cleanupFile();
      if (!responseSent) {
        responseSent = true;
        res
          .status(500)
          .json({ success: false, message: "Could not start Python parser." });
      }
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      cleanupFile();
      if (responseSent) return;
      responseSent = true;

      if (code !== 0) {
        console.error(`Python exited ${code}:`, errorString);
        return res
          .status(500)
          .json({
            success: false,
            message: "Parsing failed.",
            details: errorString,
          });
      }

      try {
        const start = dataString.indexOf("{");
        const end = dataString.lastIndexOf("}") + 1;
        if (start === -1) throw new Error("No JSON in Python output");

        const parsed = JSON.parse(dataString.slice(start, end));
        if (!parsed.success && parsed.message)
          return res
            .status(400)
            .json({ success: false, message: parsed.message });

        return res.json({ success: true, parsedData: parsed.parsedData });
      } catch (e) {
        console.error("JSON parse error:", e.message, "\nRaw:", dataString);
        return res
          .status(500)
          .json({
            success: false,
            message: "Invalid data from parser.",
            raw: dataString,
          });
      }
    });
  } catch (error) {
    cleanupFile();
    if (!responseSent) {
      console.error("uploadAndParseCD unexpected error:", error);
      res
        .status(500)
        .json({ success: false, message: "Unexpected server error." });
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE / UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dirty-section keys the frontend can send (from markDirty calls):
 *
 *   "all"                 → update every section
 *   "basic"               → identity fields + aimsSummary + objectives + courseContent
 *                           (sent by the generic `upd()` helper on the frontend)
 *   "credits"             → Section 1
 *   "courseOutcomes"      → Section 2
 *   "outcomeMap"          → Section 2
 *   "teaching"            → Section 3
 *   "assessmentWeight"    → Section 4
 *   "gradingCriterion"    → Section 4
 *   "attainmentCalculations" → Section 4
 *   "otherDetails"        → Section 4
 *   "resources"           → Section 4
 */
export const createOrUpdateCD = async (req, res) => {
  try {
    const {
      courseCode,
      courseTitle,
      programName,
      isNewCD, // hint from frontend — we verify against DB too
      status,
      sectionsToUpdate = [],
      cdData,
    } = req.body;

    if (!courseCode) {
      return res
        .status(400)
        .json({ success: false, message: "courseCode is required." });
    }

    const creatorId = req.id;
    const updateAll = sectionsToUpdate.includes("all");

    // ── Dirty-section → model-section mapping ─────────────────────────────────
    const s1Keys = ["basic", "identity", "credits"];
    const s2Keys = ["basic", "courseOutcomes", "outcomeMap"];
    const s3Keys = ["basic", "courseContent", "teaching"];
    const s4Keys = [
      "basic",
      "assessmentWeight",
      "gradingCriterion",
      "attainmentCalculations",
      "otherDetails",
      "resources",
    ];

    const dirty = (keys) =>
      updateAll || keys.some((k) => sectionsToUpdate.includes(k));

    const s1Dirty = dirty(s1Keys);
    const s2Dirty = dirty(s2Keys);
    const s3Dirty = dirty(s3Keys);
    const s4Dirty = dirty(s4Keys);

    // ── Resolve version & previous section refs ──────────────────────────────
    const existingCD = await CourseDocument.findOne({ courseCode }).sort({
      createdAt: -1,
    });
    const isActuallyNew = !existingCD;
    const newCdVersion = isActuallyNew
      ? "1.0.0"
      : incrementVersion(existingCD.cdVersion);

    let s1_Id = existingCD?.section1_identity;
    let s2_Id = existingCD?.section2_outcomes;
    let s3_Id = existingCD?.section3_syllabus;
    let s4_Id = existingCD?.section4_resources;

    // ── Section 1 – Identity & Credits ───────────────────────────────────────
    if (isActuallyNew || s1Dirty) {
      const s1 = await CD_Section1_Identity.create({
        courseCode,
        version: newCdVersion,
        identity: cdData.identity || {},
        credits: cdData.credits || {},
        createdBy: creatorId,
      });
      s1_Id = s1._id;
    }

    // ── Section 2 – Aims, Objectives, Course Outcomes, Outcome Map ───────────
    if (isActuallyNew || s2Dirty) {
      const s2 = await CD_Section2_Outcomes.create({
        courseCode,
        version: newCdVersion,
        aimsSummary: cdData.aimsSummary || "",
        objectives: cdData.objectives || "",
        courseOutcomes: cdData.courseOutcomes || [],
        courseOutcomesHtml: cdData.courseOutcomesHtml || "",
        outcomeMap: cdData.outcomeMap || {},
        outcomeMapHtml: cdData.outcomeMapHtml || "",
        createdBy: creatorId,
      });
      s2_Id = s2._id;
    }

    // ── Section 3 – Course Content & Teaching Schedule ───────────────────────
    if (isActuallyNew || s3Dirty) {
      const s3 = await CD_Section3_Syllabus.create({
        courseCode,
        version: newCdVersion,
        courseContent: cdData.courseContent || "",
        teaching: cdData.teaching || [],
        createdBy: creatorId,
      });
      s3_Id = s3._id;
    }

    // ── Section 4 – Resources, Assessment, Grading, Attainment, Other ────────
    if (isActuallyNew || s4Dirty) {
      const s4 = await CD_Section4_Resources.create({
        courseCode,
        version: newCdVersion,
        resources: cdData.resources || {},
        assessmentWeight: cdData.assessmentWeight || [],
        assessmentWeightHtml: cdData.assessmentWeightHtml || "",
        gradingCriterion: cdData.gradingCriterion || "",
        attainmentCalculations: cdData.attainmentCalculations || {},
        otherDetails: cdData.otherDetails || {},
        createdBy: creatorId,
      });
      s4_Id = s4._id;
    }

    // ── Master snapshot ───────────────────────────────────────────────────────
    const masterCD = await CourseDocument.create({
      courseCode,
      courseTitle,
      programName,
      cdVersion: newCdVersion,
      section1_identity: s1_Id,
      section2_outcomes: s2_Id,
      section3_syllabus: s3_Id,
      section4_resources: s4_Id,
      status: status || "Draft",
      createdBy: creatorId,
    });

    console.log(
      `CD ${isActuallyNew ? "created" : "updated"}: ${courseCode} v${newCdVersion}`,
    );

    return res.json({
      success: true,
      message: isActuallyNew
        ? `Course Document "${courseCode}" created.`
        : `Course Document updated to v${newCdVersion}.`,
      version: newCdVersion,
      data: masterCD,
    });
  } catch (error) {
    console.error("createOrUpdateCD error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────────────────────

const POPULATE_CHAIN = [
  "section1_identity",
  "section2_outcomes",
  "section3_syllabus",
  "section4_resources",
];

/** Fetch a specific CD snapshot by its Mongo _id */
export const getCDById = async (req, res) => {
  try {
    const cd = await CourseDocument.findById(req.params.id)
      .populate(POPULATE_CHAIN[0])
      .populate(POPULATE_CHAIN[1])
      .populate(POPULATE_CHAIN[2])
      .populate(POPULATE_CHAIN[3]);

    if (!cd) {
      return res
        .status(404)
        .json({ success: false, message: "Course Document not found." });
    }

    return res.json({ success: true, cd: buildFormattedCD(cd) });
  } catch (error) {
    console.error("getCDById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Fetch the latest (most recent) snapshot for a given courseCode */
export const getLatestCD = async (req, res) => {
  try {
    const cd = await CourseDocument.findOne({
      courseCode: req.params.courseCode,
    })
      .sort({ createdAt: -1 })
      .populate(POPULATE_CHAIN[0])
      .populate(POPULATE_CHAIN[1])
      .populate(POPULATE_CHAIN[2])
      .populate(POPULATE_CHAIN[3]);

    if (!cd) {
      return res
        .status(404)
        .json({ success: false, message: "No history found for this course." });
    }

    return res.json({ success: true, cd: buildFormattedCD(cd) });
  } catch (error) {
    console.error("getLatestCD error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const getRecentVersions = async (req, res) => {
  try {
    const versions = await CourseDocument.find({
      courseCode: req.params.courseCode,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("cdVersion createdAt status");

    return res.json({ success: true, versions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD & HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const getCDDashboardStats = async (req, res) => {
  try {
    const creatorId = req.id;

    const [total, drafts, underReview, approved, recentDocs] =
      await Promise.all([
        CourseDocument.countDocuments({ createdBy: creatorId }),
        CourseDocument.countDocuments({
          createdBy: creatorId,
          status: "Draft",
        }),
        CourseDocument.countDocuments({
          createdBy: creatorId,
          status: "UnderReview",
        }),
        CourseDocument.countDocuments({
          createdBy: creatorId,
          status: "Approved",
        }),
        CourseDocument.find({ createdBy: creatorId })
          .sort({ updatedAt: -1 })
          .limit(5)
          .select("courseCode courseTitle cdVersion status updatedAt"),
      ]);

    return res.json({
      success: true,
      stats: { total, drafts, underReview, approved },
      recentDocs,
    });
  } catch (error) {
    console.error("getCDDashboardStats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data." });
  }
};

export const getCDCreatorHistory = async (req, res) => {
  try {
    const cds = await CourseDocument.find({ createdBy: req.id })
      .sort({ updatedAt: -1 })
      .select("courseCode courseTitle cdVersion status updatedAt");

    return res.json({ success: true, count: cds.length, cds });
  } catch (error) {
    console.error("getCDCreatorHistory error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch document history." });
  }
};
