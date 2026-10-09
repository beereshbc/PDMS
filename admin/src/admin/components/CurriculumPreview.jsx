// admin/components/CurriculumPreview.jsx
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  X,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  List,
  ChevronDown,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  Info,
  FileDown,
  Search,
  FileText,
  Layers,
  BookOpen,
} from "lucide-react";
import parse from "html-react-parser";
import { toast } from "react-hot-toast";
import html2pdf from "html2pdf.js";

/* ============================================================
   BASE URL — assets served from the backend /public folder
============================================================ */

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BASE_URL) ||
  "http://localhost:5000";

/* ============================================================
   FIELD RESOLVERS
============================================================ */

const field = (d, key) => d?.[key] || d?.identity?.[key] || "";

const isEmpty = (html) =>
  !html ||
  !html.trim() ||
  ["<p><br></p>", "<p></p>", "<p>&nbsp;</p>", "<p><br/></p>"].includes(
    html.trim()
  );

const P = (html, fb = "<p class='cpv-empty'>Not provided.</p>") =>
  parse(isEmpty(html) ? fb : html);

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ============================================================
   ASSET NORMALISER — resolves backend public assets
============================================================ */

const resolveImageFilename = (src) => {
  if (!src) return "";
  const clean = src.split("?")[0].split("#")[0];
  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return null; // leave as-is
  }
  if (clean.startsWith("./images/")) return clean.slice("./images/".length);
  if (clean.startsWith("images/")) return clean.slice("images/".length);
  if (clean.startsWith("/images/")) return clean.slice("/images/".length);
  const marker = "/images/";
  const idx = clean.lastIndexOf(marker);
  if (idx !== -1) return clean.slice(idx + marker.length);
  return clean.split("/").pop() || "";
};

