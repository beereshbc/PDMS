import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// ── Skeleton loader ────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-stone-200 rounded-lg ${className}`} />
);

// ── Stat card ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, link, accent, loading }) => (
  <Link to={link} className="group block">
    <div
      className={`relative bg-white p-6 rounded-2xl border transition-all duration-200
      hover:-translate-y-0.5 hover:shadow-lg
      ${accent === "amber" ? "border-amber-100  hover:border-amber-200  hover:shadow-amber-50" : ""}
      ${accent === "orange" ? "border-orange-100 hover:border-orange-200 hover:shadow-orange-50" : ""}
      ${accent === "green" ? "border-green-100  hover:border-green-200  hover:shadow-green-50" : ""}`}
    >
      {/* Accent stripe */}
      <div
        className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl
        ${accent === "amber" ? "bg-amber-500" : ""}
        ${accent === "orange" ? "bg-orange-500" : ""}
        ${accent === "green" ? "bg-green-500" : ""}`}
      />

      <div className="flex justify-between items-start pt-1">
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-9 w-16 mt-2" />
          ) : (
            <h3 className="text-4xl font-black text-stone-800 mt-2 tabular-nums">
              {value}
            </h3>
          )}
        </div>
        <div
          className={`p-3 rounded-xl transition-colors
          ${accent === "amber" ? "bg-amber-50  text-amber-700  group-hover:bg-amber-100" : ""}
          ${accent === "orange" ? "bg-orange-50 text-orange-700 group-hover:bg-orange-100" : ""}
          ${accent === "green" ? "bg-green-50  text-green-700  group-hover:bg-green-100" : ""}`}
        >
          <Icon size={22} />
        </div>
      </div>

      <div
        className={`flex items-center gap-1.5 mt-5 text-xs font-semibold transition-colors
        ${accent === "amber" ? "text-amber-600  group-hover:text-amber-800" : ""}
        ${accent === "orange" ? "text-orange-600 group-hover:text-orange-800" : ""}
        ${accent === "green" ? "text-green-600  group-hover:text-green-800" : ""}`}
      >
        View details{" "}
        <ArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </div>
  </Link>
);

// ── Activity dot ───────────────────────────────────────────────────────────
const statusDot = {
  Approved: "bg-green-500 ring-2 ring-green-100",
  UnderReview: "bg-amber-400 ring-2 ring-amber-100 animate-pulse",
  Draft: "bg-stone-300 ring-2 ring-stone-100",
};

const statusBadge = {
  Approved: "bg-green-50 text-green-700 border border-green-100",
  UnderReview: "bg-amber-50 text-amber-700 border border-amber-100",
  Draft: "bg-stone-50 text-stone-500 border border-stone-100",
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  // Extract axios, token, and the logout function from Context
  const { axios, adminToken, adminLogout } = useAppContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingPDs: 0,
    pendingCDs: 0,
    approvedPrograms: 0,
  });
  const [recentActivity, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Because baseURL is set in your AppContext, we just use the relative path
      const { data } = await axios.get("/api/admin/dashboard-stats");
      if (data.success) {
        setStats(data.stats);
        setRecent(data.recentActivity || []);
      } else {
        toast.error("Dashboard sync failed");
      }
    } catch (error) {
      // Handle the 401 specifically: clear token and redirect
      if (error.response && error.response.status === 401) {
        toast.error("Session expired or unauthorized. Please login again.");
        if (adminLogout) adminLogout(); // Clears localStorage
        navigate("/admin/login"); // Redirect to login
      } else {
        toast.error("Could not reach server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt to fetch if there is a token
    if (adminToken) {
      fetchData();
    }
  }, [adminToken]);

  const total = stats.pendingPDs + stats.pendingCDs;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl">
        {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Live Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">
              System Overview
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Jurisdiction-scoped document workflow status
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 shadow-sm transition-all text-sm font-semibold disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Pending PD Reviews"
            value={stats.pendingPDs}
            icon={FileText}
            link="/admin/pd-reviews"
            accent="amber"
            loading={loading}
          />
          <StatCard
            title="Pending CD Reviews"
            value={stats.pendingCDs}
            icon={BookOpen}
            link="/admin/cd-reviews"
            accent="orange"
            loading={loading}
          />
          <StatCard
            title="Approved Programs"
            value={stats.approvedPrograms}
            icon={CheckCircle2}
            link="/admin/compiler"
            accent="green"
            loading={loading}
          />
        </div>

        {/* ── BOTTOM GRID ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Workflow hero card — 2 cols */}
          <div className="lg:col-span-2 bg-gradient-to-br from-amber-900 to-stone-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-xl shadow-amber-900/20">
            {/* Decorative */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-64 h-64 rounded-full border-[40px] border-white" />
              <div className="absolute bottom-4 left-4 w-40 h-40 rounded-full border-[24px] border-white" />
            </div>
            <Layers
              size={200}
              className="absolute -bottom-8 -right-8 text-amber-700/20 rotate-12 pointer-events-none"
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-amber-400" />
                <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">
                  Workflow Summary
                </span>
              </div>
              <h2 className="text-4xl font-black tabular-nums">
                {loading ? "—" : total}
                <span className="text-lg font-normal text-amber-200 ml-2">
                  pending
                </span>
              </h2>
              <p className="text-amber-100/70 text-sm mt-3 leading-relaxed max-w-xs">
                {total === 0
                  ? "All clear — no documents awaiting review."
                  : `${total} document${total > 1 ? "s" : ""} awaiting review. Approving these enables the latest curriculum generation.`}
              </p>
            </div>

            <div className="relative flex gap-3 flex-wrap">
              <Link
                to="/admin/compiler"
                className="bg-white text-amber-900 px-5 py-2.5 rounded-xl font-bold hover:bg-amber-50 transition-colors text-sm shadow-lg"
              >
                Go to Compiler
              </Link>
              {total > 0 && (
                <Link
                  to="/admin/pd-reviews"
                  className="border border-amber-600 text-amber-200 px-5 py-2.5 rounded-xl font-bold hover:bg-amber-800/40 transition-colors text-sm"
                >
                  Review Docs
                </Link>
              )}
            </div>
          </div>

          {/* Recent activity — 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-amber-700" /> Recent
                Activity
              </h2>
              {!loading && recentActivity.length > 0 && (
                <span className="text-xs text-stone-400 font-medium">
                  {recentActivity.length} items
                </span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-stone-300">
                  <AlertCircle size={32} className="mb-3" />
                  <p className="text-sm font-medium text-stone-400">
                    No recent activity found
                  </p>
                </div>
              ) : (
                recentActivity.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-stone-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[item.status] || statusDot.Draft}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate group-hover:text-amber-800 transition-colors">
                          {item.programName ||
                            item.courseTitle ||
                            item.programCode ||
                            item.courseCode}
                        </p>
                        <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                          {item.programCode ? "Program Doc" : "Course Doc"}
                          {" • "}
                          {new Date(item.updatedAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short" },
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-tight flex-shrink-0 ml-3 ${statusBadge[item.status] || statusBadge.Draft}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-stone-50 flex justify-center">
              <p className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">
                End of recent updates
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
