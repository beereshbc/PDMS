import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Save,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
// Corrected Import Path
import Layout from "../components/Layout";

const AddAdmin = () => {
  // State matching EXACTLY with your SQL Schema
  const [formData, setFormData] = useState({
    password: "",
    email: "",
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
    role: "admin", // Default role for this page
    status: "active",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Prepare payload matching SQL structure
    // 'blocked', 'created_at', 'last_updated' are handled by default/system
    const payload = {
      ...formData,
      blocked: 0,
      created_at: new Date().toISOString(),
    };

    console.log("Submitting Admin Data:", payload);

    // Simulate API Call
    setTimeout(() => {
      alert(`Admin "${formData.name}" added successfully!`);
      // Optional: Reset form
      // setFormData({ ...initialState });
      setIsLoading(false);
    }, 1000);
  };

  // Helper component for cleaner code
  const FormInput = ({
    label,
    name,
    type = "text",
    icon: Icon,
    placeholder,
    required = false,
    width = "w-full",
  }) => (
    <div className={`space-y-1 ${width}`}>
      <label
        htmlFor={name}
        className="text-sm font-semibold text-gray-700 block"
      >
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
          value={formData[name]}
          onChange={handleChange}
          required={required}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] focus:border-transparent outline-none transition-all text-sm"
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#BF1A1A]">Add New Admin</h2>
          <p className="text-gray-500 mt-1">
            Create a new administrator with full schema details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Account Credentials (user_name, password, email, role, status) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Lock className="text-[#BF1A1A]" size={20} />
              Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                required
              />
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                placeholder="admin@gmit.edu.in"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Role
                  </label>
                  <input
                    disabled
                    value="Admin"
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF1A1A] outline-none text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information (name, mobile, aadhar, designation) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <User className="text-[#BF1A1A]" size={20} />
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Full Name"
                name="name"
                icon={User}
                placeholder="e.g. Dr. Anjali Gupta"
                required
              />
              <FormInput
                label="Mobile Number"
                name="mobile_no"
                icon={Phone}
                placeholder="+91 98765 43210"
              />
              <FormInput
                label="Aadhar Number"
                name="aadhar"
                icon={CreditCard}
                placeholder="12 Digit UID"
              />
              <FormInput
                label="Designation"
                name="designation"
                icon={Briefcase}
                placeholder="e.g. Head of Department"
              />
            </div>
          </div>

          {/* Section 3: Institutional Data (All Schema Fields Included) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="text-[#BF1A1A]" size={20} />
              Institutional Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="College"
                name="college"
                icon={Building2}
                placeholder="GMIT"
              />
              <FormInput
                label="School"
                name="school"
                icon={Building2}
                placeholder="SCST"
              />
              <FormInput
                label="Faculty"
                name="faculty"
                icon={Building2}
                placeholder="FET"
              />

              <FormInput
                label="Programme"
                name="programme"
                icon={GraduationCap}
                placeholder="B.Tech"
              />
              <FormInput
                label="Discipline"
                name="discipline"
                icon={BookOpen}
                placeholder="Computer Science"
              />
              <FormInput
                label="Course"
                name="course"
                icon={BookOpen}
                placeholder="Specific Course Name"
              />

              <FormInput
                label="Category"
                name="category"
                icon={Briefcase}
                placeholder="Teaching / Non-Teaching"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 py-3 px-8 rounded-lg text-white font-bold shadow-lg transition-all transform hover:-translate-y-1 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#BF1A1A] hover:bg-[#991515]"
              }`}
            >
              {isLoading ? (
                "Saving..."
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
