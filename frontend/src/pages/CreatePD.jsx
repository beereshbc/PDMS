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
  Trash2,
  FileText,
  BookOpen,
  List,
  Layers,
  Table,
  Calendar,
  Hash,
  CreditCard,
  Book,
  Users,
  Search,
  X,
  Clock,
  CheckCircle,
  Settings,
  File,
  Grid,
  FolderOpen,
  History,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  UploadCloud,
  FileUp,
  UserPlus,
  UserCheck,
  Menu,
  AlertTriangle,
  Info,
  Building2,
  GraduationCap,
  BookMarked,
  BarChart3,
  Sparkles,
  Award,
  Target,
  TrendingUp,
  Shield,
  Layers3,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import SearchCreator from "../components/SearchCreator";
import JoditEditor from "jodit-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
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

const PREPOPULATED_DATA = {
  details: {
    university: "GM University",
    faculty: "",
    school: "",
    department: "",
    program_name: "",
    director: "Dr. Sanjay Pande M.B.",
    hod: "Dr. Shivanagowda G M",
    contact_email: "hod.cse@gmu.edu",
    contact_phone: "+91-1234567890",
  },
  award: {
    title: "",
    mode: "Full Time",
    awarding_body: "GM University",
    joint_award: "Not Applicable",
    teaching_institution:
      "Faculty of Engineering and Technology, GM University",
    date_program_specs: "November -2023",
    date_approval: "---",
    next_review: "---",
    approving_body: "---",
    accredited_body: "---",
    accreditation_grade: "---",
    accreditation_validity: "---",
    benchmark: "N/A",
  },
  overview: "",
  peos: ["", "", ""],
  pos: STANDARD_POS,
  psos: ["", "", ""],
  credit_def: { L: 1, T: 1, P: 1 },
  structure_table: [],
  semesters: Array.from({ length: 8 }, (_, i) => ({
    sem_no: i + 1,
    courses: [],
  })),
  prof_electives: [],
  open_electives: [],
};

