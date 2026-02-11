import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  ShieldCheck,
  GraduationCap,
  Library,
  Database,
  Users,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // The requested hex color
  const primaryColor = "#BF1A1A";

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* ================= HERO SECTION ================= */}
      <header className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://www.gmit.ac.in/images/college1.jpg')",
          }}
        ></div>

        {/* Gradient Overlay - #BF1A1A to Transparent */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#000]/10 via-[#000]/40 to-[#BF1A1A]/20"></div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              System Operational
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-xl">
              CDMS <span className="font-light opacity-90">Portal</span>
            </h1>

            <p className="text-xl md:text-2xl text-red-50 mb-10 font-light max-w-3xl mx-auto leading-relaxed">
              The centralized{" "}
              <strong className="font-semibold text-white">
                Course Document Management System
              </strong>
              . A unified platform designed for the creation, storage, and
              auditing of
              <span className="font-semibold text-white"> B.Tech</span> &
              <span className="font-semibold text-white"> M.Tech</span>{" "}
              curriculum assets.
            </p>

            {/* Login Buttons Only */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-[#BF1A1A] hover:bg-gray-100 text-lg font-bold rounded-lg shadow-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Users size={20} />
                Creator Login
              </motion.button>

              <motion.button
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg font-bold rounded-lg shadow-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Lock size={20} />
                Admin Login
              </motion.button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ================= SYSTEM USAGE OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Usage & Capabilities
            </h2>
            <div className="h-1 w-24 bg-[#BF1A1A] mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Designed to maintain the academic integrity of the institution
              through structured workflows and secure data handling.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Usage 1 */}
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#BF1A1A]/30 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-[#BF1A1A]/10 text-[#BF1A1A] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#BF1A1A] group-hover:text-white transition-colors duration-300">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Syllabus Management
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Used for the drafting and revision of course syllabi. Faculty
                can version-control changes to ensure alignment with university
                standards.
              </p>
            </motion.div>

            {/* Usage 2 */}
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#BF1A1A]/30 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-[#BF1A1A]/10 text-[#BF1A1A] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#BF1A1A] group-hover:text-white transition-colors duration-300">
                <Database size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Digital Repository
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Acts as the central archival system for lesson plans, lab
                manuals, and question banks, eliminating data redundancy.
              </p>
            </motion.div>

            {/* Usage 3 */}
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#BF1A1A]/30 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-[#BF1A1A]/10 text-[#BF1A1A] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#BF1A1A] group-hover:text-white transition-colors duration-300">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Access Control
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Restricted access environments for HODs and Deans to approve
                curriculum changes before they are published to the student
                body.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= PROGRAM SCOPE OVERVIEW ================= */}
      {/* Changed from interactive cards to Informational Cards (No buttons) */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-b border-gray-200 pb-6">
            <h2 className="text-3xl font-bold text-[#BF1A1A]">
              Supported Programs
            </h2>
            <p className="mt-2 text-gray-600">
              The platform currently manages documentation for the following
              streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* B.Tech Info Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border-t-4 border-[#BF1A1A]"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-50 rounded-lg text-[#BF1A1A]">
                    <GraduationCap size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">B.Tech</h3>
                    <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Bachelor of Technology
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Full curriculum mapping for 4-year undergraduate programs.
                  Includes semester-wise credit distribution and elective
                  management.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                    Active Departments
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Computer Science
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Electronics & Comm.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Mechanical Eng.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Civil Engineering
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* M.Tech Info Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border-t-4 border-[#BF1A1A]"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-50 rounded-lg text-[#BF1A1A]">
                    <Library size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">M.Tech</h3>
                    <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                      Master of Technology
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Advanced documentation for postgraduate research and
                  specialization streams. Includes thesis tracking and
                  publication records.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">
                    Active Specializations
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Advanced Computing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      VLSI Design
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Structural Eng.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BF1A1A]"></span>
                      Machine Design
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER REMOVED AS REQUESTED */}
    </div>
  );
};

export default Home;
