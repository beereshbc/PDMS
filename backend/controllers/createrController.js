import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Creater from "../models/Creater.js";
import ProgramDocument from "../models/pd/ProgramDocument.js";
import Section1_Info from "../models/pd/Section1_Info.js";
import Section2_Objectives from "../models/pd/Section2_Objectives.js";
import Section3_Structure from "../models/pd/Section3_Structure.js";
import Section4_Electives from "../models/pd/Section4_Electives.js";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Admin from "../models/Admin.js";
import PD from "../models/pd/PD.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

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
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const creater = await Creater.findOne({ email }).select("+password");
    if (!creater)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (creater.blocked)
      return res
        .status(403)
        .json({ success: false, message: "Account blocked." });
    if (creater.status !== "active")
      return res
        .status(403)
        .json({ success: false, message: "Account pending approval" });

    const isMatch = await bcrypt.compare(password, creater.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

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
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const getCreaterProfile = async (req, res) => {
  try {
    const creater = await Creater.findById(req.id).select("-password");
    if (!creater)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, profile: creater });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
      .limit(50);
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
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {}
  };

  try {
    const scriptPath = path.resolve(__dirname, "..", "scripts", "pd_parser.py");
    const pythonCommand =
      process.env.NODE_ENV === "production" ? "python3" : "python";

    if (!fs.existsSync(scriptPath)) {
      cleanupFile();
      return res.status(500).json({
        success: false,
        message: "Unified parser script missing at: " + scriptPath,
      });
    }

    const requestedSchema = req.body.schemaVersion || "auto";

    const pythonProcess = spawn(pythonCommand, [
      scriptPath,
      filePath,
      requestedSchema,
    ]);

    let dataString = "";
    let errorString = "";

    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        pythonProcess.kill("SIGKILL");
        responseSent = true;
        cleanupFile();
        return res
          .status(504)
          .json({ success: false, message: "Parsing timeout (120s)" });
      }
    }, 120000);

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
      console.error(`[Python Parser]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      cleanupFile();

      if (responseSent) return;
      responseSent = true;

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: "Python parser failed",
          error: errorString,
        });
      }

      try {
        const start = dataString.indexOf("{");
        const end = dataString.lastIndexOf("}") + 1;

        if (start === -1) throw new Error("No JSON found in Python output");

        const parsed = JSON.parse(dataString.substring(start, end));

        return res.json({
          success: true,
          schemaVersion: parsed.schemaVersion,
          confidence: parsed.confidence,
          warnings: parsed.warnings,
          parsedData: parsed.data,
        });
      } catch (err) {
        console.error("Parse mapping error:", err);
        return res.status(500).json({
          success: false,
          message: "Invalid JSON returned from parser",
          raw: dataString,
        });
      }
    });
  } catch (error) {
    cleanupFile();
    if (!responseSent) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
};

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
      programId,
      programName,
      schemeYear,
      effectiveAy,
      totalCredits,
      academicCredits,
      status,
      pdData,
      reviewerId,
      isWorkflowUpdate,
    } = req.body;

    const creatorId = req.id;

    // Defensive check
    if (!pdData || typeof pdData !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid document data structure." });
    }

    // Find the latest document for this program and scheme year to prevent E11000 duplicate keys
    const existingPD = await PD.findOne({
      program_id: programId,
      scheme_year: schemeYear,
    }).sort({ created_at: -1 });

    // SCENARIO 1: Brand New Program
    if (!existingPD) {
      const newPD = await PD.create({
        program_id: programId,
        program_name: programName,
        scheme_year: schemeYear,
        version_no: "1.0.0",
        effective_ay: effectiveAy,
        total_credits: totalCredits || 0,
        academic_credits: academicCredits || 0,
        status: status || "draft",
        pd_data: pdData,
        created_by: creatorId,
        approved_by: reviewerId || null,
      });

      return res.json({
        success: true,
        message:
          status === "under_review" ? "Submitted for Review" : "Draft Created",
        version: "1.0.0",
        data: newPD,
      });
    }

    // SCENARIO 2: ASSIGNMENT UPDATE ONLY
    if (isWorkflowUpdate) {
      existingPD.pd_data = pdData;
      if (
        status &&
        existingPD.status === "draft" &&
        status === "under_review"
      ) {
        existingPD.status = "under_review";
        existingPD.approved_by = reviewerId;
      }
      await existingPD.save();
      return res.json({
        success: true,
        message: "Assignments updated successfully",
        version: existingPD.version_no,
        data: existingPD,
      });
    }

    // SCENARIO 3: Editing an existing Draft or Rejected doc
    if (existingPD.status === "draft" || existingPD.status === "rejected") {
      existingPD.pd_data = pdData;
      existingPD.program_name = programName;
      existingPD.scheme_year = schemeYear;
      existingPD.effective_ay = effectiveAy;
      existingPD.total_credits = totalCredits;
      existingPD.academic_credits = academicCredits;

      if (status) existingPD.status = status;
      if (reviewerId) existingPD.approved_by = reviewerId;

      await existingPD.save();
      return res.json({
        success: true,
        message:
          status === "under_review"
            ? "Submitted to Admin for Review"
            : "Draft Updated Successfully",
        version: existingPD.version_no,
        data: existingPD,
      });
    }

    // SCENARIO 4: VERSION BUMP (Document is already under_review or approved)
    const newVersion = incrementVersion(existingPD.version_no);
    const bumpedPD = await PD.create({
      program_id: programId,
      program_name: programName,
      scheme_year: schemeYear,
      version_no: newVersion,
      effective_ay: effectiveAy,
      total_credits: totalCredits,
      academic_credits: academicCredits,
      status: status || "draft",
      pd_data: pdData,
      created_by: creatorId,
      approved_by: reviewerId || null,
      previous_version: existingPD._id,
    });

    return res.json({
      success: true,
      message: `New Draft v${newVersion} Created`,
      version: newVersion,
      data: bumpedPD,
    });
  } catch (error) {
    console.error("Save PD Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error saving document. Please try again.",
      });
  }
};

const formatPopulatedPD = (pd) => {
  const pdObj = pd.toObject ? pd.toObject() : pd;

  const mapCourses = (courses) => {
    return (courses || []).map((c) => {
      if (c.assignedCreater) {
        c.assigneeId = c.assignedCreater._id;
        c.assigneeName = c.assignedCreater.name;
        delete c.assignedCreater;
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

  pdObj.section4 = pdObj.section4 || {
    professionalElectives: pdObj.prof_electives || [],
    openElectives: pdObj.open_electives || [],
    technicalCompetencyCourses: [],
    programDeliveryAndAttainment: "",
    teachingLearningMethods: [""],
    attendance: "",
    assessmentGrading: {
      description: "",
      components: [],
      gradeRules: "",
      passingCriteria: "",
    },
    awardOfDegree: "",
    studentSupport: [""],
    qualityControlMeasures: [""],
    notes: "",
  };

  if (pdObj.section4.professionalElectives) {
    pdObj.section4.professionalElectives =
      pdObj.section4.professionalElectives.map((grp) => ({
        ...grp,
        courses: mapCourses(grp.courses),
      }));
  }

  if (pdObj.section4.openElectives) {
    pdObj.section4.openElectives = pdObj.section4.openElectives.map((grp) => ({
      ...grp,
      courses: mapCourses(grp.courses),
    }));
  }

  return pdObj;
};

export const getRecentVersions = async (req, res) => {
  try {
    const versions = await PD.find({ program_id: req.params.programId })
      .sort({ created_at: -1 })
      .limit(5)
      .select("version_no created_at status scheme_year");
    res.json({ success: true, versions });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getPDById = async (req, res) => {
  try {
    const pd = await PD.findById(req.params.id);
    if (!pd) return res.json({ success: false, message: "Document not found" });
    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getLatestPD = async (req, res) => {
  try {
    const pd = await PD.findOne({ program_id: req.params.programId }).sort({
      created_at: -1,
    });
    if (!pd)
      return res.json({
        success: false,
        message: "No history found for this program",
      });
    res.json({ success: true, pd });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const creatorId = req.id;
    const [total, drafts, underReview, approved, recentDocs] =
      await Promise.all([
        PD.countDocuments({ created_by: creatorId }),
        PD.countDocuments({ created_by: creatorId, status: "draft" }),
        PD.countDocuments({ created_by: creatorId, status: "under_review" }),
        PD.countDocuments({ created_by: creatorId, status: "approved" }),
        PD.find({ created_by: creatorId })
          .sort({ updated_at: -1 })
          .limit(5)
          .select("program_name program_id status updated_at"),
      ]);
    res.json({
      success: true,
      stats: { total, drafts, underReview, approved },
      recentDocs,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

export const getCreatorHistory = async (req, res) => {
  try {
    const allPDs = await PD.find({ created_by: req.id })
      .sort({ updated_at: -1 })
      .lean();

    const groupedMap = new Map();

    allPDs.forEach((pd) => {
      if (!groupedMap.has(pd.program_id)) {
        groupedMap.set(pd.program_id, {
          programCode: pd.program_id,
          programName: pd.program_name,
          latestVersion: pd.version_no,
          latestStatus: pd.status,
          updatedAt: pd.updated_at,
          schemeYear: pd.scheme_year,
          effectiveAy: pd.effective_ay,
          totalCredits: pd.total_credits || 0,
          versions: [],
        });
      }

      groupedMap.get(pd.program_id).versions.push({
        _id: pd._id,
        versionNo: pd.version_no,
        status: pd.status,
        updatedAt: pd.updated_at,
        changeSummary: pd.review_comment || pd.change_summary || "",
        pdData: pd.pd_data,
      });
    });

    const groupedData = Array.from(groupedMap.values());
    res.json({ success: true, count: groupedData.length, groupedData });
  } catch (error) {
    console.error("getCreatorHistory error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch document history" });
  }
};

export const getAdminsForReview = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin", status: "active" }).select(
      "name email department school",
    );
    res.json({ success: true, admins });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admins." });
  }
};

export const enhanceFieldWithAI = async (req, res) => {
  try {
    const { prompt, currentContent, fieldName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const systemPrompt = `
You are an expert academic curriculum assistant helping a professor format a Program Document.
The user is working on the section: "${fieldName}".

User's Instructions: "${prompt}"

Current Content (if any):
${currentContent || "(No existing content)"}

TASK:
Apply the user's instructions to the content.

CRITICAL RULE:
Return ONLY valid HTML (<p>, <ul>, <li>, <table>, etc).
NO markdown, NO explanation, NO extra text.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    let enhancedText = result.response.text();

    enhancedText = enhancedText
      .replace(/```html\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();

    return res.status(200).json({
      success: true,
      enhancedContent: enhancedText,
    });
  } catch (error) {
    console.error("AI Enhancer Error Details:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI content.",
    });
  }
};

export const enhanceSectionWithAI = async (req, res) => {
  try {
    const { sectionName, sectionData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "Gemini API key is not configured." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const systemPrompt = `
You are an expert academic curriculum editor.
The user has extracted data from a PDF for the section: "${sectionName}".
This data might contain OCR errors, unwanted garbage text (like page numbers or weird symbols), or grammatical mistakes.

TASK:
1. Clean up and fix all grammatical errors and typos.
2. Remove any obvious garbage text or OCR artifacts.
3. Ensure a highly professional, academic tone.
4. CRITICAL: You must return the EXACT SAME JSON structure, with the exact same keys. Only modify the string values.

Input Data (JSON):
${JSON.stringify(sectionData, null, 2)}

CRITICAL RULE:
Return ONLY a valid JSON object. DO NOT wrap it in markdown code blocks like \`\`\`json. Just output the raw JSON string.
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    let enhancedText = result.response.text();

    enhancedText = enhancedText
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();

    const parsedData = JSON.parse(enhancedText);

    return res.status(200).json({ success: true, enhancedData: parsedData });
  } catch (error) {
    console.error("AI Section Enhancer Error Details:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to polish section data." });
  }
};

export const parseTableWithAI = async (req, res) => {
  try {
    const { prompt, rawData, tableType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "Gemini API key is not configured." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    let schemaInstruction = "";
    if (tableType === "outcomeMap") {
      schemaInstruction = `Return a 2D JSON array of strings. The first array MUST be headers starting with "CO/PO", followed by POs and PSOs (e.g., ["CO/PO", "PO1", "PO2", "PSO1"]). Subsequent arrays represent rows (e.g., ["CO1", "3", "2", ""]). Leave blank if no mapping exists.`;
    } else if (tableType === "assessmentWeight") {
      schemaInstruction = `Return a JSON array of objects. Each object represents a row. Keys MUST strictly be: "co" (string), "q1", "q2", "q3", "t1", "t2", "t3", "a1", "a2", "see", "cie", "total". All values except "co" must be numbers. Calculate cie and total if missing.`;
    } else if (tableType === "teaching") {
      schemaInstruction = `Return a JSON array of objects. Keys MUST strictly be: "number" (string/number), "topic" (string), "slides" (string URL or blank), "videos" (string URL or blank).`;
    }

    const systemPrompt = `
You are a highly advanced data parsing assistant.
The user wants to format raw text/data into a structured table for an academic syllabus.

Target Table Type: ${tableType}

User's Custom Instructions: "${prompt || "Parse the provided data perfectly into the required schema."}"

Raw Data / Pasted Table:
${rawData || "(No raw data provided, generate from instructions)"}

CRITICAL INSTRUCTION:
${schemaInstruction}
Extract the data accurately, infer missing columns if requested by the user's prompt, and output ONLY valid JSON.
`;

    const result = await model.generateContent(systemPrompt);
    const parsedJson = JSON.parse(result.response.text());

    return res.status(200).json({ success: true, parsedData: parsedJson });
  } catch (error) {
    console.error("AI Table Parser Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to parse table with AI." });
  }
};

export const getAssignedCDs = async (req, res) => {
  try {
    const creatorId = req.id;
    const pds = await PD.find({
      $or: [
        { "pd_data.semesters.courses.assigneeId": creatorId },
        { "pd_data.semesters.categories.courses.assigneeId": creatorId },
        {
          "pd_data.section4.professionalElectives.courses.assigneeId":
            creatorId,
        },
        { "pd_data.section4.openElectives.courses.assigneeId": creatorId },
      ],
    }).populate("created_by", "name");

    let assignedCourses = [];

    pds.forEach((pd) => {
      const pName = pd.program_name;
      const pCode = pd.program_id;
      const creatorName = pd.created_by?.name || "Admin";

      pd.pd_data?.semesters?.forEach((sem) => {
        sem.courses?.forEach((c) => {
          if (c.assigneeId === creatorId) {
            assignedCourses.push({
              courseCode: c.code,
              courseTitle: c.title,
              programName: pName,
              programCode: pCode,
              type: c.type || "Theory",
              credits: c.credits,
              context: `Semester ${sem.sem_no}`,
              pdCreatorName: creatorName,
            });
          }
        });
        sem.categories?.forEach((cat) => {
          cat.courses?.forEach((c) => {
            if (c.assigneeId === creatorId) {
              assignedCourses.push({
                courseCode: c.code,
                courseTitle: c.title,
                programName: pName,
                programCode: pCode,
                type: c.type || "Theory",
                credits: c.credits,
                context: `Semester ${sem.sem_no} (${cat.categoryName})`,
                pdCreatorName: creatorName,
              });
            }
          });
        });
      });

      pd.pd_data?.section4?.professionalElectives?.forEach((grp, gi) => {
        grp.courses?.forEach((c) => {
          if (c.assigneeId === creatorId) {
            assignedCourses.push({
              courseCode: c.code,
              courseTitle: c.title,
              programName: pName,
              programCode: pCode,
              type: "Professional Elective",
              credits: c.credits,
              context: grp.title || `PE Group ${gi + 1}`,
              pdCreatorName: creatorName,
            });
          }
        });
      });

      pd.pd_data?.section4?.openElectives?.forEach((grp, gi) => {
        grp.courses?.forEach((c) => {
          if (c.assigneeId === creatorId) {
            assignedCourses.push({
              courseCode: c.code,
              courseTitle: c.title,
              programName: pName,
              programCode: pCode,
              type: "Open Elective",
              credits: c.credits,
              context: grp.title || `OE Group ${gi + 1}`,
              pdCreatorName: creatorName,
            });
          }
        });
      });
    });

    res.json({ success: true, assignedCourses });
  } catch (error) {
    console.error("Error fetching assigned CDs:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch assigned courses." });
  }
};
