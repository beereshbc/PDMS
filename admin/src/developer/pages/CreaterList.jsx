import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { toast } from "react-hot-toast";

import {
  Search,
  Trash2,
  ShieldAlert,
  CheckCircle,
  PenTool,
  Mail,
  RefreshCw,
  Ban,
  Power,
} from "lucide-react";
import { useAppContext } from "../../admin/context/AppContext";

const CreaterList = () => {
  const [creators, setCreators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { axios } = useAppContext(); // Get axios from context

  useEffect(() => {
    fetchCreators();
  }, []);

  // --- API CALLS ---

  const fetchCreators = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/dev/list");
      if (data.success) {
        setCreators(data.creators);
      }
    } catch (error) {
      toast.error("Failed to load creators");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlockStatus = async (id, currentBlocked) => {
    const action = currentBlocked ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${action} this creator?`))
      return;

    try {
      const { data } = await axios.put(`/api/dev/update/${id}`, {
        blocked: !currentBlocked,
      });
      if (data.success) {
        toast.success(`Creator ${action}ed`);
        setCreators((prev) =>
          prev.map((c) => (c._id === id ? data.creator : c)),
        );
      }
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const toggleActiveStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const { data } = await axios.put(`/api/dev/update/${id}`, {
        status: newStatus,
      });
      if (data.success) {
        toast.success(`Creator set to ${newStatus}`);
        setCreators((prev) =>
          prev.map((c) => (c._id === id ? data.creator : c)),
        );
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("CRITICAL: Delete this creator? This cannot be undone.")
    )
      return;

    try {
      const { data } = await axios.delete(`/api/dev/delete/${id}`);
      if (data.success) {
        toast.success("Creator removed");
        setCreators((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- FILTER LOGIC ---
  const filteredCreators = creators.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.faculty?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header (Same as your UI) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#BF1A1A]">Creator List</h2>
            <p className="text-gray-500 mt-1">
              Manage faculty accounts and permissions.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#BF1A1A]"
              />
            </div>
            <button
              onClick={fetchCreators}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Table (Updated keys to match MongoDB _id) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Profile</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Block</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredCreators.map((creator) => (
                    <tr
                      key={creator._id}
                      className="hover:bg-red-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-[#BF1A1A] flex items-center justify-center">
                            <PenTool size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {creator.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {creator.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {creator.faculty} | {creator.college}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            creator.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {creator.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleBlockStatus(creator._id, creator.blocked)
                          }
                          className={`w-10 h-5 rounded-full relative transition-colors ${creator.blocked ? "bg-red-500" : "bg-gray-300"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${creator.blocked ? "left-5" : "left-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleActiveStatus(creator._id, creator.status)
                          }
                          className={`p-2 rounded-lg ${creator.status === "active" ? "text-green-600" : "text-gray-400"}`}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(creator._id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreaterList;
