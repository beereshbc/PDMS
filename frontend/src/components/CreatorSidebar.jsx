import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FilePenLine,
  History,
  LogOut,
  FileText,
} from "lucide-react";

const CreatorSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Create New PD",
      path: "/creator/create-pd",
      icon: FilePlus,
    },
    {
      name: "Edit PD",
      path: "/creator/edit-pd",
      icon: FilePenLine,
    },
    {
      name: "PD History",
      path: "/creator/pd-history",
      icon: History,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100">
        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
          <FileText size={18} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">Creator Panel</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Faculty Access
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#BF1A1A] text-white shadow-md shadow-red-100"
                  : "text-gray-600 hover:bg-red-50 hover:text-[#BF1A1A]"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default CreatorSidebar;
