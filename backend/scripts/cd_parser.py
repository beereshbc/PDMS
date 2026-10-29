#!/usr/bin/env python3
"""
CD Document Parser – GM University 2024 + 2026 (Section-Scoped, High Accuracy)
Extracts structured data from a Course Document (CD) PDF and returns JSON.

Design principles
-----------------
1.  **Section slicing first, parsing second.**
    The document is first cut into named sections using robust marker regexes.
    Every extractor receives only its own slice — no bleed across sections.

2.  **Table-first, text-fallback.**
    Structured data (COs, Outcome Map, Assessment Weight, Teaching Plan,
    Attainment) is read from tables. Only when a table is missing does the
    parser fall back to text.

3.  **Schema-aware.**
    2024 (2.x / 3.x numbering) and 2026 (1.x / 2.x numbering) are both
    recognised by marker, not by a global boolean.

4.  **Non-destructive HTML generation.**
    Frontend tables (courseOutcomesHtml, outcomeMapHtml,
    assessmentWeightHtml, recordingMarks, settingTargets) are built from
    the same structured data used by the EditCD UI.
"""

from __future__ import annotations

import sys
import os
import json
import re
import traceback
from pathlib import Path

# ── Force UTF-8 stdout/stderr (Windows/cmd sometimes swallows emoji/unicode) ──
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# ── Bump recursion limit for pdfminer.six ──
import threading
try:
    threading.stack_size(64 * 1024 * 1024)
    sys.setrecursionlimit(20000)
except (ValueError, RuntimeError):
    pass

# ── Loud pdfplumber import ──
try:
    import pdfplumber
    _PDFPLUMBER_VER = getattr(pdfplumber, "__version__", "unknown")
except Exception as _imp_err:
    sys.stderr.write(
        f"FATAL: pdfplumber import failed: {_imp_err}\n"
        f"Python: {sys.version}\nExecutable: {sys.executable}\n"
        f"Trace:\n{traceback.format_exc()}\n"
    )
    print(json.dumps({
        "success": False,
        "message": (
            f"pdfplumber import failed: {_imp_err}. "
            f"Run: {sys.executable} -m pip install pdfplumber"
        ),
        "executable": sys.executable,
        "parsedData": [],
    }))
    sys.exit(1)


# ═════════════════════════════════════════════════════════════════════════════
# 1.  UTILITIES
# ═════════════════════════════════════════════════════════════════════════════

_WS_RE = re.compile(r'\s+')
_PAGE_NO_RE = re.compile(r'^\s*\d+\s*\|\s*Page\s*$|^\s*\d+/\d+\s*$|^\s*Page\s+\d+\s*$', re.I)


def clean_text(t) -> str:
    if t is None:
        return ""
    return _WS_RE.sub(' ', str(t)).strip()


def strip_page_noise(text: str) -> str:
    """Remove page headers/footers like '3|Page', '9|Page', 'Page 14'."""
    lines = []
    for ln in text.splitlines():
        if _PAGE_NO_RE.match(ln.strip()):
            continue
        lines.append(ln)
    return "\n".join(lines)


def safe_int(v, default=0) -> int:
    try:
        if v is None or str(v).strip() == "":
            return default
        m = re.search(r'-?\d+', str(v))
        return int(m.group()) if m else default
    except Exception:
        return default


def format_bullets_to_html(text: str) -> str:
    if not text:
        return ""
    text = clean_text(text)
    text = re.sub(r'\s*[•●◉○►▪]\s*', '<br/>&#8226; ', text)
    if text.startswith('<br/>'):
        text = text[5:]
    return text.strip()


def _dedupe_preserve(items):
    seen, out = set(), []
    for it in items:
        k = it.strip().lower()
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(it.strip())
    return out


def merge_wrapped_rows(rows):
    """Merge rows whose first cell is empty (wrapped continuation from PDF)."""
    merged = []
    for row in rows:
        cells = [clean_text(c) for c in row]
        if not any(cells):
            continue
        if not cells[0] and merged:
            for i in range(1, len(cells)):
                if not cells[i]:
                    continue
                if i < len(merged[-1]):
                    merged[-1][i] = (merged[-1][i] + " " + cells[i]).strip()
                else:
                    merged[-1].append(cells[i])
        else:
            merged.append(cells)
    return merged


# ═════════════════════════════════════════════════════════════════════════════
# 2.  SECTION MARKER REGISTRY  (2024 + 2026 aware)
# ═════════════════════════════════════════════════════════════════════════════

SECTION_MARKERS = {
    "course_details":     r'(?:^|\n)\s*1\.?\s+Course\s+details',
    "course_size":        r'(?:^|\n)\s*1\.1\s+Course\s+size',
    "overview":           r'(?:^|\n)\s*(?:1\.2\s+Course\s+Overview|2\.1\s+Course\s+Aims\s+and\s+Summary)',
    "objectives":         r'(?:^|\n)\s*(?:1\.3\s+Course\s+Objectives|2\.2\s+Course\s+Objectives)',
    "course_outcomes":    r'(?:^|\n)\s*(?:1\.4\s+Course\s+Outcomes|2\.3\s+Course\s+Outcomes)',
    "outcome_map":        r'(?:^|\n)\s*(?:1\.5\s+COs?\s+to\s+POs?|Outcome\s+Map)',
    "course_content":     r'(?:^|\n)\s*(?:1\.6\s+Course\s+Content|2\.4\s+Course\s+Content)',
    "resources":          r'(?:^|\n)\s*(?:1\.7\s+Course\s+Resources|2\.5\s+Course\s+Resources)',
    "teaching_plan":      r'(?:^|\n)\s*(?:2\.1\s+Lesson\s+Plan|3\.1\s+Lesson\s+Plan|Lesson\s+Plan)',
    "assessment_weight":  r'(?:^|\n)\s*(?:2\.2\s+Assessment\s+Weight|3\.2\s+Assessment\s+Weight)',
    "schedule_assess":    r'(?:^|\n)\s*2\.3\s+Schedule\s+of\s+Assessments',
    "grading":            r'(?:^|\n)\s*(?:2\.4\s+Passing\s+and\s+Grading|3\.4\s+Grading\s+Criterion|Grading\s+Criterion)',
    "attain_targets":     r'(?:^|\n)\s*2\.5\s+Setting\s+Attainment\s+Targets',
    "performance_rec":    r'(?:^|\n)\s*2\.6\s+Performance\s+Recording',
    "cab":                r'(?:^|\n)\s*2\.8\s+CAB\s+Meeting',
    "feedback":           r'(?:^|\n)\s*2\.10\s+Feedback',
    "assignment_details": r'(?:^|\n)\s*4\.1\s+Assignment\s+Details',
    "academic_integrity": r'(?:^|\n)\s*(?:4\.2\s+)?Academic\s+Integrity',
}

# Ordered list (must match document order)
SECTION_ORDER = [
    "course_details", "course_size", "overview", "objectives",
    "course_outcomes", "outcome_map", "course_content", "resources",
    "teaching_plan", "assessment_weight", "schedule_assess", "grading",
    "attain_targets", "performance_rec", "cab", "feedback",
    "assignment_details", "academic_integrity",
]

_SECTION_PATTERNS = {
    key: re.compile(pat, re.IGNORECASE | re.MULTILINE)
    for key, pat in SECTION_MARKERS.items()
}


