import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import CreatorLayout from "../components/CreatorLayout";
import { useAppContext } from "../context/AppContext";
import {
  Save,
  Eye,
  BookMarked,
  BarChart3,
  Send,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  Layers,
  Table,
  Calendar,
  Hash,
  CreditCard,
  Search,
  X,
  Clock,
  CheckCircle,
  Settings,
  FolderOpen,
  History,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  UploadCloud,
  FileUp,
  Menu,
  AlertTriangle,
  Info,
  Briefcase,
  Award,
  Target,
  TrendingUp,
  Shield,
  Clipboard,
  GraduationCap,
  Sparkles,
  FlaskConical,
  BookUser,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import PreviewCD from "../components/PreviewCD"; // Your CD Preview component

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_OUTCOME_HEADERS = [
  "CO\\PO",
  "PO1",
  "PO2",
  "PO3",
  "PO4",
  "PO5",
  "PO6",
  "PO7",
  "PO8",
  "PO9",
  "PO10",
  "PO11",
  "PO12",
  "PSO1",
  "PSO2",
  "PSO3",
];

const DEFAULT_ASSESSMENT_WEIGHT = () =>
  Array.from({ length: 6 }, (_, i) => ({
    co: `CO${i + 1}`,
    q1: 0,
    q2: 0,
    q3: 0,
    t1: 0,
    t2: 0,
    t3: 0,
    a1: 0,
    a2: 0,
    see: 0,
    cie: 0,
    total: 0,
  }));

const cleanText = (str) => {
  if (!str) return "";
  return str
    .replace(/\ufffd/g, "'")
    .replace(/(\d)[\s\n]*(?:<br\s*\/?>)?[\s\n]*(0%)/gi, "$1$2")
    .replace(/Attainment\s*(?:<br\s*\/?>)?\s*Level/gi, "Attainment Level");
};

// Data Sanitizer
const sanitizeCDData = (raw = {}) => {
  let matrix = raw.outcomeMap?.matrix || [];
  const hasValidHeaders =
    matrix.length > 0 && matrix[0].some((h) => /PO\d/.test(h));
  if (!hasValidHeaders) {
    matrix = [
      DEFAULT_OUTCOME_HEADERS,
      ...Array.from({ length: 6 }, (_, i) => [
        `CO${i + 1}`,
        ...Array(15).fill(""),
      ]),
    ];
  }

  const rawAW = Array.isArray(raw.assessmentWeight) ? raw.assessmentWeight : [];
  const assessmentWeight = DEFAULT_ASSESSMENT_WEIGHT().map((def) => {
    const found = rawAW.find((r) => r?.co?.toUpperCase() === def.co);
    if (!found) return def;
    return {
      co: def.co,
      q1: found.q1 ?? 0,
      q2: found.q2 ?? 0,
      q3: found.q3 ?? 0,
      t1: found.t1 ?? 0,
      t2: found.t2 ?? 0,
      t3: found.t3 ?? 0,
      a1: found.a1 ?? 0,
      a2: found.a2 ?? 0,
      see: found.see ?? 0,
      cie:
        found.cie ??
        (found.q1 ?? 0) +
          (found.q2 ?? 0) +
          (found.q3 ?? 0) +
          (found.t1 ?? 0) +
          (found.t2 ?? 0) +
          (found.t3 ?? 0) +
          (found.a1 ?? 0) +
          (found.a2 ?? 0),
      total: found.total ?? 0,
    };
  });

  const courseOutcomes = Array.isArray(raw.courseOutcomes)
    ? raw.courseOutcomes
    : Array.isArray(raw.cos)
      ? raw.cos
      : [];
  return {
    courseCode: cleanText(raw.courseCode) || "",
    courseTitle: cleanText(raw.courseTitle) || "",
    programCode: cleanText(raw.programCode) || "",
    programTitle: cleanText(raw.programTitle || raw.programName) || "",
    schoolCode: cleanText(raw.schoolCode) || "",
    schoolTitle: cleanText(raw.schoolTitle) || "",
    departmentCode: cleanText(raw.departmentCode) || "",
    department: cleanText(raw.department) || "",
    facultyCode: cleanText(raw.facultyCode) || "",
    facultyTitle: cleanText(raw.facultyTitle) || "",
    offeringDepartment: cleanText(raw.offeringDepartment) || "",
    facultyMember: cleanText(raw.facultyMember) || "",
    semesterDuration: cleanText(raw.semesterDuration) || "",
    totalHours: raw.totalHours || 0,
    credits: { L: 0, T: 0, P: 0, total: 0, ...(raw.credits || {}) },
    aimsSummary: cleanText(raw.aimsSummary || raw.overview),
    objectives: cleanText(raw.objectives),
    courseContent: cleanText(raw.courseContent || raw.modules),
    gradingCriterion: cleanText(raw.gradingCriterion),
    courseOutcomesHtml: raw.courseOutcomesHtml || "",
    outcomeMapHtml: raw.outcomeMapHtml || "",
    assessmentWeightHtml: raw.assessmentWeightHtml || "",
    courseOutcomes,
    outcomeMap: { matrix, raw: cleanText(raw.outcomeMap?.raw) },
    resources: {
      textBooks: raw.resources?.textBooks || [],
      references: raw.resources?.references || [],
      otherResources: raw.resources?.otherResources || [],
    },
    teaching: Array.isArray(raw.teaching)
      ? raw.teaching
      : Array.isArray(raw.teachingPlan)
        ? raw.teachingPlan
        : [],
    assessmentWeight,
    attainmentCalculations: {
      recordingMarks: cleanText(raw.attainmentCalculations?.recordingMarks),
      settingTargets: cleanText(raw.attainmentCalculations?.settingTargets),
    },
    otherDetails: {
      assignmentDetails: cleanText(raw.otherDetails?.assignmentDetails),
      academicIntegrity: cleanText(raw.otherDetails?.academicIntegrity),
    },
  };
};

const transformForSave = (cdData) => ({
  identity: {
    courseCode: cdData.courseCode,
    courseTitle: cdData.courseTitle,
    programCode: cdData.programCode,
    programTitle: cdData.programTitle,
    schoolCode: cdData.schoolCode,
    schoolTitle: cdData.schoolTitle,
    departmentCode: cdData.departmentCode,
    department: cdData.department,
    facultyCode: cdData.facultyCode,
    facultyTitle: cdData.facultyTitle,
    offeringDepartment: cdData.offeringDepartment,
    facultyMember: cdData.facultyMember,
    semesterDuration: cdData.semesterDuration,
    totalHours: cdData.totalHours,
  },
  credits: cdData.credits,
  aimsSummary: cdData.aimsSummary,
  objectives: cdData.objectives,
  courseOutcomes: cdData.courseOutcomes,
  courseOutcomesHtml: cdData.courseOutcomesHtml,
  outcomeMap: cdData.outcomeMap,
  outcomeMapHtml: cdData.outcomeMapHtml,
  courseContent: cdData.courseContent,
  resources: cdData.resources,
  teaching: cdData.teaching,
  assessmentWeight: cdData.assessmentWeight,
  assessmentWeightHtml: cdData.assessmentWeightHtml,
  gradingCriterion: cdData.gradingCriterion,
  attainmentCalculations: cdData.attainmentCalculations,
  otherDetails: cdData.otherDetails,
});

const transformFetchedToFrontend = (fetched = {}) => {
  const d = fetched.data || fetched;
  return sanitizeCDData({ ...d, ...d.identity });
};

const STEP_CONFIG = [
  {
    id: 1,
    label: "Course Info",
    shortLabel: "Info",
    icon: Briefcase,
    color: "blue",
  },
  {
    id: 2,
    label: "Course Details",
    shortLabel: "Details",
    icon: BookMarked,
    color: "violet",
  },
  {
    id: 3,
    label: "Teaching & Assess",
    shortLabel: "Assess",
    icon: BarChart3,
    color: "emerald",
  },
  {
    id: 4,
    label: "Other Details",
    shortLabel: "Other",
    icon: Shield,
    color: "amber",
  },
];

const identityFields = [
  { label: "Course Code", key: "courseCode", required: true },
  { label: "Course Title", key: "courseTitle", required: true },
  { label: "Program Code", key: "programCode" },
  { label: "Program Title", key: "programTitle" },
  { label: "School Code", key: "schoolCode" },
  { label: "School Title", key: "schoolTitle" },
  { label: "Department Code", key: "departmentCode" },
  { label: "Department", key: "department" },
  { label: "Faculty Code", key: "facultyCode" },
  { label: "Faculty Title", key: "facultyTitle" },
  { label: "Offering Department", key: "offeringDepartment" },
  { label: "Faculty Member", key: "facultyMember" },
];

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const OptimizedInput = ({
  value,
  onChange,
  debounceTime = 350,
  className = "",
  ...rest
}) => {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceTime);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceTime]);
  return (
    <input
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => {
        if (local !== value) onChange(e.target.value);
      }}
      className={[
        `w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-150`,
        className,
      ].join(" ")}
    />
  );
};

