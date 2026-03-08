#!/usr/bin/env python3
"""
CD Document Parser – GM University 2024 Scheme
Extracts structured data from a Course Document (CD) PDF and returns JSON.

Enhanced Features:
- Multi-CD slicing with robust boundary detection
- Rich Text → HTML bullet formatting for Jodit Editor
- Dynamic column mapping for teaching schedule (multi-page stitching)
- Flexible Assessment Weight parsing (handles both full 11-col and aggregated formats)
- Outcome Map header auto-correction (PO PO PO → PO1 PO2 PO3)
- Wrapped-row merging for broken PDF tables
- Course Outcomes (COs)        → styled HTML table  (CO code | Description)
- Outcome Map                  → styled HTML table  (CO × PO/PSO grid)
- Assessment Weight            → styled HTML table  (exact image format:
                                   Quiz/Test/Assignment colspan header + CIE/SEE rowspan + totals footer)
- Attainment Calculations:
    * Recording Marks and Awarding Grades  → styled HTML table
    * Setting Attainment Targets           → styled HTML table
"""

import sys
import json
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print(json.dumps({
        "success": False,
        "message": "pdfplumber not installed. Run: pip install pdfplumber"
    }))
    sys.exit(1)


# ─────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()


def safe_int(val, default=0):
    try:
        if val is None or str(val).strip() == "":
            return default
        digits = re.search(r'\d+', str(val))
        return int(digits.group()) if digits else default
    except Exception:
        return default


def format_bullets_to_html(text):
    """Convert plain-text bullet points into HTML so Jodit renders them correctly."""
    if not text:
        return ""
    text = clean_text(text)
    formatted = re.sub(r'\s*[•●◉○►▪]\s*', '<br/>&#8226; ', text)
    if formatted.startswith('<br/>'):
        formatted = formatted[5:]
    return formatted.strip()


def merge_wrapped_rows(raw_rows):
    """
    Fix tables where long cell text wraps into the next PDF row.
    pdfplumber sees the continuation as a new row with an empty first column.
    """
    merged = []
    for row in raw_rows:
        cleaned = [str(c).strip() if c is not None else "" for c in row]
        if not any(cleaned):
            continue
        if not cleaned[0] and merged:
            for i in range(1, len(cleaned)):
                if not cleaned[i]:
                    continue
                if i < len(merged[-1]):
                    merged[-1][i] = (merged[-1][i] + " " + cleaned[i]).strip()
                else:
                    merged[-1].append(cleaned[i])
        else:
            merged.append(cleaned)
    return merged


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
        # ── HTML table strings rendered by Jodit Editor ──────────────────
        "courseOutcomesHtml":   "",
        "outcomeMap": {"raw": "", "matrix": []},
        "outcomeMapHtml":       "",
        "assessmentWeight":     make_default_assessment_weight(),
        "assessmentWeightHtml": "",
        # ────────────────────────────────────────────────────────────────
        "resources": {"textBooks": [], "references": [], "otherResources": []},
        "teaching": [],
        "attainmentCalculations": {
            "recordingMarks": "",
            "settingTargets": ""
        },
        "otherDetails": {"assignmentDetails": "", "academicIntegrity": ""}
    }


# ─────────────────────────────────────────────────────────────────────────────
# SHARED INLINE CSS TOKENS
# ─────────────────────────────────────────────────────────────────────────────

_TBL = 'style="border-collapse:collapse;width:100%;font-size:13px;font-family:Arial,sans-serif;margin-bottom:10px"'
_TH = 'style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;text-align:center;font-weight:bold;vertical-align:middle"'
_TH2 = 'style="border:1px solid #b0b8cc;padding:6px 8px;background:#d1d5db;text-align:center;font-weight:bold;font-size:12px;vertical-align:middle"'
_TD = 'style="border:1px solid #b0b8cc;padding:8px 10px;text-align:center;vertical-align:middle"'
_TDL = 'style="border:1px solid #b0b8cc;padding:8px 12px;text-align:left;vertical-align:top"'
_TDH = 'style="border:1px solid #b0b8cc;padding:8px 10px;text-align:center;font-weight:bold;background:#f1f5f9;vertical-align:middle"'
_CAP = 'style="caption-side:top;font-weight:bold;font-size:14px;padding:9px;background:#e3e8f7;border:1px solid #b0b8cc;text-align:center"'

# Default PO/PSO header list (matches frontend constant)
DEFAULT_OUTCOME_HEADERS = [
    "CO\\PO",
    "PO1", "PO2", "PO3", "PO4", "PO5", "PO6",
    "PO7", "PO8", "PO9", "PO10", "PO11", "PO12",
    "PSO1", "PSO2", "PSO3",
]


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: 2.3 Course Outcomes (COs)
# ─────────────────────────────────────────────────────────────────────────────

def build_course_outcomes_html(cos):
    """
    Build a styled 2-column HTML table from the courseOutcomes list.
    Row layout: [Course Outcome (bold)] | [Description (left-aligned)]
    Falls back to 6 blank CO rows when the list is empty.
    """
    rows = cos if cos else [
        {"code": f"CO{i}", "description": ""} for i in range(1, 7)
    ]

    html = f'<table {_TBL}>'
    html += '<thead><tr>'
    html += (
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;'
        f'background:#d1d5db;text-align:center;font-weight:bold;'
        f'vertical-align:middle;width:110px">Course Outcome</th>'
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;'
        f'background:#d1d5db;text-align:left;font-weight:bold;'
        f'vertical-align:middle">Description</th>'
    )
    html += '</tr></thead><tbody>'

    for co in rows:
        code = clean_text(co.get("code", ""))
        desc = clean_text(co.get("description", ""))
        html += (
            f'<tr>'
            f'<td {_TDH}>{code}</td>'
            f'<td {_TDL}>{desc}</td>'
            f'</tr>'
        )

    html += '</tbody></table>'
    return html


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: Outcome Map (CO × PO / PSO)
# ─────────────────────────────────────────────────────────────────────────────