def slice_document_sections(full_text: str) -> dict:
    """
    Cut full_text into {section_key: section_body}.

    A section body extends from its own marker to the next marker in
    SECTION_ORDER (or to end-of-document).
    """
    hits = []
    for key in SECTION_ORDER:
        pat = _SECTION_PATTERNS[key]
        for m in pat.finditer(full_text):
            hits.append((m.start(), key))
            break  # only the first occurrence of each marker

    hits.sort()
    if not hits:
        return {"_full": full_text}

    sections = {}
    for i, (start, key) in enumerate(hits):
        end = hits[i + 1][0] if i + 1 < len(hits) else len(full_text)
        body = full_text[start:end]
        # strip the marker line itself
        body = _SECTION_PATTERNS[key].sub('', body, count=1).strip()
        sections[key] = body

    sections["_full"] = full_text
    return sections


# ═════════════════════════════════════════════════════════════════════════════
# 3.  DATA MODEL
# ═════════════════════════════════════════════════════════════════════════════

DEFAULT_OUTCOME_HEADERS = [
    "CO\\PO",
    "PO1", "PO2", "PO3", "PO4", "PO5", "PO6",
    "PO7", "PO8", "PO9", "PO10", "PO11", "PO12",
    "PSO1", "PSO2", "PSO3",
]


def make_default_assessment_weight():
    return [
        {"co": f"CO{i}", "q1": 0, "q2": 0, "q3": 0,
         "t1": 0, "t2": 0, "t3": 0, "a1": 0, "a2": 0,
         "see": 0, "cie": 0, "total": 0}
        for i in range(1, 7)
    ]


def make_empty_cd():
    return {
        "courseCode": "", "courseTitle": "", "programCode": "",
        "programTitle": "", "schoolCode": "", "schoolTitle": "",
        "departmentCode": "", "department": "", "facultyCode": "",
        "facultyTitle": "", "offeringDepartment": "", "facultyMember": "",
        "semesterDuration": "", "totalHours": 0,
        "aimsSummary": "", "objectives": "", "courseContent": "",
        "gradingCriterion": "",
        "credits": {"L": 0, "T": 0, "P": 0, "total": 0},
        "courseOutcomes": [],
        "courseOutcomesHtml": "",
        "outcomeMap": {"raw": "", "matrix": []},
        "outcomeMapHtml": "",
        "assessmentWeight": make_default_assessment_weight(),
        "assessmentWeightHtml": "",
        "resources": {"textBooks": [], "references": [], "otherResources": []},
        "teaching": [],
        "attainmentCalculations": {"recordingMarks": "", "settingTargets": ""},
        "otherDetails": {"assignmentDetails": "", "academicIntegrity": ""},
        "assessmentMeta": {
            "quizWeight": 0, "assignmentWeight": 0, "pblWeight": 0,
            "term1Weight": 0, "term2Weight": 0, "totalWeight": 0,
        },
        "coDetails": [],
        "cabFeedback": [],
    }


# ═════════════════════════════════════════════════════════════════════════════
# 4.  HTML BUILDERS  (unchanged interface, hardened edge cases)
# ═════════════════════════════════════════════════════════════════════════════

_TBL = 'style="border-collapse:collapse;width:100%;font-size:13px;font-family:Arial,sans-serif;margin-bottom:10px"'
_TH  = 'style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;text-align:center;font-weight:bold;vertical-align:middle"'
_TH2 = 'style="border:1px solid #b0b8cc;padding:6px 8px;background:#d1d5db;text-align:center;font-weight:bold;font-size:12px;vertical-align:middle"'
_TD  = 'style="border:1px solid #b0b8cc;padding:8px 10px;text-align:center;vertical-align:middle"'
_TDL = 'style="border:1px solid #b0b8cc;padding:8px 12px;text-align:left;vertical-align:top"'
_TDH = 'style="border:1px solid #b0b8cc;padding:8px 10px;text-align:center;font-weight:bold;background:#f1f5f9;vertical-align:middle"'
_CAP = 'style="caption-side:top;font-weight:bold;font-size:14px;padding:9px;background:#e3e8f7;border:1px solid #b0b8cc;text-align:center"'


def build_course_outcomes_html(cos, include_details=False):
    rows = cos if cos else [{"code": f"CO{i}", "description": ""} for i in range(1, 7)]

    if include_details:
        html = f'<table {_TBL}><thead><tr>'
        html += f'<th {_TH2} style="width:60px">COs</th>'
        html += f'<th {_TH2} style="text-align:left">Course Outcomes</th>'
        html += f'<th {_TH2} style="text-align:left">Real Life Application</th>'
        html += f'<th {_TH2} style="width:110px">Bloom\'s Level</th>'
        html += '</tr></thead><tbody>'
        for co in rows:
            html += (
                f'<tr>'
                f'<td {_TDH}>{clean_text(co.get("code",""))}</td>'
                f'<td {_TDL}>{clean_text(co.get("description",""))}</td>'
                f'<td {_TDL}>{clean_text(co.get("application",""))}</td>'
                f'<td {_TD}>{clean_text(co.get("bloom",""))}</td>'
                f'</tr>'
            )
        return html + '</tbody></table>'

    html = f'<table {_TBL}><thead><tr>'
    html += f'<th {_TH} style="width:110px">Course Outcome</th>'
    html += f'<th {_TH} style="text-align:left">Description</th>'
    html += '</tr></thead><tbody>'
    for co in rows:
        html += (
            f'<tr>'
            f'<td {_TDH}>{clean_text(co.get("code",""))}</td>'
            f'<td {_TDL}>{clean_text(co.get("description",""))}</td>'
            f'</tr>'
        )
    return html + '</tbody></table>'


def build_outcome_map_html(matrix):
    if not matrix or len(matrix) < 2:
        matrix = [DEFAULT_OUTCOME_HEADERS,
                  *[[f"CO{i}"] + [""] * 15 for i in range(1, 7)]]
    html = f'<table {_TBL}><thead><tr>'
    for h in matrix[0]:
        html += f'<th {_TH2}>{clean_text(h)}</th>'
    html += '</tr></thead><tbody>'
    for row in matrix[1:]:
        html += '<tr>'
        for ci, cell in enumerate(row):
            td = _TDH if ci == 0 else _TD
            html += f'<td {td}>{clean_text(cell)}</td>'
        html += '</tr>'
    return html + '</tbody></table>'


def build_assessment_weight_html(aw_list, meta=None):
    if meta and (meta.get("quizWeight") or meta.get("assignmentWeight")
                 or meta.get("pblWeight") or meta.get("term1Weight")
                 or meta.get("term2Weight")):
        return _build_assessment_weight_2026_html(aw_list, meta)
    return _build_assessment_weight_2024_html(aw_list)


