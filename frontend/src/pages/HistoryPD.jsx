import React, { useState, useEffect } from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Search,
  FileText,
  Calendar,
  Clock,
  Eye,
  Edit,
  Filter,
  Printer, // Added Printer Icon
  ChevronRight,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const HistoryPD = () => {
  const { axios, createrToken } = useAppContext();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, statusFilter, documents]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get("/api/creater/pd/history", {
        headers: { createrToken },
      });
      if (data.success) {
        setDocuments(data.pds);
        setFilteredDocs(data.pds);
      }
    } catch (error) {
      console.error("History fetch error:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let temp = [...documents];

    if (statusFilter !== "All") {
      temp = temp.filter((doc) => doc.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      temp = temp.filter(
        (doc) =>
          doc.programCode.toLowerCase().includes(lowerTerm) ||
          (doc.section1_info?.programName || "")
            .toLowerCase()
            .includes(lowerTerm),
      );
    }

    setFilteredDocs(temp);
  };

  // --- ACTIONS ---

  // 1. Edit: Navigates to CreatePD with ID. CreatePD will auto-fetch.
  const handleEdit = (docId) => {
    navigate("/creator/create-pd", { state: { loadId: docId } });
  };

  // 2. Preview: Navigates to PreviewPD with ID. PreviewPD will auto-fetch.
  const handlePreview = (docId) => {
    navigate("/creator/preview", { state: { loadId: docId } });
  };

  // 3. Print: Navigates to PreviewPD with ID and a flag to auto-print.
  const handlePrint = (docId) => {
    navigate("/creator/preview", { state: { loadId: docId, autoPrint: true } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "UnderReview":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Document History
            </h1>
            <p className="text-gray-500 text-sm">
              Manage and track all versions of your Program Documents.
            </p>
          </div>
          <Link
            to="/creator/create-pd"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileText size={18} /> Create New
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Program Code or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="UnderReview">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading history...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No documents found
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Program Information
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ver / Scheme
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc._id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {doc.programCode}
                          </span>
                          <span className="text-sm text-gray-500 truncate max-w-[200px]">
                            {doc.section1_info?.programName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 w-fit">
                            v{doc.pdVersion}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {doc.schemeYear}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* PRINT BUTTON */}
                          <button
                            onClick={() => handlePrint(doc._id)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Direct Print"
                          >
                            <Printer size={18} />
                          </button>

                          {/* PREVIEW BUTTON */}
                          <button
                            onClick={() => handlePreview(doc._id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleEdit(doc._id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
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

export default HistoryPD;
