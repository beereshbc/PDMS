import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Search,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Mail,
  RefreshCw,
  Power, // Added for Active/Inactive toggle
  Ban, // Alternative icon for inactive
} from "lucide-react";

// --- MOCK API SERVICE ---
const getAdminList = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return [
    {
      id: 1,
      user_name: "admin_anjali",
      name: "Dr. Anjali Gupta",
      email: "anjali.g@gmit.edu",
      mobile_no: "9876543210",
      college: "GMIT",
      faculty: "CSE",
      role: "admin",
      status: "active",
      blocked: 0,
      last_updated: "2024-03-10T10:30:00Z",
    },
    {
      id: 2,
      user_name: "admin_raj",
      name: "Prof. Raj Kumar",
      email: "raj.k@gmit.edu",
      mobile_no: "9123456780",
      college: "GMIT",
      faculty: "ECE",
      role: "admin",
      status: "active",
      blocked: 1,
      last_updated: "2024-03-09T14:15:00Z",
    },
    {
      id: 3,
      user_name: "admin_priya",
      name: "Dr. Priya Sharma",
      email: "priya.s@gmit.edu",
      mobile_no: "9988776655",
      college: "GMIT",
      faculty: "ME",
      role: "admin",
      status: "inactive",
      blocked: 0,
      last_updated: "2024-02-28T09:00:00Z",
    },
  ];
};

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminList();
      setAdmins(data);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---

  // 1. Handle Block/Unblock (Security Lock)
  const toggleBlockStatus = async (id, currentStatus) => {
    const action = currentStatus === 1 ? "Unblock" : "Block";
    if (window.confirm(`Are you sure you want to ${action} this admin?`)) {
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === id
            ? { ...admin, blocked: currentStatus === 1 ? 0 : 1 }
            : admin,
        ),
      );
      // API call would go here
    }
  };

  // 2. Handle Active/Inactive (Status Toggle)
  const toggleActiveStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = currentStatus === "active" ? "Deactivate" : "Activate";

    if (window.confirm(`Are you sure you want to ${action} this account?`)) {
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === id ? { ...admin, status: newStatus } : admin,
        ),
      );
      // API call would go here
    }
  };

  // 3. Handle Delete (Permanent Removal)
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "CRITICAL: Are you sure you want to delete this admin permanently? This action cannot be undone.",
      )
    ) {
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      // API call would go here
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.faculty.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#BF1A1A]">Admin List</h2>
            <p className="text-gray-500 mt-1">
              Manage administrator access, status, and permissions.
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
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none"
              />
            </div>

            <button
              onClick={fetchAdmins}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              title="Refresh List"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Admin Profile</th>
                  <th className="px-6 py-4">Institute Details</th>
                  <th className="px-6 py-4 text-center">Account Status</th>
                  <th className="px-6 py-4 text-center">Block Access</th>
                  <th className="px-6 py-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading admin data...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No admins found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-red-50/30 transition-colors group"
                    >
                      {/* 1. Profile Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#BF1A1A]/10 text-[#BF1A1A] flex items-center justify-center font-bold text-lg">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {admin.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail size={10} /> {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Institute Details */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{admin.college}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          {admin.faculty}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          ID: {admin.user_name}
                        </div>
                      </td>

                      {/* 3. Account Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            admin.blocked
                              ? "bg-red-100 text-red-700 border-red-200"
                              : admin.status === "active"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {admin.blocked ? (
                            <>
                              <ShieldAlert size={12} /> BLOCKED
                            </>
                          ) : admin.status === "active" ? (
                            <>
                              <ShieldCheck size={12} /> ACTIVE
                            </>
                          ) : (
                            <>
                              <Ban size={12} /> INACTIVE
                            </>
                          )}
                        </span>
                      </td>

                      {/* 4. Block/Unblock Toggle */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleBlockStatus(admin.id, admin.blocked)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            admin.blocked ? "bg-red-500" : "bg-gray-300"
                          }`}
                          title={admin.blocked ? "Unblock User" : "Block User"}
                        >
                          <span
                            className={`${
                              admin.blocked ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                          />
                        </button>
                      </td>

                      {/* 5. Controls (Activate/Deactivate + Delete) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Active/Inactive Toggle Button */}
                          <button
                            onClick={() =>
                              toggleActiveStatus(admin.id, admin.status)
                            }
                            className={`p-2 rounded-lg transition-all opacity-80 hover:opacity-100 ${
                              admin.status === "active"
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:bg-gray-100"
                            }`}
                            title={
                              admin.status === "active"
                                ? "Deactivate Account"
                                : "Activate Account"
                            }
                          >
                            <Power size={18} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 text-gray-400 hover:text-[#BF1A1A] hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Admin"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
            <span>Showing {filteredAdmins.length} admins</span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
                disabled
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminList;
