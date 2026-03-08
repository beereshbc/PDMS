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

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build programs list from creator's Creater model profile fields
// Fields used: programme, discipline, course, faculty, school, college
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
// DEBOUNCED INPUT  (prevents re-render lag on large state trees)
// ─────────────────────────────────────────────────────────────────────────────
const OptimizedInput = ({ value, onChange, debounceTime = 400, ...props }) => {
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
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS SUMMARY  (sidebar)
// ─────────────────────────────────────────────────────────────────────────────
const ProgressSummary = React.memo(({ metaData, pdData, activeStep }) => {
  const steps = [
    { id: 1, label: "Program Info", completed: !!metaData.programId },
    {
      id: 2,
      label: "Objectives",
      completed:
        pdData.peos.some((p) => p?.trim()) &&
        pdData.psos.some((p) => p?.trim()),
    },
    {
      id: 3,
      label: "Structure",
      completed: pdData.semesters.some((s) => s.courses.length > 0),
    },
    {
      id: 4,
      label: "Electives",
      completed:
        pdData.prof_electives.some((g) => g.courses.length > 0) ||
        pdData.open_electives.some((g) => g.courses.length > 0),
    },
  ];
  const done = steps.filter((s) => s.completed).length;
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-semibold text-blue-600">
          {done}/{steps.length}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-700 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
              ${s.completed ? "bg-green-100 text-green-600" : activeStep === s.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
            >
              {s.completed ? <CheckCircle size={14} /> : s.id}
            </div>
            <span className="text-[10px] text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
const SectionCard = ({
  icon: Icon,
  title,
  action,
  children,
  accent = "blue",
}) => {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    gray: "border-gray-200 bg-gray-100 text-gray-600",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg border ${colors[accent]}`}>
            <Icon size={15} />
          </span>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN BUTTON  (shared between Step 3 & Step 4)
// ─────────────────────────────────────────────────────────────────────────────
const AssignBtn = ({ course, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 justify-center w-full px-2 py-1 rounded text-xs border transition-all ${
      course.assigneeId
        ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
        : "bg-gray-50 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
    }`}
  >
    {course.assigneeId ? (
      <>
        <UserCheck size={13} />
        <span className="truncate max-w-[72px]" title={course.assigneeName}>
          {course.assigneeName?.split(" ")[0]}
        </span>
      </>
    ) : (
      <>
        <UserPlus size={13} />
        Assign
      </>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const CreatePD = () => {
  const navigate = useNavigate();
  const { axios, createrToken } = useAppContext();
  const location = useLocation();

  // UI
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showSidebarDropdown, setShowSidebarDropdown] = useState(false);
  const [recentVersions, setRecentVersions] = useState([]);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentAssignContext, setCurrentAssignContext] = useState(null);

  const dropdownRef = useRef(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── TWO-TIER DIRTY TRACKING ────────────────────────────────────────────────
  // contentDirty → version bumps on next save
  // assignDirty  → isWorkflowUpdate=true, version stays unchanged
  const [contentDirty, setContentDirty] = useState(new Set());
  const [assignDirty, setAssignDirty] = useState(new Set());

  const markContent = useCallback((section) => {
    setContentDirty((prev) => new Set(prev).add(section));
  }, []);

  const markAssign = useCallback((section) => {
    setAssignDirty((prev) => new Set(prev).add(section));
  }, []);

  const hasContent = contentDirty.size > 0;
  const hasAssign = assignDirty.size > 0;
  const hasAny = hasContent || hasAssign;
  const isAssignOnly = !hasContent && hasAssign; // Only assignments changed

  // ── METADATA & DATA STATE ─────────────────────────────────────────────────
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

  // Jodit (memoised to avoid re-instantiation)
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
      height: 300,
      statusbar: false,
    }),
    [],
  );

  const filteredPrograms = availablePrograms.filter(
    (p) =>
      p.code.toLowerCase().includes(searchProgram.toLowerCase()) ||
      p.name.toLowerCase().includes(searchProgram.toLowerCase()),
  );

  // ── CLICK OUTSIDE – close dropdown ────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowSidebarDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── ON MOUNT: fetch creator profile → derive programs ─────────────────────
  // Backend endpoint: GET /api/creater/profile
  // Returns: { success, profile: { name, college, faculty, school, programme, course, discipline, … } }
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
          // Pre-fill institutional fields from profile
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
      } catch (err) {
        console.error("Profile fetch:", err);
        toast.error("Could not load your profile data.");
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  // ── LOAD FROM NAVIGATION STATE ────────────────────────────────────────────
  useEffect(() => {
    if (location.state?.loadId) fetchFullPD(location.state.loadId);
  }, [location.state]);

  // ─────────────────────────────────────────────────────────────────────────
  // API HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchRecentVersions = async (code) => {
    try {
      const { data } = await axios.get(`/api/creater/pd/versions/${code}`, {
        headers: { createrToken },
      });
      if (data.success) setRecentVersions(data.versions);
    } catch (e) {
      console.error(e);
    }
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

  // ─────────────────────────────────────────────────────────────────────────
  // PDF IMPORT
  // ─────────────────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("Only PDF files supported.");

    if (!metaData.programId)
      toast("ℹ️ Tip: Select a program before importing so details auto-link.", {
        duration: 4000,
      });

    const toastId = toast.loading("📄 Parsing PDF — this can take up to 30 s…");
    setImporting(true);

    const formData = new FormData();
    formData.append("pdFile", file);

    try {
      const { data } = await axios.post("/api/creater/pd/import", formData, {
        headers: { createrToken, "Content-Type": "multipart/form-data" },
        timeout: 35000,
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
        toast.success("✅ Imported! Review and save.", { id: toastId });
      } else {
        toast.error(data.message || "Import failed", { id: toastId });
      }
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

  // ─────────────────────────────────────────────────────────────────────────
  // POPULATE FORM from API fetch
  // ─────────────────────────────────────────────────────────────────────────
  const populateForm = (pd) => {
    const s1 = pd.section1_info,
      s2 = pd.section2_objectives;
    const s3 = pd.section3_structure,
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

  // ─────────────────────────────────────────────────────────────────────────
  // FORM CHANGE HANDLERS — content changes use markContent()
  // ─────────────────────────────────────────────────────────────────────────
  const handleMetaChange = useCallback(
    (field, value) => setMetaData((p) => ({ ...p, [field]: value })),
    [],
  );

  const handleNestedChange = useCallback(
    (section, field, value) => {
      markContent("section1");
      setPdData((p) => ({
        ...p,
        [section]: { ...p[section], [field]: value },
      }));
    },
    [markContent],
  );

  const handleOverviewChange = useCallback(
    (content) => {
      if (content !== pdData.overview) {
        markContent("section2");
        setPdData((p) => ({ ...p, overview: content }));
      }
    },
    [pdData.overview, markContent],
  );

  const handleArrayChange = useCallback(
    (key, index, content) => {
      markContent("section2");
      setPdData((p) => {
        const a = [...p[key]];
        a[index] = content;
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );

  const addArrayItem = useCallback(
    (key, def = "") => {
      markContent("section2");
      setPdData((p) => ({ ...p, [key]: [...p[key], def] }));
    },
    [markContent],
  );

  const removeArrayItem = useCallback(
    (key, i) => {
      markContent("section2");
      setPdData((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
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
    (i, field, value) => {
      markContent("section3");
      setPdData((p) => {
        const t = [...p.structure_table];
        t[i] = { ...t[i], [field]: value };
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
      if (window.confirm("Delete this semester and all its courses?")) {
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
    (si, ci, field, value) => {
      markContent("section3");
      setPdData((p) => {
        const s = [...p.semesters];
        s[si].courses[ci][field] = value;
        return { ...p, semesters: s };
      });
    },
    [markContent],
  );

  // ── ASSIGN HANDLERS — use markAssign (NOT markContent) ───────────────────
  const handleAssignCreator = useCallback(
    (si, ci, creator) => {
      markAssign("section3"); // ← only assignment change — will NOT bump version
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
      markAssign("section4"); // ← only assignment change — will NOT bump version
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const arr = [...p[key]];
        arr[gi].courses[ci].assigneeId = creator.id;
        arr[gi].courses[ci].assigneeName = creator.name;
        return { ...p, [key]: arr };
      });
    },
    [markAssign],
  );

  const openAssignModal = (si, ci, course) => {
    setCurrentAssignContext({
      semIndex: si,
      courseIndex: ci,
      code: course.code || "New Course",
      currentAssigneeId: course.assigneeId,
    });
    setIsAssignModalOpen(true);
  };

  const openElectiveAssignModal = (type, gi, ci, course) => {
    setCurrentAssignContext({
      isElective: true,
      electiveType: type,
      groupIndex: gi,
      courseIndex: ci,
      code: course.code || "Elective",
      currentAssigneeId: course.assigneeId,
    });
    setIsAssignModalOpen(true);
  };

  // Elective CRUD (content changes)
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
      if (window.confirm("Remove this elective group?")) {
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

  const updateElectiveGroupSemester = useCallback(
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
    (type, gi, ci, field, value) => {
      markContent("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((p) => {
        const a = [...p[key]];
        a[gi].courses[ci][field] = value;
        return { ...p, [key]: a };
      });
    },
    [markContent],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PROGRAM SELECT  (from profile-derived list)
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE — smart version control
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (status = "Draft") => {
      if (!metaData.programId) return toast.error("Select a program first");
      if (!metaData.isNew && !hasAny && status === metaData.status)
        return toast.success("No changes to save.");

      setLoading(true);

      // Only assignments changed (no content) → workflow update, no version bump
      const workflowOnly = !metaData.isNew && isAssignOnly;

      const sectionsToUpdate = metaData.isNew
        ? ["all"]
        : Array.from(new Set([...contentDirty, ...assignDirty]));

      const payload = {
        programId: metaData.programCode,
        isNewProgram: metaData.isNew,
        sectionsToUpdate,
        isWorkflowUpdate: workflowOnly, // ← backend key flag
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
                `✅ Assignments saved — version v${data.version} unchanged`,
              )
            : toast.success(`✅ ${data.message}`);
          setMetaData((p) => ({
            ...p,
            isNew: false,
            versionNo: data.version,
            status,
          }));
          fetchRecentVersions(metaData.programCode);
          setContentDirty(new Set());
          setAssignDirty(new Set());
        } else {
          toast.error(data.message);
        }
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

  const saveBtnLabel = () => {
    if (loading) return "Saving…";
    if (isAssignOnly) return "Save Assignments";
    return "Save Draft";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORY PANEL
  // ─────────────────────────────────────────────────────────────────────────
  const renderHistoryPanel = useCallback(() => {
    if (!metaData.programCode) return null;
    return (
      <div className="mt-4 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <History size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">
            Version History
          </span>
        </div>
        {recentVersions.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No previous versions.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentVersions.map((ver) => (
              <div
                key={ver._id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-pointer transition-colors"
                onClick={() => {
                  fetchFullPD(ver._id);
                  setShowSidebarDropdown(false);
                }}
              >
                <span className="font-bold text-blue-600 text-xs">
                  v{ver.pdVersion}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${ver.status === "Approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {ver.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [metaData.programCode, recentVersions, fetchFullPD]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 – Program Information
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Institution banner from profile */}
      {creatorProfile && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 text-sm text-indigo-800">
          <Building2 size={15} className="text-indigo-500 flex-shrink-0" />
          <span>
            <span className="font-semibold">Your institution: </span>
            {[
              creatorProfile.college,
              creatorProfile.faculty,
              creatorProfile.school,
            ]
              .filter(Boolean)
              .join(" › ")}
          </span>
        </div>
      )}

      {/* Program Selection */}
      <SectionCard
        icon={GraduationCap}
        title="Program Selection"
        accent="blue"
        action={
          profileLoading ? (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw size={11} className="animate-spin" />
              Loading…
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {availablePrograms.length} program
              {availablePrograms.length !== 1 ? "s" : ""}
            </span>
          )
        }
      >
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Select Program *
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchProgram}
              onChange={(e) => {
                setSearchProgram(e.target.value);
                setShowProgramDropdown(true);
              }}
              onFocus={() => setShowProgramDropdown(true)}
              placeholder={
                availablePrograms.length
                  ? "Search your programs…"
                  : "No programs found — check your profile"
              }
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-400"
              size={17}
            />
          </div>

          {showProgramDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProgramSelect(p)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {p.code}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {p.name}
                        </div>
                        {p.school && (
                          <div className="text-[11px] text-indigo-500 mt-0.5">
                            {p.school}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.level === "UG" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                      >
                        {p.level}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <Info size={18} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    {profileLoading
                      ? "Loading your profile…"
                      : "No programs. Ensure your profile has programme & discipline filled."}
                  </p>
                </div>
              )}
            </div>
          )}

          {metaData.programId && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {metaData.programName}
                </div>
                <div className="text-xs text-blue-600 mt-0.5">
                  {metaData.programCode}
                </div>
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
              >
                <X
                  size={17}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                />
              </button>
            </div>
          )}
        </div>

        {/* Version / scheme meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            {
              label: "Scheme Year",
              icon: Calendar,
              field: "schemeYear",
              placeholder: "2024",
            },
            {
              label: "Effective A.Y.",
              icon: Clock,
              field: "effectiveAy",
              placeholder: "2024-25",
            },
            {
              label: "Total Credits",
              icon: CreditCard,
              field: "totalCredits",
              type: "number",
            },
          ].map(({ label, icon: Icon, field, placeholder, type }) => (
            <div key={field}>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                <Icon size={11} />
                {label}
              </label>
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
              <Hash size={11} />
              Version
            </label>
            <input
              type="text"
              value={metaData.versionNo}
              readOnly
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </SectionCard>

      {/* PDF Import */}
      <SectionCard
        icon={UploadCloud}
        title="Import Existing Program Document"
        accent="blue"
      >
        <p className="text-sm text-gray-500 mb-4">
          Upload a PDF (2024 Scheme format) to auto-populate the fields below.
          Data is merged — existing values are preserved.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
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
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all
              ${importing ? "bg-blue-50 border-blue-200 text-blue-400 pointer-events-none" : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50"}`}
          >
            {importing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <FileUp size={15} />
            )}
            {importing ? "Parsing PDF…" : "Choose PDF File"}
          </label>
          {importing && (
            <span className="flex items-center gap-2 text-xs text-blue-600">
              <span className="flex gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
              Processing document structure…
            </span>
          )}
        </div>
      </SectionCard>

      {/* Program Details */}
      <SectionCard icon={Users} title="Program Details" accent="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(pdData.details).map(([k, v]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {k.replace(/_/g, " ")}
              </label>
              <OptimizedInput
                type="text"
                value={v}
                onChange={(val) => handleNestedChange("details", k, val)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Award Details */}
      <SectionCard icon={File} title="Award Details" accent="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(pdData.award).map(([k, v]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {k.replace(/_/g, " ")}
              </label>
              <OptimizedInput
                type="text"
                value={v}
                onChange={(val) => handleNestedChange("award", k, val)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 – Objectives & Outcomes
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-5">
      <SectionCard icon={FileText} title="Program Overview" accent="blue">
        <JoditEditor
          ref={editorRef}
          value={pdData.overview}
          config={joditConfig}
          onBlur={handleOverviewChange}
        />
      </SectionCard>

      <SectionCard
        icon={List}
        title="Program Educational Objectives (PEOs)"
        accent="blue"
        action={
          <button
            onClick={() => addArrayItem("peos", "")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium"
          >
            <Plus size={12} /> Add PEO
          </button>
        }
      >
        <div className="space-y-4">
          {pdData.peos.map((peo, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50"
            >
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    PEO-{i + 1}
                  </span>
                  {pdData.peos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("peos", i)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <JoditEditor
                  value={peo}
                  config={{ ...joditConfig, height: 180 }}
                  onBlur={(v) => handleArrayChange("peos", i, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={Book}
        title="Program Outcomes (POs)"
        accent="green"
        action={
          <div className="flex gap-2">
            <button
              onClick={resetPOs}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-200"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={addPO}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium"
            >
              <Plus size={12} /> Add PO
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {pdData.pos.map((po, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-xl bg-gray-50"
            >
              <div className="flex gap-3 items-start">
                <span className="text-xs font-bold text-gray-500 min-w-[40px] pt-2">
                  PO-{i + 1}
                </span>
                <div className="flex-1">
                  <JoditEditor
                    value={po}
                    config={{ ...joditConfig, height: 140 }}
                    onBlur={(v) => handleArrayChange("pos", i, v)}
                  />
                </div>
                <button
                  onClick={() => removePO(i)}
                  disabled={pdData.pos.length <= 1}
                  className="text-gray-300 hover:text-red-500 pt-2 disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={List}
        title="Program Specific Outcomes (PSOs)"
        accent="green"
        action={
          <button
            onClick={() => addArrayItem("psos", "")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium"
          >
            <Plus size={12} /> Add PSO
          </button>
        }
      >
        <div className="space-y-4">
          {pdData.psos.map((pso, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50"
            >
              <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    PSO-{i + 1}
                  </span>
                  {pdData.psos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("psos", i)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <JoditEditor
                  value={pso}
                  config={{ ...joditConfig, height: 180 }}
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
  // STEP 3 – Structure & Curriculum
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-5">
      <SectionCard
        icon={Settings}
        title="Credit Definition (L : T : P)"
        accent="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["L", "Lecture (1 hr/week)"],
            ["T", "Tutorial (2 hr/week)"],
            ["P", "Practical (2 hr/week)"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {label}
              </label>
              <OptimizedInput
                type="number"
                value={pdData.credit_def[k]}
                onChange={(v) => updateCreditDef(k, v)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={Table}
        title="Programme Structure"
        accent="blue"
        action={
          <button
            onClick={addStructureItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium"
          >
            <Plus size={12} /> Add Row
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["#", "Category", "Code", "Credits", ""].map((h) => (
                  <th
                    key={h}
                    className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdData.structure_table.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center text-xs text-gray-400">
                    {i + 1}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <OptimizedInput
                      type="text"
                      value={row.category}
                      onChange={(v) => updateStructureItem(i, "category", v)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </td>
                  <td className="border border-gray-200 px-3 py-2 w-24">
                    <OptimizedInput
                      type="text"
                      value={row.code}
                      onChange={(v) => updateStructureItem(i, "code", v)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded uppercase focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </td>
                  <td className="border border-gray-200 px-3 py-2 w-24">
                    <OptimizedInput
                      type="number"
                      min="0"
                      value={row.credits}
                      onChange={(v) =>
                        updateStructureItem(i, "credits", parseInt(v) || 0)
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <button
                      onClick={() => removeStructureItem(i)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td
                  colSpan={3}
                  className="border border-gray-200 px-3 py-2 text-right text-xs text-gray-600"
                >
                  Total Credits
                </td>
                <td className="border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900">
                  {pdData.structure_table.reduce(
                    (s, r) => s + (r.credits || 0),
                    0,
                  )}
                </td>
                <td className="border border-gray-200" />
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* Semesters */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">
            Semester-wise Courses
          </span>
          <button
            onClick={addSemester}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus size={13} /> Add Semester
          </button>
        </div>

        {pdData.semesters.map((sem, si) => (
          <div
            key={sem.sem_no}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FolderOpen size={15} className="text-gray-500" />
                <span className="font-semibold text-gray-800 text-sm">
                  Semester {sem.sem_no}
                </span>
                <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {sem.courses.length} courses
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addCourse(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
                >
                  <Plus size={11} /> Add Course
                </button>
                <button
                  onClick={() => removeSemester(si)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>

            {sem.courses.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-5">
                No courses yet — click "Add Course" above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[
                        "#",
                        "Code",
                        "Title",
                        "Cr",
                        "Type",
                        "Category",
                        "Assignee",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold text-gray-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, ci) => (
                      <tr
                        key={ci}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-400 text-center">
                          {ci + 1}
                        </td>
                        <td className="px-3 py-2 w-28">
                          <OptimizedInput
                            type="text"
                            value={c.code}
                            onChange={(v) => updateCourse(si, ci, "code", v)}
                            className="w-full px-2 py-1 border border-gray-200 rounded uppercase focus:ring-1 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[150px]">
                          <OptimizedInput
                            type="text"
                            value={c.title}
                            onChange={(v) => updateCourse(si, ci, "title", v)}
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 w-12">
                          <OptimizedInput
                            type="number"
                            min="0"
                            value={c.credits}
                            onChange={(v) =>
                              updateCourse(si, ci, "credits", parseInt(v) || 0)
                            }
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 w-28">
                          <select
                            value={c.type}
                            onChange={(e) =>
                              updateCourse(si, ci, "type", e.target.value)
                            }
                            className="w-full px-1.5 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
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
                        <td className="px-3 py-2 w-32">
                          <select
                            value={c.category}
                            onChange={(e) =>
                              updateCourse(si, ci, "category", e.target.value)
                            }
                            className="w-full px-1.5 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
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
                        <td className="px-3 py-2 w-28">
                          <AssignBtn
                            course={c}
                            onClick={() => openAssignModal(si, ci, c)}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeCourse(si, ci)}
                            className="text-gray-300 hover:text-red-500"
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
  // STEP 4 – Electives  (shared renderer)
  // ─────────────────────────────────────────────────────────────────────────
  const renderElectiveSection = (type) => {
    const isPE = type === "prof";
    const key = isPE ? "prof_electives" : "open_electives";
    const groups = pdData[key];
    const label = isPE ? "Professional Electives" : "Open Electives";
    const accent = isPE ? "blue" : "green";
    const btnCls = isPE
      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";

    return (
      <SectionCard
        icon={Grid}
        title={label}
        accent={accent}
        action={
          <button
            onClick={() => addElectiveGroup(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium ${btnCls}`}
          >
            <Plus size={12} /> Add Group
          </button>
        }
      >
        {groups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No groups yet.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((grp, gi) => (
              <div
                key={gi}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      Sem
                    </span>
                    <OptimizedInput
                      type="number"
                      min="1"
                      value={grp.sem}
                      onChange={(v) => updateElectiveGroupSemester(type, gi, v)}
                      className="w-12 px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <OptimizedInput
                      type="text"
                      value={grp.title}
                      onChange={(v) => updateElectiveGroupTitle(type, gi, v)}
                      className="flex-1 min-w-[150px] px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addElectiveCourse(type, gi)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${btnCls}`}
                    >
                      + Course
                    </button>
                    <button
                      onClick={() => removeElectiveGroup(type, gi)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {grp.courses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No courses yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {["Code", "Title", "Cr", "Assignee", ""].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left font-semibold text-gray-600"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grp.courses.map((c, ci) => (
                          <tr
                            key={ci}
                            className="hover:bg-gray-50 border-b border-gray-100"
                          >
                            <td className="px-3 py-2 w-28">
                              <OptimizedInput
                                type="text"
                                value={c.code}
                                onChange={(v) =>
                                  updateElectiveCourse(type, gi, ci, "code", v)
                                }
                                className="w-full px-2 py-1 border border-gray-200 rounded uppercase focus:ring-1 focus:ring-blue-400 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <OptimizedInput
                                type="text"
                                value={c.title}
                                onChange={(v) =>
                                  updateElectiveCourse(type, gi, ci, "title", v)
                                }
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 w-12">
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
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 w-28">
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
                                className="text-gray-300 hover:text-red-500"
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
  // STEP DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────
  const STEPS = [
    { id: 1, label: "Program Info", icon: BookOpen },
    { id: 2, label: "Objectives", icon: List },
    { id: 3, label: "Structure", icon: Layers },
    { id: 4, label: "Electives", icon: Table },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <CreatorLayout>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">
            Program Document Manager
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              {metaData.programName || "Select a program to begin"}
            </p>
            {metaData.programCode && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                v{metaData.versionNo}
              </span>
            )}
            {isAssignOnly && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Info size={10} /> Assignment update · version locked
              </span>
            )}
            {hasContent && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle size={10} /> Unsaved changes
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {/* Sidebar menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSidebarDropdown((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300"
            >
              <Menu size={14} />
              <span className="hidden sm:inline">Menu</span>
            </button>
            {showSidebarDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 max-h-[80vh] overflow-y-auto">
                <ProgressSummary
                  metaData={metaData}
                  pdData={pdData}
                  activeStep={activeStep}
                />
                <nav className="mt-3 space-y-1">
                  {STEPS.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStep(step.id);
                        setShowSidebarDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                        ${activeStep === step.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"}`}
                    >
                      <span
                        className={`p-1.5 rounded-lg ${activeStep === step.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        <step.icon size={14} />
                      </span>
                      <span
                        className={`text-sm font-medium ${activeStep === step.id ? "text-blue-700" : "text-gray-700"}`}
                      >
                        {step.label}
                      </span>
                      {activeStep === step.id && (
                        <ChevronRight
                          size={14}
                          className="ml-auto text-blue-500"
                        />
                      )}
                    </button>
                  ))}
                </nav>
                {hasContent && (
                  <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    <AlertTriangle size={11} className="inline mr-1" />
                    Content changed:{" "}
                    {Array.from(contentDirty)
                      .map((s) => s.replace("section", "S"))
                      .join(", ")}
                  </div>
                )}
                {isAssignOnly && (
                  <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <Info size={11} className="inline mr-1" />
                    Assignment-only — version will NOT increment on save
                  </div>
                )}
                {renderHistoryPanel()}
              </div>
            )}
          </div>

          <button
            onClick={fetchLatestPD}
            disabled={!metaData.programCode || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Fetch Latest</span>
          </button>

          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
          >
            <Eye size={14} /> Preview
          </button>

          <button
            onClick={() => handleSave("Draft")}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all disabled:opacity-50 ${
              isAssignOnly
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-gray-900 hover:bg-black text-white"
            }`}
          >
            <Save size={14} /> {saveBtnLabel()}
          </button>

          <button
            onClick={() => handleSave("UnderReview")}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            <Send size={14} /> Submit
          </button>
        </div>
      </div>

      {/* ── STEP TAB BAR ────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 transition-all ${
              activeStep === step.id
                ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <step.icon size={14} />
            {step.label}
          </button>
        ))}
      </div>

      {/* ── DIRTY BANNER ────────────────────────────────────────────────── */}
      {hasAny && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm mb-4 ${
            isAssignOnly
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}
        >
          {isAssignOnly ? (
            <Info size={14} className="flex-shrink-0" />
          ) : (
            <AlertTriangle size={14} className="flex-shrink-0" />
          )}
          {isAssignOnly
            ? "You have pending assignment changes. Saving will update the DB without incrementing the version."
            : `Unsaved content in: ${Array.from(contentDirty)
                .map((s) => s.replace("section", "Sec "))
                .join(", ")}`}
        </div>
      )}

      {/* ── STEP CONTENT ────────────────────────────────────────────────── */}
      <div>
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
        {activeStep === 3 && renderStep3()}
        {activeStep === 4 && renderStep4()}
      </div>

      {/* ── FOOTER NAVIGATION ───────────────────────────────────────────── */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
          disabled={activeStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          <ArrowLeft size={15} /> Previous
        </button>

        {/* Step indicator dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`rounded-full transition-all duration-200 ${activeStep === s.id ? "w-5 h-2 bg-blue-600" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveAndNext}
            disabled={loading}
            className="px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            Save &amp; Next
          </button>
          <button
            onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
            disabled={activeStep === 4}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40"
          >
            Next <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* ── ASSIGN CREATOR MODAL ────────────────────────────────────────── */}
      <SearchCreator
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        courseCode={currentAssignContext?.code}
        currentAssigneeId={currentAssignContext?.currentAssigneeId}
        onSelect={(creator) => {
          if (!currentAssignContext) return;
          if (currentAssignContext.isElective) {
            handleAssignElectiveCreator(
              currentAssignContext.electiveType,
              currentAssignContext.groupIndex,
              currentAssignContext.courseIndex,
              creator,
            );
          } else {
            handleAssignCreator(
              currentAssignContext.semIndex,
              currentAssignContext.courseIndex,
              creator,
            );
          }
          setIsAssignModalOpen(false);
        }}
      />
    </CreatorLayout>
  );
};

export default CreatePD;
