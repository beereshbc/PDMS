import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FilePenLine,
  History,
  LogOut,
  FileText,
  Menu,
  DockIcon,
  User,
  Building2,
  GraduationCap,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const CreatorSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  // Context for global state
  const { setCreaterToken, createrToken } = useAppContext();

  // Sidebar and Profile State
  const [isExpanded, setIsExpanded] = useState(false);
  const [createrData, setCreaterData] = useState(null);

  // Auto-collapse on small screens
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

  // Fetch Creator Profile
  const fetchCreater = async () => {
    try {
      // 1. Grab the token from context or fallback to localStorage
      const token = createrToken || localStorage.getItem("createrToken");

      if (!token) {
        console.warn("No creator token found");
        return;
      }

      // 2. Pass exactly "creatertoken" in the headers to match your backend middleware
      const { data } = await axios.get("/api/creater/profile", {
        headers: {
          creatertoken: token,
        },
      });

      // 3. Check for success and set the state using data.profile
      if (data.success) {
        setCreaterData(data.profile); // Matches res.json({ profile: creater })
      } else {
        toast.error(data.message || "Failed to load profile details.");
      }
    } catch (error) {
      console.error("Failed to fetch creator profile:", error);
      toast.error("Server error while fetching profile.");
    }
  };

  // Call this inside a useEffect when the component mounts
  useEffect(() => {
    fetchCreater();
  }, [createrToken]);

  // --- Logout Function ---
  const handleLogout = () => {
    localStorage.removeItem("createrToken");
    setCreaterToken(null);
    navigate("/login");
  };

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
      icon: FilePenLine,
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

  // Helper to get initials for the avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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
              title={!isExpanded ? item.name : ""}
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

      {/* Bottom Section: Profile & Logout */}
      <div className="border-t border-gray-100 p-3 space-y-2 relative">
        {/* Profile Hover Trigger */}
        <div className="group relative">
          <div
            className={`flex items-center cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gray-50 ${
              isExpanded ? "justify-start p-2 gap-3" : "justify-center py-2"
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#BF1A1A] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              {getInitials(createrData?.name)}
            </div>

            {/* Basic Info (Visible when expanded) */}
            <div
              className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isExpanded ? "w-full opacity-100" : "w-0 opacity-0 hidden"
              }`}
            >
              <span className="text-sm font-bold text-gray-800 truncate">
                {createrData?.name || "Loading..."}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {createrData?.designation || "Faculty"}
              </span>
            </div>
          </div>

          {/* Enlarged Profile Popover (Appears on Hover) */}
          {createrData && (
            <div className="absolute bottom-0 left-full ml-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] translate-x-2 group-hover:translate-x-0">
              {/* Popover Header */}
              <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                <div className="w-14 h-14 rounded-full bg-red-50 text-[#BF1A1A] flex items-center justify-center text-xl font-bold border border-red-100">
                  {getInitials(createrData?.name)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-gray-900 text-lg truncate">
                    {createrData.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {createrData.email}
                  </p>
                </div>
              </div>

              {/* Popover Body */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User
                    className="text-[#BF1A1A] mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Designation
                    </p>
                    <p className="text-sm text-gray-700 font-medium leading-tight">
                      {createrData.designation || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap
                    className="text-[#BF1A1A] mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Department
                    </p>
                    <p className="text-sm text-gray-700 font-medium leading-tight">
                      {createrData.department || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2
                    className="text-[#BF1A1A] mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Faculty / School
                    </p>
                    <p className="text-sm text-gray-700 font-medium leading-tight">
                      {createrData.school || createrData.faculty || "N/A"}
                    </p>
                  </div>
                </div>

                {createrData.programName && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 text-center font-medium bg-gray-50 p-1 rounded">
                      Program: {createrData.programName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={!isExpanded ? "Logout" : ""}
          className={`flex items-center text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full ${
            isExpanded
              ? "justify-start px-4 py-2.5 gap-3"
              : "justify-center py-2.5"
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
