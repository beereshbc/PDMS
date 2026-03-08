import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Mail,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Save,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Layers,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// ─────────────────────────────────────────────────────────────────────────────
// PREDEFINED UNIVERSITY STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
const UNIVERSITY_STRUCTURE = {
  "Engineering and Technology (FET)": {
    "School of Computer Science and Technology (SCST)": [
      {
        id: "BTECH-CSE",
        code: "BTECH-CSE",
        name: "B.Tech. Computer Science & Engineering",
        department: "Computer Science & Engineering",
        level: "UG",
      },
      {
        id: "MTECH-CSE",
        code: "MTECH-CSE",
        name: "M.Tech. Computer Science & Engineering",
        department: "Computer Science & Engineering",
        level: "PG",
      },
      {
        id: "BTECH-AIML",
        code: "BTECH-AIML",
        name: "B.Tech. Artificial Intelligence & Machine Learning",
        department: "Computer Science & Engineering",
        level: "UG",
      },
    ],
    "School of Core Engineering": [
      {
        id: "BTECH-ECE",
        code: "BTECH-ECE",
        name: "B.Tech. Electronics & Communication",
        department: "Electronics & Communication",
        level: "UG",
      },
      {
        id: "BTECH-MECH",
        code: "BTECH-MECH",
        name: "B.Tech. Mechanical Engineering",
        department: "Mechanical Engineering",
        level: "UG",
      },
      {
        id: "BTECH-CIVIL",
        code: "BTECH-CIVIL",
        name: "B.Tech. Civil Engineering",
        department: "Civil Engineering",
        level: "UG",
      },
    ],
  },
  "Management and Commerce": {
    "School of Business": [
      {
        id: "MBA-GEN",
        code: "MBA-GEN",
        name: "Master of Business Administration",
        department: "Management",
        level: "PG",
      },
      {
        id: "BBA-GEN",
        code: "BBA-GEN",
        name: "Bachelor of Business Administration",
        department: "Management",
        level: "UG",
      },
      {
        id: "BCOM-GEN",
        code: "BCOM-GEN",
        name: "Bachelor of Commerce",
        department: "Commerce",
        level: "UG",
      },
    ],
  },
  "Basic and Applied Sciences": {
    "School of Sciences": [
      {
        id: "BSC-PHY",
        code: "BSC-PHY",
        name: "B.Sc. Physics",
        department: "Physics",
        level: "UG",
      },
      {
        id: "MSC-MATH",
        code: "MSC-MATH",
        name: "M.Sc. Mathematics",
        department: "Mathematics",
        level: "PG",
      },
      {
        id: "BSC-CHEM",
        code: "BSC-CHEM",
        name: "B.Sc. Chemistry",
        department: "Chemistry",
        level: "UG",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

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
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0f172a] outline-none transition-all text-sm bg-gray-50 focus:bg-white"
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
      Password {isLogin && <span className="text-red-500">*</span>}
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
        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0f172a] outline-none transition-all text-sm bg-gray-50 focus:bg-white"
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
);

const CascadeSelect = ({
  label,
  icon: Icon,
  required = false,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  hint = null,
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
        <Icon size={15} />
      </div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full pl-10 pr-9 py-2 border rounded-lg text-sm outline-none transition-all appearance-none focus:ring-2 focus:ring-[#0f172a] ${disabled ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white cursor-pointer"} ${!value ? "text-gray-400" : "text-gray-800"}`}
      >
        <option value="">{disabled ? "—" : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
        <ChevronDown size={14} />
      </div>
    </div>
    {value && (
      <p className="flex items-center gap-1 text-[11px] text-green-600 ml-1">
        <CheckCircle2 size={10} /> Selected
      </p>
    )}
    {hint && !value && !disabled && (
      <p className="flex items-center gap-1 text-[11px] text-amber-500 ml-1">
        <AlertCircle size={10} /> {hint}
      </p>
    )}
  </div>
);

const ReadOnlyChip = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
        {label}
      </span>
      <div
        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium truncate"
        title={value}
      >
        {value}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN LOGIN / REGISTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  // We extract 'axios' (which now auto-appends tokens) and 'setAdminToken'
  const { axios, setAdminToken } = useAppContext();

  // Load base faculties immediately from constant
  const [faculties] = useState(
    Object.keys(UNIVERSITY_STRUCTURE).map((f) => ({ value: f, label: f })),
  );
  const [schools, setSchools] = useState([]);
  const [programmes, setProgrammes] = useState([]);

  const initialFormData = {
    email: "",
    password: "",
    name: "",
    college: "GM University",
    faculty: "",
    school: "",
    programId: "",
    programName: "",
    programme: "",
    department: "",
    discipline: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Automatically update Schools when Faculty changes
  useEffect(() => {
    if (!formData.faculty) {
      setSchools([]);
      setProgrammes([]);
      setFormData((p) => ({
        ...p,
        school: "",
        programId: "",
        programName: "",
        programme: "",
        department: "",
        discipline: "",
      }));
      return;
    }
    const schoolList = Object.keys(
      UNIVERSITY_STRUCTURE[formData.faculty] || {},
    );
    setSchools(schoolList.map((s) => ({ value: s, label: s })));
    setProgrammes([]);
    setFormData((p) => ({
      ...p,
      school: "",
      programId: "",
      programName: "",
      programme: "",
      department: "",
      discipline: "",
    }));
  }, [formData.faculty]);

  // Automatically update Programmes when School changes
  useEffect(() => {
    if (!formData.school || !formData.faculty) {
      setProgrammes([]);
      setFormData((p) => ({
        ...p,
        programId: "",
        programName: "",
        programme: "",
        department: "",
        discipline: "",
      }));
      return;
    }
    const progList =
      UNIVERSITY_STRUCTURE[formData.faculty][formData.school] || [];
    setProgrammes(
      progList.map((p) => ({
        value: p.id,
        label: `${p.name} — ${p.department}`,
        ...p,
      })),
    );
    setFormData((p) => ({
      ...p,
      programId: "",
      programName: "",
      programme: "",
      department: "",
      discipline: "",
    }));
  }, [formData.school, formData.faculty]);

  // Derive program details when a specific program is selected
  const handleProgrammeSelect = useCallback(
    (programId) => {
      const prog = programmes.find((p) => p.value === programId);
      if (!prog) {
        setFormData((p) => ({
          ...p,
          programId: "",
          programName: "",
          programme: "",
          department: "",
          discipline: "",
        }));
        return;
      }

      // Extract Degree abbreviation (e.g. "B.Tech" from "B.Tech. Computer Science")
      const degMatch = prog.name?.match(
        /^(B\.Tech|M\.Tech|B\.E|M\.E|MBA|MCA|BCA|B\.Sc|M\.Sc)/i,
      );
      const degreeLabel = degMatch ? degMatch[0] : prog.name;

      setFormData((p) => ({
        ...p,
        programId: prog.id,
        programName: prog.name,
        department: prog.department,
        programme: degreeLabel,
        discipline: prog.department,
      }));
    },
    [programmes],
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password)
      return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/admin/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (data?.token) {
        // AppContext's useEffect will automatically handle the localStorage save
        setAdminToken(data.token);
        toast.success("Admin login successful!");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name)
      return toast.error("Email, password and name are required");
    if (!formData.faculty) return toast.error("Please select your faculty");
    if (!formData.school) return toast.error("Please select your school");
    if (!formData.programId) return toast.error("Please select your programme");

    setLoading(true);
    try {
      const payload = {};
      Object.keys(formData).forEach((k) => {
        payload[k] = formData[k] ? formData[k].toString().trim() : "";
      });
      const { data } = await axios.post("/api/admin/register", payload);

      if (data.success !== false) {
        toast.success("Admin Registration successful!");
        setFormData(initialFormData);
        setIsLogin(true);
      } else toast.error(data.message || "Registration failed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData(initialFormData);
    setSchools([]);
    setProgrammes([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black p-4">
      <motion.div
        layout
        className={`bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border-t-4 border-[#0f172a] w-full transition-all duration-500 ${isLogin ? "max-w-md" : "max-w-5xl"}`}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-3"
            >
              <Shield className="w-10 h-10 text-[#0f172a]" />
            </motion.div>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-[#0f172a]">
              Admin Portal
            </h2>
            <p className="text-gray-500 text-xs font-semibold tracking-widest mt-1">
              {isLogin ? "SECURE ACCESS" : "REGISTER ADMIN ACCOUNT"}
            </p>
          </div>

          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-6"
          >
            <div
              className={`grid gap-4 ${!isLogin ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
            >
              <FormInput
                label="Admin Email"
                name="email"
                type="email"
                icon={Mail}
                placeholder="admin@gmit.edu.in"
                required
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
                  className="space-y-6 pt-6 border-t border-gray-200 overflow-hidden"
                >
                  {/* Basic Personal Info (Simplified for Admin) */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <User size={11} /> Admin Details
                    </p>
                    <div className="grid grid-cols-1">
                      <FormInput
                        label="Full Name"
                        name="name"
                        icon={User}
                        placeholder="Admin Name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Institutional Affiliation */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Building2 size={11} /> Administrative Affiliation
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <CascadeSelect
                        label="Faculty"
                        icon={Layers}
                        required
                        value={formData.faculty}
                        onChange={(v) => setField("faculty", v)}
                        options={faculties}
                        placeholder="Select Faculty…"
                        hint="Select institutional faculty"
                      />
                      <CascadeSelect
                        label="School"
                        icon={Building2}
                        required
                        value={formData.school}
                        onChange={(v) => setField("school", v)}
                        options={schools}
                        disabled={!formData.faculty}
                        placeholder={
                          formData.faculty
                            ? "Select School…"
                            : "Select faculty first"
                        }
                        hint="Available after selecting a faculty"
                      />
                    </div>

                    <CascadeSelect
                      label="Programme / Department"
                      icon={GraduationCap}
                      required
                      value={formData.programId}
                      onChange={handleProgrammeSelect}
                      options={programmes}
                      disabled={!formData.school}
                      placeholder={
                        formData.school
                          ? "Select Programme…"
                          : "Select school first"
                      }
                      hint="Available after selecting a school"
                    />

                    {formData.programId && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
                      >
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Selected Department Scope
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <ReadOnlyChip
                            label="Programme ID"
                            value={formData.programId}
                          />
                          <ReadOnlyChip
                            label="Programme"
                            value={formData.programme}
                          />
                          <ReadOnlyChip
                            label="Department"
                            value={formData.department}
                          />
                          <ReadOnlyChip
                            label="Discipline"
                            value={formData.discipline}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing…
                </>
              ) : isLogin ? (
                <>
                  Secure Login <LogIn size={18} />
                </>
              ) : (
                <>
                  Register Admin <Save size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm">
              {isLogin
                ? "Need a new admin account?"
                : "Already have an admin account?"}
              <button
                type="button"
                onClick={toggleForm}
                className="ml-2 text-[#0f172a] font-bold hover:underline focus:outline-none"
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

export default AdminLogin;