def build_outcome_map_html(matrix):
    """
    Convert the CO×PO matrix (list of lists) to a styled HTML table.
    matrix[0] = header row, matrix[1..N] = CO data rows.
    Falls back to a default 6-CO × 15-PO grid when empty.
    """
    if not matrix or len(matrix) < 2:
        matrix = [
            DEFAULT_OUTCOME_HEADERS,
            *[[f"CO{i}"] + [""] * 15 for i in range(1, 7)]
        ]

    html = f'<table {_TBL}><thead><tr>'
    for h in matrix[0]:
        html += f'<th {_TH2}>{h}</th>'
    html += '</tr></thead><tbody>'

    for row in matrix[1:]:
        html += '<tr>'
        for ci, cell in enumerate(row):
            if ci == 0:
                html += f'<td {_TDH}>{cell}</td>'
            else:
                html += f'<td {_TD}>{cell}</td>'
        html += '</tr>'

    html += '</tbody></table>'
    return html


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: 3.2 Assessment Weight Distribution
#
# Exact format from reference image:
#   Header row 1 : Cos with weightage | Quiz = 15 Marks (colspan 3)
#                  | Test = 25 Marks (colspan 3) | Assignment = 20 Marks (colspan 2)
#                  | CIE =60 (rowspan 2) | SEE =40 (rowspan 2)
#   Header row 2 : Q1=5 | Q2=4 | Q3=6 | T1=7 | T2=8 | T3=10 | A1=10 | A2=10
#   Data rows    : CO1 … CO6
#   Footer row   : column totals
# ─────────────────────────────────────────────────────────────────────────────

def build_assessment_weight_html(aw_list):
    """
    Build the full Assessment Weight Distribution table as HTML, matching
    the exact layout shown in the reference image (3_2.jpeg).
    """
    if not aw_list:
        aw_list = make_default_assessment_weight()

    # ── Column totals ─────────────────────────────────────────────────────
    def _sum(key):
        return sum(row.get(key, 0) or 0 for row in aw_list)

    sQ1, sQ2, sQ3 = _sum("q1"), _sum("q2"), _sum("q3")
    sT1, sT2, sT3 = _sum("t1"), _sum("t2"), _sum("t3")
    sA1, sA2 = _sum("a1"), _sum("a2")
    sCIE = _sum("cie")
    sSEE = _sum("see")

    # Use reference document totals when parsed values are all zero
    if sQ1 + sQ2 + sQ3 == 0:
        sQ1, sQ2, sQ3 = 5, 4, 6
    if sT1 + sT2 + sT3 == 0:
        sT1, sT2, sT3 = 7, 8, 10
    if sA1 + sA2 == 0:
        sA1, sA2 = 10, 10
    if sCIE == 0:
        sCIE = 60
    if sSEE == 0:
        sSEE = 40

    # ── Two-row merged header ─────────────────────────────────────────────
    html = f'<table {_TBL}><thead>'

    # Row 1 — group labels
    html += (
        '<tr>'
        f'<th rowspan="2" {_TH}>Cos with<br/>weightage</th>'
        f'<th colspan="3" {_TH}>Quiz = 15 Marks</th>'
        f'<th colspan="3" {_TH}>Test = 25 Marks</th>'
        f'<th colspan="2" {_TH}>Assignment = 20 Marks</th>'
        f'<th rowspan="2" {_TH}>CIE<br/>=60</th>'
        f'<th rowspan="2" {_TH}>SEE<br/>=40</th>'
        '</tr>'
    )

    # Row 2 — sub-column labels
    html += (
        '<tr>'
        f'<th {_TH2}>Q1<br/>=5</th>'
        f'<th {_TH2}>Q2<br/>=4</th>'
        f'<th {_TH2}>Q3<br/>=6</th>'
        f'<th {_TH2}>T1<br/>=7</th>'
        f'<th {_TH2}>T2<br/>=8</th>'
        f'<th {_TH2}>T3<br/>=10</th>'
        f'<th {_TH2}>A1 = 10</th>'
        f'<th {_TH2}>A2 = 10</th>'
        '</tr>'
    )

    html += '</thead><tbody>'

    # ── Data rows (CO1–CO6) ───────────────────────────────────────────────
    for row in aw_list:
        def _v(k):
            val = row.get(k, "")
            return "" if val == 0 else (val or "")

        html += (
            '<tr>'
            f'<td {_TDH}>{row.get("co", "")}</td>'
            f'<td {_TD}>{_v("q1")}</td>'
            f'<td {_TD}>{_v("q2")}</td>'
            f'<td {_TD}>{_v("q3")}</td>'
            f'<td {_TD}>{_v("t1")}</td>'
            f'<td {_TD}>{_v("t2")}</td>'
            f'<td {_TD}>{_v("t3")}</td>'
            f'<td {_TD}>{_v("a1")}</td>'
            f'<td {_TD}>{_v("a2")}</td>'
            f'<td {_TDH}>{_v("cie")}</td>'
            f'<td {_TD}>{_v("see")}</td>'
            '</tr>'
        )

    html += '</tbody>'

    # ── Footer / totals row ───────────────────────────────────────────────
    html += (
        '<tfoot><tr>'
        f'<td {_TDH}></td>'
        f'<td {_TDH}>{sQ1}</td>'
        f'<td {_TDH}>{sQ2}</td>'
        f'<td {_TDH}>{sQ3}</td>'
        f'<td {_TDH}>{sT1}</td>'
        f'<td {_TDH}>{sT2}</td>'
        f'<td {_TDH}>{sT3}</td>'
        f'<td {_TDH}>{sA1}</td>'
        f'<td {_TDH}>{sA2}</td>'
        f'<td {_TDH}>{sCIE}</td>'
        f'<td {_TDH}>{sSEE}</td>'
        '</tr></tfoot>'
    )

    html += '</table>'
    return html


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: Recording Marks and Awarding Grades
# ─────────────────────────────────────────────────────────────────────────────

