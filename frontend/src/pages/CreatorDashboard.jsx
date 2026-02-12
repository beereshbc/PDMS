import React, { useState, useEffect } from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  MoreVertical,
  FileUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const CreatorDashboard = () => {
  const { axios, createrToken } = useAppContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    underReview: 0,
    approved: 0,
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/creater/dashboard-stats", {
        headers: { createrToken },
      });

      if (data.success) {
        setStats(data.stats);
        setRecentDocs(data.recentDocs);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "UnderReview":
        return "bg-yellow-100 text-yellow-700";
      case "Draft":
        return "bg-gray-100 text-gray-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">
              Welcome back, manage your program documents.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/creator/create-pd"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={18} /> Create New PD
            </Link>
          </div>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Documents"
            value={stats.total}
            icon={FileText}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Drafts In Progress"
            value={stats.drafts}
            icon={Clock}
            color="bg-gray-50 text-gray-600"
          />
          <StatCard
            label="Under Review"
            value={stats.underReview}
            icon={AlertCircle}
            color="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-green-50 text-green-600"
          />
        </div>

        {/* --- Recent Activity Section --- */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Documents
            </h2>
            <Link
              to="/creator/pd-history"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Program Code</th>
                  <th className="px-6 py-4">Program Name</th>
                  <th className="px-6 py-4">Ver</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentDocs.length > 0 ? (
                  recentDocs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {doc.programCode}
                      </td>
                      <td className="px-6 py-4">
                        {doc.section1_info?.programName || "Untitled Program"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                          v{doc.pdVersion}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate("/creator/create-pd", {
                              state: { loadId: doc._id },
                            })
                          } // Assuming CreatePD can handle loadId state
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No documents found. Start by creating one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

// Helper Component for Stats
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export default CreatorDashboard;
