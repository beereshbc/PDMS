import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  Book,
  Target,
  Link as LinkIcon,
  AlertTriangle,
  User,
  Hash,
  Award,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const CreditBox = ({ label, value }) => (
  <div className="text-center bg-white rounded-xl border border-stone-100 px-4 py-2.5 shadow-sm">
    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
      {label}
    </p>
    <p className="text-2xl font-black text-amber-800 tabular-nums">
      {value ?? "—"}
    </p>
  </div>
);

const ResourceList = ({ label, items, borderColor }) => {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-3 text-sm">
        <Hash size={14} className="text-stone-400" />
        {label}{" "}
        <span className="text-stone-400 font-normal">({items.length})</span>
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`text-sm text-stone-700 p-3.5 rounded-xl border-l-4 bg-stone-50 ${borderColor}`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const CDReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const [cd, setCd] = useState(null);
  const [activeTab, setActiveTab] = useState("syllabus");
  const [loading, setLoading] = useState(true);
  const [rejectionMsg, setMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTeaching, setShowTeach] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/admin/reviews/cd/${id}`);
        if (data.success) setCd(data.cd);
        else toast.error(data.message || "Document not found");
      } catch {
        toast.error("Error loading course details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAction = async (status) => {
    if (status === "Draft" && !rejectionMsg.trim())
      return toast.error("Revision reason required");
    setSubmitting(true);
    try {
      const { data } = await axios.put(`/api/admin/reviews/cd/${id}`, {
        status,
        rejectionMessage: rejectionMsg,
      });
      if (data.success) {
        toast.success(
          status === "Approved"
            ? "Course Document Approved ✓"
            : "Returned for revision",
        );
        navigate("/admin/cd-reviews");
      } else toast.error(data.message || "Action failed");
    } catch {
      toast.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resolve populated section refs with correct field names ─────────────

  // Section 1 — identity sub-doc + credits sub-doc
  const s1 = cd?.section1_identity || {};
  const identity = s1?.identity || {};
  const credits = s1?.credits || {}; // { L, T, P, total }

  // Section 2 — FIXED: was .cos[] → actual field is .courseOutcomes[]
  const s2 = cd?.section2_outcomes || {};
  const courseOutcomes = s2?.courseOutcomes || []; // [{code, description, mapping}]

  // Section 3 — FIXED: was .units[] → actual fields are .courseContent (HTML) and .teaching[]
  const s3 = cd?.section3_syllabus || {};
  const courseContent = s3?.courseContent || ""; // HTML string — render with dangerouslySetInnerHTML
  const teaching = s3?.teaching || []; // [{number, topic, slides, videos}]

  // Section 4 — FIXED: was .textbooks → actual path is .resources.textBooks
  const s4 = cd?.section4_resources || {};
  const resources = s4?.resources || {};
  const textBooks = resources?.textBooks || [];
  const references = resources?.references || [];
  const otherRes = resources?.otherResources || [];

  const TABS = [
    { id: "syllabus", label: "Syllabus", icon: Book },
    { id: "outcomes", label: "Outcomes", icon: Target },
    { id: "resources", label: "Resources", icon: LinkIcon },
  ];

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto" />
            <p className="text-stone-400 text-sm font-medium">
              Loading Course…
            </p>
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-32">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-orange-700 mb-6 font-semibold transition-colors group text-sm"
        >
          <ChevronLeft
            size={18}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Course List
        </button>

        <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm">
          {/* ── HEADER ───────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-stone-50 to-white p-8 border-b border-stone-100">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Under Review
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    v{cd?.cdVersion}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {cd?.courseCode}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-stone-900 leading-tight">
                  {cd?.courseTitle}
                </h1>
                {cd?.programName && (
                  <p className="text-stone-500 mt-1 text-sm">
                    {cd.programName}
                  </p>
                )}

                {/* Identity chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    identity.facultyTitle,
                    identity.department,
                    identity.facultyMember && `👤 ${identity.facultyMember}`,
                  ]
                    .filter(Boolean)
                    .map((v, i) => (
                      <span
                        key={i}
                        className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full"
                      >
                        {v}
                      </span>
                    ))}
                </div>
              </div>

              {/* Credits — FIXED: credits.total and credits.L/T/P */}
              <div className="flex-shrink-0 space-y-2">
                <CreditBox label="Total Credits" value={credits?.total} />
                <div className="grid grid-cols-3 gap-2">
                  <CreditBox label="L" value={credits?.L} />
                  <CreditBox label="T" value={credits?.T} />
                  <CreditBox label="P" value={credits?.P} />
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mt-8 bg-stone-100 p-1 rounded-xl w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === t.id
                      ? "bg-white text-orange-800 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB CONTENT ──────────────────────────────────────────── */}
          <div className="p-8 min-h-[440px]">
            {/* SYLLABUS — FIXED: courseContent is HTML string, not array of units */}
            {activeTab === "syllabus" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-4 text-sm">
                    <Book size={14} className="text-orange-600" /> Syllabus
                    Content
                  </h3>
                  {courseContent ? (
                    <div
                      className="prose prose-sm max-w-none p-5 bg-stone-50 rounded-2xl border border-stone-100 text-stone-700 leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: courseContent }}
                    />
                  ) : (
                    <p className="text-stone-400 italic text-sm py-10 text-center">
                      No syllabus content available
                    </p>
                  )}
                </div>

                {/* Teaching plan — collapsible */}
                {teaching.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowTeach((p) => !p)}
                      className="flex items-center gap-2 text-stone-600 hover:text-orange-700 font-semibold text-sm mb-3 transition-colors"
                    >
                      {showTeaching ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                      Teaching Plan — {teaching.length} sessions
                    </button>
                    {showTeaching && (
                      <div className="border border-stone-200 rounded-2xl overflow-hidden animate-in fade-in duration-200">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-50 border-b border-stone-100">
                            <tr>
                              {["#", "Topic", "Slides", "Videos"].map((h) => (
                                <th
                                  key={h}
                                  className="px-4 py-2.5 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wide"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {teaching.map((row, i) => (
                              <tr
                                key={i}
                                className="border-t border-stone-50 hover:bg-amber-50/20 transition-colors"
                              >
                                <td className="px-4 py-2.5 text-xs font-mono text-stone-500">
                                  {row.number}
                                </td>
                                <td className="px-4 py-2.5 text-sm text-stone-700">
                                  {row.topic}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-stone-400">
                                  {row.slides || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-stone-400">
                                  {row.videos || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* OUTCOMES — FIXED: was .cos[] → .courseOutcomes[] with {code, description} */}
            {activeTab === "outcomes" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {s2?.aimsSummary && (
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-3 text-sm">
                      <Award size={14} className="text-orange-600" /> Course
                      Aims
                    </h3>
                    <div
                      className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl text-stone-700 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: s2.aimsSummary }}
                    />
                  </div>
                )}

                <div>
                  <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-3 text-sm">
                    <Target size={14} className="text-orange-600" />
                    Course Outcomes
                    <span className="text-stone-400 font-normal">
                      ({courseOutcomes.length})
                    </span>
                  </h3>
                  {courseOutcomes.length === 0 ? (
                    <p className="text-stone-400 italic text-sm py-8 text-center">
                      No course outcomes defined
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {courseOutcomes.map((co, i) => (
                        <div
                          key={i}
                          className="flex gap-4 p-4 border border-stone-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/20 transition-colors"
                        >
                          <span className="flex-shrink-0 font-black text-orange-600 font-mono text-sm w-10">
                            {co.code || `CO${i + 1}`}
                          </span>
                          <p className="text-sm text-stone-600 leading-relaxed">
                            {co.description || (
                              <span className="italic text-stone-300">
                                No description
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {s2?.outcomeMapHtml && (
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-3 text-sm">
                      <Layers size={14} className="text-orange-600" /> CO–PO/PSO
                      Mapping
                    </h3>
                    <div
                      className="overflow-x-auto border border-stone-100 rounded-2xl p-4 bg-stone-50"
                      dangerouslySetInnerHTML={{ __html: s2.outcomeMapHtml }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* RESOURCES — FIXED: was .textbooks → .resources.textBooks */}
            {activeTab === "resources" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <ResourceList
                  label="Text Books"
                  items={textBooks}
                  borderColor="border-amber-500"
                />
                <ResourceList
                  label="References"
                  items={references}
                  borderColor="border-stone-400"
                />
                <ResourceList
                  label="Other Resources"
                  items={otherRes}
                  borderColor="border-orange-400"
                />

                {s4?.gradingCriterion && (
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-stone-800 mb-3 text-sm">
                      <Award size={14} className="text-green-600" /> Grading
                      Criterion
                    </h3>
                    <div
                      className="overflow-x-auto border border-stone-100 rounded-2xl p-4 bg-stone-50"
                      dangerouslySetInnerHTML={{ __html: s4.gradingCriterion }}
                    />
                  </div>
                )}

                {textBooks.length === 0 &&
                  references.length === 0 &&
                  otherRes.length === 0 &&
                  !s4?.gradingCriterion && (
                    <p className="text-center text-stone-400 italic text-sm py-12">
                      No resources defined for this course
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY ACTION BAR ────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl
        bg-white/95 backdrop-blur-md border border-stone-200 shadow-2xl rounded-2xl px-5 py-3.5
        flex items-center justify-between z-40"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-800 truncate">
              {cd?.courseTitle}
            </p>
            <p className="text-[11px] text-stone-400">
              {cd?.courseCode} · {cd?.createdBy?.name || "faculty"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 text-stone-500 font-bold hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <XCircle size={15} /> Revise
          </button>
          <button
            onClick={() => handleAction("Approved")}
            disabled={submitting}
            className="px-7 py-2.5 bg-amber-800 text-white font-bold rounded-xl hover:bg-amber-900 shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <CheckCircle size={15} />
            {submitting ? "Approving…" : "Approve Syllabus"}
          </button>
        </div>
      </div>

      {/* ── REJECTION MODAL ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-red-50 rounded-xl text-red-600 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Send for Revision
                </h3>
                <p className="text-stone-500 text-sm mt-1">
                  Describe what needs correction in the syllabus or outcomes.
                </p>
              </div>
            </div>
            <textarea
              className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-200 text-sm resize-none placeholder:text-stone-300 text-stone-700"
              placeholder="e.g., Unit 3 content too heavy, CO4 mapping incorrect…"
              value={rejectionMsg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-stone-400 font-bold hover:text-stone-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  handleAction("Draft");
                }}
                disabled={!rejectionMsg.trim() || submitting}
                className="bg-amber-900 text-white px-7 py-2.5 rounded-xl font-bold hover:bg-stone-800 shadow-lg shadow-amber-900/20 text-sm disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Notify Creator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CDReviewDetail;
