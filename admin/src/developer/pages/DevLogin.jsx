import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Terminal, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppDevContext } from "../context/AppContext";

const DevLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { axios, setDevToken } = useAppDevContext();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loginSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/dev/login", formData);
      if (data?.token) {
        localStorage.setItem("devToken", data.token);
        setDevToken(data.token);
        toast.success("Login successful!");
        navigate("/dev/dashboard");
      }
    } catch (error) {
      if (!error.response) {
        toast.error("Network Error: Server might be down");
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 w-full max-w-md transition-all duration-500"
      >
        {/* Top Header Bar - Matching Creator Theme */}
        <div className="bg-[#BF1A1A] p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-2"
          >
            <Terminal size={32} />
          </motion.div>
          <h2 className="text-2xl font-bold italic uppercase tracking-wider">
            Dev Console
          </h2>
          <p className="text-red-100 text-xs opacity-80 uppercase tracking-widest mt-1">
            Developer Authentication
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={loginSubmitHandler} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                System Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="dev@institution.edu"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                Access Cipher <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#BF1A1A] text-white py-3 rounded-xl font-bold hover:bg-[#9f1414] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  Establish Connection <ShieldCheck size={18} />
                </>
              )}
            </button>
          </form>

          {/* Form Switcher / Footer */}
          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-gray-500 text-xs font-bold hover:text-[#BF1A1A] transition-colors uppercase tracking-widest"
            >
              &larr; Return to Gateway
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DevLogin;