def build_recording_marks_html(rows):
    """
    Convert the 'Recording Marks and Awarding Grades' PDF table to HTML.
    PDF typically has a 2-row wrapped header that is merged here.
    """
    if not rows:
        return _default_recording_marks_html()

    cells = [[clean_text(str(c)) if c else "" for c in row] for row in rows]

    kw_re = re.compile(
        r's\.?\s*no|usn|student|quiz|test|assignment|see|marks\s+scor|grade', re.I)
    total_re = re.compile(r'^\s*total\s*$', re.I)
    cavg_re = re.compile(r'class\s+average', re.I)
    data_no_re = re.compile(r'^[1-9]$|^n$', re.I)

    header_parts = []
    data_rows_out = []
    total_row_out = None
    footer_lines = []
    in_header = True

    for row in cells:
        joined = " ".join(row)
        nonempty = [c for c in row if c]
        if not nonempty:
            continue

        if cavg_re.search(joined):
            footer_lines.append(joined)
            in_header = False
            continue

        if any(total_re.match(c) for c in nonempty):
            total_row_out = row
            in_header = False
            continue

        if in_header and kw_re.search(joined):
            header_parts.append(row)
            continue

        if nonempty and data_no_re.match(nonempty[0]):
            in_header = False

        data_rows_out.append(row)

    # ── Merge 2-row wrapped header ────────────────────────────────────────
    if len(header_parts) >= 2:
        w = max(len(header_parts[0]), len(header_parts[1]))
        merged_hdr = []
        for j in range(w):
            h0 = header_parts[0][j] if j < len(header_parts[0]) else ""
            h1 = header_parts[1][j] if j < len(header_parts[1]) else ""
            merged_hdr.append(f"{h0}<br/>{h1}" if h0 and h1 else (h0 or h1))
    elif len(header_parts) == 1:
        merged_hdr = header_parts[0]
    else:
        merged_hdr = [
            "S. No.", "USN", "Student<br/>Name",
            "Quiz<br/>(15%)", "Test<br/>(25%)",
            "Assignment<br/>20%", "SEE<br/>40%",
            "Marks<br/>Scored", "Grade<br/>obtained"
        ]

    col_count = len(merged_hdr)

    html = f'<table {_TBL}><thead><tr>'
    html += "".join(f'<th {_TH}>{h}</th>' for h in merged_hdr)
    html += '</tr></thead><tbody>'

    if data_rows_out:
        for row in data_rows_out:
            padded = row + [""] * max(0, col_count - len(row))
            html += "<tr>" + "".join(
                f'<td {_TD}>{c}</td>' for c in padded[:col_count]) + "</tr>"
    else:
        for lbl in ["1", "2", "3", "&nbsp;", "N"]:
            html += f'<tr><td {_TD}>{lbl}</td>'
            html += "".join(f'<td {_TD}>&nbsp;</td>' for _ in range(col_count - 1))
            html += "</tr>"

    if total_row_out:
        padded = total_row_out + [""] * max(0, col_count - len(total_row_out))
        html += "<tr>" + "".join(
            f'<td {_TD}><strong>{c}</strong></td>' for c in padded[:col_count]) + "</tr>"
    else:
        html += (
            f'<tr>'
            f'<td {_TD} colspan="3"><strong>Total</strong></td>'
            + "".join(f'<td {_TD}>&nbsp;</td>' for _ in range(max(0, col_count - 5)))
            + f'<td {_TD}><strong>XXXXX</strong></td>'
            + f'<td {_TD}>&nbsp;</td></tr>'
        )

    html += '</tbody></table>'

    if footer_lines:
        for line in footer_lines:
            html += f'<p style="font-size:12px;margin:4px 0"><strong>{line}</strong></p>'
    else:
        html += (
            '<p style="font-size:12px;margin:6px 0">'
            '<strong>Class Average Marks:</strong> '
            'Total marks of All Students (XXXX) / Number of students (N)'
            '</p>'
            '<p style="font-size:12px;margin:4px 0"><strong>Average Grade:</strong></p>'
        )

    return html


