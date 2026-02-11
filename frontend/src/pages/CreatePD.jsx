import React, { useState, useEffect, useRef } from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Save,
  Eye,
  Send,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

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

// --- COMPONENT START ---

const CreatePD = () => {
  const navigate = useNavigate();
  const { axios, createrToken } = useAppContext();

  // State
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchProgram, setSearchProgram] = useState("");
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [recentVersions, setRecentVersions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const previewRef = useRef(null);

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

  // Filter Programs for Search
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
      if (data.success) {
        setRecentVersions(data.versions);
      }
    } catch (error) {
      console.error("Error fetching versions", error);
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
        toast.error("No previous versions found. Starting fresh.");
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
      setShowHistory(false);
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
  };

  // --- LOCAL FORM HANDLERS ---

  const handleMetaChange = (e) =>
    setMetaData({ ...metaData, [e.target.name]: e.target.value });
  const handleNestedChange = (section, field, value) =>
    setPdData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  const handleArrayChange = (key, index, value) => {
    const newArr = [...pdData[key]];
    newArr[index] = value;
    setPdData((prev) => ({ ...prev, [key]: newArr }));
  };
  const addArrayItem = (key) =>
    setPdData((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  const removeArrayItem = (key, index) =>
    setPdData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

  const addStructureItem = () =>
    setPdData((prev) => ({
      ...prev,
      structure_table: [
        ...prev.structure_table,
        { category: "", credits: 0, code: "" },
      ],
    }));
  const removeStructureItem = (index) =>
    setPdData((prev) => ({
      ...prev,
      structure_table: prev.structure_table.filter((_, i) => i !== index),
    }));
  const updateStructureItem = (index, field, value) => {
    const newTable = [...pdData.structure_table];
    newTable[index] = { ...newTable[index], [field]: value };
    setPdData((prev) => ({ ...prev, structure_table: newTable }));
  };

  const addCourse = (semIndex) => {
    const newSems = [...pdData.semesters];
    newSems[semIndex].courses.push({
      code: "",
      title: "",
      credits: 3,
      type: "Theory",
      category: "Core",
    });
    setPdData((prev) => ({ ...prev, semesters: newSems }));
  };
  const removeCourse = (semIndex, courseIndex) => {
    const newSems = [...pdData.semesters];
    newSems[semIndex].courses = newSems[semIndex].courses.filter(
      (_, i) => i !== courseIndex,
    );
    setPdData((prev) => ({ ...prev, semesters: newSems }));
  };
  const updateCourse = (semIndex, courseIndex, field, value) => {
    const newSems = [...pdData.semesters];
    newSems[semIndex].courses[courseIndex][field] = value;
    setPdData((prev) => ({ ...prev, semesters: newSems }));
  };

  const addElectiveGroup = (type) => {
    const key = type === "prof" ? "prof_electives" : "open_electives";
    setPdData((prev) => ({
      ...prev,
      [key]: [...prev[key], { sem: 5, title: "New Group", courses: [] }],
    }));
  };
  const removeElectiveGroup = (type, index) => {
    if (window.confirm("Remove group?")) {
      const key = type === "prof" ? "prof_electives" : "open_electives";
      setPdData((prev) => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index),
      }));
    }
  };
  const addElectiveCourse = (type, gIdx) => {
    const key = type === "prof" ? "prof_electives" : "open_electives";
    const arr = [...pdData[key]];
    arr[gIdx].courses.push({ code: "", title: "", credits: 3 });
    setPdData((prev) => ({ ...prev, [key]: arr }));
  };
  const removeElectiveCourse = (type, gIdx, cIdx) => {
    const key = type === "prof" ? "prof_electives" : "open_electives";
    const arr = [...pdData[key]];
    arr[gIdx].courses = arr[gIdx].courses.filter((_, i) => i !== cIdx);
    setPdData((prev) => ({ ...prev, [key]: arr }));
  };
  const updateElectiveCourse = (type, gIdx, cIdx, field, value) => {
    const key = type === "prof" ? "prof_electives" : "open_electives";
    const arr = [...pdData[key]];
    arr[gIdx].courses[cIdx][field] = value;
    setPdData((prev) => ({ ...prev, [key]: arr }));
  };

  const handleProgramSelect = (program) => {
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
      award: { ...PREPOPULATED_DATA.award, title: `B.Tech in ${program.name}` },
    });
    setShowProgramDropdown(false);
    setSearchProgram("");
    fetchRecentVersions(program.code);
  };

  // --- ACTIONS ---

  const handlePreview = () => {
    if (!metaData.programId) {
      toast.error("Please select a program first");
      return;
    }
    // Navigate to preview page with state
    navigate("/creator/preview", {
      state: {
        pdData,
        metaData,
      },
    });
  };

  const generatePDF = () => {
    // Generate PDF logic here (or trigger it in preview page)
    // Using current state if triggered from here
    // Note: Usually better to do this from the Preview page where DOM exists
    toast("Generating PDF feature coming soon via Preview page");
  };

  const handleSave = async (status = "Draft") => {
    if (!metaData.programId) return toast.error("Select Program First");
    setLoading(true);

    const payload = {
      programId: metaData.programCode,
      isNewProgram: metaData.isNew,
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
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS (DEFINED INSIDE COMPONENT) ---

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

        <div className="space-y-4">
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
                placeholder="Search programs by code, name, or department..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {program.code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {program.name}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${program.level === "UG" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                        >
                          {program.level}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {program.department}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No programs found
                  </div>
                )}
              </div>
            )}
          </div>

          {metaData.programId && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {metaData.programName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Code: {metaData.programCode} | Level:{" "}
                    {
                      MOCK_PROGRAMS.find((p) => p.id === metaData.programId)
                        ?.level
                    }
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMetaData((prev) => ({
                      ...prev,
                      programId: "",
                      programCode: "",
                      programName: "",
                    }));
                    setSearchProgram("");
                    setPdData({ ...PREPOPULATED_DATA, pos: STANDARD_POS });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar size={14} /> Scheme Year *
                </div>
              </label>
              <input
                type="text"
                name="schemeYear"
                value={metaData.schemeYear}
                onChange={handleMetaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  <Hash size={14} /> Version No. *
                </div>
              </label>
              <input
                type="text"
                name="versionNo"
                value={metaData.versionNo}
                onChange={handleMetaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  <Clock size={14} /> Effective A.Y. *
                </div>
              </label>
              <input
                type="text"
                name="effectiveAy"
                value={metaData.effectiveAy}
                onChange={handleMetaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="YYYY-YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  <CreditCard size={14} /> Total Credits
                </div>
              </label>
              <input
                type="number"
                name="totalCredits"
                value={metaData.totalCredits}
                onChange={handleMetaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 160"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} /> Program Details
        </h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={`Enter ${key.replace(/_/g, " ")}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <File size={20} /> Award Details
        </h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={`Enter ${key.replace(/_/g, " ")}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} /> Program Overview
        </h3>
        <textarea
          value={pdData.overview}
          onChange={(e) =>
            setPdData((prev) => ({ ...prev, overview: e.target.value }))
          }
          rows={15}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Enter detailed program overview..."
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <List size={20} /> Program Educational Objectives (PEOs)
          </h3>
          <button
            onClick={() => addArrayItem("peos")}
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
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
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
                <textarea
                  value={peo}
                  onChange={(e) => handleArrayChange("peos", i, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Enter PEO description..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Book size={20} /> Program Outcomes (POs)
        </h3>
        <div className="space-y-3">
          {pdData.pos.map((po, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex gap-3"
            >
              <span className="font-semibold text-gray-700 min-w-[60px]">
                PO-{i + 1}
              </span>
              <textarea
                value={po}
                onChange={(e) => handleArrayChange("pos", i, e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <List size={20} /> Program Specific Outcomes (PSOs)
          </h3>
          <button
            onClick={() => addArrayItem("psos")}
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
              <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-semibold flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
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
                <textarea
                  value={pso}
                  onChange={(e) => handleArrayChange("psos", i, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none resize-none"
                  placeholder="Enter PSO description..."
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
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings size={20} /> Definition of Credit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["L", "T", "P"].map((type) => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "L"
                  ? "Lecture"
                  : type === "T"
                    ? "Tutorial"
                    : "Practical"}{" "}
                (Hr/Week)
              </label>
              <input
                type="number"
                min="0"
                value={pdData.credit_def[type]}
                onChange={(e) =>
                  setPdData((prev) => ({
                    ...prev,
                    credit_def: {
                      ...prev.credit_def,
                      [type]: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Table size={20} /> Programme Structure
          </h3>
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
                <th className="border p-3 text-left">#</th>
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Code</th>
                <th className="border p-3 text-left">Credits</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pdData.structure_table.map((row, i) => (
                <tr key={i}>
                  <td className="border p-3 text-center">{i + 1}</td>
                  <td className="border p-3">
                    <input
                      value={row.category}
                      onChange={(e) =>
                        updateStructureItem(i, "category", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border p-3">
                    <input
                      value={row.code}
                      onChange={(e) =>
                        updateStructureItem(i, "code", e.target.value)
                      }
                      className="w-full p-1 border rounded uppercase"
                    />
                  </td>
                  <td className="border p-3">
                    <input
                      type="number"
                      value={row.credits}
                      onChange={(e) =>
                        updateStructureItem(
                          i,
                          "credits",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => removeStructureItem(i)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pdData.semesters.map((sem, semIndex) => (
        <div
          key={semIndex}
          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FolderOpen size={20} /> Semester {sem.sem_no}
            </h3>
            <button
              onClick={() => addCourse(semIndex)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Plus size={14} /> Add Course
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">#</th>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Credits</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((course, cIndex) => (
                  <tr key={cIndex}>
                    <td className="border p-2 text-center">{cIndex + 1}</td>
                    <td className="border p-2">
                      <input
                        value={course.code}
                        onChange={(e) =>
                          updateCourse(semIndex, cIndex, "code", e.target.value)
                        }
                        className="w-full p-1 border rounded uppercase"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        value={course.title}
                        onChange={(e) =>
                          updateCourse(
                            semIndex,
                            cIndex,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={course.credits}
                        onChange={(e) =>
                          updateCourse(
                            semIndex,
                            cIndex,
                            "credits",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <select
                        value={course.type}
                        onChange={(e) =>
                          updateCourse(semIndex, cIndex, "type", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                      >
                        {[
                          "Theory",
                          "Lab",
                          "Theory + Lab",
                          "Project",
                          "Seminar",
                          "Internship",
                        ].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <select
                        value={course.category}
                        onChange={(e) =>
                          updateCourse(
                            semIndex,
                            cIndex,
                            "category",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      >
                        {[
                          "Core",
                          "Elective",
                          "Open Elective",
                          "Project",
                          "Internship",
                          "Competency",
                          "Life Skills",
                          "Sports",
                        ].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => removeCourse(semIndex, cIndex)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
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
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Professional Electives */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Grid size={20} /> Professional Electives
          </h3>
          <button
            onClick={() => addElectiveGroup("prof")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus size={14} /> Add Semester Group
          </button>
        </div>
        {pdData.prof_electives.map((group, gIdx) => (
          <div key={gIdx} className="mb-6 border p-4 rounded-lg">
            <div className="flex justify-between mb-3">
              <div className="font-medium">Semester: {group.sem}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => addElectiveCourse("prof", gIdx)}
                  className="text-blue-600 text-sm"
                >
                  + Add Course
                </button>
                <button
                  onClick={() => removeElectiveGroup("prof", gIdx)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Credits</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.courses.map((c, cIdx) => (
                  <tr key={cIdx}>
                    <td className="border p-2">
                      <input
                        value={c.code}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "prof",
                            gIdx,
                            cIdx,
                            "code",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        value={c.title}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "prof",
                            gIdx,
                            cIdx,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={c.credits}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "prof",
                            gIdx,
                            cIdx,
                            "credits",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => removeElectiveCourse("prof", gIdx, cIdx)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Open Electives */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Grid size={20} /> Open Electives
          </h3>
          <button
            onClick={() => addElectiveGroup("open")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <Plus size={14} /> Add Semester Group
          </button>
        </div>
        {pdData.open_electives.map((group, gIdx) => (
          <div key={gIdx} className="mb-6 border p-4 rounded-lg">
            <div className="flex justify-between mb-3">
              <div className="font-medium">Semester: {group.sem}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => addElectiveCourse("open", gIdx)}
                  className="text-green-600 text-sm"
                >
                  + Add Course
                </button>
                <button
                  onClick={() => removeElectiveGroup("open", gIdx)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Credits</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.courses.map((c, cIdx) => (
                  <tr key={cIdx}>
                    <td className="border p-2">
                      <input
                        value={c.code}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "open",
                            gIdx,
                            cIdx,
                            "code",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        value={c.title}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "open",
                            gIdx,
                            cIdx,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="number"
                        value={c.credits}
                        onChange={(e) =>
                          updateElectiveCourse(
                            "open",
                            gIdx,
                            cIdx,
                            "credits",
                            e.target.value,
                          )
                        }
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => removeElectiveCourse("open", gIdx, cIdx)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );

  const ProgressSummary = () => {
    const steps = [
      { id: 1, label: "Program Info", completed: !!metaData.programId },
      {
        id: 2,
        label: "Objectives",
        completed:
          pdData.peos.some((p) => p.trim()) &&
          pdData.psos.some((p) => p.trim()),
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
          pdData.prof_electives.length > 0 || pdData.open_electives.length > 0,
      },
    ];
    const completed = steps.filter((s) => s.completed).length;
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between mb-2 text-sm">
          <span>Progress</span>
          <span className="text-blue-600 font-semibold">{completed}/4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completed / 4) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-3">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${s.completed ? "bg-green-100 text-green-600" : activeStep === s.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {s.completed ? <CheckCircle size={16} /> : s.id}
              </div>
              <span className="text-xs mt-1 text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    <CreatorLayout>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
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
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
            Fetch Latest
          </button>

          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              disabled={!metaData.programCode}
              className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
            >
              <History size={16} /> History
            </button>
            {showHistory && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-2 border-b text-xs font-semibold text-gray-500">
                  Recent Versions
                </div>
                {recentVersions.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    No history available
                  </div>
                ) : (
                  recentVersions.map((ver) => (
                    <button
                      key={ver._id}
                      onClick={() => fetchFullPD(ver._id)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                    >
                      <span>v{ver.pdVersion}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(ver.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <ProgressSummary />
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <nav className="space-y-1 p-2">
              {[
                { id: 1, label: "Info", icon: BookOpen },
                { id: 2, label: "Objectives", icon: List },
                { id: 3, label: "Structure", icon: Layers },
                { id: 4, label: "Electives", icon: Table },
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg ${activeStep === step.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                >
                  <step.icon size={18} /> {step.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}

          <div className="mt-6 flex justify-between pt-4 border-t">
            <button
              onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
              disabled={activeStep === 1}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
              disabled={activeStep === 4}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatePD;
