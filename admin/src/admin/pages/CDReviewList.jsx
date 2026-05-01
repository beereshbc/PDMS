import React, { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  FileText,
  Clock,
  AlertCircle,
  Eye,
  X,
  BookOpen,
  History,
  CheckCircle2,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Layers,
  GraduationCap,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import PreviewCD from "../components/PreviewCD";

// ─────────────────────────────────────────────────────────────────────────────
// ACTION MODAL (APPROVE / REJECT)
// ─────────────────────────────────────────────────────────────────────────────
const ActionModal = ({ isOpen, onClose, cd, onActionSubmit, submitting }) => {
  const [rejectionMsg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
  }, [isOpen]);

  if (!isOpen || !cd) return null;

  const d = cd.cdData; // Formatted payload mapped from backend
  const checks = [
    {
      label: "Course Identity & Credits",
      ok: !!d?.courseCode && !!d?.credits?.total,
    },
    { label: "Aims & Objectives", ok: !!d?.aimsSummary && !!d?.objectives },
    {
      label: "Course Outcomes & Map",
      ok: d?.courseOutcomes?.length > 0 && !!d?.outcomeMapHtml,
    },
    {
      label: "Syllabus & Teaching Plan",
      ok: !!d?.courseContent || d?.teaching?.length > 0,
    },
    {
      label: "Assessment & Grading",
      ok: !!d?.assessmentWeightHtml && !!d?.gradingCriterion,
    },
  ];
  const score = checks.filter((c) => c.ok).length;
  const pct = Math.round((score / checks.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-stone-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Review Action</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Document Summary */}
          <div className="mb-6 bg-stone-50 border border-stone-200 rounded-xl p-4">
            <h4 className="font-bold text-stone-800 mb-1">{cd.courseTitle}</h4>
            <div className="flex gap-2 text-xs text-stone-500 font-medium">
              <span>Code: {cd.courseCode}</span> • <span>v{cd.cdVersion}</span>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Section Validation
              </p>
              <span
                className={`text-sm font-black ${pct === 100 ? "text-emerald-600" : "text-orange-600"}`}
              >
                {score}/{checks.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-orange-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checks.map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  {ok ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-500 flex-shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={14}
                      className="text-stone-300 flex-shrink-0"
                    />
                  )}
                  <span
                    className={`text-xs ${ok ? "text-stone-700 font-medium" : "text-stone-400"}`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-stone-100 mb-6" />

          {/* Action Area */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                Review Comment / Revision Note
              </label>
              <textarea
                className="w-full h-24 p-3 bg-white border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 text-sm resize-none text-stone-700 placeholder:text-stone-300"
                placeholder="Add a comment for approval or describe issues for revision..."
                value={rejectionMsg}
                onChange={(e) => setMsg(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onActionSubmit(cd._id, "Draft", rejectionMsg)}
                disabled={!rejectionMsg.trim() || submitting}
                className="flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-all text-sm disabled:opacity-50"
              >
                <AlertTriangle size={15} /> Request Revision
              </button>

              <button
                onClick={() => onActionSubmit(cd._id, "Approved", rejectionMsg)}
                disabled={submitting}
                className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all text-sm disabled:opacity-50"
              >
                <CheckCircle size={16} /> Approve Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VERSION HISTORY MODAL
// ─────────────────────────────────────────────────────────────────────────────
const VersionHistoryModal = ({
  isOpen,
  onClose,
  courseCode,
  axios,
  adminToken,
  onPreviewClick,
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && courseCode) {
      const fetchVersions = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get(
            `/api/admin/reviews/cd/${courseCode}/versions`,
            {
              headers: { Authorization: `Bearer ${adminToken}` },
            },
          );
          if (data.success) {
            setVersions(data.versions);
          }
        } catch (err) {
          toast.error("Failed to load version history.");
        } finally {
          setLoading(false);
        }
      };
      fetchVersions();
    }
  }, [isOpen, courseCode, adminToken, axios]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-800">
                Version History
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Course Code: {courseCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:bg-stone-100 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-stone-50/30">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="animate-spin text-stone-400" size={24} />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              No versions found.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v._id}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-orange-300 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-stone-800">
                        Version {v.cdVersion}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${v.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : v.status === "UnderReview" ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-stone-100 text-stone-600 border border-stone-200"}`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Submitted by: {v.createdBy?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(v.updatedAt).toLocaleString()}
                    </p>
                    {(v.change_summary || v.reviewComment) && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-md border border-red-100">
                        <span className="font-bold">Admin Note:</span>{" "}
                        {v.change_summary || v.reviewComment}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onPreviewClick(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REVIEW LIST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const CDReviewList = () => {
  const { axios, adminToken } = useAppContext();

  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearch] = useState("");

  // Navigation State
  const [selectedPD, setSelectedPD] = useState(null);

  // Modals
  const [previewData, setPreviewData] = useState(null);
  const [actionData, setActionData] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [historyCourseCode, setHistoryCourseCode] = useState(null);

  const fetchGroupedData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reviews/cds/grouped", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) {
        setGroupedData(data.groupedData);
        if (selectedPD) {
          const updatedPD = data.groupedData.find(
            (pd) => pd.pdId === selectedPD.pdId,
          );
          setSelectedPD(updatedPD || null);
        }
      }
    } catch (err) {
      toast.error("Could not load course structures.");
    } finally {
      setLoading(false);
    }
  }, [adminToken, axios, selectedPD]);

  useEffect(() => {
    if (adminToken) fetchGroupedData();
  }, [adminToken, fetchGroupedData]);

  const handlePreviewClick = (cd) => {
    setPreviewData({
      cdData: cd.cdData,
      metaData: {
        courseCode: cd.courseCode,
        courseTitle: cd.courseTitle,
        programName: selectedPD?.programName || "",
        versionNo: cd.cdVersion,
      },
    });
  };

  const handleActionSubmit = async (cdId, status, rejectionMessage = "") => {
    setSubmittingAction(true);
    try {
      const { data } = await axios.put(
        `/api/admin/reviews/cd/${cdId}`,
        { status, rejectionMessage },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      if (data.success) {
        toast.success(
          status === "Approved"
            ? "Course Document Approved ✓"
            : "Returned to Creator for Revision",
        );
        setActionData(null);
        fetchGroupedData();
      } else toast.error(data.message || "Action failed");
    } catch {
      toast.error("Action failed");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UnderReview":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Missing":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  const filteredPDs = useMemo(() => {
    if (!searchTerm) return groupedData;
    const lowerSearch = searchTerm.toLowerCase();
    return groupedData.filter(
      (pd) =>
        pd.programName.toLowerCase().includes(lowerSearch) ||
        pd.programCode.toLowerCase().includes(lowerSearch),
    );
  }, [groupedData, searchTerm]);

  // Render Inner CD List
  if (selectedPD) {
    const courseList = selectedPD.courses || [];
    const pendingCount = selectedPD.stats.underReview;

    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto pb-16 space-y-6">
          <button
            onClick={() => setSelectedPD(null)}
            className="flex items-center gap-2 text-stone-500 hover:text-orange-700 font-semibold transition-colors group text-sm"
          >
            <ChevronLeft
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />{" "}
            Back to Programs Grid
          </button>

          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full uppercase">
                    {selectedPD.programCode}
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                    v{selectedPD.pdVersion}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-stone-900">
                  {selectedPD.programName}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  Review all courses associated with this program.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 border border-stone-100 bg-stone-50 rounded-xl">
                  <p className="text-[10px] font-bold text-stone-400 uppercase">
                    Total
                  </p>
                  <p className="text-xl font-black text-stone-800">
                    {selectedPD.stats.total}
                  </p>
                </div>
                <div className="text-center px-4 py-2 border border-orange-100 bg-orange-50 rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-orange-400 uppercase">
                    Pending Review
                  </p>
                  <p className="text-xl font-black text-orange-700">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {courseList.map((course, i) => (
              <div
                key={i}
                className={`bg-white border ${course.status === "UnderReview" ? "border-orange-300 shadow-md ring-1 ring-orange-100" : "border-stone-200 shadow-sm"} rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-stone-300`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-stone-800 text-base truncate">
                      {course.courseCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusStyle(course.status)}`}
                    >
                      {course.status}
                    </span>
                    {course.cdVersion !== "-" && (
                      <span className="text-xs text-stone-400 font-mono ml-2">
                        v{course.cdVersion}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-semibold text-stone-600 text-sm truncate max-w-xl"
                    title={course.courseTitle}
                  >
                    {course.courseTitle}
                  </h3>
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Layers size={13} className="text-stone-400" />{" "}
                      {course.context}
                    </span>
                    {course.createdBy && <span>•</span>}
                    {course.createdBy && (
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-stone-400" />{" "}
                        {course.createdBy.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                  {course.status !== "Missing" && (
                    <>
                      <button
                        onClick={() => setHistoryCourseCode(course.courseCode)}
                        className="p-2 text-stone-500 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                        title="Version History"
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => handlePreviewClick(course)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-100 transition-colors"
                      >
                        <Eye size={14} /> Preview
                      </button>
                    </>
                  )}
                  {course.status === "UnderReview" && (
                    <button
                      onClick={() => setActionData(course)}
                      className="flex items-center gap-1.5 px-5 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 shadow-sm transition-transform active:scale-95"
                    >
                      Review Action <ExternalLink size={14} />
                    </button>
                  )}
                  {course.status === "Missing" && (
                    <button
                      disabled
                      className="px-5 py-2 bg-stone-100 text-stone-400 rounded-lg text-xs font-bold cursor-not-allowed border border-stone-200"
                    >
                      Not Created
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {previewData && (
          <PreviewCD
            isModal={true}
            onClose={() => setPreviewData(null)}
            passedCdData={previewData.cdData}
            passedMetaData={previewData.metaData}
          />
        )}
        <ActionModal
          isOpen={!!actionData}
          onClose={() => setActionData(null)}
          cd={actionData}
          onActionSubmit={handleActionSubmit}
          submitting={submittingAction}
        />
        <VersionHistoryModal
          isOpen={!!historyCourseCode}
          onClose={() => setHistoryCourseCode(null)}
          courseCode={historyCourseCode}
          axios={axios}
          adminToken={adminToken}
          onPreviewClick={handlePreviewClick}
        />
      </AdminLayout>
    );
  }

  // Render Default Main Grid
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">
              Curriculum Review Board
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Select a Program Document to review its constituent courses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search programs…"
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 outline-none w-64 transition-all"
              />
            </div>
            <button
              onClick={fetchGroupedData}
              className="p-2 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white border border-stone-100 rounded-2xl h-44"
              />
            ))}
          </div>
        ) : filteredPDs.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center shadow-sm">
            <AlertCircle size={48} className="text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-700">
              No Programs Found
            </h3>
            <p className="text-stone-500 text-sm mt-1 max-w-sm">
              There are no approved or under-review programs in your
              jurisdiction yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPDs.map((pd) => (
              <div
                key={pd.pdId}
                onClick={() => setSelectedPD(pd)}
                className={`bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-200 flex flex-col overflow-hidden relative group ${pd.stats.underReview > 0 ? "ring-1 ring-orange-300" : ""}`}
              >
                {pd.stats.underReview > 0 && (
                  <div className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </div>
                )}
                <div className="p-6 pb-4 border-b border-stone-50 bg-gradient-to-br from-white to-stone-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {pd.programCode}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      v{pd.pdVersion}
                    </span>
                  </div>
                  <h2 className="font-bold text-lg text-stone-900 leading-snug line-clamp-2 min-h-[50px] group-hover:text-orange-800 transition-colors">
                    {pd.programName}
                  </h2>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-end bg-stone-50/30">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white border border-stone-100 rounded-lg py-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase mb-0.5">
                        Total
                      </p>
                      <p className="text-sm font-black text-stone-700">
                        {pd.stats.total}
                      </p>
                    </div>
                    <div className="bg-white border border-emerald-100 rounded-lg py-2">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase mb-0.5">
                        Apprv
                      </p>
                      <p className="text-sm font-black text-emerald-700">
                        {pd.stats.approved}
                      </p>
                    </div>
                    <div
                      className={`bg-white border ${pd.stats.underReview > 0 ? "border-orange-300 shadow-sm bg-orange-50" : "border-orange-100"} rounded-lg py-2`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase mb-0.5 ${pd.stats.underReview > 0 ? "text-orange-600" : "text-orange-400"}`}
                      >
                        Review
                      </p>
                      <p
                        className={`text-sm font-black ${pd.stats.underReview > 0 ? "text-orange-700" : "text-orange-600"}`}
                      >
                        {pd.stats.underReview}
                      </p>
                    </div>
                    <div className="bg-white border border-stone-100 rounded-lg py-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase mb-0.5">
                        Miss
                      </p>
                      <p className="text-sm font-black text-stone-600">
                        {pd.stats.missing + pd.stats.draft}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(pd.stats.approved / pd.stats.total) * 100}%`,
                        }}
                        title="Approved"
                      />
                      <div
                        className="bg-orange-400 h-full"
                        style={{
                          width: `${(pd.stats.underReview / pd.stats.total) * 100}%`,
                        }}
                        title="Under Review"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 w-8 text-right">
                      {Math.round(
                        (pd.stats.approved / (pd.stats.total || 1)) * 100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CDReviewList;