const normaliseAssets = (html, kind = "front_matter") => {
  if (!html || typeof html !== "string") return html || "";

  const rewriteSrc = (src) => {
    const name = resolveImageFilename(src);
    if (name === null) return src;
    if (!name) return src;
    return `${BASE_URL}/templates/${kind}/images/${name}`;
  };

  if (typeof document === "undefined") {
    return html
      .replace(
        /(<img[^>]+src=["'])(?!https?:|data:|blob:)([^"']+)(["'])/gi,
        (_m, a, src, b) => `${a}${rewriteSrc(src)}${b}`
      )
      .replace(
        /url\((['"]?)(?!https?:|data:|blob:)([^)'"]+)\1\)/gi,
        (_m, q, p) => `url(${q}${rewriteSrc(p)}${q})`
      );
  }

  const div = document.createElement("div");
  div.innerHTML = html;

  div.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!src) return;
    const name = resolveImageFilename(src);
    if (name !== null) {
      img.setAttribute("src", rewriteSrc(src));
    }
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    if (!img.style.maxWidth) img.style.maxWidth = "100%";
    if (!img.style.height) img.style.height = "auto";
  });

  div.querySelectorAll("[style*='background-image']").forEach((el) => {
    const style = el.getAttribute("style") || "";
    el.setAttribute(
      "style",
      style.replace(
        /url\((['"]?)(?!https?:|data:|blob:)([^)'"]+)\1\)/gi,
        (_m, q, p) => `url(${q}${rewriteSrc(p)}${q})`
      )
    );
  });

  return div.innerHTML;
};

/* ============================================================
   STYLES
============================================================ */

export const CD_PREVIEW_STYLES = `
  :root {
    --ink:        #000000;
    --ink-soft:   #1f2937;
    --ink-muted:  #4b5563;
    --rule:       #9ca3af;
    --rule-dark:  #000000;
    --tint:       #f4f4f5;
    --tint-2:     #e8e8ea;
    --page-bg:    #d4d4d8;

    --font-body: "Georgia", "Times New Roman", Times, serif;
    --font-head: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --font-mono: "SFMono-Regular", Consolas, Menlo, monospace;
    --font-ui:   "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;

    --page-w:   210mm;
    --page-h:   297mm;
    --margin-x: 16mm;
    --margin-y: 16mm;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .cpv-anchor { display: contents; }

  /* ── A4 page shell (Course Documents) ─────────────────────── */
  .cpv-doc {
    width: var(--page-w);
    max-width: var(--page-w);
    min-height: var(--page-h);
    background: #fff;
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 10.5pt;
    line-height: 1.5;
    padding: var(--margin-y) var(--margin-x) calc(var(--margin-y) + 4mm) var(--margin-x);
    margin: 0 auto 22px auto;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.08),
      0 18px 40px -16px rgba(0,0,0,0.24);
    position: relative;
    overflow-wrap: break-word;
    word-break: break-word;
    overflow-x: hidden;
  }
  .cpv-doc img { max-width: 100% !important; height: auto !important; display: block; }

  /* ── Front-matter page shell ───────────────────────────────
     Front-matter HTML already declares its own padding/margins
     targeting a full A4 page. We therefore strip the shell
     padding so its inner layout uses the true 210×297 canvas.
  -------------------------------------------------------------- */
  .cpv-doc.cpv-doc-fm {
    padding: 0;
    min-height: var(--page-h);
    overflow: hidden;
  }
  .cpv-doc.cpv-doc-fm > .cpv-frontpage { padding: 0; }

  /* Neutralise page-level primitives authored for standalone use */
  .cpv-frontpage > div[style*="210mm"],
  .cpv-frontpage > div[style*="width:210mm"],
  .cpv-frontpage > div[style*="width: 210mm"] {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    page-break-after: auto !important;
    break-after: auto !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  /* Full-page image front matter (BoS photo, back cover) */
  .cpv-frontpage img[data-fullpage] {
    width: 100% !important;
    height: auto !important;
    max-height: calc(var(--page-h) - 2 * var(--margin-y)) !important;
    object-fit: contain !important;
    display: block !important;
  }

  /* Reset padding of nested "page shells" — front-matter designs
     commonly wrap content in a padded div. We keep it but cap
     to the A4 content box. */
  .cpv-frontpage > div[style*="padding"] {
    max-width: 100% !important;
  }

  /* Clear floats so paragraphs after the portrait images behave */
  .cpv-frontpage::after {
    content: "";
    display: block;
    clear: both;
  }
  .cpv-frontpage p + p { margin-top: 2mm; }

  /* Front-matter typography: keep user's intended px values, but
     scale line-height a hair for A4 legibility. */
  .cpv-frontpage { font-size: 10.5pt; line-height: 1.55; }

  /* Prevent any nested absolutely-positioned cover layers from
     spilling outside the printable area. */
  .cpv-frontpage .page,
  .cpv-frontpage [class*="cover"] {
    max-width: 100% !important;
    overflow: hidden !important;
  }

  /* Cover Letter (1024×1448 design) — map to A4 content box */
  .cpv-frontpage .page {
    position: relative !important;
    width: 100% !important;
    max-width: 100% !important;
    aspect-ratio: 1024 / 1448 !important;
    margin: 0 auto !important;
  }
  .cpv-frontpage .cover-bg {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    z-index: 0 !important;
  }

  /* ── Running header / footer ──────────────────────────────── */
  .cpv-runhead {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 12px;
    border-bottom: 1.2pt solid var(--rule-dark);
    padding-bottom: 4px; margin-bottom: 5mm;
    font-family: var(--font-head);
    font-size: 8.5pt; letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .cpv-runhead .rh-left  { font-weight: 700; color: var(--ink); }
  .cpv-runhead .rh-mid   { flex: 1; text-align: center; font-weight: 600; }
  .cpv-runhead .rh-right { font-weight: 600; }

  .cpv-runfoot {
    position: absolute;
    left: var(--margin-x); right: var(--margin-x); bottom: 6mm;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1pt solid var(--rule);
    padding-top: 4px;
    font-family: var(--font-head);
    font-size: 8pt; color: var(--ink-muted);
    letter-spacing: 0.3px;
  }

  /* ── Cover ─────────────────────────────────────────────────── */
  .cpv-cover {
    min-height: calc(var(--page-h) - 2 * var(--margin-y));
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-between;
    text-align: center;
    padding: 10mm 6mm;
    border: 3pt double var(--rule-dark);
    background: #fff;
    overflow: hidden;
  }
  .cpv-cover img { max-width: 100% !important; max-height: 100% !important; object-fit: contain; }
  .cpv-cover-top { display: flex; flex-direction: column; align-items: center; gap: 4mm; width: 100%; }
  .cpv-cover-logo {
    width: 32mm; height: 32mm;
    display: flex; align-items: center; justify-content: center;
    border: 1pt dashed var(--rule);
    border-radius: 50%;
    font-family: var(--font-head); font-size: 9pt;
    color: var(--ink-muted);
    letter-spacing: 1px;
    overflow: hidden;
    background: #fff;
  }
  .cpv-cover-logo img { width: 100%; height: 100%; object-fit: contain; }
  .cpv-cover-univ {
    font-family: var(--font-head);
    font-size: 20pt; font-weight: 800;
    letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink); line-height: 1.15;
  }
  .cpv-cover-sub {
    font-family: var(--font-head);
    font-size: 9.5pt; letter-spacing: 3px;
    text-transform: uppercase; color: var(--ink-soft);
  }
  .cpv-cover-rule {
    width: 60mm; height: 0;
    border-top: 1.5pt solid var(--rule-dark);
    margin: 5mm auto;
  }
  .cpv-cover-mid { display: flex; flex-direction: column; gap: 3.5mm; align-items: center; width: 100%; }
  .cpv-cover-doctype {
    font-family: var(--font-head);
    font-size: 12pt; font-weight: 700;
    letter-spacing: 4px; text-transform: uppercase;
    color: var(--ink-soft);
  }
  .cpv-cover-degree {
    font-family: var(--font-body); font-size: 12pt;
    font-style: italic; color: var(--ink-soft);
  }
  .cpv-cover-program {
    font-family: var(--font-head);
    font-size: 22pt; font-weight: 800;
    letter-spacing: 1px; text-transform: uppercase;
    color: var(--ink); line-height: 1.2;
    padding: 5mm 4mm;
    border-top: 1.5pt solid var(--rule-dark);
    border-bottom: 1.5pt solid var(--rule-dark);
    max-width: 150mm;
  }
  .cpv-cover-scheme {
    font-family: var(--font-head);
    font-size: 11pt; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--ink);
  }
  .cpv-cover-bottom {
    display: flex; flex-direction: column; align-items: center; gap: 2mm;
    font-family: var(--font-head); color: var(--ink-soft);
  }
  .cpv-cover-bottom .school { font-size: 11pt; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
  .cpv-cover-bottom .faculty { font-size: 10pt; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted); }
  .cpv-cover-bottom .year    { font-size: 10pt; font-weight: 600; letter-spacing: 1px; margin-top: 3mm; color: var(--ink); }

  /* ── Front-matter page (inside .cpv-doc-fm shell) ─────────── */
  .cpv-frontpage {
    width: 100%;
    max-width: 100%;
    font-family: var(--font-body);
    font-size: 10.5pt;
    line-height: 1.5;
    color: var(--ink);
    overflow-wrap: break-word;
    word-break: break-word;
    overflow-x: hidden;
  }
  .cpv-frontpage img,
  .cpv-frontpage svg {
    max-width: 100% !important;
    height: auto !important;
  }
  .cpv-frontpage table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .cpv-frontpage th, .cpv-frontpage td {
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .cpv-frontpage h1, .cpv-frontpage h2, .cpv-frontpage h3 {
    font-family: var(--font-head);
    color: var(--ink);
    margin: 4mm 0 2mm 0;
  }
  .cpv-frontpage p { margin: 0 0 2mm 0; text-align: justify; }

  /* ── TOC page (in-document) ───────────────────────────────── */
  .cpv-toc { padding: 2mm 0; }
  .cpv-toc-title {
    font-family: var(--font-head);
    font-size: 20pt; font-weight: 800;
    letter-spacing: 4px; text-transform: uppercase;
    color: var(--ink); text-align: center;
    padding-bottom: 4mm;
    border-bottom: 1.5pt solid var(--rule-dark);
    margin-bottom: 6mm;
  }
  .cpv-toc-section {
    font-family: var(--font-head);
    font-size: 12pt; font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--ink);
    margin: 5mm 0 2mm 0;
    padding-bottom: 1.5mm;
    border-bottom: 1.2pt solid var(--rule-dark);
    page-break-after: avoid;
  }
  .cpv-toc-entry {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: 2mm 6mm;
    padding: 1.4mm 0;
    border-bottom: 0.35pt dotted var(--rule);
    font-size: 10pt;
    color: var(--ink-soft);
    page-break-inside: avoid;
  }
  .cpv-toc-entry .code {
    font-family: var(--font-head);
    font-weight: 700;
    color: var(--ink);
    min-width: 20mm;
    display: inline-block;
  }
  .cpv-toc-entry .title { font-family: var(--font-body); }
  .cpv-toc-entry .num {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--ink);
    white-space: nowrap;
  }
  .cpv-toc-sub   { padding-left: 8mm;  font-size: 9.5pt; }
  .cpv-toc-sub-2 { padding-left: 14mm; font-size: 9pt; color: var(--ink-muted); }

  /* ── Semester divider ─────────────────────────────────────── */
  .cpv-sem-divider {
    min-height: calc(var(--page-h) - 2 * var(--margin-y));
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    background: #fafafa;
    border: 1pt solid var(--rule);
    padding: 30mm 20mm;
  }
  .cpv-sem-divider .label { font-family: var(--font-head); font-size: 10pt; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--ink-muted); }
  .cpv-sem-divider .num   { font-family: var(--font-head); font-size: 72pt; font-weight: 900; line-height: 1; letter-spacing: -2px; color: var(--ink); margin: 6mm 0 4mm 0; }
  .cpv-sem-divider .prog  { font-family: var(--font-body); font-size: 12pt; font-style: italic; color: var(--ink-soft); margin-top: 6mm; max-width: 130mm; }
  .cpv-sem-divider .rule  { width: 40mm; border-top: 1pt solid var(--ink-muted); margin: 6mm auto 0 auto; }

  /* ── Course hero ──────────────────────────────────────────── */
  .cpv-course-card {
    border: 0.75pt solid var(--rule-dark);
    border-left: 6pt solid var(--ink);
    padding: 5mm 7mm;
    background: #ffffff;
    margin-bottom: 5mm;
  }
  .cpv-course-card .eyebrow {
    font-family: var(--font-head);
    font-size: 8.5pt; font-weight: 700;
    letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--ink-muted); margin-bottom: 2mm;
  }
  .cpv-course-card .title {
    font-family: var(--font-head);
    font-size: 16pt; font-weight: 800;
    color: var(--ink); line-height: 1.25;
    margin-bottom: 2.5mm;
  }
  .cpv-course-card .meta {
    display: flex; flex-wrap: wrap; gap: 3mm 8mm;
    font-family: var(--font-head);
    font-size: 9pt; color: var(--ink-soft);
  }
  .cpv-course-card .meta .k { letter-spacing: 0.6px; text-transform: uppercase; color: var(--ink-muted); font-size: 8pt; }
  .cpv-course-card .meta .v { font-weight: 700; color: var(--ink); }

  /* ── Headings ─────────────────────────────────────────────── */
  .cpv-h1 {
    font-family: var(--font-head);
    font-size: 11pt; font-weight: 800;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: #fff; background: var(--ink);
    padding: 2.2mm 4mm;
    margin: 7mm 0 3mm 0;
    page-break-after: avoid; break-after: avoid;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cpv-h1:first-of-type { margin-top: 3mm; }
  .cpv-h2 {
    font-family: var(--font-head);
    font-size: 10.5pt; font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.6px;
    padding: 0 0 1mm 0;
    margin: 5mm 0 2.5mm 0;
    border-bottom: 1pt solid var(--ink);
    page-break-after: avoid; break-after: avoid;
  }
  .cpv-h3 {
    font-family: var(--font-head);
    font-size: 10pt; font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.3px;
    margin: 4mm 0 1.5mm 0;
    page-break-after: avoid; break-after: avoid;
  }

  /* ── Body content ────────────────────────────────────────── */
  .cpv-body {
    font-family: var(--font-body);
    font-size: 10.5pt; line-height: 1.55;
    color: var(--ink); text-align: justify; hyphens: auto;
    overflow-wrap: break-word;
  }
  .cpv-body p { margin: 0 0 2mm 0; }
  .cpv-body ul, .cpv-body ol { margin: 1mm 0 3mm 0; padding-left: 6mm; }
  .cpv-body li { margin-bottom: 0.8mm; }
  .cpv-body strong { font-weight: 700; }
  .cpv-body em { font-style: italic; }
  .cpv-body h1, .cpv-body h2, .cpv-body h3 {
    font-family: var(--font-head); font-weight: 700;
    color: var(--ink); margin: 3mm 0 1.5mm 0; font-size: 10.5pt;
  }
  .cpv-empty { font-family: var(--font-body); font-style: italic; color: var(--ink-muted); font-size: 9.5pt; margin: 0; }
  .cpv-note  { font-family: var(--font-head); font-size: 8.5pt; color: var(--ink-muted); margin: -1mm 0 3mm 0; letter-spacing: 0.2px; }

  /* ── Tables ───────────────────────────────────────────────── */
  .cpv-doc table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin: 1mm 0 4mm 0;
    font-family: var(--font-body); font-size: 9.5pt;
    page-break-inside: auto;
  }
  .cpv-doc thead { display: table-header-group; }
  .cpv-doc tfoot { display: table-footer-group; }
  .cpv-doc tr    { page-break-inside: avoid; break-inside: avoid; }
  .cpv-doc th, .cpv-doc td {
    border: 0.5pt solid var(--rule-dark);
    padding: 1.6mm 2.2mm;
    vertical-align: top;
    word-break: break-word; overflow-wrap: anywhere;
  }
  .cpv-doc th {
    font-family: var(--font-head);
    font-size: 9pt; font-weight: 700;
    background: var(--tint-2) !important;
    color: var(--ink); text-align: center; vertical-align: middle;
    letter-spacing: 0.3px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cpv-doc tfoot td {
    background: var(--tint-2) !important;
    font-family: var(--font-head); font-weight: 700; text-align: center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cpv-t-identity td:first-child {
    width: 38%; background: #f6f6f7 !important;
    font-family: var(--font-head); font-weight: 700; font-size: 9pt;
    color: var(--ink-soft);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cpv-t-identity td:last-child { width: 62%; }
  .cpv-t-credits { width: 100% !important; }
  .cpv-t-credits th, .cpv-t-credits td { text-align: center; }
  .cpv-t-co td:first-child {
    width: 24%; font-family: var(--font-head); font-weight: 700;
    font-size: 9pt; text-align: center; vertical-align: top;
  }
  .cpv-t-co td:last-child { width: 76%; text-align: justify; }
  .cpv-t-teach th:nth-child(1), .cpv-t-teach td:nth-child(1) { width: 8%;  text-align: center; }
  .cpv-t-teach th:nth-child(2), .cpv-t-teach td:nth-child(2) { width: 58%; }
  .cpv-t-teach th:nth-child(3), .cpv-t-teach td:nth-child(3) { width: 17%; text-align: center; }
  .cpv-t-teach th:nth-child(4), .cpv-t-teach td:nth-child(4) { width: 17%; text-align: center; }
  .cpv-t-aw { font-size: 8.5pt !important; }
  .cpv-t-aw th, .cpv-t-aw td { padding: 1.2mm 1.4mm !important; }
  .cpv-t-aw th { font-size: 8pt !important; }
  .cpv-t-aw .co-col { width: 9%; text-align: center; font-family: var(--font-head); font-weight: 700; }

  .cpv-body table {
    width: 100% !important; border-collapse: collapse !important;
    margin: 1mm 0 3mm 0 !important; table-layout: fixed !important;
    font-size: 9pt !important;
    page-break-inside: auto;
  }
  .cpv-body th, .cpv-body td {
    border: 0.5pt solid var(--rule-dark) !important;
    padding: 1.4mm 2mm !important;
    vertical-align: top !important;
    word-break: break-word !important; overflow-wrap: anywhere !important;
  }
  .cpv-body th {
    background: var(--tint-2) !important;
    font-family: var(--font-head) !important; font-weight: 700 !important;
    text-align: center !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cpv-body img { max-width: 100%; height: auto; }

  /* ── Signature block ─────────────────────────────────────── */
  .cpv-sig {
    display: flex; justify-content: space-between; gap: 12mm;
    margin-top: 12mm; padding-top: 4mm;
    border-top: 0.8pt solid var(--ink);
    page-break-inside: avoid; break-inside: avoid;
  }
  .cpv-sig-box {
    flex: 1; text-align: center;
    font-family: var(--font-head);
    font-size: 8.5pt; color: var(--ink-soft);
    letter-spacing: 0.4px; text-transform: uppercase;
  }
  .cpv-sig-box::before {
    content: "";
    display: block; height: 14mm;
    border-bottom: 0.5pt solid var(--ink);
    margin-bottom: 1.5mm;
  }

  /* ── Back cover ──────────────────────────────────────────── */
  .cpv-backcover {
    min-height: calc(var(--page-h) - 2 * var(--margin-y));
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 20mm 15mm;
    border: 3pt double var(--rule-dark);
  }
  .cpv-backcover .bc-title {
    font-family: var(--font-head);
    font-size: 22pt; font-weight: 800;
    letter-spacing: 3px; text-transform: uppercase;
    color: var(--ink); margin-bottom: 6mm;
  }
  .cpv-backcover .bc-sub {
    font-family: var(--font-body);
    font-size: 12pt; font-style: italic;
    color: var(--ink-soft); max-width: 140mm;
  }
  .cpv-backcover .bc-meta {
    margin-top: 8mm;
    font-family: var(--font-head);
    font-size: 9.5pt; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--ink-muted);
  }

  /* ── Preview shell ───────────────────────────────────────── */
  .cpv-shell { position: fixed; inset: 0; display: flex; flex-direction: column; background: #0b1120; z-index: 9999; }
  .cpv-toolbar {
    height: 52px; flex-shrink: 0;
    background: #0f172a; border-bottom: 1px solid #1e293b;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px; gap: 12px;
    font-family: var(--font-ui); color: #cbd5e1;
    z-index: 20;
  }
  .cpv-toolbar .grp { display: flex; align-items: center; gap: 6px; }
  .cpv-toolbar .grp.grow { flex: 1; min-width: 0; }
  .cpv-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: #94a3b8; font-size: 12px; font-weight: 500;
    padding: 6px 10px; border-radius: 6px;
    transition: background .15s, color .15s;
    font-family: inherit; white-space: nowrap;
  }
  .cpv-btn:hover { background: #1e293b; color: #f1f5f9; }
  .cpv-btn.active { background: #334155; color: #fff; }
  .cpv-btn.primary { background: #1d4ed8; color: #fff; font-weight: 700; }
  .cpv-btn.primary:hover { background: #1e40af; }
  .cpv-btn.ghost { padding: 6px 8px; }
  .cpv-badge {
    font-size: 11px; font-weight: 600; color: #94a3b8;
    background: #0a0f1a; border: 1px solid #1e293b;
    padding: 3px 10px; border-radius: 4px;
    max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cpv-zoom { display: flex; align-items: center; gap: 2px; background: #1e293b; border-radius: 6px; padding: 3px 4px; }
  .cpv-zoom .val { font-size: 11px; font-weight: 700; color: #e2e8f0; min-width: 42px; text-align: center; cursor: pointer; }
  .cpv-zoom button { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px 5px; border-radius: 4px; }
  .cpv-zoom button:hover { color: #fff; background: #334155; }
  .cpv-dd-wrap { position: relative; }
  .cpv-dd {
    position: absolute; top: calc(100% + 6px); right: 0;
    background: #0b1120; border: 1px solid #1e293b;
    border-radius: 8px; min-width: 240px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.55);
    overflow: hidden; z-index: 30;
  }
  .cpv-dd-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px 14px; border: none; background: none;
    width: 100%; text-align: left; color: #e2e8f0;
    cursor: pointer; font-family: inherit;
  }
  .cpv-dd-item:hover { background: #1e293b; }
  .cpv-dd-item .t { font-size: 12px; font-weight: 600; }
  .cpv-dd-item .s { font-size: 10px; color: #64748b; margin-top: 2px; }

  .cpv-body-area {
    flex: 1; overflow: auto;
    background: #d4d4d8;
    padding: 24px 20px 60px 20px;
    display: flex; justify-content: center;
    scroll-behavior: smooth;
  }
  .cpv-page-wrap { transform-origin: top center; will-change: transform; transition: transform .12s ease; }

  .cpv-side {
    position: absolute; top: 52px; right: 0; bottom: 0;
    width: 360px; background: #0b1120;
    border-left: 1px solid #1e293b;
    transform: translateX(100%);
    transition: transform .28s ease;
    z-index: 25;
    display: flex; flex-direction: column;
  }
  .cpv-side.open { transform: translateX(0); box-shadow: -8px 0 32px rgba(0,0,0,0.5); }
  .cpv-side-hdr {
    padding: 14px 18px;
    border-bottom: 1px solid #1e293b;
    font-family: var(--font-head);
    font-size: 10px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    color: #e2e8f0;
    display: flex; align-items: center; gap: 8px;
    flex-shrink: 0;
  }
  .cpv-side-search {
    padding: 10px 14px;
    border-bottom: 1px solid #1e293b;
    display: flex; align-items: center; gap: 6px;
    background: #0f172a;
    flex-shrink: 0;
  }
  .cpv-side-search input {
    background: none; border: none; outline: none;
    color: #f1f5f9; font-size: 12px; width: 100%;
    font-family: inherit;
  }
  .cpv-side-search input::placeholder { color: #64748b; }
  .cpv-side-body { flex: 1; overflow-y: auto; }
  .cpv-side-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; text-align: left;
    border: none; background: none; cursor: pointer;
    color: #94a3b8; font-family: inherit;
    font-size: 12px; padding: 8px 18px;
    border-left: 3px solid transparent;
    transition: background .12s, color .12s, border-color .12s;
  }
  .cpv-side-item:hover { background: #1e293b; color: #fff; }
  .cpv-side-item.active { color: #fff; background: #1e293b; border-left-color: #60a5fa; }
  .cpv-side-item.lvl-1 { padding-left: 32px; font-size: 11.5px; }
  .cpv-side-item.lvl-2 { padding-left: 48px; font-size: 11px; color: #64748b; }
  .cpv-side-item.group {
    color: #cbd5e1;
    font-family: var(--font-head);
    font-size: 10px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    padding: 10px 18px 4px 18px;
    cursor: default;
    border-left-color: transparent;
  }
  .cpv-side-item.group:hover { background: none; color: #cbd5e1; }
  .cpv-side-empty { padding: 12px 18px; font-size: 11.5px; color: #64748b; font-style: italic; }

  .cpv-banner {
    background: #1e293b; color: #94a3b8;
    font-family: var(--font-ui); font-size: 12px;
    padding: 8px 18px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }
  .cpv-banner span { display: flex; align-items: center; gap: 8px; }
  .cpv-banner button {
    background: none; border: none; cursor: pointer;
    color: #94a3b8; padding: 4px 8px; border-radius: 4px;
  }
  .cpv-banner button:hover { background: #334155; color: #fff; }

  .cpv-progress { height: 3px; background: #1e293b; position: relative; z-index: 15; }
  .cpv-progress > div { height: 100%; background: #60a5fa; transition: width .1s linear; }

  body.cpv-fs .cpv-toolbar,
  body.cpv-fs .cpv-side,
  body.cpv-fs .cpv-progress,
  body.cpv-fs .cpv-banner { display: none !important; }
  body.cpv-fs .cpv-body-area { padding: 0; background: #111827; }

  /* ── PRINT — one page per .cpv-doc ─────────────────────────── */
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body * { visibility: hidden !important; }
    .cpv-print-area, .cpv-print-area * { visibility: visible !important; }
    .cpv-print-area {
      position: absolute !important;
      left: 0; top: 0; right: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .cpv-toolbar, .cpv-side, .cpv-banner, .cpv-progress, .no-print { display: none !important; }
    .cpv-shell, .cpv-body-area {
      background: transparent !important;
      padding: 0 !important;
      display: block !important;
      overflow: visible !important;
    }
    .cpv-page-wrap { transform: none !important; margin: 0 !important; padding: 0 !important; }
    .cpv-doc {
      box-shadow: none !important;
      margin: 0 !important;
      width: 100% !important;
      min-height: 0 !important;
      padding: 14mm 15mm 16mm 15mm !important;
      page-break-after: always;
      break-after: page;
      border: none !important;
      overflow: visible !important;
    }
    .cpv-doc.cpv-doc-fm {
      padding: 0 !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    .cpv-doc.cpv-doc-fm > .cpv-frontpage {
      padding: 14mm 15mm 16mm 15mm !important;
    }
    .cpv-doc:last-child { page-break-after: auto; break-after: auto; }
    .cpv-sem-divider { background: #fafafa !important; border: 1pt solid var(--rule) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cpv-cover, .cpv-backcover { border: 3pt double var(--rule-dark) !important; }
    .cpv-h1 { background: var(--ink) !important; color: #fff !important; }
    .cpv-doc th { background: var(--tint-2) !important; }
  }
`;

/* ============================================================
   SECTION DEFINITIONS — flat key list
============================================================ */

export const CD_SECTIONS = {
  section1: {
    id: "section1",
    label: "1. Course Identity",
    subsections: [
      { id: "identity", label: "Identity Information", field: "identity" },
      { id: "credits",  label: "Credits",              field: "credits"  },
    ],
  },
  section2: {
    id: "section2",
    label: "2. Course Details",
    subsections: [
      { id: "aimsSummary",    label: "Course Aims and Summary", field: "aimsSummary"    },
      { id: "objectives",     label: "Course Objectives",       field: "objectives"     },
      { id: "courseOutcomes", label: "Course Outcomes (COs)",   field: "courseOutcomes" },
      { id: "outcomeMap",     label: "Outcome Map (CO → PO/PSO)", field: "outcomeMap"   },
    ],
  },
  section3: {
    id: "section3",
    label: "3. Syllabus & Teaching",
    subsections: [
      { id: "courseContent", label: "Course Content (Syllabus)", field: "courseContent" },
      { id: "teaching",      label: "Teaching Schedule",         field: "teaching"      },
    ],
  },
  section4: {
    id: "section4",
    label: "4. Resources & Assessment",
    subsections: [
      { id: "resources",              label: "Course Resources",                field: "resources"              },
      { id: "assessmentWeight",       label: "Assessment Weight Distribution",  field: "assessmentWeight"       },
      { id: "gradingCriterion",       label: "Grading Criterion",               field: "gradingCriterion"       },
      { id: "attainmentCalculations", label: "Attainment Calculations",         field: "attainmentCalculations" },
      { id: "otherDetails",           label: "Other Details",                   field: "otherDetails"           },
    ],
  },
};

export const getDefaultSections = () => {
  const out = {};
  Object.values(CD_SECTIONS).forEach((s) =>
    s.subsections.forEach((ss) => (out[`${s.id}.${ss.id}`] = true))
  );
  return out;
};

export const ALL_SECTION_KEYS = (() => {
  const keys = [];
  Object.values(CD_SECTIONS).forEach((s) =>
    s.subsections.forEach((ss) => keys.push(`${s.id}.${ss.id}`))
  );
  return keys;
})();

/* ============================================================
   ATOMIC BLOCKS
============================================================ */

const H1 = ({ id, children }) => <h2 id={id} className="cpv-h1">{children}</h2>;
const H2 = ({ id, children }) => <h3 id={id} className="cpv-h2">{children}</h3>;
const H3 = ({ id, children }) => <h4 id={id} className="cpv-h3">{children}</h4>;
const Body = ({ children }) => <div className="cpv-body">{children}</div>;
const Empty = () => <p className="cpv-empty">Not provided.</p>;

const RunningHead = ({ institution, doctype, context }) => (
  <div className="cpv-runhead">
    <span className="rh-left">{institution}</span>
    <span className="rh-mid">{doctype}</span>
    <span className="rh-right">{context}</span>
  </div>
);

const RunningFoot = ({ note, brand, pageLabel }) => (
  <div className="cpv-runfoot">
    <span>{note}</span>
    <span className="rf-page">{pageLabel || ""}</span>
    <span>{brand}</span>
  </div>
);

/* ============================================================
   CD RENDERER
============================================================ */

export const CDRenderer = ({
  cd,
  meta,
  selectedSections = null,
  showHeader = true,
  showFooter = true,
  institution = "GM University",
  pageLabel = "",
}) => {
  const d = cd || {};
  const f = (key) => field(d, key);
  const m = meta || {};

  const show = (s, ss) => {
    if (!selectedSections) return true;
    const key = `${s}.${ss}`;
    return selectedSections[key] !== false;
  };

  const courseCode  = f("courseCode")  || "—";
  const courseTitle = f("courseTitle") || "Course";

  const s2Visible =
    show("section2", "aimsSummary") ||
    show("section2", "objectives") ||
    show("section2", "courseOutcomes") ||
    show("section2", "outcomeMap");
  const s3Visible = show("section3", "courseContent") || show("section3", "teaching");
  const s4Visible =
    show("section4", "resources") ||
    show("section4", "assessmentWeight") ||
    show("section4", "gradingCriterion") ||
    show("section4", "attainmentCalculations") ||
    show("section4", "otherDetails");
  const s1Visible = show("section1", "identity") || show("section1", "credits");

  return (
    <div className="cpv-doc" data-cd-code={courseCode} id={`course-${courseCode}-body`}>
      {showHeader && (
        <RunningHead
          institution={f("schoolTitle") || institution}
          doctype="Course Document"
          context={courseCode}
        />
      )}

      <div className="cpv-course-card">
        <div className="eyebrow">Course Document</div>
        <div className="title">{courseTitle}</div>
        <div className="meta">
          <span><span className="k">Code</span> <span className="v">{courseCode}</span></span>
          {f("programCode") && (
            <span><span className="k">Program</span> <span className="v">{f("programCode")}</span></span>
          )}
          {m.versionNo && (
            <span><span className="k">Version</span> <span className="v">v{m.versionNo}</span></span>
          )}
          {d.credits?.total != null && (
            <span><span className="k">Credits</span> <span className="v">{d.credits.total}</span></span>
          )}
        </div>
      </div>

      {s1Visible && (
        <H1 id={`course-${courseCode}-sec1`}>1. Course Identity</H1>
      )}

      {show("section1", "identity") && (
        <table className="cpv-t-identity">
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
            ].map(([l, v]) => (
              <tr key={l}>
                <td>{l}</td>
                <td>{v || <span className="cpv-empty">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {show("section1", "credits") && (
        <>
          <H2>1.1 Course Size</H2>
          <table className="cpv-t-credits">
            <thead>
              <tr>
                <th>Total Credits</th>
                <th>L (Lecture)</th>
                <th>T (Tutorial)</th>
                <th>P (Practical)</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{d.credits?.total ?? 0}</td>
                <td>{d.credits?.L ?? 0}</td>
                <td>{d.credits?.T ?? 0}</td>
                <td>{d.credits?.P ?? 0}</td>
                <td>{d.totalHours ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {s2Visible && (
        <H1 id={`course-${courseCode}-sec2`}>2. Course Details</H1>
      )}

      {show("section2", "aimsSummary") && (
        <>
          <H2>2.1 Course Aims and Summary</H2>
          <Body>{P(d.aimsSummary)}</Body>
        </>
      )}

      {show("section2", "objectives") && (
        <>
          <H2>2.2 Course Objectives</H2>
          <Body>{P(d.objectives)}</Body>
        </>
      )}

      {show("section2", "courseOutcomes") && (
        <>
          <H2>2.3 Course Outcomes (COs)</H2>
          <Body>
            <p style={{ fontStyle: "italic", marginBottom: "2mm" }}>
              After undergoing this course, students will be able to:
            </p>
          </Body>
          {!isEmpty(d.courseOutcomesHtml) ? (
            <Body>{parse(normaliseAssets(d.courseOutcomesHtml))}</Body>
          ) : d.courseOutcomes?.length ? (
            <table className="cpv-t-co">
              <thead>
                <tr>
                  <th>Course Outcome</th>
                  <th style={{ textAlign: "left" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {d.courseOutcomes.map((co, i) => (
                  <tr key={i}>
                    <td>{co.code}</td>
                    <td style={{ textAlign: "justify" }}>{parse(co.description || "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<Empty />)}
        </>
      )}

      {show("section2", "outcomeMap") && (
        <>
          <H3>2.4 Outcome Map (CO → PO / PSO)</H3>
          {!isEmpty(d.outcomeMapHtml) ? (
            <Body>{parse(normaliseAssets(d.outcomeMapHtml))}</Body>
          ) : d.outcomeMap?.matrix?.length >= 2 ? (
            <table>
              <thead>
                <tr>
                  {d.outcomeMap.matrix[0].map((h, i) => (
                    <th key={i} style={{ fontSize: "8.5pt" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.outcomeMap.matrix.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          textAlign: "center",
                          fontWeight: ci === 0 ? 700 : 400,
                          fontSize: "8.5pt",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<Empty />)}
          <p className="cpv-note">Relevance: 1 = High · 2 = Medium · 3 = Low</p>
        </>
      )}

      {s3Visible && (
        <H1 id={`course-${courseCode}-sec3`}>3. Syllabus and Teaching</H1>
      )}

      {show("section3", "courseContent") && (
        <>
          <H2>3.1 Course Content</H2>
          <Body>{P(normaliseAssets(d.courseContent))}</Body>
        </>
      )}

      {show("section3", "teaching") && (
        <>
          <H2>3.2 Teaching Schedule</H2>
          {d.teaching?.length ? (
            <table className="cpv-t-teach">
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
                    <td style={{ textAlign: "center" }}>{lec.number}</td>
                    <td>{lec.topic}</td>
                    <td style={{ textAlign: "center" }}>{lec.slides}</td>
                    <td style={{ textAlign: "center" }}>{lec.videos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<Empty />)}
        </>
      )}

      {s4Visible && (
        <H1 id={`course-${courseCode}-sec4`}>4. Resources and Assessment</H1>
      )}

      {show("section4", "resources") && (
        <>
          <H2>4.1 Course Resources</H2>

          <H3>Text Books</H3>
          {d.resources?.textBooks?.length ? (
            <ol style={{ paddingLeft: "6mm", marginBottom: "2mm" }}>
              {d.resources.textBooks.map((t, i) => (
                <li key={i} style={{ marginBottom: "0.6mm" }}>{t}</li>
              ))}
            </ol>
          ) : (<Empty />)}

          <H3>Reference Books</H3>
          {d.resources?.references?.length ? (
            <ol style={{ paddingLeft: "6mm", marginBottom: "2mm" }}>
              {d.resources.references.map((r, i) => (
                <li key={i} style={{ marginBottom: "0.6mm" }}>{r}</li>
              ))}
            </ol>
          ) : (<Empty />)}

          <H3>Other Resources</H3>
          {d.resources?.otherResources?.length ? (
            <ul style={{ paddingLeft: "6mm", marginBottom: "2mm" }}>
              {d.resources.otherResources.map((r, i) => (
                <li key={i} style={{ marginBottom: "0.6mm" }}>{r}</li>
              ))}
            </ul>
          ) : (<Empty />)}
        </>
      )}

      {show("section4", "assessmentWeight") && (
        <>
          <H2>4.2 Assessment Weight Distribution</H2>
          {!isEmpty(d.assessmentWeightHtml) ? (
            <Body>{parse(normaliseAssets(d.assessmentWeightHtml))}</Body>
          ) : d.assessmentWeight?.length ? (
            <table className="cpv-t-aw">
              <thead>
                <tr>
                  <th rowSpan={2} className="co-col">COs<br />with Wt.</th>
                  <th colSpan={3}>Quiz (15)</th>
                  <th colSpan={3}>Test (25)</th>
                  <th colSpan={2}>Assignment (20)</th>
                  <th rowSpan={2}>CIE<br />=60</th>
                  <th rowSpan={2}>SEE<br />=40</th>
                </tr>
                <tr>
                  {["Q1\n=5", "Q2\n=4", "Q3\n=6", "T1\n=7", "T2\n=8", "T3\n=10", "A1\n=10", "A2\n=10"].map((l) => (
                    <th key={l} style={{ whiteSpace: "pre-line" }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.assessmentWeight.map((row, i) => (
                  <tr key={i}>
                    <td className="co-col">{row.co}</td>
                    {["q1", "q2", "q3", "t1", "t2", "t3", "a1", "a2"].map((k) => (
                      <td key={k} style={{ textAlign: "center" }}>{row[k] || ""}</td>
                    ))}
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{row.cie || ""}</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{row.see || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<Empty />)}
        </>
      )}

      {show("section4", "gradingCriterion") && (
        <>
          <H2>4.3 Grading Criterion</H2>
          <Body>{P(normaliseAssets(d.gradingCriterion))}</Body>
        </>
      )}

      {show("section4", "attainmentCalculations") &&
        (d.attainmentCalculations?.recordingMarks || d.attainmentCalculations?.settingTargets) && (
          <>
            <H2>4.4 Attainment Calculations</H2>
            {d.attainmentCalculations.recordingMarks && (
              <>
                <H3>Recording Marks and Awarding Grades</H3>
                <Body>{P(normaliseAssets(d.attainmentCalculations.recordingMarks))}</Body>
              </>
            )}
            {d.attainmentCalculations.settingTargets && (
              <>
                <H3>Setting Attainment Targets</H3>
                <Body>{P(normaliseAssets(d.attainmentCalculations.settingTargets))}</Body>
              </>
            )}
          </>
        )}

      {show("section4", "otherDetails") && (
        <>
          <H2>4.5 Other Details</H2>
          <H3>Assignment Details / Problem Based Learning</H3>
          <Body>{P(d.otherDetails?.assignmentDetails)}</Body>
          <H3>Academic Integrity Policy</H3>
          <Body>{P(d.otherDetails?.academicIntegrity)}</Body>
        </>
      )}

      {showFooter && (
        <div className="cpv-sig">
          <div className="cpv-sig-box">Prepared by — Faculty Member</div>
          <div className="cpv-sig-box">Verified by — Head of Department</div>
        </div>
      )}

      {showFooter && (
        <RunningFoot
          note={`${f("schoolTitle") || f("department") || "Institution"} · Official Academic Record`}
          brand={courseCode}
          pageLabel={pageLabel}
        />
      )}
    </div>
  );
};

/* ============================================================
   FRONT MATTER PAGE — dedicated wrapper
   ------------------------------------------------------------
   Renders the front-matter HTML inside a page shell that does
   NOT apply its own padding (the HTML already provides page
   padding from its authoring context).  This prevents double
   margins / page overflow that previously clipped right edges
   and pushed the signature block off the A4 area.
============================================================ */

export const FrontMatterPage = ({ page, id }) => {
  const html = normaliseAssets(page?.content || "", "front_matter");
  return (
    <div className="cpv-doc cpv-doc-fm" id={id || `frontmatter-${page?.name}`}>
      <div
        className="cpv-frontpage"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

/* ============================================================
   SINGLE-CD PREVIEW MODAL (backwards compat)
============================================================ */

export const SingleCDPreviewModal = ({ isOpen, onClose, cd, meta, selectedSections }) => {
  const [zoom, setZoom] = useState(0.82);
  if (!isOpen || !cd) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <style>{CD_PREVIEW_STYLES}</style>
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-900">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm">
            <X size={16} /> Close
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1">
              <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))} className="p-1 text-slate-400 hover:text-white"><ZoomOut size={14} /></button>
              <span className="text-xs text-slate-300 font-bold min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2.0))} className="p-1 text-slate-400 hover:text-white"><ZoomIn size={14} /></button>
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
              <Printer size={14} /> Print
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-300 p-6">
          <div
            className="cpv-print-area mx-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              width: "210mm",
              marginBottom: zoom < 1 ? `${(zoom - 1) * 800}px` : "0",
            }}
          >
            <CDRenderer cd={cd} meta={meta} selectedSections={selectedSections} showHeader showFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   FULL CURRICULUM PREVIEW
============================================================ */

export const FullCurriculumPreview = ({
  isOpen,
  onClose,
  frontMatterPages = [],
  selectedCDs = [],
  selectedSections,
  programInfo,
  curriculumConfig,
}) => {
  const [zoom, setZoom] = useState(0.6);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fitWidth, setFitWidth] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sideQuery, setSideQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  const wrapRef = useRef(null);
  const areaRef = useRef(null);

  /* Split front matter into ordered buckets */
  const frontMatterSplit = useMemo(() => {
    const cover = [];
    const acknowledgement = [];
    const council = [];
    const other = [];
    const backCover = [];
    const norm = (s) => (s || "").toLowerCase();

    frontMatterPages.forEach((p) => {
      const n = norm(p.name);
      if (n.includes("back_cover") || n.includes("back-cover") || n === "back") {
        backCover.push(p);
      } else if (n === "cover" || n.includes("front_cover")) {
        cover.push(p);
      } else if (n.includes("acknowledg")) {
        acknowledgement.push(p);
      } else if (
        n.includes("academic_council") ||
        n.includes("academic-council") ||
        n === "bos" ||
        n.includes("board_of_studies") ||
        n.includes("board-of-studies")
      ) {
        council.push(p);
      } else {
        other.push(p);
      }
    });

    return { cover, acknowledgement, council, other, backCover };
  }, [frontMatterPages]);

  const sortedCDs = useMemo(() => {
    return [...selectedCDs].sort((a, b) => {
      const sa = typeof a.semester === "number" ? a.semester : 999;
      const sb = typeof b.semester === "number" ? b.semester : 999;
      if (sa !== sb) return sa - sb;
      return (a.courseCode || "").localeCompare(b.courseCode || "");
    });
  }, [selectedCDs]);

  const grouped = useMemo(() => {
    const map = new Map();
    sortedCDs.forEach((cd) => {
      const s = cd.semester ?? "Other";
      if (!map.has(s)) map.set(s, []);
      map.get(s).push(cd);
    });
    return map;
  }, [sortedCDs]);

  /* Sidebar TOC */
  const tocItems = useMemo(() => {
    const items = [];

    items.push({ id: "cpv-top", label: "Cover Page", level: 0, kind: "section" });

    frontMatterSplit.acknowledgement.forEach((p) =>
      items.push({
        id: `frontmatter-${p.name}`,
        label: p.displayName || "Acknowledgement",
        level: 0,
        kind: "front",
      })
    );
    if (frontMatterSplit.council.length > 0) {
      items.push({
        id: "cpv-council",
        label: "Academic Council & Board of Studies",
        level: 0,
        kind: "front",
      });
    }
    frontMatterSplit.other.forEach((p) =>
      items.push({
        id: `frontmatter-${p.name}`,
        label: p.displayName || p.name,
        level: 0,
        kind: "front",
      })
    );

    items.push({ id: "cpv-toc", label: "Table of Contents", level: 0, kind: "section" });

    grouped.forEach((courses, semester) => {
      const semLabel =
        typeof semester === "number" ? `Semester ${semester}` : String(semester);
      items.push({
        id: `semester-${semester}`,
        label: semLabel,
        level: 0,
        kind: "semester",
      });
      courses.forEach((cd) => {
        items.push({
          id: `course-${cd.courseCode}`,
          label: `${cd.courseCode} — ${cd.courseTitle}`,
          level: 1,
          kind: "course",
          courseCode: cd.courseCode,
          courseTitle: cd.courseTitle,
        });
        items.push({ id: `course-${cd.courseCode}-sec1`, label: "1. Course Identity",        level: 2, kind: "subsection", courseCode: cd.courseCode });
        items.push({ id: `course-${cd.courseCode}-sec2`, label: "2. Course Details",         level: 2, kind: "subsection", courseCode: cd.courseCode });
        items.push({ id: `course-${cd.courseCode}-sec3`, label: "3. Syllabus & Teaching",    level: 2, kind: "subsection", courseCode: cd.courseCode });
        items.push({ id: `course-${cd.courseCode}-sec4`, label: "4. Resources & Assessment", level: 2, kind: "subsection", courseCode: cd.courseCode });
      });
    });

    items.push({ id: "cpv-back", label: "Back Cover", level: 0, kind: "section" });

    return items;
  }, [grouped, frontMatterSplit]);

  const filteredToc = useMemo(() => {
    if (!sideQuery.trim()) return tocItems;
    const q = sideQuery.toLowerCase();
    return tocItems.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.courseCode && it.courseCode.toLowerCase().includes(q))
    );
  }, [tocItems, sideQuery]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);

      let current = null;
      for (const it of tocItems) {
        const t = document.getElementById(it.id);
        if (!t) continue;
        const r = t.getBoundingClientRect();
        if (r.top <= 110 && r.bottom >= 40) {
          current = it.id;
          break;
        }
      }
      if (current && current !== activeId) setActiveId(current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [tocItems, activeId]);

  useEffect(() => {
    if (!fitWidth) return;
    const recalc = () => {
      const area = areaRef.current;
      if (!area) return;
      const available = area.clientWidth - 60;
      const pagePx = 210 * 3.7795;
      setZoom(Math.max(0.3, Math.min(1.4, available / pagePx)));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [fitWidth]);

  useEffect(() => {
    if (isFullscreen) document.body.classList.add("cpv-fs");
    else document.body.classList.remove("cpv-fs");
    return () => document.body.classList.remove("cpv-fs");
  }, [isFullscreen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const zIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const zOut = () => setZoom((z) => Math.max(z - 0.1, 0.25));

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    if (!wrapRef.current) return;
    setExporting(true);
    setDdOpen(false);
    const tid = toast.loading("Generating PDF…");
    try {
      await html2pdf()
        .set({
          margin: 0,
          filename: `${programInfo?.programCode || "Curriculum"}_${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: false,
            backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(wrapRef.current)
        .save();
      toast.success("PDF downloaded", { id: tid });
    } catch (err) {
      console.error(err);
      toast.error("PDF failed — using print dialog", { id: tid });
      setTimeout(() => window.print(), 300);
    } finally {
      setExporting(false);
    }
  };

  const handleExportHTML = () => {
    setDdOpen(false);
    const html = generateStandaloneHTML({
      frontMatterPages,
      selectedCDs: sortedCDs,
      selectedSections,
      programInfo,
      curriculumConfig,
    });
    downloadHTML(
      html,
      `${programInfo?.programCode || "Curriculum"}_${new Date()
        .toISOString()
        .slice(0, 10)}.html`
    );
    toast.success("HTML downloaded");
  };

  const toggleGroup = (id) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!isOpen) return null;

  const institution = curriculumConfig?.university || "GM University";
  const doctype = curriculumConfig?.title || "Curriculum Book";
  const scheme = curriculumConfig?.scheme || "";

  return (
    <div className="cpv-shell">
      <style>{CD_PREVIEW_STYLES}</style>

      {/* Toolbar */}
      <div className="cpv-toolbar no-print">
        <div className="grp grow">
          <button className="cpv-btn" onClick={onClose}>
            <ChevronLeft size={14} /> Back
          </button>
          <button
            className={`cpv-btn ${sidebarOpen ? "active" : ""}`}
            onClick={() => setSidebarOpen((v) => !v)}
            title="Table of Contents"
          >
            <List size={14} /> TOC
          </button>
          <span className="cpv-badge" title={programInfo?.programName}>
            {programInfo?.programName || "Curriculum"} · {sortedCDs.length} courses
          </span>
        </div>

        <div className="grp">
          <div className="cpv-zoom">
            <button onClick={zOut} title="Zoom out"><ZoomOut size={14} /></button>
            <span className="val" onDoubleClick={() => setZoom(0.6)}>
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={zIn} title="Zoom in"><ZoomIn size={14} /></button>
          </div>
          <button
            className={`cpv-btn ghost ${fitWidth ? "active" : ""}`}
            onClick={() => setFitWidth((v) => !v)}
            title="Fit to width"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className={`cpv-btn ghost ${isFullscreen ? "active" : ""}`}
            onClick={() => setIsFullscreen((v) => !v)}
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        <div className="grp">
          <div className="cpv-dd-wrap">
            <button className="cpv-btn" onClick={() => setDdOpen((v) => !v)}>
              <Download size={14} /> Export <ChevronDown size={11} />
            </button>
            {ddOpen && (
              <div className="cpv-dd">
                <button className="cpv-dd-item" onClick={handleExportPDF} disabled={exporting}>
                  <Printer size={15} />
                  <div>
                    <div className="t">{exporting ? "Generating…" : "Download PDF"}</div>
                    <div className="s">Client-side, A4, print-ready</div>
                  </div>
                </button>
                <button className="cpv-dd-item" onClick={handleExportHTML}>
                  <FileDown size={15} />
                  <div>
                    <div className="t">Download HTML</div>
                    <div className="s">Standalone styled document</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          <button className="cpv-btn primary" onClick={handlePrint}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="cpv-progress no-print">
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="cpv-banner no-print">
        <span>
          <Info size={15} />
          Use <strong>Export → Download PDF</strong> for a print-ready file with page numbers.
        </span>
      </div>

      {/* Sidebar TOC */}
      <div className={`cpv-side ${sidebarOpen ? "open" : ""} no-print`}>
        <div className="cpv-side-hdr">
          <List size={12} /> Table of Contents
        </div>
        <div className="cpv-side-search">
          <Search size={12} style={{ color: "#64748b" }} />
          <input
            value={sideQuery}
            onChange={(e) => setSideQuery(e.target.value)}
            placeholder="Search sections, codes, titles…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredToc.length > 0) {
                scrollTo(filteredToc[0].id);
              }
            }}
          />
        </div>
        <div className="cpv-side-body">
          {filteredToc.length === 0 ? (
            <div className="cpv-side-empty">No matching sections.</div>
          ) : (
            filteredToc.map((it) => {
              if (it.kind === "section") {
                return (
                  <div key={it.id} className="cpv-side-item group">
                    {it.label}
                  </div>
                );
              }
              if (it.kind === "course") {
                const expanded = expandedGroups[it.id] !== false;
                return (
                  <button
                    key={it.id}
                    className={`cpv-side-item lvl-1 ${activeId === it.id ? "active" : ""}`}
                    onClick={() => {
                      toggleGroup(it.id);
                      scrollTo(it.id);
                    }}
                  >
                    <FileText size={12} style={{ opacity: 0.6 }} />
                    <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
                    <ChevronDown
                      size={12}
                      style={{
                        transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                        opacity: 0.5,
                        transition: "transform .15s",
                      }}
                    />
                  </button>
                );
              }
              if (it.kind === "subsection") {
                const parentId = `course-${it.courseCode}`;
                const expanded = expandedGroups[parentId] !== false;
                if (!expanded) return null;
              }
              return (
                <button
                  key={it.id}
                  className={`cpv-side-item ${
                    it.level === 1 ? "lvl-1" : it.level === 2 ? "lvl-2" : ""
                  } ${activeId === it.id ? "active" : ""}`}
                  onClick={() => scrollTo(it.id)}
                >
                  {it.kind === "semester" && <Layers size={12} style={{ opacity: 0.6 }} />}
                  <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Body */}
      <div className="cpv-body-area" ref={areaRef}>
        <div
          className="cpv-page-wrap"
          ref={wrapRef}
          style={{
            transform: `scale(${zoom})`,
            marginBottom: `${zoom < 1 ? (zoom - 1) * 1200 : 0}px`,
          }}
        >
          <div className="cpv-print-area">
            {/* 1. COVER */}
            <div id="cpv-top">
              {frontMatterSplit.cover.length > 0 ? (
                frontMatterSplit.cover.map((p) => (
                  <FrontMatterPage key={p.name} page={p} id={`frontmatter-${p.name}`} />
                ))
              ) : (
                <CoverPage
                  institution={institution}
                  doctype={doctype}
                  scheme={scheme}
                  programInfo={programInfo}
                  curriculumConfig={curriculumConfig}
                />
              )}
            </div>

            {/* 2. ACKNOWLEDGEMENT */}
            {frontMatterSplit.acknowledgement.map((p) => (
              <FrontMatterPage key={p.name} page={p} id={`frontmatter-${p.name}`} />
            ))}

            {/* 3. ACADEMIC COUNCIL + BOS (merged page) */}
            {frontMatterSplit.council.length > 0 && (
              <div id="cpv-council" className="cpv-doc cpv-doc-fm">
                {frontMatterSplit.council.map((p, i) => (
                  <div
                    key={p.name}
                    style={{
                      pageBreakInside:
                        i < frontMatterSplit.council.length - 1 ? "avoid" : "auto",
                    }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          borderTop: "1pt solid var(--rule)",
                          margin: "8mm 0 6mm 0",
                        }}
                      />
                    )}
                    <div
                      className="cpv-frontpage"
                      dangerouslySetInnerHTML={{
                        __html: normaliseAssets(p.content, "front_matter"),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 4. OTHER FRONT MATTER */}
            {frontMatterSplit.other.map((p) => (
              <FrontMatterPage key={p.name} page={p} id={`frontmatter-${p.name}`} />
            ))}

            {/* 5. TABLE OF CONTENTS */}
            <div className="cpv-doc" id="cpv-toc">
              <RunningHead
                institution={institution}
                doctype="Table of Contents"
                context={programInfo?.programCode || ""}
              />
              <TOCPage
                grouped={grouped}
                tocItems={tocItems}
                acknowledgementCount={frontMatterSplit.acknowledgement.length}
                hasCouncil={frontMatterSplit.council.length > 0}
                otherFrontMatterCount={frontMatterSplit.other.length}
                hasBackCover
                scrollTo={scrollTo}
              />
              <RunningFoot
                note={`${institution} · Official Curriculum`}
                brand={programInfo?.programCode || ""}
              />
            </div>

            {/* 6. CONTENT */}
            {Array.from(grouped.entries()).map(([semester, courses]) => (
              <React.Fragment key={`sem-${semester}`}>
                <div id={`semester-${semester}`} className="cpv-doc">
                  <RunningHead
                    institution={institution}
                    doctype={doctype}
                    context={
                      typeof semester === "number"
                        ? `Semester ${semester}`
                        : String(semester)
                    }
                  />
                  <div className="cpv-sem-divider">
                    <div className="label">Semester</div>
                    <div className="num">
                      {typeof semester === "number"
                        ? String(semester).padStart(2, "0")
                        : "—"}
                    </div>
                    <div className="rule" />
                    <div className="prog">{programInfo?.programName || "Program"}</div>
                  </div>
                  <RunningFoot
                    note={`${institution} · Official Curriculum`}
                    brand={programInfo?.programCode || ""}
                  />
                </div>

                {courses.map((cd) => (
                  <div
                    key={`${semester}-${cd.courseCode}`}
                    id={`course-${cd.courseCode}`}
                    className="cpv-anchor"
                  >
                    <CDRenderer
                      cd={cd.cdData || cd}
                      meta={{ versionNo: cd.cdVersion }}
                      selectedSections={selectedSections}
                      showHeader
                      showFooter
                      institution={institution}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* 7. BACK COVER */}
            {frontMatterSplit.backCover.length > 0 ? (
              frontMatterSplit.backCover.map((p) => (
                <FrontMatterPage key={p.name} page={p} id={`frontmatter-${p.name}`} />
              ))
            ) : (
              <div className="cpv-doc" id="cpv-back">
                <div className="cpv-backcover">
                  <div className="bc-title">{institution}</div>
                  <div className="bc-sub">
                    End of Curriculum — {programInfo?.programName || "Program"}
                  </div>
                  <div className="bc-meta">
                    {scheme} &nbsp;·&nbsp; {programInfo?.programCode || ""}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   COVER PAGE (built-in fallback)
============================================================ */

const CoverPage = ({ institution, doctype, scheme, programInfo, curriculumConfig }) => (
  <div className="cpv-doc cpv-doc-fm">
    {curriculumConfig?.coverHtml ? (
      <div
        className="cpv-frontpage"
        dangerouslySetInnerHTML={{
          __html: normaliseAssets(curriculumConfig.coverHtml, "front_matter"),
        }}
      />
    ) : (
      <div className="cpv-cover">
        <div className="cpv-cover-top">
          <div className="cpv-cover-logo">
            {curriculumConfig?.logo ? (
              <img src={curriculumConfig.logo} alt="Logo" />
            ) : (
              "LOGO"
            )}
          </div>
          <div className="cpv-cover-univ">{institution}</div>
          <div className="cpv-cover-sub">
            {curriculumConfig?.faculty || "Faculty of Engineering"}
          </div>
          <div className="cpv-cover-rule" />
        </div>

        <div className="cpv-cover-mid">
          <div className="cpv-cover-doctype">{doctype}</div>
          {curriculumConfig?.degreeTitle && (
            <div className="cpv-cover-degree">{curriculumConfig.degreeTitle}</div>
          )}
          <div className="cpv-cover-program">
            {programInfo?.programName || "Program Name"}
          </div>
          {scheme && <div className="cpv-cover-scheme">{scheme}</div>}
        </div>

        <div className="cpv-cover-bottom">
          <div className="school">
            {curriculumConfig?.school || "School of Engineering"}
          </div>
          <div className="faculty">
            {curriculumConfig?.department || "Department of Computer Science"}
          </div>
          <div className="year">
            Academic Year {curriculumConfig?.year || new Date().getFullYear()}
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ============================================================
   TOC PAGE (clickable, with sequential page numbers)
============================================================ */

const TOCPage = ({
  grouped,
  tocItems,
  acknowledgementCount,
  hasCouncil,
  otherFrontMatterCount,
  hasBackCover,
  scrollTo,
}) => {
  const pageFor = (id) => {
    if (typeof document === "undefined") return "";
    const el = document.getElementById(id);
    if (!el) return "";
    let node = el;
    while (node && !node.classList?.contains("cpv-doc")) node = node.parentElement;
    if (!node) return "";
    const all = Array.from(document.querySelectorAll(".cpv-doc"));
    const idx = all.indexOf(node);
    return idx >= 0 ? String(idx + 1) : "";
  };

  const frontMatterOther = tocItems.filter(
    (i) => i.kind === "front" && i.id !== "cpv-council"
  );

  const ButtonEntry = ({ id, label, className = "", children }) => (
    <button
      className={className || "cpv-toc-entry"}
      style={{
        background: "none",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
      }}
      onClick={() => scrollTo?.(id)}
    >
      {children || (
        <>
          <span className="title">{label}</span>
          <span className="num">{pageFor(id)}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="cpv-toc">
      <div className="cpv-toc-title">Table of Contents</div>

      <div className="cpv-toc-section">Front Matter</div>
      <ButtonEntry id="cpv-top" label="Cover Page" />

      {acknowledgementCount > 0 && (
        <button
          className="cpv-toc-entry cpv-toc-sub"
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            font: "inherit",
          }}
          onClick={() => {
            const firstAck = tocItems.find(
              (i) => i.kind === "front" && i.label.toLowerCase().includes("ack")
            );
            if (firstAck) scrollTo?.(firstAck.id);
          }}
        >
          <span className="title">Acknowledgements</span>
          <span className="num">
            {pageFor("cpv-top") ? String(Number(pageFor("cpv-top")) + 1) : ""}
          </span>
        </button>
      )}

      {hasCouncil && (
        <ButtonEntry id="cpv-council" label="Academic Council & Board of Studies" className="cpv-toc-entry cpv-toc-sub" />
      )}

      {frontMatterOther.map((it) => (
        <ButtonEntry
          key={it.id}
          id={it.id}
          label={it.label}
          className="cpv-toc-entry cpv-toc-sub"
        />
      ))}

      <ButtonEntry id="cpv-toc" label="Table of Contents" className="cpv-toc-entry cpv-toc-sub" />

      <div className="cpv-toc-section">Curriculum Content</div>
      {Array.from(grouped.entries()).map(([semester, courses]) => (
        <React.Fragment key={`toc-${semester}`}>
          <button
            className="cpv-toc-entry"
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              font: "inherit",
            }}
            onClick={() => scrollTo?.(`semester-${semester}`)}
          >
            <span className="code" style={{ minWidth: "auto", marginRight: 8 }}>
              {typeof semester === "number" ? `Semester ${semester}` : semester}
            </span>
            <span className="num">{pageFor(`semester-${semester}`)}</span>
          </button>
          {courses.map((cd) => (
            <button
              key={cd.courseCode}
              className="cpv-toc-entry cpv-toc-sub"
              style={{
                background: "none",
                border: "none",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={() => scrollTo?.(`course-${cd.courseCode}`)}
            >
              <span>
                <span className="code">{cd.courseCode}</span>
                <span className="title">{cd.courseTitle}</span>
              </span>
              <span className="num">{pageFor(`course-${cd.courseCode}`)}</span>
            </button>
          ))}
        </React.Fragment>
      ))}

      <div className="cpv-toc-section">Back Matter</div>
      {hasBackCover && (
        <button
          className="cpv-toc-entry"
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            font: "inherit",
          }}
          onClick={() => scrollTo?.("cpv-back")}
        >
          <span className="title">Back Cover</span>
          <span className="num">{pageFor("cpv-back") || "Last"}</span>
        </button>
      )}
    </div>
  );
};

/* ============================================================
   STANDALONE HTML EXPORT
============================================================ */

const renderCDToHTML = (cd, selectedSections, meta, institution) => {
  const d = cd || {};
  const f = (k) => field(d, k);
  const m = meta || {};
  const show = (s, ss) => {
    if (!selectedSections) return true;
    return selectedSections[`${s}.${ss}`] !== false;
  };
  const P = (h, fb = "<p class='cpv-empty'>Not provided.</p>") =>
    isEmpty(h) ? fb : h;
  const code = f("courseCode") || "—";

  const s1Visible = show("section1", "identity") || show("section1", "credits");
  const s2Visible =
    show("section2", "aimsSummary") ||
    show("section2", "objectives") ||
    show("section2", "courseOutcomes") ||
    show("section2", "outcomeMap");
  const s3Visible = show("section3", "courseContent") || show("section3", "teaching");
  const s4Visible =
    show("section4", "resources") ||
    show("section4", "assessmentWeight") ||
    show("section4", "gradingCriterion") ||
    show("section4", "attainmentCalculations") ||
    show("section4", "otherDetails");

  let out = `<div class="cpv-doc" data-cd-code="${esc(code)}" id="course-${esc(code)}-body">`;

  out += `<div class="cpv-runhead">
    <span class="rh-left">${esc(f("schoolTitle") || institution)}</span>
    <span class="rh-mid">Course Document</span>
    <span class="rh-right">${esc(code)}</span>
  </div>`;

  out += `<div class="cpv-course-card">
    <div class="eyebrow">Course Document</div>
    <div class="title">${esc(f("courseTitle") || "Course")}</div>
    <div class="meta">
      <span><span class="k">Code</span> <span class="v">${esc(code)}</span></span>
      ${f("programCode") ? `<span><span class="k">Program</span> <span class="v">${esc(f("programCode"))}</span></span>` : ""}
      ${m.versionNo ? `<span><span class="k">Version</span> <span class="v">v${esc(m.versionNo)}</span></span>` : ""}
      ${d.credits?.total != null ? `<span><span class="k">Credits</span> <span class="v">${esc(d.credits.total)}</span></span>` : ""}
    </div>
  </div>`;

  if (s1Visible) {
    out += `<h2 class="cpv-h1" id="course-${esc(code)}-sec1">1. Course Identity</h2>`;
  }

  if (show("section1", "identity")) {
    out += `<table class="cpv-t-identity"><tbody>
      ${[
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
      ]
        .map(
          ([l, v]) =>
            `<tr><td>${esc(l)}</td><td>${v ? esc(v) : '<span class="cpv-empty">—</span>'}</td></tr>`
        )
        .join("")}
    </tbody></table>`;
  }

  if (show("section1", "credits")) {
    out += `<h3 class="cpv-h2">1.1 Course Size</h3>
      <table class="cpv-t-credits"><thead>
        <tr><th>Total Credits</th><th>L (Lecture)</th><th>T (Tutorial)</th><th>P (Practical)</th><th>Total Hours</th></tr>
      </thead><tbody>
        <tr>
          <td>${esc(d.credits?.total ?? 0)}</td>
          <td>${esc(d.credits?.L ?? 0)}</td>
          <td>${esc(d.credits?.T ?? 0)}</td>
          <td>${esc(d.credits?.P ?? 0)}</td>
          <td>${esc(d.totalHours ?? 0)}</td>
        </tr>
      </tbody></table>`;
  }

  if (s2Visible) {
    out += `<h2 class="cpv-h1" id="course-${esc(code)}-sec2">2. Course Details</h2>`;
  }
  if (show("section2", "aimsSummary")) {
    out += `<h3 class="cpv-h2">2.1 Course Aims and Summary</h3>
      <div class="cpv-body">${P(d.aimsSummary)}</div>`;
  }
  if (show("section2", "objectives")) {
    out += `<h3 class="cpv-h2">2.2 Course Objectives</h3>
      <div class="cpv-body">${P(d.objectives)}</div>`;
  }
  if (show("section2", "courseOutcomes")) {
    out += `<h3 class="cpv-h2">2.3 Course Outcomes (COs)</h3>
      <div class="cpv-body"><p style="font-style:italic;margin-bottom:2mm;">After undergoing this course, students will be able to:</p></div>`;
    if (!isEmpty(d.courseOutcomesHtml)) {
      out += `<div class="cpv-body">${d.courseOutcomesHtml}</div>`;
    } else if (d.courseOutcomes?.length) {
      out += `<table class="cpv-t-co"><thead>
        <tr><th>Course Outcome</th><th style="text-align:left;">Description</th></tr>
      </thead><tbody>
        ${d.courseOutcomes
          .map(
            (co) =>
              `<tr><td>${esc(co.code)}</td><td style="text-align:justify;">${co.description || ""}</td></tr>`
          )
          .join("")}
      </tbody></table>`;
    }
  }
  if (show("section2", "outcomeMap")) {
    out += `<h4 class="cpv-h3">2.4 Outcome Map (CO → PO / PSO)</h4>`;
    if (!isEmpty(d.outcomeMapHtml)) {
      out += `<div class="cpv-body">${d.outcomeMapHtml}</div>`;
    } else if (d.outcomeMap?.matrix?.length >= 2) {
      out += `<table><thead><tr>${d.outcomeMap.matrix[0]
        .map((h) => `<th style="font-size:8.5pt;">${esc(h)}</th>`)
        .join("")}</tr></thead><tbody>${d.outcomeMap.matrix
        .slice(1)
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell, ci) =>
                  `<td style="text-align:center;font-size:8.5pt;${ci === 0 ? "font-weight:700;" : ""}">${esc(cell)}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}</tbody></table>`;
    }
    out += `<p class="cpv-note">Relevance: 1 = High · 2 = Medium · 3 = Low</p>`;
  }

  if (s3Visible) {
    out += `<h2 class="cpv-h1" id="course-${esc(code)}-sec3">3. Syllabus and Teaching</h2>`;
  }
  if (show("section3", "courseContent")) {
    out += `<h3 class="cpv-h2">3.1 Course Content</h3>
      <div class="cpv-body">${P(d.courseContent)}</div>`;
  }
  if (show("section3", "teaching")) {
    out += `<h3 class="cpv-h2">3.2 Teaching Schedule</h3>`;
    if (d.teaching?.length) {
      out += `<table class="cpv-t-teach"><thead>
        <tr><th>Sl. No.</th><th style="text-align:left;">Lecture Topic</th><th>Slides</th><th>Videos</th></tr>
      </thead><tbody>${d.teaching
        .map(
          (l) =>
            `<tr><td style="text-align:center;">${esc(l.number)}</td><td>${esc(l.topic)}</td><td style="text-align:center;">${esc(l.slides)}</td><td style="text-align:center;">${esc(l.videos)}</td></tr>`
        )
        .join("")}</tbody></table>`;
    } else out += `<p class="cpv-empty">Not provided.</p>`;
  }

  if (s4Visible) {
    out += `<h2 class="cpv-h1" id="course-${esc(code)}-sec4">4. Resources and Assessment</h2>`;
  }
  if (show("section4", "resources")) {
    out += `<h3 class="cpv-h2">4.1 Course Resources</h3>
      <h4 class="cpv-h3">Text Books</h4>`;
    out += d.resources?.textBooks?.length
      ? `<ol style="padding-left:6mm;">${d.resources.textBooks.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`
      : `<p class="cpv-empty">Not provided.</p>`;
    out += `<h4 class="cpv-h3">Reference Books</h4>`;
    out += d.resources?.references?.length
      ? `<ol style="padding-left:6mm;">${d.resources.references.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>`
      : `<p class="cpv-empty">Not provided.</p>`;
    out += `<h4 class="cpv-h3">Other Resources</h4>`;
    out += d.resources?.otherResources?.length
      ? `<ul style="padding-left:6mm;">${d.resources.otherResources.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`
      : `<p class="cpv-empty">Not provided.</p>`;
  }

  if (show("section4", "assessmentWeight")) {
    out += `<h3 class="cpv-h2">4.2 Assessment Weight Distribution</h3>`;
    if (!isEmpty(d.assessmentWeightHtml)) {
      out += `<div class="cpv-body">${d.assessmentWeightHtml}</div>`;
    } else if (d.assessmentWeight?.length) {
      out += `<table class="cpv-t-aw"><thead>
        <tr>
          <th rowspan="2" class="co-col">COs<br>with Wt.</th>
          <th colspan="3">Quiz (15)</th>
          <th colspan="3">Test (25)</th>
          <th colspan="2">Assignment (20)</th>
          <th rowspan="2">CIE<br>=60</th>
          <th rowspan="2">SEE<br>=40</th>
        </tr>
        <tr>${["Q1\n=5","Q2\n=4","Q3\n=6","T1\n=7","T2\n=8","T3\n=10","A1\n=10","A2\n=10"]
          .map((l) => `<th style="white-space:pre-line;">${l}</th>`)
          .join("")}</tr>
      </thead><tbody>${d.assessmentWeight
        .map(
          (row) =>
            `<tr>
              <td class="co-col">${esc(row.co)}</td>
              ${["q1","q2","q3","t1","t2","t3","a1","a2"]
                .map((k) => `<td style="text-align:center;">${esc(row[k] || "")}</td>`)
                .join("")}
              <td style="text-align:center;font-weight:700;">${esc(row.cie || "")}</td>
              <td style="text-align:center;font-weight:700;">${esc(row.see || "")}</td>
            </tr>`
        )
        .join("")}</tbody></table>`;
    } else out += `<p class="cpv-empty">Not provided.</p>`;
  }

  if (show("section4", "gradingCriterion")) {
    out += `<h3 class="cpv-h2">4.3 Grading Criterion</h3>
      <div class="cpv-body">${P(d.gradingCriterion)}</div>`;
  }
  if (
    show("section4", "attainmentCalculations") &&
    (d.attainmentCalculations?.recordingMarks || d.attainmentCalculations?.settingTargets)
  ) {
    out += `<h3 class="cpv-h2">4.4 Attainment Calculations</h3>`;
    if (d.attainmentCalculations.recordingMarks) {
      out += `<h4 class="cpv-h3">Recording Marks and Awarding Grades</h4>
        <div class="cpv-body">${P(d.attainmentCalculations.recordingMarks)}</div>`;
    }
    if (d.attainmentCalculations.settingTargets) {
      out += `<h4 class="cpv-h3">Setting Attainment Targets</h4>
        <div class="cpv-body">${P(d.attainmentCalculations.settingTargets)}</div>`;
    }
  }
  if (show("section4", "otherDetails")) {
    out += `<h3 class="cpv-h2">4.5 Other Details</h3>
      <h4 class="cpv-h3">Assignment Details / Problem Based Learning</h4>
      <div class="cpv-body">${P(d.otherDetails?.assignmentDetails)}</div>
      <h4 class="cpv-h3">Academic Integrity Policy</h4>
      <div class="cpv-body">${P(d.otherDetails?.academicIntegrity)}</div>`;
  }

  out += `<div class="cpv-sig">
    <div class="cpv-sig-box">Prepared by — Faculty Member</div>
    <div class="cpv-sig-box">Verified by — Head of Department</div>
  </div>`;

  out += `<div class="cpv-runfoot">
    <span>${esc(f("schoolTitle") || f("department") || institution)} · Official Academic Record</span>
    <span class="rf-page"></span>
    <span>${esc(code)}</span>
  </div>`;

  out += `</div>`;
  return out;
};

export const generateStandaloneHTML = ({
  frontMatterPages = [],
  selectedCDs = [],
  selectedSections,
  programInfo,
  curriculumConfig,
}) => {
  const institution = curriculumConfig?.university || "GM University";
  const doctype = curriculumConfig?.title || "Curriculum Book";
  const scheme = curriculumConfig?.scheme || "";

  const sorted = [...selectedCDs].sort((a, b) => {
    const sa = typeof a.semester === "number" ? a.semester : 999;
    const sb = typeof b.semester === "number" ? b.semester : 999;
    if (sa !== sb) return sa - sb;
    return (a.courseCode || "").localeCompare(b.courseCode || "");
  });

  const grouped = new Map();
  sorted.forEach((cd) => {
    const s = cd.semester ?? "Other";
    if (!grouped.has(s)) grouped.set(s, []);
    grouped.get(s).push(cd);
  });

  const cover = [];
  const acknowledgement = [];
  const council = [];
  const other = [];
  const backCover = [];

  frontMatterPages.forEach((p) => {
    const n = (p.name || "").toLowerCase();
    if (n.includes("back_cover") || n.includes("back-cover") || n === "back") backCover.push(p);
    else if (n === "cover" || n.includes("front_cover")) cover.push(p);
    else if (n.includes("acknowledg")) acknowledgement.push(p);
    else if (
      n.includes("academic_council") ||
      n.includes("academic-council") ||
      n === "bos" ||
      n.includes("board_of_studies") ||
      n.includes("board-of-studies")
    )
      council.push(p);
    else other.push(p);
  });

  const fmPageHTML = (p) => `<div class="cpv-doc cpv-doc-fm" id="frontmatter-${esc(p.name)}">
    <div class="cpv-frontpage">${normaliseAssets(p.content, "front_matter")}</div>
  </div>`;

  const coverHTML = cover.length
    ? cover.map(fmPageHTML).join("")
    : `
    <div class="cpv-doc cpv-doc-fm" id="cpv-top">
      <div class="cpv-cover">
        <div class="cpv-cover-top">
          <div class="cpv-cover-logo">${
            curriculumConfig?.logo
              ? `<img src="${esc(curriculumConfig.logo)}" alt="Logo" />`
              : "LOGO"
          }</div>
          <div class="cpv-cover-univ">${esc(institution)}</div>
          <div class="cpv-cover-sub">${esc(
            curriculumConfig?.faculty || "Faculty of Engineering"
          )}</div>
          <div class="cpv-cover-rule"></div>
        </div>
        <div class="cpv-cover-mid">
          <div class="cpv-cover-doctype">${esc(doctype)}</div>
          ${
            curriculumConfig?.degreeTitle
              ? `<div class="cpv-cover-degree">${esc(curriculumConfig.degreeTitle)}</div>`
              : ""
          }
          <div class="cpv-cover-program">${esc(
            programInfo?.programName || "Program Name"
          )}</div>
          ${scheme ? `<div class="cpv-cover-scheme">${esc(scheme)}</div>` : ""}
        </div>
        <div class="cpv-cover-bottom">
          <div class="school">${esc(
            curriculumConfig?.school || "School of Engineering"
          )}</div>
          <div class="faculty">${esc(curriculumConfig?.department || "")}</div>
          <div class="year">Academic Year ${esc(
            curriculumConfig?.year || new Date().getFullYear()
          )}</div>
        </div>
      </div>
    </div>`;

  const fmHTML = (pages) => pages.map(fmPageHTML).join("");

  const councilHTML =
    council.length > 0
      ? `<div class="cpv-doc cpv-doc-fm" id="cpv-council">${council
          .map(
            (p, i) =>
              `${i > 0 ? '<div style="border-top:1pt solid var(--rule);margin:8mm 0 6mm 0;"></div>' : ""}
               <div class="cpv-frontpage">${normaliseAssets(p.content, "front_matter")}</div>`
          )
          .join("")}</div>`
      : "";

  let tocHTML = `<div class="cpv-doc" id="cpv-toc">
    <div class="cpv-runhead">
      <span class="rh-left">${esc(institution)}</span>
      <span class="rh-mid">Table of Contents</span>
      <span class="rh-right">${esc(programInfo?.programCode || "")}</span>
    </div>
    <div class="cpv-toc">
      <div class="cpv-toc-title">Table of Contents</div>
      <div class="cpv-toc-section">Front Matter</div>
      <div class="cpv-toc-entry"><span class="title">Cover Page</span><span class="num"></span></div>
      ${
        acknowledgement.length
          ? `<div class="cpv-toc-entry cpv-toc-sub"><span class="title">Acknowledgements</span><span class="num"></span></div>`
          : ""
      }
      ${
        council.length
          ? `<div class="cpv-toc-entry cpv-toc-sub"><span class="title">Academic Council &amp; Board of Studies</span><span class="num"></span></div>`
          : ""
      }
      <div class="cpv-toc-section">Curriculum Content</div>`;

  grouped.forEach((courses, semester) => {
    tocHTML += `<div class="cpv-toc-entry"><span class="code" style="min-width:auto;margin-right:8px;">${
      typeof semester === "number" ? `Semester ${semester}` : esc(semester)
    }</span><span class="num"></span></div>`;
    courses.forEach((cd) => {
      tocHTML += `<div class="cpv-toc-entry cpv-toc-sub"><span><span class="code">${esc(
        cd.courseCode
      )}</span><span class="title">${esc(cd.courseTitle)}</span></span><span class="num"></span></div>`;
    });
  });

  tocHTML += `<div class="cpv-toc-section">Back Matter</div>
      <div class="cpv-toc-entry"><span class="title">Back Cover</span><span class="num">Last</span></div>
    </div>
    <div class="cpv-runfoot"><span>${esc(
      institution
    )} · Official Curriculum</span><span class="rf-page"></span><span>${esc(
    programInfo?.programCode || ""
  )}</span></div>
  </div>`;

  let bodyHTML = "";
  grouped.forEach((courses, semester) => {
    bodyHTML += `
      <div class="cpv-doc" id="semester-${esc(String(semester))}">
        <div class="cpv-runhead">
          <span class="rh-left">${esc(institution)}</span>
          <span class="rh-mid">${esc(doctype)}</span>
          <span class="rh-right">${
            typeof semester === "number" ? `Semester ${semester}` : esc(semester)
          }</span>
        </div>
        <div class="cpv-sem-divider">
          <div class="label">Semester</div>
          <div class="num">${
            typeof semester === "number"
              ? String(semester).padStart(2, "0")
              : "—"
          }</div>
          <div class="rule"></div>
          <div class="prog">${esc(programInfo?.programName || "Program")}</div>
        </div>
        <div class="cpv-runfoot">
          <span>${esc(institution)} · Official Curriculum</span>
          <span class="rf-page"></span>
          <span>${esc(programInfo?.programCode || "")}</span>
        </div>
      </div>`;

    courses.forEach((cd) => {
      bodyHTML += renderCDToHTML(
        cd.cdData || cd,
        selectedSections,
        { versionNo: cd.cdVersion },
        institution
      );
    });
  });

  const backHTML = backCover.length
    ? fmHTML(backCover)
    : `<div class="cpv-doc" id="cpv-back"><div class="cpv-backcover">
        <div class="bc-title">${esc(institution)}</div>
        <div class="bc-sub">End of Curriculum — ${esc(
          programInfo?.programName || "Program"
        )}</div>
        <div class="bc-meta">${esc(scheme)} &nbsp;·&nbsp; ${esc(
        programInfo?.programCode || ""
      )}</div>
      </div></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(doctype)} — ${esc(programInfo?.programName || "Curriculum")}</title>
  <style>${CD_PREVIEW_STYLES}</style>
  <style>
    body { margin: 0; background: var(--page-bg); font-family: var(--font-body); }
    .cpv-print-area { padding: 30px 20px 60px 20px; }
  </style>
</head>
<body>
  <div class="cpv-print-area">
    ${coverHTML}
    ${fmHTML(acknowledgement)}
    ${councilHTML}
    ${fmHTML(other)}
    ${tocHTML}
    ${bodyHTML}
    ${backHTML}
  </div>
</body>
</html>`;
};

/* ============================================================
   DOWNLOAD HELPERS
============================================================ */

export const downloadHTML = (html, filename) => {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPDF = (html, filename) => {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Please allow popups to download PDF");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 500);
};

/* ============================================================
   CD SELECTION CARD
============================================================ */

export const CDSelectionCard = ({
  cd,
  isSelected,
  onToggle,
  onPreview,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  return (
    <div
      className={`border rounded-xl transition-all ${
        isSelected
          ? "border-amber-500 bg-amber-50/50 shadow-sm"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={`p-0.5 rounded ${
              canMoveUp
                ? "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                : "text-stone-200"
            }`}
          >
            <ChevronDown size={12} className="rotate-180" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={`p-0.5 rounded ${
              canMoveDown
                ? "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                : "text-stone-200"
            }`}
          >
            <ChevronDown size={12} />
          </button>
        </div>

        <button
          onClick={() => onToggle(cd.courseCode)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-amber-500 border-amber-500 text-white"
              : "border-stone-300 hover:border-amber-400"
          }`}
        >
          {isSelected && <CheckSquare size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 text-sm">
              {cd.courseCode}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                cd.available
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {cd.available ? "Available" : "Missing"}
            </span>
          </div>
          <p className="text-xs text-stone-500 truncate">{cd.courseTitle}</p>
        </div>

        <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded">
          {typeof cd.semester === "number" ? `Sem ${cd.semester}` : cd.semester}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview?.(cd)}
            disabled={!cd.available || !onPreview}
            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30"
            title="Preview this CD"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   UNIVERSAL SECTION SELECTOR
============================================================ */

export const UniversalSectionSelector = ({
  value,
  onChange,
  compact = false,
}) => {
  const sections = value || getDefaultSections();

  const toggle = (key) => {
    const currentlyOn = sections[key] !== false;
    const next = { ...sections, [key]: !currentlyOn };
    onChange?.(next);
  };

  const toggleAll = (on) => {
    const next = {};
    ALL_SECTION_KEYS.forEach((k) => (next[k] = !!on));
    onChange?.(next);
  };

  const allOn = ALL_SECTION_KEYS.every((k) => sections[k] !== false);
  const allOff = ALL_SECTION_KEYS.every((k) => sections[k] === false);

  return (
    <div className={compact ? "" : "space-y-3"}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-stone-500" />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
            Include Sections (applies to all selected CDs)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className={`text-[11px] px-2 py-1 rounded font-bold border transition-colors ${
              allOn
                ? "bg-amber-600 border-amber-600 text-white"
                : "border-stone-300 text-amber-700 hover:bg-amber-50"
            }`}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className={`text-[11px] px-2 py-1 rounded font-bold border transition-colors ${
              allOff
                ? "bg-stone-700 border-stone-700 text-white"
                : "border-stone-300 text-stone-600 hover:bg-stone-100"
            }`}
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.values(CD_SECTIONS).map((section) => (
          <div
            key={section.id}
            className="border border-stone-200 rounded-xl p-3 bg-white"
          >
            <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2">
              {section.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {section.subsections.map((sub) => {
                const key = `${section.id}.${sub.id}`;
                const isOn = sections[key] !== false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border transition-colors ${
                      isOn
                        ? "bg-amber-100 border-amber-300 text-amber-800"
                        : "bg-white border-stone-200 text-stone-400 line-through"
                    }`}
                  >
                    {isOn ? <CheckSquare size={11} /> : <Square size={11} />}
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FullCurriculumPreview;