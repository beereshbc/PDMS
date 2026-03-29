import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileSignature,
  Library,
  Layers,
  Image as ImageIcon,
  LogOut,
  X,
} from "lucide-react";
import { useAppContext } from "../../admin/context/AppContext";

const AdminSidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { adminLogout } = useAppContext();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "PD Reviews", icon: FileSignature, path: "/admin/pd-reviews" },
    { name: "CD Reviews", icon: Library, path: "/admin/cd-reviews" },
    { name: "Curriculum Compiler", icon: Layers, path: "/admin/compiler" },
    { name: "Static Assets", icon: ImageIcon, path: "/admin/assets" },
  ];

  return (
    <>
      {/* Mobile Overlay Background - Warm blur */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-stone-900/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-stone-200 flex flex-col text-stone-600 transition-all duration-300 ease-in-out z-50 shadow-2xl shadow-amber-900/5 lg:shadow-none
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"} 
        lg:w-20 hover:lg:w-64 group overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="h-16 lg:h-20 flex items-center justify-between lg:justify-start group-hover:justify-start gap-4 px-6 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-700 font-bold shadow-sm flex-shrink-0">
              A
            </div>
            <div className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <h1 className="font-bold text-stone-800 text-lg tracking-wide">
                CDMS Admin
              </h1>
              <p className="text-[10px] text-amber-600 uppercase tracking-widest font-bold">
                Control Panel
              </p>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-stone-400 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                title={item.name}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group/link ${
                  isActive
                    ? "bg-amber-50 text-amber-800 shadow-sm border border-amber-100/50"
                    : "text-stone-500 hover:bg-stone-50 hover:text-amber-700"
                }`}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    isActive ? "text-amber-700" : "group-hover/link:scale-110"
                  }`}
                />
                <span className="opacity-100 lg:opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-stone-100 flex-shrink-0">
          <button
            onClick={handleLogout}
            title="Secure Logout"
            className="flex items-center gap-4 w-full px-3 py-3.5 text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors overflow-hidden group/logout"
          >
            <LogOut
              size={22}
              className="flex-shrink-0 transition-transform group-hover/logout:-translate-x-0.5"
            />
            <span className="opacity-100 lg:opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
              Secure Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