def _build_assessment_weight_2024_html(aw_list):
    if not aw_list:
        aw_list = make_default_assessment_weight()

    def _s(k):
        return sum((r.get(k) or 0) for r in aw_list)

    sQ = [_s("q1"), _s("q2"), _s("q3")]
    sT = [_s("t1"), _s("t2"), _s("t3")]
    sA = [_s("a1"), _s("a2")]
    sCIE, sSEE = _s("cie"), _s("see")

    if sum(sQ) == 0: sQ = [5, 4, 6]
    if sum(sT) == 0: sT = [7, 8, 10]
    if sum(sA) == 0: sA = [10, 10]
    if sCIE == 0: sCIE = 60
    if sSEE == 0: sSEE = 40

    html = f'<table {_TBL}><thead>'
    html += (
        '<tr>'
        f'<th rowspan="2" {_TH}>Cos with<br/>weightage</th>'
        f'<th colspan="3" {_TH}>Quiz = 15 Marks</th>'
        f'<th colspan="3" {_TH}>Test = 25 Marks</th>'
        f'<th colspan="2" {_TH}>Assignment = 20 Marks</th>'
        f'<th rowspan="2" {_TH}>CIE<br/>=60</th>'
        f'<th rowspan="2" {_TH}>SEE<br/>=40</th>'
        '</tr><tr>'
        f'<th {_TH2}>Q1<br/>=5</th>'
        f'<th {_TH2}>Q2<br/>=4</th>'
        f'<th {_TH2}>Q3<br/>=6</th>'
        f'<th {_TH2}>T1<br/>=7</th>'
        f'<th {_TH2}>T2<br/>=8</th>'
        f'<th {_TH2}>T3<br/>=10</th>'
        f'<th {_TH2}>A1 = 10</th>'
        f'<th {_TH2}>A2 = 10</th>'
        '</tr></thead><tbody>'
    )
    for row in aw_list:
        v = lambda k: "" if not row.get(k) else row.get(k)
        html += (
            '<tr>'
            f'<td {_TDH}>{row.get("co","")}</td>'
            f'<td {_TD}>{v("q1")}</td><td {_TD}>{v("q2")}</td><td {_TD}>{v("q3")}</td>'
            f'<td {_TD}>{v("t1")}</td><td {_TD}>{v("t2")}</td><td {_TD}>{v("t3")}</td>'
            f'<td {_TD}>{v("a1")}</td><td {_TD}>{v("a2")}</td>'
            f'<td {_TDH}>{v("cie")}</td><td {_TD}>{v("see")}</td>'
            '</tr>'
        )
    html += (
        '</tbody><tfoot><tr>'
        f'<td {_TDH}></td>'
        + "".join(f'<td {_TDH}>{x}</td>' for x in sQ + sT + sA + [sCIE, sSEE])
        + '</tr></tfoot></table>'
    )
    return html


def _build_assessment_weight_2026_html(aw_list, meta):
    if not aw_list:
        aw_list = [{"co": f"CO{i}", "total": 0} for i in range(1, 7)]
    quiz = meta.get("quizWeight", 0) or 0
    assign = meta.get("assignmentWeight", 0) or 0
    pbl = meta.get("pblWeight", 0) or 0
    t1 = meta.get("term1Weight", 0) or 0
    t2 = meta.get("term2Weight", 0) or 0
    total_w = meta.get("totalWeight", 0) or (quiz + assign + pbl + t1 + t2)

    html = (
        f'<table {_TBL}><thead><tr>'
        f'<th {_TH}>COs / Weights</th>'
        f'<th {_TH}>Quiz<br/>({quiz})</th>'
        f'<th {_TH}>Assignment /<br/>Home work ({assign})</th>'
        f'<th {_TH}>PBL<br/>({pbl})</th>'
        f'<th {_TH}>Term-1 Exam<br/>({t1})</th>'
        f'<th {_TH}>Term-2 Exam<br/>({t2})</th>'
        f'<th {_TH}>Total<br/>({total_w})</th>'
        '</tr></thead><tbody>'
    )
    for row in aw_list:
        v = lambda k: "" if not row.get(k) else row.get(k)
        html += (
            '<tr>'
            f'<td {_TDH}>{row.get("co","")}</td>'
            f'<td {_TD}>{v("quiz") or v("q1")}</td>'
            f'<td {_TD}>{v("assignment") or v("a1")}</td>'
            f'<td {_TD}>{v("pbl")}</td>'
            f'<td {_TD}>{v("term1") or v("t1")}</td>'
            f'<td {_TD}>{v("term2") or v("t2")}</td>'
            f'<td {_TDH}>{v("total")}</td>'
            '</tr>'
        )
    html += (
        '</tbody><tfoot><tr>'
        f'<td {_TDH}>Total</td>'
        f'<td {_TDH}>{quiz}</td><td {_TDH}>{assign}</td><td {_TDH}>{pbl}</td>'
        f'<td {_TDH}>{t1}</td><td {_TDH}>{t2}</td><td {_TDH}>{total_w}</td>'
        '</tr></tfoot></table>'
    )
    return html


def build_recording_marks_html(rows):
    """Extract a performance-recording table into HTML."""
    if not rows:
        return _default_recording_marks_html()
    merged = merge_wrapped_rows(rows)

    # The header row is the one containing 'S. No' / 'USN' / 'Marks'
    header_row = None
    data_rows = []
    for i, r in enumerate(merged):
        joined = " ".join(r).lower()
        if ("s. no" in joined or "s.no" in joined or "usn" in joined
                or "marks scored" in joined or "marks scored" in joined):
            header_row = r
            data_rows = merged[i + 1:]
            break
    if not header_row:
        header_row = ["S. No.", "USN", "Student Name", "Quiz (15%)",
                      "Test (25%)", "Assignment 20%", "SEE 40%",
                      "Marks Scored", "Grade obtained"]

    col_count = len(header_row)
    html = f'<table {_TBL}><thead><tr>'
    html += "".join(f'<th {_TH}>{clean_text(h)}</th>' for h in header_row)
    html += '</tr></thead><tbody>'

    if data_rows:
        for row in data_rows:
            padded = row + [""] * max(0, col_count - len(row))
            html += "<tr>" + "".join(
                f'<td {_TD}>{clean_text(c)}</td>' for c in padded[:col_count]
            ) + "</tr>"
    else:
        for _ in range(5):
            html += f'<tr><td {_TD}>&nbsp;</td>' + "".join(
                f'<td {_TD}>&nbsp;</td>' for _ in range(col_count - 1)
            ) + "</tr>"

    html += '</tbody></table>'
    return html


def _default_recording_marks_html():
    headers = ["S. No.", "USN", "Student Name", "Quiz (15%)",
               "Test (25%)", "Assignment 20%", "SEE 40%",
               "Marks Scored", "Grade obtained"]
    html = f'<table {_TBL}><thead><tr>'
    html += "".join(f'<th {_TH}>{h}</th>' for h in headers)
    html += '</tr></thead><tbody>'
    for _ in range(5):
        html += f'<tr><td {_TD}>&nbsp;</td>' + "".join(
            f'<td {_TD}>&nbsp;</td>' for _ in range(len(headers) - 1)
        ) + "</tr>"
    html += '</tbody></table>'
    return html


def build_attainment_targets_html(rows):
    if not rows:
        return _default_attainment_targets_html()
    merged = merge_wrapped_rows(rows)
    joined_all = " ".join(" ".join(r) for r in merged).lower()

    is_2026_multi = ("a grade" in joined_all and
                     ("b+" in joined_all or "b grade" in joined_all))
    if is_2026_multi:
        return _build_attainment_targets_2026_html(merged)

    html = (
        f'<table {_TBL}>'
        f'<caption {_CAP}>Attainment of Course Outcomes-COs</caption>'
        f'<thead><tr>'
        f'<th {_TH} style="width:78%">Outcomes- Targeted</th>'
        f'<th {_TH} style="width:22%">Targeted Attainment Level</th>'
        f'</tr></thead><tbody>'
    )
    for row in merged:
        if not any(row):
            continue
        txt, lvl = "", "1"
        if len(row) >= 2:
            txt, lvl = row[0], row[1]
        elif len(row) == 1:
            txt = row[0]
        if not txt:
            continue
        html += f'<tr><td {_TDL}>{clean_text(txt)}</td><td {_TD}><strong>{clean_text(lvl)}</strong></td></tr>'
    return html + '</tbody></table>'


