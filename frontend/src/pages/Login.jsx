import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Building2,
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// --- HELPERS DEFINED OUTSIDE TO PREVENT REMOUNTING ON KEYSTROKE ---

const FormInput = ({
  label,
  name,
  type = "text",
  icon: Icon,
  placeholder,
  required = false,
  value,
  onChange,
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none transition-all text-sm"
      />
    </div>
  </div>
);

const PasswordInput = ({
  value,
  onChange,
  showPassword,
  setShowPassword,
  isLogin,
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
      Password {isLogin ? <span className="text-red-500">*</span> : ""}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Lock size={16} />
      </div>
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        value={value || ""}
        onChange={onChange}
        required={isLogin}
        placeholder="••••••••"
        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none transition-all text-sm"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { axios, setCreaterToken } = useAppContext();

  const initialFormData = {
    email: "",
    password: "",
    name: "",
    mobile_no: "",
    aadhar: "",
    designation: "",
    college: "",
    school: "",
    faculty: "",
    programme: "",
    discipline: "",
    course: "",

    category: "",
    role: "creator",
    status: "inactive",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Please fill all fields");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/creater/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (data?.token) {
        localStorage.setItem("createrToken", data.token);
        setCreaterToken(data.token);
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      return toast.error(
        "Please fill in required fields (Email, Password, Name)",
      );
    }

    setLoading(true);
    try {
      const cleanedData = {};
      Object.keys(formData).forEach((key) => {
        cleanedData[key] = formData[key] ? formData[key].toString().trim() : "";
      });

      await axios.post("/api/creater/register", cleanedData);

      toast.success("Registration request submitted!");
      toast("Your account is pending approval from the admin/developer.", {
        icon: "⏳",
        duration: 6000,
        style: { border: "1px solid #BF1A1A", color: "#BF1A1A" },
      });

      setFormData(initialFormData);
      setIsLogin(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData(initialFormData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        layout
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 w-full transition-all duration-500 ${
          isLogin ? "max-w-md" : "max-w-5xl"
        }`}
      >
        <div className="bg-[#BF1A1A] p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-2"
          >
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </motion.div>
          <h2 className="text-2xl font-bold italic uppercase tracking-wider">
            CDMS Creator
          </h2>
          <p className="text-red-100 text-xs opacity-80 uppercase tracking-widest mt-1">
            {isLogin ? "Access your dashboard" : "Register for an account"}
          </p>
        </div>

        <div className="p-8">
          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-6"
          >
            <div
              className={`grid gap-4 ${!isLogin ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
            >
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                placeholder="name@gmit.edu.in"
                required={true}
                value={formData.email}
                onChange={handleChange}
              />
              <PasswordInput
                value={formData.password}
                onChange={handleChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isLogin={isLogin}
              />
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-6 border-t border-gray-100 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormInput
                      label="Full Name"
                      name="name"
                      icon={User}
                      placeholder="John Doe"
                      required={true}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Mobile"
                      name="mobile_no"
                      icon={Phone}
                      placeholder="9876543210"
                      value={formData.mobile_no}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Aadhar"
                      name="aadhar"
                      icon={CreditCard}
                      placeholder="12 Digit UID"
                      value={formData.aadhar}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Designation"
                      name="designation"
                      icon={Briefcase}
                      placeholder="Professor"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="College"
                      name="college"
                      icon={Building2}
                      placeholder="College Name"
                      value={formData.college}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="School"
                      name="school"
                      icon={Building2}
                      placeholder="School Name"
                      value={formData.school}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Faculty"
                      name="faculty"
                      icon={Building2}
                      placeholder="Faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <FormInput
                      label="Programme"
                      name="programme"
                      icon={GraduationCap}
                      placeholder="B.Tech"
                      value={formData.programme}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Discipline"
                      name="discipline"
                      icon={BookOpen}
                      placeholder="CSE"
                      value={formData.discipline}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Course"
                      name="course"
                      icon={BookOpen}
                      placeholder="Operating Systems"
                      value={formData.course}
                      onChange={handleChange}
                    />

                    <FormInput
                      label="Category"
                      name="category"
                      icon={Briefcase}
                      placeholder="Teaching"
                      value={formData.category}
                      onChange={handleChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#BF1A1A] text-white py-3 rounded-xl font-bold hover:bg-[#9f1414] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {isLogin ? "Login Now" : "Request Creator Access"}
                  {isLogin ? <LogIn size={18} /> : <Save size={18} />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <p className="text-gray-500 text-sm">
              {isLogin ? "Need a creator account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleForm}
                className="ml-2 text-[#BF1A1A] font-bold hover:underline focus:outline-none"
              >
                {isLogin ? "Register Here" : "Login Here"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
