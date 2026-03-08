import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Lock,
  Mail,
  Shield,
  Save,
  Building2,
  GraduationCap,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import Layout from "../components/Layout";
import { useAppDevContext } from "../context/AppContext";

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
    <label htmlFor={name} className="text-sm font-semibold text-gray-700 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
      <input
        type={type}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
      />
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
    <label className="text-sm font-semibold text-gray-700 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
        <Icon size={18} />
      </div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full pl-10 pr-9 py-2.5 border rounded-lg text-sm outline-none transition-all appearance-none focus:ring-2 focus:ring-[#BF1A1A] ${disabled ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-gray-50 focus:bg-white cursor-pointer"} ${!value ? "text-gray-400" : "text-gray-800"}`}
      >
        <option value="">{disabled ? "—" : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
        <ChevronDown size={16} />
      </div>
    </div>
    {value && (
      <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
        <CheckCircle2 size={12} /> Selected
      </p>
    )}
    {hint && !value && !disabled && (
      <p className="flex items-center gap-1 text-xs text-amber-500 mt-1">
        <AlertCircle size={12} /> {hint}
      </p>
    )}
  </div>
);

const ReadOnlyChip = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div
        className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium truncate"
        title={value}
      >
        {value}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AddAdmin = () => {
  const { axios } = useAppDevContext(); // Using DevContext
  const [isLoading, setIsLoading] = useState(false);

  // Cascading dropdown state
  const [faculties] = useState(
    Object.keys(UNIVERSITY_STRUCTURE).map((f) => ({ value: f, label: f })),
  );
  const [schools, setSchools] = useState([]);
  const [programmes, setProgrammes] = useState([]);

  const initialState = {
    password: "",
    email: "",
    name: "",
    college: "GM University",
    faculty: "",
    school: "",
    programId: "",
    programName: "",
    programme: "",
    department: "",
    discipline: "",
    role: "admin",
    status: "active",
  };

  const [formData, setFormData] = useState(initialState);

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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name)
      return toast.error("Name, Email, and Password are required.");
    if (!formData.programId)
      return toast.error(
        "Please completely select the institutional affiliation.",
      );

    setIsLoading(true);

    try {
      const payload = {};
      Object.keys(formData).forEach((k) => {
        payload[k] = formData[k] ? formData[k].toString().trim() : "";
      });

      // Hit the dev route to create the admin
      const { data } = await axios.post("/api/dev/admins", payload);

      if (data.success) {
        toast.success(`Admin "${formData.name}" added successfully!`);
        setFormData(initialState);
        setSchools([]);
        setProgrammes([]);
      } else {
        toast.error(data.message || "Failed to create admin");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Server error while creating admin",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#BF1A1A]">Add New Admin</h2>
          <p className="text-gray-500 mt-1">
            Create a new administrator account with institutional access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Account Credentials */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Lock className="text-[#BF1A1A]" size={20} />
              Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                placeholder="admin@gmit.edu.in"
                required
                value={formData.email}
                onChange={handleChange}
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Shield size={18} />
                    </div>
                    <input
                      disabled
                      value="Admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none text-sm cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <User className="text-[#BF1A1A]" size={20} />
              Admin Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Full Name"
                name="name"
                icon={User}
                placeholder="e.g. Dr. Anjali Gupta"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 3: Institutional Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="text-[#BF1A1A]" size={20} />
              Institutional Affiliation
            </h3>

            <div className="mb-6">
              <FormInput
                label="College / University"
                name="college"
                icon={Building2}
                placeholder="GM University"
                value={formData.college}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  formData.faculty ? "Select School…" : "Select faculty first"
                }
                hint="Available after selecting a faculty"
              />
            </div>

            <div className="mb-6">
              <CascadeSelect
                label="Programme / Department"
                icon={GraduationCap}
                required
                value={formData.programId}
                onChange={handleProgrammeSelect}
                options={programmes}
                disabled={!formData.school}
                placeholder={
                  formData.school ? "Select Programme…" : "Select school first"
                }
                hint="Available after selecting a school"
              />
            </div>

            {formData.programId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mt-2 animate-in fade-in slide-in-from-top-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Selected Department Scope
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ReadOnlyChip
                    label="Programme ID"
                    value={formData.programId}
                  />
                  <ReadOnlyChip label="Programme" value={formData.programme} />
                  <ReadOnlyChip
                    label="Department"
                    value={formData.department}
                  />
                  <ReadOnlyChip
                    label="Discipline"
                    value={formData.discipline}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 py-3 px-8 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#BF1A1A] hover:bg-[#991515] hover:shadow-red-900/20"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={20} /> Create Admin User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddAdmin;