def _default_recording_marks_html():
    headers = [
        "S. No.", "USN", "Student<br/>Name",
        "Quiz<br/>(15%)", "Test<br/>(25%)",
        "Assignment<br/>20%", "SEE<br/>40%",
        "Marks<br/>Scored", "Grade<br/>obtained"
    ]
    html = f'<table {_TBL}><thead><tr>'
    html += "".join(f'<th {_TH}>{h}</th>' for h in headers)
    html += '</tr></thead><tbody>'
    for lbl in ["1", "2", "3", "&nbsp;", "N"]:
        html += f'<tr><td {_TD}>{lbl}</td>'
        html += "".join(f'<td {_TD}>&nbsp;</td>' for _ in range(8))
        html += "</tr>"
    html += (
        f'<tr><td {_TD} colspan="3"><strong>Total</strong></td>'
        + "".join(f'<td {_TD}>&nbsp;</td>' for _ in range(3))
        + f'<td {_TD}><strong>XXXXX</strong></td>'
        + f'<td {_TD}>&nbsp;</td></tr>'
    )
    html += '</tbody></table>'
    html += (
        '<p style="font-size:12px;margin:6px 0">'
        '<strong>Class Average Marks:</strong> '
        'Total marks of All Students (XXXX) / Number of students (N)'
        '</p>'
        '<p style="font-size:12px;margin:4px 0"><strong>Average Grade:</strong></p>'
    )
    return html


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: Setting Attainment Targets
# ─────────────────────────────────────────────────────────────────────────────

def build_attainment_targets_html(rows):
    """
    Convert the 'Setting Attainment Targets' PDF table to HTML.
    Left column : 70%/60%/50% attainment level text (wrapped rows → merged).
    Right column: numeric level value (usually "1").
    """
    if not rows:
        return _default_attainment_targets_html()

    cells = [[clean_text(str(c)) if c else "" for c in row] for row in rows]
    merged = merge_wrapped_rows(cells)

    title_re = re.compile(r'attainment\s+of\s+course\s+outcomes', re.I)
    header_re = re.compile(
        r'outcomes.{0,10}targeted|targeted\s+attainment', re.I)
    data_re = re.compile(r'\d+%\s+of\s+students', re.I)

    title_text = ""
    header_row = None
    data_rows = []

    for row in merged:
        joined = " ".join(row)
        nonempty = [c for c in row if c]
        if not nonempty:
            continue
        if title_re.search(joined):
            title_text = joined
            continue
        if header_re.search(joined) and not data_re.search(joined):
            header_row = row
            continue
        if data_re.search(joined):
            data_rows.append(row)

    cap = title_text or "Attainment of Course Outcomes-COs"
    col0 = header_row[0] if header_row and len(
        header_row) > 0 else "Outcomes- Targeted"
    col1 = header_row[1] if header_row and len(
        header_row) > 1 else "Targeted Attainment Level"

    html = f'<table {_TBL}>'
    html += f'<caption {_CAP}>{cap}</caption>'
    html += (
        f'<thead><tr>'
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;'
        f'text-align:center;font-weight:bold;vertical-align:middle;width:78%">{col0}</th>'
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;'
        f'text-align:center;font-weight:bold;vertical-align:middle;width:22%">{col1}</th>'
        f'</tr></thead><tbody>'
    )

    if data_rows:
        for row in data_rows:
            outcome_txt = row[0] if len(row) > 0 else ""
            level_val = row[1] if len(row) > 1 else "1"
            formatted = _format_attainment_levels(outcome_txt)
            html += (
                f'<tr>'
                f'<td {_TDL}>{formatted}</td>'
                f'<td {_TD}><strong>{level_val}</strong></td>'
                f'</tr>'
            )
    else:
        default_fmt = _format_attainment_levels(
            "70% of students will score C grade and above - Attainment Level 1 "
            "60% of students will score C grade and above - Attainment Level 2 "
            "50% of students will score C grade and above - Attainment Level 3"
        )
        for _ in range(6):
            html += (
                f'<tr>'
                f'<td {_TDL}>{default_fmt}</td>'
                f'<td {_TD}><strong>1</strong></td>'
                f'</tr>'
            )

    html += '</tbody></table>'
    return html


def _format_attainment_levels(text):
    if not text:
        return ""
    parts = re.split(r'(?=\d+%\s+of\s+students)', text.strip())
    parts = [p.strip() for p in parts if p.strip()]
    return "<br/>".join(parts) if len(parts) > 1 else text


def _default_attainment_targets_html():
    default_fmt = _format_attainment_levels(
        "70% of students will score C grade and above - Attainment Level 1 "
        "60% of students will score C grade and above - Attainment Level 2 "
        "50% of students will score C grade and above - Attainment Level 3"
    )
    html = (
        f'<table {_TBL}>'
        f'<caption {_CAP}>Attainment of Course Outcomes-COs</caption>'
        f'<thead><tr>'
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;'
        f'text-align:center;font-weight:bold;vertical-align:middle;width:78%">Outcomes- Targeted</th>'
        f'<th {_TH} style="border:1px solid #b0b8cc;padding:8px 10px;background:#d1d5db;'
        f'text-align:center;font-weight:bold;vertical-align:middle;width:22%">Targeted Attainment Level</th>'
        f'</tr></thead><tbody>'
    )
    for _ in range(6):
        html += (
            f'<tr>'
            f'<td {_TDL}>{default_fmt}</td>'
            f'<td {_TD}><strong>1</strong></td>'
            f'</tr>'
        )
    html += '</tbody></table>'
    return html


# ─────────────────────────────────────────────
# STANDARD TABLE PARSERS
# ─────────────────────────────────────────────