const STEP_CONFIG = [
  { id: 1, label: "Program Info", shortLabel: "Info", icon: GraduationCap },
  { id: 2, label: "Objectives", shortLabel: "Obj", icon: Target },
  { id: 3, label: "Structure", shortLabel: "Structure", icon: Layers3 },
  { id: 4, label: "Electives", shortLabel: "Electives", icon: BookMarked },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildProgramsFromProfile = (profile) => {
  if (!profile) return [];
  const detectLevel = (prog = "") => {
    const p = prog.toLowerCase();
    return p.includes("m.tech") ||
      p.includes("mtech") ||
      p.includes("m.e") ||
      p.includes("mba") ||
      p.includes("mca") ||
      p.includes("m.sc") ||
      p.includes("master") ||
      p.includes("pg")
      ? "PG"
      : "UG";
  };
  const generateCode = (prog = "", disc = "") => {
    const map = {
      "b.tech": "BTECH",
      btech: "BTECH",
      "m.tech": "MTECH",
      mtech: "MTECH",
      "b.e": "BE",
      "m.e": "ME",
      mba: "MBA",
      mca: "MCA",
      bca: "BCA",
      "b.sc": "BSC",
      "m.sc": "MSC",
    };
    let deg = "PROG";
    for (const [k, v] of Object.entries(map)) {
      if (prog.toLowerCase().includes(k)) {
        deg = v;
        break;
      }
    }
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
// OPTIMIZED INPUT
// ─────────────────────────────────────────────────────────────────────────────

const OptimizedInput = ({
  value,
  onChange,
  debounceTime = 400,
  className = "",
  ...props
}) => {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
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
        "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg",
        "text-sm text-gray-800 placeholder-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400",
        "transition-all duration-150",
        className,
      ].join(" ")}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

const StepProgressBar = React.memo(
  ({ activeStep, onStepClick, completions }) => (
    <div className="w-full">
      {/* Mobile pill tabs */}
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

      {/* Tablet+ full bar */}
      <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm gap-0">
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
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
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
              <span className="block md:hidden">{step.shortLabel}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────────────────────────

const SectionCard = ({
  icon,
  iconBg,
  title,
  subtitle,
  action,
  children,
  noPad,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${iconBg || "bg-gray-100"}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
    <div className={noPad ? "" : "p-5"}>{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// FIELD LABEL
// ─────────────────────────────────────────────────────────────────────────────

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN BUTTON
// ─────────────────────────────────────────────────────────────────────────────

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
        <span className="truncate max-w-[72px]" title={course.assigneeName}>
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
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-500 border-gray-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${colors[color]}`}
    >
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CreatePD = () => {
  const navigate = useNavigate();
  const { axios, createrToken } = useAppContext();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [recentVersions, setRecentVersions] = useState([]);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentAssignContext, setCurrentAssignContext] = useState(null);

  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const programInputRef = useRef(null);

  const [contentDirty, setContentDirty] = useState(new Set());
  const [assignDirty, setAssignDirty] = useState(new Set());

  const markContent = useCallback(
    (s) => setContentDirty((p) => new Set(p).add(s)),
    [],
  );
  const markAssign = useCallback(
    (s) => setAssignDirty((p) => new Set(p).add(s)),
    [],
  );

  const hasContent = contentDirty.size > 0;
  const hasAssign = assignDirty.size > 0;
  const hasAny = hasContent || hasAssign;
  const isAssignOnly = !hasContent && hasAssign;

  const [metaData, setMetaData] = useState({
    programId: "",
    programCode: "",
    programName: "",
    schemeYear: "2024",
    versionNo: "1.0.0",
    effectiveAy: "2024-25",
    totalCredits: 160,
    academicCredits: 130,
    isNew: true,
    status: "Draft",
  });
  const [pdData, setPdData] = useState({ ...PREPOPULATED_DATA });

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

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowProgramDropdown(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target))
        setShowSidebar(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setProfileLoading(true);
        const { data } = await axios.get("/api/creater/profile", {
          headers: { createrToken },
        });
        if (data.success && data.profile) {
          const p = data.profile;
          setCreatorProfile(p);
          setAvailablePrograms(buildProgramsFromProfile(p));
          setPdData((prev) => ({
            ...prev,
            details: {
              ...prev.details,
              university: p.college || "GM University",
              faculty: p.faculty || prev.details.faculty,
              school: p.school || prev.details.school,
            },
          }));
        }
      } catch {
        toast.error("Could not load your profile data.");
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (location.state?.loadId) fetchFullPD(location.state.loadId);
  }, [location.state]);

  // ── API HELPERS ──────────────────────────────────────────────────────────

  const fetchRecentVersions = async (code) => {
    try {
      const { data } = await axios.get(`/api/creater/pd/versions/${code}`, {
        headers: { createrToken },
      });
      if (data.success) setRecentVersions(data.versions);
    } catch {}
  };

  const fetchLatestPD = async () => {
    if (!metaData.programCode) return toast.error("Select a program first");
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/creater/pd/latest/${metaData.programCode}`,
        { headers: { createrToken } },
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
        headers: { createrToken },
      });
      if (data.success) {
        populateForm(data.pd);
        fetchRecentVersions(data.pd.programCode);
        toast.success(`Loaded v${data.pd.pdVersion}`);
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  // ── PDF IMPORT ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("Only PDF files supported.");
    if (!metaData.programId)
      toast("ℹ️ Select a program before importing so details auto-link.", {
        duration: 4000,
      });
    const toastId = toast.loading("Parsing PDF — this can take up to 30s…");
    setImporting(true);
    const formData = new FormData();
    formData.append("pdFile", file);
    try {
      const { data } = await axios.post("/api/creater/pd/import", formData, {
        headers: { createrToken, "Content-Type": "multipart/form-data" },
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
        setContentDirty(
          new Set(["section1", "section2", "section3", "section4"]),
        );
        toast.success("Imported! Review and save.", { id: toastId });
      } else toast.error(data.message || "Import failed", { id: toastId });
    } catch (err) {
      toast.error(
        err.code === "ECONNABORTED"
          ? "Parsing timed out — try a smaller PDF."
          : "Server error during import.",
        { id: toastId },
      );
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── POPULATE FORM ────────────────────────────────────────────────────────

  const populateForm = (pd) => {
    const s1 = pd.section1_info,
      s2 = pd.section2_objectives,
      s3 = pd.section3_structure,
      s4 = pd.section4_electives;
    setMetaData({
      programId: pd.programCode,
      programCode: pd.programCode,
      programName: s1.programName,
      schemeYear: pd.schemeYear,
      versionNo: pd.pdVersion,
      effectiveAy: pd.effectiveAcademicYear,
      totalCredits: s3.totalProgramCredits,
      academicCredits: 130,
      isNew: false,
      status: pd.status || "Draft",
    });
    setPdData({
      details: {
        university: "GM University",
        faculty: s1.faculty,
        school: s1.school,
        department: s1.department,
        program_name: s1.programName,
        director: s1.directorOfSchool,
        hod: s1.headOfDepartment,
        contact_email: s1.contactEmail || "",
        contact_phone: s1.contactPhone || "",
      },
      award: {
        title: s1.awardTitle,
        mode: s1.modeOfStudy,
        awarding_body: s1.awardingInstitution,
        joint_award: s1.jointAward,
        teaching_institution: s1.teachingInstitution,
        date_program_specs: s1.dateOfProgramSpecs,
        date_approval: s1.dateOfCourseApproval,
        next_review: s1.nextReviewDate,
        approving_body: s1.approvingRegulatingBody,
        accredited_body: s1.accreditedBody,
        accreditation_grade: s1.gradeAwarded,
        accreditation_validity: s1.accreditationValidity,
        benchmark: s1.programBenchmark,
      },
      overview: s2.programOverview,
      peos: s2.peos,
      pos: s2.pos,
      psos: s2.psos,
      credit_def: {
        L: s3.creditDefinition.lecture,
        T: s3.creditDefinition.tutorial,
        P: s3.creditDefinition.practical,
      },
      structure_table: s3.structureTable,
      semesters: s3.semesters.map((sem) => ({
        sem_no: sem.semNumber,
        courses: sem.courses,
      })),
      prof_electives: s4.professionalElectives.map((g) => ({
        sem: g.semester,
        title: g.title,
        courses: g.courses,
      })),
      open_electives: s4.openElectives.map((g) => ({
        sem: g.semester,
        title: g.title,
        courses: g.courses,
      })),
    });
    setContentDirty(new Set());
    setAssignDirty(new Set());
  };

  // ── CHANGE HANDLERS ──────────────────────────────────────────────────────

  const handleMetaChange = useCallback(
    (f, v) => setMetaData((p) => ({ ...p, [f]: v })),
    [],
  );
  const handleNestedChange = useCallback(
    (sec, f, v) => {
      markContent("section1");
      setPdData((p) => ({ ...p, [sec]: { ...p[sec], [f]: v } }));
    },
    [markContent],
  );
  const handleOverviewChange = useCallback(
    (c) => {
      if (c !== pdData.overview) {
        markContent("section2");
        setPdData((p) => ({ ...p, overview: c }));
      }
    },
    [pdData.overview, markContent],
  );
  const handleArrayChange = useCallback(
    (k, i, c) => {
      markContent("section2");
      setPdData((p) => {
        const a = [...p[k]];
        a[i] = c;
        return { ...p, [k]: a };
      });
    },
    [markContent],
  );
  const addArrayItem = useCallback(
    (k, d = "") => {
      markContent("section2");
      setPdData((p) => ({ ...p, [k]: [...p[k], d] }));
    },
    [markContent],
  );
  const removeArrayItem = useCallback(
    (k, i) => {
      markContent("section2");
      setPdData((p) => ({ ...p, [k]: p[k].filter((_, idx) => idx !== i) }));
    },
    [markContent],
  );

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
      markContent("section2");
      setPdData((p) => ({ ...p, pos: [...STANDARD_POS] }));
    }
  }, [markContent]);

  const updateCreditDef = useCallback(
    (k, v) => {
      markContent("section3");
      setPdData((p) => ({
        ...p,
        credit_def: { ...p.credit_def, [k]: parseInt(v) || 0 },
      }));
    },
    [markContent],
  );
  const addStructureItem = useCallback(() => {
    markContent("section3");
    setPdData((p) => ({
      ...p,
      structure_table: [
        ...p.structure_table,
        { category: "", credits: 0, code: "" },
      ],
    }));
  }, [markContent]);
  const removeStructureItem = useCallback(
    (i) => {
      markContent("section3");
      setPdData((p) => ({
        ...p,
        structure_table: p.structure_table.filter((_, idx) => idx !== i),
      }));
    },
    [markContent],
  );
  const updateStructureItem = useCallback(
    (i, f, v) => {
      markContent("section3");
      setPdData((p) => {
        const t = [...p.structure_table];
        t[i] = { ...t[i], [f]: v };
        return { ...p, structure_table: t };
      });
    },
    [markContent],
  );

  const addSemester = useCallback(() => {
    markContent("section3");
    setPdData((p) => {
      const max = Math.max(...p.semesters.map((s) => s.sem_no), 0);
      return {
        ...p,
        semesters: [...p.semesters, { sem_no: max + 1, courses: [] }].sort(
          (a, b) => a.sem_no - b.sem_no,
        ),
      };
    });
  }, [markContent]);
  const removeSemester = useCallback(
    (i) => {
      if (pdData.semesters.length <= 1)
        return toast.error("At least one semester required.");
      if (window.confirm("Delete this semester?")) {
        markContent("section3");
        setPdData((p) => ({
          ...p,
          semesters: p.semesters.filter((_, idx) => idx !== i),
        }));
      }
    },
    [pdData.semesters.length, markContent],
  );
  const addCourse = useCallback(
    (si) => {
      markContent("section3");
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
    },
    [markContent],
  );
  const removeCourse = useCallback(
    (si, ci) => {
      markContent("section3");
      setPdData((p) => {
        const s = [...p.semesters];
        s[si].courses = s[si].courses.filter((_, i) => i !== ci);
        return { ...p, semesters: s };
      });
    },
    [markContent],
  );
  const updateCourse = useCallback(
    (si, ci, f, v) => {
      markContent("section3");
      setPdData((p) => {
        const s = [...p.semesters];
        s[si].courses[ci][f] = v;
        return { ...p, semesters: s };
      });
    },
    [markContent],
  );

  const handleAssignCreator = useCallback(
    (si, ci, creator) => {
      markAssign("section3");
      setPdData((p) => {
        const s = [...p.semesters];
        s[si].courses[ci].assigneeId = creator.id;
        s[si].courses[ci].assigneeName = creator.name;
        return { ...p, semesters: s };
      });
    },
    [markAssign],
  );
  const handleAssignElectiveCreator = useCallback(
    (type, gi, ci, creator) => {
      markAssign("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].courses[ci].assigneeId = creator.id;
        a[gi].courses[ci].assigneeName = creator.name;
        return { ...p, [key]: a };
      });
    },
    [markAssign],
  );

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

  const addElectiveGroup = useCallback(
    (type) => {
      markContent("section4");
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
    },
    [markContent],
  );
  const removeElectiveGroup = useCallback(
    (type, i) => {
      if (window.confirm("Remove this group?")) {
        markContent("section4");
        const key = type === "prof" ? "prof_electives" : "open_electives";
        setPdData((p) => ({
          ...p,
          [key]: p[key].filter((_, idx) => idx !== i),
        }));
      }
    },
    [markContent],
  );
  const updateElectiveGroupSem = useCallback(
    (type, gi, v) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].sem = parseInt(v) || 1;
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );
  const updateElectiveGroupTitle = useCallback(
    (type, gi, v) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].title = v;
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );
  const addElectiveCourse = useCallback(
    (type, gi) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].courses.push({ code: "", title: "", credits: 3 });
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );
  const removeElectiveCourse = useCallback(
    (type, gi, ci) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].courses = a[gi].courses.filter((_, i) => i !== ci);
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );
  const updateElectiveCourse = useCallback(
    (type, gi, ci, f, v) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].courses[ci][f] = v;
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );

  const handleProgramSelect = useCallback(
    (program) => {
      setMetaData((p) => ({
        ...p,
        programId: program.id,
        programCode: program.code,
        programName: program.name,
        isNew: true,
      }));
      setPdData({
        ...PREPOPULATED_DATA,
        details: {
          ...PREPOPULATED_DATA.details,
          university:
            program.college || creatorProfile?.college || "GM University",
          faculty: program.faculty || creatorProfile?.faculty || "",
          school: program.school || creatorProfile?.school || "",
          department: program.department,
          program_name: program.name,
        },
        award: { ...PREPOPULATED_DATA.award, title: program.name },
      });
      setShowProgramDropdown(false);
      setSearchProgram("");
      fetchRecentVersions(program.code);
      setContentDirty(
        new Set(["section1", "section2", "section3", "section4"]),
      );
      setAssignDirty(new Set());
    },
    [creatorProfile],
  );

  // ── SAVE ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (status = "Draft") => {
      if (!metaData.programId) return toast.error("Select a program first");
      if (!metaData.isNew && !hasAny && status === metaData.status)
        return toast.success("No changes to save.");
      setLoading(true);
      const workflowOnly = !metaData.isNew && isAssignOnly;
      const sectionsToUpdate = metaData.isNew
        ? ["all"]
        : Array.from(new Set([...contentDirty, ...assignDirty]));
      const payload = {
        programId: metaData.programCode,
        isNewProgram: metaData.isNew,
        sectionsToUpdate,
        isWorkflowUpdate: workflowOnly,
        metaData: { ...metaData, status },
        section1Data: {
          department: pdData.details.department,
          programName: pdData.details.program_name,
          directorOfSchool: pdData.details.director,
          headOfDepartment: pdData.details.hod,
          awardTitle: pdData.award.title,
          modeOfStudy: pdData.award.mode,
          awardingInstitution: pdData.award.awarding_body,
          jointAward: pdData.award.joint_award,
          teachingInstitution: pdData.award.teaching_institution,
          dateOfProgramSpecs: pdData.award.date_program_specs,
          dateOfCourseApproval: pdData.award.date_approval,
          nextReviewDate: pdData.award.next_review,
          approvingRegulatingBody: pdData.award.approving_body,
          accreditedBody: pdData.award.accredited_body,
          gradeAwarded: pdData.award.accreditation_grade,
          accreditationValidity: pdData.award.accreditation_validity,
          programBenchmark: pdData.award.benchmark,
          faculty: pdData.details.faculty,
          school: pdData.details.school,
        },
        section2Data: {
          programOverview: pdData.overview,
          peos: pdData.peos,
          pos: pdData.pos,
          psos: pdData.psos,
        },
        section3Data: {
          creditDefinition: {
            lecture: pdData.credit_def.L,
            tutorial: pdData.credit_def.T,
            practical: pdData.credit_def.P,
          },
          structureTable: pdData.structure_table,
          totalProgramCredits: metaData.totalCredits,
          semesters: pdData.semesters.map((sem) => ({
            semNumber: sem.sem_no,
            courses: sem.courses,
          })),
        },
        section4Data: {
          professionalElectives: pdData.prof_electives.map((g) => ({
            semester: g.sem,
            title: g.title,
            courses: g.courses,
          })),
          openElectives: pdData.open_electives.map((g) => ({
            semester: g.sem,
            title: g.title,
            courses: g.courses,
          })),
        },
      };
      try {
        const { data } = await axios.post("/api/creater/pd/save", payload, {
          headers: { createrToken },
        });
        if (data.success) {
          workflowOnly
            ? toast.success(
                `Assignments saved — version v${data.version} unchanged`,
              )
            : toast.success(data.message);
          setMetaData((p) => ({
            ...p,
            isNew: false,
            versionNo: data.version,
            status,
          }));
          fetchRecentVersions(metaData.programCode);
          setContentDirty(new Set());
          setAssignDirty(new Set());
        } else toast.error(data.message);
      } catch {
        toast.error("Save failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      metaData,
      pdData,
      contentDirty,
      assignDirty,
      hasAny,
      isAssignOnly,
      axios,
      createrToken,
    ],
  );

  const handleSaveAndNext = useCallback(async () => {
    await handleSave("Draft");
    setActiveStep((p) => Math.min(4, p + 1));
  }, [handleSave]);
  const handlePreview = useCallback(() => {
    if (!metaData.programId) return toast.error("Select a program first");
    navigate("/creator/preview", { state: { pdData, metaData } });
  }, [metaData, pdData, navigate]);

  const saveBtnLabel = () =>
    loading ? "Saving…" : isAssignOnly ? "Save Assignments" : "Save Draft";

  // ── STEP COMPLETIONS ──────────────────────────────────────────────────────

  const completions = [
    !!metaData.programId,
    pdData.peos.some((p) => p?.trim()) && pdData.psos.some((p) => p?.trim()),
    pdData.semesters.some((s) => s.courses.length > 0),
    pdData.prof_electives.some((g) => g.courses.length > 0) ||
      pdData.open_electives.some((g) => g.courses.length > 0),
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Institution Banner */}
      {creatorProfile && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/60">
          <Building2 size={15} className="text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            <span className="font-semibold">Institution: </span>
            {[
              creatorProfile.college,
              creatorProfile.faculty,
              creatorProfile.school,
            ]
              .filter(Boolean)
              .join(" › ")}
          </p>
        </div>
      )}

      {/* Program Selection */}
      <SectionCard
        icon={<GraduationCap size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Program Selection"
        subtitle="Select the program this document belongs to"
        action={
          profileLoading ? (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw size={11} className="animate-spin" />
              Loading…
            </span>
          ) : (
            <StatusBadge color="gray">
              {availablePrograms.length} program
              {availablePrograms.length !== 1 ? "s" : ""}
            </StatusBadge>
          )
        }
      >
        <div ref={dropdownRef} className="relative">
          <FieldLabel required>Select Program</FieldLabel>
          <div className="relative">
            <input
              ref={programInputRef}
              type="text"
              value={searchProgram}
              onChange={(e) => {
                setSearchProgram(e.target.value);
                setShowProgramDropdown(true);
              }}
              onFocus={() => setShowProgramDropdown(true)}
              placeholder={
                availablePrograms.length
                  ? "Search programs…"
                  : "No programs — check your profile"
              }
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-300"
              size={16}
            />
          </div>

          {showProgramDropdown && (
            <div className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((p) => (
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
                          {p.school && (
                            <span className="text-[10px] text-blue-500 font-medium">
                              {p.school}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {p.name}
                        </p>
                      </div>
                      <StatusBadge color={p.level === "UG" ? "blue" : "amber"}>
                        {p.level}
                      </StatusBadge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <Info size={20} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">
                    {profileLoading
                      ? "Loading…"
                      : "No programs found. Check your profile."}
                  </p>
                </div>
              )}
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
              <button
                onClick={() => {
                  setMetaData((p) => ({
                    ...p,
                    programId: "",
                    programCode: "",
                    programName: "",
                  }));
                  setSearchProgram("");
                }}
                className="text-gray-300 hover:text-rose-400 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          {[
            {
              label: "Scheme Year",
              icon: <Calendar size={11} />,
              field: "schemeYear",
              placeholder: "2024",
            },
            {
              label: "Effective A.Y.",
              icon: <Clock size={11} />,
              field: "effectiveAy",
              placeholder: "2024-25",
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
              {readOnly ? (
                <input
                  readOnly
                  value={metaData[field]}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-400 cursor-not-allowed"
                />
              ) : (
                <OptimizedInput
                  type={type || "text"}
                  value={metaData[field]}
                  onChange={(v) =>
                    handleMetaChange(
                      field,
                      type === "number" ? parseInt(v) || 0 : v,
                    )
                  }
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* PDF Import */}
      <SectionCard
        icon={<UploadCloud size={16} className="text-violet-500" />}
        iconBg="bg-violet-50"
        title="Import Program Document"
        subtitle="Upload a PDF to auto-populate fields via AI parsing"
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
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all border",
              importing
                ? "bg-violet-50 border-violet-200 text-violet-400 pointer-events-none"
                : "bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 shadow-sm",
            ].join(" ")}
          >
            {importing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <FileUp size={15} />
            )}
            {importing ? "Parsing PDF…" : "Choose PDF File"}
          </label>
          {importing && (
            <span className="flex items-center gap-2 text-xs text-violet-600">
              <span className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
              Processing document…
            </span>
          )}
          {!importing && (
            <p className="text-xs text-gray-400">
              Supports 2024 Scheme format. Data is merged, existing values
              preserved.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Program Details */}
      <SectionCard
        icon={<Users size={16} className="text-gray-400" />}
        iconBg="bg-gray-100"
        title="Program Details"
        subtitle="Institutional and contact information"
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

      {/* Award Details */}
      <SectionCard
        icon={<Award size={16} className="text-amber-500" />}
        iconBg="bg-amber-50"
        title="Award Details"
        subtitle="Accreditation and award metadata"
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

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-5">
      <SectionCard
        icon={<FileText size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Program Overview"
        subtitle="High-level description of the program"
      >
        <JoditEditor
          ref={editorRef}
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
        subtitle="Long-term achievements graduates are expected to attain"
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
                  {pdData.peos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("peos", i)}
                      className="text-gray-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
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

      {/* POs */}
      <SectionCard
        icon={<BookOpen size={16} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        title="Program Outcomes (POs)"
        subtitle="Attributes graduates are expected to demonstrate"
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
        <div className="space-y-3">
          {pdData.pos.map((po, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center mt-1">
                {i + 1}
              </div>
              <div className="flex-1">
                <JoditEditor
                  value={po}
                  config={{ ...joditConfig, height: 120 }}
                  onBlur={(v) => handleArrayChange("pos", i, v)}
                />
              </div>
              <button
                onClick={() => removePO(i)}
                disabled={pdData.pos.length <= 1}
                className="text-gray-300 hover:text-rose-400 transition-colors disabled:opacity-20 mt-1 flex-shrink-0"
              >
                <Trash2 size={12} />
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
        subtitle="Domain-specific skills expected from graduates"
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
                  {pdData.psos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("psos", i)}
                      className="text-gray-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
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

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-5">
      {/* Credit Definition */}
      <SectionCard
        icon={<Settings size={16} className="text-gray-400" />}
        iconBg="bg-gray-100"
        title="Credit Definition"
        subtitle="Hours per week for each session type"
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

      {/* Structure Table */}
      <SectionCard
        icon={<Table size={16} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Programme Structure"
        subtitle="Category-wise credit distribution"
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

      {/* Semesters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Semester-wise Courses
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {pdData.semesters.length} semesters ·{" "}
              {pdData.semesters.reduce((s, sem) => s + sem.courses.length, 0)}{" "}
              total courses
            </p>
          </div>
          <button
            onClick={addSemester}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={12} strokeWidth={2.5} />
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
                <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {sem.courses.length} course
                  {sem.courses.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addCourse(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus size={11} />
                  Add
                </button>
                <button
                  onClick={() => removeSemester(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-500 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={11} />
                  Remove
                </button>
              </div>
            </div>

            {sem.courses.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen size={22} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  No courses yet. Click Add.
                </p>
              </div>
            ) : (
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
                            className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                          >
                            {[
                              "Theory",
                              "Lab",
                              "Theory+Lab",
                              "Project",
                              "Seminar",
                              "Practical",
                              "Internship",
                            ].map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 w-32">
                          <select
                            value={c.category}
                            onChange={(e) =>
                              updateCourse(si, ci, "category", e.target.value)
                            }
                            className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                          >
                            {[
                              "Core",
                              "Elective",
                              "Open Elective",
                              "Lab",
                              "Project",
                              "Competency",
                              "Life Skills",
                              "Innovation",
                              "Service",
                              "Sports",
                              "Cultural",
                              "Co-curricular",
                              "Placement",
                              "Internship",
                            ].map((o) => (
                              <option key={o}>{o}</option>
                            ))}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const renderElectiveSection = (type) => {
    const isPE = type === "prof";
    const key = isPE ? "prof_electives" : "open_electives";
    const groups = pdData[key];
    const label = isPE ? "Professional Electives" : "Open Electives";
    const iconColor = isPE ? "text-blue-500" : "text-emerald-500";
    const iconBg = isPE ? "bg-blue-50" : "bg-emerald-50";
    const plusColor = isPE ? "text-blue-500" : "text-emerald-500";

    return (
      <SectionCard
        icon={<Grid size={16} className={iconColor} />}
        iconBg={iconBg}
        title={label}
        subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} · ${groups.reduce((s, g) => s + g.courses.length, 0)} courses`}
        action={
          <button
            onClick={() => addElectiveGroup(type)}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={11} className={plusColor} />
            Add Group
          </button>
        }
      >
        {groups.length === 0 ? (
          <div className="py-8 text-center">
            <Grid size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              No elective groups yet. Click Add Group.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((grp, gi) => (
              <div
                key={gi}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">
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
                      className="text-xs px-2.5 py-1.5 font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      + Course
                    </button>
                    <button
                      onClick={() => removeElectiveGroup(type, gi)}
                      className="text-gray-300 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {grp.courses.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-5">
                    No courses yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50/40 border-b border-gray-100">
                          {["Code", "Title", "Cr", "Assignee", ""].map(
                            (h, i) => (
                              <th
                                key={i}
                                className="px-3 py-2.5 text-left font-semibold text-gray-400 uppercase tracking-wider text-[10px]"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
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
                                onClick={() =>
                                  removeElectiveCourse(type, gi, ci)
                                }
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
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-5">
      {renderElectiveSection("prof")}
      {renderElectiveSection("open")}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <CreatorLayout>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* ── Sidebar drawer ─────────────────────────────────────────────── */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40"
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
            <h2 className="text-sm font-semibold text-gray-700">Navigation</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
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
                  className={[
                    "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left",
                    activeStep === step.id
                      ? "bg-gray-900 text-white"
                      : "hover:bg-gray-50 text-gray-600",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                      activeStep === step.id
                        ? "bg-white/20 text-white"
                        : completions[i]
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-400",
                    ].join(" ")}
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
                      <span className="text-xs font-semibold text-gray-700">
                        v{ver.pdVersion}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${ver.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ver.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Page layout ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0 pb-10">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            {/* Title */}
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
                    <StatusBadge color="gray">
                      v{metaData.versionNo}
                    </StatusBadge>
                    {isAssignOnly && (
                      <StatusBadge color="amber">
                        <Info size={9} />
                        Assignment update · version locked
                      </StatusBadge>
                    )}
                    {hasContent && (
                      <StatusBadge color="yellow">
                        <AlertTriangle size={9} />
                        Unsaved changes
                      </StatusBadge>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">
                    Select a program to begin.
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
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
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => handleSave("Draft")}
                disabled={loading}
                className={[
                  "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-40",
                  isAssignOnly
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white",
                ].join(" ")}
              >
                <Save size={14} />
                {saveBtnLabel()}
              </button>
              <button
                onClick={() => handleSave("UnderReview")}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40"
              >
                <Send size={14} />
                Submit
              </button>
            </div>
          </div>

          {/* Step bar */}
          <StepProgressBar
            activeStep={activeStep}
            onStepClick={setActiveStep}
            completions={completions}
          />
        </div>

        {/* ── Dirty Banner ──────────────────────────────────────────────── */}
        {hasAny && (
          <div
            className={[
              "flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs mb-5",
              isAssignOnly
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700",
            ].join(" ")}
          >
            {isAssignOnly ? (
              <Info size={14} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="font-medium">
              {isAssignOnly
                ? "Pending assignment changes. Saving will update the database without incrementing the version."
                : `Unsaved content in: ${Array.from(contentDirty)
                    .map((s) => s.replace("section", "Section "))
                    .join(", ")}`}
            </p>
          </div>
        )}

        {/* ── Step Content ──────────────────────────────────────────────── */}
        <div className="min-h-[400px]">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
        </div>

        {/* ── Footer Navigation ─────────────────────────────────────────── */}
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
                className={[
                  "rounded-full transition-all duration-200",
                  activeStep === step.id
                    ? "w-5 h-2 bg-gray-800"
                    : "w-2 h-2 bg-gray-200 hover:bg-gray-300",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndNext}
              disabled={loading}
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

      {/* ── Assign Creator Modal ──────────────────────────────────────────── */}
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
    </CreatorLayout>
  );
};

export default CreatePD;
