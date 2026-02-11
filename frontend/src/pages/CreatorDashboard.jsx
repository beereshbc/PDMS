import React from "react";
import CreatorLayout from "../components/CreatorLayout";
import {
  FileText,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  FileClock,
  FilePenLine,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CreatorDashboard = () => {
  const navigate = useNavigate();

  // Mock Data for Dashboard
  const stats = {
    totalDocs: 12,
    pendingReview: 3,
    approved: 8,
  };

  const recentDocs = [
    {
      id: 1,
      title: "B.Tech CSE Syllabus v2.0",
      date: "2024-03-15",
      status: "Draft",
    },
    {
      id: 2,
      title: "M.Tech VLSI Lab Manual",
      date: "2024-03-12",
      status: "Pending",
    },
    {
      id: 3,
      title: "Eng. Mechanics Unit 1",
      date: "2024-03-10",
      status: "Approved",
    },
  ];

  return (
    <CreatorLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#BF1A1A]">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, Prof. Verma. Here is your documentation overview.
            </p>
          </div>
          <Link
            to="/creator/create-pd"
            className="hidden sm:flex items-center gap-2 bg-[#BF1A1A] hover:bg-[#9e1616] text-white px-5 py-3 rounded-lg font-semibold shadow-lg transition-transform transform hover:-translate-y-1"
          >
            <Plus size={20} />
            Create New PD
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">My Documents</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {stats.totalDocs}
              </h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Pending Review
              </p>
              <h3 className="text-3xl font-bold text-orange-600 mt-1">
                {stats.pendingReview}
              </h3>
            </div>
            <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Approved</p>
              <h3 className="text-3xl font-bold text-green-600 mt-1">
                {stats.approved}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileClock size={18} /> Recent Program Documents
              </h3>
              <Link
                to="/creator/pd-history"
                className="text-xs font-medium text-[#BF1A1A] hover:underline"
              >
                View History
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Last edited: {doc.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : doc.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {doc.status}
                    </span>
                    <button
                      onClick={() => navigate(`/creator/edit-pd/${doc.id}`)}
                      className="text-gray-400 hover:text-[#BF1A1A]"
                    >
                      <FilePenLine size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="bg-gradient-to-br from-[#BF1A1A] to-[#8a1212] rounded-xl shadow-lg p-6 text-white flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl mb-2">Did you know?</h3>
              <p className="text-red-100 text-sm leading-relaxed mb-6">
                You can now import previous semester syllabus data directly into
                new PD drafts to save time.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/creator/create-pd")}
                className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center justify-between px-4 transition-all"
              >
                Draft New Syllabus <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate("/creator/create-pd")}
                className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center justify-between px-4 transition-all"
              >
                Upload Lab Manual <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
