import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  FileText,
  Download,
  Loader2,
  Clock,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const STATUS_CONFIG = {
  Approved: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Pending: {
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400 animate-pulse",
  },
  Missing: { badge: "bg-red-50   text-red-500", dot: "bg-red-300" },
};

const ProgressBar = ({ pct }) => (
  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${
        pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
      }`}
      style={{ width: `${pct}%` }}
    />
  </div>
);

const CurriculumCompiler = () => {
  const { axios } = useAppContext();

  const [programs, setPrograms] = useState([]);
  const [selectedPd, setSelectedPd] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [checking, setChecking] = useState(false);
  const [searchTerm, setSearch] = useState("");

  // FIXED: was /api/admin/reviews/pds (returns UnderReview only).
  // Now uses dedicated /api/admin/approved/pds endpoint.
  const fetchApprovedPrograms = async () => {
    setLoadingList(true);
    try {
      const { data } = await axios.get("/api/admin/approved/pds");
      if (data.success) {
        setPrograms(data.pds);
      } else {
        toast.error(data.message || "Failed to load approved programs");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load approved programs",
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchApprovedPrograms();
  }, []);

  const checkReadiness = async (pd) => {
    setSelectedPd(pd);
    setReadiness(null);
    setChecking(true);
    try {
      const { data } = await axios.get(
        `/api/admin/compiler/readiness/${pd._id}`,
      );
      if (data.success) {
        setReadiness(data.analysis);
      } else {
        toast.error(data.message || "Readiness check failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error analyzing curriculum");
    } finally {
      setChecking(false);
    }
  };

  const filtered = programs.filter(
    (pd) =>
      pd.programName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.programCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pct = readiness?.completionPercentage || 0;

  // Flatten all courses from semesters
  const allCourses = readiness?.semesters?.flatMap((s) => s.courses) || [];
  const countByStatus = (st) =>
    allCourses.filter((c) => c.status === st).length;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl">
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Layers size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">
              Curriculum Compiler
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Assemble approved course documents into a final Program Book.
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
                  placeholder="Search…"
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
                  className="animate-pulse h-16 bg-stone-100 rounded-2xl"
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
                          {pd.programName || pd.programCode}
                        </p>
                        <p
                          className={`text-[11px] font-semibold tracking-tight mt-0.5 ${sel ? "text-amber-200" : "text-stone-400"}`}
                        >
                          {pd.programCode} · v{pd.pdVersion} · {pd.schemeYear}
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
            {/* Empty state */}
            {!selectedPd && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem] p-12 text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-5">
                  <Search size={36} />
                </div>
                <h3 className="text-lg font-bold text-stone-400">
                  Select a Program to Analyze
                </h3>
                <p className="text-stone-400 text-sm max-w-xs mt-2 leading-relaxed">
                  We will check if every course defined in the program has an
                  approved Course Document.
                </p>
              </div>
            )}

            {/* Loading */}
            {selectedPd && checking && (
              <div className="h-full min-h-[420px] flex items-center justify-center bg-white rounded-[2.5rem] border border-stone-200 p-12">
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

            {/* Results */}
            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden animate-in fade-in duration-400">
                {/* Report header */}
                <div className="p-7 border-b border-stone-100 bg-stone-50/50">
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
                      <p className="text-stone-400 text-sm">
                        {readiness.programCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-4xl font-black tabular-nums ${pct === 100 ? "text-green-600" : pct >= 60 ? "text-amber-700" : "text-red-500"}`}
                      >
                        {pct}%
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Complete
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {readiness.totalApproved}/{readiness.totalRequired}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ProgressBar pct={pct} />
                    <div className="flex justify-between text-[11px] text-stone-400 font-medium mt-1.5">
                      <span>{readiness.totalApproved} approved</span>
                      <span>
                        {readiness.totalRequired - readiness.totalApproved}{" "}
                        remaining
                      </span>
                    </div>
                  </div>

                  {/* Status chips */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      {
                        label: "Approved",
                        count: countByStatus("Approved"),
                        cls: "bg-green-50 text-green-700 border border-green-100",
                      },
                      {
                        label: "Pending",
                        count: countByStatus("Pending"),
                        cls: "bg-amber-50 text-amber-700 border border-amber-100",
                      },
                      {
                        label: "Missing",
                        count: countByStatus("Missing"),
                        cls: "bg-red-50 text-red-500 border border-red-100",
                      },
                    ]
                      .filter(({ count }) => count > 0)
                      .map(({ label, count, cls }) => (
                        <span
                          key={label}
                          className={`text-xs font-bold px-3 py-1 rounded-full ${cls}`}
                        >
                          {count} {label}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Semester course grid */}
                <div className="p-7 space-y-7 max-h-[440px] overflow-y-auto">
                  {readiness.semesters?.map((sem) => (
                    <div key={sem.number}>
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-black text-stone-800 uppercase tracking-wide">
                          Semester {sem.number}
                        </h4>
                        <div className="flex-1 h-px bg-stone-100" />
                        <span className="text-xs text-stone-400">
                          {sem.courses?.length} courses
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sem.courses?.map((course) => {
                          const S =
                            STATUS_CONFIG[course.status] ||
                            STATUS_CONFIG.Missing;
                          return (
                            <div
                              key={course.code}
                              className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/40 hover:border-amber-200 hover:bg-amber-50/20 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${S.dot}`}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors">
                                    {course.title}
                                  </p>
                                  <p className="text-[10px] text-stone-400 font-mono">
                                    {course.code}
                                  </p>
                                  {course.version && (
                                    <p className="text-[10px] text-green-600 font-semibold">
                                      v{course.version}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase flex-shrink-0 ml-2 ${S.badge}`}
                              >
                                {course.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compile footer */}
                <div className="p-7 bg-stone-50/60 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-stone-500 text-xs italic">
                    <FileText size={14} />
                    Final book will include{" "}
                    <strong className="not-italic">
                      {readiness.totalApproved}
                    </strong>{" "}
                    Course Document{readiness.totalApproved !== 1 ? "s" : ""}
                  </div>

                  <button
                    disabled={pct < 100}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all text-sm ${
                      pct === 100
                        ? "bg-amber-800 text-white hover:bg-amber-900 shadow-lg shadow-amber-900/20 active:scale-95"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    {pct === 100
                      ? "Compile Final Book"
                      : `${100 - pct}% more needed`}
                    <Download size={16} />
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
