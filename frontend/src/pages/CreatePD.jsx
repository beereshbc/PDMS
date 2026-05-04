import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
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
  FileUp,
  Menu,
  AlertTriangle,
  Info,
  Briefcase,
  Award,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  GraduationCap,
  UserPlus,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  SplitSquareHorizontal,
  Wand2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate, Link } from "react-router-dom";
import JoditEditor from "jodit-react";
import Preview from "../components/Preview";
import SearchCreator from "../components/SearchCreator";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & BLANK DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_POS = [
  "Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.",
  "Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.",
  "Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.",
  "Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.",
  "Modern tool usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.",
  "The engineer and society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.",
  "Environment and sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.",
  "Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.",
  "Individual and team work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.",
  "Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.",
  "Project management and finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.",
  "Lifelong learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.",
];

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
  })),
  prof_electives: [],
  open_electives: [],
};

const STEP_CONFIG = [
  {
    id: 1,
    label: "Program Info",
    shortLabel: "Info",
    icon: GraduationCap,
    color: "blue",
  },
  {
    id: 2,
    label: "Objectives",
    shortLabel: "Obj",
    icon: Target,
    color: "violet",
  },
  {
    id: 3,
    label: "Structure",
    shortLabel: "Structure",
    icon: Layers,
    color: "emerald",
  },
  {
    id: 4,
    label: "Electives",
    shortLabel: "Electives",
    icon: BookMarked,
    color: "amber",
  },
];

const buildProgramsFromProfile = (profile) => {
  if (!profile) return [];
  const detectLevel = (prog = "") =>
    prog.toLowerCase().match(/m\.tech|mtech|m\.e|mba|mca|m\.sc|master|pg/)
      ? "PG"
      : "UG";
  const generateCode = (prog = "", disc = "") => {
    let deg = "PROG";
    if (
      prog.toLowerCase().includes("b.tech") ||
      prog.toLowerCase().includes("btech")
    )
      deg = "BTECH";
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

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const OptimizedInput = ({
  value,
  onChange,
  debounceTime = 350,
  className = "",
  ...props
}) => {
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
        `w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150`,
        className,
      ].join(" ")}
    />
  );
};

