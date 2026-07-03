import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Layers,
  Search,
  FileWarning,
  Download,
  FileText,
  Loader2,
  BarChart3,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const STATUS_CONFIG = {
  Approved: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Pending: {
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400 animate-pulse",
  },
  Missing: { badge: "bg-red-50 text-red-500", dot: "bg-red-300" },
};

const ProgressBar = ({ pct }) => (
  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"}`}
      style={{ width: `${pct}%` }}
    />
  </div>
);

const CurriculumCompiler = () => {
  const { axios, adminToken } = useAppContext();

  const [programs, setPrograms] = useState([]);
  const [selectedPd, setSelectedPd] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [checking, setChecking] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [searchTerm, setSearch] = useState("");

  // Dynamic Title Configuration
  const [curriculumConfig, setCurriculumConfig] = useState({
    title: "Bachelor of Technology",
    subtitle: "Computer Science and Engineering",
    scheme: "2026 Scheme",
  });

  const fetchApprovedPrograms = async () => {
    setLoadingList(true);
    try {
      const { data } = await axios.get("/api/admin/approved/pds", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) setPrograms(data.pds);
    } catch (err) {
      toast.error("Failed to load approved programs");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (adminToken) fetchApprovedPrograms();
  }, [adminToken]);

  const checkReadiness = async (pd) => {
    setSelectedPd(pd);
    setReadiness(null);
    setChecking(true);
    try {
      const { data } = await axios.get(
        `/api/admin/compiler/readiness/${pd._id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      if (data.success) {
        setReadiness(data.analysis);
        // Pre-fill config if program data exists
        setCurriculumConfig((prev) => ({
          ...prev,
          subtitle: data.analysis.programName || prev.subtitle,
          scheme: `${pd.scheme_year} Scheme` || prev.scheme,
        }));
      }
    } catch (err) {
      toast.error("Error analyzing curriculum");
    } finally {
      setChecking(false);
    }
  };

  // ── BACKEND COMPILE & DOWNLOAD WORKFLOW ──
  const handleCompileAndDownload = async () => {
    if (pct < 100) return toast.error("Curriculum is not 100% complete!");

    setCompiling(true);
    const toastId = toast.loading("Assembling publication-quality PDF...");

    try {
      const response = await axios.post(
        `/api/admin/compiler/generate-pdf/${selectedPd._id}`,
        { config: curriculumConfig },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            Accept: "application/pdf",
          },
          responseType: "blob", // Important for receiving binary data
        },
      );

      // Create a blob link to trigger download
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${selectedPd.program_id}_Curriculum_Book.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Curriculum Book Downloaded!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile curriculum book.", { id: toastId });
    } finally {
      setCompiling(false);
    }
  };

  const filtered = programs.filter(
    (pd) =>
      pd.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.program_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pct = readiness?.completionPercentage || 0;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl pb-10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Layers size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">
              Curriculum Compiler
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Assemble approved course documents into a publication-ready PDF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Program Selector (Unchanged logic, condensed for brevity) */}
          <div className="space-y-3">
            {/* ... Search and List Rendering (Keep existing code from your file here) ... */}
          </div>

          {/* RIGHT: Analysis & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration Panel */}
            {selectedPd && readiness && !checking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={18} className="text-stone-400" />
                  <h3 className="font-bold text-stone-700">
                    Document Configuration
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Degree Title
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.title}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          title: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.subtitle}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          subtitle: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Scheme / Year
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.scheme}
                      onChange={(e) =>
                        setCurriculumConfig({
                          ...curriculumConfig,
                          scheme: e.target.value,
                        })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Readiness Report (Keep existing code, just update the compile button) */}
            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* ... Header and Grid ... */}

                {/* Compile Bar */}
                <div className="p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                  <button
                    onClick={handleCompileAndDownload}
                    disabled={pct < 100 || compiling}
                    className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all text-sm ${
                      pct === 100
                        ? "bg-amber-800 text-white hover:bg-amber-900 shadow-xl"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    {compiling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {compiling
                      ? "Processing PDF..."
                      : pct === 100
                        ? "Compile & Download Book"
                        : "Incomplete Curriculum"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CurriculumCompiler;