def parse_metadata_table(table, data):
    for row in table:
        if len(row) < 2 or not row[0]:
            continue
        key = clean_text(str(row[0])).lower()
        val = clean_text(row[1]) if row[1] else ""
        if not val and len(row) >= 4 and row[3]:
            val = clean_text(row[3])

        if "course code" in key:
            data["courseCode"] = val
        elif "course title" in key:
            data["courseTitle"] = val
        elif "program code" in key:
            data["programCode"] = val
        elif "program title" in key:
            data["programTitle"] = val
        elif "school code" in key:
            data["schoolCode"] = val
        elif "school title" in key:
            data["schoolTitle"] = val
        elif "department code" in key:
            data["departmentCode"] = val
        elif key.strip() == "department" or (
                "department" in key and "code" not in key and "offering" not in key):
            data["department"] = val
        elif "faculty code" in key:
            data["facultyCode"] = val
        elif "faculty title" in key:
            data["facultyTitle"] = val
        elif "offering" in key and "department" in key:
            data["offeringDepartment"] = val
        elif "faculty member" in key:
            data["facultyMember"] = val
        elif "semester duration" in key:
            dur_parts = [str(c) for c in row[1:] if c and str(c).strip()]
            data["semesterDuration"] = clean_text(" ".join(dur_parts))


def parse_credits_table(table, data):
    if len(table) < 2:
        return
    headers = [clean_text(str(c)).lower() if c else "" for c in table[0]]
    vals = [clean_text(str(c)) if c else "" for c in table[1]]
    for i, h in enumerate(headers):
        if i >= len(vals):
            break
        v = vals[i]
        if h == "l":
            data["credits"]["L"] = safe_int(v)
        elif h == "t":
            data["credits"]["T"] = safe_int(v)
        elif h == "p":
            data["credits"]["P"] = safe_int(v)
        elif "credit" in h or h == "total":
            data["credits"]["total"] = safe_int(v)
        elif "hour" in h or "hrs" in h or "week" in h:
            data["totalHours"] = safe_int(v)


def process_teaching_rows(rows, data):
    if not rows:
        return

    col_map = {"num": 0, "topic": 1, "slides": 2, "videos": 3}
    for row in rows:
        joined = " ".join(str(c).lower() for c in row if c)
        if ("lecture" in joined or "topic" in joined) and (
                "number" in joined or "no" in joined or "#" in joined or "lecture" in joined):
            for j, cell in enumerate(row):
                ct = str(cell).lower() if cell else ""
                if "number" in ct or ("lecture" in ct and "no" in ct):
                    col_map["num"] = j
                elif "topic" in ct or "content" in ct:
                    col_map["topic"] = j
                elif "slide" in ct or "ppt" in ct or "presentation" in ct:
                    col_map["slides"] = j
                elif "video" in ct or "link" in ct or "url" in ct:
                    col_map["videos"] = j
            break

    max_col = max(col_map.values())

    def is_header_row(row):
        joined = " ".join(str(c).lower() for c in row if c)
        return ("lecture" in joined and "topic" in joined) or (
            "lecture" in joined and "number" in joined)

    cleaned_rows = [r for r in rows if not is_header_row(r)]
    merged = merge_wrapped_rows(cleaned_rows)

    annotation_patterns = [
        r"issue assignment", r"quiz\s*-?\s*\d",
        r"test\s*-?\s*\d", r"assignment.*submission",
        r"student feedback", r"examination", r"break"
    ]

    for row in merged:
        padded = list(row) + [""] * (max_col + 2 - len(row))
        num = clean_text(padded[col_map["num"]])
        topic = clean_text(padded[col_map["topic"]])
        slides = clean_text(padded[col_map["slides"]])
        videos = clean_text(padded[col_map["videos"]])

        if not num and (not topic or len(topic) < 3):
            continue
        if not num and any(re.search(p, topic.lower()) for p in annotation_patterns):
            continue

        data["teaching"].append({
            "number": num, "topic": topic,
            "slides": slides, "videos": videos
        })


def process_assessment_rows(rows, data):
    if not rows:
        return

    for row in rows:
        cleaned = [clean_text(str(c)) if c is not None else "" for c in row]
        if not any(cleaned):
            continue

        row_str = " ".join(cleaned)
        co_match = re.match(r'(CO\d+)', row_str.strip(), re.IGNORECASE)
        if not co_match:
            continue

        co_id = co_match.group(1).upper()
        co_num = safe_int(re.search(r'\d+', co_id).group())
        if co_num < 1 or co_num > 6:
            continue

        rest = row_str[len(co_id):]
        nums = [int(n) for n in re.findall(r'\d+', rest)]
        if not nums:
            continue

        target = next((item for item in data["assessmentWeight"]
                       if item["co"] == co_id), None)
        if target is None:
            continue

        if len(nums) >= 11:
            target.update({
                "q1": nums[0], "q2": nums[1], "q3": nums[2],
                "t1": nums[3], "t2": nums[4], "t3": nums[5],
                "a1": nums[6], "a2": nums[7],
                "see": nums[8], "cie": nums[9], "total": nums[10]
            })
        elif len(nums) >= 4:
            quiz_tot = nums[0]
            test_tot = nums[1]
            assign_tot = nums[2]
            if len(nums) >= 5:
                see_tot = nums[3]
                total = nums[4]
            elif len(nums) == 4:
                last = nums[3]
                mid_sum = quiz_tot + test_tot + assign_tot
                if last >= mid_sum:
                    see_tot = 0
                    total = last
                else:
                    see_tot = last
                    total = mid_sum + see_tot
            else:
                see_tot = 0
                total = quiz_tot + test_tot + assign_tot
            cie = quiz_tot + test_tot + assign_tot
            target.update({
                "q1": quiz_tot, "q2": 0, "q3": 0,
                "t1": test_tot, "t2": 0, "t3": 0,
                "a1": assign_tot, "a2": 0,
                "see": see_tot, "cie": cie,
                "total": total if total else cie + see_tot
            })
        elif len(nums) == 3:
            cie = nums[0] + nums[1]
            target.update({"q1": nums[0], "t1": nums[1],
                           "cie": cie, "total": nums[2] if nums[2] else cie})
        elif len(nums) == 2:
            target.update({"q1": nums[0], "total": nums[1]})
        elif len(nums) == 1:
            target.update({"total": nums[0]})


