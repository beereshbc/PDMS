import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Creater from "../models/Creater.js";
import ProgramDocument from "../models/pd/ProgramDocument.js";
import CourseDocument from "../models/cd/CourseDocument.js";
import PD from "../models/pd/PD.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Resolve the admin's jurisdiction into a list of Creater ObjectIds.
// ─────────────────────────────────────────────────────────────────────────────

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

const getJurisdictionFilter = async (admin) => {
  const createrQuery = {};
  if (admin.faculty) createrQuery.faculty = admin.faculty;
  if (admin.school) createrQuery.school = admin.school;
  if (admin.department) createrQuery.department = admin.department;

  if (Object.keys(createrQuery).length === 0) return {};

  const creators = await Creater.find(createrQuery).select("_id");
  if (creators.length === 0) return { createdBy: { $in: [] } };

  return { createdBy: { $in: creators.map((c) => c._id) } };
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
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (admin.blocked)
      return res
        .status(403)
        .json({ success: false, message: "Admin account is blocked." });
    if (admin.status !== "active")
      return res
        .status(403)
        .json({ success: false, message: "Account pending approval." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    admin.last_login = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
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
    const adminId = req.admin._id;
    const filter = await getJurisdictionFilter(req.admin);

    const [
      pendingPDsCount,
      pendingCDsCount,
      approvedProgramsCount,
      recentPDs,
      recentCDs,
    ] = await Promise.all([
      PD.countDocuments({ status: "under_review", approved_by: adminId }),
      CourseDocument.countDocuments({ status: "UnderReview", ...filter }),
      PD.countDocuments({ status: "approved", approved_by: adminId }),
      PD.find({
        status: { $in: ["approved", "under_review", "draft"] },
        approved_by: adminId,
      })
        .sort({ updated_at: -1 })
        .limit(4)
        .select("program_id program_name status updated_at version_no"),
      CourseDocument.find({
        status: { $in: ["Approved", "UnderReview", "Draft"] },
        ...filter,
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .select("courseCode courseTitle status updatedAt cdVersion"),
    ]);

    const normalizedPDs = recentPDs.map((pd) => ({
      _id: pd._id,
      programCode: pd.program_id,
      programName: pd.program_name,
      status: pd.status,
      updatedAt: pd.updated_at,
      pdVersion: pd.version_no,
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

export const getPendingPDs = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const pds = await PD.find({ status: "under_review", approved_by: adminId })
      .populate(
        "created_by",
        "name email designation department school faculty",
      )
      .sort({ updated_at: -1 });

    res.status(200).json({ success: true, pds });
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
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources")
      .sort({ updatedAt: -1 });

    const formattedCDs = cds.map((cd) => {
      const formatted = buildFormattedCD(cd);
      formatted._id = cd._id;
      formatted.createdBy = cd.createdBy;
      formatted.createdAt = cd.createdAt;
      formatted.updatedAt = cd.updatedAt;
      return formatted;
    });

    res.status(200).json({ success: true, cds: formattedCDs });
  } catch (error) {
    console.error("getPendingCDs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApprovedPDs = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const pds = await PD.find({ status: "approved", approved_by: adminId })
      .populate("created_by", "name email")
      .sort({ updated_at: -1 });
    res.status(200).json({ success: true, pds });
  } catch (error) {
    console.error("getApprovedPDs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPDDetail = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const pd = await PD.findOne({
      _id: req.params.id,
      approved_by: adminId,
    }).populate(
      "created_by",
      "name email faculty school department designation",
    );

    if (!pd)
      return res
        .status(404)
        .json({ success: false, message: "PD not found or access denied" });
    res.status(200).json({ success: true, pd });
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
// 5. REVIEW ACTIONS (Approve / Reject) - UPDATED TO SAVE COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const processPDReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionMessage } = req.body;
    const adminId = req.admin._id;

    const updatedPD = await PD.findOneAndUpdate(
      { _id: id, approved_by: adminId },
      {
        status: status,
        // Optional: you can populate change_summary just for history modal viewing
        change_summary: rejectionMessage || "",
        review_comment: rejectionMessage || "", // Save comment in db
        approved_at: status === "approved" ? new Date() : null,
      },
      { new: true },
    );

    if (!updatedPD)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized or not found" });

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
    const { status, rejectionMessage } = req.body; // status: "Approved" or "Draft"

    const filter = await getJurisdictionFilter(req.admin);

    const updatedCD = await CourseDocument.findOneAndUpdate(
      { _id: id, ...filter },
      {
        status,
        rejectionMessage: rejectionMessage || "",
        reviewComment: rejectionMessage || "", // Save comment in db
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
      message: `Course Document ${status === "Approved" ? "Approved" : "Returned for Revision"} successfully.`,
      data: updatedCD,
    });
  } catch (error) {
    console.error("processCDReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CURRICULUM COMPILER & VERSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const checkProgramReadiness = async (req, res) => {
  try {
    const { programId } = req.params;
    const adminId = req.admin._id;

    const pd = await PD.findOne({ _id: programId, approved_by: adminId });

    if (!pd) {
      return res.status(404).json({
        success: false,
        message: "Program Document not found or access denied",
      });
    }

    const semesters = pd.pd_data?.semesters || [];
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

        return { number: sem.sem_no, courses: courseResults };
      }),
    );

    const completionPercentage =
      totalCourses > 0 ? Math.round((approvedCount / totalCourses) * 100) : 0;

    res.status(200).json({
      success: true,
      analysis: {
        programCode: pd.program_id,
        programName: pd.program_name,
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

export const getPDVersionsForAdmin = async (req, res) => {
  try {
    const { programId } = req.params;
    const adminId = req.admin._id;

    const versions = await PD.find({
      program_id: programId,
      approved_by: adminId,
    })
      .populate("created_by", "name email")
      .select(
        "version_no status created_at updated_at program_name program_id pd_data change_summary review_comment scheme_year effective_ay",
      )
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, versions });
  } catch (error) {
    console.error("getPDVersionsForAdmin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCDVersionsForAdmin = async (req, res) => {
  try {
    const { courseCode } = req.params;
    const filter = await getJurisdictionFilter(req.admin);

    const versions = await CourseDocument.find({ courseCode, ...filter })
      .populate("createdBy", "name email")
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources")
      .sort({ createdAt: -1 });

    const formattedVersions = versions.map((cd) => {
      const formatted = buildFormattedCD(cd);
      formatted._id = cd._id;
      formatted.createdBy = cd.createdBy;
      formatted.createdAt = cd.createdAt;
      formatted.updatedAt = cd.updatedAt;
      // Supply review message for the version history popup
      formatted.change_summary = cd.reviewComment || cd.rejectionMessage || "";
      return formatted;
    });

    res.status(200).json({ success: true, versions: formattedVersions });
  } catch (error) {
    console.error("getCDVersionsForAdmin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: FETCH CDs GROUPED BY PROGRAM DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getGroupedCDReviews = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const filter = await getJurisdictionFilter(req.admin);

    // 1. Get all PDs for this admin
    const pds = await PD.find({
      approved_by: adminId,
      status: { $in: ["approved", "under_review", "draft"] },
    }).select("program_id program_name pd_data version_no status");

    // 2. Get all CDs in admin's jurisdiction
    const allCDs = await CourseDocument.find(filter)
      .populate("createdBy", "name email")
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources")
      .sort({ createdAt: -1 });

    // Deduplicate CDs: Keep only the latest version of each courseCode
    const latestCDsMap = new Map();
    allCDs.forEach((cd) => {
      if (
        !latestCDsMap.has(cd.courseCode) ||
        new Date(cd.updatedAt) >
          new Date(latestCDsMap.get(cd.courseCode).updatedAt)
      ) {
        latestCDsMap.set(cd.courseCode, cd);
      }
    });

    const groupedData = [];
    const processedCourseCodes = new Set();

    // 3. Map CDs into their respective PDs
    for (const pd of pds) {
      const pdCourses = [];
      let stats = {
        approved: 0,
        underReview: 0,
        draft: 0,
        missing: 0,
        total: 0,
      };

      const addCourseToPD = (courseObj, context) => {
        const code = courseObj.code;
        stats.total += 1;
        processedCourseCodes.add(code);

        const cd = latestCDsMap.get(code);
        if (cd) {
          if (cd.status === "Approved") stats.approved++;
          else if (cd.status === "UnderReview") stats.underReview++;
          else stats.draft++;

          pdCourses.push({
            courseCode: code,
            courseTitle: courseObj.title || cd.courseTitle,
            context,
            cdData: buildFormattedCD(cd),
            status: cd.status,
            cdVersion: cd.cdVersion,
            updatedAt: cd.updatedAt,
            createdBy: cd.createdBy,
            _id: cd._id,
          });
        } else {
          stats.missing++;
          pdCourses.push({
            courseCode: code,
            courseTitle: courseObj.title,
            context,
            cdData: null,
            status: "Missing",
            cdVersion: "-",
            updatedAt: null,
            createdBy: null,
            _id: null,
          });
        }
      };

      pd.pd_data?.semesters?.forEach((sem) =>
        sem.courses?.forEach((c) => addCourseToPD(c, `Semester ${sem.sem_no}`)),
      );
      pd.pd_data?.prof_electives?.forEach((grp) =>
        grp.courses?.forEach((c) => addCourseToPD(c, `Prof. Elective`)),
      );
      pd.pd_data?.open_electives?.forEach((grp) =>
        grp.courses?.forEach((c) => addCourseToPD(c, `Open Elective`)),
      );

      groupedData.push({
        pdId: pd._id,
        programCode: pd.program_id,
        programName: pd.program_name,
        pdVersion: pd.version_no,
        pdStatus: pd.status,
        stats,
        courses: pdCourses,
      });
    }

    // 4. Handle "Orphan" CDs
    const orphanCourses = [];
    let orphanStats = {
      approved: 0,
      underReview: 0,
      draft: 0,
      missing: 0,
      total: 0,
    };

    latestCDsMap.forEach((cd, code) => {
      if (!processedCourseCodes.has(code)) {
        orphanStats.total++;
        if (cd.status === "Approved") orphanStats.approved++;
        else if (cd.status === "UnderReview") orphanStats.underReview++;
        else orphanStats.draft++;

        orphanCourses.push({
          courseCode: code,
          courseTitle: cd.courseTitle,
          context: "Unassigned",
          cdData: buildFormattedCD(cd),
          status: cd.status,
          cdVersion: cd.cdVersion,
          updatedAt: cd.updatedAt,
          createdBy: cd.createdBy,
          _id: cd._id,
        });
      }
    });

    if (orphanCourses.length > 0) {
      groupedData.push({
        pdId: "orphan",
        programCode: "OTHER",
        programName: "Unassigned / Standalone Courses",
        pdVersion: "-",
        pdStatus: "mixed",
        stats: orphanStats,
        courses: orphanCourses,
      });
    }

    res.status(200).json({ success: true, groupedData });
  } catch (error) {
    console.error("getGroupedCDReviews:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const compileCurriculumBook = async (req, res) => {
  try {
    const { programId } = req.params;
    const adminId = req.admin._id;

    // 1. Fetch the Program Document
    const pd = await PD.findOne({
      _id: programId,
      approved_by: adminId,
    }).populate("created_by", "name email");
    if (!pd) {
      return res.status(404).json({
        success: false,
        message: "Program Document not found or unauthorized.",
      });
    }

    // 2. Extract all course codes from the PD structure
    const courseCodes = [];
    const pdData = pd.pd_data || {};

    pdData.semesters?.forEach((sem) =>
      sem.courses?.forEach((c) => courseCodes.push(c.code)),
    );
    pdData.prof_electives?.forEach((grp) =>
      grp.courses?.forEach((c) => courseCodes.push(c.code)),
    );
    pdData.open_electives?.forEach((grp) =>
      grp.courses?.forEach((c) => courseCodes.push(c.code)),
    );

    // 3. Fetch all APPROVED Course Documents for those codes
    const cds = await CourseDocument.find({
      courseCode: { $in: courseCodes },
      status: "Approved",
    })
      .populate("section1_identity")
      .populate("section2_outcomes")
      .populate("section3_syllabus")
      .populate("section4_resources");

    // 4. Format them
    const formattedCDs = cds.map((cd) => buildFormattedCD(cd));

    // Sort CDs to roughly match the order they appear in the PD semesters
    formattedCDs.sort(
      (a, b) =>
        courseCodes.indexOf(a.courseCode) - courseCodes.indexOf(b.courseCode),
    );

    res.status(200).json({
      success: true,
      compiledBook: {
        programData: {
          program_id: pd.program_id,
          program_name: pd.program_name,
          scheme_year: pd.scheme_year,
          version_no: pd.version_no,
          effective_ay: pd.effective_ay,
          total_credits: pd.total_credits,
          pd_data: pd.pd_data,
        },
        courses: formattedCDs,
      },
    });
  } catch (error) {
    console.error("compileCurriculumBook error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to compile the curriculum book.",
    });
  }
};

// Add this inside adminController.js
export const getAllPDsForAdmin = async (req, res) => {
  try {
    const adminId = req.admin._id;
    // Fetch ALL PDs assigned to or approved by this admin
    const pds = await PD.find({ approved_by: adminId })
      .populate(
        "created_by",
        "name email designation department school faculty",
      )
      .sort({ updated_at: -1 });

    res.status(200).json({ success: true, pds });
  } catch (error) {
    console.error("getAllPDsForAdmin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
