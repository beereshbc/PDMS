import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import CompilerPrintView from "../components/CompilerPrintView";

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

  // Ref and state for printing
  const printRef = useRef(null);
  const [compiledBookData, setCompiledBookData] = useState(null);

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
    setCompiledBookData(null); // Reset print data when changing programs
    try {
      const { data } = await axios.get(
        `/api/admin/compiler/readiness/${pd._id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      if (data.success) {
        setReadiness(data.analysis);
      }
    } catch (err) {
      toast.error("Error analyzing curriculum");
    } finally {
      setChecking(false);
    }
  };

  // ── COMPILE & PRINT WORKFLOW ──
  const handleCompileAndPrint = async () => {
    if (pct < 100) return toast.error("Curriculum is not 100% complete!");

    setCompiling(true);
    const toastId = toast.loading("Compiling the Curriculum Book...");
    try {
      const { data } = await axios.get(
        `/api/admin/compiler/compile/${selectedPd._id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      if (data.success) {
        setCompiledBookData(data.compiledBook);
        toast.success("Compiled Successfully! Preparing PDF...", {
          id: toastId,
        });

        // Wait briefly for React to render the hidden print component
        setTimeout(() => {
          window.print();
          setCompiling(false);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile curriculum book.", { id: toastId });
      setCompiling(false);
    }
  };

  const filtered = programs.filter(
    (pd) =>
      pd.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.program_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pct = readiness?.completionPercentage || 0;
  const allCourses = readiness?.semesters?.flatMap((s) => s.courses) || [];
  const countByStatus = (st) =>
    allCourses.filter((c) => c.status === st).length;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl pb-10">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Layers size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">
              Curriculum Compiler
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Assemble approved course documents into a final Program Book PDF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT: Program selector ──────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Approved Programs
              </h2>
              {!loadingList && programs.length > 0 && (
                <span className="text-[11px] bg-green-50 border border-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                  {programs.length} ready
                </span>
              )}
            </div>

            {programs.length > 3 && (
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  placeholder="Search program…"
                  value={searchTerm}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            )}

            {loadingList ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-white border border-stone-100 rounded-2xl"
                />
              ))
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-8 text-center">
                <FileWarning
                  className="mx-auto text-stone-300 mb-2"
                  size={30}
                />
                <p className="text-xs text-stone-400 font-medium">
                  {searchTerm ? "No matches" : "No approved programs yet."}
                </p>
              </div>
            ) : (
              filtered.map((pd) => {
                const sel = selectedPd?._id === pd._id;
                return (
                  <button
                    key={pd._id}
                    onClick={() => checkReadiness(pd)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
                      sel
                        ? "bg-amber-800 border-amber-900 text-white shadow-lg"
                        : "bg-white border-stone-200 text-stone-700 hover:border-amber-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {pd.program_name || pd.program_id}
                        </p>
                        <p
                          className={`text-[11px] font-semibold tracking-tight mt-0.5 ${sel ? "text-amber-200" : "text-stone-400"}`}
                        >
                          {pd.program_id} · v{pd.version_no} · {pd.scheme_year}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`flex-shrink-0 ml-2 ${sel ? "text-amber-300 rotate-90" : "text-stone-300"}`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ── RIGHT: Analysis panel ────────────────────────────────── */}
          <div className="lg:col-span-2">
            {!selectedPd && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem] p-12 text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-5">
                  <Search size={36} />
                </div>
                <h3 className="text-lg font-bold text-stone-400">
                  Select a Program to Analyze
                </h3>
                <p className="text-stone-400 text-sm max-w-xs mt-2 leading-relaxed">
                  We will check if every course defined in the program has a
                  fully approved Course Document ready for printing.
                </p>
              </div>
            )}

            {selectedPd && checking && (
              <div className="h-full min-h-[420px] flex items-center justify-center bg-white rounded-[2.5rem] border border-stone-200 p-12 shadow-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-100 border-t-amber-700 animate-spin" />
                    <Layers
                      size={22}
                      className="absolute inset-0 m-auto text-amber-700"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-stone-700 font-bold">
                      Mapping Course Dependencies…
                    </p>
                    <p className="text-stone-400 text-xs mt-1">
                      Checking all courses against the CD database
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden animate-in fade-in duration-400 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
                {/* Fixed Top Status Header */}
                <div className="p-7 border-b border-stone-100 bg-stone-50/50 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={15} className="text-amber-700" />
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                          Readiness Report
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-stone-900">
                        {readiness.programName || readiness.programCode}
                      </h3>
                      <p className="text-stone-400 text-sm font-medium mt-0.5">
                        {readiness.programCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-4xl font-black tabular-nums tracking-tighter ${pct === 100 ? "text-green-600" : pct >= 60 ? "text-amber-700" : "text-red-500"}`}
                      >
                        {pct}%
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Ready
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ProgressBar pct={pct} />
                    <div className="flex justify-between text-[11px] text-stone-400 font-medium mt-1.5">
                      <span className="text-green-600 font-bold">
                        {readiness.totalApproved} approved
                      </span>
                      <span>
                        {readiness.totalRequired} total courses required
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Course Grid */}
                <div className="p-7 space-y-7 overflow-y-auto flex-1 bg-stone-50/30">
                  {readiness.semesters?.map((sem) => (
                    <div key={sem.number}>
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-black text-stone-800 uppercase tracking-wide">
                          Semester {sem.number}
                        </h4>
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                          {sem.courses?.length} courses
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {sem.courses?.map((course) => {
                          const S =
                            STATUS_CONFIG[course.status] ||
                            STATUS_CONFIG.Missing;
                          return (
                            <div
                              key={course.code}
                              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${S.dot}`}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-800 truncate group-hover:text-amber-900">
                                    {course.code}
                                  </p>
                                  <p className="text-[10px] text-stone-500 truncate w-32">
                                    {course.title}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/50 ${S.badge}`}
                                >
                                  {course.status}
                                </span>
                                {course.version && (
                                  <span className="text-[9px] font-bold text-stone-400 font-mono">
                                    v{course.version}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fixed Bottom Compile Bar */}
                <div className="p-5 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2.5 text-stone-600 text-sm bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                    <FileText size={16} className="text-amber-600" />
                    Book contains <strong>1 PD</strong> and{" "}
                    <strong>{readiness.totalApproved} CDs</strong>.
                  </div>

                  <button
                    onClick={handleCompileAndPrint}
                    disabled={pct < 100 || compiling}
                    className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all text-sm w-full sm:w-auto ${
                      pct === 100
                        ? "bg-amber-800 text-white hover:bg-amber-900 shadow-xl shadow-amber-900/20 active:scale-95"
                        : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                    }`}
                  >
                    {compiling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {compiling
                      ? "Compiling..."
                      : pct === 100
                        ? "Compile & Download PDF"
                        : `${readiness.totalRequired - readiness.totalApproved} Courses Missing`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Component */}
      {compiledBookData && (
        <CompilerPrintView ref={printRef} bookData={compiledBookData} />
      )}
    </AdminLayout>
  );
};

export default CurriculumCompiler;
