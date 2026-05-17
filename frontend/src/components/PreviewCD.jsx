import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  List,
  Search,
  ChevronDown,
  Download,
  Maximize2,
  Minimize2,
  BookOpen,
  Copy,
  CheckCircle,
  Keyboard,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import parse from "html-react-parser";
import { toast } from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────────────────────────────────────── */

const field = (d, key) => d?.[key] || d?.identity?.[key] || "";

const isEmpty = (html) =>
  !html ||
  !html.trim() ||
  html.trim() === "<p><br></p>" ||
  html.trim() === "<p></p>";

const P = (html, fb = "<p class='cdp-empty'>Not provided.</p>") =>
  parse(isEmpty(html) ? fb : html);

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES (Black & White Academic Theme)
───────────────────────────────────────────────────────────────────────────── */

const STYLES = `
  :root {
    --bg-shell: #0f172a;
    --font-doc: 'Times New Roman', Times, Georgia, serif;
    --font-ui: 'Segoe UI', system-ui, sans-serif;
    --bar-h: 54px;
  }

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Shell & UI ──────────────────────────────────────────────── */
  .cdp-shell { background: var(--bg-shell); min-height: 100vh; padding-top: var(--bar-h); display: flex; flex-direction: column; align-items: center; padding-bottom: 100px; }
  .preview-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.98); z-index: 9999; overflow-y: auto; padding-top: var(--bar-h); padding-bottom: 80px; }

  .cdp-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 10000; height: var(--bar-h); background: #0b1120; border-bottom: 1px solid #1e293b; display: flex; align-items: center; padding: 0 16px; gap: 10px; font-family: var(--font-ui); }
  .cdp-bar-l { display: flex; align-items: center; gap: 8px; flex: 1; }
  .cdp-bar-c { display: flex; align-items: center; gap: 6px; }
  .cdp-bar-r { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: flex-end; }

  .cdp-btn { display: flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 5px; transition: 0.2s; }
  .cdp-btn:hover { background: #1e293b; color: #f8fafc; }
  .cdp-btn.active { color: #fff; background: #334155; }

  .cdp-search-wrap { display: flex; align-items: center; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 4px 10px; gap: 6px; }
  .cdp-search-wrap input { background: none; border: none; outline: none; color: #f8fafc; font-size: 11.5px; width: 160px; font-family: var(--font-ui); }
  .cdp-search-wrap input::placeholder { color: #64748b; }

  .cdp-action { display: flex; align-items: center; gap: 6px; background: #ffffff; color: #000; border: none; cursor: pointer; padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; transition: 0.2s; font-family: var(--font-ui); }
  .cdp-action:hover { background: #f1f5f9; }

  /* Dropdown */
  .cdp-dropdown-wrap { position: relative; }
  .cdp-dropdown { position: absolute; top: calc(100% + 8px); right: 0; z-index: 10100; background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); min-width: 200px; overflow: hidden; }
  .cdp-dropdown-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; cursor: pointer; border: none; background: none; width: 100%; text-align: left; color: #e2e8f0; transition: 0.15s; }
  .cdp-dropdown-item:hover { background: #1e293b; }
  .cdp-dropdown-item-label { font-size: 12px; font-weight: 600; font-family: var(--font-ui); }
  .cdp-dropdown-item-sub { font-size: 10px; color: #64748b; font-family: var(--font-ui); }

  /* TOC Sidebar */
  .cdp-toc-panel { position: fixed; top: var(--bar-h); right: 0; bottom: 0; z-index: 9998; width: 280px; background: #0b1120; border-left: 1px solid #1e293b; overflow-y: auto; padding: 20px 0; transform: translateX(100%); transition: transform 0.3s ease; }
  .cdp-toc-panel.open { transform: translateX(0); box-shadow: -8px 0 32px rgba(0,0,0,0.5); }
  .cdp-toc-title { font-size: 11px; font-weight: 700; color: #fff; text-transform: uppercase; padding: 0 20px 12px; border-bottom: 1px solid #1e293b; margin-bottom: 10px; font-family: var(--font-ui); display: flex; align-items: center; gap: 6px; }
  .cdp-toc-item { display: flex; align-items: center; gap: 8px; padding: 7px 20px; cursor: pointer; font-size: 12px; color: #94a3b8; transition: 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: var(--font-ui); }
  .cdp-toc-item:hover { color: #fff; background: #1e293b; }
  .cdp-toc-item.sub { padding-left: 36px; font-size: 11px; color: #64748b; }
  .cdp-toc-num { font-size: 10px; font-weight: 700; color: #fff; min-width: 24px; }

  /* Progress Bar */
  .cdp-progress { position: fixed; top: var(--bar-h); left: 0; right: 0; height: 3px; z-index: 10001; background: #1e293b; }
  .cdp-progress-bar { height: 100%; background: #ffffff; transition: width 0.1s linear; }

  /* Scaler */
  .cdp-scaler { transform-origin: top center; transition: transform 0.15s ease; display: flex; justify-content: center; padding: 40px 20px; width: 100%; }

  /* ── A4 BLACK & WHITE DOCUMENT ───────────────────────────────── */
  .cdp-doc {
    width: 210mm; min-height: 297mm; background: #fff;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.3);
    padding: 20mm 20mm 25mm 20mm; box-sizing: border-box;
    font-family: var(--font-doc); font-size: 11pt; line-height: 1.6; color: #000;
  }

  /* Cover Page */
  .cdp-cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 250mm; page-break-after: always; border: 3px double #000; padding: 20mm;}
  .cdp-cover-uni { font-size: 26pt; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
  .cdp-cover-type { font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #000; margin-top: 20px; letter-spacing: 3px;}
  .cdp-cover-course { font-size: 24pt; font-weight: bold; color: #000; text-transform: uppercase; margin: 40px 0 10px; padding: 20px 0; border-top: 1px solid #000; }
  .cdp-cover-code { font-size: 18pt; font-weight: bold; color: #333; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #000;}
  .cdp-cover-school { margin-top: auto; font-size: 12pt; font-weight: bold; color: #000; text-transform: uppercase; }

  /* Typography & Sections */
  .cdp-int-hdr { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
  .cdp-int-hdr-prog { font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #000; }
  
  .cdp-sec-major { font-size: 12pt; font-weight: bold; background: #000; color: #fff; padding: 6px 12px; margin: 30px 0 15px; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; page-break-after: avoid; }
  .cdp-sec-minor { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 20px 0 10px; color: #000; page-break-after: avoid; }
  .cdp-subsec { font-size: 10.5pt; font-weight: bold; margin: 15px 0 5px; color: #000; text-decoration: underline; page-break-after: avoid; }

  /* Tables */
  .cdp-doc table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5pt; table-layout: fixed; }
  .cdp-doc th { background: #e0e0e0 !important; color: #000 !important; font-weight: bold; text-align: center; padding: 6px 10px; border: 1px solid #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cdp-doc td { border: 1px solid #000; padding: 6px 10px; vertical-align: top; color: #000; word-break: break-word;}
  .cdp-doc tfoot td { background: #f5f5f5 !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Specific Tables */
  .cdp-t-id td:first-child { width: 35%; font-weight: bold; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cdp-t-cr th, .cdp-t-cr td { text-align: center; }
  .cdp-t-teach th:nth-child(1), .cdp-t-teach td:nth-child(1) { width: 8%; text-align: center; font-weight: bold;}
  .cdp-t-teach th:nth-child(2), .cdp-t-teach td:nth-child(2) { width: 52%; }
  .cdp-t-co td:first-child { width: 20%; font-weight: bold; text-align: center; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Rich Text */
  .cdp-rich p { margin: 0 0 8px 0; text-align: justify; }
  .cdp-rich ul, .cdp-rich ol { margin: 4px 0 12px 0; padding-left: 24px; }
  .cdp-rich li { margin-bottom: 6px; text-align: justify; }
  .cdp-rich table th { background: #e0e0e0 !important; border: 1px solid #000 !important; }
  .cdp-rich table td { border: 1px solid #000 !important; }

  /* Helpers */
  .cdp-tc { text-align: center !important; } .cdp-tj { text-align: justify !important; } .cdp-fb { font-weight: bold !important; }
  .cdp-empty { color: #555; font-style: italic; font-size: 10pt; margin: 4px 0; }
  .cdp-lead { font-size: 10.5pt; font-style: italic; color: #333; margin: 0 0 10px; }

  .cdp-sig { display: flex; justify-content: space-between; margin-top: 60px; }
  .cdp-sig-box { width: 40%; text-align: center; border-top: 1px solid #000; padding-top: 8px; font-weight: bold; }

  .page-break { page-break-after: always; }

  /* ── Print Overrides ─────────────────────────────────────────── */
  @media print {
    body * { visibility: hidden !important; }
    .print-area, .print-area * { visibility: visible !important; }
    .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .cdp-scaler { transform: none !important; padding: 0 !important; margin: 0 !important; }
    .cdp-shell, .preview-overlay { background: transparent !important; padding: 0 !important; }
    .cdp-doc { box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; }
    @page { size: A4 portrait; margin: 15mm; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

const SecMajor = ({ children, id }) => (
  <div id={id} className="cdp-sec-major">
    {children}
  </div>
);
const SecMinor = ({ children, id }) => (
  <div id={id} className="cdp-sec-minor">
    {children}
  </div>
);
const Subsec = ({ children }) => <div className="cdp-subsec">{children}</div>;
const Rich = ({ html }) => <div className="cdp-rich">{P(html)}</div>;
const Empty = () => <p className="cdp-empty">—</p>;

const COBlock = ({ html, outcomes }) => {
  if (!isEmpty(html)) return <div className="cdp-rich">{parse(html)}</div>;
  if (!outcomes?.length) return <Empty />;
  return (
    <table className="cdp-t-co">
      <thead>
        <tr>
          <th>Course Outcome</th>
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

const AWBlock = ({ html, data }) => {
  if (!isEmpty(html)) return <div className="cdp-rich">{parse(html)}</div>;
  if (!data?.length) return <Empty />;
  const sum = (k) => data.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  return (
    <table>
      <thead>
        <tr>
          <th rowSpan={2} style={{ width: "9%", verticalAlign: "middle" }}>
            COs
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
              <td key={k}>{sum(k) || ""}</td>
            ),
          )}
        </tr>
      </tfoot>
    </table>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const PreviewCD = ({
  isModal = false,
  onClose,
  passedCdData,
  passedMetaData,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { axios, createrToken } = useAppContext();

  const docRef = useRef(null);
  const shellRef = useRef(null);

  const [cdId, setCdId] = useState(params.id || location.state?.cdId || null);
  const [data, setData] = useState(
    passedCdData && passedMetaData
      ? { cdData: passedCdData, metaData: passedMetaData }
      : location.state?.cdData
        ? { cdData: location.state.cdData, metaData: location.state.metaData }
        : null,
  );

  const [loading, setLoading] = useState(!data && !!params.id && !isModal);
  const [zoom, setZoom] = useState(1.0);
  const [tocOpen, setTocOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);

  useEffect(() => {
    if (passedCdData && passedMetaData) {
      setData({ cdData: passedCdData, metaData: passedMetaData });
      setLoading(false);
    }
  }, [passedCdData, passedMetaData]);

  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [isModal]);

  useEffect(() => {
    if (isModal || data || !params.id) return;
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
  }, [params.id, data, isModal, axios, createrToken, navigate]);

  useEffect(() => {
    if (!loading && data && location.state?.autoPrint) {
      const t = setTimeout(() => window.print(), 900);
      return () => clearTimeout(t);
    }
  }, [loading, data, location.state]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const handler = () => {
      setProgress(
        el.scrollHeight > el.clientHeight
          ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
          : 0,
      );
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  /* Keyboard Shortcuts */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
      if (e.key === "=" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zIn();
      }
      if (e.key === "-" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zOut();
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        zReset();
      }
      if (e.key === "Escape") {
        setDdOpen(false);
        setTocOpen(false);
        setSearchOpen(false);
        setShortcuts(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleBack = useCallback(() => {
    if (isModal && onClose) {
      onClose();
      return;
    }
    const id = cdId || location.state?.cdId;
    if (id) navigate("/creator/edit-cd", { state: { loadId: id } });
    else navigate(-1);
  }, [isModal, onClose, cdId, navigate, location.state]);

  const zIn = () => setZoom((z) => Math.min(z + 0.1, 2.0));
  const zOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const zReset = () => setZoom(1.0);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQ) {
      window.find(searchQ, false, false, true, false, true, false);
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  const generateFilename = useCallback(() => {
    if (!data) return "Course_Document.pdf";
    const { cdData: d, metaData: m } = data;
    const code = field(d, "courseCode") || "CD";
    const title = (field(d, "courseTitle") || "Course")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    const ver = (m.versionNo || "1_0_0").replace(/\./g, "_");
    const date = new Date().toISOString().slice(0, 10);
    return `CD_${code}_${title}_v${ver}_${date}.pdf`;
  }, [data]);

  const handlePrint = useCallback(() => {
    window.print();
    setDdOpen(false);
  }, []);

  const handleDownloadPDF = useCallback(() => {
    const filename = generateFilename();
    document.title = filename;
    toast.success("Ready! Select 'Save as PDF' in the destination dropdown.", {
      duration: 4000,
    });
    setTimeout(() => {
      window.print();
      document.title = "CDMS Creator";
    }, 500);
    setDdOpen(false);
  }, [generateFilename]);

  const handleCopyFilename = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateFilename());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("Filename copied!");
    } catch {
      toast.error("Could not copy");
    }
    setDdOpen(false);
  }, [generateFilename]);

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
        <RefreshCw
          style={{ animation: "spin 1s linear infinite", color: "#fff" }}
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
          fontWeight: "bold",
        }}
      >
        No document data available.
      </div>
    );

  const { cdData: d, metaData: m } = data;
  const f = (key) => field(d, key);

  const TOC_SECTIONS = [
    { id: "cover", num: "—", label: "Cover Page" },
    { id: "sec-1", num: "1", label: "Course Identity" },
    { id: "sec-2", num: "2", label: "Course Details" },
    { id: "sec-3", num: "3", label: "Teaching & Assessment" },
    { id: "sec-4", num: "4", label: "Other Details" },
  ];

  return (
    <div ref={shellRef} className={isModal ? "preview-overlay" : "cdp-shell"}>
      <style>{STYLES}</style>
      <div className="pd-progress no-print">
        <div className="pd-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
      <div className="cdp-bar no-print">
        <div className="cdp-bar-l">
          <button className="cdp-btn" onClick={handleBack}>
            {isModal ? <X size={14} /> : <ArrowLeft size={14} />}{" "}
            {isModal ? "Close" : "Back"}
          </button>

          {searchOpen && (
            <div className="cdp-search-wrap">
              <Search size={12} style={{ color: "#64748b" }} />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search (Press Enter)…"
              />
            </div>
          )}
          <button
            className={`cdp-btn ${searchOpen ? "active" : ""}`}
            onClick={() => setSearchOpen((o) => !o)}
            title="Search (Ctrl+F)"
          >
            <Search size={14} />
          </button>
          <button
            className={`cdp-btn ${tocOpen ? "active" : ""}`}
            onClick={() => setTocOpen((o) => !o)}
          >
            <List size={14} /> TOC
          </button>
        </div>

        <div className="cdp-bar-c">
          <div
            className="cdp-search-wrap"
            style={{
              background: "none",
              border: "none",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button className="cdp-btn" onClick={zOut}>
            <ZoomOut size={14} />
          </button>
          <button className="cdp-btn" onClick={zIn}>
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="cdp-bar-r">
          <button
            className="cdp-btn"
            onClick={() => setShortcuts((s) => !s)}
            title="Keyboard shortcuts"
          >
            <Keyboard size={14} />
          </button>
          <div className="cdp-dropdown-wrap">
            <button className="cdp-action" onClick={() => setDdOpen((o) => !o)}>
              <Download size={14} /> Export <ChevronDown size={11} />
            </button>
            {ddOpen && (
              <div className="cdp-dropdown">
                <div className="pd-dropdown-header">Export Options</div>
                <button
                  className="cdp-dropdown-item"
                  onClick={handleDownloadPDF}
                >
                  <Printer size={15} />
                  <div>
                    <div className="pd-dropdown-item-label">Save as PDF</div>
                    <div className="pd-dropdown-item-sub">
                      Opens print dialog
                    </div>
                  </div>
                </button>
                <button
                  className="cdp-dropdown-item"
                  onClick={handleCopyFilename}
                >
                  {copied ? (
                    <CheckCircle size={15} style={{ color: "#4ade80" }} />
                  ) : (
                    <Copy size={15} />
                  )}
                  <div>
                    <div className="pd-dropdown-item-label">
                      {copied ? "Copied!" : "Copy Filename"}
                    </div>
                    <div className="pd-dropdown-item-sub">
                      Paste when saving
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PANELS ─────────────────────────────────────────────────── */}
      <div className={`cdp-toc-panel no-print ${tocOpen ? "open" : ""}`}>
        <div className="cdp-toc-title">
          <List size={12} /> Table of Contents
        </div>
        {TOC_SECTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => scrollTo(s.id)}
            className={`cdp-toc-item ${s.sub ? "sub" : ""}`}
          >
            <span className="cdp-toc-num">{s.num}</span>
            {s.label}
          </button>
        ))}
      </div>

      {shortcuts && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShortcuts(false)}
        >
          <div
            style={{
              background: "#0d1220",
              border: "1px solid #334155",
              borderRadius: 12,
              padding: "28px 32px",
              minWidth: 320,
              color: "#e2e8f0",
              fontFamily: "var(--font-ui)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              Keyboard Shortcuts
            </div>
            {[
              ["Ctrl + P", "Print / Save as PDF"],
              ["Ctrl + F", "Toggle Search"],
              ["Ctrl + =", "Zoom in"],
              ["Ctrl + -", "Zoom out"],
              ["Ctrl + 0", "Reset zoom"],
              ["Esc", "Close panels"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    background: "#1e293b",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {k}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRINT AREA ──────────────────────────────────────────────── */}
      <div className="print-area">
        <div
          className="cdp-scaler"
          style={{
            transform: `scale(${zoom})`,
            marginTop: isModal ? "20px" : "0",
          }}
        >
          <div ref={docRef} className="cdp-doc">
            {/* ── COVER ─────────────────────────────────────────── */}
            <div id="cover" className="cdp-cover">
              <div className="cdp-cover-uni">
                {f("schoolTitle") || "UNIVERSITY NAME"}
              </div>
              <div className="cdp-cover-type">Course Document</div>
              <div className="cdp-cover-course">
                {f("courseTitle") || "COURSE TITLE"}
              </div>
              <div className="cdp-cover-code">
                {f("courseCode") || "COURSE CODE"}
              </div>
              <div className="cdp-cover-school">
                {f("department")}
                <br />
                {f("facultyTitle")}
              </div>
            </div>

            <div className="cdp-int-hdr">
              <div className="cdp-int-hdr-prog">{f("courseTitle")}</div>
              <div className="cdp-hdr-meta">
                Version: {m.versionNo || "1.0.0"} · Code: {f("courseCode")}
              </div>
            </div>

            {/* ── 1. IDENTITY ────────────────────────────────────── */}
            <SecMajor id="sec-1">1. Course Identity</SecMajor>
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

            <SecMinor>1.1 Course Size</SecMinor>
            <table className="cdp-t-cr" style={{ width: "60%" }}>
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
                  <td className="cdp-fb">{d.credits?.total ?? 0}</td>
                  <td>{d.credits?.L ?? 0}</td>
                  <td>{d.credits?.T ?? 0}</td>
                  <td>{d.credits?.P ?? 0}</td>
                  <td className="cdp-fb">{d.totalHours ?? 0}</td>
                </tr>
              </tbody>
            </table>

            {/* ── 2. DETAILS ─────────────────────────────────────── */}
            <SecMajor id="sec-2">2. Course Details</SecMajor>

            <SecMinor>2.1 Course Aims and Summary</SecMinor>
            <Rich html={d.aimsSummary} />

            <SecMinor>2.2 Course Objectives</SecMinor>
            <Rich html={d.objectives} />

            <SecMinor>2.3 Course Outcomes (COs)</SecMinor>
            <p className="cdp-lead">
              After undergoing this course, students will be able to:
            </p>
            <COBlock html={d.courseOutcomesHtml} outcomes={d.courseOutcomes} />

            <Subsec>Outcome Map (CO → PO / PSO)</Subsec>
            <OMapBlock html={d.outcomeMapHtml} matrix={d.outcomeMap?.matrix} />
            <p className="cdp-note">
              Relevance: 1 = High &nbsp;|&nbsp; 2 = Medium &nbsp;|&nbsp; 3 = Low
            </p>

            <SecMinor>2.4 Course Content (Syllabus)</SecMinor>
            <Rich html={d.courseContent} />

            <SecMinor>2.5 Course Resources</SecMinor>
            <div style={{ paddingLeft: 10 }}>
              <p
                className="cdp-fb"
                style={{ fontSize: "10.5pt", marginBottom: 4 }}
              >
                Text Books
              </p>
              {d.resources?.textBooks?.length > 0 ? (
                <ol style={{ paddingLeft: 20, marginBottom: 15 }}>
                  {d.resources.textBooks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              ) : (
                <p className="cdp-empty">—</p>
              )}

              <p
                className="cdp-fb"
                style={{ fontSize: "10.5pt", marginBottom: 4 }}
              >
                Reference Books
              </p>
              {d.resources?.references?.length > 0 ? (
                <ol style={{ paddingLeft: 20, marginBottom: 15 }}>
                  {d.resources.references.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              ) : (
                <p className="cdp-empty">—</p>
              )}

              <p
                className="cdp-fb"
                style={{ fontSize: "10.5pt", marginBottom: 4 }}
              >
                Other Resources
              </p>
              {d.resources?.otherResources?.length > 0 ? (
                <ul style={{ paddingLeft: 20, marginBottom: 15 }}>
                  {d.resources.otherResources.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="cdp-empty">—</p>
              )}
            </div>

            <div className="page-break"></div>

            {/* ── 3. TEACHING ────────────────────────────────────── */}
            <SecMajor id="sec-3">3. Teaching and Assessment</SecMajor>

            <SecMinor>3.1 Teaching Schedule</SecMinor>
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
              <p className="cdp-empty">—</p>
            )}

            <SecMinor>3.2 Assessment Weight Distribution</SecMinor>
            <AWBlock html={d.assessmentWeightHtml} data={d.assessmentWeight} />

            <SecMinor>3.3 Grading Criterion</SecMinor>
            <Rich html={d.gradingCriterion} />

            {(d.attainmentCalculations?.recordingMarks ||
              d.attainmentCalculations?.settingTargets) && (
              <>
                <div className="cdp-sec-minor" style={{ marginTop: 25 }}>
                  Attainment Calculations
                </div>
                {d.attainmentCalculations.recordingMarks && (
                  <>
                    <Subsec>Recording Marks and Awarding Grades</Subsec>
                    <Rich html={d.attainmentCalculations.recordingMarks} />
                  </>
                )}
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

            <div className="page-break"></div>

            {/* ── 4. OTHER ───────────────────────────────────────── */}
            <SecMajor id="sec-4">4. Other Details</SecMajor>

            <SecMinor>4.1 Assignment Details / Problem Based Learning</SecMinor>
            <Rich html={d.otherDetails?.assignmentDetails} />

            <SecMinor>4.2 Academic Integrity Policy</SecMinor>
            <Rich html={d.otherDetails?.academicIntegrity} />

            {/* ── FOOTER ─────────────────────────────────────────── */}
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
              Official Academic Record &nbsp;·&nbsp;{" "}
              {f("schoolTitle") || f("department") || "Institution"}{" "}
              &nbsp;·&nbsp; Generated:{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCD;
