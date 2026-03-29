import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  BookOpen,
  User,
  Calendar,
  ExternalLink,
  RefreshCw,
  Tag,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Skeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100" />
        <div className="space-y-2">
          <div className="h-4 bg-stone-100 rounded w-44" />
          <div className="h-3 bg-stone-100 rounded w-28" />
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="h-4 bg-stone-100 rounded w-16" />
    </td>
    <td className="px-6 py-5">
      <div className="h-4 bg-stone-100 rounded w-32" />
    </td>
    <td className="px-6 py-5">
      <div className="h-8 bg-stone-100 rounded-xl w-24 ml-auto" />
    </td>
  </tr>
);

const CDReviewList = () => {
  const { axios, adminToken } = useAppContext();
  const navigate = useNavigate();

  const [cds, setCds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearch] = useState("");

  const fetchPendingCDs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reviews/cds");
      if (data.success) {
        setCds(data.cds);
      } else {
        toast.error(data.message || "Could not load pending Course Documents");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Could not load pending Course Documents",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) fetchPendingCDs();
  }, [adminToken]);

  const filtered = cds.filter(
    (cd) =>
      cd.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cd.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cd.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">
              Course Document Reviews
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Review syllabus, outcomes and resources for individual courses.{" "}
              {!loading && cds.length > 0 && (
                <span className="font-semibold text-orange-600">
                  {cds.length} pending
                </span>
              )}
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
                placeholder="Search code, title or creator…"
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 outline-none w-60 transition-all"
              />
            </div>
            <button
              onClick={fetchPendingCDs}
              className="p-2 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── TABLE ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-stone-50 to-white border-b border-stone-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Course
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Version
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Faculty
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  [...Array(4)].map((_, i) => <Skeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-stone-300">
                        <AlertCircle size={36} />
                        <div>
                          <p className="text-sm font-semibold text-stone-500">
                            {searchTerm
                              ? "No results found"
                              : "No Course Documents pending review"}
                          </p>
                          {searchTerm && (
                            <p className="text-xs text-stone-400 mt-1">
                              Try a different search term
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((cd) => (
                    <tr
                      key={cd._id}
                      className="hover:bg-orange-50/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/cd-review/${cd._id}`)}
                    >
                      {/* Course info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-orange-50 text-orange-700 rounded-xl group-hover:bg-orange-100 transition-colors flex-shrink-0">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 text-sm group-hover:text-orange-900 transition-colors">
                              {cd.courseTitle}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase tracking-tight">
                                {cd.courseCode}
                              </span>
                              {cd.programName && (
                                <span className="text-[11px] text-stone-400 truncate max-w-[140px]">
                                  {cd.programName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={13} className="text-orange-500" />
                          <span className="text-sm font-bold text-stone-700 font-mono">
                            v{cd.cdVersion}
                          </span>
                        </div>
                      </td>

                      {/* Faculty */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-700">
                          <User
                            size={13}
                            className="text-orange-600 flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold">
                              {cd.createdBy?.name || "Faculty"}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar size={10} className="text-stone-400" />
                              <span className="text-[11px] text-stone-400">
                                {new Date(cd.createdAt).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/cd-review/${cd._id}`);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-800 rounded-xl text-sm font-bold hover:bg-orange-700 hover:text-white hover:border-transparent transition-all active:scale-95 shadow-sm"
                        >
                          Review <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-stone-50/60 px-6 py-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
              Queue: {filtered.length} course{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
                Live Sync Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CDReviewList;