const RichTextEditor = ({ value, onChange, placeholder, height = 220 }) => {
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || "Start typing…",
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "source",
      ],
      height,
      statusbar: false,
      style: {
        background: "#ffffff",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "14px",
      },
      toolbarAdaptive: true,
    }),
    [placeholder, height],
  );
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all">
      <JoditEditor value={value || ""} config={config} onBlur={onChange} />
    </div>
  );
};

const StepProgressBar = React.memo(({ activeStep, onStepClick }) => (
  <div className="w-full">
    <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {STEP_CONFIG.map((step) => (
        <button
          key={step.id}
          onClick={() => onStepClick(step.id)}
          className={[
            "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
            activeStep === step.id
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300",
          ].join(" ")}
        >
          <step.icon size={12} />
          {step.shortLabel}
        </button>
      ))}
    </div>
    <div className="hidden sm:flex items-center gap-0 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
      {STEP_CONFIG.map((step, idx) => (
        <React.Fragment key={step.id}>
          <button
            onClick={() => onStepClick(step.id)}
            className={[
              "flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
              activeStep === step.id
                ? "bg-gray-900 text-white shadow-sm"
                : activeStep > step.id
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600",
            ].join(" ")}
          >
            <span
              className={[
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                activeStep === step.id
                  ? "bg-white/20 text-white"
                  : activeStep > step.id
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {activeStep > step.id ? (
                <CheckCircle size={13} strokeWidth={2.5} />
              ) : (
                step.id
              )}
            </span>
            <span className="hidden md:block truncate">{step.label}</span>
          </button>
          {idx < STEP_CONFIG.length - 1 && (
            <ChevronRight
              size={14}
              className="text-gray-300 flex-shrink-0 mx-0.5"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
));

const SectionCard = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHeader = ({ icon, iconBg, title, subtitle, action, compact }) => (
  <div
    className={`flex items-start justify-between gap-3 ${compact ? "mb-4" : "mb-5 pb-4 border-b border-gray-100"}`}
  >
    <div className="flex items-start gap-3 min-w-0">
      <div
        className={`p-2 rounded-lg flex-shrink-0 ${iconBg || "bg-gray-100"}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const ResourceList = ({ label, items, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </span>
      <button
        onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 font-medium transition-colors"
      >
        <Plus size={11} strokeWidth={2.5} /> Add
      </button>
    </div>
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-xs text-gray-300 font-mono w-5 text-right flex-shrink-0">
            {i + 1}
          </span>
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const arr = [...items];
              arr[i] = e.target.value;
              onChange(arr);
            }}
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder-gray-300"
            placeholder="Enter resource details…"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-gray-300 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-gray-300 italic px-7 py-2">
          No entries yet. Click Add.
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPLEX EDITORS (Paste, Outcomes, Assessment)
// ─────────────────────────────────────────────────────────────────────────────

const PasteModal = ({
  title,
  description,
  placeholder,
  onClose,
  onConfirm,
}) => {
  const [raw, setRaw] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {description && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 mb-4">
              {description}
            </p>
          )}
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white resize-none transition-all"
            placeholder={placeholder}
          />
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(raw)}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            Parse & Insert
          </button>
        </div>
      </div>
    </div>
  );
};

const OutcomeMapEditor = ({ matrix, onChange, markDirty }) => {
  const [showPaste, setShowPaste] = useState(false);
  const setCell = (r, c, v) => {
    markDirty("outcomeMap");
    onChange(
      matrix.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row,
      ),
    );
  };
  const addRow = () => {
    if (!matrix.length) return;
    markDirty("outcomeMap");
    const newRow = Array(matrix[0].length).fill("");
    newRow[0] = `CO${matrix.length}`;
    onChange([...matrix, newRow]);
  };
  const addCol = () => {
    markDirty("outcomeMap");
    onChange(matrix.map((row) => [...row, ""]));
  };
  const delRow = (ri) => {
    if (ri !== 0) {
      markDirty("outcomeMap");
      onChange(matrix.filter((_, i) => i !== ri));
    }
  };
  const delCol = (ci) => {
    if (ci !== 0) {
      markDirty("outcomeMap");
      onChange(matrix.map((row) => row.filter((_, i) => i !== ci)));
    }
  };

  const handlePaste = (raw) => {
    if (!raw.trim()) return;
    const lines = raw.trim().split(/\r?\n/);
    const newMatrix = lines.map((line) =>
      line.includes("\t")
        ? line.split("\t").map((c) => c.trim())
        : line.split(/\s{2,}/).map((c) => c.trim()),
    );
    if (newMatrix.length > 0) {
      let poIdx = 1,
        psoIdx = 1;
      newMatrix[0] = newMatrix[0].map((h, i) => {
        const hu = h.toUpperCase();
        if (i === 0) return h;
        if (hu === "PO") return `PO${poIdx++}`;
        if (hu === "PSO" || hu === "PS") return `PSO${psoIdx++}`;
        return h;
      });
    }
    const maxLen = Math.max(...newMatrix.map((r) => r.length));
    markDirty("outcomeMap");
    onChange(
      newMatrix.map((r) => [...r, ...Array(maxLen - r.length).fill("")]),
    );
    setShowPaste(false);
    toast.success("Outcome map imported!");
  };

  if (!matrix.length)
    return (
      <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
        <GraduationCap size={28} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-4">
          No outcome map defined yet.
        </p>
        <button
          onClick={() => {
            markDirty("outcomeMap");
            onChange([
              DEFAULT_OUTCOME_HEADERS,
              ...Array.from({ length: 6 }, (_, i) => [
                `CO${i + 1}`,
                ...Array(15).fill(""),
              ]),
            ]);
          }}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium shadow-sm transition-colors"
        >
          Initialize default grid
        </button>
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse text-xs bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {matrix[0].map((h, ci) => (
                <th
                  key={ci}
                  className="px-2 py-2.5 font-semibold text-gray-600 text-center border-r border-gray-200 last:border-r-0 whitespace-nowrap"
                >
                  {ci === 0 ? (
                    <span className="text-xs text-gray-500">{h}</span>
                  ) : (
                    <div className="flex items-center gap-1 justify-center">
                      <OptimizedInput
                        value={h}
                        onChange={(v) => setCell(0, ci, v)}
                        className="!w-14 !px-1 !py-1 !text-center !text-xs !font-semibold"
                      />
                      <button
                        onClick={() => delCol(ci)}
                        className="text-gray-300 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="px-2 py-2.5">
                <button
                  onClick={addCol}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matrix.slice(1).map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50/60 transition-colors">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-1.5 py-1.5 border-r border-gray-100 last:border-r-0"
                  >
                    {ci === 0 ? (
                      <div className="flex items-center gap-1">
                        <OptimizedInput
                          value={cell}
                          onChange={(v) => setCell(ri + 1, ci, v)}
                          className="!w-14 !px-1.5 !py-1 !text-center !font-semibold !bg-gray-50"
                        />
                        <button
                          onClick={() => delRow(ri + 1)}
                          className="text-gray-300 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ) : (
                      <OptimizedInput
                        value={cell}
                        onChange={(v) => setCell(ri + 1, ci, v)}
                        className="!w-11 !px-1 !py-1 !text-center"
                      />
                    )}
                  </td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={12} className="text-blue-500" /> Row
          </button>
          <button
            onClick={addCol}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={12} className="text-blue-500" /> Column
          </button>
        </div>
        <button
          onClick={() => setShowPaste(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Clipboard size={12} className="text-violet-500" /> Paste Data
        </button>
      </div>
      {showPaste && (
        <PasteModal
          title="Paste Outcome Matrix"
          description="Copy the table from MS Word/Excel and paste below. Columns separated by tabs."
          placeholder={"COs\tPO1\tPO2\nCO1\t1\t2"}
          onClose={() => setShowPaste(false)}
          onConfirm={handlePaste}
        />
      )}
    </div>
  );
};

const AssessmentWeightEditor = ({ data, onChange, markDirty }) => {
  const [showPaste, setShowPaste] = useState(false);

  const recalc = (row) => {
    const cie =
      (row.q1 || 0) +
      (row.q2 || 0) +
      (row.q3 || 0) +
      (row.t1 || 0) +
      (row.t2 || 0) +
      (row.t3 || 0) +
      (row.a1 || 0) +
      (row.a2 || 0);
    return { ...row, cie, total: cie + (row.see || 0) };
  };

  const setCellVal = (idx, field, rawVal) => {
    markDirty("assessmentWeight");
    onChange(
      data.map((r, i) =>
        i === idx ? recalc({ ...r, [field]: parseInt(rawVal) || 0 }) : r,
      ),
    );
  };

  const handlePaste = (raw) => {
    if (!raw.trim()) return;
    const lines = raw.trim().split(/\r?\n/);
    const newRows = data.map((r) => ({ ...r }));
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        !trimmed ||
        (/quiz|test|assign/i.test(trimmed) && !/^CO/i.test(trimmed))
      )
        continue;
      const cells = trimmed.includes("\t")
        ? trimmed.split("\t")
        : trimmed.split(/\s+/);
      const coMatch = cells[0]
        ?.toUpperCase()
        .trim()
        .match(/CO(\d+)/);
      if (!coMatch) continue;
      const idx = parseInt(coMatch[1]) - 1;
      if (idx < 0 || idx > 5) continue;
      const nums = cells.slice(1).map((c) => parseInt(c) || 0);
      const cur = { ...newRows[idx] };
      if (nums.length >= 11)
        [
          cur.q1,
          cur.q2,
          cur.q3,
          cur.t1,
          cur.t2,
          cur.t3,
          cur.a1,
          cur.a2,
          cur.see,
          cur.cie,
          cur.total,
        ] = nums;
      else if (nums.length >= 4) {
        cur.q1 = nums[0];
        cur.t1 = nums[1];
        cur.a1 = nums[2];
        cur.see = nums.length >= 5 ? nums[3] : 0;
        const pt = nums[nums.length - 1];
        cur.cie = cur.q1 + cur.t1 + cur.a1;
        cur.total = pt > cur.cie ? pt : cur.cie + cur.see;
      } else if (nums.length === 3) {
        cur.q1 = nums[0];
        cur.t1 = nums[1];
        cur.cie = nums[0] + nums[1];
        cur.total = nums[2];
      } else if (nums.length >= 1) {
        cur.total = nums[0];
      }
      newRows[idx] = recalc(cur);
    }
    markDirty("assessmentWeight");
    onChange(newRows);
    setShowPaste(false);
    toast.success("Assessment weights imported!");
  };

  const numInput = (idx, field) => (
    <OptimizedInput
      type="number"
      min={0}
      value={data[idx]?.[field] ?? 0}
      onChange={(v) => setCellVal(idx, field, v)}
      className="!w-11 !px-1 !py-1.5 !text-center !text-xs"
    />
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse text-xs text-center bg-white">
          <thead className="border-b border-gray-200">
            <tr className="bg-gray-50">
              <th
                rowSpan={2}
                className="px-3 py-2.5 border-r border-gray-200 font-semibold text-gray-600 uppercase tracking-wider text-[10px] align-middle"
              >
                CO
              </th>
              <th
                colSpan={3}
                className="px-2 py-2 border-r border-gray-200 font-semibold text-blue-600 bg-blue-50/50 text-[10px]"
              >
                Quiz (15)
              </th>
              <th
                colSpan={3}
                className="px-2 py-2 border-r border-gray-200 font-semibold text-violet-600 bg-violet-50/50 text-[10px]"
              >
                Test (25)
              </th>
              <th
                colSpan={2}
                className="px-2 py-2 border-r border-gray-200 font-semibold text-purple-600 bg-purple-50/50 text-[10px]"
              >
                Assign (20)
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2.5 border-r border-gray-200 font-semibold text-blue-700 bg-blue-50 text-[10px] uppercase tracking-wider align-middle"
              >
                CIE
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2.5 border-r border-gray-200 font-semibold text-amber-700 bg-amber-50 text-[10px] uppercase tracking-wider align-middle"
              >
                SEE
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2.5 font-semibold text-emerald-700 bg-emerald-50 text-[10px] uppercase tracking-wider align-middle"
              >
                Total
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500">
              {["Q1", "Q2", "Q3"].map((l) => (
                <th key={l} className="px-2 py-1.5 bg-blue-50/30">
                  {l}
                </th>
              ))}
              {["T1", "T2", "T3"].map((l) => (
                <th key={l} className="px-2 py-1.5 bg-violet-50/30">
                  {l}
                </th>
              ))}
              {["A1", "A2"].map((l, i) => (
                <th
                  key={l}
                  className={`px-2 py-1.5 bg-purple-50/30${i === 1 ? " border-r border-gray-200" : ""}`}
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-3 py-2 border-r border-gray-100 font-semibold text-gray-700 bg-gray-50/80 text-[11px]">
                  {row.co}
                </td>
                <td className="px-1 py-1.5">{numInput(idx, "q1")}</td>
                <td className="px-1 py-1.5">{numInput(idx, "q2")}</td>
                <td className="px-1 py-1.5 border-r border-gray-100">
                  {numInput(idx, "q3")}
                </td>
                <td className="px-1 py-1.5">{numInput(idx, "t1")}</td>
                <td className="px-1 py-1.5">{numInput(idx, "t2")}</td>
                <td className="px-1 py-1.5 border-r border-gray-100">
                  {numInput(idx, "t3")}
                </td>
                <td className="px-1 py-1.5">{numInput(idx, "a1")}</td>
                <td className="px-1 py-1.5 border-r border-gray-100">
                  {numInput(idx, "a2")}
                </td>
                <td className="px-2 py-1.5 border-r border-gray-100 font-bold text-blue-700 bg-blue-50/40 text-xs">
                  {row.cie}
                </td>
                <td className="px-1 py-1.5 border-r border-gray-100 bg-amber-50/30">
                  {numInput(idx, "see")}
                </td>
                <td className="px-2 py-1.5 font-bold text-emerald-700 bg-emerald-50/40 text-xs">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400 font-medium">
          CIE = Q1–Q3 + T1–T3 + A1–A2 &nbsp;·&nbsp; Total = CIE + SEE
        </p>
        <button
          onClick={() => setShowPaste(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Clipboard size={12} className="text-teal-500" /> Paste Data
        </button>
      </div>
      {showPaste && (
        <PasteModal
          title="Paste Assessment Weights"
          description="Paste rows starting with CO1, CO2… Supports detailed (11-col) and aggregated (4-col) formats."
          placeholder={"CO1\t2\t4\t0\t30\t0\t6\t0\t30\t36\t42\t78"}
          onClose={() => setShowPaste(false)}
          onConfirm={handlePaste}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SELECTION MODAL
// ─────────────────────────────────────────────────────────────────────────────

const ReviewSubmitModal = ({
  isOpen,
  onClose,
  onConfirm,
  axios,
  createrToken,
}) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchAdmins = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get("/api/creater/cd/review-admins", {
            headers: { createrToken },
          });
          if (data.success) setAdmins(data.admins);
        } catch {
          toast.error("Failed to load reviewers.");
        } finally {
          setLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [isOpen, axios, createrToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Submit for Review
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select an Admin / Reviewer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="animate-spin text-gray-400" size={20} />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">
              No active admins available.
            </div>
          ) : (
            admins.map((admin) => (
              <label
                key={admin._id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedAdminId === admin._id ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-300"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={admin._id}
                    checked={selectedAdminId === admin._id}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {admin.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {admin.department || admin.email}
                    </p>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedAdminId)}
            disabled={!selectedAdminId}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send size={15} /> Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNED COURSES MODAL
// ─────────────────────────────────────────────────────────────────────────────

const AssignedCDsModal = ({
  isOpen,
  onClose,
  axios,
  createrToken,
  onLoadAssigned,
}) => {
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchAssigned = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get("/api/creater/cd/assigned", {
            headers: { createrToken },
          });
          if (data.success) setAssignedCourses(data.assignedCourses);
        } catch {
          toast.error("Failed to load assigned courses.");
        } finally {
          setLoading(false);
        }
      };
      fetchAssigned();
    }
  }, [isOpen, axios, createrToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Assigned Courses
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Courses assigned to you by Program Coordinators.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="animate-spin text-gray-400" size={24} />
            </div>
          ) : assignedCourses.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No courses assigned to you currently.
            </div>
          ) : (
            <div className="space-y-3">
              {assignedCourses.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-800">
                        {c.courseCode}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                        {c.type || "Theory"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {c.courseTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {c.programName}
                      </span>
                      <span>•</span>
                      <span>{c.context}</span>
                      <span>•</span>
                      <span className="text-gray-400">
                        Assigned by: {c.pdCreatorName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onLoadAssigned(c)}
                    className="flex items-center justify-center w-full sm:w-auto gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors flex-shrink-0"
                  >
                    <FileText size={14} /> Start Drafting
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY MODAL
// ─────────────────────────────────────────────────────────────────────────────

const HistoryModal = ({ list, search, onSearch, onLoad, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Previous Course Documents
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a saved CD to continue editing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-300" size={15} />
          <input
            type="text"
            placeholder="Search by code or title…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>
      </div>
      <div className="p-4 overflow-y-auto space-y-2 flex-1">
        {list.length > 0 ? (
          list.map((cd) => (
            <button
              key={cd._id}
              onClick={() => onLoad(cd.courseCode)}
              className="w-full text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">
                    {cd.courseCode}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    v{cd.cdVersion}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${cd.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}
                  >
                    {cd.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium truncate">
                  {cd.courseTitle || "—"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(cd.updatedAt).toLocaleString()}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors"
              />
            </button>
          ))
        ) : (
          <div className="text-center py-10">
            <BookOpen size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              No courses found matching "{search}".
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EditCD = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { axios, createrToken } = useAppContext();

  // ── 1. CORE STATE ─────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modals & UI States
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAssignedModal, setShowAssignedModal] = useState(false);

  // Data
  const [extractedCourses, setExtractedCourses] = useState([]);
  const [recentVersions, setRecentVersions] = useState([]);
  const [cdHistoryList, setCdHistoryList] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [dirtySections, setDirtySections] = useState(new Set());

  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const markDirty = useCallback(
    (section) => setDirtySections((prev) => new Set(prev).add(section)),
    [],
  );
  const hasContent = dirtySections.size > 0;

  const [metaData, setMetaData] = useState({
    courseId: "",
    courseCode: "",
    courseTitle: "",
    programName: "",
    versionNo: "1.0.0",
    status: "Draft",
    isNew: true,
  });
  const [cdData, setCdData] = useState(sanitizeCDData({}));

  // ── 2. EFFECTS ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target))
        setShowSidebar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (location.state?.loadId) fetchFullCD(location.state.loadId);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. API CALLS ───────────────────────────────────────────────────────────

  const fetchRecentVersions = async (courseCode) => {
    try {
      const { data } = await axios.get(
        `/api/creater/cd/versions/${courseCode}`,
        { headers: { createrToken } },
      );
      if (data.success) setRecentVersions(data.versions);
    } catch (_) {}
  };

  const fetchCreatorHistory = async () => {
    try {
      const { data } = await axios.get("/api/creater/cd/history", {
        headers: { createrToken },
      });
      if (data.success) {
        const uniqueMap = new Map();
        data.cds.forEach((cd) => {
          if (
            !uniqueMap.has(cd.courseCode) ||
            new Date(cd.updatedAt) >
              new Date(uniqueMap.get(cd.courseCode).updatedAt)
          ) {
            uniqueMap.set(cd.courseCode, cd);
          }
        });
        setCdHistoryList(Array.from(uniqueMap.values()));
      }
    } catch (e) {
      toast.error("Failed to load previous CDs");
    }
  };

  const handleLoadFromHistory = async (courseCode) => {
    setShowHistoryModal(false);
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/creater/cd/latest/${courseCode}`, {
        headers: { createrToken },
      });
      if (data.success) {
        populateForm(data.cd);
        toast.success(`Loaded ${courseCode}`);
        fetchRecentVersions(courseCode);
      } else toast.error("Could not load course.");
    } catch (e) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestCD = async () => {
    if (!metaData.courseCode) return toast.error("Select a course first.");
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/creater/cd/latest/${metaData.courseCode}`,
        { headers: { createrToken } },
      );
      if (data.success) {
        populateForm(data.cd);
        toast.success("Loaded latest version.");
      } else toast.error("No previous versions found.");
    } catch (_) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullCD = async (cdId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/creater/cd/fetch/${cdId}`, {
        headers: { createrToken },
      });
      if (data.success) {
        populateForm(data.cd);
        fetchRecentVersions(data.cd.courseCode);
        toast.success(`Loaded v${data.cd.cdVersion}`);
      } else toast.error(data.message);
    } catch (_) {
      toast.error("Failed to load document.");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (fetchedCd) => {
    const sanitized = sanitizeCDData(transformFetchedToFrontend(fetchedCd));
    setCdData(sanitized);
    setMetaData({
      courseId: fetchedCd.courseCode || "",
      courseCode: fetchedCd.courseCode || "",
      courseTitle: fetchedCd.courseTitle || "",
      programName: fetchedCd.programName || sanitized.programTitle || "",
      versionNo: fetchedCd.cdVersion || "1.0.0",
      status: fetchedCd.status || "Draft",
      isNew: false,
    });
    setDirtySections(new Set());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("Only PDF files are supported.");
    setImporting(true);
    const formData = new FormData();
    formData.append("cdFile", file);
    try {
      const { data } = await axios.post("/api/creater/cd/import", formData, {
        headers: { "Content-Type": "multipart/form-data", createrToken },
        timeout: 120000,
      });
      if (data.success) {
        const arr = Array.isArray(data.parsedData)
          ? data.parsedData
          : [data.parsedData];
        if (arr.length === 1) loadExtractedCourse(arr[0]);
        else if (arr.length > 1) setExtractedCourses(arr);
        else toast.error("No valid courses found in the PDF.");
      } else toast.error(data.message || "Parsing failed.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const loadExtractedCourse = (obj) => {
    const s = sanitizeCDData(obj);
    setCdData(s);
    setMetaData((p) => ({
      ...p,
      courseCode: s.courseCode || "",
      courseTitle: s.courseTitle || "",
      programName: s.programTitle || "",
      isNew: true,
    }));
    toast.success(`Imported ${s.courseCode || "course"} successfully!`);
    setDirtySections(new Set(["all"]));
    setExtractedCourses([]);
  };

  // ── 4. ACTION BUTTON HANDLERS ──────────────────────────────────────────────

  const handleSave = useCallback(
    async (statusOverride, reviewerId = null) => {
      if (!metaData.courseCode) return toast.error("Course Code is required.");
      const status = statusOverride || metaData.status;
      if (!metaData.isNew && !hasContent && status === metaData.status)
        return toast.success("No changes to save.");

      setLoading(true);
      const payload = {
        courseCode: metaData.courseCode,
        courseTitle: metaData.courseTitle,
        programName: metaData.programName,
        isNewCD: metaData.isNew,
        status: status,
        sectionsToUpdate: metaData.isNew ? ["all"] : Array.from(dirtySections),
        cdData: transformForSave(cdData),
        reviewerId: reviewerId,
      };

      try {
        const { data } = await axios.post("/api/creater/cd/save", payload, {
          headers: { createrToken },
        });
        if (data.success) {
          toast.success(data.message);
          setMetaData((p) => ({
            ...p,
            isNew: false,
            versionNo: data.version,
            status,
          }));
          fetchRecentVersions(metaData.courseCode);
          setDirtySections(new Set());
        } else toast.error(data.message);
      } catch (err) {
        console.error("Save Error:", err.response?.data || err);
        toast.error(
          err.response?.data?.message || "Save failed. Please check inputs.",
        );
      } finally {
        setLoading(false);
      }
    },
    [metaData, cdData, dirtySections, hasContent, axios, createrToken],
  );

  const handleSaveAndNext = useCallback(async () => {
    await handleSave("Draft");
    setActiveStep((p) => Math.min(4, p + 1));
  }, [handleSave]);

  const handlePreview = useCallback(() => {
    if (!metaData.courseCode)
      return toast.error("Course Code is required to preview.");
    setShowPreviewModal(true);
  }, [metaData.courseCode]);

  const handleSubmitReviewClick = useCallback(() => {
    if (!metaData.courseCode)
      return toast.error("Course Code is required to submit.");
    setShowReviewModal(true);
  }, [metaData.courseCode]);

  // Load Assigned Course
  const handleLoadAssignedCourse = async (course) => {
    setShowAssignedModal(false);
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/creater/cd/latest/${course.courseCode}`,
        { headers: { createrToken } },
      );
      if (data.success && data.cd) {
        populateForm(data.cd);
        toast.success(`Loaded existing document for ${course.courseCode}`);
        fetchRecentVersions(course.courseCode);
      } else {
        throw new Error("Not found");
      }
    } catch (error) {
      setMetaData((p) => ({
        ...p,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        programName: course.programName,
        programCode: course.programCode,
        isNew: true,
      }));
      setCdData((p) => ({
        ...p,
        identity: {
          ...p.identity,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          programCode: course.programCode,
          programTitle: course.programName,
        },
        credits: {
          ...p.credits,
          total: course.credits || 0,
        },
      }));
      toast.success(`Ready to draft ${course.courseCode}`);
      setDirtySections(new Set(["all"]));
    } finally {
      setLoading(false);
    }
  };

  // ── 5. MUTATION HELPERS ────────────────────────────────────────────────────

  const upd = (field, val) => {
    markDirty("basic");
    setCdData((p) => ({ ...p, [field]: val }));
  };
  const updN = (parent, field, val) => {
    markDirty(parent);
    setCdData((p) => ({ ...p, [parent]: { ...p[parent], [field]: val } }));
  };
  const updRes = (key, arr) => {
    markDirty("resources");
    setCdData((p) => ({ ...p, resources: { ...p.resources, [key]: arr } }));
  };
  const updTeaching = (idx, field, val) => {
    markDirty("teaching");
    setCdData((p) => {
      const arr = [...p.teaching];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...p, teaching: arr };
    });
  };
  const addTeaching = () => {
    markDirty("teaching");
    setCdData((p) => ({
      ...p,
      teaching: [
        ...p.teaching,
        {
          number: String(p.teaching.length + 1),
          topic: "",
          slides: "",
          videos: "",
        },
      ],
    }));
  };
  const delTeaching = (idx) => {
    markDirty("teaching");
    setCdData((p) => ({
      ...p,
      teaching: p.teaching.filter((_, i) => i !== idx),
    }));
  };

  const filteredHistory = cdHistoryList.filter(
    (cd) =>
      cd.courseCode.toLowerCase().includes(historySearch.toLowerCase()) ||
      cd.courseTitle?.toLowerCase().includes(historySearch.toLowerCase()),
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 6. RENDER STEPS
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <SectionCard>
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
              <UploadCloud size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Import from PDF
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                AI-powered parsing auto-fills the entire form from your course
                document.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              id="cd-import"
            />
            <label
              htmlFor="cd-import"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl cursor-pointer text-sm font-medium shadow-sm hover:bg-gray-800 transition-all w-full sm:w-auto ${importing ? "opacity-60 pointer-events-none" : ""}`}
            >
              {importing ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <FileUp size={15} />
              )}
              {importing ? "Parsing PDF…" : "Choose PDF File"}
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<FileText size={16} className="text-blue-500" />}
            iconBg="bg-blue-50"
            title="Course Identity"
            subtitle="Core identification details for the course document"
          />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4">
          {identityFields.map((f) => (
            <div key={f.key}>
              <FieldLabel required={f.required}>{f.label}</FieldLabel>
              <OptimizedInput
                value={cdData[f.key]}
                onChange={(v) => {
                  upd(f.key, v);
                  if (
                    ["courseCode", "courseTitle", "programTitle"].includes(
                      f.key,
                    )
                  )
                    setMetaData((p) => ({
                      ...p,
                      [f.key === "programTitle" ? "programName" : f.key]: v,
                    }));
                }}
                placeholder={`Enter ${f.label.toLowerCase()}`}
              />
            </div>
          ))}
          <div className="sm:col-span-2 xl:col-span-3">
            <FieldLabel>Semester Duration</FieldLabel>
            <OptimizedInput
              value={cdData.semesterDuration}
              onChange={(v) => upd("semesterDuration", v)}
              placeholder="e.g. Jan 2025 – May 2025"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<TrendingUp size={16} className="text-violet-500" />}
            iconBg="bg-violet-50"
            title="Credits & Hours"
            subtitle="L : T : P structure and total workload"
          />
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {["L", "T", "P", "total"].map((k) => (
              <div
                key={k}
                className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {k === "total" ? "Total" : k}
                </p>
                <OptimizedInput
                  type="number"
                  value={cdData.credits[k]}
                  onChange={(v) => updN("credits", k, parseInt(v) || 0)}
                  className="!text-center !text-sm !font-semibold !bg-white"
                />
              </div>
            ))}
            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-2">
                Hours
              </p>
              <OptimizedInput
                type="number"
                value={cdData.totalHours}
                onChange={(v) => upd("totalHours", parseInt(v) || 0)}
                className="!text-center !text-sm !font-semibold !bg-white !border-blue-200 !text-blue-700"
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      {[
        {
          title: "Course Aims & Summary",
          subtitle: "High-level overview of the course purpose",
          icon: <FileText size={16} className="text-green-500" />,
          iconBg: "bg-green-50",
          field: "aimsSummary",
          height: 240,
        },
        {
          title: "Course Objectives",
          subtitle: "Specific learning goals formatted point-wise",
          icon: <Target size={16} className="text-indigo-500" />,
          iconBg: "bg-indigo-50",
          field: "objectives",
          height: 240,
        },
      ].map((sec) => (
        <SectionCard key={sec.field}>
          <div className="p-5 pb-0">
            <SectionHeader
              icon={sec.icon}
              iconBg={sec.iconBg}
              title={sec.title}
              subtitle={sec.subtitle}
            />
          </div>
          <div className="px-5 pb-5">
            <RichTextEditor
              value={cdData[sec.field]}
              onChange={(c) => upd(sec.field, c)}
              height={sec.height}
            />
          </div>
        </SectionCard>
      ))}

      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<Award size={16} className="text-amber-500" />}
            iconBg="bg-amber-50"
            title="Course Outcomes (COs)"
            subtitle="Measurable statements of what students will achieve"
          />
        </div>
        <div className="px-5 pb-5">
          <RichTextEditor
            value={cdData.courseOutcomesHtml}
            onChange={(c) => {
              markDirty("courseOutcomes");
              upd("courseOutcomesHtml", c);
            }}
            height={320}
            placeholder="Paste or type course outcomes here…"
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<Table size={16} className="text-purple-500" />}
            iconBg="bg-purple-50"
            title="Outcome Mapping (CO → PO / PSO)"
            subtitle="Correlation matrix between course and program outcomes"
          />
        </div>
        <div className="px-5 pb-5">
          <OutcomeMapEditor
            matrix={cdData.outcomeMap.matrix}
            onChange={(m) => {
              markDirty("outcomeMap");
              updN("outcomeMap", "matrix", m);
            }}
            markDirty={markDirty}
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<Layers size={16} className="text-orange-500" />}
            iconBg="bg-orange-50"
            title="Course Content (Syllabus)"
            subtitle="Module-wise breakdown of topics"
          />
        </div>
        <div className="px-5 pb-5">
          <RichTextEditor
            value={cdData.courseContent}
            onChange={(c) => upd("courseContent", c)}
            height={280}
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<BookOpen size={16} className="text-cyan-500" />}
            iconBg="bg-cyan-50"
            title="Course Resources"
            subtitle="Textbooks, references, and supplementary materials"
          />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResourceList
            label="Textbooks"
            accentClass="blue"
            items={cdData.resources.textBooks}
            onChange={(arr) => updRes("textBooks", arr)}
          />
          <ResourceList
            label="References"
            accentClass="green"
            items={cdData.resources.references}
            onChange={(arr) => updRes("references", arr)}
          />
          <div className="lg:col-span-2">
            <ResourceList
              label="Other Resources"
              accentClass="purple"
              items={cdData.resources.otherResources}
              onChange={(arr) => updRes("otherResources", arr)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<BookMarked size={16} className="text-pink-500" />}
            iconBg="bg-pink-50"
            title="Teaching Schedule"
            subtitle="Lecture-wise plan with resources"
            compact
            action={
              <button
                onClick={addTeaching}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Plus size={12} strokeWidth={2.5} className="text-pink-500" />{" "}
                Add Lecture
              </button>
            }
          />
        </div>
        <div className="px-5 pb-5">
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Topic", "Slides", "Videos", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider text-[10px] ${i === 1 ? "w-auto" : "w-20"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {cdData.teaching.map((lec, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={lec.number}
                        onChange={(e) =>
                          updTeaching(idx, "number", e.target.value)
                        }
                        className="w-12 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={lec.topic}
                        onChange={(e) =>
                          updTeaching(idx, "topic", e.target.value)
                        }
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                        placeholder="Lecture topic…"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={lec.slides}
                        onChange={(e) =>
                          updTeaching(idx, "slides", e.target.value)
                        }
                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                        placeholder="Link…"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={lec.videos}
                        onChange={(e) =>
                          updTeaching(idx, "videos", e.target.value)
                        }
                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                        placeholder="Link…"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => delTeaching(idx)}
                        className="text-gray-300 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cdData.teaching.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-xs text-gray-400"
                    >
                      <BookMarked
                        size={24}
                        className="text-gray-200 mx-auto mb-2"
                      />
                      No lectures yet. Click "Add Lecture" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<BarChart3 size={16} className="text-teal-500" />}
            iconBg="bg-teal-50"
            title="Assessment Weight Distribution"
            subtitle="CO-wise marks distribution across all assessments"
          />
        </div>
        <div className="px-5 pb-5">
          <AssessmentWeightEditor
            data={cdData.assessmentWeight}
            onChange={(d) => {
              markDirty("assessmentWeight");
              upd("assessmentWeight", d);
            }}
            markDirty={markDirty}
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<Award size={16} className="text-rose-500" />}
            iconBg="bg-rose-50"
            title="Grading Criterion"
            subtitle="Grade ranges and corresponding marks"
          />
        </div>
        <div className="px-5 pb-5">
          <RichTextEditor
            value={cdData.gradingCriterion}
            onChange={(c) => {
              markDirty("gradingCriterion");
              setCdData((p) => ({ ...p, gradingCriterion: c }));
            }}
            height={200}
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<TrendingUp size={16} className="text-gray-400" />}
            iconBg="bg-gray-100"
            title="Attainment Calculations"
            subtitle="Methods for recording marks and setting targets"
          />
        </div>
        <div className="px-5 pb-5 space-y-5">
          <div>
            <FieldLabel>Recording Marks and Awarding Grades</FieldLabel>
            <RichTextEditor
              value={cdData.attainmentCalculations.recordingMarks}
              onChange={(c) => {
                markDirty("attainmentCalculations");
                updN("attainmentCalculations", "recordingMarks", c);
              }}
              height={260}
            />
          </div>
          <div>
            <FieldLabel>Setting Attainment Targets</FieldLabel>
            <RichTextEditor
              value={cdData.attainmentCalculations.settingTargets}
              onChange={(c) => {
                markDirty("attainmentCalculations");
                updN("attainmentCalculations", "settingTargets", c);
              }}
              height={260}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<FlaskConical size={16} className="text-lime-500" />}
            iconBg="bg-lime-50"
            title="Assignment Details / Problem Based Learning"
            subtitle="Assignment topics, problem statements, and deliverables"
          />
        </div>
        <div className="px-5 pb-5">
          <RichTextEditor
            value={cdData.otherDetails.assignmentDetails}
            onChange={(c) => {
              markDirty("otherDetails");
              updN("otherDetails", "assignmentDetails", c);
            }}
            height={260}
          />
        </div>
      </SectionCard>
      <SectionCard>
        <div className="p-5 pb-0">
          <SectionHeader
            icon={<Shield size={16} className="text-emerald-500" />}
            iconBg="bg-emerald-50"
            title="Academic Integrity Policy"
            subtitle="Rules regarding plagiarism, collaboration, and academic honesty"
          />
        </div>
        <div className="px-5 pb-5">
          <RichTextEditor
            value={cdData.otherDetails.academicIntegrity}
            onChange={(c) => {
              markDirty("otherDetails");
              updN("otherDetails", "academicIntegrity", c);
            }}
            height={260}
          />
        </div>
      </SectionCard>
    </div>
  );

  const stepCompletions = [
    !!metaData.courseCode,
    activeStep > 2,
    activeStep > 3,
    activeStep === 4 && !!metaData.courseCode,
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <CreatorLayout>
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap'); .jodit-wysiwyg ul { list-style-type: none !important; padding-left: 20px !important; margin-bottom: 10px; } .jodit-wysiwyg ul li { position: relative; margin-bottom: 6px; text-align: justify; } .jodit-wysiwyg ul li::before { content: "●"; position: absolute; left: -18px; color: black; font-size: 1.1em; } .jodit-wysiwyg ol { list-style-type: decimal !important; padding-left: 25px !important; margin-bottom: 10px; } .jodit-wysiwyg li { margin-bottom: 6px; text-align: justify; } .jodit-wysiwyg p { margin-bottom: 8px; text-align: justify; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } * { font-family: 'DM Sans', sans-serif; }`,
        }}
      />

      {/* ── Multi-Course Selection Modal ─────────────────────────────────── */}
      {extractedCourses.length > 0 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Select Course to Import
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Detected{" "}
                  <span className="font-semibold text-blue-600">
                    {extractedCourses.length} courses
                  </span>{" "}
                  in uploaded PDF
                </p>
              </div>
              <button
                onClick={() => setExtractedCourses([])}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {extractedCourses.map((course, idx) => (
                <button
                  key={idx}
                  onClick={() => loadExtractedCourse(course)}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">
                        {course.courseCode || "Unknown"}
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-200">
                        {course.credits?.total || 0} Credits
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {course.courseTitle || "Unknown Title"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {course.department || course.programTitle || "—"}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ─────────────────────────────────── */}
      {showHistoryModal && (
        <HistoryModal
          list={filteredHistory}
          search={historySearch}
          onSearch={setHistorySearch}
          onLoad={handleLoadFromHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* ── Assigned Courses Modal (NEW) ─────────────────────────────────── */}
      <AssignedCDsModal
        isOpen={showAssignedModal}
        onClose={() => setShowAssignedModal(false)}
        axios={axios}
        createrToken={createrToken}
        onLoadAssigned={handleLoadAssignedCourse}
      />

      {/* ── Sidebar Overlay ─────────────────────────────────── */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Version History Sidebar ─────────────────────────────────── */}
      {showSidebar && (
        <div
          ref={sidebarRef}
          className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-gray-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Sections & History
            </h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Completion
              </span>
              <span className="text-xs font-semibold text-gray-600">
                {stepCompletions.filter(Boolean).length}/{STEP_CONFIG.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="bg-gray-800 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(stepCompletions.filter(Boolean).length / STEP_CONFIG.length) * 100}%`,
                }}
              />
            </div>
            <div className="space-y-1">
              {STEP_CONFIG.map((step, i) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setShowSidebar(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${activeStep === step.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-600"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${activeStep === step.id ? "bg-white/20 text-white" : stepCompletions[i] ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    {stepCompletions[i] && activeStep !== step.id ? (
                      <CheckCircle size={11} strokeWidth={2.5} />
                    ) : (
                      <span className="text-[10px] font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Version History
              </span>
            </div>
            {recentVersions.length === 0 ? (
              <p className="text-xs text-gray-300 italic text-center py-4">
                No versions saved yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {recentVersions.map((ver) => (
                  <div
                    key={ver._id}
                    onClick={() => {
                      fetchFullCD(ver._id);
                      setShowSidebar(false);
                    }}
                    className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">
                        v{ver.cdVersion}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${ver.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ver.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0 pb-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap
                  size={18}
                  className="text-gray-400 flex-shrink-0"
                />
                <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                  Course Document Editor
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                {metaData.courseCode ? (
                  <>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                      {metaData.courseCode}
                    </span>
                    <span className="text-sm text-gray-600 font-medium truncate max-w-xs">
                      {metaData.courseTitle}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest border border-gray-200">
                      v{metaData.versionNo}
                    </span>
                    {hasContent && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Unsaved changes
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">
                    Upload a PDF or open a previous document to start editing.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {/* NEW Assigned CDs Button */}
              <button
                onClick={() => setShowAssignedModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 shadow-sm transition-colors"
              >
                <BookUser size={14} />{" "}
                <span className="hidden sm:inline">Assigned CDs</span>
              </button>

              <button
                onClick={() => {
                  fetchCreatorHistory();
                  setShowHistoryModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <FolderOpen size={14} />{" "}
                <span className="hidden sm:inline">Previous CDs</span>
              </button>
              <button
                onClick={() => setShowSidebar(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Menu size={14} />{" "}
                <span className="hidden sm:inline">Sections</span>
              </button>
              <button
                onClick={fetchLatestCD}
                disabled={!metaData.courseCode || loading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                <span className="hidden sm:inline">Fetch Latest</span>
              </button>
              <button
                onClick={handlePreview}
                disabled={!metaData.courseCode}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-40"
              >
                <Eye size={14} />{" "}
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => handleSave("Draft")}
                disabled={loading || !metaData.courseCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Draft
              </button>
              <button
                onClick={handleSubmitReviewClick}
                disabled={loading || !metaData.courseCode}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-40"
              >
                <Send size={14} />
                Submit
              </button>
            </div>
          </div>
          <StepProgressBar
            activeStep={activeStep}
            onStepClick={setActiveStep}
          />
        </div>

        {hasContent && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs mb-5 bg-yellow-50 border-yellow-200 text-yellow-700">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="font-medium">
              Unsaved content in:{" "}
              {Array.from(dirtySections)
                .map((s) => s.replace("section", "Section "))
                .join(", ")}
            </p>
          </div>
        )}

        <div className="min-h-[400px]">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
            disabled={activeStep === 1}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2} /> Previous
          </button>
          <div className="flex items-center justify-center gap-2">
            {STEP_CONFIG.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${activeStep === step.id ? "w-5 bg-gray-800" : "bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndNext}
              disabled={loading || !metaData.courseCode}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-40 transition-all"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save & Continue
            </button>
            <button
              onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
              disabled={activeStep === 4}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 transition-all shadow-sm"
            >
              Next <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Preview Modal ──────────────────────────────────────────── */}
      {showPreviewModal && (
        <PreviewCD
          isModal={true}
          onClose={() => setShowPreviewModal(false)}
          passedCdData={transformForSave(cdData)}
          passedMetaData={metaData}
        />
      )}

      {/* Submission Admin Review Modal */}
      <ReviewSubmitModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        axios={axios}
        createrToken={createrToken}
        onConfirm={(adminId) => {
          setShowReviewModal(false);
          handleSave("UnderReview", adminId);
        }}
      />
    </CreatorLayout>
  );
};

export default EditCD;
