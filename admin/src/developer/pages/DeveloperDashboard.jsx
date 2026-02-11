import React from "react";
import Layout from "../components/Layout";
import { ShieldCheck, PenTool, Users } from "lucide-react";

const DeveloperDashboard = () => {
  // Mock Data (In a real app, fetch this from your API)
  const stats = {
    totalAdmins: 8,
    totalCreators: 42,
  };

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-8">
        {/* 1. Welcome & Header Section */}
        <div className="mt-4">
          <h1 className="text-4xl font-bold text-[#BF1A1A] mb-2">
            Welcome, Developer
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Control Center for CDMS Administration
          </p>
        </div>

        {/* 2. Platform Overview Section */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            System Overview
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg max-w-4xl">
            This dashboard serves as the root command center for the
            <strong> Course Document Management System (CDMS)</strong>. As a
            developer/super-admin, you have full authority to:
          </p>
          <ul className="mt-6 space-y-3 text-gray-600 list-disc list-inside">
            <li>Manage global access permissions and security protocols.</li>
            <li>
              Onboard and audit <strong>Administrators</strong> and{" "}
              <strong>Content Creators</strong>.
            </li>
            <li>Monitor the integrity of B.Tech and M.Tech curriculum data.</li>
            <li>Override system locks and manage user blocklists.</li>
          </ul>
        </div>

        {/* 3. Simple Stats Cards (Bottom) */}
        <div className="mt-auto pt-4">
          <h3 className="text-lg font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            Current User Statistics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Stats Card */}
            <div className="bg-white p-8 rounded-xl border-l-4 border-[#BF1A1A] shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm uppercase">
                  Total Administrators
                </p>
                <p className="text-5xl font-bold text-[#BF1A1A] mt-2">
                  {stats.totalAdmins}
                </p>
                <p className="text-xs text-gray-400 mt-2">Full System Access</p>
              </div>
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-[#BF1A1A]">
                <ShieldCheck size={32} />
              </div>
            </div>

            {/* Creator Stats Card */}
            <div className="bg-white p-8 rounded-xl border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm uppercase">
                  Total Creators
                </p>
                <p className="text-5xl font-bold text-orange-600 mt-2">
                  {stats.totalCreators}
                </p>
                <p className="text-xs text-gray-400 mt-2">Faculty & Staff</p>
              </div>
              <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <PenTool size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DeveloperDashboard;
