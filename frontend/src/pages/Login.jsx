import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// ─────────────────────────────────────────────────────────────────────────────
// PREDEFINED UNIVERSITY STRUCTURE
// Add/Edit schools and programs here to instantly reflect across the app
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
// COMPONENTS
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
        className={`w-full pl-10 pr-9 py-2 border rounded-lg text-sm outline-none transition-all appearance-none focus:ring-2 focus:ring-[#BF1A1A] ${disabled ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed" : "border-gray-200 bg-white cursor-pointer"} ${!value ? "text-gray-400" : "text-gray-800"}`}
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
// MAIN LOGIN / REGISTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { axios, setCreaterToken } = useAppContext();

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
    mobile_no: "",
    aadhar: "",
    designation: "",
    category: "",
    college: "GM University",
    faculty: "",
    school: "",
    programId: "",
    programName: "",
    programme: "",
    department: "",
    discipline: "",
    course: "",
    role: "creator",
    status: "inactive",
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
        course: "",
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
      course: "",
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
        course: "",
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
      course: "",
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
          course: "",
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
        course: prog.department, // Legacy map
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
      const { data } = await axios.post("/api/creater/register", payload);

      if (data.success !== false) {
        toast.success("Registration request submitted!");
        toast("Your account is pending admin approval.", {
          icon: "⏳",
          duration: 6000,
          style: { border: "1px solid #BF1A1A", color: "#BF1A1A" },
        });
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        layout
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 w-full transition-all duration-500 ${isLogin ? "max-w-md" : "max-w-5xl"}`}
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
                  className="space-y-6 pt-6 border-t border-gray-100 overflow-hidden"
                >
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <User size={11} /> Personal Details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormInput
                        label="Full Name"
                        name="name"
                        icon={User}
                        placeholder="Dr. John Doe"
                        required
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
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                          Designation
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Briefcase size={15} />
                          </div>
                          <select
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none transition-all appearance-none focus:ring-2 focus:ring-[#BF1A1A] text-gray-700"
                          >
                            <option value="">Select…</option>
                            {[
                              "Professor",
                              "Associate Professor",
                              "Assistant Professor",
                              "Lecturer",
                              "Senior Lecturer",
                              "HOD",
                              "Dean",
                              "Director",
                              "Research Associate",
                              "Other",
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={13}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Building2 size={11} /> Institutional Affiliation
                    </p>
                    <div className="mb-4">
                      <FormInput
                        label="College / University"
                        name="college"
                        icon={Building2}
                        placeholder="GM University"
                        value={formData.college}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <CascadeSelect
                        label="Faculty"
                        icon={Layers}
                        required
                        value={formData.faculty}
                        onChange={(v) => setField("faculty", v)}
                        options={faculties}
                        placeholder="Select Faculty…"
                        hint="Select your institutional faculty"
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
                      label="Programme / Degree"
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
                        className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl"
                      >
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Pre-filled Department
                          details
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                        Category
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Briefcase size={15} />
                        </div>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none transition-all appearance-none focus:ring-2 focus:ring-[#BF1A1A] text-gray-700"
                        >
                          <option value="">Select…</option>
                          {[
                            "Teaching Faculty",
                            "Non-Teaching Staff",
                            "Research Faculty",
                            "Administrative",
                            "Guest Faculty",
                          ].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={13}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
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
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing…
                </>
              ) : isLogin ? (
                <>
                  Login Now <LogIn size={18} />
                </>
              ) : (
                <>
                  Request Creator Access <Save size={18} />
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
