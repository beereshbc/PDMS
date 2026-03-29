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
  Send,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  List,
  Layers,
  Settings,
  File,
  History,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  UploadCloud,
  FileUp,
  Search,
  X,
  CheckCircle,
  Book,
  Briefcase,
  Table,
  Award,
  Users,
  Download,
  Menu,
  Clipboard,
  Calculator,
  FolderOpen,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";

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

// ─────────────────────────────────────────────────────────────────────────────
// HTML TABLE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  tbl: "border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;",
  th: "border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;text-align:center;font-weight:bold;",
  th2: "border:1px solid #b0b8cc;padding:6px 8px;background:#d1d5db;text-align:center;font-weight:bold;font-size:12px;",
  td: "border:1px solid #b0b8cc;padding:8px 10px;text-align:center;",
  tdl: "border:1px solid #b0b8cc;padding:8px 10px;text-align:left;",
  tdh: "border:1px solid #b0b8cc;padding:8px 10px;text-align:center;font-weight:bold;background:#f1f5f9;",
};

const buildCourseOutcomesHtml = (cos) => {
  const list =
    cos && cos.length > 0
      ? cos
      : Array.from({ length: 6 }, (_, i) => ({
          code: `CO${i + 1}`,
          description: "",
        }));
  const rows = list
    .map(
      (co) =>
        `<tr><td style="${S.tdh}width:110px;">${cleanText(co.code) || ""}</td><td style="${S.tdl}">${cleanText(co.description) || ""}</td></tr>`,
    )
    .join("");
  return `<table style="${S.tbl}"><thead><tr><th style="${S.th}width:110px;">Course Outcome</th><th style="${S.th}text-align:left;">Description</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const buildOutcomeMapHtml = (matrix) => {
  if (!matrix || matrix.length === 0) {
    matrix = [
      DEFAULT_OUTCOME_HEADERS,
      ...Array.from({ length: 6 }, (_, i) => [
        `CO${i + 1}`,
        ...Array(15).fill(""),
      ]),
    ];
  }
  const headerCells = matrix[0]
    .map((h) => `<th style="${S.th2}">${cleanText(h)}</th>`)
    .join("");
  const bodyRows = matrix
    .slice(1)
    .map((row) => {
      const cells = row
        .map(
          (cell, ci) =>
            `<td style="${ci === 0 ? S.tdh : S.td}">${cleanText(cell)}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table style="${S.tbl}"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

const buildAssessmentWeightHtml = (data) => {
  if (!data || data.length === 0) data = DEFAULT_ASSESSMENT_WEIGHT();
  const bodyRows = data
    .map(
      (row) =>
        `<tr>
      <td style="${S.tdh}">${cleanText(row.co)}</td>
      <td style="${S.td}">${row.q1 || ""}</td><td style="${S.td}">${row.q2 || ""}</td><td style="${S.td}">${row.q3 || ""}</td>
      <td style="${S.td}">${row.t1 || ""}</td><td style="${S.td}">${row.t2 || ""}</td><td style="${S.td}">${row.t3 || ""}</td>
      <td style="${S.td}">${row.a1 || ""}</td><td style="${S.td}">${row.a2 || ""}</td>
      <td style="${S.tdh}">${row.cie || ""}</td><td style="${S.td}">${row.see || ""}</td>
    </tr>`,
    )
    .join("");

  const sumOf = (key) => data.reduce((s, r) => s + (r[key] || 0), 0);
  const [sQ1, sQ2, sQ3, sT1, sT2, sT3, sA1, sA2, sCIE, sSEE] = [
    "q1",
    "q2",
    "q3",
    "t1",
    "t2",
    "t3",
    "a1",
    "a2",
    "cie",
    "see",
  ].map((k) => sumOf(k) || 0);

  const footerRow = `<tr>
      <td style="${S.tdh}"></td>
      <td style="${S.tdh}">${sQ1 || 5}</td><td style="${S.tdh}">${sQ2 || 4}</td><td style="${S.tdh}">${sQ3 || 6}</td>
      <td style="${S.tdh}">${sT1 || 7}</td><td style="${S.tdh}">${sT2 || 8}</td><td style="${S.tdh}">${sT3 || 10}</td>
      <td style="${S.tdh}">${sA1 || 10}</td><td style="${S.tdh}">${sA2 || 10}</td>
      <td style="${S.tdh}">${sCIE || 60}</td><td style="${S.tdh}">${sSEE || 40}</td>
    </tr>`;

  return `<table style="${S.tbl}">
  <thead>
    <tr>
      <th rowspan="2" style="${S.th}vertical-align:middle;">Cos with<br/>weightage</th>
      <th colspan="3" style="${S.th}">Quiz = 15 Marks</th>
      <th colspan="3" style="${S.th}">Test = 25 Marks</th>
      <th colspan="2" style="${S.th}">Assignment = 20 Marks</th>
      <th rowspan="2" style="${S.th}vertical-align:middle;">CIE<br/>=60</th>
      <th rowspan="2" style="${S.th}vertical-align:middle;">SEE<br/>=40</th>
    </tr>
    <tr>
      <th style="${S.th2}">Q1<br/>=5</th><th style="${S.th2}">Q2<br/>=4</th><th style="${S.th2}">Q3<br/>=6</th>
      <th style="${S.th2}">T1<br/>=7</th><th style="${S.th2}">T2<br/>=8</th><th style="${S.th2}">T3<br/>=10</th>
      <th style="${S.th2}">A1 = 10</th><th style="${S.th2}">A2 = 10</th>
    </tr>
  </thead>
  <tbody>${bodyRows}</tbody>
  <tfoot>${footerRow}</tfoot>
</table>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA SANITIZER
// ─────────────────────────────────────────────────────────────────────────────

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

  const courseOutcomesHtml = raw.courseOutcomesHtml
    ? cleanText(raw.courseOutcomesHtml)
    : buildCourseOutcomesHtml(courseOutcomes);
  const outcomeMapHtml = raw.outcomeMapHtml
    ? cleanText(raw.outcomeMapHtml)
    : buildOutcomeMapHtml(matrix);
  const assessmentWeightHtml = raw.assessmentWeightHtml
    ? cleanText(raw.assessmentWeightHtml)
    : buildAssessmentWeightHtml(assessmentWeight);

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

    courseOutcomesHtml,
    outcomeMapHtml,
    assessmentWeightHtml,

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
  return sanitizeCDData({
    ...d,
    ...d.identity,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZED INPUT (debounced)
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
  }, [local]);
  return (
    <input
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => {
        if (local !== value) onChange(e.target.value);
      }}
      className={[
        `px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm w-full`,
        className,
      ].join(" ")}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RICH TEXT EDITOR WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

const RichTextEditor = ({ value, onChange, placeholder, height = 200 }) => {
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
      style: { background: "#fafafa" },
    }),
    [placeholder, height],
  );

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500">
      <JoditEditor value={value || ""} config={config} onBlur={onChange} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS SUMMARY SIDEBAR WIDGET
// ─────────────────────────────────────────────────────────────────────────────

const ProgressSummary = React.memo(({ metaData, activeStep }) => {
  const steps = [
    { id: 1, label: "Course Info", done: !!metaData.courseCode },
    { id: 2, label: "Course Details", done: activeStep > 2 },
    { id: 3, label: "Teaching & Assess", done: activeStep > 3 },
    {
      id: 4,
      label: "Other Details",
      done: activeStep === 4 && !!metaData.courseCode,
    },
  ];
  const pct = (steps.filter((s) => s.done).length / steps.length) * 100;
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Progress
        </span>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          {steps.filter((s) => s.done).length}/{steps.length}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center">
            <div
              className={[
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200",
                s.done
                  ? "bg-emerald-500 text-white"
                  : activeStep === s.id
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110"
                    : "bg-white border-2 border-gray-200 text-gray-400",
              ].join(" ")}
            >
              {s.done ? <CheckCircle size={16} strokeWidth={3} /> : s.id}
            </div>
            <span
              className={[
                "text-[9px] mt-1.5 text-center font-semibold w-14 leading-tight",
                activeStep === s.id ? "text-indigo-700" : "text-gray-400",
              ].join(" ")}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// OUTCOME MAP TABLE EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const OutcomeMapEditor = ({ matrix, onChange }) => {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteRaw, setPasteRaw] = useState("");

  const setCell = (r, c, v) =>
    onChange(
      matrix.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row,
      ),
    );

  const addRow = () => {
    if (!matrix.length) return;
    const newRow = Array(matrix[0].length).fill("");
    newRow[0] = `CO${matrix.length}`;
    onChange([...matrix, newRow]);
  };
  const addCol = () => onChange(matrix.map((row) => [...row, ""]));
  const delRow = (ri) => {
    if (ri !== 0) onChange(matrix.filter((_, i) => i !== ri));
  };
  const delCol = (ci) => {
    if (ci !== 0) onChange(matrix.map((row) => row.filter((_, i) => i !== ci)));
  };

  const handlePaste = () => {
    if (!pasteRaw.trim()) return;
    const lines = pasteRaw.trim().split(/\r?\n/);
    const newMatrix = lines.map((line) => {
      const cols = line.includes("\t")
        ? line.split("\t")
        : line.split(/\s{2,}/);
      return cols.map((c) => c.trim());
    });
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
    onChange(
      newMatrix.map((r) => [...r, ...Array(maxLen - r.length).fill("")]),
    );
    setShowPaste(false);
    setPasteRaw("");
    toast.success("Outcome map imported!");
  };

  if (!matrix.length) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
        <p className="text-gray-500 mb-4 font-medium">
          No outcome map defined.
        </p>
        <button
          onClick={() =>
            onChange([
              DEFAULT_OUTCOME_HEADERS,
              ...Array.from({ length: 6 }, (_, i) => [
                `CO${i + 1}`,
                ...Array(15).fill(""),
              ]),
            ])
          }
          className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow"
        >
          Initialize default grid
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2 rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse text-sm bg-white">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              {matrix[0].map((h, ci) => (
                <th
                  key={ci}
                  className="px-2 py-3 font-bold text-slate-700 text-center border-r border-gray-200 whitespace-nowrap"
                >
                  {ci === 0 ? (
                    <span className="text-xs">{h}</span>
                  ) : (
                    <div className="flex items-center gap-1 justify-center">
                      <OptimizedInput
                        value={h}
                        onChange={(v) => setCell(0, ci, v)}
                        className="!w-14 !px-1 !py-1 !text-center !text-xs font-bold"
                      />
                      <button
                        onClick={() => delCol(ci)}
                        className="text-rose-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="px-2 py-3 bg-slate-50 w-10">
                <button
                  onClick={addCol}
                  className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                >
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matrix.slice(1).map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50/40">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-1.5 py-1.5 border-r border-gray-100"
                  >
                    {ci === 0 ? (
                      <div className="flex items-center gap-1">
                        <OptimizedInput
                          value={cell}
                          onChange={(v) => setCell(ri + 1, ci, v)}
                          className="!w-14 !px-1.5 !py-1 !text-center !font-bold !bg-slate-50"
                        />
                        <button
                          onClick={() => delRow(ri + 1)}
                          className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <OptimizedInput
                        value={cell}
                        onChange={(v) => setCell(ri + 1, ci, v)}
                        className="!w-12 !px-1 !py-1 !text-center"
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
      <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-1.5 font-medium"
          >
            <Plus size={15} className="text-indigo-600" /> Row
          </button>
          <button
            onClick={addCol}
            className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-1.5 font-medium"
          >
            <Plus size={15} className="text-indigo-600" /> Column
          </button>
        </div>
        <button
          onClick={() => setShowPaste(true)}
          className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 font-semibold"
        >
          <Clipboard size={15} /> Paste from Word / Excel
        </button>
      </div>

      {showPaste && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                Paste Outcome Matrix
              </h3>
              <button
                onClick={() => setShowPaste(false)}
                className="text-gray-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50"
              >
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              Copy the table from MS Word, Excel, or PDF and paste below.
            </p>
            <textarea
              value={pasteRaw}
              onChange={(e) => setPasteRaw(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder={"COs\tPO1\tPO2\t...\nCO1\t1\t2\t..."}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowPaste(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaste}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow"
              >
                Parse & Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT WEIGHT TABLE EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const AssessmentWeightEditor = ({ data, onChange, markDirty }) => {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteRaw, setPasteRaw] = useState("");

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
    const newRows = data.map((r, i) =>
      i === idx ? recalc({ ...r, [field]: parseInt(rawVal) || 0 }) : r,
    );
    onChange(newRows);
  };

  const handlePaste = () => {
    if (!pasteRaw.trim()) return;
    const lines = pasteRaw.trim().split(/\r?\n/);
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

      if (nums.length >= 11) {
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
      } else if (nums.length >= 4) {
        cur.q1 = nums[0];
        cur.t1 = nums[1];
        cur.a1 = nums[2];
        cur.see = nums.length >= 5 ? nums[3] : 0;
        const provided_total = nums[nums.length - 1];
        cur.cie = cur.q1 + cur.t1 + cur.a1;
        cur.total =
          provided_total > cur.cie ? provided_total : cur.cie + cur.see;
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
    setPasteRaw("");
    toast.success("Assessment weights imported!");
  };

  const numInput = (idx, field, colorClass = "") => (
    <OptimizedInput
      type="number"
      min={0}
      value={data[idx]?.[field] ?? 0}
      onChange={(v) => setCellVal(idx, field, v)}
      className={`!w-12 !px-1 !py-1.5 !text-center !text-xs ${colorClass}`}
    />
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2 rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse text-xs text-center bg-white">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th
                rowSpan={2}
                className="px-3 py-3 border-r border-gray-200 font-bold text-slate-700 uppercase"
              >
                CO
              </th>
              <th
                colSpan={3}
                className="px-2 py-2 border-r border-gray-200 font-bold text-blue-700 bg-blue-50/40"
              >
                Quiz (15)
              </th>
              <th
                colSpan={3}
                className="px-2 py-2 border-r border-gray-200 font-bold text-indigo-700 bg-indigo-50/40"
              >
                Test (25)
              </th>
              <th
                colSpan={2}
                className="px-2 py-2 border-r border-gray-200 font-bold text-purple-700 bg-purple-50/40"
              >
                Assign (20)
              </th>
              <th
                rowSpan={2}
                className="px-3 py-3 border-r border-gray-200 font-bold text-blue-700 bg-blue-50 uppercase"
              >
                CIE
              </th>
              <th
                rowSpan={2}
                className="px-3 py-3 border-r border-gray-200 font-bold text-orange-700 bg-orange-50 uppercase"
              >
                SEE
              </th>
              <th
                rowSpan={2}
                className="px-3 py-3 font-bold text-emerald-700 bg-emerald-50 uppercase"
              >
                Total
              </th>
            </tr>
            <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 font-semibold">
              {["Q1", "Q2", "Q3"].map((l) => (
                <th key={l} className="px-2 py-1.5 bg-blue-50/20">
                  {l}
                </th>
              ))}
              {["T1", "T2", "T3"].map((l) => (
                <th key={l} className="px-2 py-1.5 bg-indigo-50/20">
                  {l}
                </th>
              ))}
              {["A1", "A2"].map((l) => (
                <th
                  key={l}
                  className={`px-2 py-1.5 bg-purple-50/20 ${l === "A2" ? "border-r border-gray-200" : ""}`}
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30">
                <td className="px-3 py-2 border-r border-gray-100 font-extrabold text-slate-700 bg-slate-50">
                  {row.co}
                </td>
                <td className="px-1 py-2">{numInput(idx, "q1")}</td>
                <td className="px-1 py-2">{numInput(idx, "q2")}</td>
                <td className="px-1 py-2 border-r border-gray-100">
                  {numInput(idx, "q3")}
                </td>
                <td className="px-1 py-2">{numInput(idx, "t1")}</td>
                <td className="px-1 py-2">{numInput(idx, "t2")}</td>
                <td className="px-1 py-2 border-r border-gray-100">
                  {numInput(idx, "t3")}
                </td>
                <td className="px-1 py-2">{numInput(idx, "a1")}</td>
                <td className="px-1 py-2 border-r border-gray-100">
                  {numInput(idx, "a2")}
                </td>
                <td className="px-3 py-2 border-r border-gray-100 font-extrabold text-blue-700 bg-blue-50/40 text-sm">
                  {row.cie}
                </td>
                <td className="px-1 py-2 border-r border-gray-100 bg-orange-50/20">
                  {numInput(idx, "see", "!text-orange-700 !font-bold")}
                </td>
                <td className="px-3 py-2 font-extrabold text-emerald-700 bg-emerald-50/40 text-sm">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
        <span className="text-xs text-gray-500 font-medium">
          CIE = sum of Q1–Q3 + T1–T3 + A1–A2 &nbsp;|&nbsp; Total = CIE + SEE
        </span>
        <button
          onClick={() => setShowPaste(true)}
          className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow flex items-center gap-2 font-semibold"
        >
          <Clipboard size={15} /> Paste Data
        </button>
      </div>

      {showPaste && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                Paste Assessment Weights
              </h3>
              <button
                onClick={() => setShowPaste(false)}
                className="text-gray-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50"
              >
                <X size={22} />
              </button>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 mb-4 flex items-start gap-3">
              <Calculator size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="text-sm text-teal-800">
                Paste rows starting with <strong>CO1</strong>,{" "}
                <strong>CO2</strong>… from your document. Supports both detailed
                (11-column) and aggregated (4-column) formats. CIE and Total are
                auto-calculated.
              </p>
            </div>
            <textarea
              value={pasteRaw}
              onChange={(e) => setPasteRaw(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              placeholder={
                "CO1\t2\t4\t0\t30\t0\t6\t0\t30\t36\t42\t78\nCO2\t5\t5\t10\t20"
              }
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowPaste(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaste}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow"
              >
                Parse & Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EditCD = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { axios, createrToken } = useAppContext();

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState([]);
  const [recentVersions, setRecentVersions] = useState([]);

  // Previous CDs Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cdHistoryList, setCdHistoryList] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  const [showSidebarDropdown, setShowSidebarDropdown] = useState(false);
  const [dirtySections, setDirtySections] = useState(new Set());

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const markDirty = useCallback((section) => {
    setDirtySections((prev) => new Set(prev).add(section));
  }, []);

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

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowSidebarDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (location.state?.loadId) fetchFullCD(location.state.loadId);
  }, [location.state]);

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
        toast.success(`Loaded latest version of ${courseCode}`);
        fetchRecentVersions(courseCode);
      } else {
        toast.error("Could not load course.");
      }
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
      // In EditCD.jsx -> handleFileUpload
      const { data } = await axios.post("/api/creater/cd/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          createrToken: createrToken,
        },
        timeout: 120000, // Wait up to 2 minutes for very large PDF files
      });
      if (data.success) {
        const arr = Array.isArray(data.parsedData)
          ? data.parsedData
          : [data.parsedData];
        if (arr.length === 1) loadExtractedCourse(arr[0]);
        else if (arr.length > 1) setExtractedCourses(arr);
        else toast.error("No valid courses found in the PDF.");
      } else {
        toast.error(data.message || "Parsing failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Import failed. Please check server logs.",
      );
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

  const handleSave = async (statusOverride) => {
    if (!metaData.courseCode) return toast.error("Course Code is required.");
    const status = statusOverride || metaData.status;
    if (
      !metaData.isNew &&
      dirtySections.size === 0 &&
      status === metaData.status
    )
      return toast.success("No changes to save.");

    setLoading(true);
    const payload = {
      courseCode: metaData.courseCode,
      courseTitle: metaData.courseTitle,
      programName: metaData.programName,
      isNewCD: metaData.isNew,
      status,
      sectionsToUpdate: metaData.isNew ? ["all"] : Array.from(dirtySections),
      cdData: transformForSave(cdData),
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
    } catch (_) {
      toast.error("Save failed. Schema validation error likely.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave("Draft");
    setActiveStep((p) => Math.min(4, p + 1));
  };

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
  // RENDER STEPS
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl text-blue-600 shadow-inner">
              <UploadCloud size={30} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">
                Import Course Document
              </h3>
              <p className="text-gray-500 mt-0.5 text-sm">
                Upload a PDF to auto-fill this form via AI parsing.
              </p>
            </div>
          </div>
          <div>
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
              className={`flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl cursor-pointer font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${importing ? "opacity-75 pointer-events-none" : ""}`}
            >
              {importing ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <FileUp size={18} />
              )}
              {importing ? "Parsing…" : "Choose PDF File"}
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-7 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <FileText className="text-blue-600" size={20} />
          </div>
          <h3 className="text-xl font-extrabold text-gray-800">
            Course Identity
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {[
            { label: "Course Code", key: "courseCode" },
            { label: "Course Title", key: "courseTitle" },
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
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                {f.label}
              </label>
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
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Semester Duration
            </label>
            <OptimizedInput
              value={cdData.semesterDuration}
              onChange={(v) => upd("semesterDuration", v)}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Briefcase className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-800">
              Credits (L : T : P)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {["L", "T", "P", "total"].map((k) => (
              <div
                key={k}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200"
              >
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">
                  {k === "total" ? "Total Credits" : k}
                </label>
                <OptimizedInput
                  type="number"
                  value={cdData.credits[k]}
                  onChange={(v) => updN("credits", k, parseInt(v) || 0)}
                  className="!text-center !text-base !font-bold"
                />
              </div>
            ))}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <label className="block text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider text-center">
                Total Hours
              </label>
              <OptimizedInput
                type="number"
                value={cdData.totalHours}
                onChange={(v) => upd("totalHours", parseInt(v) || 0)}
                className="!bg-white !text-center !text-base !font-bold !text-blue-700 !border-blue-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<FileText className="text-green-600" size={20} />}
          bg="bg-green-50"
          title="2.1  Course Aims and Summary"
        />
        <RichTextEditor
          value={cdData.aimsSummary}
          onChange={(c) => upd("aimsSummary", c)}
          height={260}
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<List className="text-indigo-600" size={20} />}
          bg="bg-indigo-50"
          title="2.2  Course Objectives"
          subtitle="Format point-wise"
        />
        <RichTextEditor
          value={cdData.objectives}
          onChange={(c) => upd("objectives", c)}
          height={260}
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Award className="text-yellow-600" size={20} />}
          bg="bg-yellow-50"
          title="2.3  Course Outcomes (COs)"
          subtitle="Format point-wise or paste table"
        />
        <RichTextEditor
          value={cdData.courseOutcomesHtml}
          onChange={(c) => {
            markDirty("courseOutcomes");
            upd("courseOutcomesHtml", c);
          }}
          height={360}
          placeholder="Paste or type course outcomes here..."
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Table className="text-purple-600" size={20} />}
          bg="bg-purple-50"
          title="Outcome Map  (CO → PO / PSO)"
          subtitle="Paste your Matrix Table below"
        />
        <RichTextEditor
          value={cdData.outcomeMapHtml}
          onChange={(m) => {
            markDirty("outcomeMap");
            upd("outcomeMapHtml", m);
          }}
          height={320}
          placeholder="Paste outcome mapping table here..."
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Layers className="text-orange-600" size={20} />}
          bg="bg-orange-50"
          title="2.4  Course Content (Syllabus)"
          subtitle="Format point-wise"
        />
        <RichTextEditor
          value={cdData.courseContent}
          onChange={(c) => upd("courseContent", c)}
          height={300}
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<BookOpen className="text-cyan-600" size={20} />}
          bg="bg-cyan-50"
          title="2.5  Course Resources"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { key: "textBooks", label: "Textbooks", accent: "blue" },
            { key: "references", label: "References", accent: "green" },
          ].map(({ key, label, accent }) => (
            <ResourceList
              key={key}
              label={label}
              accent={accent}
              items={cdData.resources[key]}
              onChange={(arr) => updRes(key, arr)}
            />
          ))}
          <ResourceList
            label="Other Resources"
            accent="purple"
            items={cdData.resources.otherResources}
            onChange={(arr) => updRes("otherResources", arr)}
            className="lg:col-span-2"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <SectionHeader
            icon={<Table className="text-pink-600" size={20} />}
            bg="bg-pink-50"
            title="3.1  Teaching Schedule"
            noMargin
          />
          <button
            onClick={addTeaching}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pink-50 text-pink-700 font-bold rounded-lg hover:bg-pink-100 shadow-sm"
          >
            <Plus size={15} strokeWidth={3} /> Add Lecture
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["#", "Topic", "Slides", "Videos", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left font-bold text-slate-700 text-xs uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {cdData.teaching.map((lec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="px-3 py-2 w-16">
                    <input
                      type="text"
                      value={lec.number}
                      onChange={(e) =>
                        updTeaching(idx, "number", e.target.value)
                      }
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-center text-xs focus:ring-2 focus:ring-pink-200 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={lec.topic}
                      onChange={(e) =>
                        updTeaching(idx, "topic", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={lec.slides}
                      onChange={(e) =>
                        updTeaching(idx, "slides", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={lec.videos}
                      onChange={(e) =>
                        updTeaching(idx, "videos", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => delTeaching(idx)}
                      className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {cdData.teaching.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400 text-sm font-medium"
                  >
                    No lectures yet. Click "Add Lecture" or import a PDF.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Settings className="text-teal-600" size={20} />}
          bg="bg-teal-50"
          title="3.2  Assessment Weight Distribution"
          subtitle="Paste your Assessment Table below"
        />
        <RichTextEditor
          value={cdData.assessmentWeightHtml}
          onChange={(c) => {
            markDirty("assessmentWeight");
            upd("assessmentWeightHtml", c);
          }}
          height={360}
          placeholder="Assessment weight table will appear here..."
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Award className="text-red-600" size={20} />}
          bg="bg-red-50"
          title="3.3  Grading Criterion"
        />
        <RichTextEditor
          value={cdData.gradingCriterion}
          onChange={(c) => {
            markDirty("gradingCriterion");
            setCdData((prev) => ({ ...prev, gradingCriterion: c }));
          }}
          height={200}
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Download className="text-gray-600" size={20} />}
          bg="bg-gray-100"
          title="Attainment Calculations"
        />
        <div className="space-y-7">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
              Recording Marks and Awarding Grades
            </label>
            <RichTextEditor
              value={cdData.attainmentCalculations.recordingMarks}
              onChange={(c) => {
                markDirty("attainmentCalculations");
                updN("attainmentCalculations", "recordingMarks", c);
              }}
              height={300}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
              Setting Attainment Targets
            </label>
            <RichTextEditor
              value={cdData.attainmentCalculations.settingTargets}
              onChange={(c) => {
                markDirty("attainmentCalculations");
                updN("attainmentCalculations", "settingTargets", c);
              }}
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<FileText className="text-lime-600" size={20} />}
          bg="bg-lime-50"
          title="4.1  Assignment Details / Problem Based Learning"
        />
        <RichTextEditor
          value={cdData.otherDetails.assignmentDetails}
          onChange={(c) => {
            markDirty("otherDetails");
            updN("otherDetails", "assignmentDetails", c);
          }}
          height={260}
        />
      </div>
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <SectionHeader
          icon={<Users className="text-emerald-600" size={20} />}
          bg="bg-emerald-50"
          title="4.2  Academic Integrity Policy"
        />
        <RichTextEditor
          value={cdData.otherDetails.academicIntegrity}
          onChange={(c) => {
            markDirty("otherDetails");
            updN("otherDetails", "academicIntegrity", c);
          }}
          height={260}
        />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <CreatorLayout>
      {/* Global Style overrides to ensure Jodit Editor formats bullets properly */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .jodit-wysiwyg ul { list-style-type: none !important; padding-left: 20px !important; margin-bottom: 10px; }
        .jodit-wysiwyg ul li { position: relative; margin-bottom: 6px; text-align: justify; }
        .jodit-wysiwyg ul li::before { content: "●"; position: absolute; left: -18px; color: black; font-size: 1.1em; }
        .jodit-wysiwyg ol { list-style-type: decimal !important; padding-left: 25px !important; margin-bottom: 10px; }
        .jodit-wysiwyg li { margin-bottom: 6px; text-align: justify; }
        .jodit-wysiwyg p { margin-bottom: 8px; text-align: justify; }
      `,
        }}
      />

      {/* ── Multi-Course Selection Modal ─────────────────────────────────── */}
      {extractedCourses.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">
                  Select Course to Import
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">
                  We detected{" "}
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {extractedCourses.length}
                  </span>{" "}
                  courses in the uploaded PDF.
                </p>
              </div>
              <button
                onClick={() => setExtractedCourses([])}
                className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-full transition-colors"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/30">
              {extractedCourses.map((course, idx) => (
                <button
                  key={idx}
                  onClick={() => loadExtractedCourse(course)}
                  className="w-full text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-extrabold text-indigo-900 text-lg tracking-tight">
                        {course.courseCode || "Unknown Code"}
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                        {course.credits?.total || 0} Credits
                      </span>
                    </div>
                    <div className="text-base font-bold text-gray-800 mb-2 leading-snug">
                      {course.courseTitle || "Unknown Title"}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 flex items-center gap-2 bg-gray-50 inline-flex px-2 py-1 rounded-md">
                      <Briefcase size={14} className="text-gray-400" />
                      {course.department ||
                        course.programTitle ||
                        "Department not specified"}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-sm">
                    <ChevronRight
                      className="text-indigo-400 group-hover:text-white"
                      strokeWidth={3}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Previous CDs Modal ─────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">
                    Previous Course Documents
                  </h3>
                  <p className="text-sm text-gray-500 mt-1.5 font-medium">
                    Select a previously saved CD to edit.
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-full transition-colors"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by Course Code or Title..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar bg-slate-50/30">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((cd) => (
                  <button
                    key={cd._id}
                    onClick={() => handleLoadFromHistory(cd.courseCode)}
                    className="w-full text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-extrabold text-indigo-900 text-lg tracking-tight">
                          {cd.courseCode}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200 uppercase tracking-widest">
                          v{cd.cdVersion}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-md border uppercase ${cd.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}
                        >
                          {cd.status}
                        </span>
                      </div>
                      <div className="text-base font-bold text-gray-800 mb-1">
                        {cd.courseTitle || "Unknown Title"}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Last updated: {new Date(cd.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-sm">
                      <ChevronRight
                        className="text-indigo-400 group-hover:text-white"
                        strokeWidth={3}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 font-medium">
                  No previous courses found matching "{historySearch}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Course Document Editor
          </h1>
          <div className="text-gray-600 flex items-center gap-2 mt-3 flex-wrap">
            {metaData.courseCode ? (
              <>
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg text-sm shadow-sm">
                  {metaData.courseCode}
                </span>
                <span className="text-gray-800 font-semibold">
                  {metaData.courseTitle}
                </span>
                <span className="ml-2 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-200 shadow-sm">
                  v{metaData.versionNo}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                Upload a PDF or select a course to begin
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              fetchCreatorHistory();
              setShowHistoryModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all font-semibold"
          >
            <FolderOpen size={18} />
            <span className="hidden sm:inline">Previous CDs</span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSidebarDropdown(!showSidebarDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all font-semibold"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">Sections & History</span>
            </button>
            {showSidebarDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2">
                <ProgressSummary metaData={metaData} activeStep={activeStep} />
                <div className="mt-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <nav className="space-y-1 p-2">
                    {[
                      { id: 1, label: "Course Information", icon: Briefcase },
                      { id: 2, label: "Course Details", icon: List },
                      { id: 3, label: "Teaching & Assessment", icon: Layers },
                      { id: 4, label: "Other Details", icon: File },
                    ].map((step) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          setActiveStep(step.id);
                          setShowSidebarDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition-all font-semibold ${activeStep === step.id ? "bg-indigo-50 border border-indigo-100 shadow-sm text-indigo-800" : "hover:bg-gray-50 text-gray-600"}`}
                      >
                        <div
                          className={`p-2 rounded-lg ${activeStep === step.id ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          <step.icon size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">{step.label}</div>
                      </button>
                    ))}
                  </nav>
                </div>
                {metaData.courseCode && (
                  <div className="mt-5 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="text-indigo-500" size={18} />
                      <h3 className="font-bold text-gray-800">
                        Version History
                      </h3>
                    </div>
                    {recentVersions.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-3 bg-gray-50 rounded-lg">
                        No previous versions found.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {recentVersions.map((ver) => (
                          <div
                            key={ver._id}
                            className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => {
                              fetchFullCD(ver._id);
                              setShowSidebarDropdown(false);
                            }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-extrabold text-indigo-700 text-sm group-hover:text-indigo-800">
                                v{ver.cdVersion}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase bg-white border border-gray-200 text-gray-600 shadow-sm">
                                {ver.status}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-gray-500">
                              {new Date(ver.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={fetchLatestCD}
            disabled={!metaData.courseCode || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-bold disabled:opacity-50 border border-blue-100 shadow-sm"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
              strokeWidth={2.5}
            />{" "}
            Fetch Latest
          </button>
          <button
            onClick={() =>
              navigate("/creator/preview-cd", {
                state: { cdData: transformForSave(cdData), metaData },
              })
            }
            disabled={!metaData.courseCode}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold disabled:opacity-50 shadow-sm"
          >
            <Eye size={18} strokeWidth={2.5} /> Preview
          </button>
          <button
            onClick={() => handleSave("Draft")}
            disabled={loading || !metaData.courseCode}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold disabled:opacity-50 shadow-md shadow-gray-200"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} strokeWidth={2.5} />
            )}{" "}
            Save Draft
          </button>
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-10">
          {activeStep === 1 && renderStep1()}
          {activeStep === 2 && renderStep2()}
          {activeStep === 3 && renderStep3()}
          {activeStep === 4 && renderStep4()}
        </div>

        <div className="mt-8 flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
          <button
            onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
            disabled={activeStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 transition-all shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Previous Step
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAndNext}
              disabled={loading || !metaData.courseCode}
              className="px-6 py-3 text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 disabled:opacity-40 transition-all"
            >
              Save & Continue
            </button>
            <button
              onClick={() => setActiveStep((p) => Math.min(4, p + 1))}
              disabled={activeStep === 4}
              className="flex items-center gap-2 px-8 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md shadow-indigo-200"
            >
              Next Step <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, bg, title, subtitle, noMargin }) => (
  <div
    className={`flex items-center gap-3 ${noMargin ? "" : "mb-6 border-b border-gray-100 pb-4"}`}
  >
    <div className={`p-2.5 ${bg} rounded-xl`}>{icon}</div>
    <div>
      <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const ResourceList = ({ label, accent, items, onChange, className = "" }) => {
  const colors = {
    blue: {
      btn: "text-blue-600 hover:bg-blue-50",
      border: "focus-within:border-blue-400",
    },
    green: {
      btn: "text-green-600 hover:bg-green-50",
      border: "focus-within:border-green-400",
    },
    purple: {
      btn: "text-purple-600 hover:bg-purple-50",
      border: "focus-within:border-purple-400",
    },
  };
  const c = colors[accent] || colors.blue;
  return (
    <div
      className={`bg-gray-50 p-5 rounded-xl border border-gray-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-gray-800">{label}</h4>
        <button
          onClick={() => onChange([...items, ""])}
          className={`text-xs bg-white px-2 py-1 rounded shadow-sm font-bold flex items-center gap-1 ${c.btn}`}
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm ${c.border}`}
          >
            <span className="text-xs font-bold text-gray-400 w-5 text-center">
              {i + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const arr = [...items];
                arr[i] = e.target.value;
                onChange(arr);
              }}
              className="flex-1 px-2 py-1 outline-none text-sm bg-transparent"
              placeholder="Enter resource details…"
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-rose-500 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-2">
            No entries yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditCD;
