import React, { useState, useEffect, useCallback } from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Search,
  Clock,
  Eye,
  Edit,
  Filter,
  Printer,
  Plus,
  Loader2,
  BookOpen,
  BookMarked,
  RefreshCw,
  X,
  Calendar,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "UnderReview":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Draft":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-500";
    case "UnderReview":
      return "bg-yellow-500";
    case "Draft":
      return "bg-gray-400";
    case "Rejected":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

const STATUS_OPTIONS = ["All", "Draft", "UnderReview", "Approved", "Rejected"];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
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

const StatusPill = ({ value, active, onClick }) => {
  const colors = {
    All: active
      ? "bg-gray-900 text-white border-gray-900"
      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
    Draft: active
      ? "bg-gray-600 text-white border-gray-600"
      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
    UnderReview: active
      ? "bg-yellow-500 text-white border-yellow-500"
      : "bg-white text-yellow-600 border-yellow-200 hover:border-yellow-400",
    Approved: active
      ? "bg-emerald-500 text-white border-emerald-500"
      : "bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400",
    Rejected: active
      ? "bg-red-500 text-white border-red-500"
      : "bg-white text-red-500 border-red-200 hover:border-red-400",
  };
  const labels = {
    All: "All",
    Draft: "Draft",
    UnderReview: "In Review",
    Approved: "Approved",
    Rejected: "Rejected",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${colors[value]}`}
    >
      {labels[value]}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const HistoryCD = () => {
  const { axios, createrToken } = useAppContext();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
          setDocuments(data.cds);
          setFilteredDocs(data.cds);
        }
      } catch (err) {
        console.error("CD History fetch error:", err);
        toast.error("Failed to load CD history");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [axios, createrToken],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Filter ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let temp = [...documents];
    if (statusFilter !== "All") {
      temp = temp.filter((d) => d.status === statusFilter);
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
    setFilteredDocs(temp);
  }, [searchTerm, statusFilter, documents]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleEdit = (id) =>
    navigate("/creator/create-cd", { state: { loadId: id } });
  const handlePreview = (id) =>
    navigate("/creator/preview-cd", { state: { loadId: id } });
  const handlePrint = (id) =>
    navigate("/creator/preview-cd", { state: { loadId: id, autoPrint: true } });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
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

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-0 pb-10 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={18} className="text-gray-400" />
              <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                CD History
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              All versions of Course Documents —{" "}
              <span className="text-gray-600 font-semibold">
                {documents.length}
              </span>{" "}
              total
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <Link
              to="/creator/create-cd"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-sm transition-colors"
            >
              <Plus size={14} />
              New CD
            </Link>
          </div>
        </div>

        {/* ── Search + Filter Bar ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Filter size={15} className="text-gray-400" />}
          iconBg="bg-gray-100"
          title="Filter Documents"
          subtitle="Search by course code, title, or program name"
        >
          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-2.5 text-gray-300"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by course code, title or program name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all placeholder-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <StatusPill
                key={s}
                value={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            ))}
            {statusFilter !== "All" && (
              <button
                onClick={() => setStatusFilter("All")}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Result Count */}
          {(searchTerm || statusFilter !== "All") && (
            <p className="text-xs text-gray-400 mt-3 font-medium">
              Showing{" "}
              <span className="text-gray-700 font-semibold">
                {filteredDocs.length}
              </span>{" "}
              of{" "}
              <span className="text-gray-700 font-semibold">
                {documents.length}
              </span>{" "}
              documents
            </p>
          )}
        </SectionCard>

        {/* ── Documents Table ─────────────────────────────────────────────── */}
        <SectionCard
          icon={<BookOpen size={15} className="text-violet-500" />}
          iconBg="bg-violet-50"
          title="Course Documents"
          subtitle={`${filteredDocs.length} result${filteredDocs.length !== 1 ? "s" : ""}`}
          noPad
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-violet-500" size={28} />
              <p className="text-xs text-gray-400">Loading documents…</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <BookOpen size={32} className="text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                No documents found
              </p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Create your first Course Document to get started."}
              </p>
              {!searchTerm && statusFilter === "All" && (
                <Link
                  to="/creator/create-cd"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 mt-1 transition-colors"
                >
                  <Plus size={13} /> Create CD
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {[
                      "Course Information",
                      "Program",
                      "Version",
                      "Status",
                      "Updated",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest ${
                          i === 5 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* Course Info */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">
                            {doc.courseCode}
                          </span>
                          <span className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">
                            {doc.courseTitle || "Untitled Course"}
                          </span>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 truncate max-w-[140px] block">
                          {doc.programName || "—"}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-semibold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded">
                          v{doc.cdVersion}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(doc.status)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getStatusDot(doc.status)}`}
                          />
                          {doc.status === "UnderReview"
                            ? "In Review"
                            : doc.status}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-300" />
                          {new Date(doc.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePrint(doc._id)}
                            title="Print"
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handlePreview(doc._id)}
                            title="Preview"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleEdit(doc._id)}
                            title="Edit"
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-[11px] text-gray-400 font-medium">
                  {filteredDocs.length} document
                  {filteredDocs.length !== 1 ? "s" : ""} shown
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </CreatorLayout>
  );
};

export default HistoryCD;