def process_outcome_rows(rows, data):
    if not rows:
        return

    matrix = []
    for row in rows:
        cleaned = [clean_text(str(c)) if c is not None else "" for c in row]
        if any(cleaned):
            matrix.append(cleaned)

    if len(matrix) < 2:
        return

    header = matrix[0]
    po_count = 1
    pso_count = 1
    for i, h in enumerate(header):
        hu = h.upper().strip()
        if hu in ("PO", "P0"):
            header[i] = f"PO{po_count}"
            po_count += 1
        elif hu in ("PS", "PSO"):
            header[i] = f"PSO{pso_count}"
            pso_count += 1
        elif re.match(r'^PO$', hu):
            header[i] = f"PO{po_count}"
            po_count += 1

    max_len = max(len(r) for r in matrix)
    for r in matrix:
        while len(r) < max_len:
            r.append("")

    data["outcomeMap"]["matrix"] = matrix
    data["outcomeMap"]["raw"] = "\n".join("\t".join(r) for r in matrix)


# ─────────────────────────────────────────────
# FALLBACK TEXT-BASED OUTCOME MAP
# ─────────────────────────────────────────────

def fallback_parse_outcome_map(full_text, data):
    if data["outcomeMap"]["matrix"]:
        return

    pattern = re.compile(
        r'(?:Outcome\s+Map[:\s]*)?(COs?\s+PO.*?)\n(.*?)(?=\n\s*2\.4|\nCourse\s+Content|\n3\.)',
        re.IGNORECASE | re.DOTALL
    )
    m = pattern.search(full_text)
    if not m:
        return

    headers = re.split(r'\s+', m.group(1).strip())
    matrix = [headers]
    for line in m.group(2).strip().splitlines():
        line = line.strip()
        if re.match(r'^CO\d+', line, re.IGNORECASE):
            matrix.append(re.split(r'\s+', line))

    if len(matrix) >= 2:
        max_len = max(len(r) for r in matrix)
        for r in matrix:
            while len(r) < max_len:
                r.append("")
        data["outcomeMap"]["matrix"] = matrix
        data["outcomeMap"]["raw"] = "\n".join("\t".join(r) for r in matrix)


# ─────────────────────────────────────────────
# REGEX-BASED FREE-TEXT SECTION EXTRACTORS
# ─────────────────────────────────────────────

def _section(full_text, start_pattern, end_pattern,
             flags=re.IGNORECASE | re.DOTALL):
    m = re.search(start_pattern + r'\s*(.*?)(?=' + end_pattern + r')',
                  full_text, flags)
    return m.group(1) if m else ""


def extract_rich_sections(full_text, data):
    # 2.1 Aims
    raw = _section(full_text,
                   r'2\.1\s+Course\s+Aims\s+and\s+Summary',
                   r'2\.2\s+Course\s+Objectives|Course\s+Objectives')
    if not raw:
        raw = _section(full_text,
                       r'Course\s+Aims\s+and\s+Summary',
                       r'Course\s+Objectives|2\.2')
    data["aimsSummary"] = format_bullets_to_html(raw)

    # 2.2 Objectives
    raw = _section(full_text,
                   r'2\.2\s+Course\s+Objectives|Course\s+Learning\s+Objectives',
                   r'2\.3\s+Course\s+Outcomes|Course\s+Outcomes')
    if not raw:
        raw = _section(full_text,
                       r'Course\s+Objectives',
                       r'Course\s+Outcomes|2\.3')
    data["objectives"] = format_bullets_to_html(raw)

    # 2.4 Course Content
    raw = _section(full_text,
                   r'2\.4\s+Course\s+Content',
                   r'2\.5\s+Course\s+Resources|Course\s+Resources|3\.\s*Teaching')
    if not raw:
        raw = _section(full_text,
                       r'Course\s+Content',
                       r'Course\s+Resources|2\.5|3\.\s*Teaching')
    data["courseContent"] = format_bullets_to_html(raw)

    # 3.3 / 3.4 Grading Criterion
    raw = _section(full_text,
                   r'(?:3\.4|3\.3)\s+Grading\s+Criterion',
                   r'Attainment\s+Calculations|Recording\s+Marks|4\.\s*Other')
    if not raw:
        raw = _section(full_text,
                       r'Grading\s+Criterion',
                       r'Attainment|Recording\s+Marks|4\.\s*Other')
    data["gradingCriterion"] = format_bullets_to_html(raw)

    # 4.1 Assignment Details
    raw = _section(full_text,
                   r'4\.1\s+Assignment\s+Details.*?(?:Learning)?:?',
                   r'4\.2\s+Academic|Academic\s+Integrity')
    if not raw:
        raw = _section(full_text,
                       r'Assignment\s+Details\s+or\s+Problem\s+Based\s+Learning:?',
                       r'Academic\s+Integrity')
    data["otherDetails"]["assignmentDetails"] = clean_text(raw)

    # 4.2 Academic Integrity
    raw = _section(full_text,
                   r'(?:4\.2\s+)?Academic\s+Integrity\s+Policy:?',
                   r'\Z')
    data["otherDetails"]["academicIntegrity"] = clean_text(raw)