const StepProgressBar = React.memo(
  ({ activeStep, onStepClick, completions }) => (
    <div className="w-full">
      <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STEP_CONFIG.map((step, idx) => (
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
      <div className="hidden sm:flex items-center gap-0 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
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
            {isPolishing ? "Polishing..." : "Auto-Polish Section"}
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
    {children} {required && <span className="text-rose-400 ml-0.5">*</span>}
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

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────

const ReviewSubmitModal = ({
  isOpen,
  onClose,
  onConfirm,
  axios,
  createrToken,
}) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchAdmins = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get("/api/creater/pd/review-admins", {
            headers: { Authorization: `Bearer ${createrToken}`, createrToken },
          });
          if (data.success) setAdmins(data.admins);
        } catch {
          toast.error("Failed to load reviewers.");
        } finally {
          setLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [isOpen, axios, createrToken]);

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
              Select an Admin / Reviewer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="animate-spin text-gray-400" size={20} />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              No active admins available.
            </div>
          ) : (
            admins.map((admin) => (
              <label
                key={admin._id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedAdminId === admin._id ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-300"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={admin._id}
                    checked={selectedAdminId === admin._id}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedAdminId)}
            disabled={!selectedAdminId}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send size={15} /> Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// ── NEW: ENHANCED AI ASSISTANT MODAL WITH QUICK PROMPTS ──
const AIAssistantModal = ({
  isOpen,
  onClose,
  fieldName,
  currentContent,
  onApply,
  axios,
  createrToken,
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

  const quickPrompts = [
    {
      label: "Fix Grammar",
      text: "Fix all grammar, spelling, and punctuation errors. Keep the original meaning intact.",
    },
    {
      label: "Make Concise",
      text: "Remove unnecessary words and make the text concise, clear, and to the point.",
    },
    {
      label: "Academic Tone",
      text: "Rewrite the text to sound highly professional, academic, and formal.",
    },
    {
      label: "Format as Bullets",
      text: "Convert the content into clear, well-structured HTML bullet points.",
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim())
      return toast.error("Please provide instructions for the AI.");
    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/creater/pd/ai-enhance",
        {
          prompt,
          fieldName,
          currentContent,
        },
        { headers: { Authorization: `Bearer ${createrToken}`, createrToken } },
      );

      if (data.success) {
        setResult(data.enhancedContent);
        toast.success("AI generated content successfully!");
      } else {
        toast.error(data.message || "AI Enhancement failed.");
      }
    } catch (err) {
      console.error("AI Assistant Error:", err.response || err);
      toast.error(
        err.response?.data?.message ||
          "Failed to connect to AI service. Check API Keys.",
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
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col lg:flex-row h-[60vh] max-h-[600px] overflow-hidden bg-gray-50">
          {/* LEFT PANE: Instructions & Original Content */}
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white">
            <div className="p-5 flex-1 flex flex-col min-h-0">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                <FileText size={14} className="text-indigo-500" /> Original
                Content
              </label>
              <div
                className="flex-1 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 opacity-70 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: currentContent || "<i>No existing content.</i>",
                }}
              />

              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-5 mb-2">
                <Wand2 size={14} className="text-indigo-500" /> 1-Click
                Enhancements
              </label>

              {/* QUICK ACTION PROMPTS */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(qp.text)}
                    className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              <textarea
                className="w-full h-24 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm resize-none text-indigo-900 placeholder:text-indigo-300"
                placeholder="Or type custom instructions (e.g., Format the pasted text into an HTML table)..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all text-sm disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {loading ? "Generating..." : "Generate Enhancements"}
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Live Preview */}
          <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
            <div className="p-5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  <SplitSquareHorizontal size={14} /> AI Live Preview
                </label>
              </div>

              {result ? (
                <div
                  className="flex-1 overflow-y-auto p-5 bg-white border border-emerald-200 rounded-xl shadow-sm prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 p-8 text-center bg-gray-50/50">
                  <Sparkles size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-medium">
                    Output will appear here.
                  </p>
                  <p className="text-xs mt-1">
                    Select a quick action or provide instructions and click
                    Generate to see the magic.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => {
              onApply(result);
              onClose();
            }}
            disabled={!result}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all text-sm disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Accept & Apply to Field
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CreatePD = () => {
  const navigate = useNavigate();
  const { axios, createrToken } = useAppContext();
  const location = useLocation();

  // ── 1. CORE STATE ─────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [recentVersions, setRecentVersions] = useState([]);

  // Modals & UI States
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentAssignContext, setCurrentAssignContext] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [aiModalConfig, setAiModalConfig] = useState({
    isOpen: false,
    fieldName: "",
    content: "",
    applyCallback: null,
  });
  const [enhancingSection, setEnhancingSection] = useState(null);

  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);

  // States
  const [metaData, setMetaData] = useState({
    programId: "",
    programCode: "",
    programName: "",
    schemeYear: "",
    versionNo: "1.0.0",
    effectiveAy: "",
    totalCredits: 160,
    academicCredits: 130,
    isNew: true,
    status: "draft",
  });
  const [pdData, setPdData] = useState(BLANK_PD_DATA);
  const [dirty, setDirty] = useState(false);

  const joditConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
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

  const filteredPrograms = availablePrograms.filter(
    (p) =>
      p.code.toLowerCase().includes(searchProgram.toLowerCase()) ||
      p.name.toLowerCase().includes(searchProgram.toLowerCase()),
  );

  // ── 1. LOCAL STORAGE SYNC ────────────────────────────────────────────────
  useEffect(() => {
    // Only attempt to load from local storage if NOT loading a specific ID from router state
    if (!location.state?.loadId) {
      const savedMeta = localStorage.getItem("pd_draft_meta");
      const savedData = localStorage.getItem("pd_draft_data");
      if (savedMeta && savedData) {
        try {
          setMetaData(JSON.parse(savedMeta));
          setPdData(JSON.parse(savedData));
          toast("Restored unsaved draft from local storage", { icon: "" });
        } catch (e) {
          clearLocalStorage();
        }
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Auto-save to local storage on change
    if (dirty && metaData.programCode) {
      const t = setTimeout(() => {
        localStorage.setItem("pd_draft_meta", JSON.stringify(metaData));
        localStorage.setItem("pd_draft_data", JSON.stringify(pdData));
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [metaData, pdData, dirty]);

  const clearLocalStorage = () => {
    localStorage.removeItem("pd_draft_meta");
    localStorage.removeItem("pd_draft_data");
  };

  // ── 2. EFFECTS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowProgramDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

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

  useEffect(() => {
    if (location.state?.loadId) fetchFullPD(location.state.loadId);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. API FETCHERS ──────────────────────────────────────────────────────
  const fetchRecentVersions = async (code) => {
    try {
      const { data } = await axios.get(`/api/creater/pd/versions/${code}`, {
        headers: { Authorization: `Bearer ${createrToken}`, createrToken },
      });
      if (data.success) setRecentVersions(data.versions);
    } catch (_) {}
  };

  const fetchLatestPD = async () => {
    if (!metaData.programCode) return toast.error("Select a program first");
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/creater/pd/latest/${metaData.programCode}`,
        { headers: { Authorization: `Bearer ${createrToken}`, createrToken } },
      );
      if (data.success) {
        populateForm(data.pd);
        toast.success("Loaded latest version");
      } else toast.error("No previous versions found.");
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullPD = async (pdId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/creater/pd/fetch/${pdId}`, {
        headers: { Authorization: `Bearer ${createrToken}`, createrToken },
      });
      if (data.success) {
        populateForm(data.pd);
        fetchRecentVersions(data.pd.program_id);
        toast.success(`Loaded v${data.pd.version_no || data.pd.pdVersion}`);
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (pd) => {
    if (pd.pd_data) {
      setPdData(pd.pd_data);
      setMetaData({
        programId: pd.program_id,
        programCode: pd.program_id,
        programName: pd.program_name,
        schemeYear: pd.scheme_year,
        versionNo: pd.version_no,
        effectiveAy: pd.effective_ay,
        totalCredits: pd.total_credits,
        academicCredits: pd.academic_credits,
        isNew: false,
        status: pd.status || "draft",
      });
    }
    setDirty(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("Only PDF files supported.");
    const toastId = toast.loading("AI parsing PDF structure...");
    setImporting(true);
    const formData = new FormData();
    formData.append("pdFile", file);
    try {
      const { data } = await axios.post("/api/creater/pd/import", formData, {
        headers: {
          Authorization: `Bearer ${createrToken}`,
          createrToken,
          "Content-Type": "multipart/form-data",
        },
        timeout: 90000,
      });
      if (data.success) {
        const imp = data.parsedData;
        setPdData((prev) => {
          const n = { ...prev };
          if (imp.details) n.details = { ...prev.details, ...imp.details };
          if (imp.award) n.award = { ...prev.award, ...imp.award };
          if (imp.overview) n.overview = imp.overview;
          if (imp.peos?.length) {
            n.peos = [...imp.peos];
            while (n.peos.length < 3) n.peos.push("");
          }
          if (imp.pos?.length) n.pos = [...imp.pos];
          if (imp.psos?.length) {
            n.psos = [...imp.psos];
            while (n.psos.length < 3) n.psos.push("");
          }
          if (imp.credit_def)
            n.credit_def = { ...prev.credit_def, ...imp.credit_def };
          if (imp.structure_table?.length)
            n.structure_table = imp.structure_table.map((r) => ({
              category: r.category || "",
              credits: r.credits || 0,
              code: r.code || "",
            }));
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
              };
              if (idx >= 0) merged[idx] = mapped;
              else merged.push(mapped);
            });
            merged.sort((a, b) => a.sem_no - b.sem_no);
            while (merged.length < 8)
              merged.push({ sem_no: merged.length + 1, courses: [] });
            n.semesters = merged;
          }
          if (imp.prof_electives?.length)
            n.prof_electives = imp.prof_electives.map((g) => ({
              sem: g.sem || 1,
              title: g.title || `PE - Sem ${g.sem || 1}`,
              courses: (g.courses || []).map((c) => ({
                code: c.code || "",
                title: c.title || "",
                credits: c.credits || 3,
              })),
            }));
          if (imp.open_electives?.length)
            n.open_electives = imp.open_electives.map((g) => ({
              sem: g.sem || 1,
              title: g.title || `OE - Sem ${g.sem || 1}`,
              courses: (g.courses || []).map((c) => ({
                code: c.code || "",
                title: c.title || "",
                credits: c.credits || 3,
              })),
            }));
          return n;
        });
        if (imp.details?.program_name)
          setMetaData((p) => ({ ...p, programName: imp.details.program_name }));
        setDirty(true);
        toast.success("PDF Extracted Successfully!", { id: toastId });
      } else toast.error(data.message || "Import failed", { id: toastId });
    } catch (err) {
      toast.error("Server error during import.", { id: toastId });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── NEW: SECTION-LEVEL AI IMPROVIZER ─────────────────────────────────────
  const handleSectionPolish = async (sectionTitle, dataKey) => {
    setEnhancingSection(sectionTitle);
    const toastId = toast.loading(
      `AI is analyzing and polishing ${sectionTitle}...`,
    );
    try {
      const currentData = pdData[dataKey];
      const { data } = await axios.post(
        "/api/creater/pd/ai-enhance-section",
        {
          sectionName: sectionTitle,
          sectionData: currentData,
        },
        { headers: { Authorization: `Bearer ${createrToken}`, createrToken } },
      );

      if (data.success) {
        setPdData((prev) => ({ ...prev, [dataKey]: data.enhancedData }));
        setDirty(true);
        toast.success(`${sectionTitle} polished successfully!`, {
          id: toastId,
        });
      } else {
        toast.error(data.message || "Failed to polish section.", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Error communicating with AI service.",
        { id: toastId },
      );
    } finally {
      setEnhancingSection(null);
    }
  };

  // ── 4. MUTATION HELPERS ──────────────────────────────────────────────────
  const handleMetaChange = useCallback((f, v) => {
    setDirty(true);
    setMetaData((p) => ({ ...p, [f]: v }));
  }, []);
  const handleNestedChange = useCallback((sec, f, v) => {
    setDirty(true);
    setPdData((p) => ({ ...p, [sec]: { ...p[sec], [f]: v } }));
  }, []);
  const handleOverviewChange = useCallback(
    (c) => {
      if (c !== pdData.overview) {
        setDirty(true);
        setPdData((p) => ({ ...p, overview: c }));
      }
    },
    [pdData.overview],
  );
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

  const addPO = useCallback(() => addArrayItem("pos", ""), [addArrayItem]);
  const removePO = useCallback(
    (i) => {
      if (pdData.pos.length <= 1)
        return toast.error("At least one PO required.");
      if (window.confirm("Delete this PO?")) removeArrayItem("pos", i);
    },
    [pdData.pos.length, removeArrayItem],
  );
  const resetPOs = useCallback(() => {
    if (window.confirm("Replace all POs with standard 12?")) {
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

  const addSemester = useCallback(() => {
    setDirty(true);
    setPdData((p) => {
      const max = Math.max(...p.semesters.map((s) => s.sem_no), 0);
      return {
        ...p,
        semesters: [...p.semesters, { sem_no: max + 1, courses: [] }].sort(
          (a, b) => a.sem_no - b.sem_no,
        ),
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
  const addCourse = useCallback((si) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si].courses.push({
        code: "",
        title: "",
        credits: 3,
        type: "Theory",
        category: "Core",
      });
      return { ...p, semesters: s };
    });
  }, []);
  const removeCourse = useCallback((si, ci) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si].courses = s[si].courses.filter((_, i) => i !== ci);
      return { ...p, semesters: s };
    });
  }, []);
  const updateCourse = useCallback((si, ci, f, v) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si].courses[ci][f] = v;
      return { ...p, semesters: s };
    });
  }, []);

  const handleAssignCreator = useCallback((si, ci, creator) => {
    setDirty(true);
    setPdData((p) => {
      const s = [...p.semesters];
      s[si].courses[ci].assigneeId = creator.id;
      s[si].courses[ci].assigneeName = creator.name;
      return { ...p, semesters: s };
    });
  }, []);
  const handleAssignElectiveCreator = useCallback((type, gi, ci, creator) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].courses[ci].assigneeId = creator.id;
      a[gi].courses[ci].assigneeName = creator.name;
      return { ...p, [key]: a };
    });
  }, []);

  const openAssignModal = (si, ci, c) => {
    setCurrentAssignContext({
      semIndex: si,
      courseIndex: ci,
      code: c.code || "New Course",
      currentAssigneeId: c.assigneeId,
    });
    setIsAssignModalOpen(true);
  };
  const openElectiveAssignModal = (type, gi, ci, c) => {
    setCurrentAssignContext({
      isElective: true,
      electiveType: type,
      groupIndex: gi,
      courseIndex: ci,
      code: c.code || "Elective",
      currentAssigneeId: c.assigneeId,
    });
    setIsAssignModalOpen(true);
  };

  const addElectiveGroup = useCallback((type) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => ({
      ...p,
      [key]: [
        ...p[key],
        {
          sem: 1,
          title: `${type === "prof" ? "Professional" : "Open"} Electives - Sem 1`,
          courses: [],
        },
      ],
    }));
  }, []);
  const removeElectiveGroup = useCallback((type, i) => {
    if (window.confirm("Remove this group?")) {
      setDirty(true);
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
    }
  }, []);
  const updateElectiveGroupSem = useCallback((type, gi, v) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].sem = parseInt(v) || 1;
      return { ...p, [key]: a };
    });
  }, []);
  const updateElectiveGroupTitle = useCallback((type, gi, v) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].title = v;
      return { ...p, [key]: a };
    });
  }, []);
  const addElectiveCourse = useCallback((type, gi) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].courses.push({ code: "", title: "", credits: 3 });
      return { ...p, [key]: a };
    });
  }, []);
  const removeElectiveCourse = useCallback((type, gi, ci) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].courses = a[gi].courses.filter((_, i) => i !== ci);
      return { ...p, [key]: a };
    });
  }, []);
  const updateElectiveCourse = useCallback((type, gi, ci, f, v) => {
    setDirty(true);
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((p) => {
      const a = [...p[key]];
      a[gi].courses[ci][f] = v;
      return { ...p, [key]: a };
    });
  }, []);

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
          university:
            program.college || creatorProfile?.college || "GM University",
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
    [creatorProfile],
  );

  // ── 5. SAVE WORKFLOW ───────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (status = "draft", reviewerId = null) => {
      if (!metaData.programId) return toast.error("Select a program first");
      setLoading(true);
      const payload = {
        programId: metaData.programCode,
        programName: metaData.programName,
        schemeYear: metaData.schemeYear,
        effectiveAy: metaData.effectiveAy,
        totalCredits: metaData.totalCredits,
        academicCredits: metaData.academicCredits,
        isNewProgram: metaData.isNew,
        status: status,
        pdData: pdData,
        reviewerId: reviewerId,
      };
      try {
        const { data } = await axios.post("/api/creater/pd/save", payload, {
          headers: { Authorization: `Bearer ${createrToken}`, createrToken },
        });
        if (data.success) {
          toast.success(
            status === "under_review"
              ? "Submitted for review!"
              : "Draft saved successfully.",
          );
          setMetaData((p) => ({
            ...p,
            isNew: false,
            versionNo: data.version,
            status,
          }));
          fetchRecentVersions(metaData.programCode);
          setDirty(false);
          clearLocalStorage();
        } else toast.error(data.message);
      } catch {
        toast.error("Save failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [metaData, pdData, axios, createrToken],
  );

  const handleSaveAndNext = useCallback(async () => {
    await handleSave("draft");
    setActiveStep((p) => Math.min(4, p + 1));
  }, [handleSave]);

  const handlePreview = useCallback(() => {
    if (!metaData.programId) return toast.error("Select a program first");
    setShowPreviewModal(true);
  }, [metaData.programId]);

  const handleSubmitReviewClick = () => {
    if (!metaData.programId) return toast.error("Select a program first");
    setShowReviewModal(true);
  };

  const triggerAIAssistant = (fieldName, content, applyCallback) => {
    setAiModalConfig({ isOpen: true, fieldName, content, applyCallback });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STEPS
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
      <SectionCard
        icon={<GraduationCap size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Program Selection"
        subtitle="Select the program this document belongs to"
      >
        <div ref={dropdownRef} className="relative mb-4">
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
              placeholder="Search programs..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-300"
              size={16}
            />
          </div>
          {showProgramDropdown && (
            <div className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
              {filteredPrograms.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProgramSelect(p)}
                  className="px-4 py-3 hover:bg-blue-50/60 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-800 text-sm">
                          {p.code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{p.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {metaData.programId && (
            <div className="mt-3 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
          {[
            {
              label: "Scheme Year",
              icon: <Calendar size={11} />,
              field: "schemeYear",
              placeholder: "e.g., 2024",
            },
            {
              label: "Effective A.Y.",
              icon: <Clock size={11} />,
              field: "effectiveAy",
              placeholder: "e.g., 2024-25",
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
                  readOnly ? "bg-gray-50 cursor-not-allowed text-gray-400" : ""
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={<UploadCloud size={16} className="text-violet-500" />}
        iconBg="bg-violet-50"
        title="AI Document Parser"
        subtitle="Upload an existing PDF syllabus to instantly populate all fields below using AI."
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="pd-import-upload"
          />
          <label
            htmlFor="pd-import-upload"
            className={[
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all border shadow-sm",
              importing
                ? "bg-violet-50 border-violet-200 text-violet-400 pointer-events-none"
                : "bg-violet-600 border-violet-700 text-white hover:bg-violet-700",
            ].join(" ")}
          >
            {importing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            {importing ? "AI is Extracting Data..." : "Auto-Fill from PDF"}
          </label>
        </div>
      </SectionCard>

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
                type="text"
                value={v}
                onChange={(val) => handleNestedChange("details", k, val)}
                placeholder={`Enter ${k.replace(/_/g, " ")}`}
              />
            </div>
          ))}
        </div>
      </SectionCard>

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
                type="text"
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

  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
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
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
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

      <SectionCard
        icon={<Target size={16} className="text-indigo-500" />}
        iconBg="bg-indigo-50"
        title="Program Educational Objectives (PEOs)"
        isPolishing={enhancingSection === "PEOs"}
        onPolish={() => handleSectionPolish("PEOs", "peos")}
        action={
          <button
            onClick={() => addArrayItem("peos", "")}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={11} className="text-indigo-500" />
            Add PEO
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
                      className="text-gray-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <JoditEditor
                  value={peo}
                  config={{ ...joditConfig, height: 160 }}
                  onBlur={(v) => handleArrayChange("peos", i, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

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
              className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <RotateCcw size={11} />
              Reset
            </button>
            <button
              onClick={addPO}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <Plus size={11} className="text-emerald-500" />
              Add PO
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
                    className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded transition-colors"
                  >
                    <Sparkles size={13} />
                  </button>
                </div>
                <JoditEditor
                  value={po}
                  config={{ ...joditConfig, height: 120 }}
                  onBlur={(v) => handleArrayChange("pos", i, v)}
                />
              </div>
              <button
                onClick={() => removeArrayItem("pos", i)}
                disabled={pdData.pos.length <= 1}
                className="text-gray-300 hover:text-rose-400 transition-colors mt-1 flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={<Sparkles size={16} className="text-amber-500" />}
        iconBg="bg-amber-50"
        title="Program Specific Outcomes (PSOs)"
        isPolishing={enhancingSection === "PSOs"}
        onPolish={() => handleSectionPolish("PSOs", "psos")}
        action={
          <button
            onClick={() => addArrayItem("psos", "")}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={11} className="text-amber-500" />
            Add PSO
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
                      className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded transition-colors"
                    >
                      <Sparkles size={13} />
                    </button>
                    <button
                      onClick={() => removeArrayItem("psos", i)}
                      className="text-gray-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <JoditEditor
                  value={pso}
                  config={{ ...joditConfig, height: 160 }}
                  onBlur={(v) => handleArrayChange("psos", i, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-in fade-in duration-200">
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

      <SectionCard
        icon={<Table size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Programme Structure"
        action={
          <button
            onClick={addStructureItem}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={11} className="text-blue-500" />
            Add Row
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
                    className={`px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[10px] ${i === 3 ? "w-20" : i === 4 ? "w-12" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pdData.structure_table.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  <td className="px-4 py-2.5 text-gray-300 text-xs text-center">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    <OptimizedInput
                      type="text"
                      value={row.category}
                      onChange={(v) => updateStructureItem(i, "category", v)}
                      className="!py-1.5 !text-xs"
                      placeholder="Category name"
                    />
                  </td>
                  <td className="px-3 py-2.5 w-28">
                    <OptimizedInput
                      type="text"
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Semester-wise Courses
            </h3>
          </div>
          <button
            onClick={addSemester}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={12} />
            Add Semester
          </button>
        </div>
        {pdData.semesters.map((sem, si) => (
          <div
            key={sem.sem_no}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <FolderOpen size={15} className="text-gray-400" />
                <span className="font-semibold text-gray-700 text-sm">
                  Semester {sem.sem_no}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addCourse(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <Plus size={11} />
                  Add
                </button>
                <button
                  onClick={() => removeSemester(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 bg-rose-50 border border-rose-200 rounded-lg"
                >
                  <Trash2 size={11} />
                  Remove
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
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
                          type="text"
                          value={c.code}
                          onChange={(v) => updateCourse(si, ci, "code", v)}
                          className="!py-1.5 !text-xs uppercase !px-2"
                        />
                      </td>
                      <td className="px-2 py-2 min-w-[140px]">
                        <OptimizedInput
                          type="text"
                          value={c.title}
                          onChange={(v) => updateCourse(si, ci, "title", v)}
                          className="!py-1.5 !text-xs !px-2"
                        />
                      </td>
                      <td className="px-2 py-2 w-12">
                        <OptimizedInput
                          type="number"
                          min="0"
                          value={c.credits}
                          onChange={(v) =>
                            updateCourse(si, ci, "credits", parseInt(v) || 0)
                          }
                          className="!py-1.5 !text-xs !text-center !px-1"
                        />
                      </td>
                      <td className="px-2 py-2 w-28">
                        <select
                          value={c.type}
                          onChange={(e) =>
                            updateCourse(si, ci, "type", e.target.value)
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
                            updateCourse(si, ci, "category", e.target.value)
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
                          onClick={() => removeCourse(si, ci)}
                          className="text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => {
    const renderElectiveSection = (type) => {
      const isPE = type === "prof";
      const key = isPE ? "prof_electives" : "open_electives";
      const groups = pdData[key];
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
              <Plus size={11} />
              Add Group
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
                      value={grp.sem}
                      onChange={(v) => updateElectiveGroupSem(type, gi, v)}
                      className="!w-12 !py-1.5 !px-2 !text-xs !text-center"
                    />
                    <OptimizedInput
                      type="text"
                      value={grp.title}
                      onChange={(v) => updateElectiveGroupTitle(type, gi, v)}
                      className="flex-1 min-w-[150px] !py-1.5 !text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addElectiveCourse(type, gi)}
                      className="text-xs px-2.5 py-1.5 font-medium bg-white border border-gray-200 text-gray-600 rounded-lg"
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
                        <tr
                          key={ci}
                          className="hover:bg-gray-50/60 transition-colors group"
                        >
                          <td className="px-2 py-2 w-28">
                            <OptimizedInput
                              type="text"
                              value={c.code}
                              onChange={(v) =>
                                updateElectiveCourse(type, gi, ci, "code", v)
                              }
                              className="!py-1.5 !text-xs !px-2 uppercase"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <OptimizedInput
                              type="text"
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
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      );
    };
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {renderElectiveSection("prof")}
        {renderElectiveSection("open")}
      </div>
    );
  };

  const completions = [
    !!metaData.programId,
    pdData.peos.some((p) => p?.trim()) && pdData.psos.some((p) => p?.trim()),
    pdData.semesters.some((s) => s.courses.length > 0),
    pdData.prof_electives.some((g) => g.courses.length > 0) ||
      pdData.open_electives.some((g) => g.courses.length > 0),
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RETURN
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <CreatorLayout>
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap'); * { font-family: 'DM Sans', sans-serif; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`,
        }}
      />

      <AIAssistantModal
        isOpen={aiModalConfig.isOpen}
        onClose={() => setAiModalConfig({ ...aiModalConfig, isOpen: false })}
        fieldName={aiModalConfig.fieldName}
        currentContent={aiModalConfig.content}
        onApply={aiModalConfig.applyCallback}
        axios={axios}
        createrToken={createrToken}
      />

      {/* Sidebar Modals */}
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
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
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
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Version History
              </span>
            </div>
            {recentVersions.length === 0 ? (
              <p className="text-xs text-gray-300 italic text-center py-4">
                No versions saved yet.
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
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${ver.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {ver.status.replace("_", " ")}
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

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0 pb-10">
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
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest border border-gray-200">
                      v{metaData.versionNo}
                    </span>
                    {dirty && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Unsaved changes
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

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => navigate("/creator/history-pd")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <FolderOpen size={14} />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Menu size={14} />
                <span className="hidden sm:inline">Sections</span>
              </button>
              <button
                onClick={fetchLatestPD}
                disabled={!metaData.programCode || loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40"
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
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-40"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={loading || !metaData.programCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Draft
              </button>
              <button
                onClick={handleSubmitReviewClick}
                disabled={loading || !metaData.programCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40"
              >
                <Send size={14} />
                Submit
              </button>
            </div>
          </div>
          <StepProgressBar
            activeStep={activeStep}
            onStepClick={setActiveStep}
            completions={completions}
          />
        </div>

        {dirty && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs mb-5 bg-yellow-50 border-yellow-200 text-yellow-700">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="font-medium">
              Unsaved content. Please save your draft to update the version
              history.
            </p>
          </div>
        )}

        <div className="min-h-[400px]">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
            disabled={activeStep === 1}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Previous
          </button>
          <div className="flex items-center justify-center gap-2">
            {STEP_CONFIG.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${activeStep === step.id ? "w-5 bg-gray-800" : "bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndNext}
              disabled={loading || !metaData.programCode}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-40 transition-all"
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
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 transition-all shadow-sm"
            >
              Next
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <SearchCreator
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        courseCode={currentAssignContext?.code}
        currentAssigneeId={currentAssignContext?.currentAssigneeId}
        onSelect={(creator) => {
          if (!currentAssignContext) return;
          if (currentAssignContext.isElective)
            handleAssignElectiveCreator(
              currentAssignContext.electiveType,
              currentAssignContext.groupIndex,
              currentAssignContext.courseIndex,
              creator,
            );
          else
            handleAssignCreator(
              currentAssignContext.semIndex,
              currentAssignContext.courseIndex,
              creator,
            );
          setIsAssignModalOpen(false);
        }}
      />
      {showPreviewModal && (
        <Preview
          isModal={true}
          onClose={() => setShowPreviewModal(false)}
          passedPdData={pdData}
          passedMetaData={metaData}
        />
      )}
      <ReviewSubmitModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        axios={axios}
        createrToken={createrToken}
        onConfirm={(adminId) => {
          setShowReviewModal(false);
          handleSave("under_review", adminId);
        }}
      />
    </CreatorLayout>
  );
};

export default CreatePD;

// in EditCD page  also add the AI asistance but remomber outcome ma and assessment weight doont implement because it has diffferent paste and apply structure so implemet the only normal inputs like text areas in edit CD and  in edit Cd implement localstorage feature as CreatePD implement it in Edit CD  localstorage so give full EditCD  updated Code
// give full structured code without any bugs
