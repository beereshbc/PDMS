/**
 * CreatePD.jsx — Production-Grade Program Document Manager
 * ─────────────────────────────────────────────────────────
 * Supports: PD Schema 2024 (Legacy) | PD Schema 2026 (Merged/Dynamic)
 * Features: Polymorphic parser routing, drag-drop uploader, abort/retry,
 *           step-progress UI, AI enhancement, section polish, autosave,
 *           version history sidebar, schema-driven form rendering,
 *           polymorphic Section 4 (Electives for 2024 / Institutional
 *           Delivery & Quality fields for 2026).
 *
 * Designed for: ~80,000 concurrent users
 * React Optimizations: useMemo, useCallback, lazy renders, stable refs
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Save,
  Eye,
  Send,
  Plus,
  BookMarked,
  Grid,
  Trash2,
  FileText,
  BookOpen,
  Layers,
  Table,
  Calendar,
  Hash,
  CreditCard,
  Search,
  X,
  Clock,
  CheckCircle,
  Settings,
  FolderOpen,
  History,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  UploadCloud,
  Menu,
  AlertTriangle,
  Info,
  Award,
  Target,
  Sparkles,
  GraduationCap,
  UserPlus,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  SplitSquareHorizontal,
  Wand2,
  ServerCrash,
  ShieldCheck,
  Cpu,
  FileSearch,
  GitBranch,
  Zap,
  XCircle,
  BarChart2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import Preview from "../components/Preview";
import SearchCreator from "../components/SearchCreator";

// ═════════════════════════════════════════════════════════════════════════════
// § 1. CONSTANTS & DEFAULTS
// ═════════════════════════════════════════════════════════════════════════════

const STANDARD_POS = [
  "Engineering knowledge Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.",
  "Problem analysis Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.",
  "Design/development of solutions Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.",
  "Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.",
  "Modern tool usage Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.",
  "The engineer and society Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.",
  "Environment and sustainability Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.",
  "Ethics Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.",
  "Individual and team work Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.",
  "Communication Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.",
  "Project management and finance Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.",
  "Lifelong learning Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.",
];

/**
 * Unified blank state — compatible with both 2024 and 2026 schemas.
 * Section 4 is now polymorphic:
 *   2024 schema → professionalElectives[] / openElectives[]
 *   2026 schema → technicalCompetencyCourses[], programDeliveryAndAttainment,
 *                 teachingLearningMethods[], attendance, assessmentGrading{},
 *                 awardOfDegree, studentSupport[], qualityControlMeasures[], notes
 * Both shapes are always present so the renderer can pick by schemaVersion
 * without losing data when switching schemas.
 */
const BLANK_PD_DATA = {
  details: {
    university: "",
    faculty: "",
    school: "",
    department: "",
    program_name: "",
    director: "",
    hod: "",
    contact_email: "",
    contact_phone: "",
  },
  award: {
    title: "",
    mode: "",
    awarding_body: "",
    joint_award: "",
    teaching_institution: "",
    date_program_specs: "",
    date_approval: "",
    next_review: "",
    approving_body: "",
    accredited_body: "",
    accreditation_grade: "",
    accreditation_validity: "",
    benchmark: "",
  },
  overview: "",
  peos: ["", "", ""],
  pos: STANDARD_POS,
  psos: ["", "", ""],
  credit_def: { L: 0, T: 0, P: 0 },
  structure_table: [],
  semesters: Array.from({ length: 8 }, (_, i) => ({
    sem_no: i + 1,
    courses: [],
    categories: [],
  })),
  // Guarantee section4 object exists immediately
  section4: {
    professionalElectives: [],
    openElectives: [],
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
  },
};

const BLANK_META = {
  programId: "",
  programCode: "",
  programName: "",
  schemaVersion: "2026", // Default to latest
  parseMode: "auto", // "auto" | "stable" | "dynamic"
  schemeYear: "",
  versionNo: "1.0.0",
  effectiveAy: "",
  totalCredits: 160,
  academicCredits: 130,
  isNew: true,
  status: "draft",
};

const STEP_CONFIG = [
  { id: 1, label: "Program Info", shortLabel: "Info", icon: GraduationCap },
  { id: 2, label: "Objectives", shortLabel: "Obj", icon: Target },
  { id: 3, label: "Structure", shortLabel: "Structure", icon: Layers },
  {
    id: 4,
    label: "Additional/Electives",
    shortLabel: "Sec 4",
    icon: BookMarked,
  },
];

/** Parsing step definitions used in the progress UI. */
const PARSE_STEPS = [
  { id: "upload", label: "Uploading file securely", icon: UploadCloud },
  { id: "detect", label: "Detecting schema version", icon: FileSearch },
  { id: "extract", label: "Extracting tables & text", icon: Table },
  { id: "map", label: "Mapping to database structure", icon: GitBranch },
  { id: "validate", label: "Validating structure", icon: ShieldCheck },
  { id: "complete", label: "Finalizing", icon: CheckCircle2 },
];

// ═════════════════════════════════════════════════════════════════════════════
// § 2. UPLOAD STATE REDUCER
// ═════════════════════════════════════════════════════════════════════════════

const UPLOAD_INIT = {
  status: "idle", // idle | uploading | parsing | mapping | success | error
  progress: 0,
  message: "",
  steps: PARSE_STEPS.map((s) => ({ ...s, status: "pending" })),
  summary: null,
  controller: null,
  errorDetails: "",
};

function uploadReducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        ...UPLOAD_INIT,
        status: "uploading",
        progress: 5,
        message: "Uploading PDF securely…",
        controller: action.controller,
        steps: PARSE_STEPS.map((s, i) => ({
          ...s,
          status: i === 0 ? "loading" : "pending",
        })),
      };
    case "STEP": {
      const stepIds = PARSE_STEPS.map((s) => s.id);
      const idx = stepIds.indexOf(action.stepId);
      return {
        ...state,
        status: action.status || state.status,
        progress: action.progress ?? state.progress,
        message: action.message || state.message,
        steps: state.steps.map((s, i) => {
          if (i < idx) return { ...s, status: "done" };
          if (i === idx) return { ...s, status: "loading" };
          return s;
        }),
      };
    }
    case "STEP_DONE": {
      const stepIds = PARSE_STEPS.map((s) => s.id);
      const idx = stepIds.indexOf(action.stepId);
      return {
        ...state,
        steps: state.steps.map((s, i) =>
          i === idx ? { ...s, status: "done" } : s,
        ),
      };
    }
    case "SUCCESS":
      return {
        ...state,
        status: "success",
        progress: 100,
        message: "Extraction complete!",
        steps: state.steps.map((s) => ({ ...s, status: "done" })),
        summary: action.summary,
        controller: null,
      };
    case "ERROR":
      return {
        ...state,
        status: "error",
        progress: 0,
        message: action.message || "Extraction failed.",
        errorDetails: action.details || "",
        controller: null,
        steps: state.steps.map((s) =>
          s.status === "loading" ? { ...s, status: "error" } : s,
        ),
      };
    case "CANCEL":
    case "RESET":
      return { ...UPLOAD_INIT };
    default:
      return state;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// § 3. UTILITY HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const buildProgramsFromProfile = (profile) => {
  if (!profile) return [];
  const detectLevel = (prog = "") =>
    /m\.tech|mtech|m\.e|mba|mca|m\.sc|master|pg/i.test(prog) ? "PG" : "UG";
  const generateCode = (prog = "", disc = "") => {
    let deg = "PROG";
    if (/b\.tech|btech/i.test(prog)) deg = "BTECH";
    const initials = disc
      .split(/[\s&,/]+/)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 5);
    return `${deg}-${initials || "GEN"}`;
  };
  const prog = profile.programme || "";
  const disc = profile.discipline || profile.course || "";
  if (!prog) return [];
  const code = generateCode(prog, disc);
  return [
    {
      id: code,
      code,
      name: disc ? `${prog} in ${disc}` : prog,
      level: detectLevel(prog),
      department: disc,
      faculty: profile.faculty || "",
      school: profile.school || "",
      college: profile.college || "",
    },
  ];
};

const incrementVersion = (v = "1.0.0") => {
  const parts = v.split(".");
  if (parts.length < 3) return "1.0.1";
  parts[2] = String(parseInt(parts[2], 10) + 1);
  return parts.join(".");
};

// ═════════════════════════════════════════════════════════════════════════════
// § 4. CENTRALIZED API SERVICE (avoids raw axios calls scattered in JSX)
// ═════════════════════════════════════════════════════════════════════════════

const buildApiService = (axios, createrToken) => {
  const headers = { Authorization: `Bearer ${createrToken}`, createrToken };
  const multipartHeaders = {
    ...headers,
    "Content-Type": "multipart/form-data",
  };

  return {
    importStable: (formData, signal) =>
      axios.post("/api/creater/pd/import", formData, {
        headers: multipartHeaders,
        timeout: 300000, // 5 Minutes
        signal,
      }),

    importDynamic: (formData, schema, signal) => {
      formData.append("schemaVersion", schema);
      return axios.post("/api/creater/pd/import/dynamic", formData, {
        headers: multipartHeaders,
        timeout: 300000, // 5 Minutes
        signal,
      });
    },

    importAuto: (formData, schema, parseMode, signal) => {
      if (
        parseMode === "dynamic" ||
        (parseMode === "auto" && schema === "2026")
      ) {
        formData.append("schemaVersion", schema);
        return axios.post("/api/creater/pd/import/dynamic", formData, {
          headers: multipartHeaders,
          timeout: 300000, // 5 Minutes
          signal,
        });
      }
      return axios.post("/api/creater/pd/import", formData, {
        headers: multipartHeaders,
        timeout: 300000,
        signal,
      });
    },

    savePD: (payload) =>
      axios.post("/api/creater/pd/save", payload, { headers }),
    fetchLatest: (code) =>
      axios.get(`/api/creater/pd/latest/${code}`, { headers }),
    fetchById: (id) => axios.get(`/api/creater/pd/fetch/${id}`, { headers }),
    fetchVersions: (code) =>
      axios.get(`/api/creater/pd/versions/${code}`, { headers }),
    fetchAdmins: () => axios.get("/api/creater/pd/review-admins", { headers }),
    aiEnhanceField: (body) =>
      axios.post("/api/creater/pd/ai-enhance", body, { headers }),
    aiEnhanceSection: (body) =>
      axios.post("/api/creater/pd/ai-enhance-section", body, { headers }),
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// § 5. REUSABLE UI COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

/** Debounced text input — avoids re-renders on every keystroke. */
const OptimizedInput = React.memo(
  ({ value, onChange, debounceTime = 300, className = "", ...props }) => {
    const [local, setLocal] = useState(value ?? "");

    useEffect(() => {
      setLocal(value ?? "");
    }, [value]);

    useEffect(() => {
      const t = setTimeout(() => {
        if (local !== value) onChange(local);
      }, debounceTime);
      return () => clearTimeout(t);
    }, [local, value, onChange, debounceTime]);

    return (
      <input
        {...props}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => {
          if (local !== value) onChange(e.target.value);
        }}
        className={[
          "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800",
          "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          "focus:border-blue-400 transition-all duration-150",
          className,
        ].join(" ")}
      />
    );
  },
);
OptimizedInput.displayName = "OptimizedInput";

/** Step progress bar — memoized so it never re-renders on every keystroke. */
const StepProgressBar = React.memo(
  ({ activeStep, onStepClick, completions }) => (
    <div className="w-full">
      {/* Mobile pill bar */}
      <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STEP_CONFIG.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={[
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
              activeStep === step.id
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300",
            ].join(" ")}
          >
            <step.icon size={12} />
            {step.shortLabel}
          </button>
        ))}
      </div>

      {/* Desktop step bar */}
      <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
        {STEP_CONFIG.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick(step.id)}
              className={[
                "flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
                activeStep === step.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : completions[idx]
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600",
              ].join(" ")}
            >
              <span
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                  activeStep === step.id
                    ? "bg-white/20 text-white"
                    : completions[idx]
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {completions[idx] && activeStep !== step.id ? (
                  <CheckCircle size={13} strokeWidth={2.5} />
                ) : (
                  step.id
                )}
              </span>
              <span className="hidden md:block truncate">{step.label}</span>
            </button>
            {idx < STEP_CONFIG.length - 1 && (
              <ChevronRight
                size={14}
                className="text-gray-300 flex-shrink-0 mx-0.5"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  ),
);
StepProgressBar.displayName = "StepProgressBar";

