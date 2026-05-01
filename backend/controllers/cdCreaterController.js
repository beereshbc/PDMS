import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import CourseDocument from "../models/cd/CourseDocument.js";
import CD_Section1_Identity from "../models/cd/CD_Section1_Identity.js";
import CD_Section2_Outcomes from "../models/cd/CD_Section2_Outcomes.js";
import CD_Section3_Syllabus from "../models/cd/CD_Section3_Syllabus.js";
import CD_Section4_Resources from "../models/cd/CD_Section4_Resources.js";
import Admin from "../models/Admin.js";
import PD from "../models/pd/PD.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const incrementVersion = (version = "1.0.0") => {
  const parts = version.split(".");
  if (parts.length < 3) return "1.0.1";
  parts[2] = String(parseInt(parts[2], 10) + 1);
  return parts.join(".");
};

const buildFormattedCD = (cd) => {
  const s1 = cd.section1_identity || {};
  const s2 = cd.section2_outcomes || {};
  const s3 = cd.section3_syllabus || {};
  const s4 = cd.section4_resources || {};

  return {
    courseCode: cd.courseCode,
    courseTitle: cd.courseTitle,
    programName: cd.programName,
    cdVersion: cd.cdVersion,
    status: cd.status,
    ...(s1.identity || {}),
    identity: s1.identity || {},
    credits: s1.credits || {},
    aimsSummary: s2.aimsSummary || "",
    objectives: s2.objectives || "",
    courseOutcomes: s2.courseOutcomes || [],
    courseOutcomesHtml: s2.courseOutcomesHtml || "",
    outcomeMap: s2.outcomeMap || {},
    outcomeMapHtml: s2.outcomeMapHtml || "",
    courseContent: s3.courseContent || "",
    teaching: s3.teaching || [],
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
// ADMIN SELECTION FOR REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminsForReview = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin", status: "active" }).select(
      "name email department school",
    );
    res.json({ success: true, admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admins." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE / IMPORT
// ─────────────────────────────────────────────────────────────────────────────
export const uploadAndParseCD = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  const filePath = req.file.path;
  let responseSent = false;

  const cleanupFile = () => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete temp file ${filePath}:`, err);
    }
  };

  try {
    const scriptPath = path.join(__dirname, "..", "scripts", "cd_parser.py");
    const pythonCommand =
      process.env.NODE_ENV === "production" ? "python3" : "python";

    if (!fs.existsSync(scriptPath)) {
      cleanupFile();
      return res.status(500).json({
        success: false,
        message: "Parser script not found on server.",
      });
    }

    const pythonProcess = spawn(pythonCommand, [scriptPath, filePath]);

    let dataString = "";
    let errorString = "";

    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        pythonProcess.kill("SIGKILL");
        responseSent = true;
        cleanupFile();
        res.status(504).json({ success: false, message: "Parsing timed out." });
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
        res.status(500).json({
          success: false,
          message: "Failed to start Python parser.",
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
        return res.status(500).json({
          success: false,
          message: "Parsing failed.",
          details: errorString,
        });
      }

      try {
        const jsonStartIndex = dataString.indexOf("{");
        const jsonEndIndex = dataString.lastIndexOf("}") + 1;
        if (jsonStartIndex === -1) throw new Error("No JSON found");

        const parsed = JSON.parse(
          dataString.slice(jsonStartIndex, jsonEndIndex),
        );
        if (!parsed.success)
          return res
            .status(400)
            .json({ success: false, message: parsed.message });

        return res.json({ success: true, parsedData: parsed.parsedData });
      } catch (e) {
        return res.status(500).json({
          success: false,
          message: "Invalid parser response.",
          raw: dataString,
        });
      }
    });
  } catch (error) {
    cleanupFile();
    if (!responseSent)
      res
        .status(500)
        .json({ success: false, message: "Unexpected server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE / UPDATE WORKFLOW (FIXED FOR DUPLICATE KEY ERRORS)
// ─────────────────────────────────────────────────────────────────────────────
export const createOrUpdateCD = async (req, res) => {
  try {
    const {
      courseCode,
      courseTitle,
      programName,
      isNewCD,
      status,
      sectionsToUpdate = [],
      cdData,
      reviewerId,
    } = req.body;

    if (!courseCode) {
      return res
        .status(400)
        .json({ success: false, message: "courseCode is required." });
    }

    const creatorId = req.id;
    const updateAll = sectionsToUpdate.includes("all");

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

    const existingCD = await CourseDocument.findOne({ courseCode }).sort({
      createdAt: -1,
    });
    const isActuallyNew = !existingCD;

    // Check if we need to bump the version
    let needsVersionBump = false;
    if (
      !isActuallyNew &&
      (existingCD.status === "Approved" || existingCD.status === "UnderReview")
    ) {
      needsVersionBump = true;
    }

    const newCdVersion = isActuallyNew
      ? "1.0.0"
      : needsVersionBump
        ? incrementVersion(existingCD.cdVersion)
        : existingCD.cdVersion;

    let s1_Id = existingCD?.section1_identity;
    let s2_Id = existingCD?.section2_outcomes;
    let s3_Id = existingCD?.section3_syllabus;
    let s4_Id = existingCD?.section4_resources;

    // ── SCENARIO 1: Brand New OR Bumping Version ──
    if (isActuallyNew || needsVersionBump) {
      // Must create completely new section documents for the new snapshot
      const s1 = await CD_Section1_Identity.create({
        courseCode,
        version: newCdVersion,
        identity: cdData.identity || {},
        credits: cdData.credits || {},
        createdBy: creatorId,
      });
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
      const s3 = await CD_Section3_Syllabus.create({
        courseCode,
        version: newCdVersion,
        courseContent: cdData.courseContent || "",
        teaching: cdData.teaching || [],
        createdBy: creatorId,
      });
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

      const masterCD = await CourseDocument.create({
        courseCode,
        courseTitle,
        programName,
        cdVersion: newCdVersion,
        section1_identity: s1._id,
        section2_outcomes: s2._id,
        section3_syllabus: s3._id,
        section4_resources: s4._id,
        status: status || (isActuallyNew ? "Draft" : existingCD.status),
        createdBy: creatorId,
        approvedBy: reviewerId || null,
        previousVersion: isActuallyNew ? null : existingCD._id,
      });

      return res.json({
        success: true,
        message:
          status === "UnderReview"
            ? `Submitted v${newCdVersion} for review.`
            : `Draft v${newCdVersion} saved successfully.`,
        version: newCdVersion,
        data: masterCD,
      });
    }

    // ── SCENARIO 2: Updating an Existing Draft In-Place ──
    // Uses findByIdAndUpdate to prevent duplicate key constraint errors
    if (s1Dirty) {
      if (s1_Id)
        await CD_Section1_Identity.findByIdAndUpdate(s1_Id, {
          identity: cdData.identity,
          credits: cdData.credits,
        });
      else {
        const s = await CD_Section1_Identity.create({
          courseCode,
          version: newCdVersion,
          identity: cdData.identity || {},
          credits: cdData.credits || {},
          createdBy: creatorId,
        });
        s1_Id = s._id;
      }
    }
    if (s2Dirty) {
      if (s2_Id)
        await CD_Section2_Outcomes.findByIdAndUpdate(s2_Id, {
          aimsSummary: cdData.aimsSummary,
          objectives: cdData.objectives,
          courseOutcomes: cdData.courseOutcomes,
          courseOutcomesHtml: cdData.courseOutcomesHtml,
          outcomeMap: cdData.outcomeMap,
          outcomeMapHtml: cdData.outcomeMapHtml,
        });
      else {
        const s = await CD_Section2_Outcomes.create({
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
        s2_Id = s._id;
      }
    }
    if (s3Dirty) {
      if (s3_Id)
        await CD_Section3_Syllabus.findByIdAndUpdate(s3_Id, {
          courseContent: cdData.courseContent,
          teaching: cdData.teaching,
        });
      else {
        const s = await CD_Section3_Syllabus.create({
          courseCode,
          version: newCdVersion,
          courseContent: cdData.courseContent || "",
          teaching: cdData.teaching || [],
          createdBy: creatorId,
        });
        s3_Id = s._id;
      }
    }
    if (s4Dirty) {
      if (s4_Id)
        await CD_Section4_Resources.findByIdAndUpdate(s4_Id, {
          resources: cdData.resources,
          assessmentWeight: cdData.assessmentWeight,
          assessmentWeightHtml: cdData.assessmentWeightHtml,
          gradingCriterion: cdData.gradingCriterion,
          attainmentCalculations: cdData.attainmentCalculations,
          otherDetails: cdData.otherDetails,
        });
      else {
        const s = await CD_Section4_Resources.create({
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
        s4_Id = s._id;
      }
    }

    // Update Master Document
    existingCD.courseTitle = courseTitle;
    existingCD.programName = programName;
    existingCD.status = status || "Draft";
    if (reviewerId && status === "UnderReview") {
      existingCD.approvedBy = reviewerId;
    }
    existingCD.section1_identity = s1_Id;
    existingCD.section2_outcomes = s2_Id;
    existingCD.section3_syllabus = s3_Id;
    existingCD.section4_resources = s4_Id;
    await existingCD.save();

    return res.json({
      success: true,
      message:
        status === "UnderReview"
          ? `Submitted v${newCdVersion} for review.`
          : `Draft v${newCdVersion} updated successfully.`,
      version: newCdVersion,
      data: existingCD,
    });
  } catch (error) {
    console.error("createOrUpdateCD error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

const POPULATE_CHAIN = [
  "section1_identity",
  "section2_outcomes",
  "section3_syllabus",
  "section4_resources",
];

export const getCDById = async (req, res) => {
  try {
    const cd = await CourseDocument.findById(req.params.id)
      .populate(POPULATE_CHAIN[0])
      .populate(POPULATE_CHAIN[1])
      .populate(POPULATE_CHAIN[2])
      .populate(POPULATE_CHAIN[3]);
    if (!cd)
      return res
        .status(404)
        .json({ success: false, message: "Course Document not found." });
    return res.json({ success: true, cd: buildFormattedCD(cd) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
    if (!cd)
      return res
        .status(404)
        .json({ success: false, message: "No history found for this course." });
    return res.json({ success: true, cd: buildFormattedCD(cd) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
// DASHBOARD & ASSIGNED COURSES
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
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data." });
  }
};

export const getCDCreatorHistory = async (req, res) => {
  try {
    const allCDs = await CourseDocument.find({ createdBy: req.id })
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources")
      .sort({ updatedAt: -1 });

    const groupedMap = new Map();
    allCDs.forEach((cd) => {
      if (!groupedMap.has(cd.courseCode)) {
        groupedMap.set(cd.courseCode, {
          courseCode: cd.courseCode,
          courseTitle: cd.courseTitle,
          programName: cd.programName,
          latestVersion: cd.cdVersion,
          latestStatus: cd.status,
          updatedAt: cd.updatedAt,
          versions: [],
        });
      }
      groupedMap.get(cd.courseCode).versions.push({
        _id: cd._id,
        versionNo: cd.cdVersion,
        status: cd.status,
        updatedAt: cd.updatedAt,
        // Fallback checks both fields to ensure the comment is captured
        changeSummary: cd.reviewComment || cd.rejectionMessage || "",
        cdData: buildFormattedCD(cd),
      });
    });

    return res.json({
      success: true,
      count: groupedMap.size,
      groupedData: Array.from(groupedMap.values()),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch document history" });
  }
};
export const getAssignedCDs = async (req, res) => {
  try {
    const creatorId = req.id;
    const pds = await PD.find({
      $or: [
        { "pd_data.semesters.courses.assigneeId": creatorId },
        { "pd_data.prof_electives.courses.assigneeId": creatorId },
        { "pd_data.open_electives.courses.assigneeId": creatorId },
      ],
    }).populate("created_by", "name email");

    const assignedCourses = [];
    pds.forEach((pd) => {
      const checkAndPush = (course, contextInfo) => {
        if (course.assigneeId === creatorId) {
          assignedCourses.push({
            courseCode: course.code,
            courseTitle: course.title,
            credits: course.credits,
            type: course.type || "Theory",
            programCode: pd.program_id,
            programName: pd.program_name,
            pdVersion: pd.version_no,
            pdCreatorName: pd.created_by?.name || "Unknown",
            pdCreatorEmail: pd.created_by?.email || "Unknown",
            context: contextInfo,
          });
        }
      };
      pd.pd_data?.semesters?.forEach((sem) =>
        sem.courses?.forEach((c) => checkAndPush(c, `Semester ${sem.sem_no}`)),
      );
      pd.pd_data?.prof_electives?.forEach((grp) =>
        grp.courses?.forEach((c) =>
          checkAndPush(c, `Professional Elective (Sem ${grp.sem})`),
        ),
      );
      pd.pd_data?.open_electives?.forEach((grp) =>
        grp.courses?.forEach((c) =>
          checkAndPush(c, `Open Elective (Sem ${grp.sem})`),
        ),
      );
    });

    res.json({ success: true, assignedCourses });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch assigned courses." });
  }
};
