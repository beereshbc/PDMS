import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import parse from "html-react-parser";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RESOLVER
// cdData from navigation state has identity nested: d.identity.courseCode
// cdData from API fetch has fields flat:              d.courseCode
// This resolver handles both shapes transparently.
// ─────────────────────────────────────────────────────────────────────────────

const field = (d, key) => d?.[key] || d?.identity?.[key] || "";

// ─────────────────────────────────────────────────────────────────────────────
// HTML HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const isEmpty = (html) =>
  !html ||
  !html.trim() ||
  html.trim() === "<p><br></p>" ||
  html.trim() === "<p></p>";

const P = (html, fb = "<p class='cdp-empty'>Not provided.</p>") =>
  parse(isEmpty(html) ? fb : html);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  :root {
    --black:  #000000;
    --dark:   #111111;
    --accent: #1a3a5c;
    --border: #555555;
    --sh-bg:  #eef1f6;
    --font-body: "Times New Roman", Times, Georgia, serif;
    --font-ui:   "Segoe UI", Arial, Helvetica, sans-serif;
    --font-head: Arial, Helvetica, sans-serif;
  }

  /* ─── Toolbar ──────────────────────────────────────────────────────────── */
  .cdp-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 300;
    height: 50px; background: #0f172a; border-bottom: 1px solid #1e293b;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 18px; gap: 12px; font-family: var(--font-ui);
  }
  .cdp-bar-l, .cdp-bar-c, .cdp-bar-r { display: flex; align-items: center; gap: 8px; }

  .cdp-ghost {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 12.5px; font-weight: 500;
    padding: 5px 11px; border-radius: 5px; transition: background .15s, color .15s;
  }
  .cdp-ghost:hover { background: #1e293b; color: #e2e8f0; }

  .cdp-badge {
    font-size: 11.5px; font-weight: 600; color: #64748b;
    background: #0a0f1a; padding: 3px 10px; border-radius: 4px;
    border: 1px solid #1e293b;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;
  }

  .cdp-zoom-wrap {
    display: flex; align-items: center; gap: 3px;
    background: #1e293b; border-radius: 6px; padding: 3px 8px;
  }
  .cdp-zoom-btn {
    background: none; border: none; cursor: pointer; color: #94a3b8;
    padding: 2px 5px; border-radius: 3px; transition: color .15s;
    display: flex; align-items: center;
  }
  .cdp-zoom-btn:hover { color: #f1f5f9; }
  .cdp-zoom-val {
    font-size: 11.5px; font-weight: 700; color: #e2e8f0;
    min-width: 36px; text-align: center; cursor: pointer;
    font-family: var(--font-ui);
  }

  .cdp-vtag {
    font-size: 10.5px; font-weight: 700; padding: 2px 9px;
    border-radius: 4px; color: #fff;
  }
  .cdp-print-btn {
    display: flex; align-items: center; gap: 6px;
    background: #1d4ed8; color: #fff; border: none; cursor: pointer;
    padding: 7px 16px; border-radius: 6px;
    font-size: 12.5px; font-weight: 700; transition: background .15s;
    font-family: var(--font-ui);
  }
  .cdp-print-btn:hover { background: #1e40af; }

  /* ─── Shell ────────────────────────────────────────────────────────────── */
  .cdp-shell {
    background: #c8d0dc; min-height: 100vh; padding-top: 50px;
    display: flex; flex-direction: column; align-items: center;
    padding-bottom: 80px;
  }
  .cdp-scaler {
    transform-origin: top center; transition: transform .15s ease;
    display: flex; justify-content: center; padding: 30px 0;
  }

  /* ─── A4 Document Page ─────────────────────────────────────────────────── */
  .cdp-doc {
    width: 210mm; min-height: 297mm; background: #fff;
    box-shadow: 0 4px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.08);
    padding: 18mm 18mm 22mm 20mm;
    box-sizing: border-box;
    font-family: var(--font-body);
    font-size: 10.5pt; line-height: 1.6; color: var(--dark);
  }

  /* ─── Document Header Band ─────────────────────────────────────────────── */
  .cdp-hdr {
    text-align: center;
    border-bottom: 2.5px double #000;
    padding-bottom: 10px; margin-bottom: 16px;
  }
  .cdp-hdr .hdr-inst {
    font-size: 11.5pt; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.8px; font-family: var(--font-head); color: var(--accent);
  }
  .cdp-hdr .hdr-type {
    font-size: 13.5pt; font-weight: 900; text-transform: uppercase;
    letter-spacing: 1.5px; font-family: var(--font-head); color: var(--black);
    margin-top: 3px;
  }
  .cdp-hdr .hdr-meta {
    font-size: 10pt; color: #333; margin-top: 5px; font-family: var(--font-body);
  }
  .cdp-hdr .hdr-ver { font-size: 9pt; color: #666; margin-left: 8px; font-weight: normal; }

  /* ─── Section Headings ─────────────────────────────────────────────────── */
  .cdp-sec {
    font-family: var(--font-head); font-size: 10.5pt; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.3px; color: var(--black);
    margin: 16px 0 7px 0; padding: 3px 0;
    border-bottom: 1.5px solid #000;
    page-break-after: avoid;
  }
  .cdp-sec.maj {
    font-size: 11.5pt; color: var(--accent);
    background: var(--sh-bg); padding: 5px 8px;
    border-bottom: 2px solid var(--accent);
    border-left: 4px solid var(--accent);
    margin-top: 24px;
  }
  .cdp-subsec {
    font-family: var(--font-head); font-size: 10pt; font-weight: 700;
    margin: 12px 0 4px 0; color: #1a1a1a; page-break-after: avoid;
  }

  /* ─── Tables ───────────────────────────────────────────────────────────── */
  .cdp-doc table {
    width: 100%; border-collapse: collapse; margin-bottom: 12px;
    table-layout: fixed; word-wrap: break-word; overflow-wrap: break-word;
    font-size: 9.5pt; font-family: var(--font-body);
    page-break-inside: auto;
  }
  .cdp-doc thead { display: table-header-group; }
  .cdp-doc tfoot { display: table-footer-group; }
  .cdp-doc tr    { page-break-inside: avoid; }
  .cdp-doc th, .cdp-doc td {
    border: 1px solid var(--border);
    padding: 5px 7px; vertical-align: top;
    word-break: break-word; overflow-wrap: break-word;
  }
  .cdp-doc th {
    font-family: var(--font-head); font-weight: 700;
    background-color: #e8ecf0 !important;
    text-align: center; vertical-align: middle;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cdp-doc tfoot td {
    font-weight: 700; font-family: var(--font-head);
    background-color: #e8ecf0 !important; text-align: center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* Identity table: label 40%, value 60% */
  .cdp-t-id td:first-child {
    width: 40%; font-weight: 700;
    font-family: var(--font-head); font-size: 9.5pt;
    background: #fafbfc !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cdp-t-id td:last-child { width: 60%; }

  /* Credits */
  .cdp-t-cr th, .cdp-t-cr td { text-align: center; }

  /* Teaching schedule */
  .cdp-t-teach th:nth-child(1), .cdp-t-teach td:nth-child(1) { width: 9%;  text-align: center; }
  .cdp-t-teach th:nth-child(2), .cdp-t-teach td:nth-child(2) { width: 55%; }
  .cdp-t-teach th:nth-child(3), .cdp-t-teach td:nth-child(3) { width: 18%; text-align: center; }
  .cdp-t-teach th:nth-child(4), .cdp-t-teach td:nth-child(4) { width: 18%; text-align: center; }

  /* Course Outcomes 1:3  →  code 25%, description 75% */
  .cdp-t-co td:first-child { width: 25%; font-weight: 700; font-family: var(--font-head); text-align: center; vertical-align: top; }
  .cdp-t-co td:last-child  { width: 75%; text-align: justify; }
  .cdp-t-co th:first-child { width: 25%; }
  .cdp-t-co th:last-child  { width: 75%; text-align: left; }

  /* ─── Rich-Text Wrapper ─────────────────────────────────────────────────── */
  .cdp-rich p         { margin: 0 0 6px 0; text-align: justify; }
  .cdp-rich ul, .cdp-rich ol { margin: 2px 0 8px 0; padding-left: 22px; }
  .cdp-rich li        { margin-bottom: 4px; text-align: justify; }
  .cdp-rich strong, .cdp-rich b { font-weight: 700; }
  .cdp-rich em, .cdp-rich i    { font-style: italic; }
  .cdp-rich h1,.cdp-rich h2,.cdp-rich h3 {
    font-family: var(--font-head); font-weight: 700; margin: 10px 0 5px 0;
  }

  /* Rich tables (Jodit HTML) */
  .cdp-rich table {
    width: 100% !important; border-collapse: collapse !important;
    margin-bottom: 12px !important; table-layout: fixed !important;
    word-wrap: break-word !important; font-size: 9pt !important;
    page-break-inside: auto;
  }
  .cdp-rich th, .cdp-rich td {
    border: 1px solid var(--border) !important;
    padding: 4px 6px !important;
    word-break: break-word !important; overflow-wrap: break-word !important;
    vertical-align: middle !important;
  }
  .cdp-rich th {
    background-color: #e8ecf0 !important; font-weight: 700 !important;
    text-align: center !important; font-family: var(--font-head) !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* Setting Attainment: 3:1  →  description 75%, value 25% */
  .cdp-attain .cdp-rich table td:first-child { width: 75%; }
  .cdp-attain .cdp-rich table td:last-child  { width: 25%; text-align: center; }

  /* ─── Utilities ─────────────────────────────────────────────────────────── */
  .cdp-tc    { text-align: center  !important; }
  .cdp-tj    { text-align: justify !important; }
  .cdp-fb    { font-weight: 700    !important; }
  .cdp-empty { color: #888; font-style: italic; font-size: 9.5pt; margin: 2px 0; }
  .cdp-note  { font-size: 9pt; font-style: italic; color: #555; margin: 0 0 10px 0; }

  /* ─── Signature Footer ──────────────────────────────────────────────────── */
  .cdp-sig {
    display: flex; justify-content: space-between;
    margin-top: 42px; padding-top: 14px; border-top: 1.5px solid #000;
  }
  .cdp-sig-box { width: 36%; text-align: center; }
  .cdp-sig-line {
    border-top: 1px solid #333; padding-top: 4px; margin-top: 28px;
    font-size: 8.5pt; font-family: var(--font-head); color: #444;
  }
  .cdp-footer {
    text-align: center; font-size: 8pt; color: #666; font-family: var(--font-head);
    margin-top: 12px;
  }

  /* ─── Print ─────────────────────────────────────────────────────────────── */
  @media print {
    .cdp-bar, .no-print { display: none !important; }
    .cdp-shell  { background: white !important; padding: 0 !important; }
    .cdp-scaler { transform: none !important; padding: 0 !important; }
    .cdp-doc {
      box-shadow: none !important; width: 100% !important;
      margin: 0 !important; padding: 8mm 14mm 12mm 16mm !important;
      font-size: 10pt !important;
    }
    .cdp-sec.maj              { background: var(--sh-bg) !important; }
    .cdp-doc th               { background-color: #e8ecf0 !important; }
    .cdp-doc tfoot td         { background-color: #e8ecf0 !important; }
    .cdp-t-id td:first-child  { background: #fafbfc !important; }
    .cdp-rich th              { background-color: #e8ecf0 !important; }
    @page { size: A4 portrait; margin: 10mm 13mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Sec = ({ children, maj = false }) => (
  <div className={`cdp-sec${maj ? " maj" : ""}`}>{children}</div>
);

const Subsec = ({ children }) => <div className="cdp-subsec">{children}</div>;

const Rich = ({ html }) => <div className="cdp-rich">{P(html)}</div>;

const Empty = () => <p className="cdp-empty">—</p>;

/** Course Outcomes — 1:3 (code col 25%, description col 75%) */
const COBlock = ({ html, outcomes }) => {
  if (!isEmpty(html)) return <div className="cdp-rich">{parse(html)}</div>;
  if (!outcomes?.length) return <Empty />;
  return (
    <table className="cdp-t-co">
      <thead>
        <tr>
          <th style={{ textAlign: "center" }}>Course Outcome</th>
          <th style={{ textAlign: "left" }}>Description</th>
        </tr>
      </thead>
      <tbody>
        {outcomes.map((co, i) => (
          <tr key={i}>
            <td>{co.code}</td>
            <td className="cdp-tj">{parse(co.description || "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Outcome Map */
const OMapBlock = ({ html, matrix }) => {
  if (!isEmpty(html)) return <div className="cdp-rich">{parse(html)}</div>;
  if (!matrix || matrix.length < 2) return <Empty />;
  return (
    <table>
      <thead>
        <tr>
          {matrix[0].map((h, i) => (
            <th key={i} style={{ fontSize: "8.5pt" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.slice(1).map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={ci === 0 ? "cdp-fb cdp-tc" : "cdp-tc"}
                style={{ fontSize: "8.5pt" }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Assessment Weight Distribution */
const AWBlock = ({ html, data }) => {
  if (!isEmpty(html)) return <div className="cdp-rich">{parse(html)}</div>;
  if (!data?.length) return <Empty />;
  const sum = (k) => data.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const DEFS = {
    q1: 5,
    q2: 4,
    q3: 6,
    t1: 7,
    t2: 8,
    t3: 10,
    a1: 10,
    a2: 10,
    cie: 60,
    see: 40,
  };
  return (
    <table>
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: "9%", verticalAlign: "middle" }}>
            COs
            <br />
            with
            <br />
            Wt.
          </th>
          <th colSpan={3} style={{ width: "21%" }}>
            Quiz = 15 Marks
          </th>
          <th colSpan={3} style={{ width: "21%" }}>
            Test = 25 Marks
          </th>
          <th colSpan={2} style={{ width: "16%" }}>
            Assignment = 20
          </th>
          <th rowSpan={2} style={{ width: "9%", verticalAlign: "middle" }}>
            CIE
            <br />
            =60
          </th>
          <th rowSpan={2} style={{ width: "9%", verticalAlign: "middle" }}>
            SEE
            <br />
            =40
          </th>
        </tr>
        <tr>
          {[
            "Q1\n=5",
            "Q2\n=4",
            "Q3\n=6",
            "T1\n=7",
            "T2\n=8",
            "T3\n=10",
            "A1\n=10",
            "A2\n=10",
          ].map((l) => (
            <th key={l} style={{ fontSize: "8pt", whiteSpace: "pre-line" }}>
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td className="cdp-fb cdp-tc">{row.co}</td>
            {["q1", "q2", "q3", "t1", "t2", "t3", "a1", "a2"].map((k) => (
              <td key={k} className="cdp-tc">
                {row[k] || ""}
              </td>
            ))}
            <td className="cdp-tc cdp-fb">{row.cie || ""}</td>
            <td className="cdp-tc cdp-fb">{row.see || ""}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          {["q1", "q2", "q3", "t1", "t2", "t3", "a1", "a2", "cie", "see"].map(
            (k) => (
              <td key={k}>{sum(k) || DEFS[k]}</td>
            ),
          )}
        </tr>
      </tfoot>
    </table>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

const PreviewCD = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { axios, createrToken } = useAppContext();

  const [cdId, setCdId] = useState(params.id || location.state?.cdId || null);
  const [data, setData] = useState(
    location.state?.cdData
      ? { cdData: location.state.cdData, metaData: location.state.metaData }
      : null,
  );
  const [loading, setLoading] = useState(!data && !!params.id);
  const [zoom, setZoom] = useState(0.85);

  // ── Fetch when navigated by URL param ─────────────────────────────────────
  useEffect(() => {
    if (data && !params.id) {
      setLoading(false);
      return;
    }
    if (!params.id) {
      navigate("/creator/history");
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get(`/api/creater/cd/fetch/${params.id}`, {
          headers: { createrToken },
        });
        if (res.data.success) {
          const cd = res.data.cd;
          setCdId(params.id);
          setData({
            metaData: {
              courseId: params.id,
              courseCode: cd.courseCode,
              courseTitle: cd.courseTitle,
              programName: cd.programTitle || cd.programName,
              versionNo: cd.cdVersion,
              status: cd.status,
              isNew: false,
            },
            cdData: cd,
          });
        } else {
          toast.error(res.data.message || "Failed to load document");
          navigate("/creator/history");
        }
      } catch {
        toast.error("Error loading document");
        navigate("/creator/history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  // ── Auto-print ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && data && location.state?.autoPrint) {
      const t = setTimeout(() => window.print(), 900);
      return () => clearTimeout(t);
    }
  }, [loading, data]);

  // ── Back — return to EditCD loaded with this same CD ──────────────────────
  const handleBack = useCallback(() => {
    const id = cdId || location.state?.cdId;
    if (id) {
      // Trigger EditCD's useEffect that calls fetchFullCD(id)
      navigate("/creator/edit-cd", { state: { loadId: id } });
    } else {
      navigate(-1);
    }
  }, [cdId, navigate, location.state]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zIn = () => setZoom((z) => Math.min(z + 0.1, 2.0));
  const zOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const zReset = () => setZoom(0.85);

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(async () => {
    if (!data) return;
    const { cdData: d, metaData: m } = data;
    const code = field(d, "courseCode") || "CD";
    const title = (field(d, "courseTitle") || "Course")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    const ver = (m.versionNo || "1_0_0").replace(/\./g, "_");
    const fname = `${code}_${title}_v${ver}_${new Date().toISOString().slice(0, 10)}.pdf`;
    try {
      await navigator.clipboard.writeText(fname);
      toast.success(`📋 Filename copied: ${fname}`);
      alert(`Suggested filename:\n\n${fname}\n\nPaste it in the Save dialog.`);
    } catch {
      /* clipboard denied */
    }
    window.print();
  }, [data]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0f172a",
        }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <RefreshCw
          style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }}
          size={40}
        />
      </div>
    );
  if (!data)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0f172a",
          color: "#f87171",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        No document data available.
      </div>
    );

  const { cdData: d, metaData: m } = data;
  const f = (key) => field(d, key); // shorthand for this render

  const statusBg = {
    Approved: "#166534",
    UnderReview: "#7c3aed",
    Draft: "#92400e",
    Archived: "#374151",
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* ══ TOOLBAR ════════════════════════════════════════════════════════ */}
      <div className="cdp-bar no-print">
        <div className="cdp-bar-l">
          <button className="cdp-ghost" onClick={handleBack}>
            <ArrowLeft size={15} /> Back to Editor
          </button>
          <div className="cdp-badge">
            <FileText
              size={11}
              style={{
                display: "inline",
                marginRight: 5,
                verticalAlign: "middle",
              }}
            />
            {[f("courseCode"), f("courseTitle")].filter(Boolean).join(" — ") ||
              "Course Document"}
          </div>
        </div>

        <div className="cdp-bar-c">
          <div className="cdp-zoom-wrap">
            <button className="cdp-zoom-btn" onClick={zOut} title="Zoom out">
              <ZoomOut size={14} />
            </button>
            <span className="cdp-zoom-val" onDoubleClick={zReset}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="cdp-zoom-btn" onClick={zIn} title="Zoom in">
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        <div className="cdp-bar-r">
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            v{m.versionNo || "1.0.0"}
          </span>
          <span
            className="cdp-vtag"
            style={{ background: statusBg[m.status] || "#374151" }}
          >
            {m.status || "Draft"}
          </span>
          <button className="cdp-print-btn" onClick={handlePrint}>
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ══ SHELL ══════════════════════════════════════════════════════════ */}
      <div className="cdp-shell">
        <div
          className="cdp-scaler"
          style={{
            transform: `scale(${zoom})`,
            marginBottom:
              zoom < 1 ? `${(zoom - 1) * 860}px` : `${(zoom - 1) * 1120}px`,
          }}
        >
          <div className="cdp-doc">
            {/* ─── HEADER ────────────────────────────────────────────── */}
            <div className="cdp-hdr">
              {f("schoolTitle") && (
                <div className="hdr-inst">{f("schoolTitle")}</div>
              )}
              <div className="hdr-type">Course Document</div>
              <div className="hdr-meta">
                {f("courseCode") && <strong>{f("courseCode")}</strong>}
                {f("courseCode") && f("courseTitle") && (
                  <span style={{ margin: "0 6px" }}>—</span>
                )}
                {f("courseTitle")}
                {m.versionNo && (
                  <span className="hdr-ver">(v{m.versionNo})</span>
                )}
              </div>
            </div>

            {/* ══ 1. COURSE IDENTITY ═════════════════════════════════ */}
            <Sec maj>1.&nbsp; Course Identity</Sec>

            <table className="cdp-t-id">
              <tbody>
                {[
                  ["Course Code", f("courseCode")],
                  ["Course Title", f("courseTitle")],
                  ["Program Code", f("programCode")],
                  ["Program Title", f("programTitle")],
                  ["School Code", f("schoolCode")],
                  ["School Title", f("schoolTitle")],
                  ["Department Code", f("departmentCode")],
                  ["Department", f("department")],
                  ["Faculty Code", f("facultyCode")],
                  ["Faculty Title", f("facultyTitle")],
                  ["Department Offering the Course", f("offeringDepartment")],
                  ["Faculty Member", f("facultyMember")],
                  ["Semester Duration", f("semesterDuration")],
                ].map(([lbl, val]) => (
                  <tr key={lbl}>
                    <td>{lbl}</td>
                    <td>{val || <span className="cdp-empty">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Sec>1.1&nbsp; Course Size</Sec>
            <table className="cdp-t-cr" style={{ width: "58%" }}>
              <thead>
                <tr>
                  <th>Total Credits</th>
                  <th>L — Lecture</th>
                  <th>T — Tutorial</th>
                  <th>P — Practical</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cdp-fb cdp-tc">{d.credits?.total ?? 0}</td>
                  <td className="cdp-tc">{d.credits?.L ?? 0}</td>
                  <td className="cdp-tc">{d.credits?.T ?? 0}</td>
                  <td className="cdp-tc">{d.credits?.P ?? 0}</td>
                  <td className="cdp-fb cdp-tc">{d.totalHours ?? 0}</td>
                </tr>
              </tbody>
            </table>

            {/* ══ 2. COURSE DETAILS ══════════════════════════════════ */}
            <Sec maj>2.&nbsp; Course Details</Sec>

            <Sec>2.1&nbsp; Course Aims and Summary</Sec>
            <Rich html={d.aimsSummary} />

            <Sec>2.2&nbsp; Course Objectives</Sec>
            <Rich html={d.objectives} />

            {/* 2.3 — CO code:description = 1:3 (25% : 75%) */}
            <Sec>2.3&nbsp; Course Outcomes (COs)</Sec>
            <p
              style={{
                fontSize: "9.5pt",
                fontStyle: "italic",
                marginBottom: 6,
              }}
            >
              After undergoing this course, students will be able to:
            </p>
            <COBlock html={d.courseOutcomesHtml} outcomes={d.courseOutcomes} />

            {/* Outcome Map */}
            <Subsec>Outcome Map (CO → PO / PSO)</Subsec>
            <OMapBlock html={d.outcomeMapHtml} matrix={d.outcomeMap?.matrix} />
            <p className="cdp-note">
              Relevance: 1 = High &nbsp;|&nbsp; 2 = Medium &nbsp;|&nbsp; 3 = Low
            </p>

            <Sec>2.4&nbsp; Course Content (Syllabus)</Sec>
            <Rich html={d.courseContent} />

            <Sec>2.5&nbsp; Course Resources</Sec>

            <Subsec>Text Books</Subsec>
            {d.resources?.textBooks?.length > 0 ? (
              <ol
                style={{ paddingLeft: 22, marginBottom: 10, fontSize: "9.5pt" }}
              >
                {d.resources.textBooks.map((t, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {t}
                  </li>
                ))}
              </ol>
            ) : (
              <Empty />
            )}

            <Subsec>Reference Books</Subsec>
            {d.resources?.references?.length > 0 ? (
              <ol
                style={{ paddingLeft: 22, marginBottom: 10, fontSize: "9.5pt" }}
              >
                {d.resources.references.map((r, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {r}
                  </li>
                ))}
              </ol>
            ) : (
              <Empty />
            )}

            <Subsec>Other Resources</Subsec>
            {d.resources?.otherResources?.length > 0 ? (
              <ul
                style={{ paddingLeft: 22, marginBottom: 10, fontSize: "9.5pt" }}
              >
                {d.resources.otherResources.map((r, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}

            {/* ══ 3. TEACHING & ASSESSMENT ═══════════════════════════ */}
            <Sec maj>3.&nbsp; Teaching and Assessment</Sec>

            <Sec>3.1&nbsp; Teaching Schedule</Sec>
            {d.teaching?.length > 0 ? (
              <table className="cdp-t-teach">
                <thead>
                  <tr>
                    <th>Sl. No.</th>
                    <th style={{ textAlign: "left" }}>Lecture Topic</th>
                    <th>Slides</th>
                    <th>Videos</th>
                  </tr>
                </thead>
                <tbody>
                  {d.teaching.map((lec, i) => (
                    <tr key={i}>
                      <td className="cdp-tc">{lec.number}</td>
                      <td>{lec.topic}</td>
                      <td className="cdp-tc">{lec.slides}</td>
                      <td className="cdp-tc">{lec.videos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty />
            )}

            <Sec>3.2&nbsp; Assessment Weight Distribution</Sec>
            <AWBlock html={d.assessmentWeightHtml} data={d.assessmentWeight} />

            <Sec>3.3&nbsp; Grading Criterion</Sec>
            <Rich html={d.gradingCriterion} />

            {/* Attainment Calculations */}
            {(d.attainmentCalculations?.recordingMarks ||
              d.attainmentCalculations?.settingTargets) && (
              <>
                <Sec>Attainment Calculations</Sec>

                {d.attainmentCalculations.recordingMarks && (
                  <>
                    <Subsec>Recording Marks and Awarding Grades</Subsec>
                    <Rich html={d.attainmentCalculations.recordingMarks} />
                  </>
                )}

                {/* Setting Attainment — table columns 3:1 (75% : 25%) */}
                {d.attainmentCalculations.settingTargets && (
                  <>
                    <Subsec>Setting Attainment Targets</Subsec>
                    <div className="cdp-attain">
                      <Rich html={d.attainmentCalculations.settingTargets} />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ══ 4. OTHER DETAILS ═══════════════════════════════════ */}
            <Sec maj>4.&nbsp; Other Details</Sec>

            <Sec>4.1&nbsp; Assignment Details / Problem Based Learning</Sec>
            <Rich html={d.otherDetails?.assignmentDetails} />

            <Sec>4.2&nbsp; Academic Integrity Policy</Sec>
            <Rich html={d.otherDetails?.academicIntegrity} />

            {/* ─── Signature Footer ──────────────────────────────────── */}
            <div className="cdp-sig">
              <div className="cdp-sig-box">
                <div className="cdp-sig-line">Prepared by — Faculty Member</div>
              </div>
              <div className="cdp-sig-box">
                <div className="cdp-sig-line">
                  Verified by — Head of Department
                </div>
              </div>
            </div>
            <p className="cdp-footer">
              Official Academic Record &nbsp;·&nbsp;
              {f("schoolTitle") || f("department") || "Institution"}{" "}
              &nbsp;·&nbsp; Generated:{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {/* /cdp-doc */}
        </div>
        {/* /cdp-scaler */}
      </div>
      {/* /cdp-shell */}
    </>
  );
};

export default PreviewCD;
