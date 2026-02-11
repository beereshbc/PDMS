import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Code2, ArrowRight, Building2 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Admin Portal",
      description:
        "Manage institutional data, verify creator accounts, and monitor system analytics.",
      icon: ShieldCheck,
      path: "/admin/login",
      color: "bg-slate-900",
      hover: "hover:bg-black",
      accent: "text-slate-900",
      bg: "bg-slate-50",
    },
    {
      title: "Developer Portal",
      description:
        "Access core configuration, API documentation, and infrastructure maintenance tools.",
      icon: Code2,
      path: "/dev/login",
      color: "bg-blue-600",
      hover: "hover:bg-blue-700",
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 md:p-12">
      {/* Branding Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex justify-center mb-4 text-[#BF1A1A]">
          <Building2 size={60} strokeWidth={1.2} />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter">
          CDMS <span className="text-[#BF1A1A]">CORE</span>
        </h1>
        <p className="text-gray-400 mt-3 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs">
          Centralized Digital Management System
        </p>
      </motion.div>

      {/* Choice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {portals.map((portal, index) => (
          <motion.div
            key={portal.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col h-full group transition-all"
          >
            <div
              className={`w-20 h-20 ${portal.bg} ${portal.accent} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}
            >
              <portal.icon size={36} />
            </div>

            <h3 className="text-3xl font-bold text-gray-800 mb-4 tracking-tight">
              {portal.title}
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed mb-10 flex-grow">
              {portal.description}
            </p>

            <button
              onClick={() => navigate(portal.path)}
              className={`w-full py-5 ${portal.color} ${portal.hover} text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95`}
            >
              Authorize Access <ArrowRight size={20} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-24 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-8 bg-gray-300" />
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            GMIT Digital Infrastructure
          </p>
          <div className="h-[1px] w-8 bg-gray-300" />
        </div>
        <p className="text-gray-300 text-[9px] uppercase tracking-tighter">
          Authenticated Environment • © 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Home;