/** Card wrapper used across all sections. */
const SectionCard = ({
  icon,
  iconBg,
  title,
  subtitle,
  action,
  onPolish,
  isPolishing,
  children,
  noPad,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-stone-50/50">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${iconBg || "bg-stone-100"}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-800 leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {onPolish && (
          <button
            onClick={onPolish}
            disabled={isPolishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {isPolishing ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Wand2 size={13} />
            )}
            {isPolishing ? "Polishing…" : "Auto-Polish"}
          </button>
        )}
        {action}
      </div>
    </div>
    <div className={noPad ? "" : "p-5"}>{children}</div>
  </div>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const AssignBtn = ({ course, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "flex items-center gap-1 justify-center w-full px-2 py-1.5 rounded-lg text-xs border transition-all font-medium",
      course.assigneeId
        ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        : "bg-gray-50 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50",
    ].join(" ")}
  >
    {course.assigneeId ? (
      <>
        <UserCheck size={12} />
        <span className="truncate max-w-[72px]">
          {course.assigneeName?.split(" ")[0]}
        </span>
      </>
    ) : (
      <>
        <UserPlus size={12} />
        Assign
      </>
    )}
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
// § 6. PARSING PROGRESS UI COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const ParsingProgressView = ({ uploadState, onCancel }) => (
  <div className="w-full max-w-lg mx-auto py-2">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Cpu size={16} className="text-violet-600 animate-pulse" />
        <span className="text-sm font-semibold text-violet-700">
          {uploadState.message}
        </span>
      </div>
      <span className="text-xs font-bold text-violet-500 tabular-nums">
        {uploadState.progress}%
      </span>
    </div>

    {/* Progress bar */}
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500"
        style={{ width: `${uploadState.progress}%` }}
      />
    </div>

    {/* Step list */}
    <div className="space-y-2.5 mb-5">
      {uploadState.steps.map((s) => {
        const StepIcon = s.icon || CheckCircle2;
        return (
          <div key={s.id} className="flex items-center gap-3 text-xs">
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              {s.status === "done" ? (
                <CheckCircle2 className="text-emerald-500" size={15} />
              ) : s.status === "loading" ? (
                <RefreshCw className="animate-spin text-violet-500" size={15} />
              ) : s.status === "error" ? (
                <XCircle className="text-rose-400" size={15} />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200" />
              )}
            </div>
            <span
              className={
                s.status === "done"
                  ? "text-gray-600 font-medium line-through decoration-emerald-400 decoration-1"
                  : s.status === "loading"
                    ? "text-violet-700 font-semibold"
                    : s.status === "error"
                      ? "text-rose-500 font-medium"
                      : "text-gray-300"
              }
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>

    <button
      onClick={onCancel}
      className="text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
    >
      <X size={12} /> Cancel Extraction
    </button>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// § 7. EXTRACTION SUMMARY COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const ExtractionSummary = ({ summary, onReset }) => (
  <div className="text-left animate-in fade-in duration-300 w-full">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 size={18} />
        <span className="text-sm font-bold">Extraction Complete</span>
      </div>
      <button
        onClick={onReset}
        className="text-[10px] uppercase font-bold text-gray-400 hover:text-violet-600 tracking-wider"
      >
        Parse Another
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Schema", value: `PD ${summary.schema}`, color: "indigo" },
        {
          label: "Confidence",
          value: `${summary.confidence}%`,
          color: summary.confidence >= 90 ? "emerald" : "amber",
        },
        { label: "Courses", value: summary.coursesCount, color: "blue" },
        { label: "Semesters", value: summary.semCount, color: "violet" },
      ].map((item) => (
        <div
          key={item.label}
          className={`bg-white border border-${item.color}-100 p-3 rounded-xl`}
        >
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">
            {item.label}
          </p>
          <p className={`text-sm font-bold text-${item.color}-600`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>

    {summary.warnings?.length > 0 && (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-700">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold mb-1">
            Manual Verification Required
          </p>
          <ul className="text-[10px] list-disc list-inside space-y-0.5 ml-1">
            {summary.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    )}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// § 8. MODALS
// ═════════════════════════════════════════════════════════════════════════════

const ReviewSubmitModal = ({ isOpen, onClose, onConfirm, apiService }) => {
  const [admins, setAdmins] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelected("");
    setFetching(true);
    apiService
      .fetchAdmins()
      .then(({ data }) => {
        if (data.success) setAdmins(data.admins);
      })
      .catch(() => toast.error("Failed to load reviewers."))
      .finally(() => setFetching(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Submit for Review
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select an admin or reviewer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-72 overflow-y-auto space-y-2">
          {fetching ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="animate-spin text-gray-400" size={20} />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-400">
              No active admins available.
            </p>
          ) : (
            admins.map((admin) => (
              <label
                key={admin._id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selected === admin._id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={admin._id}
                    checked={selected === admin._id}
                    onChange={(e) => setSelected(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {admin.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {admin.department || admin.email}
                    </p>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={!selected}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            <Send size={15} /> Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const AIAssistantModal = ({
  isOpen,
  onClose,
  fieldName,
  currentContent,
  onApply,
  apiService,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResult("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const QUICK_PROMPTS = [
    {
      label: "Fix Grammar",
      text: "Fix all grammar, spelling, and punctuation. Keep original meaning intact.",
    },
    {
      label: "Make Concise",
      text: "Remove unnecessary words. Make the text concise, clear, and to the point.",
    },
    {
      label: "Academic Tone",
      text: "Rewrite in a highly professional, academic, and formal tone.",
    },
    {
      label: "Bullet Points",
      text: "Convert the content into clear, well-structured HTML bullet points.",
    },
  ];

  const generate = async () => {
    if (!prompt.trim())
      return toast.error("Please provide instructions for the AI.");
    setLoading(true);
    try {
      const { data } = await apiService.aiEnhanceField({
        prompt,
        fieldName,
        currentContent,
      });
      if (data.success) {
        setResult(data.enhancedContent);
        toast.success("AI generated content successfully!");
      } else {
        toast.error(data.message || "AI Enhancement failed.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to connect to AI service.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">
                AI Content Inspector
              </h3>
              <p className="text-indigo-200 text-xs mt-1">
                Enhancing: {fieldName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row h-[60vh] max-h-[600px] overflow-hidden bg-gray-50">
          {/* LEFT: instructions */}
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white">
            <div className="p-5 flex-1 flex flex-col min-h-0">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Original
                Content
              </label>
              <div
                className="flex-1 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 opacity-70 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: currentContent || "<i>No existing content.</i>",
                }}
              />
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-5 mb-2 flex items-center gap-2">
                <Wand2 size={14} className="text-indigo-500" /> 1-Click
                Enhancements
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => setPrompt(qp.text)}
                    className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full h-24 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm resize-none text-indigo-900 placeholder:text-indigo-300"
                placeholder="Or type custom instructions…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                onClick={generate}
                disabled={loading || !prompt.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all text-sm disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {loading ? "Generating…" : "Generate Enhancements"}
              </button>
            </div>
          </div>

          {/* RIGHT: live preview */}
          <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
            <div className="p-5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <SplitSquareHorizontal size={14} /> AI Live Preview
                </label>
              </div>
              {result ? (
                <div
                  className="flex-1 overflow-y-auto p-5 bg-white border border-emerald-200 rounded-xl shadow-sm prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 p-8 text-center">
                  <Sparkles size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-medium">
                    Output will appear here.
                  </p>
                  <p className="text-xs mt-1">
                    Pick a quick action or type custom instructions, then click
                    Generate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
          >
            Discard
          </button>
          <button
            onClick={() => {
              onApply(result);
              onClose();
            }}
            disabled={!result}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md transition-all text-sm disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Accept & Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// § 9. MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const CreatePD = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { axios, createrToken } = useAppContext();

  // ── Stable API service (only rebuilds if token changes) ────────────────
  const apiService = useMemo(
    () => buildApiService(axios, createrToken),
    [axios, createrToken],
  );

  // ── Core UI state ────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Program selection ────────────────────────────────────────────────────
  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [recentVersions, setRecentVersions] = useState([]);

  // ── Upload state (via reducer for correctness) ───────────────────────────
  const [uploadState, dispatchUpload] = useReducer(uploadReducer, UPLOAD_INIT);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // ── Form data ────────────────────────────────────────────────────────────
  const [metaData, setMetaData] = useState(BLANK_META);
  const [pdData, setPdData] = useState(BLANK_PD_DATA);
  const [dirty, setDirty] = useState(false);

  // ── Modals ───────────────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [aiModalConfig, setAiModalConfig] = useState({
    isOpen: false,
    fieldName: "",
    content: "",
    applyCallback: null,
  });
  const [enhancingSection, setEnhancingSection] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentAssignCtx, setCurrentAssignCtx] = useState(null);

  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  // ── Jodit config — memoized once ─────────────────────────────────────────
  const joditConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing…",
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "source",
      ],
      height: 260,
      statusbar: false,
      style: { fontFamily: "'DM Sans', sans-serif", fontSize: "14px" },
      toolbarAdaptive: true,
    }),
    [],
  );

  const joditShort = useMemo(
    () => ({ ...joditConfig, height: 160 }),
    [joditConfig],
  );
  const joditTiny = useMemo(
    () => ({ ...joditConfig, height: 120 }),
    [joditConfig],
  );

  // ── Derived lists ─────────────────────────────────────────────────────────
  const filteredPrograms = useMemo(
    () =>
      availablePrograms.filter(
        (p) =>
          p.code.toLowerCase().includes(searchProgram.toLowerCase()) ||
          p.name.toLowerCase().includes(searchProgram.toLowerCase()),
      ),
    [availablePrograms, searchProgram],
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.1  EFFECTS
  // ═════════════════════════════════════════════════════════════════════════

  /** Close program dropdown on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowProgramDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /** Load creator profile */
  useEffect(() => {
    (async () => {
      try {
        setProfileLoading(true);
        const { data } = await axios.get("/api/creater/profile", {
          headers: { Authorization: `Bearer ${createrToken}`, createrToken },
        });
        if (data.success && data.profile) {
          setCreatorProfile(data.profile);
          setAvailablePrograms(buildProgramsFromProfile(data.profile));
        }
      } catch {
        toast.error("Could not load your profile data.");
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [axios, createrToken]);

  /** Restore draft from localStorage on mount */
  useEffect(() => {
    if (!location.state?.loadId) {
      const savedMeta = localStorage.getItem("pd_draft_meta");
      const savedData = localStorage.getItem("pd_draft_data");
      if (savedMeta && savedData) {
        try {
          setMetaData(JSON.parse(savedMeta));
          setPdData(JSON.parse(savedData));
          toast("Restored unsaved draft", { icon: "📁" });
        } catch {
          clearLocalDraft();
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Load specific PD from router state */
  useEffect(() => {
    if (location.state?.loadId) fetchFullPD(location.state.loadId);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Auto-save to localStorage (debounced 1 s) */
  useEffect(() => {
    if (!dirty || !metaData.programCode) return;
    const t = setTimeout(() => {
      localStorage.setItem("pd_draft_meta", JSON.stringify(metaData));
      localStorage.setItem("pd_draft_data", JSON.stringify(pdData));
    }, 1000);
    return () => clearTimeout(t);
  }, [metaData, pdData, dirty]);

  const clearLocalDraft = () => {
    localStorage.removeItem("pd_draft_meta");
    localStorage.removeItem("pd_draft_data");
  };

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.2  DATA FETCHERS
  // ═════════════════════════════════════════════════════════════════════════

  const fetchRecentVersions = useCallback(
    async (code) => {
      try {
        const { data } = await apiService.fetchVersions(code);
        if (data.success) setRecentVersions(data.versions);
      } catch (_) {}
    },
    [apiService],
  );

  const fetchLatestPD = useCallback(async () => {
    if (!metaData.programCode) return toast.error("Select a program first.");
    setLoading(true);
    try {
      const { data } = await apiService.fetchLatest(metaData.programCode);
      if (data.success) {
        populateForm(data.pd);
        toast.success("Loaded latest version.");
      } else {
        toast.error("No previous versions found.");
      }
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [metaData.programCode, apiService]);

  const fetchFullPD = useCallback(
    async (pdId) => {
      setLoading(true);
      try {
        const { data } = await apiService.fetchById(pdId);
        if (data.success) {
          populateForm(data.pd);
          fetchRecentVersions(data.pd.program_id);
          toast.success(`Loaded v${data.pd.version_no || data.pd.pdVersion}`);
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Failed to load document.");
      } finally {
        setLoading(false);
      }
    },
    [apiService, fetchRecentVersions],
  );

  /** Normalize a raw section4 payload to guarantee both 2024 & 2026 shapes exist. */
  const normaliseSection4 = useCallback((raw) => {
    // Define the absolute base structure inside the function to ensure it's always fresh
    const baseS4 = {
      professionalElectives: [],
      openElectives: [],
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

    if (!raw) return baseS4;

    const s4 = { ...baseS4, ...raw };

    s4.professionalElectives = s4.professionalElectives || [];
    s4.openElectives = s4.openElectives || [];
    s4.technicalCompetencyCourses = s4.technicalCompetencyCourses || [];
    s4.teachingLearningMethods = s4.teachingLearningMethods?.length
      ? s4.teachingLearningMethods
      : [""];
    s4.studentSupport = s4.studentSupport?.length ? s4.studentSupport : [""];
    s4.qualityControlMeasures = s4.qualityControlMeasures?.length
      ? s4.qualityControlMeasures
      : [""];
    s4.assessmentGrading = {
      ...baseS4.assessmentGrading,
      ...(s4.assessmentGrading || {}),
    };
    return s4;
  }, []);

  const populateForm = useCallback(
    (pd) => {
      if (!pd.pd_data) return;

      // Normalise: ensure both `courses` and `categories` exist on every semester
      const sems = (pd.pd_data.semesters || []).map((s) => ({
        sem_no: s.sem_no,
        courses: s.courses || [],
        categories: s.categories || [],
      }));
      while (sems.length < 8) {
        sems.push({ sem_no: sems.length + 1, courses: [], categories: [] });
      }

      // Support legacy documents saved with old top-level prof_electives /
      // open_electives instead of the new polymorphic section4 object.
      let section4Source = pd.pd_data.section4;
      if (!section4Source) {
        section4Source = {
          professionalElectives: pd.pd_data.prof_electives || [],
          openElectives: pd.pd_data.open_electives || [],
        };
      }

      setPdData({
        ...pd.pd_data,
        semesters: sems,
        section4: normaliseSection4(section4Source),
      });

      setMetaData({
        programId: pd.program_id,
        programCode: pd.program_id,
        programName: pd.program_name,
        schemaVersion: pd.scheme_year || "2024",
        parseMode: "auto",
        schemeYear: pd.scheme_year || "",
        versionNo: pd.version_no,
        effectiveAy: pd.effective_ay,
        totalCredits: pd.total_credits,
        academicCredits: pd.academic_credits,
        isNew: false,
        status: pd.status || "draft",
      });
      setDirty(false);
    },
    [normaliseSection4],
  );
  // ═════════════════════════════════════════════════════════════════════════
  // § 9.3  PDF UPLOAD & PARSING (with abort + retry)
  // ═════════════════════════════════════════════════════════════════════════

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processPDFUpload(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = useCallback((e) => {
    if (e.target.files?.[0]) processPDFUpload(e.target.files[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelUpload = useCallback(() => {
    if (uploadState.controller) {
      uploadState.controller.abort();
      dispatchUpload({ type: "CANCEL" });
      toast("Upload cancelled.");
    }
  }, [uploadState.controller]);

  /** Merge parser output into existing pdData without overwriting user edits. */
  const normaliseParsedData = useCallback(
    (prev, imp) => {
      const n = { ...prev };

      if (imp.details) n.details = { ...prev.details, ...imp.details };
      if (imp.award) n.award = { ...prev.award, ...imp.award };
      if (imp.overview) n.overview = imp.overview;
      if (imp.credit_def)
        n.credit_def = { ...prev.credit_def, ...imp.credit_def };

      if (imp.peos?.length) {
        n.peos = [...imp.peos];
        while (n.peos.length < 3) n.peos.push("");
      }
      if (imp.pos?.length) n.pos = [...imp.pos];
      if (imp.psos?.length) {
        n.psos = [...imp.psos];
        while (n.psos.length < 3) n.psos.push("");
      }

      if (imp.structure_table?.length) {
        n.structure_table = imp.structure_table.map((r) => ({
          category: r.category || "",
          credits: r.credits || 0,
          code: r.code || "",
        }));
      }

      if (imp.semesters?.length) {
        const merged = [...prev.semesters];
        imp.semesters.forEach((s) => {
          const idx = merged.findIndex((x) => x.sem_no === s.sem_no);
          const mapped = {
            sem_no: s.sem_no,
            courses: (s.courses || []).map((c) => ({
              code: c.code || "",
              title: c.title || "",
              credits: c.credits || 0,
              type: c.type || "Theory",
              category: c.category || "Core",
            })),
            categories: (s.categories || []).map((cat) => ({
              categoryName: cat.categoryName || "",
              totalCategoryCredits: cat.totalCategoryCredits || 0,
              courses: (cat.courses || []).map((c) => ({
                code: c.code || "",
                title: c.title || "",
                credits: c.credits || 0,
                type: c.type || "Theory",
                category: c.category || "Core",
              })),
            })),
          };
          if (idx >= 0) merged[idx] = mapped;
          else merged.push(mapped);
        });
        merged.sort((a, b) => a.sem_no - b.sem_no);
        while (merged.length < 8)
          merged.push({
            sem_no: merged.length + 1,
            courses: [],
            categories: [],
          });
        n.semesters = merged;
      }

      // STRICT POLYMORPHIC SECTION 4 MERGE
      // Ensure section4 is always defined before passing to normalizer
      let incomingSection4 = imp.section4 || {};

      // Fallback for legacy 2024 parser arrays at root level
      if (imp.prof_electives?.length)
        incomingSection4.professionalElectives = imp.prof_electives;
      if (imp.open_electives?.length)
        incomingSection4.openElectives = imp.open_electives;

      n.section4 = normaliseSection4({
        ...(prev.section4 || {}),
        ...incomingSection4,
      });

      return n;
    },
    [normaliseSection4],
  );
  /**
   * Core upload function.
   * isRetry = true → fallback from dynamic to stable parser.
   */
  const processPDFUpload = useCallback(
    async (file, isRetry = false) => {
      if (file.type !== "application/pdf") {
        return dispatchUpload({
          type: "ERROR",
          message: "Invalid format. Only PDF files are supported.",
        });
      }
      if (file.size > 15 * 1024 * 1024) {
        return dispatchUpload({
          type: "ERROR",
          message: "File too large. Maximum size is 15 MB.",
        });
      }

      const controller = new AbortController();
      dispatchUpload({ type: "START", controller });

      const formData = new FormData();
      formData.append("pdFile", file);

      // Simulate early step transitions while HTTP request is in-flight
      const step1Timer = setTimeout(
        () =>
          dispatchUpload({
            type: "STEP",
            stepId: "detect",
            status: "uploading",
            progress: 25,
            message: "Analysing document layout…",
          }),
        800,
      );

      const step2Timer = setTimeout(
        () =>
          dispatchUpload({
            type: "STEP",
            stepId: "extract",
            status: "parsing",
            progress: 50,
            message: `Running ${isRetry ? "stable" : metaData.parseMode} extraction engine…`,
          }),
        2200,
      );

      try {
        const { data } = await apiService.importAuto(
          formData,
          metaData.schemaVersion,
          isRetry ? "stable" : metaData.parseMode,
          controller.signal,
        );

        clearTimeout(step1Timer);
        clearTimeout(step2Timer);

        if (!data.success)
          throw new Error(data.message || "Invalid parser response.");

        // Animate remaining steps
        dispatchUpload({
          type: "STEP",
          stepId: "map",
          progress: 75,
          message: "Mapping to database structure…",
        });
        await new Promise((r) => setTimeout(r, 400));
        dispatchUpload({
          type: "STEP",
          stepId: "validate",
          progress: 90,
          message: "Validating structure…",
        });
        await new Promise((r) => setTimeout(r, 300));
        dispatchUpload({
          type: "STEP",
          stepId: "complete",
          progress: 95,
          message: "Finalising…",
        });
        await new Promise((r) => setTimeout(r, 200));

        const imp = data.parsedData;
        const confidence = data.confidence
          ? Math.round(data.confidence * 100)
          : 100;
        const schemaDetected = data.schemaVersion || metaData.schemaVersion;

        // ── Merge parsed data into state ──
        setPdData((prev) => normaliseParsedData(prev, imp));

        if (imp.details?.program_name) {
          setMetaData((p) => ({
            ...p,
            programName: imp.details.program_name,
            schemaVersion: schemaDetected,
          }));
        }

        setDirty(true);

        const totalCourses = (imp.semesters || []).reduce(
          (acc, sem) =>
            acc +
            (sem.courses?.length || 0) +
            (sem.categories || []).reduce(
              (c, cat) => c + (cat.courses?.length || 0),
              0,
            ),
          0,
        );

        dispatchUpload({
          type: "SUCCESS",
          summary: {
            schema: schemaDetected,
            confidence,
            warnings: data.warnings || data.validation?.missingFields || [],
            coursesCount: totalCourses,
            semCount: (imp.semesters || []).length,
          },
        });

        if (confidence < 90) {
          toast("Extraction complete — some sections need verification.", {
            icon: "⚠️",
          });
        } else {
          toast.success("Extraction completed perfectly!");
        }
      } catch (err) {
        clearTimeout(step1Timer);
        clearTimeout(step2Timer);

        if (
          axios.isCancel?.(err) ||
          err.name === "CanceledError" ||
          err.name === "AbortError"
        )
          return;

        // Auto-retry: fall back to stable parser once
        if (!isRetry && metaData.parseMode === "auto") {
          toast("Dynamic parser failed — retrying with stable engine…", {
            icon: "🔄",
          });
          setMetaData((p) => ({ ...p, parseMode: "stable" }));
          return processPDFUpload(file, true);
        }

        dispatchUpload({
          type: "ERROR",
          message:
            err.response?.data?.message ||
            err.message ||
            "Server error during extraction.",
          details: err.response?.data?.details || "",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [
      metaData.parseMode,
      metaData.schemaVersion,
      apiService,
      normaliseParsedData,
    ],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.4  DATA MUTATION HELPERS (all stable refs via useCallback)
  // ═════════════════════════════════════════════════════════════════════════

  const handleMetaChange = useCallback((f, v) => {
    setDirty(true);
    setMetaData((p) => ({ ...p, [f]: v }));
  }, []);

  const handleSchemaChange = useCallback(
    (e) => {
      const newSchema = e.target.value;
      if (
        dirty &&
        !window.confirm(
          `Switching to Schema ${newSchema} may alter the layout. Proceed?`,
        )
      )
        return;
      setMetaData((p) => ({ ...p, schemaVersion: newSchema }));
      setDirty(true);
    },
    [dirty],
  );

  const handleParseModeChange = useCallback((e) => {
    setMetaData((p) => ({ ...p, parseMode: e.target.value }));
  }, []);

  const handleNestedChange = useCallback((sec, f, v) => {
    setDirty(true);
    setPdData((p) => ({ ...p, [sec]: { ...p[sec], [f]: v } }));
  }, []);

  const handleOverviewChange = useCallback((c) => {
    setPdData((p) => {
      if (c === p.overview) return p;
      setDirty(true);
      return { ...p, overview: c };
    });
  }, []);

  const handleArrayChange = useCallback((k, i, c) => {
    setDirty(true);
    setPdData((p) => {
      const a = [...p[k]];
      a[i] = c;
      return { ...p, [k]: a };
    });
  }, []);

  const addArrayItem = useCallback((k, d = "") => {
    setDirty(true);
    setPdData((p) => ({ ...p, [k]: [...p[k], d] }));
  }, []);

  const removeArrayItem = useCallback((k, i) => {
    setDirty(true);
    setPdData((p) => ({ ...p, [k]: p[k].filter((_, idx) => idx !== i) }));
  }, []);

  const resetPOs = useCallback(() => {
    if (window.confirm("Replace all POs with the standard 12?")) {
      setDirty(true);
      setPdData((p) => ({ ...p, pos: [...STANDARD_POS] }));
    }
  }, []);

  const updateCreditDef = useCallback((k, v) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      credit_def: { ...p.credit_def, [k]: parseInt(v) || 0 },
    }));
  }, []);

  /** Generic section4 field setter — used by every polymorphic Section 4 control. */
  const handleSection4Change = useCallback((field, value) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: { ...p.section4, [field]: value },
    }));
  }, []);

  // Structure table
  const addStructureItem = useCallback(() => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      structure_table: [
        ...p.structure_table,
        { category: "", credits: 0, code: "" },
      ],
    }));
  }, []);
  const removeStructureItem = useCallback((i) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      structure_table: p.structure_table.filter((_, idx) => idx !== i),
    }));
  }, []);
  const updateStructureItem = useCallback((i, f, v) => {
    setDirty(true);
    setPdData((p) => {
      const t = [...p.structure_table];
      t[i] = { ...t[i], [f]: v };
      return { ...p, structure_table: t };
    });
  }, []);

  // Semesters
  const addSemester = useCallback(() => {
    setDirty(true);
    setPdData((p) => {
      const max = Math.max(...p.semesters.map((s) => s.sem_no), 0);
      return {
        ...p,
        semesters: [
          ...p.semesters,
          { sem_no: max + 1, courses: [], categories: [] },
        ].sort((a, b) => a.sem_no - b.sem_no),
      };
    });
  }, []);

  const removeSemester = useCallback((i) => {
    if (window.confirm("Delete this semester?")) {
      setDirty(true);
      setPdData((p) => ({
        ...p,
        semesters: p.semesters.filter((_, idx) => idx !== i),
      }));
    }
  }, []);

  // 2024: flat course handlers
  const addCourse2024 = useCallback((si) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si] = {
        ...s[si],
        courses: [
          ...s[si].courses,
          { code: "", title: "", credits: 3, type: "Theory", category: "Core" },
        ],
      };
      return { ...p, semesters: s };
    });
  }, []);
  const removeCourse2024 = useCallback((si, ci) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si] = { ...s[si], courses: s[si].courses.filter((_, i) => i !== ci) };
      return { ...p, semesters: s };
    });
  }, []);
  const updateCourse2024 = useCallback((si, ci, f, v) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const courses = sem.courses.map((c, j) =>
          j === ci ? { ...c, [f]: v } : c,
        );
        return { ...sem, courses };
      });
      return { ...p, semesters: s };
    });
  }, []);

  // 2026: category + course handlers
  const addCategory2026 = useCallback((si) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si] = {
        ...s[si],
        categories: [
          ...s[si].categories,
          {
            categoryName: "New Category",
            totalCategoryCredits: 0,
            courses: [],
          },
        ],
      };
      return { ...p, semesters: s };
    });
  }, []);
  const removeCategory2026 = useCallback((si, catIdx) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si] = {
        ...s[si],
        categories: s[si].categories.filter((_, i) => i !== catIdx),
      };
      return { ...p, semesters: s };
    });
  }, []);
  const updateCategoryName2026 = useCallback((si, catIdx, val) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const cats = sem.categories.map((c, j) =>
          j === catIdx ? { ...c, categoryName: val } : c,
        );
        return { ...sem, categories: cats };
      });
      return { ...p, semesters: s };
    });
  }, []);
  const addCourse2026 = useCallback((si, catIdx) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const cats = sem.categories.map((cat, j) =>
          j === catIdx
            ? {
                ...cat,
                courses: [
                  ...cat.courses,
                  {
                    code: "",
                    title: "",
                    credits: 3,
                    type: "Theory",
                    category: "Core",
                  },
                ],
              }
            : cat,
        );
        return { ...sem, categories: cats };
      });
      return { ...p, semesters: s };
    });
  }, []);
  const removeCourse2026 = useCallback((si, catIdx, ci) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const cats = sem.categories.map((cat, j) =>
          j === catIdx
            ? { ...cat, courses: cat.courses.filter((_, k) => k !== ci) }
            : cat,
        );
        return { ...sem, categories: cats };
      });
      return { ...p, semesters: s };
    });
  }, []);
  const updateCourse2026 = useCallback((si, catIdx, ci, f, v) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const cats = sem.categories.map((cat, j) => {
          if (j !== catIdx) return cat;
          const courses = cat.courses.map((c, k) =>
            k === ci ? { ...c, [f]: v } : c,
          );
          return { ...cat, courses };
        });
        return { ...sem, categories: cats };
      });
      return { ...p, semesters: s };
    });
  }, []);

  // ── Section 4 — 2024 polymorphic Elective group handlers ──
  const addElectiveGroup = useCallback((type) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => ({
      ...p,
      section4: {
        ...p.section4,
        [key]: [
          ...p.section4[key],
          {
            semester: 1,
            sem: 1,
            title: `${type === "prof" ? "Professional" : "Open"} Electives – Sem 1`,
            courses: [],
          },
        ],
      },
    }));
  }, []);
  const removeElectiveGroup = useCallback((type, i) => {
    if (window.confirm("Remove this group?")) {
      setDirty(true);
      const key = type === "prof" ? "professionalElectives" : "openElectives";
      setPdData((p) => ({
        ...p,
        section4: {
          ...p.section4,
          [key]: p.section4[key].filter((_, idx) => idx !== i),
        },
      }));
    }
  }, []);
  const updateElectiveGroupSem = useCallback((type, gi, v) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = [...p.section4[key]];
      a[gi] = { ...a[gi], semester: parseInt(v) || 1, sem: parseInt(v) || 1 };
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);
  const updateElectiveGroupTitle = useCallback((type, gi, v) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = [...p.section4[key]];
      a[gi] = { ...a[gi], title: v };
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);
  const addElectiveCourse = useCallback((type, gi) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = [...p.section4[key]];
      a[gi] = {
        ...a[gi],
        courses: [...a[gi].courses, { code: "", title: "", credits: 3 }],
      };
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);
  const removeElectiveCourse = useCallback((type, gi, ci) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = [...p.section4[key]];
      a[gi] = { ...a[gi], courses: a[gi].courses.filter((_, i) => i !== ci) };
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);
  const updateElectiveCourse = useCallback((type, gi, ci, f, v) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = p.section4[key].map((grp, i) => {
        if (i !== gi) return grp;
        const courses = grp.courses.map((c, j) =>
          j === ci ? { ...c, [f]: v } : c,
        );
        return { ...grp, courses };
      });
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);

  // ── Section 4 — 2026 string-array helpers (Teaching Methods, Student Support, QC Measures) ──
  const addSection4ArrayItem = useCallback((key) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: { ...p.section4, [key]: [...(p.section4[key] || []), ""] },
    }));
  }, []);
  const updateSection4ArrayItem = useCallback((key, i, v) => {
    setDirty(true);
    setPdData((p) => {
      const a = [...(p.section4[key] || [])];
      a[i] = v;
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);
  const removeSection4ArrayItem = useCallback((key, i) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: {
        ...p.section4,
        [key]: (p.section4[key] || []).filter((_, idx) => idx !== i),
      },
    }));
  }, []);

  // ── Section 4 — 2026 Technical Competency Courses ──
  const addTechCompetencyCourse = useCallback(() => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: {
        ...p.section4,
        technicalCompetencyCourses: [
          ...p.section4.technicalCompetencyCourses,
          { code: "", title: "", credits: 1 },
        ],
      },
    }));
  }, []);
  const updateTechCompetencyCourse = useCallback((i, f, v) => {
    setDirty(true);
    setPdData((p) => {
      const a = p.section4.technicalCompetencyCourses.map((c, j) =>
        j === i ? { ...c, [f]: v } : c,
      );
      return {
        ...p,
        section4: { ...p.section4, technicalCompetencyCourses: a },
      };
    });
  }, []);
  const removeTechCompetencyCourse = useCallback((i) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: {
        ...p.section4,
        technicalCompetencyCourses:
          p.section4.technicalCompetencyCourses.filter((_, idx) => idx !== i),
      },
    }));
  }, []);

  // ── Section 4 — 2026 Assessment & Grading nested object ──
  const updateAssessmentGrading = useCallback((field, value) => {
    setDirty(true);
    setPdData((p) => ({
      ...p,
      section4: {
        ...p.section4,
        assessmentGrading: { ...p.section4.assessmentGrading, [field]: value },
      },
    }));
  }, []);

  // ── Assign creators (semester courses) ──
  const handleAssignCreator2024 = useCallback((si, ci, creator) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const courses = sem.courses.map((c, j) =>
          j === ci
            ? { ...c, assigneeId: creator.id, assigneeName: creator.name }
            : c,
        );
        return { ...sem, courses };
      });
      return { ...p, semesters: s };
    });
  }, []);

  const handleAssignCreator2026 = useCallback((si, catIdx, ci, creator) => {
    setDirty(true);
    setPdData((p) => {
      const s = p.semesters.map((sem, i) => {
        if (i !== si) return sem;
        const cats = sem.categories.map((cat, j) => {
          if (j !== catIdx) return cat;
          const courses = cat.courses.map((c, k) =>
            k === ci
              ? { ...c, assigneeId: creator.id, assigneeName: creator.name }
              : c,
          );
          return { ...cat, courses };
        });
        return { ...sem, categories: cats };
      });
      return { ...p, semesters: s };
    });
  }, []);

  const handleAssignElectiveCreator = useCallback((type, gi, ci, creator) => {
    setDirty(true);
    const key = type === "prof" ? "professionalElectives" : "openElectives";
    setPdData((p) => {
      const a = p.section4[key].map((grp, i) => {
        if (i !== gi) return grp;
        const courses = grp.courses.map((c, j) =>
          j === ci
            ? { ...c, assigneeId: creator.id, assigneeName: creator.name }
            : c,
        );
        return { ...grp, courses };
      });
      return { ...p, section4: { ...p.section4, [key]: a } };
    });
  }, []);

  const openAssignModal = useCallback((si, ci, c, catIdx = null) => {
    setCurrentAssignCtx({
      semIndex: si,
      courseIndex: ci,
      catIdx,
      code: c.code || "New Course",
      currentAssigneeId: c.assigneeId,
    });
    setIsAssignModalOpen(true);
  }, []);

  const openElectiveAssignModal = useCallback((type, gi, ci, c) => {
    setCurrentAssignCtx({
      isElective: true,
      electiveType: type,
      groupIndex: gi,
      courseIndex: ci,
      code: c.code || "Elective",
      currentAssigneeId: c.assigneeId,
    });
    setIsAssignModalOpen(true);
  }, []);

  // Program selection
  const handleProgramSelect = useCallback(
    (program) => {
      setMetaData((p) => ({
        ...p,
        programId: program.id,
        programCode: program.code,
        programName: program.name,
        isNew: true,
      }));
      setPdData((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          university: program.college || creatorProfile?.college || "",
          faculty: program.faculty || creatorProfile?.faculty || "",
          school: program.school || creatorProfile?.school || "",
          department: program.department,
          program_name: program.name,
        },
        award: { ...prev.award, title: program.name },
      }));
      setShowProgramDropdown(false);
      setSearchProgram("");
      setDirty(true);
      fetchRecentVersions(program.code);
    },
    [creatorProfile, fetchRecentVersions],
  );

  // AI section polish
  const handleSectionPolish = useCallback(
    async (sectionTitle, dataKey) => {
      setEnhancingSection(sectionTitle);
      const tid = toast.loading(`AI polishing ${sectionTitle}…`);
      try {
        const sectionData =
          dataKey === "section4" ? pdData.section4 : pdData[dataKey];
        const { data } = await apiService.aiEnhanceSection({
          sectionName: sectionTitle,
          sectionData,
        });
        if (data.success) {
          if (dataKey === "section4") {
            setPdData((p) => ({
              ...p,
              section4: normaliseSection4({
                ...p.section4,
                ...data.enhancedData,
              }),
            }));
          } else {
            setPdData((p) => ({ ...p, [dataKey]: data.enhancedData }));
          }
          setDirty(true);
          toast.success(`${sectionTitle} polished!`, { id: tid });
        } else {
          toast.error(data.message || "Failed to polish section.", { id: tid });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "AI service error.", {
          id: tid,
        });
      } finally {
        setEnhancingSection(null);
      }
    },
    [apiService, pdData, normaliseSection4],
  );

  const triggerAIAssistant = useCallback(
    (fieldName, content, applyCallback) => {
      setAiModalConfig({ isOpen: true, fieldName, content, applyCallback });
    },
    [],
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.5  SAVE WORKFLOW
  // ═════════════════════════════════════════════════════════════════════════

  const handleSave = useCallback(
    async (status = "draft", reviewerId = null) => {
      if (!metaData.programId) return toast.error("Select a program first.");
      setLoading(true);
      const payload = {
        programId: metaData.programCode,
        programName: metaData.programName,
        schemeYear: metaData.schemaVersion, // map schemaVersion → schemeYear for backend
        effectiveAy: metaData.effectiveAy,
        totalCredits: metaData.totalCredits,
        academicCredits: metaData.academicCredits,
        isNewProgram: metaData.isNew,
        status,
        pdData,
        reviewerId,
      };
      try {
        const { data } = await apiService.savePD(payload);
        if (data.success) {
          toast.success(
            status === "under_review"
              ? "Submitted for review!"
              : "Draft saved.",
          );
          setMetaData((p) => ({
            ...p,
            isNew: false,
            versionNo: data.version,
            status,
          }));
          fetchRecentVersions(metaData.programCode);
          setDirty(false);
          clearLocalDraft();
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Save failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [metaData, pdData, apiService, fetchRecentVersions],
  );

  const handleSaveAndNext = useCallback(async () => {
    await handleSave("draft");
    setActiveStep((p) => Math.min(4, p + 1));
  }, [handleSave]);

  const handlePreview = useCallback(() => {
    if (!metaData.programId) return toast.error("Select a program first.");
    setShowPreviewModal(true);
  }, [metaData.programId]);

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.6  COMPLETION CHECKS
  // ═════════════════════════════════════════════════════════════════════════
  const completions = useMemo(
    () => [
      !!metaData.programId,

      Array.isArray(pdData.peos) &&
        pdData.peos.some((p) => p?.trim()) &&
        Array.isArray(pdData.psos) &&
        pdData.psos.some((p) => p?.trim()),

      metaData.schemaVersion === "2026"
        ? Array.isArray(pdData.semesters) &&
          pdData.semesters.some((s) => {
            const categories = Array.isArray(s?.categories) ? s.categories : [];

            const categoryCourses = categories.flatMap((cat) =>
              Array.isArray(cat?.courses) ? cat.courses : [],
            );

            return categories.length > 0 || categoryCourses.length > 0;
          })
        : Array.isArray(pdData.semesters) &&
          pdData.semesters.some(
            (s) => Array.isArray(s?.courses) && s.courses.length > 0,
          ),

      metaData.schemaVersion === "2026"
        ? !!(
            pdData.section4?.programDeliveryAndAttainment?.trim() ||
            pdData.section4?.attendance?.trim() ||
            (Array.isArray(pdData.section4?.technicalCompetencyCourses) &&
              pdData.section4.technicalCompetencyCourses.length > 0)
          )
        : (Array.isArray(pdData.section4?.professionalElectives) &&
            pdData.section4.professionalElectives.some(
              (g) => Array.isArray(g?.courses) && g.courses.length > 0,
            )) ||
          (Array.isArray(pdData.section4?.openElectives) &&
            pdData.section4.openElectives.some(
              (g) => Array.isArray(g?.courses) && g.courses.length > 0,
            )),
    ],

    [metaData.programId, metaData.schemaVersion, pdData],
  );
  // ═════════════════════════════════════════════════════════════════════════
  // § 9.7  RENDER: STEP 1 — Program Info & PDF Upload
  // ═════════════════════════════════════════════════════════════════════════

  const renderStep1 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ── Program & Schema Selection ── */}
      <SectionCard
        icon={<GraduationCap size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Program & Schema Selection"
        subtitle="Define the curriculum architecture and link to a program"
      >
        <div className="flex flex-col md:flex-row gap-5 mb-5">
          {/* Program Search */}
          <div ref={dropdownRef} className="relative flex-1">
            <FieldLabel required>Select Program</FieldLabel>
            <div className="relative">
              <input
                type="text"
                value={searchProgram}
                onChange={(e) => {
                  setSearchProgram(e.target.value);
                  setShowProgramDropdown(true);
                }}
                onFocus={() => setShowProgramDropdown(true)}
                placeholder="Search programs…"
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
              <Search
                className="absolute right-3 top-2.5 text-gray-300"
                size={16}
              />
            </div>
            {showProgramDropdown && (
              <div className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {filteredPrograms.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">
                    No programs found.
                  </p>
                ) : (
                  filteredPrograms.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleProgramSelect(p)}
                      className="px-4 py-3 hover:bg-blue-50/60 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="font-semibold text-gray-800 text-sm mb-0.5">
                        {p.code}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{p.name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {metaData.programId && (
              <div className="mt-3 p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {metaData.programName}
                  </p>
                  <p className="text-xs text-blue-500 font-medium mt-0.5">
                    {metaData.programCode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Schema & Parse Mode */}
          <div className="w-full md:w-72 space-y-3">
            <div>
              <FieldLabel required>PD Schema Version</FieldLabel>
              <div className="relative">
                <select
                  value={metaData.schemaVersion}
                  onChange={handleSchemaChange}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                >
                  <option value="2026">
                    PD Schema 2026 (Merged / Dynamic)
                  </option>
                  <option value="2024">PD Schema 2024 (Legacy / Flat)</option>
                </select>
                <ChevronRight
                  className="pointer-events-none absolute right-3 top-2.5 rotate-90 text-gray-400"
                  size={16}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 ml-0.5">
                {metaData.schemaVersion === "2026"
                  ? "Semesters are grouped by category (e.g. Academic, Lab, Elective)."
                  : "Flat semester course list — compatible with pre-2026 documents."}
              </p>
            </div>

            {/* Active schema badge */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                metaData.schemaVersion === "2026"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "bg-amber-50 border-amber-200 text-amber-600"
              }`}
            >
              <Zap size={13} />
              {metaData.schemaVersion === "2026"
                ? "2026 Dynamic Schema Active"
                : "2024 Legacy Schema Active"}
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
          {[
            {
              label: "Scheme Year",
              icon: <Calendar size={11} />,
              field: "schemeYear",
              placeholder: "e.g. 2026",
            },
            {
              label: "Effective A.Y.",
              icon: <Clock size={11} />,
              field: "effectiveAy",
              placeholder: "e.g. 2026-27",
            },
            {
              label: "Total Credits",
              icon: <CreditCard size={11} />,
              field: "totalCredits",
              type: "number",
            },
            {
              label: "Version",
              icon: <Hash size={11} />,
              field: "versionNo",
              readOnly: true,
            },
          ].map(({ label, icon, field, placeholder, type, readOnly }) => (
            <div key={field}>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1.5 tracking-wide">
                {icon}
                {label}
              </label>
              <OptimizedInput
                type={type || "text"}
                value={metaData[field]}
                readOnly={readOnly}
                onChange={(v) =>
                  handleMetaChange(
                    field,
                    type === "number" ? parseInt(v) || 0 : v,
                  )
                }
                placeholder={placeholder}
                className={
                  readOnly
                    ? "!bg-gray-50 cursor-not-allowed !text-gray-400"
                    : ""
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Polymorphic AI Parser ── */}
      <SectionCard
        icon={<UploadCloud size={16} className="text-violet-500" />}
        iconBg="bg-violet-50"
        title="Polymorphic AI Document Parser"
        subtitle={`Smart extraction engine — current mode: ${metaData.parseMode} | schema: ${metaData.schemaVersion}`}
        action={
          <select
            value={metaData.parseMode}
            onChange={handleParseModeChange}
            className="text-xs font-semibold px-2 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg outline-none cursor-pointer"
          >
            <option value="auto">Auto Mode</option>
            <option value="stable">Stable (2024)</option>
            <option value="dynamic">Dynamic AI (2026+)</option>
          </select>
        }
      >
        {/* Mode explanation */}
        <div className="flex flex-wrap gap-2 mb-4 text-[10px]">
          {[
            {
              mode: "auto",
              label: "Auto",
              desc: "Detects schema & routes automatically",
              color: "bg-violet-50 text-violet-600 border-violet-200",
            },
            {
              mode: "stable",
              label: "Stable",
              desc: "Fast parser for 2024-schema PDFs",
              color: "bg-blue-50 text-blue-600 border-blue-200",
            },
            {
              mode: "dynamic",
              label: "Dynamic AI",
              desc: "LLM-assisted for complex layouts",
              color: "bg-indigo-50 text-indigo-600 border-indigo-200",
            },
          ].map((m) => (
            <div
              key={m.mode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-semibold ${m.color} ${metaData.parseMode === m.mode ? "ring-2 ring-offset-1 ring-current" : "opacity-60"}`}
            >
              <span>{m.label}</span>
              <span className="opacity-70 font-normal hidden sm:inline">
                — {m.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragActive
              ? "border-violet-500 bg-violet-50 scale-[1.005]"
              : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="pd-import-upload"
          />

          {/* ── IDLE ── */}
          {uploadState.status === "idle" && (
            <div className="py-2">
              <div className="mx-auto w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 border border-gray-100">
                <UploadCloud size={26} className="text-violet-500" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1">
                Drag & drop your syllabus PDF
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Max 15 MB · Engine auto-detects schema and layout type
              </p>
              <label
                htmlFor="pd-import-upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-600 shadow-sm"
              >
                Browse Files
              </label>
            </div>
          )}

          {/* ── IN PROGRESS ── */}
          {["uploading", "parsing", "mapping"].includes(uploadState.status) && (
            <ParsingProgressView
              uploadState={uploadState}
              onCancel={cancelUpload}
            />
          )}

          {/* ── ERROR ── */}
          {uploadState.status === "error" && (
            <div className="py-2">
              <ServerCrash size={32} className="mx-auto text-rose-400 mb-3" />
              <p className="text-sm font-semibold text-rose-600 mb-1">
                Extraction Failed
              </p>
              <p className="text-xs text-rose-500 mb-4 max-w-sm mx-auto">
                {uploadState.message}
              </p>
              {uploadState.errorDetails && (
                <pre className="text-[10px] text-left bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4 overflow-x-auto max-w-sm mx-auto text-rose-400 whitespace-pre-wrap">
                  {uploadState.errorDetails.slice(0, 200)}
                </pre>
              )}
              <button
                onClick={() => dispatchUpload({ type: "RESET" })}
                className="text-xs font-medium bg-white px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {uploadState.status === "success" && uploadState.summary && (
            <ExtractionSummary
              summary={uploadState.summary}
              onReset={() => dispatchUpload({ type: "RESET" })}
            />
          )}
        </div>
      </SectionCard>

      {/* ── Institutional Details ── */}
      <SectionCard
        icon={<Settings size={16} className="text-gray-400" />}
        iconBg="bg-gray-100"
        title="Institutional Details"
        isPolishing={enhancingSection === "Institutional Details"}
        onPolish={() => handleSectionPolish("Institutional Details", "details")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(pdData.details).map(([k, v]) => (
            <div key={k}>
              <FieldLabel>
                {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </FieldLabel>
              <OptimizedInput
                value={v}
                onChange={(val) => handleNestedChange("details", k, val)}
                placeholder={`Enter ${k.replace(/_/g, " ")}`}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Award Details ── */}
      <SectionCard
        icon={<Award size={16} className="text-amber-500" />}
        iconBg="bg-amber-50"
        title="Award Details"
        isPolishing={enhancingSection === "Award Details"}
        onPolish={() => handleSectionPolish("Award Details", "award")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(pdData.award).map(([k, v]) => (
            <div key={k}>
              <FieldLabel>
                {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </FieldLabel>
              <OptimizedInput
                value={v}
                onChange={(val) => handleNestedChange("award", k, val)}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.8  RENDER: STEP 2 — Objectives
  // ═════════════════════════════════════════════════════════════════════════

  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Program Overview */}
      <SectionCard
        icon={<FileText size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Program Overview"
        action={
          <button
            onClick={() =>
              triggerAIAssistant("Program Overview", pdData.overview, (res) => {
                setDirty(true);
                setPdData((p) => ({ ...p, overview: res }));
              })
            }
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200"
          >
            <Sparkles size={13} /> AI Enhance
          </button>
        }
      >
        <JoditEditor
          value={pdData.overview}
          config={joditConfig}
          onBlur={handleOverviewChange}
        />
      </SectionCard>

      {/* PEOs */}
      <SectionCard
        icon={<Target size={16} className="text-indigo-500" />}
        iconBg="bg-indigo-50"
        title="Program Educational Objectives (PEOs)"
        isPolishing={enhancingSection === "PEOs"}
        onPolish={() => handleSectionPolish("PEOs", "peos")}
        action={
          <button
            onClick={() => addArrayItem("peos", "")}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
          >
            <Plus size={11} className="text-indigo-500" /> Add PEO
          </button>
        }
      >
        <div className="space-y-4">
          {pdData.peos.map((peo, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-1">
                {i + 1}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PEO-{i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        triggerAIAssistant(`PEO ${i + 1}`, peo, (res) =>
                          handleArrayChange("peos", i, res),
                        )
                      }
                      className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded transition-colors"
                    >
                      <Sparkles size={13} />
                    </button>
                    <button
                      onClick={() => removeArrayItem("peos", i)}
                      className="text-gray-300 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <JoditEditor
                  value={peo}
                  config={joditShort}
                  onBlur={(v) => handleArrayChange("peos", i, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* POs */}
      <SectionCard
        icon={<BookOpen size={16} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        title="Program Outcomes (POs)"
        isPolishing={enhancingSection === "POs"}
        onPolish={() => handleSectionPolish("POs", "pos")}
        action={
          <div className="flex gap-2">
            <button
              onClick={resetPOs}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={() => addArrayItem("pos", "")}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
            >
              <Plus size={11} className="text-emerald-500" /> Add PO
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {pdData.pos.map((po, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center mt-1">
                {i + 1}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      triggerAIAssistant(`PO ${i + 1}`, po, (res) =>
                        handleArrayChange("pos", i, res),
                      )
                    }
                    className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded"
                  >
                    <Sparkles size={13} />
                  </button>
                </div>
                <JoditEditor
                  value={po}
                  config={joditTiny}
                  onBlur={(v) => handleArrayChange("pos", i, v)}
                />
              </div>
              <button
                onClick={() => removeArrayItem("pos", i)}
                disabled={pdData.pos.length <= 1}
                className="text-gray-300 hover:text-rose-400 mt-1 flex-shrink-0 disabled:opacity-30"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* PSOs */}
      <SectionCard
        icon={<Sparkles size={16} className="text-amber-500" />}
        iconBg="bg-amber-50"
        title="Program Specific Outcomes (PSOs)"
        isPolishing={enhancingSection === "PSOs"}
        onPolish={() => handleSectionPolish("PSOs", "psos")}
        action={
          <button
            onClick={() => addArrayItem("psos", "")}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
          >
            <Plus size={11} className="text-amber-500" /> Add PSO
          </button>
        }
      >
        <div className="space-y-4">
          {pdData.psos.map((pso, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center mt-1">
                {i + 1}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PSO-{i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        triggerAIAssistant(`PSO ${i + 1}`, pso, (res) =>
                          handleArrayChange("psos", i, res),
                        )
                      }
                      className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded"
                    >
                      <Sparkles size={13} />
                    </button>
                    <button
                      onClick={() => removeArrayItem("psos", i)}
                      className="text-gray-300 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <JoditEditor
                  value={pso}
                  config={joditShort}
                  onBlur={(v) => handleArrayChange("psos", i, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.9  RENDER: STEP 3 — Structure (schema-driven semesters)
  // ═════════════════════════════════════════════════════════════════════════

  /** Render a single semester's 2026 category-based view. */
  const renderSem2026 = useCallback(
    (sem, si) => (
      <div className="p-3 space-y-4">
        {sem.categories.map((cat, catIdx) => (
          <div
            key={catIdx}
            className="border border-indigo-100 rounded-xl overflow-hidden bg-white"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/30 border-b border-indigo-50">
              <div className="flex-1 max-w-sm">
                <OptimizedInput
                  value={cat.categoryName}
                  onChange={(v) => updateCategoryName2026(si, catIdx, v)}
                  className="!py-1 !px-2 !text-xs font-semibold text-indigo-900 !bg-transparent !border-none !shadow-none focus:!ring-0"
                  placeholder="Category name (e.g. Academic)"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addCourse2026(si, catIdx)}
                  className="text-[10px] uppercase font-bold text-indigo-600 px-2 py-1 bg-white border border-indigo-200 rounded hover:bg-indigo-50"
                >
                  + Course
                </button>
                <button
                  onClick={() => removeCategory2026(si, catIdx)}
                  className="text-gray-400 hover:text-rose-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["Code", "Title", "Cr", "Type", "Assignee", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cat.courses.map((c, ci) => (
                    <tr
                      key={ci}
                      className="border-t border-gray-50 hover:bg-gray-50/30"
                    >
                      <td className="p-2 w-28">
                        <OptimizedInput
                          value={c.code}
                          onChange={(v) =>
                            updateCourse2026(si, catIdx, ci, "code", v)
                          }
                          className="!py-1 !text-xs uppercase"
                        />
                      </td>
                      <td className="p-2">
                        <OptimizedInput
                          value={c.title}
                          onChange={(v) =>
                            updateCourse2026(si, catIdx, ci, "title", v)
                          }
                          className="!py-1 !text-xs"
                        />
                      </td>
                      <td className="p-2 w-16">
                        <OptimizedInput
                          type="number"
                          value={c.credits}
                          onChange={(v) =>
                            updateCourse2026(
                              si,
                              catIdx,
                              ci,
                              "credits",
                              parseInt(v) || 0,
                            )
                          }
                          className="!py-1 !text-xs text-center"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <select
                          value={c.type}
                          onChange={(e) =>
                            updateCourse2026(
                              si,
                              catIdx,
                              ci,
                              "type",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white"
                        >
                          <option>Theory</option>
                          <option>Lab</option>
                          <option>Theory+Lab</option>
                          <option>Project</option>
                        </select>
                      </td>
                      <td className="p-2 w-28">
                        <AssignBtn
                          course={c}
                          onClick={() => openAssignModal(si, ci, c, catIdx)}
                        />
                      </td>
                      <td className="p-2 text-center w-10">
                        <button
                          onClick={() => removeCourse2026(si, catIdx, ci)}
                          className="text-gray-300 hover:text-rose-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cat.courses.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-4 text-center text-xs text-gray-300 italic"
                      >
                        No courses yet. Click + Course.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {sem.categories.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 italic">
            No categories yet. Click "Add Category".
          </p>
        )}
      </div>
    ),
    [
      updateCategoryName2026,
      addCourse2026,
      removeCategory2026,
      updateCourse2026,
      removeCourse2026,
      openAssignModal,
    ],
  );

  /** Render a single semester's 2024 flat-course view. */
  const renderSem2024 = useCallback(
    (sem, si) => (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              {[
                "#",
                "Code",
                "Title",
                "Cr",
                "Type",
                "Category",
                "Assignee",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sem.courses.map((c, ci) => (
              <tr
                key={ci}
                className="hover:bg-gray-50/60 transition-colors group"
              >
                <td className="px-3 py-2 text-gray-300 text-center text-[11px]">
                  {ci + 1}
                </td>
                <td className="px-2 py-2 w-24">
                  <OptimizedInput
                    value={c.code}
                    onChange={(v) => updateCourse2024(si, ci, "code", v)}
                    className="!py-1.5 !text-xs uppercase !px-2"
                  />
                </td>
                <td className="px-2 py-2 min-w-[140px]">
                  <OptimizedInput
                    value={c.title}
                    onChange={(v) => updateCourse2024(si, ci, "title", v)}
                    className="!py-1.5 !text-xs !px-2"
                  />
                </td>
                <td className="px-2 py-2 w-12">
                  <OptimizedInput
                    type="number"
                    min="0"
                    value={c.credits}
                    onChange={(v) =>
                      updateCourse2024(si, ci, "credits", parseInt(v) || 0)
                    }
                    className="!py-1.5 !text-xs !text-center !px-1"
                  />
                </td>
                <td className="px-2 py-2 w-28">
                  <select
                    value={c.type}
                    onChange={(e) =>
                      updateCourse2024(si, ci, "type", e.target.value)
                    }
                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option>Theory</option>
                    <option>Lab</option>
                    <option>Theory+Lab</option>
                    <option>Project</option>
                  </select>
                </td>
                <td className="px-2 py-2 w-32">
                  <select
                    value={c.category}
                    onChange={(e) =>
                      updateCourse2024(si, ci, "category", e.target.value)
                    }
                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option>Core</option>
                    <option>Elective</option>
                    <option>Open Elective</option>
                    <option>Project</option>
                  </select>
                </td>
                <td className="px-2 py-2 w-28">
                  <AssignBtn
                    course={c}
                    onClick={() => openAssignModal(si, ci, c)}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeCourse2024(si, ci)}
                    className="text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {sem.courses.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-gray-300 italic"
                >
                  No courses yet. Click Add.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    ),
    [updateCourse2024, removeCourse2024, openAssignModal],
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Credit Definition */}
      <SectionCard
        icon={<Settings size={16} className="text-gray-400" />}
        iconBg="bg-gray-100"
        title="Credit Definition"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ["L", "Lecture", "1 hr/week"],
            ["T", "Tutorial", "2 hr/week"],
            ["P", "Practical", "2 hr/week"],
          ].map(([k, label, hint]) => (
            <div
              key={k}
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center"
            >
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                {label}
              </p>
              <p className="text-[10px] text-gray-300 mb-2">{hint}</p>
              <OptimizedInput
                type="number"
                value={pdData.credit_def[k]}
                onChange={(v) => updateCreditDef(k, v)}
                className="!text-center !font-semibold !text-sm !bg-white"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Programme Structure Table */}
      <SectionCard
        icon={<Table size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Programme Structure"
        action={
          <button
            onClick={addStructureItem}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
          >
            <Plus size={11} className="text-blue-500" /> Add Row
          </button>
        }
        noPad
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#", "Category", "Code", "Credits", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pdData.structure_table.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60 group">
                  <td className="px-4 py-2.5 text-gray-300 text-xs text-center">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <OptimizedInput
                      value={row.category}
                      onChange={(v) => updateStructureItem(i, "category", v)}
                      className="!py-1.5 !text-xs"
                      placeholder="Category name"
                    />
                  </td>
                  <td className="px-3 py-2.5 w-28">
                    <OptimizedInput
                      value={row.code}
                      onChange={(v) => updateStructureItem(i, "code", v)}
                      className="!py-1.5 !text-xs uppercase"
                      placeholder="CODE"
                    />
                  </td>
                  <td className="px-3 py-2.5 w-20">
                    <OptimizedInput
                      type="number"
                      min="0"
                      value={row.credits}
                      onChange={(v) =>
                        updateStructureItem(i, "credits", parseInt(v) || 0)
                      }
                      className="!py-1.5 !text-xs !text-center"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => removeStructureItem(i)}
                      className="text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {pdData.structure_table.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-gray-300"
                  >
                    No rows yet. Click Add Row.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-500"
                >
                  Total Credits
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800">
                  {pdData.structure_table.reduce(
                    (s, r) => s + (r.credits || 0),
                    0,
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* Semester-wise Courses (schema-driven) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Semester-wise Curriculum
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Rendering:{" "}
              <span
                className={`font-semibold ${metaData.schemaVersion === "2026" ? "text-indigo-600" : "text-amber-600"}`}
              >
                {metaData.schemaVersion === "2026"
                  ? "2026 Category-based Structure"
                  : "2024 Flat Course List"}
              </span>
            </p>
          </div>
          <button
            onClick={addSemester}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={12} /> Add Semester
          </button>
        </div>

        {pdData.semesters.map((sem, si) => (
          <div
            key={sem.sem_no}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Semester header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <FolderOpen size={15} className="text-gray-400" />
                <span className="font-semibold text-gray-700 text-sm">
                  Semester {sem.sem_no}
                </span>
                {metaData.schemaVersion === "2026" ? (
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {sem.categories.length} categories
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    {sem.courses.length} courses
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {metaData.schemaVersion === "2026" ? (
                  <button
                    onClick={() => addCategory2026(si)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg"
                  >
                    <Plus size={11} /> Add Category
                  </button>
                ) : (
                  <button
                    onClick={() => addCourse2024(si)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <Plus size={11} /> Add Course
                  </button>
                )}
                <button
                  onClick={() => removeSemester(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 bg-rose-50 border border-rose-200 rounded-lg"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>

            {/* Schema-driven body */}
            {metaData.schemaVersion === "2026"
              ? renderSem2026(sem, si)
              : renderSem2024(sem, si)}
          </div>
        ))}
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.10 RENDER: STEP 4 — Polymorphic (Electives for 2024 / Institutional
  //        Delivery & Quality fields for 2026)
  // ═════════════════════════════════════════════════════════════════════════

  /** 2024 — Professional / Open elective groups (legacy behaviour, preserved). */
  const renderElectiveSection2024 = useCallback(
    (type) => {
      const isPE = type === "prof";
      const key = isPE ? "professionalElectives" : "openElectives";
      const groups = pdData.section4[key] || [];

      return (
        <SectionCard
          icon={
            <Grid
              size={16}
              className={isPE ? "text-blue-500" : "text-emerald-500"}
            />
          }
          iconBg={isPE ? "bg-blue-50" : "bg-emerald-50"}
          title={isPE ? "Professional Electives" : "Open Electives"}
          action={
            <button
              onClick={() => addElectiveGroup(type)}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5"
            >
              <Plus size={11} /> Add Group
            </button>
          }
        >
          <div className="space-y-4">
            {groups.map((grp, gi) => (
              <div
                key={gi}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      Sem
                    </span>
                    <OptimizedInput
                      type="number"
                      min="1"
                      value={grp.semester ?? grp.sem}
                      onChange={(v) => updateElectiveGroupSem(type, gi, v)}
                      className="!w-12 !py-1.5 !px-2 !text-xs !text-center"
                    />
                    <OptimizedInput
                      value={grp.title}
                      onChange={(v) => updateElectiveGroupTitle(type, gi, v)}
                      className="flex-1 min-w-[150px] !py-1.5 !text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addElectiveCourse(type, gi)}
                      className="text-xs px-2.5 py-1.5 font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      + Course
                    </button>
                    <button
                      onClick={() => removeElectiveGroup(type, gi)}
                      className="text-gray-300 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <tbody className="divide-y divide-gray-50">
                      {grp.courses.map((c, ci) => (
                        <tr key={ci} className="hover:bg-gray-50/60 group">
                          <td className="px-2 py-2 w-28">
                            <OptimizedInput
                              value={c.code}
                              onChange={(v) =>
                                updateElectiveCourse(type, gi, ci, "code", v)
                              }
                              className="!py-1.5 !text-xs !px-2 uppercase"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <OptimizedInput
                              value={c.title}
                              onChange={(v) =>
                                updateElectiveCourse(type, gi, ci, "title", v)
                              }
                              className="!py-1.5 !text-xs !px-2"
                            />
                          </td>
                          <td className="px-2 py-2 w-12">
                            <OptimizedInput
                              type="number"
                              min="0"
                              value={c.credits}
                              onChange={(v) =>
                                updateElectiveCourse(
                                  type,
                                  gi,
                                  ci,
                                  "credits",
                                  parseInt(v) || 0,
                                )
                              }
                              className="!py-1.5 !text-xs !text-center !px-1"
                            />
                          </td>
                          <td className="px-2 py-2 w-28">
                            <AssignBtn
                              course={c}
                              onClick={() =>
                                openElectiveAssignModal(type, gi, ci, c)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeElectiveCourse(type, gi, ci)}
                              className="text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {grp.courses.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-xs text-gray-300 italic"
                          >
                            No courses. Click + Course.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6 italic">
                No groups yet. Click "Add Group".
              </p>
            )}
          </div>
        </SectionCard>
      );
    },
    [
      pdData.section4,
      addElectiveGroup,
      removeElectiveGroup,
      updateElectiveGroupSem,
      updateElectiveGroupTitle,
      addElectiveCourse,
      removeElectiveCourse,
      updateElectiveCourse,
      openElectiveAssignModal,
    ],
  );

  /** Generic editable string-array block (Teaching Methods, Student Support, QC Measures). */
  const renderStringArraySection = useCallback(
    (title, key, icon, iconBg, useEditor = false) => (
      <SectionCard icon={icon} iconBg={iconBg} title={title}>
        <div className="space-y-2">
          {(pdData.section4[key] || []).map((item, i) =>
            useEditor ? (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <JoditEditor
                    value={item}
                    config={joditTiny}
                    onBlur={(v) => updateSection4ArrayItem(key, i, v)}
                  />
                </div>
                <button
                  onClick={() => removeSection4ArrayItem(key, i)}
                  className="text-rose-400 hover:bg-rose-50 p-2 rounded-lg flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <OptimizedInput
                  value={item}
                  onChange={(v) => updateSection4ArrayItem(key, i, v)}
                  placeholder={`Enter ${title.toLowerCase()} item`}
                />
                <button
                  onClick={() => removeSection4ArrayItem(key, i)}
                  className="text-rose-400 hover:bg-rose-50 p-2 rounded-lg flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          )}
          <button
            onClick={() => addSection4ArrayItem(key)}
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold mt-1"
          >
            <Plus size={12} /> Add Item
          </button>
        </div>
      </SectionCard>
    ),
    [
      pdData.section4,
      updateSection4ArrayItem,
      removeSection4ArrayItem,
      addSection4ArrayItem,
      joditTiny,
    ],
  );

  const renderStep4 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
      {metaData.schemaVersion === "2024" ? (
        <>
          {renderElectiveSection2024("prof")}
          {renderElectiveSection2024("open")}
        </>
      ) : (
        <>
          {/* Technical Competency Courses */}
          <SectionCard
            icon={<BarChart2 size={16} className="text-violet-500" />}
            iconBg="bg-violet-50"
            title="Technical Competency Courses"
            action={
              <button
                onClick={addTechCompetencyCourse}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm"
              >
                <Plus size={11} /> Add Course
              </button>
            }
            noPad
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-gray-50/60 border-b border-gray-100">
                  <tr>
                    {["Code", "Title", "Cr", ""].map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* BULLETPROOF FIX: Optional chaining and fallback array */}
                  {(pdData.section4?.technicalCompetencyCourses || []).map(
                    (c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60 group">
                        <td className="px-2 py-2 w-28">
                          <OptimizedInput
                            value={c.code}
                            onChange={(v) =>
                              updateTechCompetencyCourse(i, "code", v)
                            }
                            className="!py-1.5 !text-xs uppercase !px-2"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <OptimizedInput
                            value={c.title}
                            onChange={(v) =>
                              updateTechCompetencyCourse(i, "title", v)
                            }
                            className="!py-1.5 !text-xs !px-2"
                          />
                        </td>
                        <td className="px-2 py-2 w-16">
                          <OptimizedInput
                            type="number"
                            value={c.credits}
                            onChange={(v) =>
                              updateTechCompetencyCourse(
                                i,
                                "credits",
                                parseInt(v) || 0,
                              )
                            }
                            className="!py-1.5 !text-xs !text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeTechCompetencyCourse(i)}
                            className="text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                  {(!pdData.section4?.technicalCompetencyCourses ||
                    pdData.section4.technicalCompetencyCourses.length ===
                      0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-xs text-gray-300 italic"
                      >
                        No technical competency courses yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Program Delivery & Attainment */}
          <SectionCard
            icon={<BookOpen size={16} className="text-indigo-500" />}
            iconBg="bg-indigo-50"
            title="Program Delivery & Attainment"
            action={
              <button
                onClick={() =>
                  triggerAIAssistant(
                    "Program Delivery & Attainment",
                    pdData.section4?.programDeliveryAndAttainment || "",
                    (res) =>
                      handleSection4Change("programDeliveryAndAttainment", res),
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200"
              >
                <Sparkles size={13} /> AI Enhance
              </button>
            }
          >
            <JoditEditor
              value={pdData.section4?.programDeliveryAndAttainment || ""}
              config={joditConfig}
              onBlur={(v) =>
                handleSection4Change("programDeliveryAndAttainment", v)
              }
            />
          </SectionCard>

          {renderStringArraySection(
            "Teaching & Learning Methods",
            "teachingLearningMethods",
            <Layers size={16} className="text-blue-500" />,
            "bg-blue-50",
          )}

          {/* Attendance Policy */}
          <SectionCard
            icon={<CheckCircle size={16} className="text-emerald-500" />}
            iconBg="bg-emerald-50"
            title="Attendance Policy"
            action={
              <button
                onClick={() =>
                  triggerAIAssistant(
                    "Attendance Policy",
                    pdData.section4?.attendance || "",
                    (res) => handleSection4Change("attendance", res),
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200"
              >
                <Sparkles size={13} /> AI Enhance
              </button>
            }
          >
            <JoditEditor
              value={pdData.section4?.attendance || ""}
              config={joditShort}
              onBlur={(v) => handleSection4Change("attendance", v)}
            />
          </SectionCard>

          {/* Assessment & Grading */}
          <SectionCard
            icon={<Hash size={16} className="text-amber-500" />}
            iconBg="bg-amber-50"
            title="Assessment & Grading"
          >
            <div className="space-y-4">
              <div>
                <FieldLabel>Description</FieldLabel>
                <JoditEditor
                  value={pdData.section4?.assessmentGrading?.description || ""}
                  config={joditShort}
                  onBlur={(v) => updateAssessmentGrading("description", v)}
                />
              </div>
              <div>
                <FieldLabel>Grade Rules</FieldLabel>
                <JoditEditor
                  value={pdData.section4?.assessmentGrading?.gradeRules || ""}
                  config={joditTiny}
                  onBlur={(v) => updateAssessmentGrading("gradeRules", v)}
                />
              </div>
              <div>
                <FieldLabel>Passing Criteria</FieldLabel>
                <JoditEditor
                  value={
                    pdData.section4?.assessmentGrading?.passingCriteria || ""
                  }
                  config={joditTiny}
                  onBlur={(v) => updateAssessmentGrading("passingCriteria", v)}
                />
              </div>
            </div>
          </SectionCard>

          {/* Award of Degree */}
          <SectionCard
            icon={<Award size={16} className="text-amber-500" />}
            iconBg="bg-amber-50"
            title="Award of Degree"
            action={
              <button
                onClick={() =>
                  triggerAIAssistant(
                    "Award of Degree",
                    pdData.section4?.awardOfDegree || "",
                    (res) => handleSection4Change("awardOfDegree", res),
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 border border-indigo-200"
              >
                <Sparkles size={13} /> AI Enhance
              </button>
            }
          >
            <JoditEditor
              value={pdData.section4?.awardOfDegree || ""}
              config={joditShort}
              onBlur={(v) => handleSection4Change("awardOfDegree", v)}
            />
          </SectionCard>

          {renderStringArraySection(
            "Student Support",
            "studentSupport",
            <UserPlus size={16} className="text-violet-500" />,
            "bg-violet-50",
          )}
          {renderStringArraySection(
            "Quality Control Measures",
            "qualityControlMeasures",
            <ShieldCheck size={16} className="text-amber-500" />,
            "bg-amber-50",
          )}

          {/* Notes */}
          <SectionCard
            icon={<Info size={16} className="text-gray-400" />}
            iconBg="bg-gray-100"
            title="Additional Notes"
          >
            <JoditEditor
              value={pdData.section4?.notes || ""}
              config={joditShort}
              onBlur={(v) => handleSection4Change("notes", v)}
            />
          </SectionCard>
        </>
      )}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.11 SIDEBAR
  // ═════════════════════════════════════════════════════════════════════════

  const renderSidebar = () => (
    <>
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}
      {showSidebar && (
        <div
          ref={sidebarRef}
          className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-gray-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Sections & History
            </h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Completion
              </span>
              <span className="text-xs font-semibold text-gray-600">
                {completions.filter(Boolean).length}/{STEP_CONFIG.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="bg-gray-800 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completions.filter(Boolean).length / STEP_CONFIG.length) * 100}%`,
                }}
              />
            </div>
            <div className="space-y-1">
              {STEP_CONFIG.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setShowSidebar(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${activeStep === step.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-600"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${activeStep === step.id ? "bg-white/20 text-white" : completions[i] ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    {completions[i] && activeStep !== step.id ? (
                      <CheckCircle size={11} strokeWidth={2.5} />
                    ) : (
                      <span className="text-[10px] font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Version History */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Version History
              </span>
            </div>
            {recentVersions.length === 0 ? (
              <p className="text-xs text-gray-300 italic text-center py-4">
                No saved versions yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {recentVersions.map((ver) => (
                  <div
                    key={ver._id}
                    onClick={() => {
                      fetchFullPD(ver._id);
                      setShowSidebar(false);
                    }}
                    className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">
                        v{ver.version_no}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${ver.status === "approved" ? "bg-emerald-50 text-emerald-600" : ver.status === "under_review" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {ver.status?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ver.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // § 9.12 MAIN RETURN
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <CreatorLayout>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
          * { font-family: 'DM Sans', sans-serif; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .animate-in { animation-fill-mode: both; }
          .fade-in { animation: fadeIn 0.2s ease-out; }
          .zoom-in-95 { animation: zoomIn95 0.2s ease-out; }
          .slide-in-from-right-5 { animation: slideInRight 0.2s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        `,
        }}
      />

      {/* ── Modals ── */}
      <AIAssistantModal
        isOpen={aiModalConfig.isOpen}
        onClose={() => setAiModalConfig((p) => ({ ...p, isOpen: false }))}
        fieldName={aiModalConfig.fieldName}
        currentContent={aiModalConfig.content}
        onApply={aiModalConfig.applyCallback}
        apiService={apiService}
      />

      <ReviewSubmitModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        apiService={apiService}
        onConfirm={(adminId) => {
          setShowReviewModal(false);
          handleSave("under_review", adminId);
        }}
      />

      <SearchCreator
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        courseCode={currentAssignCtx?.code}
        currentAssigneeId={currentAssignCtx?.currentAssigneeId}
        onSelect={(creator) => {
          if (!currentAssignCtx) return;
          if (currentAssignCtx.isElective) {
            handleAssignElectiveCreator(
              currentAssignCtx.electiveType,
              currentAssignCtx.groupIndex,
              currentAssignCtx.courseIndex,
              creator,
            );
          } else if (
            currentAssignCtx.catIdx !== null &&
            currentAssignCtx.catIdx !== undefined
          ) {
            handleAssignCreator2026(
              currentAssignCtx.semIndex,
              currentAssignCtx.catIdx,
              currentAssignCtx.courseIndex,
              creator,
            );
          } else {
            handleAssignCreator2024(
              currentAssignCtx.semIndex,
              currentAssignCtx.courseIndex,
              creator,
            );
          }
          setIsAssignModalOpen(false);
        }}
      />

      {showPreviewModal && (
        <Preview
          isModal
          onClose={() => setShowPreviewModal(false)}
          passedPdData={pdData}
          passedMetaData={metaData}
        />
      )}

      {renderSidebar()}

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0 pb-10">
        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookMarked size={18} className="text-gray-400 flex-shrink-0" />
                <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                  Program Document Manager
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                {metaData.programCode ? (
                  <>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                      {metaData.programCode}
                    </span>
                    <span className="text-sm text-gray-600 font-medium truncate max-w-xs">
                      {metaData.programName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                        metaData.schemaVersion === "2026"
                          ? "text-indigo-600 bg-indigo-50 border-indigo-200"
                          : "text-amber-600 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {metaData.schemaVersion} Schema
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest border border-gray-200">
                      v{metaData.versionNo}
                    </span>
                    {dirty && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Unsaved
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">
                    Select a program to begin.
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => navigate("/creator/pd-history")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <FolderOpen size={14} />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                <Menu size={14} />
                <span className="hidden sm:inline">Sections</span>
              </button>
              <button
                onClick={fetchLatestPD}
                disabled={!metaData.programCode || loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Fetch Latest</span>
              </button>
              <button
                onClick={handlePreview}
                disabled={!metaData.programCode}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm disabled:opacity-40"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={loading || !metaData.programCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 shadow-sm disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Draft
              </button>
              <button
                onClick={() => {
                  if (!metaData.programId)
                    return toast.error("Select a program first.");
                  setShowReviewModal(true);
                }}
                disabled={loading || !metaData.programCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-40"
              >
                <Send size={14} /> Submit
              </button>
            </div>
          </div>

          <StepProgressBar
            activeStep={activeStep}
            onStepClick={setActiveStep}
            completions={completions}
          />
        </div>

        {/* Unsaved changes banner */}
        {dirty && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs mb-5 bg-yellow-50 border-yellow-200 text-yellow-700">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="font-medium">
              Unsaved changes. Save your draft to update the version history.
            </p>
          </div>
        )}

        {/* ── Step content ── */}
        <div className="min-h-[400px]">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
        </div>

        {/* ── Bottom navigation ── */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
            disabled={activeStep === 1}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30"
          >
            <ArrowLeft size={16} strokeWidth={2} /> Previous
          </button>

          <div className="flex items-center justify-center gap-2">
            {STEP_CONFIG.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`h-2 rounded-full transition-all duration-200 ${activeStep === step.id ? "w-5 bg-gray-800" : "w-2 bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndNext}
              disabled={loading || !metaData.programCode}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save & Next
            </button>
            <button
              onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
              disabled={activeStep === 4}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 shadow-sm"
            >
              Next <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatePD;