def _build_attainment_targets_2026_html(merged):
    """
    2026 multi-level layout. Each CO has 3 sub-rows.
    Sample rows after merging look like:
        ['CO1', '60% of Students will score A grade and above', '3']
        ['',    '60% of students will score B+ grade and Above', '2']
        ['',    '60% of students will score B grade and above', '1']
    We recover the CO number from a regex over the first column, and fall
    back to incrementing when the PDF dropped the merge.
    """
    html = (
        f'<table {_TBL}>'
        f'<caption {_CAP}>Attainment of Course Outcomes-COs</caption>'
        f'<thead><tr>'
        f'<th {_TH} style="width:70px">COs</th>'
        f'<th {_TH} style="text-align:left">Outcomes - Targeted</th>'
        f'<th {_TH} style="width:120px">Attainment Value</th>'
        f'</tr></thead><tbody>'
    )

    # Group by CO marker
    groups = {}   # co -> list of (statement, value)
    current_co = None
    for row in merged:
        if not any(row):
            continue
        first = row[0]
        co_match = re.search(r'CO\s*(\d+)', first, re.I) if first else None
        if co_match:
            current_co = f"CO{int(co_match.group(1))}"
            rest = row[1:]
        else:
            rest = row
        if not current_co:
            continue

        # Find the LAST standalone integer in the row (1/2/3 = attainment value)
        # and treat the preceding string as the statement.
        statement = ""
        value = ""
        for cell in reversed(rest):
            cell_s = clean_text(cell)
            if not cell_s:
                continue
            m = re.search(r'\b([123])\s*$', cell_s)
            if m and not value:
                value = m.group(1)
                statement = cell_s[:m.start()].strip()
                break
            statement = cell_s
            break
        # If still empty, pull % phrases
        if not statement:
            joined = " ".join(rest)
            m = re.search(r'(\d+%\s+of\s+[^0-9]{3,}?)(\d)\s*$', joined, re.I)
            if m:
                statement, value = m.group(1).strip(), m.group(2)
        groups.setdefault(current_co, []).append(
            (clean_text(statement), value or "1"))

    # If grouping failed, fall back to sequential 1..6 defaulting to the 2026 sample
    if not groups:
        for i in range(1, 7):
            groups[f"CO{i}"] = [
                ("60% of Students will score A grade and above", "3"),
                ("60% of students will score B+ grade and Above", "2"),
                ("60% of students will score B grade and above", "1"),
            ]

    for co, items in groups.items():
        first = True
        for statement, value in items:
            if first:
                html += (
                    f'<tr>'
                    f'<td {_TDH} rowspan="{len(items)}">{co}</td>'
                    f'<td {_TDL}>{statement}</td>'
                    f'<td {_TD}><strong>{value}</strong></td>'
                    f'</tr>'
                )
                first = False
            else:
                html += (
                    f'<tr>'
                    f'<td {_TDL}>{statement}</td>'
                    f'<td {_TD}><strong>{value}</strong></td>'
                    f'</tr>'
                )
    return html + '</tbody></table>'


def _default_attainment_targets_html():
    sample = [
        ("60% of Students will score A grade and above", "3"),
        ("60% of students will score B+ grade and Above", "2"),
        ("60% of students will score B grade and above", "1"),
    ]
    html = (
        f'<table {_TBL}>'
        f'<caption {_CAP}>Attainment of Course Outcomes-COs</caption>'
        f'<thead><tr>'
        f'<th {_TH} style="width:70px">COs</th>'
        f'<th {_TH} style="text-align:left">Outcomes - Targeted</th>'
        f'<th {_TH} style="width:120px">Attainment Value</th>'
        f'</tr></thead><tbody>'
    )
    for i in range(1, 7):
        for j, (stmt, val) in enumerate(sample):
            if j == 0:
                html += (
                    f'<tr><td {_TDH} rowspan="3">CO{i}</td>'
                    f'<td {_TDL}>{stmt}</td><td {_TD}><strong>{val}</strong></td></tr>'
                )
            else:
                html += (
                    f'<tr><td {_TDL}>{stmt}</td>'
                    f'<td {_TD}><strong>{val}</strong></td></tr>'
                )
    return html + '</tbody></table>'


# ═════════════════════════════════════════════════════════════════════════════
# 5.  COURSE DETAILS (metadata)  — combined 2026 + classic 2024
# ═════════════════════════════════════════════════════════════════════════════

FIELD_ALIASES = {
    "courseCode": ["course code"],
    "courseTitle": ["course title"],
    "programCode": ["program code", "program id"],
    "programTitle": ["program", "program title", "program name"],
    "schoolCode": ["school code"],
    "schoolTitle": ["school"],
    "departmentCode": ["department code"],
    "department": ["department offering the program", "department"],
    "offeringDepartment": ["department offering the course", "offering department"],
    "facultyCode": ["faculty code"],
    "facultyTitle": ["faculty"],
    "facultyMember": ["faculty name", "faculty member"],
    "semesterDuration": ["semester", "academic year", "semester duration"],
}


def parse_course_details(section_text: str, tables: list, data: dict) -> None:
    """
    Best-effort 2026 combined-table parse + 2024 two-column fallback.
    Works on the raw text too since PDF label/value pairs often survive
    text extraction but not table extraction.
    """
    pairs = {}

    # ── 1) Combined-table path ──
    for tbl in tables:
        flat = [clean_text(c) for row in tbl for c in row if c is not None]
        # sliding window: label followed by value
        i = 0
        while i < len(flat) - 1:
            label = flat[i].lower().strip()
            value = flat[i + 1]
            if _is_known_label(label) and value:
                pairs.setdefault(label, value)
                i += 2
            else:
                i += 1

    # ── 2) Text-based "LabelValue" heuristic (2026 docx → PDF often loses
    #    the table but keeps label/value run together like "Course CodeUE26CS1102")
    for field, aliases in FIELD_ALIASES.items():
        if field in data and data[field]:
            continue
        for alias in aliases:
            # "Label Value" with optional colon
            pat = re.compile(
                r'\b' + re.escape(alias) + r'\s*[:：]?\s*([A-Z0-9][^\n]{1,120})',
                re.IGNORECASE,
            )
            m = pat.search(section_text)
            if m:
                val = m.group(1).strip()
                # Cut at the next known label
                next_label_re = re.compile(
                    r'\b(' + '|'.join(re.escape(a) for a in
                                     ["Course Code", "Course Title", "Program",
                                      "Department", "Semester", "Credits",
                                      "Contact Hours", "Academic Year",
                                      "Faculty Name", "School", "Faculty",
                                      "Prerequisites", "Nature of Course"])
                    + r')\b', re.IGNORECASE)
                nl = next_label_re.search(val)
                if nl:
                    val = val[:nl.start()].strip()
                if val:
                    data[field] = val
                    break

    # ── 3) Merge pairs (prefer shorter, more specific aliases) ──
    for field, aliases in FIELD_ALIASES.items():
        if data.get(field):
            continue
        for alias in aliases:
            for pk, pv in pairs.items():
                if pk == alias or pk.startswith(alias + " "):
                    data[field] = pv
                    break
            if data.get(field):
                break

    # ── 4) Cleanup ──
    data["courseCode"] = re.sub(r'\s+', '', data.get("courseCode", ""))
    data["courseTitle"] = re.sub(r'\s+', ' ', data.get("courseTitle", "")).strip()


def _is_known_label(s: str) -> bool:
    s = s.strip().lower()
    if not s or len(s) > 70:
        return False
    known = (
        "course code", "course title", "program", "program code",
        "program title", "department", "department code", "department offering",
        "offering department", "school", "school code", "faculty", "faculty code",
        "faculty name", "faculty member", "semester", "academic year",
        "semester duration", "credits", "contact hours", "hours/week",
        "prerequisites", "nature of course",
    )
    return any(s == k or s.startswith(k) for k in known)


