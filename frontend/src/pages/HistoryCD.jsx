import React, { useState, useEffect, useCallback, useMemo } from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Search,
  Calendar,
  Clock,
  Eye,
  Layers,
  Edit,
  Plus,
  Loader2,
  BookOpen,
  RefreshCw,
  X,
  Filter,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  History,
  Hash,
  MessageSquare,
  BookMarked,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PreviewCD from "../components/PreviewCD";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "underreview":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-stone-100 text-stone-600 border-stone-200"; // draft
  }
};

const getStatusLabel = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "Approved";
    case "underreview":
      return "In Review";
    case "rejected":
      return "Returned";
    default:
      return "Draft";
  }
};

const STATUS_OPTIONS = ["All", "Draft", "UnderReview", "Approved"];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const HistoryCD = () => {
  const { axios, createrToken } = useAppContext();
  const navigate = useNavigate();

  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Inspector & Modal States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const { data } = await axios.get("/api/creater/cd/history", {
          headers: { createrToken },
        });
        if (data.success) {
          setGroupedData(data.groupedData);
          // If a course is open in inspector, update its specific data
          if (selectedCourse) {
            const updatedCourse = data.groupedData.find(
              (c) => c.courseCode === selectedCourse.courseCode,
            );
            setSelectedCourse(updatedCourse || null);
          }
        }
      } catch (err) {
        toast.error("Failed to load CD history");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [axios, createrToken, selectedCourse],
  );

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createrToken]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let temp = [...groupedData];
    if (statusFilter !== "All") {
      temp = temp.filter((d) => d.latestStatus === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      temp = temp.filter(
        (d) =>
          d.courseCode.toLowerCase().includes(q) ||
          (d.courseTitle || "").toLowerCase().includes(q) ||
          (d.programName || "").toLowerCase().includes(q),
      );
    }
    return temp;
  }, [groupedData, statusFilter, searchTerm]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleEdit = (id) =>
    navigate("/creator/edit-cd", { state: { loadId: id } });

  const handlePreview = (version, course) => {
    setPreviewData({
      cdData: version.cdData,
      metaData: {
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        programName: course.programName,
        versionNo: version.versionNo,
        status: version.status,
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: INSPECTOR PANEL (When a Course is Selected)
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedCourse) {
    return (
      <CreatorLayout>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 pb-16 space-y-6">
          {/* Navigation Back */}
          <button
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 text-stone-500 hover:text-violet-700 font-semibold transition-colors group text-sm"
          >
            <ChevronLeft
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Course Dashboard
          </button>

          {/* Course Header Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedCourse.courseCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusStyle(selectedCourse.latestStatus)}`}
                  >
                    {getStatusLabel(selectedCourse.latestStatus)}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-stone-900 leading-tight tracking-tight">
                  {selectedCourse.courseTitle || "Untitled Course"}
                </h1>
                <p className="text-stone-500 font-medium text-sm mt-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-violet-500" />{" "}
                  {selectedCourse.programName || "Unassigned Program"}
                </p>
              </div>

              {/* Action for New Draft */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => handleEdit(selectedCourse.versions[0]._id)}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 shadow-md shadow-violet-600/20 transition-all active:scale-95"
                >
                  <Edit size={16} /> Edit / Create New Draft
                </button>
              </div>
            </div>
          </div>

          {/* Version History Timeline */}
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <History size={18} className="text-violet-600" /> Version
                History
              </h3>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest bg-white border border-stone-200 px-3 py-1 rounded-full shadow-sm">
                {selectedCourse.versions.length} records
              </span>
            </div>

            <div className="p-8 space-y-4">
              {selectedCourse.versions.map((version, idx) => (
                <div key={version._id} className="relative flex gap-6 group">
                  {/* Timeline Line */}
                  {idx !== selectedCourse.versions.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-stone-200 group-hover:bg-violet-200 transition-colors" />
                  )}

                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${idx === 0 ? "bg-violet-500 text-white" : "bg-stone-200 text-stone-500"}`}
                    >
                      {idx === 0 ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Hash size={12} />
                      )}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div
                    className={`flex-1 bg-white border rounded-2xl p-6 transition-all ${idx === 0 ? "border-violet-200 shadow-md ring-1 ring-violet-50" : "border-stone-100 hover:border-stone-300 shadow-sm"}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-extrabold text-stone-800 text-lg">
                            Version {version.versionNo}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded uppercase tracking-widest">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 font-medium">
                          Saved on{" "}
                          {new Date(version.updatedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md border uppercase tracking-wider shadow-sm ${getStatusStyle(version.status)}`}
                      >
                        {getStatusLabel(version.status)}
                      </span>
                    </div>

                    {/* Highly Styled Review Comment */}
                    {version.changeSummary && (
                      <div
                        className={`mb-5 p-4 rounded-xl border ${version.status?.toLowerCase() === "approved" ? "bg-emerald-50/50 border-emerald-100" : "bg-orange-50/50 border-orange-100"}`}
                      >
                        <p
                          className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${version.status?.toLowerCase() === "approved" ? "text-emerald-700" : "text-orange-700"}`}
                        >
                          {version.status?.toLowerCase() === "approved" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <MessageSquare size={14} />
                          )}
                          Reviewer Comment
                        </p>
                        <p
                          className={`text-sm font-medium leading-relaxed ${version.status?.toLowerCase() === "approved" ? "text-emerald-900" : "text-orange-900"}`}
                        >
                          "{version.changeSummary}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handlePreview(version, selectedCourse)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-50 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-100 transition-colors border border-stone-200"
                      >
                        <Eye size={15} /> Preview Document
                      </button>
                      <button
                        onClick={() => handleEdit(version._id)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-50 transition-colors border border-violet-200"
                      >
                        <Edit size={15} /> Restore & Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Document Preview Modal ──────────────────────────────────────────── */}
        {previewData && (
          <PreviewCD
            isModal={true}
            onClose={() => setPreviewData(null)}
            passedCdData={previewData.cdData}
            passedMetaData={previewData.metaData}
          />
        )}
      </CreatorLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: MAIN DASHBOARD (Table of Courses)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <CreatorLayout>
      <style
        dangerouslySetInnerHTML={{
          __html: ` @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap'); * { font-family: 'DM Sans', sans-serif; } `,
        }}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 pb-10 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={20} className="text-stone-400" />
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                CD History
              </h1>
            </div>
            <p className="text-sm text-stone-500 font-medium">
              Manage and inspect all your Course Document versions.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />{" "}
              Refresh
            </button>
            <Link
              to="/creator/edit-cd"
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 shadow-md shadow-violet-600/20 transition-all active:scale-95"
            >
              <Plus size={16} /> New CD
            </Link>
          </div>
        </div>

        {/* ── Search + Filter Bar ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by course code or title…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 focus:bg-white transition-all placeholder-stone-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === s ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  {s === "All" ? "All" : getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Documents Table ─────────────────────────────────────────────── */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-violet-500" size={32} />
              <p className="text-sm font-medium text-stone-500">
                Loading documents…
              </p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
              <div className="p-5 bg-stone-50 rounded-full border border-stone-100">
                <BookMarked size={36} className="text-stone-300" />
              </div>
              <div>
                <p className="text-base font-bold text-stone-700">
                  No Course Documents Found
                </p>
                <p className="text-sm text-stone-500 max-w-sm mt-1">
                  {searchTerm || statusFilter !== "All"
                    ? "Try adjusting your search criteria or clearing filters."
                    : "Create your first Course Document to get started."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-100">
                    {[
                      "Course Information",
                      "Program",
                      "Version",
                      "Latest Status",
                      "Last Updated",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest ${i === 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.courseCode}
                      onClick={() => setSelectedCourse(doc)}
                      className="hover:bg-violet-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-800 text-[15px] group-hover:text-violet-700 transition-colors mb-0.5">
                            {doc.courseCode}
                          </span>
                          <span className="text-xs font-medium text-stone-500 truncate max-w-[280px]">
                            {doc.courseTitle || "Untitled Course"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs font-semibold text-stone-500 truncate max-w-[180px] block flex items-center gap-1.5">
                          <Layers size={13} className="text-stone-400" />{" "}
                          {doc.programName || "—"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded uppercase w-fit tracking-wider shadow-sm">
                          v{doc.latestVersion}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${getStatusStyle(doc.latestStatus)}`}
                        >
                          {getStatusLabel(doc.latestStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                          <Clock size={13} className="text-stone-400" />
                          {new Date(doc.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button className="flex items-center justify-end gap-1.5 px-5 py-2.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all ml-auto hover:bg-violet-100 border border-violet-100 shadow-sm">
                          <Eye size={15} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default HistoryCD;
