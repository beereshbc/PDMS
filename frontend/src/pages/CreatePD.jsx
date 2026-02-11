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
  Edit3,
  Download,
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

// --- REACT 19 COMPATIBLE EDITOR ---
import JoditEditor from "jodit-react";

// --- CONSTANTS ---
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

const MOCK_PROGRAMS = [
  {
    id: "BTECH-CSE",
    code: "BTECH-CSE",
    name: "B.Tech Computer Science & Engineering",
    level: "UG",
    department: "Computer Science & Engineering",
  },
  {
    id: "MTECH-CSE",
    code: "MTECH-CSE",
    name: "M.Tech Computer Science",
    level: "PG",
    department: "Computer Science & Engineering",
  },
  {
    id: "BTECH-ECE",
    code: "BTECH-ECE",
    name: "B.Tech Electronics & Communication",
    level: "UG",
    department: "Electronics & Communication Engineering",
  },
  {
    id: "BTECH-ME",
    code: "BTECH-ME",
    name: "B.Tech Mechanical Engineering",
    level: "UG",
    department: "Mechanical Engineering",
  },
];

const PREPOPULATED_DATA = {
  details: {
    university: "GM University",
    faculty: "Engineering and Technology (FET)",
    school: "School of Computer Science and Technology (SCST)",
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

// -------------------------------------------------------------
// PROGRESS SUMMARY (Memoized)
// -------------------------------------------------------------
const ProgressSummary = React.memo(({ metaData, pdData, activeStep }) => {
  const steps = [
    {
      id: 1,
      label: "Program Info",
      completed: !!metaData.programId,
    },
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

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-semibold text-blue-600">
          {completedSteps}/{steps.length} steps
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  step.completed
                    ? "bg-green-100 text-green-600"
                    : activeStep === step.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                }`}
            >
              {step.completed ? <CheckCircle size={16} /> : step.id}
            </div>
            <span className="text-xs mt-1 text-gray-600">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
const CreatePD = () => {
  const navigate = useNavigate();
  const { axios, createrToken } = useAppContext();

  // UI State
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [recentVersions, setRecentVersions] = useState([]);
  const previewRef = useRef(null);
  const editorRef = useRef(null);

  // Dirty State Tracking
  const [dirtySections, setDirtySections] = useState(new Set());
  const markDirty = useCallback((section) => {
    setDirtySections((prev) => new Set(prev).add(section));
  }, []);

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
  });

  const [pdData, setPdData] = useState({ ...PREPOPULATED_DATA });

  // Jodit Configuration (memoized)
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
      ],
      height: 300,
      statusbar: false,
    }),
    [],
  );

  // Filtered Programs
  const filteredPrograms = MOCK_PROGRAMS.filter(
    (program) =>
      program.code.toLowerCase().includes(searchProgram.toLowerCase()) ||
      program.name.toLowerCase().includes(searchProgram.toLowerCase()),
  );

  // --- API HANDLERS ---
  const fetchRecentVersions = async (progCode) => {
    try {
      const { data } = await axios.get(`/api/creater/pd/versions/${progCode}`, {
        headers: { createrToken },
      });
      if (data.success) setRecentVersions(data.versions);
    } catch (error) {
      console.error(error);
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
      } else {
        toast.error("No previous versions found.");
      }
    } catch (error) {
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
        toast.success(`Loaded version ${data.pd.pdVersion}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (pd) => {
    const s1 = pd.section1_info;
    const s2 = pd.section2_objectives;
    const s3 = pd.section3_structure;
    const s4 = pd.section4_electives;

    setMetaData({
      programId: pd.programCode,
      programCode: pd.programCode,
      programName: s1.programName,
      schemeYear: pd.schemeYear,
      versionNo: pd.pdVersion,
      effectiveAy: pd.effectiveAcademicYear,
      totalCredits: s3.totalProgramCredits,
      isNew: false,
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

    setDirtySections(new Set());
  };

  // --- FORM HANDLERS (with useCallback for performance) ---
  const handleMetaChange = useCallback((e) => {
    const { name, value } = e.target;
    setMetaData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNestedChange = useCallback(
    (section, field, value) => {
      markDirty("section1");
      setPdData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    },
    [markDirty],
  );

  // Rich Text
  const handleOverviewChange = useCallback(
    (content) => {
      if (content !== pdData.overview) {
        markDirty("section2");
        setPdData((prev) => ({ ...prev, overview: content }));
      }
    },
    [pdData.overview, markDirty],
  );

  // Generic array handlers (PEOs, PSOs, etc.)
  const handleArrayChange = useCallback(
    (key, index, content) => {
      markDirty("section2");
      setPdData((prev) => {
        const newArr = [...prev[key]];
        newArr[index] = content;
        return { ...prev, [key]: newArr };
      });
    },
    [markDirty],
  );

  const addArrayItem = useCallback(
    (key, defaultValue = "") => {
      markDirty("section2");
      setPdData((prev) => ({ ...prev, [key]: [...prev[key], defaultValue] }));
    },
    [markDirty],
  );

  const removeArrayItem = useCallback(
    (key, index) => {
      markDirty("section2");
      setPdData((prev) => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }));
    },
    [markDirty],
  );

  // ----- PO specific handlers -----
  const addPO = useCallback(() => {
    addArrayItem("pos", "");
  }, [addArrayItem]);

  const removePO = useCallback(
    (index) => {
      if (pdData.pos.length <= 1) {
        toast.error("At least one PO is required.");
        return;
      }
      if (window.confirm("Are you sure you want to delete this PO?")) {
        removeArrayItem("pos", index);
      }
    },
    [pdData.pos.length, removeArrayItem],
  );

  const resetPOs = useCallback(() => {
    if (
      window.confirm(
        "This will replace all current POs with the standard 12 POs. Continue?",
      )
    ) {
      markDirty("section2");
      setPdData((prev) => ({ ...prev, pos: [...STANDARD_POS] }));
    }
  }, [markDirty]);

  // ----- Structure handlers -----
  const updateCreditDef = useCallback(
    (type, val) => {
      markDirty("section3");
      setPdData((prev) => ({
        ...prev,
        credit_def: { ...prev.credit_def, [type]: parseInt(val) || 0 },
      }));
    },
    [markDirty],
  );

  const addStructureItem = useCallback(() => {
    markDirty("section3");
    setPdData((prev) => ({
      ...prev,
      structure_table: [
        ...prev.structure_table,
        { category: "", credits: 0, code: "" },
      ],
    }));
  }, [markDirty]);

  const removeStructureItem = useCallback(
    (index) => {
      markDirty("section3");
      setPdData((prev) => ({
        ...prev,
        structure_table: prev.structure_table.filter((_, i) => i !== index),
      }));
    },
    [markDirty],
  );

  const updateStructureItem = useCallback(
    (index, field, value) => {
      markDirty("section3");
      setPdData((prev) => {
        const newTable = [...prev.structure_table];
        newTable[index] = { ...newTable[index], [field]: value };
        return { ...prev, structure_table: newTable };
      });
    },
    [markDirty],
  );

  // ----- Semester handlers (dynamic) -----
  const addSemester = useCallback(() => {
    markDirty("section3");
    setPdData((prev) => {
      const maxSem = Math.max(...prev.semesters.map((s) => s.sem_no), 0);
      const newSem = {
        sem_no: maxSem + 1,
        courses: [],
      };
      const updated = [...prev.semesters, newSem];
      // sort by sem_no
      updated.sort((a, b) => a.sem_no - b.sem_no);
      return { ...prev, semesters: updated };
    });
  }, [markDirty]);

  const removeSemester = useCallback(
    (semIndex) => {
      if (pdData.semesters.length <= 1) {
        toast.error("At least one semester is required.");
        return;
      }
      if (window.confirm("Delete this entire semester and all its courses?")) {
        markDirty("section3");
        setPdData((prev) => ({
          ...prev,
          semesters: prev.semesters.filter((_, i) => i !== semIndex),
        }));
      }
    },
    [pdData.semesters.length, markDirty],
  );

  const addCourse = useCallback(
    (semIndex) => {
      markDirty("section3");
      setPdData((prev) => {
        const newSems = [...prev.semesters];
        newSems[semIndex].courses.push({
          code: "",
          title: "",
          credits: 3,
          type: "Theory",
          category: "Core",
        });
        return { ...prev, semesters: newSems };
      });
    },
    [markDirty],
  );

  const removeCourse = useCallback(
    (semIndex, courseIndex) => {
      markDirty("section3");
      setPdData((prev) => {
        const newSems = [...prev.semesters];
        newSems[semIndex].courses = newSems[semIndex].courses.filter(
          (_, i) => i !== courseIndex,
        );
        return { ...prev, semesters: newSems };
      });
    },
    [markDirty],
  );

  const updateCourse = useCallback(
    (semIndex, courseIndex, field, value) => {
      markDirty("section3");
      setPdData((prev) => {
        const newSems = [...prev.semesters];
        newSems[semIndex].courses[courseIndex][field] = value;
        return { ...prev, semesters: newSems };
      });
    },
    [markDirty],
  );

  // ----- Elective handlers (fully flexible) -----
  const addElectiveGroup = useCallback(
    (type) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const defaultSem = 1; // always start at 1 – user can edit later
        const newGroup = {
          sem: defaultSem,
          title: `${type === "prof" ? "Professional" : "Open"} Electives - Semester ${defaultSem}`,
          courses: [],
        };
        return { ...prev, [key]: [...prev[key], newGroup] };
      });
    },
    [markDirty],
  );

  const removeElectiveGroup = useCallback(
    (type, index) => {
      if (window.confirm("Remove this elective group?")) {
        markDirty("section4");
        const key = type === "prof" ? "prof_electives" : "open_electives";
        setPdData((prev) => ({
          ...prev,
          [key]: prev[key].filter((_, i) => i !== index),
        }));
      }
    },
    [markDirty],
  );

  const updateElectiveGroupSemester = useCallback(
    (type, gIdx, value) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const arr = [...prev[key]];
        arr[gIdx].sem = parseInt(value) || 1;
        return { ...prev, [key]: arr };
      });
    },
    [markDirty],
  );

  const updateElectiveGroupTitle = useCallback(
    (type, gIdx, value) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const arr = [...prev[key]];
        arr[gIdx].title = value;
        return { ...prev, [key]: arr };
      });
    },
    [markDirty],
  );

  const addElectiveCourse = useCallback(
    (type, gIdx) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const arr = [...prev[key]];
        arr[gIdx].courses.push({ code: "", title: "", credits: 3 });
        return { ...prev, [key]: arr };
      });
    },
    [markDirty],
  );

  const removeElectiveCourse = useCallback(
    (type, gIdx, cIdx) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const arr = [...prev[key]];
        arr[gIdx].courses = arr[gIdx].courses.filter((_, i) => i !== cIdx);
        return { ...prev, [key]: arr };
      });
    },
    [markDirty],
  );

  const updateElectiveCourse = useCallback(
    (type, gIdx, cIdx, field, value) => {
      markDirty("section4");
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => {
        const arr = [...prev[key]];
        arr[gIdx].courses[cIdx][field] = value;
        return { ...prev, [key]: arr };
      });
    },
    [markDirty],
  );

  // Program selection
  const handleProgramSelect = useCallback(
    (program) => {
      setMetaData({
        ...metaData,
        programId: program.id,
        programCode: program.code,
        programName: program.name,
        isNew: true,
      });
      setPdData({
        ...PREPOPULATED_DATA,
        details: {
          ...PREPOPULATED_DATA.details,
          program_name: program.name,
          department: program.department,
        },
        award: {
          ...PREPOPULATED_DATA.award,
          title: `B.Tech in ${program.name}`,
        },
      });
      setShowProgramDropdown(false);
      setSearchProgram("");
      fetchRecentVersions(program.code);
      setDirtySections(
        new Set(["section1", "section2", "section3", "section4"]),
      );
    },
    [metaData],
  );

  // --- ACTIONS ---
  const handlePreview = useCallback(() => {
    if (!metaData.programId) {
      toast.error("Please select a program first");
      return;
    }
    navigate("/creator/preview", { state: { pdData, metaData } });
  }, [metaData, pdData, navigate]);

  const generatePDF = useCallback(() => {
    toast(
      "Generating PDF... Please use the Print/Save function in the Preview page for best results.",
    );
    if (!previewRef.current) return;
    html2pdf().from(previewRef.current).save(`PD_${metaData.programCode}.pdf`);
  }, [metaData.programCode]);

  // Intelligent Save Logic
  const handleSave = useCallback(
    async (status = "Draft") => {
      if (!metaData.programId) return toast.error("Select Program First");

      if (
        !metaData.isNew &&
        dirtySections.size === 0 &&
        status === metaData.status
      ) {
        return toast.success("No changes detected.");
      }

      setLoading(true);

      const payload = {
        programId: metaData.programCode,
        isNewProgram: metaData.isNew,
        sectionsToUpdate: metaData.isNew ? ["all"] : Array.from(dirtySections),
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
          toast.success(data.message);
          setMetaData((prev) => ({
            ...prev,
            isNew: false,
            versionNo: data.version,
          }));
          fetchRecentVersions(metaData.programCode);
          setDirtySections(new Set());
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Save failed");
      } finally {
        setLoading(false);
      }
    },
    [metaData, dirtySections, pdData, axios, createrToken],
  );

  const handleSaveAndNext = useCallback(async () => {
    await handleSave("Draft");
    setActiveStep((prev) => Math.min(4, prev + 1));
  }, [handleSave]);

  // -------------------------------------------------------------
  // RENDER HISTORY PANEL (placed in sidebar)
  // -------------------------------------------------------------
  const renderHistoryPanel = useCallback(() => {
    if (!metaData.programCode) return null;
    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <History className="text-gray-500" size={18} />
          <h3 className="font-semibold text-gray-700 text-sm">
            Version History
          </h3>
        </div>
        {recentVersions.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No previous versions found.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {recentVersions.map((ver) => (
              <div
                key={ver._id}
                className="bg-gray-50 p-2 rounded border hover:shadow-sm transition cursor-pointer"
                onClick={() => fetchFullPD(ver._id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600 text-xs">
                    v{ver.pdVersion}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      ver.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {ver.status}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(ver.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [metaData.programCode, recentVersions, fetchFullPD]);

  // -------------------------------------------------------------
  // STEP RENDERERS
  // -------------------------------------------------------------
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Program Selection Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Book className="text-gray-700" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            Program Selection
          </h3>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              placeholder="Search programs by code or name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search
              className="absolute right-3 top-3.5 text-gray-400"
              size={20}
            />
          </div>
          {showProgramDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    onClick={() => handleProgramSelect(program)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-gray-900">
                        {program.code}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          program.level === "UG"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {program.level}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{program.name}</div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No programs found
                </div>
              )}
            </div>
          )}
          {metaData.programId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-900">
                  {metaData.programName}
                </div>
                <div className="text-xs text-gray-500">
                  {metaData.programCode}
                </div>
              </div>
              <button
                onClick={() => {
                  setMetaData({ ...metaData, programId: "" });
                  setSearchProgram("");
                }}
              >
                <X size={20} className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Version & Scheme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <Calendar size={14} /> Scheme Year
              </div>
            </label>
            <input
              type="text"
              name="schemeYear"
              value={metaData.schemeYear}
              onChange={handleMetaChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g. 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <Hash size={14} /> Version
              </div>
            </label>
            <input
              type="text"
              name="versionNo"
              value={metaData.versionNo}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <Clock size={14} /> Effective A.Y.
              </div>
            </label>
            <input
              type="text"
              name="effectiveAy"
              value={metaData.effectiveAy}
              onChange={handleMetaChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="2024-25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                <CreditCard size={14} /> Total Credits
              </div>
            </label>
            <input
              type="number"
              name="totalCredits"
              value={metaData.totalCredits}
              onChange={handleMetaChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Program Details Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-gray-700" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            Program Details
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(pdData.details).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  handleNestedChange("details", key, e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Award Details Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <File className="text-gray-700" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Award Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(pdData.award).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  handleNestedChange("award", key, e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Program Overview */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-gray-700" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            Program Overview
          </h3>
        </div>
        <JoditEditor
          ref={editorRef}
          value={pdData.overview}
          config={joditConfig}
          onBlur={handleOverviewChange}
        />
      </div>

      {/* PEOs */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Program Educational Objectives (PEOs)
            </h3>
          </div>
          <button
            onClick={() => addArrayItem("peos", "")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus size={14} /> Add PEO
          </button>
        </div>
        <div className="space-y-4">
          {pdData.peos.map((peo, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">PEO-{i + 1}</span>
                  {pdData.peos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("peos", i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <JoditEditor
                  value={peo}
                  config={{ ...joditConfig, height: 200 }}
                  onBlur={(val) => handleArrayChange("peos", i, val)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POs */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Book className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Program Outcomes (POs)
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetPOs}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              title="Reset to standard 12 POs"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={addPO}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <Plus size={14} /> Add PO
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {pdData.pos.map((po, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex gap-3 items-start">
                <span className="font-semibold text-gray-700 min-w-[60px] pt-2">
                  PO-{i + 1}
                </span>
                <div className="flex-1">
                  <JoditEditor
                    value={po}
                    config={{ ...joditConfig, height: 150 }}
                    onBlur={(val) => handleArrayChange("pos", i, val)}
                  />
                </div>
                <button
                  onClick={() => removePO(i)}
                  className="text-gray-400 hover:text-red-500 pt-2"
                  disabled={pdData.pos.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PSOs */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Program Specific Outcomes (PSOs)
            </h3>
          </div>
          <button
            onClick={() => addArrayItem("psos", "")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <Plus size={14} /> Add PSO
          </button>
        </div>
        <div className="space-y-4">
          {pdData.psos.map((pso, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-semibold">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">PSO-{i + 1}</span>
                  {pdData.psos.length > 1 && (
                    <button
                      onClick={() => removeArrayItem("psos", i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <JoditEditor
                  value={pso}
                  config={{ ...joditConfig, height: 200 }}
                  onBlur={(val) => handleArrayChange("psos", i, val)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Credit Definition */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-gray-700" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            Definition of Credit (L:T:P)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1 Hr. Lecture (L) per week
            </label>
            <input
              type="number"
              value={pdData.credit_def.L}
              onChange={(e) => updateCreditDef("L", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2 Hr. Tutorial (T) per week
            </label>
            <input
              type="number"
              value={pdData.credit_def.T}
              onChange={(e) => updateCreditDef("T", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2 Hr. Practical (P) per week
            </label>
            <input
              type="number"
              value={pdData.credit_def.P}
              onChange={(e) => updateCreditDef("P", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Programme Structure Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Programme Structure
            </h3>
          </div>
          <button
            onClick={addStructureItem}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  #
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">
                  Code
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Credits
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pdData.structure_table.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) =>
                        updateStructureItem(i, "category", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) =>
                        updateStructureItem(i, "code", e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.credits}
                      onChange={(e) =>
                        updateStructureItem(
                          i,
                          "credits",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button
                      onClick={() => removeStructureItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td
                  colSpan="3"
                  className="border border-gray-300 px-4 py-3 text-right"
                >
                  Total Credits
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  {pdData.structure_table.reduce(
                    (sum, row) => sum + (row.credits || 0),
                    0,
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Semester-wise Courses */}
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={addSemester}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> Add Semester
          </button>
        </div>
        {pdData.semesters.map((sem, semIndex) => (
          <div
            key={sem.sem_no}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-gray-700" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">
                  Semester {sem.sem_no}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addCourse(semIndex)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Plus size={14} /> Add Course
                </button>
                <button
                  onClick={() => removeSemester(semIndex)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      #
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Course Code
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Course Title
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Credits
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Type
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Category
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c, ci) => (
                    <tr key={ci} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {ci + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.code}
                          onChange={(e) =>
                            updateCourse(semIndex, ci, "code", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) =>
                            updateCourse(semIndex, ci, "title", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 w-16">
                        <input
                          type="number"
                          min="0"
                          value={c.credits}
                          onChange={(e) =>
                            updateCourse(
                              semIndex,
                              ci,
                              "credits",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <select
                          value={c.type}
                          onChange={(e) =>
                            updateCourse(semIndex, ci, "type", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option>Theory</option>
                          <option>Lab</option>
                          <option>Theory+Lab</option>
                          <option>Project</option>
                          <option>Seminar</option>
                          <option>Practical</option>
                          <option>Internship</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <select
                          value={c.category}
                          onChange={(e) =>
                            updateCourse(
                              semIndex,
                              ci,
                              "category",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option>Core</option>
                          <option>Elective</option>
                          <option>Open Elective</option>
                          <option>Lab</option>
                          <option>Project</option>
                          <option>Competency</option>
                          <option>Life Skills</option>
                          <option>Innovation</option>
                          <option>Service</option>
                          <option>Sports</option>
                          <option>Cultural</option>
                          <option>Co-curricular</option>
                          <option>Placement</option>
                          <option>Internship</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          onClick={() => removeCourse(semIndex, ci)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
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

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Professional Electives */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Grid className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Professional Electives
            </h3>
          </div>
          <button
            onClick={() => addElectiveGroup("prof")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus size={14} /> Add Semester
          </button>
        </div>
        {pdData.prof_electives.map((grp, gi) => (
          <div key={gi} className="mb-4 border p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between mb-2 items-center flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Editable Semester */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Sem</span>
                  <input
                    type="number"
                    min="1"
                    value={grp.sem}
                    onChange={(e) =>
                      updateElectiveGroupSemester("prof", gi, e.target.value)
                    }
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                {/* Editable Title */}
                <input
                  type="text"
                  value={grp.title}
                  onChange={(e) =>
                    updateElectiveGroupTitle("prof", gi, e.target.value)
                  }
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Group title"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addElectiveCourse("prof", gi)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  + Course
                </button>
                <button
                  onClick={() => removeElectiveGroup("prof", gi)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Code
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Title
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold w-16">
                      Cr
                    </th>
                    <th className="border border-gray-300 px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {grp.courses.map((c, ci) => (
                    <tr key={ci}>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.code}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "prof",
                              gi,
                              ci,
                              "code",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "prof",
                              gi,
                              ci,
                              "title",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={c.credits}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "prof",
                              gi,
                              ci,
                              "credits",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          onClick={() => removeElectiveCourse("prof", gi, ci)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
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

      {/* Open Electives */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Grid className="text-gray-700" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">
              Open Electives
            </h3>
          </div>
          <button
            onClick={() => addElectiveGroup("open")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <Plus size={14} /> Add Semester
          </button>
        </div>
        {pdData.open_electives.map((grp, gi) => (
          <div key={gi} className="mb-4 border p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between mb-2 items-center flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Editable Semester */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Sem</span>
                  <input
                    type="number"
                    min="1"
                    value={grp.sem}
                    onChange={(e) =>
                      updateElectiveGroupSemester("open", gi, e.target.value)
                    }
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                {/* Editable Title */}
                <input
                  type="text"
                  value={grp.title}
                  onChange={(e) =>
                    updateElectiveGroupTitle("open", gi, e.target.value)
                  }
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Group title"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addElectiveCourse("open", gi)}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  + Course
                </button>
                <button
                  onClick={() => removeElectiveGroup("open", gi)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Code
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Title
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold w-16">
                      Cr
                    </th>
                    <th className="border border-gray-300 px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {grp.courses.map((c, ci) => (
                    <tr key={ci}>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.code}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "open",
                              gi,
                              ci,
                              "code",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "open",
                              gi,
                              ci,
                              "title",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={c.credits}
                          onChange={(e) =>
                            updateElectiveCourse(
                              "open",
                              gi,
                              ci,
                              "credits",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          onClick={() => removeElectiveCourse("open", gi, ci)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
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

  // -------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------
  return (
    <CreatorLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Program Document Manager
          </h1>
          <p className="text-gray-600">
            {metaData.programName || "Select a program"}{" "}
            {metaData.programCode && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                v{metaData.versionNo}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchLatestPD}
            disabled={!metaData.programCode || loading}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Fetch Latest
          </button>
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Eye size={18} /> Preview
          </button>
          <button
            onClick={() => handleSave("Draft")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black"
          >
            <Save size={18} /> {loading ? "Saving..." : "Save Update"}
          </button>
          <button
            onClick={() => handleSave("UnderReview")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send size={18} /> Submit
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <ProgressSummary
            metaData={metaData}
            pdData={pdData}
            activeStep={activeStep}
          />
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <nav className="space-y-1 p-2">
              {[
                {
                  id: 1,
                  label: "Program Information",
                  icon: BookOpen,
                  description: "Basic program details",
                },
                {
                  id: 2,
                  label: "Objectives & Outcomes",
                  icon: List,
                  description: "PEOs, POs, PSOs",
                },
                {
                  id: 3,
                  label: "Structure & Curriculum",
                  icon: Layers,
                  description: "Courses & credits",
                },
                {
                  id: 4,
                  label: "Electives",
                  icon: Table,
                  description: "Professional & open electives",
                },
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full flex items-start gap-3 p-3 text-left rounded-lg transition-colors ${
                    activeStep === step.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`p-2 rounded ${
                      activeStep === step.id
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <step.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        activeStep === step.id
                          ? "text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>
                  {activeStep === step.id && (
                    <ChevronRight className="text-blue-600" size={18} />
                  )}
                </button>
              ))}
            </nav>
          </div>
          {/* Dirty state indicator */}
          {dirtySections.size > 0 && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-700">
              Unsaved changes in:{" "}
              {Array.from(dirtySections)
                .map((s) => s.replace("section", "Sec "))
                .join(", ")}
            </div>
          )}
          {/* History Panel now inside sidebar */}
          {renderHistoryPanel()}
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
            {activeStep === 4 && renderStep4()}
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
              disabled={activeStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeft size={18} /> Previous
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAndNext}
                disabled={loading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Save & Next
              </button>
              <button
                onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
                disabled={activeStep === 4}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden preview ref for PDF generation (if used) */}
      <div ref={previewRef} style={{ display: "none" }} />
    </CreatorLayout>
  );
};

export default CreatePD;