def parse_course_size(tables: list, data: dict) -> None:
    """Parse the Credits|L|T|P|Hours/Week table."""
    for tbl in tables:
        flat = [clean_text(c) for row in tbl for c in row if c is not None]
        # header line: something like 'Credits L T P Hours/Week'
        joined = " ".join(flat).lower()
        if "hours/week" in joined or ("credits" in joined and " l " in joined):
            # find first row after header containing only numbers
            for row in tbl:
                clean = [clean_text(c) for c in row]
                nums = [safe_int(c) for c in clean if re.fullmatch(r'\d+', c or "")]
                if len(nums) >= 5:
                    # Format: Credits L T P Hours/Week
                    data["credits"] = {
                        "total": nums[0], "L": nums[1],
                        "T": nums[2], "P": nums[3],
                    }
                    data["totalHours"] = nums[4] if len(nums) > 4 else 0
                    return
            # Alternate layout: row contains 4,3,0,2,5 in any order after "Credits"
            m = re.search(r'credits?\s+L\s+T\s+P\s+hours?/week\s+([\d ]+)',
                          joined)
            if m:
                nums = [safe_int(x) for x in m.group(1).split()]
                if len(nums) >= 5:
                    data["credits"] = {
                        "total": nums[0], "L": nums[1],
                        "T": nums[2], "P": nums[3],
                    }
                    data["totalHours"] = nums[4]
                    return


# ═════════════════════════════════════════════════════════════════════════════
# 6.  COURSE OUTCOMES  (2024 2-col and 2026 4-col)
# ═════════════════════════════════════════════════════════════════════════════

BLOOM_KEYWORDS = (
    "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
)


def parse_course_outcomes(section_text: str, tables: list, data: dict) -> None:
    """
    2026 CO table:
        COs | Course Outcomes | Real Life Application | Bloom's Level
    Layout in extracted PDF may lose column boundaries, so we combine:
      1. Table-based parsing when cells are properly delimited.
      2. Regex chunking on 'CO<number>' markers for text-only fallback.
    """
    cos = []

    # ── Table path ──
    for tbl in tables:
        flat = [clean_text(c) for row in tbl for c in row if c is not None]
        joined = " ".join(flat).lower()
        if "course outcomes" not in joined and "bloom" not in joined:
            continue

        header = [clean_text(c).lower() for c in tbl[0]]
        # map column indexes
        idx = {}
        for i, h in enumerate(header):
            if "co" in h and ("s" in h or "s." in h):
                idx["co"] = i
            elif "outcome" in h and "course" in h:
                idx["desc"] = i
            elif "application" in h or "real life" in h:
                idx["app"] = i
            elif "bloom" in h:
                idx["bloom"] = i
        if "co" not in idx:
            continue

        for row in tbl[1:]:
            clean = [clean_text(c) for c in row]
            code = clean[idx["co"]] if idx["co"] < len(clean) else ""
            m = re.match(r'CO\s*(\d+)', code, re.I)
            if not m:
                # Try any cell with CO marker
                for cell in clean:
                    m2 = re.search(r'\bCO\s*(\d+)\b', cell, re.I)
                    if m2:
                        m = m2
                        break
            if not m:
                continue
            code = f"CO{int(m.group(1))}"
            desc = clean[idx["desc"]] if "desc" in idx and idx["desc"] < len(clean) else ""
            app = clean[idx["app"]] if "app" in idx and idx["app"] < len(clean) else ""
            bloom = clean[idx["bloom"]] if "bloom" in idx and idx["bloom"] < len(clean) else ""
            cos.append({"code": code, "description": desc,
                        "application": app, "bloom": bloom})
        if cos:
            break

    # ── Text fallback ──
    if not cos:
        cos = _chunk_cos_from_text(section_text)

    # ── Dedup by code (keep first occurrence) ──
    seen, final = set(), []
    for co in cos:
        if co["code"] in seen:
            continue
        seen.add(co["code"])
        # Drop the intro sentence glued to description ("After undergoing ...")
        co["description"] = re.sub(
            r'^(?:After\s+undergoing[^.]*\.\s*)', '', co["description"],
            flags=re.I).strip()
        final.append(co)

    # ── 2024 2-column fallback if still empty ──
    if not final:
        for i in range(1, 7):
            final.append({"code": f"CO{i}", "description": "",
                          "application": "", "bloom": ""})

    data["courseOutcomes"] = final
    data["coDetails"] = final


def _chunk_cos_from_text(text: str):
    """
    Split text on 'CO<n>' markers and extract four fields per chunk.
    Handles both:
        2024: 'CO1 <description>'
        2026: 'CO1 <description> <application> <BloomKeyword>'
    """
    # Normalise whitespace; make sure 'CO1' etc. appear at boundaries
    text = re.sub(r'\s+', ' ', text).strip()
    # Drop the leading sentence before the first CO marker
    first = re.search(r'\bCO\s*1\b', text)
    if first:
        text = text[first.start():]

    chunks = re.split(r'(?=\bCO\s*\d+\b)', text)
    out = []
    bloom_re = re.compile(r'\b(' + "|".join(BLOOM_KEYWORDS) + r')\b', re.I)

    for ch in chunks:
        m = re.match(r'CO\s*(\d+)\s*(.*)', ch, re.I)
        if not m:
            continue
        code = f"CO{int(m.group(1))}"
        body = m.group(2).strip()
        # In 2026, body ends with <application> <Bloom>
        bloom_match = None
        # Find the LAST Bloom keyword in the body
        for bm in bloom_re.finditer(body):
            bloom_match = bm
        desc, app, bloom = body, "", ""
        if bloom_match:
            bloom = bloom_match.group(1).title()
            before = body[:bloom_match.start()].strip()
            # Before = <description> <application>
            # Heuristic: description typically ends with '.' or is first sentence
            parts = re.split(r'(?<=[.!?])\s+', before, maxsplit=1)
            if len(parts) == 2:
                desc, app = parts[0].strip(), parts[1].strip()
            else:
                desc = before
        desc = re.sub(r'\s+', ' ', desc).strip(" .;:")
        app = re.sub(r'\s+', ' ', app).strip(" .;:")
        out.append({"code": code, "description": desc,
                    "application": app, "bloom": bloom})
    return out


# ═════════════════════════════════════════════════════════════════════════════
# 7.  OUTCOME MAP (CO x PO/PSO)
# ═════════════════════════════════════════════════════════════════════════════

def parse_outcome_map(section_text: str, tables: list, data: dict) -> None:
    """
    Extract the COxPO/PSO matrix.  Handles:
      - space in headers ("PSO 1", "PO 1")
      - collapsed rows like "CO132--1------121-"
    """
    matrix = []

    # ── Table path ──
    for tbl in tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if not (("co" in joined and "po" in joined)):
            continue

        raw = []
        for row in tbl:
            raw.append([clean_text(c) for c in row])

        # Detect header
        header_idx = None
        for i, r in enumerate(raw):
            j = " ".join(r).upper()
            if ("CO" in j and ("PO1" in j or "PO 1" in j or "PO" in j)):
                header_idx = i
                break
        if header_idx is None:
            continue

        header = raw[header_idx]
        # Normalise headers: "PO 1"->"PO1", "PSO 1"->"PSO1", first cell ->"CO\PO"
        norm_header = []
        po_ct, pso_ct = 1, 1
        for i, h in enumerate(header):
            if i == 0:
                norm_header.append("CO\\PO")
                continue
            hu = h.upper().replace(" ", "")
            if hu in ("PO", "P0") or not hu:
                norm_header.append(f"PO{po_ct}"); po_ct += 1
            elif hu.startswith("PO") and hu[2:].isdigit():
                norm_header.append(f"PO{int(hu[2:])}"); po_ct = int(hu[2:]) + 1
            elif hu in ("PSO", "PS"):
                norm_header.append(f"PSO{pso_ct}"); pso_ct += 1
            elif hu.startswith("PSO") and hu[3:].isdigit():
                norm_header.append(f"PSO{int(hu[3:])}"); pso_ct = int(hu[3:]) + 1
            else:
                norm_header.append(h)

        matrix = [norm_header]

        # Data rows: each row must start with a CO marker
        for r in raw[header_idx + 1:]:
            joined_r = " ".join(r)
            m = re.search(r'\bCO\s*(\d+)\b', joined_r, re.I)
            if not m:
                continue
            co_code = f"CO{int(m.group(1))}"

            # If the PDF collapsed the entire row into one cell, expand:
            # e.g. "CO132--1------121-"
            #   -> cells: ['CO1', '3', '2', '-', '-', '1', '-', '-', '-', '-', '-', '-', '1', '2', '1', '-']
            if len([c for c in r if c]) <= 2:
                joined = re.sub(r'\s+', '', joined_r)
                payload = joined[3:]  # strip 'CO1'
                # split into 1-char cells; multi-digit PO values are rare
                expanded = [co_code] + list(payload)
                # Pad/truncate to header length
                while len(expanded) < len(norm_header):
                    expanded.append("")
                expanded = expanded[: len(norm_header)]
                matrix.append(expanded)
                continue

            row_cells = [co_code] + [clean_text(c) for c in r if c]
            # Skip the first cell if it already contains CO code
            if row_cells[1:2] and re.match(r'CO\d+', row_cells[1], re.I):
                row_cells = row_cells[1:]
            while len(row_cells) < len(norm_header):
                row_cells.append("")
            matrix.append(row_cells[: len(norm_header)])

        if len(matrix) >= 2:
            break

    # ── Text fallback ──
    if len(matrix) < 2:
        matrix = _parse_outcome_map_from_text(section_text)

    if len(matrix) < 2:
        matrix = [DEFAULT_OUTCOME_HEADERS,
                  *[[f"CO{i}"] + [""] * 15 for i in range(1, 7)]]

    data["outcomeMap"]["matrix"] = matrix
    data["outcomeMap"]["raw"] = "\n".join("\t".join(r) for r in matrix)


