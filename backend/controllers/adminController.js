import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Creater from "../models/Creater.js";
import ProgramDocument from "../models/pd/ProgramDocument.js";
import CourseDocument from "../models/cd/CourseDocument.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Resolve the admin's jurisdiction into a list of Creater ObjectIds.
//
// Strategy:
//   1. Build a Creater query from the admin's own institutional fields
//      (faculty, school, department). Only non-empty fields are used.
//   2. Return { createdBy: { $in: [id1, id2, …] } } for use in PD/CD queries.
//   3. If the admin has NO institutional fields set (super-admin), return {}
//      so every document is visible.
//
// This way ProgramDocument / CourseDocument carry zero institutional data —
// access is entirely determined by who created the document.
// ─────────────────────────────────────────────────────────────────────────────
const getJurisdictionFilter = async (admin) => {
  // Build the institutional match against the Creater collection
  const createrQuery = {};
  if (admin.faculty) createrQuery.faculty = admin.faculty;
  if (admin.school) createrQuery.school = admin.school;
  if (admin.department) createrQuery.department = admin.department;

  // No restrictions set → super-admin scope (sees everything)
  if (Object.keys(createrQuery).length === 0) return {};

  // Find every creator whose institutional profile matches the admin's area
  const creators = await Creater.find(createrQuery).select("_id");

  if (creators.length === 0) {
    // Admin's jurisdiction exists but no creators belong to it yet — return
    // a filter that matches nothing rather than everything.
    return { createdBy: { $in: [] } };
  }

  const creatorIds = creators.map((c) => c._id);
  return { createdBy: { $in: creatorIds } };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

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
      return res.status(409).json({
        success: false,
        message: "Admin email already registered",
      });
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
      status: "inactive",
    });

    res.status(201).json({
      success: true,
      message: "Registration submitted. Await developer approval.",
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error("registerAdmin:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
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

    if (admin.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "Account pending approval." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    admin.last_login = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        // Sent to frontend so it can show the admin's scope in the UI
        jurisdiction: {
          faculty: admin.faculty || null,
          school: admin.school || null,
          department: admin.department || null,
        },
      },
    });
  } catch (error) {
    console.error("loginAdmin:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DASHBOARD & STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminDashboardStats = async (req, res) => {
  try {
    // Resolve creator-based jurisdiction filter once, reuse for all queries
    const filter = await getJurisdictionFilter(req.admin);

    const [
      pendingPDsCount,
      pendingCDsCount,
      approvedProgramsCount,
      recentPDs,
      recentCDs,
    ] = await Promise.all([
      ProgramDocument.countDocuments({ status: "UnderReview", ...filter }),
      CourseDocument.countDocuments({ status: "UnderReview", ...filter }),
      ProgramDocument.countDocuments({ status: "Approved", ...filter }),

      // Populate section1_info to get programName (no longer on PD root)
      ProgramDocument.find({
        status: { $in: ["Approved", "UnderReview", "Draft"] },
        ...filter,
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .select("programCode status updatedAt pdVersion")
        .populate("section1_info", "programName"),

      CourseDocument.find({
        status: { $in: ["Approved", "UnderReview", "Draft"] },
        ...filter,
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .select("courseCode courseTitle status updatedAt cdVersion"),
    ]);

    // Normalize recentPDs so the activity feed always has a .programName field
    const normalizedPDs = recentPDs.map((pd) => ({
      _id: pd._id,
      programCode: pd.programCode,
      programName: pd.section1_info?.programName || pd.programCode,
      status: pd.status,
      updatedAt: pd.updatedAt,
      pdVersion: pd.pdVersion,
    }));

    const recentActivity = [...normalizedPDs, ...recentCDs]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6);

    res.status(200).json({
      success: true,
      stats: {
        pendingPDs: pendingPDsCount,
        pendingCDs: pendingCDsCount,
        approvedPrograms: approvedProgramsCount,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("getAdminDashboardStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEW LISTS
// ─────────────────────────────────────────────────────────────────────────────

export const getPendingPDs = async (req, res) => {
  try {
    const filter = await getJurisdictionFilter(req.admin);

    const pds = await ProgramDocument.find({ status: "UnderReview", ...filter })
      .populate("createdBy", "name email designation faculty school department")
      .populate("section1_info", "programName department faculty school")
      .sort({ updatedAt: -1 });

    // Attach programName + institutional info from section1_info to the root
    // so the frontend doesn't need to deep-dive into populated refs
    const enriched = pds.map((pd) => {
      const obj = pd.toObject();
      obj.programName = pd.section1_info?.programName || pd.programCode;
      obj.department =
        pd.section1_info?.department || pd.createdBy?.department || "";
      obj.faculty = pd.section1_info?.faculty || pd.createdBy?.faculty || "";
      obj.school = pd.section1_info?.school || pd.createdBy?.school || "";
      return obj;
    });

    res.status(200).json({ success: true, pds: enriched });
  } catch (error) {
    console.error("getPendingPDs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCDs = async (req, res) => {
  try {
    const filter = await getJurisdictionFilter(req.admin);

    const cds = await CourseDocument.find({ status: "UnderReview", ...filter })
      .populate("createdBy", "name email designation faculty school department")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, cds });
  } catch (error) {
    console.error("getPendingCDs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approved PDs — used by CurriculumCompiler
export const getApprovedPDs = async (req, res) => {
  try {
    const filter = await getJurisdictionFilter(req.admin);

    const pds = await ProgramDocument.find({ status: "Approved", ...filter })
      .populate("createdBy", "name email")
      .populate("section1_info", "programName")
      .sort({ updatedAt: -1 });

    const enriched = pds.map((pd) => {
      const obj = pd.toObject();
      obj.programName = pd.section1_info?.programName || pd.programCode;
      return obj;
    });

    res.status(200).json({ success: true, pds: enriched });
  } catch (error) {
    console.error("getApprovedPDs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. DETAIL FETCHING (Deep Populate)
// ─────────────────────────────────────────────────────────────────────────────

export const getPDDetail = async (req, res) => {
  try {
    const filter = await getJurisdictionFilter(req.admin);

    const pd = await ProgramDocument.findOne({ _id: req.params.id, ...filter })
      .populate("section1_info")
      .populate("section2_objectives")
      .populate("section3_structure")
      .populate("section4_electives")
      .populate(
        "createdBy",
        "name email faculty school department designation",
      );

    if (!pd) {
      return res.status(404).json({
        success: false,
        message: "PD not found or access denied",
      });
    }

    // Attach programName to root for convenience
    const result = pd.toObject();
    result.programName = pd.section1_info?.programName || pd.programCode;
    result.faculty = pd.section1_info?.faculty || pd.createdBy?.faculty || "";
    result.school = pd.section1_info?.school || pd.createdBy?.school || "";
    result.department =
      pd.section1_info?.department || pd.createdBy?.department || "";

    res.status(200).json({ success: true, pd: result });
  } catch (error) {
    console.error("getPDDetail:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCDDetail = async (req, res) => {
  try {
    const filter = await getJurisdictionFilter(req.admin);

    const cd = await CourseDocument.findOne({ _id: req.params.id, ...filter })
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources")
      .populate(
        "createdBy",
        "name email faculty school department designation",
      );

    if (!cd) {
      return res.status(404).json({
        success: false,
        message: "CD not found or access denied",
      });
    }

    res.status(200).json({ success: true, cd });
  } catch (error) {
    console.error("getCDDetail:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. REVIEW ACTIONS (Approve / Reject)
// ─────────────────────────────────────────────────────────────────────────────

export const processPDReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionMessage } = req.body;

    // Verify the document is within this admin's jurisdiction before mutating
    const filter = await getJurisdictionFilter(req.admin);

    const updatedPD = await ProgramDocument.findOneAndUpdate(
      { _id: id, ...filter },
      {
        status,
        rejectionMessage: status === "Draft" ? rejectionMessage || "" : "",
        approvalDate: status === "Approved" ? new Date() : null,
        approvedBy: status === "Approved" ? req.admin._id : null,
      },
      { new: true },
    );

    if (!updatedPD) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized or not found" });
    }

    res.status(200).json({
      success: true,
      message: `PD ${status} successfully`,
      data: updatedPD,
    });
  } catch (error) {
    console.error("processPDReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processCDReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionMessage } = req.body;

    const filter = await getJurisdictionFilter(req.admin);

    const updatedCD = await CourseDocument.findOneAndUpdate(
      { _id: id, ...filter },
      {
        status,
        rejectionMessage: status === "Draft" ? rejectionMessage || "" : "",
        approvalDate: status === "Approved" ? new Date() : null,
        approvedBy: status === "Approved" ? req.admin._id : null,
      },
      { new: true },
    );

    if (!updatedCD) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized or not found" });
    }

    res.status(200).json({
      success: true,
      message: `CD ${status} successfully`,
      data: updatedCD,
    });
  } catch (error) {
    console.error("processCDReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CURRICULUM COMPILER — READINESS CHECK
// ─────────────────────────────────────────────────────────────────────────────

export const checkProgramReadiness = async (req, res) => {
  try {
    const { programId } = req.params;
    const filter = await getJurisdictionFilter(req.admin);

    const pd = await ProgramDocument.findOne({ _id: programId, ...filter })
      .populate("section1_info", "programName")
      .populate("section3_structure");

    if (!pd) {
      return res.status(404).json({
        success: false,
        message: "Program Document not found or access denied",
      });
    }

    const semesters = pd.section3_structure?.semesters || [];

    let totalCourses = 0;
    let approvedCount = 0;

    const analysis = await Promise.all(
      semesters.map(async (sem) => {
        const courseResults = await Promise.all(
          (sem.courses || []).map(async (course) => {
            totalCourses++;

            const approvedCD = await CourseDocument.findOne({
              courseCode: course.code,
              status: "Approved",
            }).select("cdVersion updatedAt");

            if (approvedCD) {
              approvedCount++;
              return {
                code: course.code,
                title: course.title,
                status: "Approved",
                version: approvedCD.cdVersion,
                lastUpdated: approvedCD.updatedAt,
              };
            }

            const pendingCD = await CourseDocument.findOne({
              courseCode: course.code,
              status: "UnderReview",
            });

            return {
              code: course.code,
              title: course.title,
              status: pendingCD ? "Pending" : "Missing",
              version: null,
            };
          }),
        );

        return { number: sem.number, courses: courseResults };
      }),
    );

    const completionPercentage =
      totalCourses > 0 ? Math.round((approvedCount / totalCourses) * 100) : 0;

    res.status(200).json({
      success: true,
      analysis: {
        programCode: pd.programCode,
        // Resolved from section1_info since it's no longer on the PD root
        programName: pd.section1_info?.programName || pd.programCode,
        completionPercentage,
        totalApproved: approvedCount,
        totalRequired: totalCourses,
        semesters: analysis,
      },
    });
  } catch (error) {
    console.error("checkProgramReadiness:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
