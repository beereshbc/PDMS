import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import parse from "html-react-parser";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Printer,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  LayoutGrid,
  Target,
  Award,
  BookOpen,
  Layers,
  Hash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const splitObjective = (htmlString, defaultTitle = "") => {
  if (!htmlString) return { title: defaultTitle, description: "" };
  const titleMatch = htmlString.match(/<b>(.*?)<\/b>/);
  const title = titleMatch ? titleMatch[1].trim() : defaultTitle;
  const description = htmlString
    .replace(/<b>.*?<\/b>/, "")
    .replace(/^<br\/?>/, "")
    .trim();
  return { title, description };
};

const sumCredits = (courses = []) =>
  courses.reduce((a, c) => a + (parseFloat(c.credits) || 0), 0);

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL — Admin action sidebar
// ─────────────────────────────────────────────────────────────────────────────
const ActionPanel = ({
  pd,
  s1,
  s2,
  s3,
  s4,
  onApprove,
  onRevise,
  submitting,
}) => {
  const checks = [
    { label: "Section 1 – Program Info", ok: !!s1?.awardTitle },
    { label: "Section 2 – Objectives", ok: !!s2?.programOverview },
    { label: "Section 3 – Structure", ok: !!(s3?.semesters?.length > 0) },
    { label: "Section 4 – Electives", ok: !!s4?.professionalElectives },
  ];
  const score = checks.filter((c) => c.ok).length;
  const pct = Math.round((score / checks.length) * 100);

  return (
    <aside className="w-64 flex-shrink-0 sticky top-0 self-start flex flex-col gap-3">
      {/* ── Creator card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900 to-stone-900 px-4 py-3">
          <p className="text-[10px] font-bold text-amber-300/80 uppercase tracking-widest">
            Submitted By
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg flex-shrink-0">
              {pd?.createdBy?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 truncate">
                {pd?.createdBy?.name || "Creator"}
              </p>
              <p className="text-[10px] text-stone-400 truncate mt-0.5">
                {pd?.createdBy?.email || ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
            {[
              {
                label: "Faculty",
                value: pd?.createdBy?.faculty || pd?.faculty,
              },
              { label: "School", value: pd?.createdBy?.school || pd?.school },
              {
                label: "Department",
                value: pd?.createdBy?.department || pd?.department,
              },
              { label: "Designation", value: pd?.createdBy?.designation },
            ]
              .filter((r) => r.value)
              .map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-stone-400 flex-shrink-0">{label}</span>
                  <span className="text-stone-700 font-semibold text-right leading-tight">
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Document meta ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
          Document
        </p>
        <div className="space-y-2">
          {[
            { label: "Program ID", value: pd?.programCode },
            { label: "Version", value: `v${pd?.pdVersion}` },
            { label: "Scheme", value: pd?.schemeYear },
            { label: "Status", value: pd?.status },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-stone-400">{label}</span>
              <span
                className={`text-xs font-bold ${
                  label === "Status"
                    ? "bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full"
                    : "text-stone-700"
                }`}
              >
                {value || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Completion ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Sections
          </p>
          <span
            className={`text-sm font-black ${pct === 100 ? "text-green-600" : "text-amber-600"}`}
          >
            {score}/{checks.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-1.5">
          {checks.map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-green-100" : "bg-stone-100"}`}
              >
                {ok ? (
                  <CheckCircle2 size={10} className="text-green-600" />
                ) : (
                  <Clock size={10} className="text-stone-400" />
                )}
              </div>
              <span
                className={`text-[11px] leading-tight ${ok ? "text-stone-700" : "text-stone-400"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────── */}
      <button
        onClick={onApprove}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-800 text-white rounded-2xl font-bold hover:bg-amber-900 shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
      >
        <CheckCircle size={16} />
        {submitting ? "Approving…" : "Approve Document"}
      </button>
      <button
        onClick={onRevise}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 text-stone-600 rounded-2xl font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-sm"
      >
        <XCircle size={15} />
        Request Revision
      </button>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT VIEWER (right side) — matches Preview.jsx table structure exactly
// ─────────────────────────────────────────────────────────────────────────────
const DOC_STYLES = `
  .pd-doc-viewer {
    background: #3a3a3a;
    padding: 32px 24px;
    min-height: 100%;
    border-radius: 20px;
    overflow: auto;
  }
  .pd-scaling-wrapper {
    transform-origin: top center;
    transition: transform 0.15s ease;
    display: flex;
    justify-content: center;
  }
  .pd-doc {
    width: 210mm;
    background: white;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    padding: 20mm;
    box-sizing: border-box;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
  }
  .pd-doc table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    border: 1px solid #000;
  }
  .pd-doc th, .pd-doc td {
    border: 1px solid #000;
    padding: 5px 8px;
    text-align: left;
    vertical-align: top;
  }
  .pd-doc th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }
  .pd-doc .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 257mm;
    page-break-after: always;
  }
  .pd-doc .uni-name {
    font-size: 32pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 36px;
  }
  .pd-doc .doc-type {
    font-size: 20pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .pd-doc .scheme-title {
    font-size: 17pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .pd-doc .sem-range {
    font-size: 14pt;
    text-transform: uppercase;
    margin-bottom: 48px;
  }
  .pd-doc .program-title {
    font-size: 22pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.3;
    margin-top: 32px;
  }
  .pd-doc h1.int-hdr {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 20px 0 8px;
  }
  .pd-doc h2.sec-hdr {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 28px 0 12px;
  }
  .pd-doc h3.sem-hdr {
    font-size: 11pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 14px 0 8px;
  }
  .pd-doc .page-break { page-break-after: always; display: block; height: 0; }
  .pd-doc .w40  { width: 40px;  text-align: center; }
  .pd-doc .w100 { width: 100px; }
  .pd-doc .w200 { width: 200px; font-weight: bold; }
  .pd-doc .w300 { width: 300px; }
  .pd-doc .tc   { text-align: center; }
  .pd-doc .tr   { text-align: right; }
  .pd-doc .bold { font-weight: bold; }
  .pd-doc .mb8  { margin-bottom: 8px; }
  .pd-doc .obj-item { margin-bottom: 12px; }
  .pd-doc .credit-box {
    border: 1px solid #000;
    background: #fafafa;
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 10pt;
  }
  @media print {
    .no-print { display: none !important; }
    .pd-doc-viewer { background: white; padding: 0; }
    .pd-scaling-wrapper { transform: none !important; }
    .pd-doc { box-shadow: none; width: 100%; padding: 10mm; }
    @page { size: A4; margin: 15mm; }
    .pd-doc th { background-color: #f0f0f0 !important; }
  }
`;

const DocumentViewer = ({ pd, zoom }) => {
  const s1 = pd?.section1_info || {};
  const s2 = pd?.section2_objectives || {};
  const s3 = pd?.section3_structure || {};
  const s4 = pd?.section4_electives || {};

  const creditDef = s3?.creditDefinition || {};
  const semesters = (s3?.semesters || []).map((s) => ({
    sem_no: s.semNumber || s.number,
    courses: s.courses || [],
  }));
  const structTable = s3?.structureTable || [];
  const profElectives = (s4?.professionalElectives || []).map((g) => ({
    sem: g.semester,
    title: g.title,
    courses: g.courses || [],
  }));
  const openElectives = (s4?.openElectives || []).map((g) => ({
    sem: g.semester,
    title: g.title,
    courses: g.courses || [],
  }));

  const ts = new Date().toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="pd-doc-viewer flex-1 min-h-screen">
      <div
        className="pd-scaling-wrapper"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      >
        <div className="pd-doc">
          {/* ── COVER ──────────────────────────────────────────────── */}
          <div className="cover">
            <div className="uni-name">GM University</div>
            <div className="doc-type">Program Document</div>
            <div className="scheme-title">{pd?.schemeYear || "—"} Scheme</div>
            <div className="sem-range">I – VIII Semester</div>
            <div className="program-title">
              {s1?.awardTitle?.toUpperCase() ||
                s1?.programName?.toUpperCase() ||
                pd?.programCode ||
                "Program"}
            </div>
            <div
              style={{
                marginTop: "64px",
                fontSize: "13pt",
                fontWeight: "bold",
                lineHeight: 1.7,
              }}
            >
              {s1?.school && <div>{s1.school}</div>}
              {s1?.faculty && <div>{s1.faculty}</div>}
            </div>
          </div>

          {/* ── INTERNAL HEADER ────────────────────────────────────── */}
          <h1 className="int-hdr">{s1?.programName || pd?.programCode}</h1>
          <div className="tc bold mb8" style={{ fontSize: "10pt" }}>
            Version: {pd?.pdVersion}
            {pd?.effectiveAcademicYear
              ? ` | Effective AY: ${pd.effectiveAcademicYear}`
              : ""}
          </div>

          {/* Table 1 – Program Details */}
          <table>
            <tbody>
              {[
                { label: "Faculty", value: s1?.faculty },
                { label: "School", value: s1?.school },
                { label: "Department", value: s1?.department },
                { label: "Program", value: s1?.programName },
                { label: "Director of School", value: s1?.directorOfSchool },
                { label: "Head of Department", value: s1?.headOfDepartment },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="w200">{label}</td>
                  <td>{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table 2 – Award Details */}
          <table>
            <tbody>
              {[
                {
                  id: "1.",
                  label: "Title of the Award",
                  value: s1?.awardTitle,
                },
                { id: "2.", label: "Modes of Study", value: s1?.modeOfStudy },
                {
                  id: "3.",
                  label: "Awarding Institution / Body",
                  value: s1?.awardingInstitution,
                },
                { id: "4.", label: "Joint Award", value: s1?.jointAward },
                {
                  id: "5.",
                  label: "Teaching Institution",
                  value: s1?.teachingInstitution,
                },
                {
                  id: "6.",
                  label: "Date of Program Specifications",
                  value: s1?.dateOfProgramSpecs,
                },
                {
                  id: "7.",
                  label: "Date of Course Approval",
                  value: s1?.dateOfCourseApproval,
                },
                {
                  id: "8.",
                  label: "Next Review Date",
                  value: s1?.nextReviewDate,
                },
                {
                  id: "9.",
                  label: "Program Approving Body",
                  value: s1?.approvingRegulatingBody,
                },
                {
                  id: "10.",
                  label: "Program Accredited Body",
                  value: s1?.accreditedBody,
                },
                { id: "11.", label: "Grade Awarded", value: s1?.gradeAwarded },
                {
                  id: "12.",
                  label: "Accreditation Validity",
                  value: s1?.accreditationValidity,
                },
                {
                  id: "13.",
                  label: "Program Benchmark",
                  value: s1?.programBenchmark,
                },
              ].map(({ id, label, value }) => (
                <tr key={id}>
                  <td className="w40 bold">{id}</td>
                  <td className="w300">{label}</td>
                  <td>{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 14. Program Overview */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">14.</td>
                <td>
                  <div className="bold mb8">PROGRAM OVERVIEW</div>
                  <div style={{ textAlign: "justify" }}>
                    {s2?.programOverview ? parse(s2.programOverview) : "—"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 15. PEOs */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">15.</td>
                <td>
                  <div className="bold mb8">
                    PROGRAM EDUCATIONAL OBJECTIVES (PEOs)
                  </div>
                  {(s2?.peos || []).map((peo, i) => {
                    if (!peo) return null;
                    const { title, description } = splitObjective(
                      peo,
                      `PEO-${i + 1}`,
                    );
                    return (
                      <div key={i} className="obj-item">
                        <div className="bold">
                          PEO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                  {!s2?.peos?.filter(Boolean).length && <div>—</div>}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 16. POs */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">16.</td>
                <td>
                  <div className="bold mb8">PROGRAM OUTCOMES (POs)</div>
                  {(s2?.pos || []).map((po, i) => {
                    if (!po) return null;
                    const { title, description } = splitObjective(
                      po,
                      `PO-${i + 1}`,
                    );
                    return (
                      <div key={i} className="obj-item">
                        <div className="bold">
                          PO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                  {!s2?.pos?.filter(Boolean).length && <div>—</div>}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 17. PSOs */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">17.</td>
                <td>
                  <div className="bold mb8">
                    PROGRAM SPECIFIC OUTCOMES (PSOs)
                  </div>
                  <div className="italic mb8">
                    Upon successful completion of the program, graduates will
                    possess the capability to:
                  </div>
                  {(s2?.psos || []).map((pso, i) => {
                    if (!pso) return null;
                    const { title, description } = splitObjective(
                      pso,
                      `PSO-${i + 1}`,
                    );
                    return (
                      <div key={i} className="obj-item">
                        <div className="bold">
                          PSO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                  {!s2?.psos?.filter(Boolean).length && <div>—</div>}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 18. Programme Structure */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">18.</td>
                <td>
                  <div className="bold mb8">PROGRAMME STRUCTURE</div>
                  <div className="credit-box">
                    <span className="bold">Definition of Credit:&nbsp;</span>1
                    Hr. Lecture (L) / week : {creditDef?.lecture ?? "—"}{" "}
                    Credit&nbsp;|&nbsp; 2 Hr. Tutorial (T) / week :{" "}
                    {creditDef?.tutorial ?? "—"} Credit&nbsp;|&nbsp; 2 Hr.
                    Practical (P) / week : {creditDef?.practical ?? "—"} Credit
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th className="w40">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structTable.map((row, i) => (
                        <tr key={i}>
                          <td>{row.category || "—"}</td>
                          <td className="tc">{row.credits ?? 0}</td>
                        </tr>
                      ))}
                      {structTable.length === 0 && (
                        <tr>
                          <td
                            colSpan="2"
                            className="tc italic"
                            style={{ color: "#999" }}
                          >
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          backgroundColor: "#f0f0f0",
                          fontWeight: "bold",
                        }}
                      >
                        <td className="tr" style={{ paddingRight: 12 }}>
                          Total Credits:
                        </td>
                        <td className="tc">
                          {structTable.reduce(
                            (a, r) => a + (parseFloat(r.credits) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 19. Credit definitions */}
          <table>
            <tbody>
              <tr>
                <td className="w40 bold">19.</td>
                <td>
                  <div className="bold mb8">CREDIT DEFINITIONS (L-T-P)</div>
                  <table style={{ width: "55%", margin: "0 auto" }}>
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Lecture (L)", val: creditDef?.lecture },
                        { label: "Tutorial (T)", val: creditDef?.tutorial },
                        { label: "Practical (P)", val: creditDef?.practical },
                      ].map(({ label, val }) => (
                        <tr key={label}>
                          <td className="tc">{label}</td>
                          <td className="tc">{val ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="page-break" />

          {/* 20. Semester-wise Courses */}
          <h2 className="sec-hdr">20. Semester-Wise Courses</h2>
          {semesters.map((sem) =>
            sem.courses.length > 0 ? (
              <div
                key={sem.sem_no}
                style={{ marginBottom: 24, pageBreakInside: "avoid" }}
              >
                <h3 className="sem-hdr">Semester {sem.sem_no}</h3>
                <table>
                  <thead>
                    <tr>
                      <th className="w40">S.No</th>
                      <th className="w100">Code</th>
                      <th>Course Title</th>
                      <th className="w40">Cr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, i) => (
                      <tr key={i}>
                        <td className="tc">{i + 1}</td>
                        <td>{c.code || "—"}</td>
                        <td>{c.title || "—"}</td>
                        <td className="tc">{c.credits ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}
                    >
                      <td
                        colSpan="3"
                        className="tr"
                        style={{ paddingRight: 12 }}
                      >
                        Total:
                      </td>
                      <td className="tc">{sumCredits(sem.courses)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : null,
          )}

          {semesters.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#999",
                fontStyle: "italic",
              }}
            >
              No semester data defined.
            </p>
          )}

          <div className="page-break" />

          {/* 21. Professional Electives */}
          {profElectives.length > 0 && (
            <>
              <h2 className="sec-hdr">21. Professional Electives</h2>
              {profElectives.map((g, i) => (
                <div
                  key={i}
                  style={{ marginBottom: 24, pageBreakInside: "avoid" }}
                >
                  <div className="bold mb8" style={{ fontSize: "11pt" }}>
                    {g.title} (Semester {g.sem})
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="w40">#</th>
                        <th className="w100">Code</th>
                        <th>Title</th>
                        <th className="w40">Cr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.courses.map((c, idx) => (
                        <tr key={idx}>
                          <td className="tc">{idx + 1}</td>
                          <td>{c.code || "—"}</td>
                          <td>{c.title || "—"}</td>
                          <td className="tc">{c.credits ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* 22. Open Electives */}
          {openElectives.length > 0 && (
            <>
              <h2 className="sec-hdr">22. Open Electives</h2>
              {openElectives.map((g, i) => (
                <div
                  key={i}
                  style={{ marginBottom: 24, pageBreakInside: "avoid" }}
                >
                  <div className="bold mb8" style={{ fontSize: "11pt" }}>
                    {g.title} (Semester {g.sem})
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="w40">#</th>
                        <th className="w100">Code</th>
                        <th>Title</th>
                        <th className="w40">Cr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.courses.map((c, idx) => (
                        <tr key={idx}>
                          <td className="tc">{idx + 1}</td>
                          <td>{c.code || "—"}</td>
                          <td>{c.title || "—"}</td>
                          <td className="tc">{c.credits ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 10,
              borderTop: "1px solid #ccc",
              textAlign: "center",
              fontSize: "8pt",
              color: "#888",
            }}
          >
            {s1?.programName || pd?.programCode} &nbsp;•&nbsp; Version{" "}
            {pd?.pdVersion} &nbsp;•&nbsp; Generated: {ts}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const PDReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const [pd, setPd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.75);
  const [rejectionMsg, setMsg] = useState("");
  const [showModal, setModal] = useState(false);
  const [submitting, setSub] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/admin/reviews/pd/${id}`);
        if (data.success) setPd(data.pd);
        else toast.error(data.message || "Document not found");
      } catch {
        toast.error("Error loading document");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAction = async (status) => {
    if (status === "Draft" && !rejectionMsg.trim())
      return toast.error("Please provide a reason");
    setSub(true);
    try {
      const { data } = await axios.put(`/api/admin/reviews/pd/${id}`, {
        status,
        rejectionMessage: rejectionMsg,
      });
      if (data.success) {
        toast.success(
          status === "Approved"
            ? "Program Document Approved ✓"
            : "Returned for revision",
        );
        navigate("/admin/pd-reviews");
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setSub(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-72">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-200 border-t-amber-700 rounded-full animate-spin mx-auto" />
            <p className="text-stone-400 text-sm">Loading Program Document…</p>
          </div>
        </div>
      </AdminLayout>
    );

  const s1 = pd?.section1_info || {};
  const s2 = pd?.section2_objectives || {};
  const s3 = pd?.section3_structure || {};
  const s4 = pd?.section4_electives || {};

  return (
    <AdminLayout>
      <style>{DOC_STYLES}</style>

      <div className="max-w-[1440px] mx-auto flex flex-col gap-0">
        {/* ── TOP TOOLBAR ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap no-print">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-amber-800 font-semibold transition-colors group text-sm"
          >
            <ChevronLeft
              size={17}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Review List
          </button>

          {/* Identity strip */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm font-bold text-stone-800 truncate max-w-xs">
              {pd?.programName || s1?.programName || pd?.programCode}
            </p>
            <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded-full hidden sm:block">
              v{pd?.pdVersion} · {pd?.schemeYear}
            </span>
          </div>

          {/* Zoom + print */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-stone-900 rounded-xl px-2.5 py-1.5">
              <button
                onClick={() => setZoom((p) => Math.max(0.4, p - 0.05))}
                className="p-1 text-stone-400 hover:text-white rounded transition-colors"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-xs font-bold text-stone-300 w-9 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((p) => Math.min(2.0, p + 0.05))}
                className="p-1 text-stone-400 hover:text-white rounded transition-colors"
              >
                <ZoomIn size={13} />
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-stone-300 border border-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* ── SPLIT LAYOUT ─────────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">
          {/* LEFT — sticky admin panel */}
          <div className="no-print sticky top-4 self-start">
            <ActionPanel
              pd={pd}
              s1={s1}
              s2={s2}
              s3={s3}
              s4={s4}
              onApprove={() => handleAction("Approved")}
              onRevise={() => setModal(true)}
              submitting={submitting}
            />
          </div>

          {/* RIGHT — document viewer */}
          <div className="flex-1 min-w-0 rounded-2xl overflow-hidden">
            <DocumentViewer pd={pd} zoom={zoom} />
          </div>
        </div>
      </div>

      {/* ── REJECTION MODAL ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Return for Revision
                </h3>
                <p className="text-stone-500 text-sm mt-1">
                  Describe the specific issues that need to be corrected before
                  approval.
                </p>
              </div>
            </div>
            <textarea
              className="w-full h-36 p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-200 text-sm resize-none text-stone-700 placeholder:text-stone-300"
              placeholder="e.g., Missing credits in Semester 4, PEO-3 is incomplete, PSO mapping is incorrect…"
              value={rejectionMsg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setModal(false)}
                className="text-stone-400 font-semibold hover:text-stone-600 transition-colors text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setModal(false);
                  handleAction("Draft");
                }}
                disabled={!rejectionMsg.trim() || submitting}
                className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all text-sm disabled:opacity-40 active:scale-[0.98]"
              >
                {submitting ? "Sending…" : "Notify Creator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PDReviewDetail;