def _parse_outcome_map_from_text(text: str):
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    header, rows = None, []
    for ln in lines:
        if re.search(r'\bPO\s*1\b', ln, re.I) and "CO" in ln.upper():
            header = re.split(r'\s+', ln)
            continue
        if re.match(r'^CO\s*\d+', ln, re.I):
            rows.append(re.split(r'\s+', ln))
    if not header or not rows:
        return []
    # Normalise header spacing "PSO 1" -> "PSO1"
    norm = []
    for i, h in enumerate(header):
        if i == 0:
            norm.append("CO\\PO")
        else:
            norm.append(h.replace(" ", ""))
    max_len = max(len(r) for r in [norm] + rows)
    for r in [norm] + rows:
        while len(r) < max_len:
            r.append("")
    return [norm] + rows


# ═════════════════════════════════════════════════════════════════════════════
# 8.  ASSESSMENT WEIGHT DISTRIBUTION
# ═════════════════════════════════════════════════════════════════════════════

def parse_assessment_weight(section_text: str, tables: list, data: dict) -> None:
    """
    2026 aggregated:
        Quiz | Assignment/Home work | PBL | Term-1 Exam | Term-2 Exam | Total
        10   | 20                    | 20  | 25           | 25           | 100
        CO1  | 10                    | 10  |              |              | 10
    2024 detailed:
        Quiz(Q1 Q2 Q3) | Test(T1 T2 T3) | Assignment(A1 A2) | CIE | SEE | Total
    """
    joined_all = " ".join(clean_text(c) for t in tables for row in t for c in row).lower()
    is_2026 = "pbl" in joined_all or "term-1 exam" in joined_all or "term-2 exam" in joined_all

    if is_2026:
        _parse_aw_2026(section_text, tables, data)
    else:
        _parse_aw_2024(tables, data)


def _parse_aw_2026(section_text: str, tables: list, data: dict) -> None:
    """Extract 2026 aggregated Assessment Weight table."""
    # Column weights: [quiz, assign, pbl, t1, t2, total]
    weights = [10, 20, 20, 25, 25, 100]
    rows_by_co = {}   # co -> list of ints

    for tbl in tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if "quiz" not in joined or "total" not in joined:
            continue

        for row in tbl:
            clean = [clean_text(c) for c in row]

            # Weight row: 10 20 20 25 25 100 (may be split across cells)
            joined_r = " ".join(clean)
            nums = [int(n) for n in re.findall(r'\b\d+\b', joined_r)]

            if re.match(r'^(\d+\s*){6}$', joined_r.strip()):
                weights = nums[:6]
                data["assessmentMeta"] = {
                    "quizWeight": weights[0], "assignmentWeight": weights[1],
                    "pblWeight": weights[2], "term1Weight": weights[3],
                    "term2Weight": weights[4], "totalWeight": weights[5],
                }
                continue

            # CO row: "CO1 10 10" or "CO11010" (collapsed)
            joined_nospace = re.sub(r'\s+', '', joined_r)
            co_match = re.search(r'CO(\d+)', joined_nospace, re.I)
            if not co_match:
                continue
            co = f"CO{int(co_match.group(1))}"
            payload = joined_nospace[co_match.end():]

            # Split payload into the 6 expected numbers, but PDF may have
            # dropped empty cells entirely, so we must be smart:
            # Each expected column weight gives max digits. Fall back to
            # splitting on the boundaries suggested by the weights.
            digits = re.findall(r'\d+', payload)
            rows_by_co[co] = digits

    # If table extraction failed, try text
    if not rows_by_co:
        rows_by_co = _parse_aw_2026_from_text(section_text)

    # Fill the assessmentWeight rows
    for i in range(1, 7):
        co = f"CO{i}"
        vals = rows_by_co.get(co, [])
        # Map: [quiz, assign, pbl, t1, t2, total]
        padded = (vals + [0, 0, 0, 0, 0, 0])[:6]
        quiz, assign, pbl, t1, t2, total = [safe_int(x) for x in padded]
        total = total or (quiz + assign + pbl + t1 + t2)
        data["assessmentWeight"][i - 1].update({
            "q1": quiz, "a1": assign, "pbl": pbl,
            "t1": t1, "t2": t2, "t3": 0,
            "q2": 0, "q3": 0, "a2": 0,
            "see": 0,
            "cie": quiz + assign + pbl + t1 + t2,
            "total": total,
            "quiz": quiz, "assignment": assign,
            "term1": t1, "term2": t2,
        })


def _parse_aw_2026_from_text(text: str) -> dict:
    rows = {}
    for ln in text.splitlines():
        m = re.search(r'\bCO\s*(\d+)\b(.*)$', ln.strip(), re.I)
        if not m:
            continue
        co = f"CO{int(m.group(1))}"
        nums = re.findall(r'\d+', m.group(2))
        rows[co] = nums
    return rows


def _parse_aw_2024(tables: list, data: dict) -> None:
    """2024 detailed 11-col table."""
    for tbl in tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if "quiz" not in joined or "cie" not in joined:
            continue
        for row in tbl:
            clean = [clean_text(c) for c in row]
            joined_r = " ".join(clean)
            m = re.match(r'CO\s*(\d+)', joined_r, re.I)
            if not m:
                continue
            co = f"CO{int(m.group(1))}"
            nums = [int(n) for n in re.findall(r'\d+', joined_r[len(m.group(0)):])]
            target = next((r for r in data["assessmentWeight"] if r["co"] == co), None)
            if not target:
                continue
            if len(nums) >= 11:
                target.update(dict(zip(
                    ["q1", "q2", "q3", "t1", "t2", "t3", "a1", "a2", "see", "cie", "total"],
                    nums[:11])))
            elif len(nums) >= 5:
                # quiz_total, test_total, assign_total, see, total
                q, t, a, see, tot = nums[:5]
                cie = q + t + a
                target.update({"q1": q, "t1": t, "a1": a,
                               "see": see, "cie": cie,
                               "total": tot if tot else cie + see})
            elif nums:
                target.update({"total": nums[0]})


