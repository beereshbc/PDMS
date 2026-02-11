import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Edit,
  Eye,
  Save,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  BookOpen,
  Lock,
  Download,
  FileDown,
  Table,
  Hash,
  Book,
  ClipboardList,
  Award,
  GraduationCap,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";

const EditPD = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { axios } = useAppContext();

  const [step, setStep] = useState(1); // 1: Import, 2: Edit, 3: Preview
  const [loading, setLoading] = useState(false);
  const [parsingData, setParsingData] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Information
    program_id: "",
    program_manual_name: "",
    scheme_year: "",
    version_no: "1.0",
    effective_ay: "",
    total_credits: 160,
    academic_credits: 130,
    program_overview: "",

    // Specifications
    specifications: {
      faculty_name: "",
      school_name: "",
      department_name: "",
      director_name: "",
      hod_name: "",
      award_title: "",
      modes_of_study: "Full Time",
      awarding_body: "",
      joint_award: "",
      teaching_institution: "",
      specs_date: "",
      course_approval_date: "",
      next_review_date: "",
      approving_body_date: "",
      accredited_body_date: "",
      grade_awarded: "",
      accreditation_validity: "",
      benchmark: "",
    },

    // Learning Objectives
    peos: [],
    pos: [],
    psos: [],

    // Credit Structure
    credit_structure: [],
    credit_definitions: [],

    // Courses
    courses: {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
    },

    // Electives
    electives: [],

    // Rules
    attendance_rules: [{ minimum_percentage: 75, rule_description: "" }],
    degree_criteria: [
      {
        criteria_type: "DEGREE",
        minimum_credits: 160,
        minimum_cgpa: 5.0,
        criteria_description: "",
      },
      {
        criteria_type: "GOLD_MEDAL",
        minimum_cgpa: 8.5,
        criteria_description: "",
      },
    ],
    program_delivery: "",

    // Metadata
    teaching_methods: ["Lectures", "Tutorials", "Practicals"],
    student_support: ["Academic Mentoring", "Library Resources"],
    quality_measures: ["Student Feedback", "Peer Review"],

    // Custom Sections
    custom_sections: [],
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [parsingErrors, setParsingErrors] = useState([]);
  const [isParsed, setIsParsed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  // Handler functions
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const createrData = JSON.parse(localStorage.getItem("creater"));
      const { data } = await axios.post("/api/creater/save-draft", {
        ...formData,
        status: "draft",
        created_by: createrData?.id || "unknown",
      });

      if (data.success) {
        toast.success("Draft saved successfully!");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error(error.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/creater/preview", formData);
      if (data.success) {
        setPreviewHtml(data.previewHtml);
        setDownloadUrl(data.downloadUrl);
        setStep(3); // Move to preview step
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error(
        error.response?.data?.message || "Failed to generate preview",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWordDoc = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/creater/generate-docx",
        formData,
        {
          responseType: "blob", // This is crucial for binary files
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PD_${formData.scheme_year}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Word document downloaded!");
    } catch (error) {
      toast.error("Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinal = async () => {
    setLoading(true);
    try {
      const createrData = JSON.parse(localStorage.getItem("creater"));
      const { data } = await axios.post("/api/creater/create", {
        ...formData,
        status: "pending",
        created_by: createrData?.id || "unknown",
      });

      if (data.success) {
        toast.success("Program Document created successfully!");
        navigate("/creator/dashboard");
      }
    } catch (error) {
      console.error("Save final error:", error);
      toast.error(error.response?.data?.message || "Failed to save document");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Import PDF
  const ImportStep = () => {
    const [uploadError, setUploadError] = useState("");

    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (
        !file.type.includes("pdf") &&
        !file.type.includes("word") &&
        !file.type.includes("document")
      ) {
        setUploadError("Please upload a PDF or Word document");
        toast.error("Please upload a PDF or Word document");
        return;
      }

      setPdfFile(file);
      setLoading(true);
      setUploadError("");
      setIsParsed(false);

      const formDataObj = new FormData();
      formDataObj.append("file", file);

      try {
        console.log("Uploading file:", file.name);
        const { data } = await axios.post("/api/creater/parse", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("Parse response:", data);

        if (data.success) {
          setParsingData(data.data);
          setParsingErrors(data.parsing_errors || []);
          setIsParsed(true);

          // Populate form with parsed data
          setFormData((prev) => {
            const newData = {
              ...prev,
              program_manual_name: data.data.program_name || "",
              scheme_year:
                data.data.scheme_year || new Date().getFullYear().toString(),
              specifications: {
                ...prev.specifications,
                faculty_name: data.data.faculty_name || "",
                school_name: data.data.school_name || "",
                department_name: data.data.department_name || "",
                director_name: data.data.director_name || "",
                hod_name: data.data.hod_name || "",
                award_title:
                  data.data.title_of_award ||
                  "B.Tech. in Computer Science & Engineering",
              },
              program_overview: data.data.program_overview || "",
              peos: data.data.peos || [],
              pos: data.data.pos || [],
              psos: data.data.psos || [],
              credit_definitions: data.data.credit_definitions || [],
              credit_structure: data.data.credit_structure || [],
              electives: data.data.electives || [],
            };

            // Populate courses
            if (data.data.courses) {
              Object.keys(data.data.courses).forEach((sem) => {
                newData.courses[sem] = data.data.courses[sem] || [];
              });
            }

            return newData;
          });

          toast.success("Document parsed successfully!");
          console.log("Form populated with parsed data");

          if (data.parsing_errors?.length > 0) {
            toast(
              `Parsed with ${data.parsing_errors.length} missing fields. Please review.`,
              { icon: "⚠️" },
            );
          }
        } else {
          setUploadError(data.message || "Failed to parse document");
          toast.error(data.message || "Failed to parse document");
        }
      } catch (error) {
        console.error("Parse error:", error);
        const errorMsg =
          error.response?.data?.message || "Failed to parse document";
        setUploadError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    const handleContinue = () => {
      console.log(
        "Continue clicked, isParsed:",
        isParsed,
        "parsingData:",
        parsingData,
      );
      if (!isParsed || !parsingData) {
        toast.error("Please upload and parse a document first");
        return;
      }
      setStep(2);
      console.log("Moving to step 2");
    };

    const handleFileSelect = () => {
      document.getElementById("pdf-upload").click();
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-10 w-10 text-[#BF1A1A]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Import Program Document
          </h2>
          <p className="text-gray-600 mt-2">
            Upload an existing PD (PDF or Word) to extract content and create a
            new version
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-[#BF1A1A] transition-colors">
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            className="cursor-pointer flex flex-col items-center"
            onClick={handleFileSelect}
          >
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-[#BF1A1A]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {pdfFile ? pdfFile.name : "Upload PDF/Word Document"}
            </h3>
            <p className="text-gray-500 mt-1 mb-4">
              Drag & drop or click to upload
            </p>
            <button
              type="button"
              className="px-6 py-3 bg-[#BF1A1A] text-white rounded-lg font-medium hover:bg-[#9e1616] transition-colors"
            >
              Choose Document
            </button>
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}

          <p className="text-gray-400 text-sm mt-4">
            Supports .pdf, .doc, .docx files. All PDs must follow the standard
            structure.
          </p>
        </div>

        {loading && (
          <div className="mt-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#BF1A1A] mr-2" />
            <span className="text-gray-600">Parsing document content...</span>
          </div>
        )}

        {isParsed && parsingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6"
          >
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-800">
                  Document Successfully Parsed!
                </h4>
                <p className="text-green-700 text-sm mt-1">
                  Found {Object.keys(parsingData).length} sections with data.
                  {parsingErrors.length > 0 && (
                    <span className="block mt-1">
                      <strong>Note:</strong> {parsingErrors.length} fields
                      require manual input.
                    </span>
                  )}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700">Program</p>
                    <p className="text-lg font-semibold">
                      {formData.program_manual_name || "Not specified"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700">
                      Scheme Year
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.scheme_year}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700">
                      Courses Found
                    </p>
                    <p className="text-lg font-semibold">
                      {Object.values(formData.courses).flat().length} courses
                      across 8 semesters
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700">
                      PEOs/POs/PSOs
                    </p>
                    <p className="text-lg font-semibold">
                      {formData.peos.length} PEOs, {formData.pos.length} POs,{" "}
                      {formData.psos.length} PSOs
                    </p>
                  </div>
                </div>

                {parsingErrors.length > 0 && (
                  <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                    <h5 className="font-medium text-amber-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Fields Requiring Attention
                    </h5>
                    <ul className="mt-2 space-y-1">
                      {parsingErrors.slice(0, 5).map((error, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full mr-2"></span>
                          {error.field}: {error.reason}
                        </li>
                      ))}
                      {parsingErrors.length > 5 && (
                        <li className="text-sm text-gray-500">
                          + {parsingErrors.length - 5} more fields...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate("/creator/dashboard")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleContinue}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              isParsed
                ? "bg-[#BF1A1A] text-white hover:bg-[#9e1616]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!isParsed}
          >
            Continue to Edit
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Step 2: Edit Content
  const EditStep = () => {
    const [activeTab, setActiveTab] = useState("specifications");
    const [semester, setSemester] = useState(1);

    const tabs = [
      { id: "specifications", label: "Specifications", icon: Settings },
      { id: "overview", label: "Overview", icon: Book },
      { id: "objectives", label: "Objectives", icon: Award },
      { id: "structure", label: "Structure", icon: Hash },
      { id: "curriculum", label: "Curriculum", icon: GraduationCap },
      { id: "electives", label: "Electives", icon: ClipboardList },
      { id: "rules", label: "Rules", icon: Shield },
      { id: "support", label: "Support", icon: Users },
    ];

    const addPEO = () => {
      const newPEO = {
        peo_code: `PEO${formData.peos.length + 1}`,
        peo_description: "",
      };
      setFormData((prev) => ({
        ...prev,
        peos: [...prev.peos, newPEO],
      }));
    };

    const updatePEO = (index, field, value) => {
      const updated = [...formData.peos];
      updated[index][field] = value;
      setFormData((prev) => ({ ...prev, peos: updated }));
    };

    const removePEO = (index) => {
      const updated = formData.peos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, peos: updated }));
    };

    const addPO = () => {
      const newPO = {
        po_code: `PO${formData.pos.length + 1}`,
        po_description: "",
      };
      setFormData((prev) => ({
        ...prev,
        pos: [...prev.pos, newPO],
      }));
    };

    const updatePO = (index, field, value) => {
      const updated = [...formData.pos];
      updated[index][field] = value;
      setFormData((prev) => ({ ...prev, pos: updated }));
    };

    const removePO = (index) => {
      const updated = formData.pos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, pos: updated }));
    };

    const addPSO = () => {
      const newPSO = {
        pso_code: `PSO${formData.psos.length + 1}`,
        pso_description: "",
      };
      setFormData((prev) => ({
        ...prev,
        psos: [...prev.psos, newPSO],
      }));
    };

    const updatePSO = (index, field, value) => {
      const updated = [...formData.psos];
      updated[index][field] = value;
      setFormData((prev) => ({ ...prev, psos: updated }));
    };

    const removePSO = (index) => {
      const updated = formData.psos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, psos: updated }));
    };

    const addCourse = (sem) => {
      const newCourse = {
        course_code: "",
        course_title: "",
        credits: 3,
        l: 0,
        t: 0,
        p: 0,
        ce_marks: 0,
        see_marks: 0,
        course_type: "Theory",
      };

      setFormData((prev) => ({
        ...prev,
        courses: {
          ...prev.courses,
          [sem]: [...prev.courses[sem], newCourse],
        },
      }));
    };

    const updateCourse = (sem, index, field, value) => {
      const updated = [...formData.courses[sem]];
      updated[index][field] = value;
      setFormData((prev) => ({
        ...prev,
        courses: {
          ...prev.courses,
          [sem]: updated,
        },
      }));
    };

    const removeCourse = (sem, index) => {
      const updated = formData.courses[sem].filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        courses: {
          ...prev.courses,
          [sem]: updated,
        },
      }));
    };

    const addCreditStructure = () => {
      const newItem = {
        category_name: "",
        credits: 0,
      };
      setFormData((prev) => ({
        ...prev,
        credit_structure: [...prev.credit_structure, newItem],
      }));
    };

    const updateCreditStructure = (index, field, value) => {
      const updated = [...formData.credit_structure];
      updated[index][field] = value;
      setFormData((prev) => ({ ...prev, credit_structure: updated }));
    };

    const removeCreditStructure = (index) => {
      const updated = formData.credit_structure.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, credit_structure: updated }));
    };

    const addElective = (type) => {
      const newElective = {
        elective_type: type.toUpperCase(),
        course_code: "",
        course_title: "",
        credits: 3,
      };
      setFormData((prev) => ({
        ...prev,
        electives: [...prev.electives, newElective],
      }));
    };

    const updateElective = (index, field, value) => {
      const updated = [...formData.electives];
      updated[index][field] = value;
      setFormData((prev) => ({ ...prev, electives: updated }));
    };

    const removeElective = (index) => {
      const updated = formData.electives.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, electives: updated }));
    };

    // Calculate total credits for a semester
    const getSemesterTotal = (sem) => {
      return (
        formData.courses[sem]?.reduce(
          (sum, course) => sum + (parseFloat(course.credits) || 0),
          0,
        ) || 0
      );
    };

    // Calculate overall total credits
    const getTotalCredits = () => {
      let total = 0;
      for (let i = 1; i <= 8; i++) {
        total += getSemesterTotal(i);
      }
      return total;
    };

    return (
      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-[#BF1A1A] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-5 w-5 mr-3" />
              {tab.label}
            </button>
          ))}

          {/* Semester Tabs for Curriculum */}
          {activeTab === "curriculum" && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Semesters
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSemester(sem)}
                    className={`px-3 py-2 rounded-lg text-center text-sm ${
                      semester === sem
                        ? "bg-[#BF1A1A] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sem {sem}
                    <br />
                    <span className="text-xs">
                      {getSemesterTotal(sem)} credits
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Program Document
              </h2>
              <p className="text-gray-600">
                Edit the extracted data from the document
              </p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <strong>Program:</strong> {formData.program_manual_name}
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <strong>Scheme:</strong> {formData.scheme_year}
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  <strong>Total Credits:</strong> {getTotalCredits()}
                </div>
              </div>
            </div>

            {/* Specifications Tab */}
            {activeTab === "specifications" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Settings className="h-6 w-6 mr-2" />
                    Program Specifications
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faculty Name
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.faculty_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              faculty_name: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.school_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              school_name: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department Name
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.department_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              department_name: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Director Name
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.director_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              director_name: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Head of Department
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.hod_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              hod_name: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Award Title
                      </label>
                      <input
                        type="text"
                        value={formData.specifications.award_title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              award_title: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Institution
                    </label>
                    <textarea
                      value={formData.specifications.teaching_institution}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specifications: {
                            ...prev.specifications,
                            teaching_institution: e.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <Book className="h-6 w-6 mr-2" />
                  Program Overview
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Overview
                  </label>
                  <textarea
                    value={formData.program_overview}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        program_overview: e.target.value,
                      }))
                    }
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                    placeholder="Enter detailed program overview..."
                  />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheme Year
                    </label>
                    <input
                      type="text"
                      value={formData.scheme_year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          scheme_year: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version Number
                    </label>
                    <input
                      type="text"
                      value={formData.version_no}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          version_no: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective AY
                    </label>
                    <input
                      type="text"
                      value={formData.effective_ay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          effective_ay: e.target.value,
                        }))
                      }
                      placeholder="e.g., 2024-25"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Objectives Tab */}
            {activeTab === "objectives" && (
              <div className="space-y-8">
                {/* PEOs Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <Award className="h-6 w-6 mr-2" />
                        Program Educational Objectives (PEOs)
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Define what graduates are expected to achieve 3-5 years
                        after graduation
                      </p>
                    </div>
                    <button
                      onClick={addPEO}
                      className="px-4 py-2 bg-[#BF1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#9e1616] flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add PEO
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.peos.map((peo, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-[#BF1A1A] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-[#BF1A1A] text-white text-sm font-medium rounded-full">
                              {peo.peo_code}
                            </span>
                            <span className="ml-3 text-sm text-gray-500">
                              Objective #{index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removePEO(index)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <textarea
                          value={peo.peo_description}
                          onChange={(e) =>
                            updatePEO(index, "peo_description", e.target.value)
                          }
                          placeholder="Enter PEO description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    ))}
                    {formData.peos.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No PEOs added yet</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">
                          Add 3-5 PEOs that describe what graduates should
                          achieve
                        </p>
                        <button
                          onClick={addPEO}
                          className="mt-3 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add First PEO
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* POs Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Program Outcomes (POs)
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Graduate attributes as per NBA/ABET guidelines
                      </p>
                    </div>
                    <button
                      onClick={addPO}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add PO
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.pos.map((po, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                              {po.po_code}
                            </span>
                            <span className="ml-3 text-sm text-gray-500">
                              PO #{index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removePO(index)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <textarea
                          value={po.po_description}
                          onChange={(e) =>
                            updatePO(index, "po_description", e.target.value)
                          }
                          placeholder="Enter PO description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    ))}
                    {formData.pos.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No POs added yet</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">
                          Add 10-12 POs as per accreditation requirements
                        </p>
                        <button
                          onClick={addPO}
                          className="mt-3 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add First PO
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PSOs Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Program Specific Outcomes (PSOs)
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Specific outcomes for this program
                      </p>
                    </div>
                    <button
                      onClick={addPSO}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add PSO
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.psos.map((pso, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                              {pso.pso_code}
                            </span>
                            <span className="ml-3 text-sm text-gray-500">
                              PSO #{index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removePSO(index)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <textarea
                          value={pso.pso_description}
                          onChange={(e) =>
                            updatePSO(index, "pso_description", e.target.value)
                          }
                          placeholder="Enter PSO description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    ))}
                    {formData.psos.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No PSOs added yet</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">
                          Add 2-3 program-specific outcomes
                        </p>
                        <button
                          onClick={addPSO}
                          className="mt-3 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add First PSO
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Structure Tab */}
            {activeTab === "structure" && (
              <div className="space-y-8">
                {/* Credit Structure */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <Hash className="h-6 w-6 mr-2" />
                        Credit Structure
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Define the credit distribution across categories
                      </p>
                    </div>
                    <button
                      onClick={addCreditStructure}
                      className="px-4 py-2 bg-[#BF1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#9e1616] flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Sl. No
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Category Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Credits
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.credit_structure.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-600">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={
                                  item.category_name || item.category || ""
                                }
                                onChange={(e) =>
                                  updateCreditStructure(
                                    index,
                                    "category_name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.credits || 0}
                                onChange={(e) =>
                                  updateCreditStructure(
                                    index,
                                    "credits",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeCreditStructure(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-4 py-3" colSpan="2">
                            Total Credits
                          </td>
                          <td className="px-4 py-3">
                            {formData.credit_structure.reduce(
                              (sum, item) =>
                                sum + (parseInt(item.credits) || 0),
                              0,
                            )}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Credits
                      </label>
                      <input
                        type="number"
                        value={formData.total_credits}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            total_credits: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Credits
                      </label>
                      <input
                        type="number"
                        value={formData.academic_credits}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            academic_credits: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Credit Definitions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Credit Definitions
                  </h3>
                  <div className="space-y-4">
                    {formData.credit_definitions.map((def, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <input
                          type="text"
                          value={def.component || ""}
                          onChange={(e) => {
                            const updated = [...formData.credit_definitions];
                            updated[index].component = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              credit_definitions: updated,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., 1 Hr. Lecture (L) per week"
                        />
                        <span className="text-gray-600">=</span>
                        <input
                          type="text"
                          value={def.credits || ""}
                          onChange={(e) => {
                            const updated = [...formData.credit_definitions];
                            updated[index].credits = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              credit_definitions: updated,
                            }));
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Credits"
                        />
                        <button
                          onClick={() => {
                            const updated = formData.credit_definitions.filter(
                              (_, i) => i !== index,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              credit_definitions: updated,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        credit_definitions: [
                          ...prev.credit_definitions,
                          { component: "", credits: "" },
                        ],
                      }));
                    }}
                    className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    + Add Definition
                  </button>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === "curriculum" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <GraduationCap className="h-6 w-6 mr-2" />
                      Semester {semester} Curriculum
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Total Credits: {getSemesterTotal(semester)} | Total
                      Courses: {formData.courses[semester]?.length || 0}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        // Add multiple courses at once
                        const coursesToAdd = [
                          {
                            course_code: "UE24CSXXXX",
                            course_title: "New Course",
                            credits: 3,
                          },
                          {
                            course_code: "UE24CSXXXX",
                            course_title: "New Course",
                            credits: 3,
                          },
                        ];
                        setFormData((prev) => ({
                          ...prev,
                          courses: {
                            ...prev.courses,
                            [semester]: [
                              ...prev.courses[semester],
                              ...coursesToAdd,
                            ],
                          },
                        }));
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Add Multiple
                    </button>
                    <button
                      onClick={() => addCourse(semester)}
                      className="px-4 py-2 bg-[#BF1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#9e1616] flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">
                          Sl. No
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
                          Course Code
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Course Title
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                          Credits
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.courses[semester]?.map((course, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={course.course_code}
                              onChange={(e) =>
                                updateCourse(
                                  semester,
                                  index,
                                  "course_code",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                              placeholder="UE24CSXXXX"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={course.course_title}
                              onChange={(e) =>
                                updateCourse(
                                  semester,
                                  index,
                                  "course_title",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={course.credits}
                              onChange={(e) =>
                                updateCourse(
                                  semester,
                                  index,
                                  "credits",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                              step="0.5"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={course.course_type || "Theory"}
                              onChange={(e) =>
                                updateCourse(
                                  semester,
                                  index,
                                  "course_type",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#BF1A1A] focus:border-transparent"
                            >
                              <option value="Theory">Theory</option>
                              <option value="Practical">Practical</option>
                              <option value="Project">Project</option>
                              <option value="Lab">Lab</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeCourse(semester, index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!formData.courses[semester] ||
                        formData.courses[semester].length === 0) && (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p>No courses added for this semester</p>
                            <button
                              onClick={() => addCourse(semester)}
                              className="mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              Add First Course
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 font-bold" colSpan="3">
                          Total Credits for Semester {semester}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {getSemesterTotal(semester)}
                        </td>
                        <td className="px-4 py-3" colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p>
                    💡 Tip: Course codes should follow the pattern: UE24CSXXXX
                    (e.g., UE24CS1101)
                  </p>
                </div>
              </div>
            )}

            {/* Electives Tab */}
            {activeTab === "electives" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <ClipboardList className="h-6 w-6 mr-2" />
                        Professional Electives
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Specialization courses offered in 5th and 6th semesters
                      </p>
                    </div>
                    <button
                      onClick={() => addElective("professional")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Elective
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left">Course Code</th>
                          <th className="px-4 py-3 text-left">Course Title</th>
                          <th className="px-4 py-3 text-left">Credits</th>
                          <th className="px-4 py-3 text-left">Semester</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.electives
                          .filter((e) => e.elective_type === "PROFESSIONAL")
                          .map((elective, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={elective.course_code}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "course_code",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={elective.course_title}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "course_title",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={elective.credits}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "credits",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-20 px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={elective.semester || 5}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "semester",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  <option value={5}>5th Semester</option>
                                  <option value={6}>6th Semester</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() =>
                                    removeElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Open Electives
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Cross-disciplinary courses offered in 7th and 8th
                        semesters
                      </p>
                    </div>
                    <button
                      onClick={() => addElective("open")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Elective
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left">Course Code</th>
                          <th className="px-4 py-3 text-left">Course Title</th>
                          <th className="px-4 py-3 text-left">Credits</th>
                          <th className="px-4 py-3 text-left">Semester</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.electives
                          .filter((e) => e.elective_type === "OPEN")
                          .map((elective, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={elective.course_code}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "course_code",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={elective.course_title}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "course_title",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={elective.credits}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "credits",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-20 px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={elective.semester || 7}
                                  onChange={(e) =>
                                    updateElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                      "semester",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  <option value={7}>7th Semester</option>
                                  <option value={8}>8th Semester</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() =>
                                    removeElective(
                                      formData.electives.findIndex(
                                        (el) => el === elective,
                                      ),
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === "rules" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Shield className="h-6 w-6 mr-2" />
                    Program Rules & Regulations
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attendance Rules
                      </label>
                      <div className="mb-3">
                        <label className="text-sm text-gray-600">
                          Minimum Attendance Percentage
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="60"
                            max="90"
                            step="5"
                            value={
                              formData.attendance_rules[0]
                                ?.minimum_percentage || 75
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                attendance_rules: [
                                  {
                                    ...prev.attendance_rules[0],
                                    minimum_percentage: parseInt(
                                      e.target.value,
                                    ),
                                    rule_description:
                                      prev.attendance_rules[0]
                                        ?.rule_description || "",
                                  },
                                ],
                              }))
                            }
                            className="w-48"
                          />
                          <span className="text-lg font-bold">
                            {formData.attendance_rules[0]?.minimum_percentage ||
                              75}
                            %
                          </span>
                        </div>
                      </div>
                      <textarea
                        value={
                          formData.attendance_rules[0]?.rule_description || ""
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            attendance_rules: [
                              {
                                ...prev.attendance_rules[0],
                                rule_description: e.target.value,
                                minimum_percentage:
                                  prev.attendance_rules[0]
                                    ?.minimum_percentage || 75,
                              },
                            ],
                          }))
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                        placeholder="Enter detailed attendance rules and consequences..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree Award Criteria
                      </label>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-sm text-gray-600">
                            Minimum Credits
                          </label>
                          <input
                            type="number"
                            value={
                              formData.degree_criteria.find(
                                (c) => c.criteria_type === "DEGREE",
                              )?.minimum_credits || 160
                            }
                            onChange={(e) => {
                              const updated = [...formData.degree_criteria];
                              const degreeIndex = updated.findIndex(
                                (c) => c.criteria_type === "DEGREE",
                              );
                              if (degreeIndex >= 0) {
                                updated[degreeIndex].minimum_credits =
                                  parseInt(e.target.value) || 0;
                              } else {
                                updated.push({
                                  criteria_type: "DEGREE",
                                  minimum_credits:
                                    parseInt(e.target.value) || 0,
                                  minimum_cgpa: 5.0,
                                  criteria_description: "",
                                });
                              }
                              setFormData((prev) => ({
                                ...prev,
                                degree_criteria: updated,
                              }));
                            }}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">
                            Minimum CGPA
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={
                              formData.degree_criteria.find(
                                (c) => c.criteria_type === "DEGREE",
                              )?.minimum_cgpa || 5.0
                            }
                            onChange={(e) => {
                              const updated = [...formData.degree_criteria];
                              const degreeIndex = updated.findIndex(
                                (c) => c.criteria_type === "DEGREE",
                              );
                              if (degreeIndex >= 0) {
                                updated[degreeIndex].minimum_cgpa =
                                  parseFloat(e.target.value) || 0;
                              } else {
                                updated.push({
                                  criteria_type: "DEGREE",
                                  minimum_credits: 160,
                                  minimum_cgpa: parseFloat(e.target.value) || 0,
                                  criteria_description: "",
                                });
                              }
                              setFormData((prev) => ({
                                ...prev,
                                degree_criteria: updated,
                              }));
                            }}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                      <textarea
                        value={
                          formData.degree_criteria.find(
                            (c) => c.criteria_type === "DEGREE",
                          )?.criteria_description || ""
                        }
                        onChange={(e) => {
                          const updated = [...formData.degree_criteria];
                          const degreeIndex = updated.findIndex(
                            (c) => c.criteria_type === "DEGREE",
                          );
                          if (degreeIndex >= 0) {
                            updated[degreeIndex].criteria_description =
                              e.target.value;
                          } else {
                            updated.push({
                              criteria_type: "DEGREE",
                              minimum_credits: 160,
                              minimum_cgpa: 5.0,
                              criteria_description: e.target.value,
                            });
                          }
                          setFormData((prev) => ({
                            ...prev,
                            degree_criteria: updated,
                          }));
                        }}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                        placeholder="Enter detailed degree award criteria..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gold Medal Criteria
                      </label>
                      <div className="mb-3">
                        <label className="text-sm text-gray-600">
                          Minimum OGPA/CGPA for Gold Medal
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={
                            formData.degree_criteria.find(
                              (c) => c.criteria_type === "GOLD_MEDAL",
                            )?.minimum_cgpa || 8.5
                          }
                          onChange={(e) => {
                            const updated = [...formData.degree_criteria];
                            const goldIndex = updated.findIndex(
                              (c) => c.criteria_type === "GOLD_MEDAL",
                            );
                            if (goldIndex >= 0) {
                              updated[goldIndex].minimum_cgpa =
                                parseFloat(e.target.value) || 0;
                            } else {
                              updated.push({
                                criteria_type: "GOLD_MEDAL",
                                minimum_cgpa: parseFloat(e.target.value) || 0,
                                criteria_description: "",
                              });
                            }
                            setFormData((prev) => ({
                              ...prev,
                              degree_criteria: updated,
                            }));
                          }}
                          className="w-32 px-3 py-2 border rounded"
                        />
                      </div>
                      <textarea
                        value={
                          formData.degree_criteria.find(
                            (c) => c.criteria_type === "GOLD_MEDAL",
                          )?.criteria_description || ""
                        }
                        onChange={(e) => {
                          const updated = [...formData.degree_criteria];
                          const goldIndex = updated.findIndex(
                            (c) => c.criteria_type === "GOLD_MEDAL",
                          );
                          if (goldIndex >= 0) {
                            updated[goldIndex].criteria_description =
                              e.target.value;
                          } else {
                            updated.push({
                              criteria_type: "GOLD_MEDAL",
                              minimum_cgpa: 8.5,
                              criteria_description: e.target.value,
                            });
                          }
                          setFormData((prev) => ({
                            ...prev,
                            degree_criteria: updated,
                          }));
                        }}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent"
                        placeholder="Enter gold medal award criteria..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === "support" && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <Users className="h-6 w-6 mr-2" />
                    Teaching Methods & Student Support
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Teaching Methods
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          "Lectures",
                          "Tutorials",
                          "Practicals",
                          "Seminar",
                          "Project Work",
                          "Internship",
                          "Case Studies",
                          "Online Learning",
                        ].map((method) => (
                          <label
                            key={method}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={formData.teaching_methods.includes(
                                method,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    teaching_methods: [
                                      ...prev.teaching_methods,
                                      method,
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    teaching_methods:
                                      prev.teaching_methods.filter(
                                        (m) => m !== method,
                                      ),
                                  }));
                                }
                              }}
                              className="rounded text-[#BF1A1A] focus:ring-[#BF1A1A]"
                            />
                            <span className="text-sm text-gray-700">
                              {method}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Student Support Services
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          "Academic Mentoring",
                          "Career Guidance",
                          "Library Resources",
                          "Online Portal",
                          "Counselling",
                          "Placement Support",
                          "Research Guidance",
                          "Technical Support",
                        ].map((support) => (
                          <label
                            key={support}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={formData.student_support.includes(
                                support,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    student_support: [
                                      ...prev.student_support,
                                      support,
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    student_support:
                                      prev.student_support.filter(
                                        (s) => s !== support,
                                      ),
                                  }));
                                }
                              }}
                              className="rounded text-[#BF1A1A] focus:ring-[#BF1A1A]"
                            />
                            <span className="text-sm text-gray-700">
                              {support}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Quality Assurance Measures
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          "Student Feedback",
                          "Peer Review",
                          "External Audit",
                          "Academic Audit",
                          "Industry Feedback",
                          "Alumni Feedback",
                          "Curriculum Review",
                          "Accreditation",
                        ].map((measure) => (
                          <label
                            key={measure}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={formData.quality_measures.includes(
                                measure,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    quality_measures: [
                                      ...prev.quality_measures,
                                      measure,
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    quality_measures:
                                      prev.quality_measures.filter(
                                        (m) => m !== measure,
                                      ),
                                  }));
                                }
                              }}
                              className="rounded text-[#BF1A1A] focus:ring-[#BF1A1A]"
                            />
                            <span className="text-sm text-gray-700">
                              {measure}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back to Import
                </button>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </div>
                    ) : (
                      "Save Draft"
                    )}
                  </button>

                  <button
                    onClick={handleGenerateWordDoc}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileDown className="mr-2 h-5 w-5" />
                    Generate Word Doc
                  </button>

                  <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Preview & Finalize
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Preview
  const PreviewStep = () => {
    const generatePreview = async () => {
      setLoading(true);
      try {
        const { data } = await axios.post("/api/creater/preview", formData);
        if (data.success) {
          setPreviewHtml(data.previewHtml);
          setDownloadUrl(data.downloadUrl);
        }
      } catch (error) {
        console.error("Preview error:", error);
        toast.error(
          error.response?.data?.message || "Failed to generate preview",
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      generatePreview();
    }, []);

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Preview Program Document
          </h2>
          <p className="text-gray-600 mt-2">
            Review the final document before saving
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <strong>Program:</strong> {formData.program_manual_name}
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <strong>Scheme:</strong> {formData.scheme_year}
            </div>
            <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              <strong>Version:</strong> {formData.version_no}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-[#BF1A1A] mr-3" />
              <span className="text-gray-600">Generating preview...</span>
            </div>
          ) : previewHtml ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Document Preview
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const printWindow = window.open("", "_blank");
                      printWindow.document.write(previewHtml);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Print Preview
                  </button>
                  <button
                    onClick={handleGenerateWordDoc}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Word Doc
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[800px] border-0"
                  title="Document Preview"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">
                  Document Summary
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Courses</p>
                    <p className="font-semibold">
                      {Object.values(formData.courses).flat().length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Credits</p>
                    <p className="font-semibold">
                      {Object.values(formData.courses)
                        .flat()
                        .reduce(
                          (sum, course) =>
                            sum + (parseFloat(course.credits) || 0),
                          0,
                        )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">PEOs/POs/PSOs</p>
                    <p className="font-semibold">
                      {formData.peos.length}/{formData.pos.length}/
                      {formData.psos.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Electives</p>
                    <p className="font-semibold">
                      Professional:{" "}
                      {
                        formData.electives.filter(
                          (e) => e.elective_type === "PROFESSIONAL",
                        ).length
                      }{" "}
                      | Open:{" "}
                      {
                        formData.electives.filter(
                          (e) => e.elective_type === "OPEN",
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Preview not available</p>
              <button
                onClick={generatePreview}
                className="mt-4 px-4 py-2 bg-[#BF1A1A] text-white rounded-lg hover:bg-[#9e1616]"
              >
                Generate Preview
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back to Edit
          </button>

          <div className="flex space-x-4">
            <button
              onClick={handleGenerateWordDoc}
              disabled={loading}
              className="px-6 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Download Word
            </button>

            <button
              onClick={handleSaveFinal}
              disabled={loading}
              className="px-6 py-3 bg-[#BF1A1A] text-white rounded-lg font-medium hover:bg-[#9e1616] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save & Publish for Approval
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render current step
  const renderStep = () => {
    console.log("Current step:", step);
    switch (step) {
      case 1:
        return <ImportStep />;
      case 2:
        return <EditStep />;
      case 3:
        return <PreviewStep />;
      default:
        return <ImportStep />;
    }
  };

  return (
    <CreatorLayout>
      <div className="p-8">
        {/* Step Progress Bar */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10"></div>

            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className="flex flex-col items-center relative"
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                    step >= stepNumber
                      ? "bg-[#BF1A1A] border-[#BF1A1A] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {stepNumber}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    step >= stepNumber ? "text-[#BF1A1A]" : "text-gray-400"
                  }`}
                >
                  {stepNumber === 1 && "Import"}
                  {stepNumber === 2 && "Edit"}
                  {stepNumber === 3 && "Preview"}
                </span>
                {step > stepNumber && (
                  <div className="absolute left-1/2 top-4 w-full h-1 bg-[#BF1A1A] -z-5"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </CreatorLayout>
  );
};

export default EditPD;
