import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Search,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  FileText,
  Filter,
  Clock,
  AlertCircle,
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
          <div className="h-4 bg-stone-100 rounded w-40" />
          <div className="h-3 bg-stone-100 rounded w-28" />
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="h-4 bg-stone-100 rounded w-32" />
    </td>
    <td className="px-6 py-5">
      <div className="h-4 bg-stone-100 rounded w-24" />
    </td>
    <td className="px-6 py-5">
      <div className="h-8 bg-stone-100 rounded-xl w-28 ml-auto" />
    </td>
  </tr>
);

const PDReviewList = () => {
  const { axios, adminToken } = useAppContext();
  const navigate = useNavigate();

  const [pds, setPds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearch] = useState("");

  const fetchPendingPDs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reviews/pds");
      if (data.success) {
        setPds(data.pds);
      } else {
        toast.error(data.message || "Could not load pending documents");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not load pending documents",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) fetchPendingPDs();
  }, [adminToken]);

  const filtered = pds.filter(
    (pd) =>
      pd.programName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.programCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">
              Program Document Reviews
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Validate curriculum structure before approval.{" "}
              {!loading && pds.length > 0 && (
                <span className="font-semibold text-amber-700">
                  {pds.length} pending
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
                placeholder="Search program or creator…"
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 outline-none w-56 transition-all"
              />
            </div>
            <button
              onClick={fetchPendingPDs}
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
                    Program
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Creator
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Submitted
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
                              : "No Program Documents pending review"}
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
                  filtered.map((pd) => (
                    <tr
                      key={pd._id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/pd-review/${pd._id}`)}
                    >
                      {/* Program info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-100 transition-colors flex-shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 text-sm group-hover:text-amber-900 transition-colors">
                              {pd.programName || pd.programCode}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase tracking-tight">
                                {pd.programCode}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                v{pd.pdVersion} · {pd.schemeYear}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-700">
                          <User
                            size={13}
                            className="text-amber-600 flex-shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold">
                              {pd.createdBy?.name || "Unknown Creator"}
                            </p>
                            {pd.createdBy?.designation && (
                              <p className="text-[11px] text-stone-400 mt-0.5">
                                {pd.createdBy.designation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-500">
                          <Calendar size={13} />
                          <div>
                            <p className="text-sm">
                              {new Date(pd.updatedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-amber-500" />
                              <span className="text-[11px] text-amber-600 font-semibold">
                                Under Review
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Prevents default button behavior
                            e.stopPropagation(); // Stops the <tr> click from firing twice
                            navigate(`/admin/pd-review/${pd._id}`);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 shadow-sm shadow-amber-900/10 transition-all active:scale-95"
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

          {/* Table footer */}
          <div className="bg-stone-50/60 px-6 py-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
              {searchTerm && " matching"}
            </span>
            <div className="flex items-center gap-2">
              <Filter size={11} className="text-stone-400" />
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
                Sorted by newest
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PDReviewList;
