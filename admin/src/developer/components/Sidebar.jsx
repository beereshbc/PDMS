import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ShieldAlert,
  LogOut,
  Lock,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  // In a real app, useLocation would determine the active style
  // For this demo, I'll mock the location path
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      name: "Dashboard & Controls",
      icon: LayoutDashboard,
      path: "/dev/dashboard",
    },
    { name: "Add Admin", icon: ShieldAlert, path: "/dev/add-admin" },
    { name: "Add Creator", icon: UserPlus, path: "/dev/add-creator" },
    { name: "Admin List", icon: Lock, path: "/dev/admin-list" },
    { name: "Creator List", icon: Users, path: "/dev/creator-list" },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-8 border-b border-gray-100">
        <div className="w-8 h-8 bg-[#BF1A1A] rounded-lg flex items-center justify-center text-white font-bold">
          D
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">CDMS Dev</h1>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Super Access
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
                  ? "bg-[#BF1A1A] text-white shadow-md shadow-red-200"
                  : "text-gray-600 hover:bg-red-50 hover:text-[#BF1A1A]"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout Section */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
