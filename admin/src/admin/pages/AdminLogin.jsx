import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { axios, setCreaterToken } = useAppContext();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loginSubmitHandler = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/api/admin/login", formData);

      if (data?.token) {
        localStorage.setItem("adminToken", data.token);
        setCreaterToken(data.token); // recommended to split into setAdminToken later
        toast.success("Admin login successful");
        navigate("/admin/dashboard");
      } else {
        toast.error("Invalid login response");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/95 backdrop-blur p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-[#0f172a]"
      >
        <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-[#0f172a]">
          <Shield className="w-7 h-7" /> Admin Login
        </h2>

        <form onSubmit={loginSubmitHandler} className="space-y-6">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Admin Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full bg-[#0f172a] text-white py-3 rounded-xl font-semibold hover:bg-black transition"
          >
            {loading ? "Authenticating..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