# ═════════════════════════════════════════════════════════════════════════════
# 9.  TEACHING SCHEDULE
# ═════════════════════════════════════════════════════════════════════════════

def parse_teaching(section_text: str, tables: list, data: dict) -> None:
    """
    2026 lesson plan:
        Class No. | Unit No. | Topic Title | Teaching Focus | Activity | CO
    """
    rows_out = []

    for tbl in tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if not ("class" in joined and ("topic" in joined or "activity" in joined)):
            continue

        # Detect column layout from header
        header = [clean_text(c).lower() for c in tbl[0]]
        idx = {
            "class": next((i for i, h in enumerate(header) if "class" in h), None),
            "unit": next((i for i, h in enumerate(header) if "unit" in h), None),
            "topic": next((i for i, h in enumerate(header) if "topic" in h), None),
            "focus": next((i for i, h in enumerate(header) if "focus" in h), None),
            "activity": next((i for i, h in enumerate(header) if "activity" in h), None),
            "co": next((i for i, h in enumerate(header) if h.startswith("co")), None),
        }

        merged = merge_wrapped_rows(tbl[1:])
        for row in merged:
            cells = row + [""] * max(0, 6 - len(row))

            def get(key):
                i = idx.get(key)
                return cells[i] if i is not None and i < len(cells) else ""

            class_no = get("class")
            unit_no = get("unit")
            topic = get("topic")
            focus = get("focus")
            activity = get("activity")
            co = get("co")

            # Skip header repeats
            if "class" in class_no.lower() or "topic" in topic.lower():
                continue
            if not class_no and not topic:
                continue

            full_topic = " ".join(filter(None, [topic, focus])).strip() or topic
            rows_out.append({
                "number": class_no,
                "topic": full_topic,
                "slides": activity,
                "videos": co,
                "unit": unit_no,
            })
        if rows_out:
            break

    # Text-only fallback
    if not rows_out:
        rows_out = _parse_teaching_from_text(section_text)

    data["teaching"] = rows_out


def _parse_teaching_from_text(text: str):
    """
    Very conservative line-by-line fallback. Only accept lines that
    start with an integer class number.
    """
    rows = []
    for ln in text.splitlines():
        ln = ln.strip()
        m = re.match(r'^(\d{1,3})\s+(\d)\s+(.+)$', ln)
        if not m:
            continue
        class_no, unit_no, rest = m.group(1), m.group(2), m.group(3)
        # Split remaining into ~4 fields by multiple spaces
        parts = re.split(r'\s{2,}', rest)
        if len(parts) >= 4:
            topic, focus, activity, co = parts[0], parts[1], parts[2], parts[3]
        elif len(parts) == 3:
            topic, activity, co = parts
            focus = ""
        else:
            topic, focus, activity, co = rest, "", "", ""
        rows.append({
            "number": class_no,
            "topic": " ".join(filter(None, [topic, focus])).strip(),
            "slides": activity,
            "videos": co,
            "unit": unit_no,
        })
    return rows


# ═════════════════════════════════════════════════════════════════════════════
# 10.  RICH-TEXT SECTIONS  (overview, objectives, content, grading)
# ═════════════════════════════════════════════════════════════════════════════

def extract_rich_text_sections(sections: dict, data: dict) -> None:
    # Overview / Aims
    raw = sections.get("overview", "")
    data["aimsSummary"] = format_bullets_to_html(raw)

    # Objectives
    raw = sections.get("objectives", "")
    # Strip stray heading text like "1.3 Course Objectives1." that bleeds
    raw = re.sub(r'^\s*(?:\d\.\d\s+)?Course\s+Objectives\s*', '', raw, flags=re.I)
    data["objectives"] = _number_to_ol(raw)

    # Course Content
    raw = sections.get("course_content", "")
    data["courseContent"] = _content_to_html(raw)

    # Grading Criterion
    raw = sections.get("grading", "")
    data["gradingCriterion"] = _section_to_paragraphs(raw)

    # Assignment Details
    raw = sections.get("assignment_details", "")
    data["otherDetails"]["assignmentDetails"] = _section_to_paragraphs(raw)

    # Academic Integrity
    raw = sections.get("academic_integrity", "")
    data["otherDetails"]["academicIntegrity"] = _section_to_paragraphs(raw)


def _number_to_ol(text: str) -> str:
    """
    Convert numbered list ('1. ...2. ...3. ...') into <ol><li>...
    Also accepts bullet-prefixed lines.
    """
    text = clean_text(text)
    if not text:
        return ""
    # Insert a newline before each number marker "N. " that starts a sentence
    parts = re.split(r'(?<=\D)\s*(\d+\.\s+)', text)
    # parts alternates: [pre, marker, body, marker, body, ...]
    items = []
    if parts and len(parts) >= 3:
        for i in range(1, len(parts), 2):
            body = parts[i + 1] if i + 1 < len(parts) else ""
            if body.strip():
                items.append(body.strip())
    if len(items) >= 2:
        return "<ol>" + "".join(f"<li>{it}</li>" for it in items) + "</ol>"
    return format_bullets_to_html(text)


def _content_to_html(text: str) -> str:
    """Convert 'Unit N: ...' with sub-lists into structured HTML."""
    text = text.strip()
    if not text:
        return ""
    # Insert newline before each 'Unit N:'
    blocks = re.split(r'(?=Unit\s+\d+\s*:)', text)
    html_parts = []
    for b in blocks:
        b = b.strip()
        if not b:
            continue
        m = re.match(r'(Unit\s+\d+\s*:\s*)(.*)', b, re.DOTALL)
        if m:
            title = clean_text(m.group(1) + m.group(2).split('\n')[0])
            html_parts.append(f"<p><strong>{title}</strong></p>")
            rest = b[len(title):].strip()
            if rest:
                html_parts.append(_section_to_paragraphs(rest))
        else:
            html_parts.append(_section_to_paragraphs(b))
    return "".join(html_parts)


def _section_to_paragraphs(text: str) -> str:
    """Fallback plain-text → <p> with <br/>."""
    text = clean_text(text)
    if not text:
        return ""
    return f"<p>{text}</p>"


# ═════════════════════════════════════════════════════════════════════════════
# 11.  RESOURCES  (textbooks, references, online)
# ═════════════════════════════════════════════════════════════════════════════

def parse_resources(section_text: str, tables: list, data: dict) -> None:
    """Extract textbooks, references, other resources."""
    text = section_text
    if not text:
        return

    # Cut into blocks by known sub-headers
    def _slice(start_re, end_re):
        m = re.search(start_re, text, re.I)
        if not m:
            return ""
        rest = text[m.end():]
        if end_re:
            e = re.search(end_re, rest, re.I)
            if e:
                rest = rest[:e.start()]
        return rest.strip()

    books = _slice(r'Text\s*Books?\s*[:.]?',
                   r'Reference\s+Books?|References?|Online\s+Resources|Other\s+Resources')
    refs = _slice(r'Reference\s+Books?\s*[:.]?',
                  r'Online\s+Resources|Other\s+Resources')
    online = _slice(r'(?:Online|Other)\s+Resources?\s*[:.]?',
                    r'2\.0|Teaching\s+and\s+Assessment')

    data["resources"]["textBooks"] = _split_numbered(books)
    data["resources"]["references"] = _split_numbered(refs)
    data["resources"]["otherResources"] = _split_numbered(online, dedupe_bullet=True)


