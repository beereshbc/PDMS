import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Menu, Bell } from "lucide-react";

const AdminLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Component */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-20">
        {/* Mobile Header (Visible only on small screens) */}
        <header className="lg:hidden bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <Menu size={24} />
            </button>
            <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-50 border border-blue-100 rounded flex items-center justify-center text-blue-600 text-sm font-bold shadow-sm">
                A
              </span>
              Admin Portal
            </div>
          </div>

          {/* Quick Actions / Notifications */}
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