def extract_course_outcomes(full_text, data):
    """
    Extract CO code + description from free text when the table parser
    found nothing. Must run BEFORE build_course_outcomes_html so that
    the HTML is built from real data.
    """
    if data["courseOutcomes"]:
        return  # already populated by table parser

    m = re.search(
        r'(?:2\.3\s+)?Course\s+Outcomes.*?(.*?)(?=Outcome\s+Map|2\.4\s+Course)',
        full_text, re.IGNORECASE | re.DOTALL)
    if not m:
        return
    block = m.group(1)
    matches = re.findall(
        r'(CO\d+)\s+(.*?)(?=CO\d+|\Z)', block, re.IGNORECASE | re.DOTALL)
    for code, desc in matches:
        cleaned = clean_text(desc)
        if cleaned:
            data["courseOutcomes"].append({
                "code":        code.strip().upper(),
                "description": cleaned,
                "mapping":     {}
            })


def extract_resources(full_text, data):
    def split_bullets(text):
        items = re.split(r'\s*[•●▪\-]\s*|\n\s*\d+\.\s+|\n{2,}', text)
        return [clean_text(i) for i in items if len(clean_text(i)) > 8]

    m = re.search(
        r'Text\s*Books?:?\s*(.*?)(?=References?:|Other\s+Resources|3\.\s*Teaching|\n3\.)',
        full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data["resources"]["textBooks"] = split_bullets(m.group(1))

    m = re.search(
        r'References?:?\s*(.*?)(?=Other\s+Resources|3\.\s*Teaching|\n3\.)',
        full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data["resources"]["references"] = split_bullets(m.group(1))

    m = re.search(
        r'Other\s+Resources:?\s*(.*?)(?=3\.\s*Teaching|\n3\.|\nTeaching)',
        full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data["resources"]["otherResources"] = split_bullets(m.group(1))


def extract_total_hours_fallback(full_text, data):
    if data["totalHours"] == 0:
        m = re.search(
            r'Total\s+Term/?\s*Semester\s+hours?:?\s*(\d+)',
            full_text, re.IGNORECASE)
        if m:
            data["totalHours"] = safe_int(m.group(1))


# ─────────────────────────────────────────────
# TABLE CLASSIFIER HELPERS
# ─────────────────────────────────────────────

def _is_recording_marks_table(all_cells_text):
    markers = ("s. no", "s.no", "usn", "student name",
               "marks scored", "grade obtained", "marks\nscored")
    return any(m in all_cells_text for m in markers)


def _is_attainment_targets_table(all_cells_text):
    return (
        "attainment of course outcomes" in all_cells_text or
        "outcomes- targeted" in all_cells_text or
        "targeted attainment level" in all_cells_text or
        ("attainment" in all_cells_text and "outcomes" in all_cells_text
         and "targeted" in all_cells_text)
    )


# ─────────────────────────────────────────────
# SINGLE CD PARSER  (state machine over tables)
# ─────────────────────────────────────────────

def parse_single_cd(pages_text, all_tables):
    data = make_empty_cd()
    full_text = "\n".join(pages_text)

    current_section = None
    teaching_rows = []
    assessment_rows = []
    outcome_rows = []
    recording_marks_rows = []
    attainment_tgt_rows = []

    for table in all_tables:
        if not table or not table[0]:
            continue

        all_cells = " ".join(
            str(c).lower().strip() for row in table for c in row if c
        )
        header_cells = [str(c).lower().strip() for c in table[0] if c]
        header_text = " ".join(header_cells)

        # ── Recording Marks ───────────────────────────────────────────────
        if _is_recording_marks_table(all_cells):
            recording_marks_rows.extend(table)
            current_section = "recording_marks"
            continue

        # ── Attainment Targets ────────────────────────────────────────────
        if _is_attainment_targets_table(all_cells):
            attainment_tgt_rows.extend(table)
            current_section = "attainment_targets"
            continue

        # ── Identity / Metadata ───────────────────────────────────────────
        if ("course code" in header_text or
                "program title" in header_text or
                "school code" in header_text):
            parse_metadata_table(table, data)
            current_section = "metadata"
            continue

        # ── Credits ───────────────────────────────────────────────────────
        if ("credits" in header_text and
                any(h in header_cells for h in ("l", "t", "p"))):
            parse_credits_table(table, data)
            current_section = "credits"
            continue

        # ── Outcome Map ───────────────────────────────────────────────────
        is_outcome = (
            re.search(r'\bco[s]?\s', header_text) and
            re.search(r'\bpo\b|\bpo\d', header_text)
        ) or "outcome map" in header_text
        if is_outcome:
            outcome_rows.extend(table)
            current_section = "outcome"
            continue

        # ── Assessment Weight ─────────────────────────────────────────────
        is_assessment = (
            ("quiz" in header_text and ("test" in header_text or "see" in header_text)) or
            ("weight" in header_text and "outcome" in header_text) or
            ("co" in header_cells and "quiz" in header_text)
        )
        if is_assessment:
            assessment_rows.extend(table)
            current_section = "assessment"
            continue

        # ── Teaching Schedule ─────────────────────────────────────────────
        is_teaching = (
            ("lecture" in header_text and "topic" in header_text) or
            ("lecture" in header_text and "number" in header_text)
        )
        if is_teaching:
            teaching_rows.extend(table)
            current_section = "teaching"
            continue

        # ── Multi-page continuation ───────────────────────────────────────
        if current_section == "outcome":
            outcome_rows.extend(table)
        elif current_section == "assessment":
            assessment_rows.extend(table)
        elif current_section == "teaching":
            teaching_rows.extend(table)
        elif current_section == "recording_marks":
            recording_marks_rows.extend(table)
        elif current_section == "attainment_targets":
            attainment_tgt_rows.extend(table)

    # ── PROCESS STRUCTURED TABLE DATA ─────────────────────────────────────
    process_teaching_rows(teaching_rows, data)
    process_assessment_rows(assessment_rows, data)
    process_outcome_rows(outcome_rows, data)
    fallback_parse_outcome_map(full_text, data)

    # ── FREE-TEXT SECTIONS ─────────────────────────────────────────────────
    # Must run before HTML builders so courseOutcomes is fully populated
    extract_rich_sections(full_text, data)
    extract_course_outcomes(full_text, data)
    extract_resources(full_text, data)
    extract_total_hours_fallback(full_text, data)

    # ── GENERATE ALL HTML TABLE STRINGS (Jodit-rendered) ──────────────────
    #
    #  2.3 Course Outcomes
    data["courseOutcomesHtml"] = build_course_outcomes_html(
        data["courseOutcomes"])

    #  Outcome Map  (CO × PO/PSO grid)
    data["outcomeMapHtml"] = build_outcome_map_html(
        data["outcomeMap"]["matrix"])

    #  3.2 Assessment Weight Distribution (exact reference image format)
    data["assessmentWeightHtml"] = build_assessment_weight_html(
        data["assessmentWeight"])

    #  Attainment Calculations
    data["attainmentCalculations"]["recordingMarks"] = (
        build_recording_marks_html(recording_marks_rows)
        if recording_marks_rows else _default_recording_marks_html()
    )
    data["attainmentCalculations"]["settingTargets"] = (
        build_attainment_targets_html(attainment_tgt_rows)
        if attainment_tgt_rows else _default_attainment_targets_html()
    )

    return data


# ─────────────────────────────────────────────
# MULTI-CD BOUNDARY DETECTOR
# ─────────────────────────────────────────────

CD_START_RE = re.compile(
    r'(?:^|\n)\s*([A-Z0-9]{6,12})\s+Course\s+Document',
    re.IGNORECASE | re.MULTILINE
)


def find_cd_boundaries(pages_text):
    boundaries = []
    for i, text in enumerate(pages_text):
        m = CD_START_RE.search(text)
        if m:
            boundaries.append((i, m.group(1).upper()))
    return boundaries


# ─────────────────────────────────────────────
# TOP-LEVEL PDF PARSER
# ─────────────────────────────────────────────

def parse_cd_pdf(file_path):
    try:
        with pdfplumber.open(file_path) as pdf:
            pages_text = []
            pages_tables = []
            for page in pdf.pages:
                pages_text.append(page.extract_text() or "")
                tables = page.extract_tables({
                    "vertical_strategy":   "lines_strict",
                    "horizontal_strategy": "lines_strict",
                    "snap_tolerance":      3,
                    "join_tolerance":      3,
                })
                if not tables:
                    tables = page.extract_tables() or []
                pages_tables.append(tables)

        boundaries = find_cd_boundaries(pages_text)

        # ── Single CD ─────────────────────────────────────────────────────
        if not boundaries:
            all_tables = [t for pt in pages_tables for t in pt]
            parsed = parse_single_cd(pages_text, all_tables)
            return {
                "success":    True,
                "message":    "Single CD parsed (no boundaries detected)",
                "parsedData": [parsed]
            }

        # ── Multi-CD ──────────────────────────────────────────────────────
        boundaries.append((len(pages_text), "EOF"))
        cd_list = []

        for idx in range(len(boundaries) - 1):
            start_page = boundaries[idx][0]
            end_page = boundaries[idx + 1][0]
            course_code_hint = boundaries[idx][1]

            chunk_text = pages_text[start_page:end_page]
            chunk_tables = [
                t for pt in pages_tables[start_page:end_page] for t in pt]

            parsed = parse_single_cd(chunk_text, chunk_tables)
            if not parsed.get("courseCode"):
                parsed["courseCode"] = course_code_hint

            if parsed.get("courseCode") or parsed.get("courseTitle"):
                cd_list.append(parsed)

        return {
            "success":    True,
            "message":    f"Successfully parsed {len(cd_list)} Course Document(s).",
            "parsedData": cd_list
        }

    except Exception as e:
        import traceback
        return {
            "success":    False,
            "message":    f"Parser error: {str(e)}",
            "trace":      traceback.format_exc(),
            "parsedData": []
        }


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps(
            {"success": False, "message": "No file path provided"}))
        sys.exit(1)

    fp = sys.argv[1]
    if not Path(fp).exists():
        print(json.dumps(
            {"success": False, "message": f"File not found: {fp}"}))
        sys.exit(1)

    result = parse_cd_pdf(fp)
    print(json.dumps(result, indent=2, ensure_ascii=False))