def _split_numbered(block: str, dedupe_bullet: bool = False):
    if not block:
        return []
    # Numbered list '1. ...2. ...'
    parts = re.split(r'(?<=\D)\s*\d+\.\s+', block)
    items = [p.strip() for p in parts if p.strip()]
    if len(items) >= 2:
        return _dedupe_preserve(items)
    if dedupe_bullet:
        parts = re.split(r'\s*[-•●]\s*', block)
        items = [p.strip() for p in parts if len(p.strip()) > 4]
    else:
        items = [p.strip() for p in re.split(r'\n{2,}', block) if p.strip()]
    return _dedupe_preserve(items)


# ═════════════════════════════════════════════════════════════════════════════
# 12.  TABLE CLASSIFIER HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _is_recording_marks_table(all_cells: str) -> bool:
    return ("performance recording" in all_cells or
            "student name" in all_cells and "marks scored" in all_cells)


def _is_attainment_targets_table(all_cells: str) -> bool:
    return ("setting attainment targets" in all_cells
            or "attainment of course outcomes" in all_cells
            or "outcomes - targeted" in all_cells)


# ═════════════════════════════════════════════════════════════════════════════
# 13.  SINGLE-CD PARSER  — orchestrator
# ═════════════════════════════════════════════════════════════════════════════

def parse_single_cd(pages_text: list, pages_tables: list) -> dict:
    """
    Top-level orchestrator.
      pages_text   : list[str]   — one entry per page
      pages_tables : list[list]  — per page, list of tables
    """
    # 1. Build the full-text, strip page noise
    full_text = "\n".join(strip_page_noise(t or "") for t in pages_text)

    # 2. Flatten tables, tracking which section they belong to
    all_tables = [t for page_tables in pages_tables for t in (page_tables or [])]

    # 3. Slice into named sections
    sections = slice_document_sections(full_text)

    # 4. Extract into `data`
    data = make_empty_cd()

    parse_course_details(sections.get("course_details", full_text),
                         all_tables, data)
    parse_course_size(all_tables, data)
    parse_course_outcomes(sections.get("course_outcomes", ""),
                          all_tables, data)
    parse_outcome_map(sections.get("outcome_map", ""),
                      all_tables, data)
    parse_assessment_weight(sections.get("assessment_weight", ""),
                            all_tables, data)
    parse_teaching(sections.get("teaching_plan", ""),
                   all_tables, data)
    parse_resources(sections.get("resources", ""),
                    all_tables, data)
    extract_rich_text_sections(sections, data)

    # 5. Attainment (uses its own section, not the global tables)
    att_rows = _extract_table_from_section(
        sections.get("attain_targets", ""), all_tables,
        predicate=_is_attainment_targets_table)
    data["attainmentCalculations"]["settingTargets"] = (
        build_attainment_targets_html(att_rows) if att_rows
        else _default_attainment_targets_html()
    )

    rec_rows = _extract_table_from_section(
        sections.get("performance_rec", ""), all_tables,
        predicate=_is_recording_marks_table)
    data["attainmentCalculations"]["recordingMarks"] = (
        build_recording_marks_html(rec_rows) if rec_rows
        else _default_recording_marks_html()
    )

    # 6. Sanity default: totalHours
    if not data["totalHours"]:
        m = re.search(r'Total\s+Term/?\s*Semester\s+hours?:?\s*(\d+)',
                      full_text, re.I)
        if m:
            data["totalHours"] = safe_int(m.group(1))

    # 7. Build HTML strings
    include_details = any(co.get("application") or co.get("bloom")
                          for co in data["courseOutcomes"])
    data["courseOutcomesHtml"] = build_course_outcomes_html(
        data["courseOutcomes"], include_details=include_details)
    data["outcomeMapHtml"] = build_outcome_map_html(
        data["outcomeMap"]["matrix"])
    data["assessmentWeightHtml"] = build_assessment_weight_html(
        data["assessmentWeight"], meta=data.get("assessmentMeta"))

    return data


def _extract_table_from_section(section_text, all_tables, predicate):
    """
    Select only tables whose header appears in section_text.
    Ensures we don't accidentally grab another section's table.
    """
    if not section_text:
        return []
    st = section_text.lower()
    for tbl in all_tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if predicate(joined) and joined[:80] in st:
            return tbl
    # Fallback: match on predicate alone
    for tbl in all_tables:
        joined = " ".join(clean_text(c) for row in tbl for c in row).lower()
        if predicate(joined):
            return tbl
    return []


# ═════════════════════════════════════════════════════════════════════════════
# 14.  PDF → TEXT + TABLES
# ═════════════════════════════════════════════════════════════════════════════

def extract_pages(file_path: str):
    with pdfplumber.open(file_path) as pdf:
        pages_text = []
        pages_tables = []
        for page in pdf.pages:
            pages_text.append(page.extract_text() or "")
            tables = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 3,
                "join_tolerance": 3,
            })
            if not tables:
                tables = page.extract_tables() or []
            pages_tables.append(tables)
    return pages_text, pages_tables


# ═════════════════════════════════════════════════════════════════════════════
# 15.  MULTI-CD BOUNDARY DETECTOR
# ═════════════════════════════════════════════════════════════════════════════

CD_START_RE = re.compile(
    r'(?:^|\n)\s*([A-Z0-9]{6,12})\s+Course\s+Document',
    re.IGNORECASE | re.MULTILINE)


def find_cd_boundaries(pages_text):
    hits = []
    for i, text in enumerate(pages_text):
        m = CD_START_RE.search(text)
        if m:
            hits.append((i, m.group(1).upper()))
    return hits


# ═════════════════════════════════════════════════════════════════════════════
# 16.  TOP-LEVEL PARSER
# ═════════════════════════════════════════════════════════════════════════════

def parse_cd_pdf(file_path: str) -> dict:
    # Magic-byte guard
    try:
        with open(file_path, "rb") as fh:
            head = fh.read(8)
        if not head.startswith(b"%PDF-"):
            return {
                "success": False,
                "message": (
                    f"Not a PDF (first bytes: {head!r}). "
                    "If this is .doc/.docx, save as PDF first."
                ),
                "parsedData": [],
            }
    except Exception as e:
        return {"success": False,
                "message": f"Cannot read file: {e}",
                "parsedData": []}

    try:
        pages_text, pages_tables = extract_pages(file_path)

        boundaries = find_cd_boundaries(pages_text)
        if not boundaries:
            parsed = parse_single_cd(pages_text, pages_tables)
            return {
                "success": True,
                "message": "Single CD parsed.",
                "parsedData": [parsed],
            }

        boundaries.append((len(pages_text), "EOF"))
        cd_list = []
        for i in range(len(boundaries) - 1):
            start, end = boundaries[i][0], boundaries[i + 1][0]
            code_hint = boundaries[i][1]
            chunk_text = pages_text[start:end]
            chunk_tables = pages_tables[start:end]
            parsed = parse_single_cd(chunk_text, chunk_tables)
            if not parsed.get("courseCode"):
                parsed["courseCode"] = code_hint
            cd_list.append(parsed)

        return {
            "success": True,
            "message": f"Successfully parsed {len(cd_list)} CD(s).",
            "parsedData": cd_list,
        }

    except Exception as e:
        tb = traceback.format_exc()
        sys.stderr.write("=== CD PARSER CRASH ===\n" + tb + "\n")
        return {
            "success": False,
            "message": f"Parser error: {type(e).__name__}: {e or repr(e)}",
            "trace": tb,
            "python": sys.version,
            "executable": sys.executable,
            "pdfplumber": _PDFPLUMBER_VER,
            "parsedData": [],
        }


# ═════════════════════════════════════════════════════════════════════════════
# 17.  ENTRY POINT
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "No file path provided"}))
        sys.exit(1)
    fp = sys.argv[1]
    if not Path(fp).exists():
        print(json.dumps({"success": False, "message": f"File not found: {fp}"}))
        sys.exit(1)
    print(json.dumps(parse_cd_pdf(fp), indent=2, ensure_ascii=False))