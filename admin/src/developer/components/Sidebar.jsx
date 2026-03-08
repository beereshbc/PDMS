import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ShieldAlert,
  LogOut,
  Lock,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDevContext } from "../context/AppContext"; // Adjust path if necessary

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Grab the logout function from your context
  const { logout } = useAppDevContext();

  const handleLogout = () => {
    logout(); // Clears token from context and localStorage
    navigate("/dev/login"); // Redirect back to dev login page
  };

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
    <aside className="fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 w-20 hover:w-64 lg:w-64 group overflow-hidden">
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-center lg:justify-start group-hover:justify-start gap-4 px-6 border-b border-gray-100 flex-shrink-0 transition-all duration-300">
        <div className="w-8 h-8 bg-[#BF1A1A] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
          D
        </div>
        <div className="opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <h1 className="font-bold text-gray-900 text-lg">CDMS Dev</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            Super Access
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={item.name} // Tooltip when collapsed
              className={`flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#BF1A1A] text-white shadow-md shadow-red-200"
                  : "text-gray-600 hover:bg-red-50 hover:text-[#BF1A1A]"
              }`}
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className="flex-shrink-0"
              />
              <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout Section */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-4 w-full px-3 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors overflow-hidden"
        >
          <LogOut size={22} className="flex-shrink-0" />
          <span className="opacity-0 lg:opacity-100 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
