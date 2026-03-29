import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FilePenLine, // Added for Edit CD
  History,
  LogOut,
  FileText,
  Menu,
  DockIcon,
} from "lucide-react";

const CreatorSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // State to manage sidebar expansion
  const [isExpanded, setIsExpanded] = useState(false);

  // Optional: Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Edit PD",
      path: "/creator/create-pd",
      icon: FilePlus,
    },
    {
      name: "Edit CD",
      path: "/creator/edit-cd",
      icon: FilePenLine, // Navigates to the new Edit CD page
    },
    {
      name: "PD History",
      path: "/creator/pd-history",
      icon: History,
    },
    {
      name: "CD History",
      path: "/creator/cd-history",
      icon: DockIcon,
    },
  ];

  return (
    <aside
      className={`h-screen flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm relative z-50 ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Brand Header & Toggle */}
      <div
        className={`h-20 flex items-center border-b border-gray-100 transition-all duration-300 ${
          isExpanded ? "px-6 gap-3" : "justify-center"
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 bg-red-50 text-[#BF1A1A] hover:bg-red-100 rounded-lg flex items-center justify-center font-bold transition-colors flex-shrink-0"
          title="Toggle Menu"
        >
          {isExpanded ? <FileText size={20} /> : <Menu size={22} />}
        </button>

        {/* Brand Text - Only visible when expanded */}
        <div
          className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
          }`}
        >
          <h1 className="font-bold text-gray-900 text-lg leading-tight">
            Creator Panel
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            Faculty Access
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
              title={!isExpanded ? item.name : ""} // Show tooltip when collapsed
              className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                isExpanded
                  ? "justify-start px-4 py-3 gap-3"
                  : "justify-center py-3"
              } ${
                isActive
                  ? "bg-[#BF1A1A] text-white shadow-md shadow-red-200"
                  : "text-gray-600 hover:bg-red-50 hover:text-[#BF1A1A]"
              }`}
            >
              <div className="flex-shrink-0">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Link Text - Only visible when expanded */}
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  isExpanded
                    ? "w-auto opacity-100 translate-x-0"
                    : "w-0 opacity-0 -translate-x-4 hidden"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-gray-100">
        <button
          title={!isExpanded ? "Logout" : ""}
          className={`flex items-center text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full ${
            isExpanded ? "justify-start px-4 py-3 gap-3" : "justify-center py-3"
          }`}
        >
          <LogOut size={22} className="flex-shrink-0" />
          <span
            className={`whitespace-nowrap transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default CreatorSidebar;
