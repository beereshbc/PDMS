"""
parser_2026.py — PD Schema 2026 (Merged / Dynamic) extraction engine.

Rewritten from scratch against the real layout of GM University's 2026-scheme
Program Document (verified against CS_PD_2026_14-05-2026_V8.pdf, 19 pages).

Design decision: pdfplumber's `extract_tables()` is unreliable on this PDF —
there are no ruled table borders, columns are whitespace-aligned, and rows
routinely wrap onto multiple physical lines (e.g. a course title that's too
long spills its credit value onto a *separate* line; elective-group blocks
share one credit value across 5 course rows). Table-strategy extraction
produces ragged, empty-row-padded output that is harder to clean than the
problem it solves.

Instead this parser works directly on `page.extract_text()`, line by line,
using a state machine anchored on the document's numbered section headings
(10. Program Overview, 11. PEOs, 12. POs, 13. PSOs, 14. Courses and Credits,
15. Technical Competency Courses, 16. Program Delivery, 17. Teaching Methods,
18. Attendance, 19. Assessment and Grading, 20. Award of Degree,
21. Student Support, 22. Quality Control). Numbered headings are the one
structural element that stays consistent across revisions of this template,
so every section boundary is anchored on "<int> <Heading Text>" rather than
on fragile multi-line regex lookaheads.

Returns the exact JSON shape the React frontend (CreatePD.jsx / BLANK_PD_DATA)
expects. Every field is defensively defaulted so a partially-parseable PDF
still produces a usable, frontend-safe structure rather than throwing.
"""

import re
from typing import Dict, Any, List, Optional, Tuple

import pdfplumber


# ════════════════════════════════════════════════════════════════════════
# § 1. GENERIC HELPERS
# ════════════════════════════════════════════════════════════════════════

def clean_text(text: str) -> str:
    """Collapse whitespace/newlines into single spaces and strip."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def safe_int(val, default: int = 0) -> int:
    """Extract the first integer found in val; falls back to default."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        try:
            return int(val)
        except (ValueError, TypeError):
            return default
    m = re.search(r"-?\d+", str(val))
    return int(m.group()) if m else default


def roman_to_int(s: str) -> int:
    """Converts roman numerals (or plain digits) like 'IV'/'4' to int."""
    s = str(s).upper().strip()
    if s.isdigit():
        return int(s)
    rom_val = {"I": 1, "V": 5, "X": 10}
    total = 0
    for i, ch in enumerate(s):
        v = rom_val.get(ch, 0)
        if i > 0 and v > rom_val.get(s[i - 1], 0):
            total += v - 2 * rom_val.get(s[i - 1], 0)
        else:
            total += v
    return total if total > 0 else 0


def extract_numbered_or_bulleted_items(block: str) -> List[str]:
    """
    Pulls list items out of a free-text block. Handles '1. text', '- text',
    '* text', and bare-line lists (one item per line) as a fallback.
    """
    if not block:
        return []
    block = block.strip()
    # Try explicit numbering/bullets first ("1. xxx", "12. 12. xxx" dedup-safe)
    items = re.split(r"\n?\s*\d+\.\s+", "\n" + block)
    items = [clean_text(i) for i in items if len(clean_text(i)) > 2]
    if len(items) > 1:
        # de-duplicate accidental "12. 12. Technical Competitions" artifacts
        deduped = []
        for it in items:
            it = re.sub(r"^(\d+\.\s*)+", "", it).strip()
            if it:
                deduped.append(it)
        return deduped
    # Fallback: bullet markers
    items = re.split(r"\n\s*[-*•]\s+", "\n" + block)
    items = [clean_text(i) for i in items if len(clean_text(i)) > 2]
    if len(items) > 1:
        return items
    # Fallback: one sentence/line per item
    lines = [clean_text(l) for l in block.split("\n") if clean_text(l)]
    return lines if lines else [clean_text(block)]


# ════════════════════════════════════════════════════════════════════════
# § 2. NUMBERED-SECTION SPLITTER (the structural backbone)
# ════════════════════════════════════════════════════════════════════════

# Canonical numbered headings as they appear in the 2026 template. Matching
# is done per-page-line so headings split across lines (rare) still anchor
# correctly via lookahead on the *next* heading rather than exact phrasing.
SECTION_HEADING_PATTERNS = [
    (10, r"Program\s+Overview"),
    (11, r"Program\s+Educational\s+Objectives"),
    (12, r"Program\s+Outcomes\b"),
    (13, r"Program\s+Specific\s+Outcomes"),
    (14, r"Courses\s+and\s+Credits"),
    (15, r"(?:List\s+of\s+)?Technical\s+Competency\s+Courses"),
    (16, r"Program\s+Delivery(?:\s+and\s+Attainment)?"),
    (17, r"Teaching\s+and\s+Learning\s+Methods"),
    (18, r"Attendance\b"),
    (19, r"Assessment\s+and\s+Grading"),
    (20, r"Award\s+of(?:\s+the)?\s+Degree"),
    (21, r"Student\s+Support(?:\s+for\s+Learning)?"),
    (22, r"Quality\s+Control\s+Measures"),
]


def locate_numbered_sections(full_text: str) -> Dict[int, Tuple[int, int]]:
    """
    Finds the character-offset span of each numbered section in the full
    concatenated document text. A heading line looks like:
        "10 Program Overview"  or  "16 Program Delivery and Attainment"
    Returns {section_no: (start_offset, end_offset)} where end_offset is the
    start of the next located heading (or end of text for the last one).
    """
    found: List[Tuple[int, int, int]] = []  # (section_no, start, header_end)
    for sec_no, pattern in SECTION_HEADING_PATTERNS:
        # Heading must be at the start of a line: "<digits> <Pattern>"
        m = re.search(
            rf"(?m)^\s*{sec_no}\s+(?={pattern})", full_text
        )
        if not m:
            # Some pages render the number stuck to text without space oddities;
            # try a looser variant allowing the heading anywhere near line start.
            m = re.search(rf"(?m)^\s*{sec_no}\s*{pattern}", full_text)
        if m:
            found.append((sec_no, m.start(), m.end()))

    found.sort(key=lambda x: x[1])
    spans: Dict[int, Tuple[int, int]] = {}
    for idx, (sec_no, start, _header_end) in enumerate(found):
        end = found[idx + 1][1] if idx + 1 < len(found) else len(full_text)
        spans[sec_no] = (start, end)
    return spans


def get_section_text(full_text: str, spans: Dict[int, Tuple[int, int]], sec_no: int) -> str:
    if sec_no not in spans:
        return ""
    start, end = spans[sec_no]
    text = full_text[start:end]
    # Strip the leading "<num> <Heading words>" line itself
    text = re.sub(r"^\s*\d+\s+[^\n]*\n", "", text, count=1)
    return text.strip()


# ════════════════════════════════════════════════════════════════════════
# § 3. METADATA (program details, award block)
# ════════════════════════════════════════════════════════════════════════

def parse_metadata_2026(full_text: str, data: Dict[str, Any]) -> None:
    """Extracts the PROGRAM DETAILS numbered block (items 1-9) plus header."""

    # Program name: "B.Tech. - Computer Science & Engineering" cover/header line,
    # or the numbered "1 Title of the Award  B.Tech. in X" row (more authoritative).
    title_m = re.search(
        r"(?i)Title of the Award\s+(B\.?\s?Tech\.?,?\s*(?:in\s*)?.+?)(?:\n|\s{2,}\d|$)",
        full_text,
    )
    if title_m:
        title = clean_text(title_m.group(1))
        data["award"]["title"] = title
        # Strip leading "B.Tech." / "B.Tech.," / "B.Tech. in" to isolate program name
        prog_name = re.sub(
            r"(?i)^B\.?\s?Tech\.?,?\s*(in\s*)?", "", title).strip()
        if prog_name:
            data["details"]["program_name"] = prog_name
    else:
        cover_m = re.search(r"(?i)B\.\s?Tech\.?\s*[-,]\s*(.+)", full_text)
        if cover_m:
            prog_name = clean_text(cover_m.group(1))
            data["details"]["program_name"] = prog_name
            data["award"]["title"] = f"B.Tech. in {prog_name}"

    # Faculty — "Faculty <Name> (ABBR)" or "Faculty of <Name>"
    fac_m = re.search(
        r"(?i)Faculty\s+(?:of\s+)?(.+?)(?:\n|(?=School))", full_text
    )
    if fac_m:
        data["details"]["faculty"] = clean_text(fac_m.group(1))

    # School — "School School of X (ABBR)" pattern (label repeats the word)
    sch_m = re.search(
        r"(?i)School\s+(School of .+?)(?:\n|(?=Department))", full_text
    )
    if sch_m:
        data["details"]["school"] = clean_text(sch_m.group(1))
    else:
        sch_m2 = re.search(
            r"(?i)School\s+(.+?)(?:\n|(?=Department))", full_text)
        if sch_m2:
            data["details"]["school"] = clean_text(sch_m2.group(1))

    # Department
    dept_m = re.search(
        r"(?i)Department\s+(.+?)(?:\n|(?=Program\b))", full_text)
    if dept_m:
        data["details"]["department"] = clean_text(dept_m.group(1))

    # Director of School
    dir_m = re.search(
        r"(?i)Director of (?:the )?School\s+(Dr\.?.+?|Prof\.?.+?|Mr\.?.+?|Ms\.?.+?|[A-Z].+?)(?:\n|(?=Head))",
        full_text,
    )
    if dir_m:
        data["details"]["director"] = clean_text(dir_m.group(1))

    # Head of the Department
    hod_m = re.search(
        r"(?i)Head of the\s*\n?\s*Department\s+(.+?)(?:\n|(?=\d+\s+Title))",
        full_text,
    )
    if hod_m:
        data["details"]["hod"] = clean_text(hod_m.group(1))

    # --- Numbered award rows (2-9) ---
    field_patterns = {
        "mode": r"(?i)\d\s*Modes? of Study\s+(.+?)(?:\n|(?=\d\s))",
        "awarding_body": r"(?i)\d\s*Awarding Institution\s*/?\s*Body\s+(.+?)(?:\n|(?=\d\s))",
        "joint_award": r"(?i)\d\s*Joint Award\s+(.+?)(?:\n|(?=\d\s))",
        "teaching_institution": r"(?i)\d\s*Teaching Institution\s+(.+?)(?:\n|(?=\d\s))",
        "date_program_specs": r"(?i)\d\s*Date of Program Specifications\s+(.+?)(?:\n|(?=\d\s))",
        "date_approval": r"(?i)\d\s*Date of Course Approval.*?\n?\s*(.+?)(?:\n|(?=\d\s))",
        "next_review": r"(?i)Next Review Date:?\s*(.+?)(?:\n|(?=\d\s))",
        "benchmark": r"(?i)\d\s*Program Benchmark\s+(.+?)(?:\n|(?=\d\s|10\s))",
    }
    for field, pattern in field_patterns.items():
        m = re.search(pattern, full_text)
        if m:
            data["award"][field] = clean_text(m.group(1))


# ════════════════════════════════════════════════════════════════════════
# § 4. OVERVIEW / PEOs / POs / PSOs  (sections 10-13)
# ════════════════════════════════════════════════════════════════════════

def parse_outcomes_2026(full_text: str, spans: Dict[int, Tuple[int, int]], data: Dict[str, Any]) -> None:
    # --- 10. Program Overview ---
    overview_text = get_section_text(full_text, spans, 10)
    if overview_text:
        data["overview"] = clean_text(overview_text)

    # --- 11. PEOs ---
    peo_text = get_section_text(full_text, spans, 11)
    if peo_text:
        # Drop the "The Program Educational Objectives include:" lead-in line if present
        peo_text = re.sub(
            r"(?i)^The Program Educational Objectives include:?\s*", "", peo_text.strip())
        peos = re.findall(
            r"(PEO-\d+\s*:.*?)(?=PEO-\d+\s*:|\Z)", peo_text, re.DOTALL)
        cleaned = [clean_text(p) for p in peos if len(clean_text(p)) > 10]
        if cleaned:
            data["peos"] = cleaned

    # --- 12. POs ---
    po_text = get_section_text(full_text, spans, 12)
    if po_text:
        pos = re.findall(r"(PO-\d+\s*:.*?)(?=PO-\d+\s*:|\Z)",
                         po_text, re.DOTALL)
        cleaned = [clean_text(p) for p in pos if len(clean_text(p)) > 10]
        if cleaned:
            data["pos"] = cleaned

    # --- 13. PSOs ---
    pso_text = get_section_text(full_text, spans, 13)
    if pso_text:
        pso_text = re.sub(
            r"(?i)^Upon completion of the program, graduates will have the capability to:?\s*",
            "",
            pso_text.strip(),
        )
        psos = re.findall(
            r"(PSO-\d+\s*:.*?)(?=PSO-\d+\s*:|\Z)", pso_text, re.DOTALL)
        cleaned = [clean_text(p) for p in psos if len(clean_text(p)) > 10]
        if cleaned:
            data["psos"] = cleaned


# ════════════════════════════════════════════════════════════════════════
# § 5. CREDIT DEFINITION + PROGRAMME STRUCTURE TABLE  (section 14, part A)
# ════════════════════════════════════════════════════════════════════════

CODE_TOKEN_RE = re.compile(r"\b[A-Z]{2,6}\d{2}[A-Z]{2,6}(?:\d{1,3}|XX)\b")


def parse_credit_definition(full_text: str, data: Dict[str, Any]) -> None:
    l_m = re.search(
        r"(?i)Lecture\s*\(L\)\s*per week\s*(\d+)\s*Credit", full_text)
    t_m = re.search(
        r"(?i)Tutorial\s*\(T\)\s*per week\s*(\d+)\s*Credit", full_text)
    p_m = re.search(
        r"(?i)Practical\s*\(P\)\s*per week\s*(\d+)\s*Credit", full_text)
    if l_m:
        data["credit_def"]["L"] = safe_int(l_m.group(1))
    if t_m:
        data["credit_def"]["T"] = safe_int(t_m.group(1))
    if p_m:
        data["credit_def"]["P"] = safe_int(p_m.group(1))


def parse_structure_table(full_text: str, data: Dict[str, Any]) -> None:
    """
    Parses the 'Program - Category | Credits' summary table (page 7 in the
    sample). Lines look like:
        "1 Program-Core Courses, Elective Courses, Open Electives 130"
        "2 Technical Skills 10 (CS26TSCSXX)"
        "Competency and Skills"               <- group label, no row number
    We capture: leading int (row no, ignored for output) + trailing credit
    number (+ optional trailing course-code in parens) + everything between
    as the category label. Group-label-only lines (no numbers) are skipped
    as they're section dividers, not data rows — UNLESS the row number+text
    is split across two physical lines (e.g. "Competitive Learning" \n
    "4 2 (CS26SACLXX)"), which we recombine via lookahead.
    """
    m = re.search(
        r"(?i)Program\s*-\s*Category\s+Credits(.*?)(?=Total\s+130|\n\d+\.\s*Courses and Credits|\Z)",
        full_text,
        re.DOTALL,
    )
    if not m:
        return
    block = m.group(1)
    raw_lines = [l.strip() for l in block.split("\n") if l.strip()]

    rows: List[Dict[str, Any]] = []
    pending_label: Optional[str] = None

    row_re = re.compile(r"^(\d+)\s+(.*?)\s+(\d+)\s*(\([A-Z0-9]+\))?\s*$")
    # Variant where number+credit are together but label was on the prior line
    split_credit_re = re.compile(r"^(\d+)\s+(\d+)\s*(\([A-Z0-9]+\))?\s*$")

    for line in raw_lines:
        if line.lower().startswith("no.") or line.lower() == "academic":
            continue
        rm = row_re.match(line)
        if rm:
            label = clean_text(rm.group(2))
            code_paren = rm.group(4) or ""
            code = code_paren.strip("()")
            rows.append({
                "category": label,
                "credits": safe_int(rm.group(3)),
                "code": code,
            })
            pending_label = None
            continue
        sm = split_credit_re.match(line)
        if sm and pending_label:
            code_paren = sm.group(3) or ""
            rows.append({
                "category": pending_label,
                "credits": safe_int(sm.group(2)),
                "code": code_paren.strip("()"),
            })
            pending_label = None
            continue
        # Otherwise: this is a bare category-group label line (e.g.
        # "Competency and Skills" or "Competitive Learning") — remember it
        # in case the next line is a split number+credit row, but also keep
        # group dividers like "Competency and Skills" out of the final rows.
        if not re.match(r"(?i)^(Academic|Competency and Skills|Professional Skills|Sports, Culture and Environment)$", line):
            pending_label = line
        else:
            pending_label = None

    if rows:
        data["structure_table"] = rows


# ════════════════════════════════════════════════════════════════════════
# § 6. SEMESTER COURSES  (section 14, part B) — line-based state machine
# ════════════════════════════════════════════════════════════════════════

CATEGORY_DIVIDER_LINES = {
    "academic",
    "competency and skills",
    "professional skills",
    "sports, culture and environment",
}

# Lines that are pure noise in the course-table region
NOISE_LINE_RE = re.compile(
    r"^(s\.?\s*no\.?\s*course code\s*course title\s*credits|page\s*\|\s*\d+|note:.*)$",
    re.IGNORECASE,
)


def _infer_course_type(title: str) -> str:
    t = title.lower()
    if "lab" in t or "practical" in t or "practice" in t:
        return "Lab"
    if "internship" in t or "dissertation" in t or "project" in t:
        return "Project"
    return "Theory"


def _category_for(divider: str) -> str:
    mapping = {
        "academic": "Academic",
        "competency and skills": "Competency and Skills",
        "professional skills": "Professional Skills",
        "sports, culture and environment": "Sports, Culture and Environment",
    }
    return mapping.get(divider, "Academic")


def _parse_semester_block(sem_no: int, block_text: str) -> Dict[str, Any]:
    """
    Parses one semester's course block into the {sem_no, courses: [],
    categories: [{categoryName, totalCategoryCredits, courses: []}]} shape.
    Handles three line shapes seen in the source PDF:
      A) "<no> <CODE> <Title...> <credits>"                (normal row)
      B) "<group label like 'Professional Elective-1'>"     (elective header)
         followed by several "<CODE> <Title>" lines (no number/credit), then
         a final "<no> <CODE> <Title> <credits>" line closing the group —
         all of those courses share that single trailing credit value.
      C) "<no> <CODE> <Title>" / "<credits>" split across two lines because
         the title wrapped (e.g. Semester-1's Competitive Learning row).
    """
    lines = [l.strip() for l in block_text.split("\n") if l.strip()]
    lines = [l for l in lines if not NOISE_LINE_RE.match(l)]

    categories: List[Dict[str, Any]] = []
    current_cat_name = "Academic"

    def get_or_create_cat(name: str) -> Dict[str, Any]:
        for c in categories:
            if c["categoryName"] == name:
                return c
        c = {"categoryName": name, "totalCategoryCredits": 0, "courses": []}
        categories.append(c)
        return c

    # (code, title) awaiting shared credit
    pending_group_courses: List[Tuple[str, str]] = []
    pending_group_active = False

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        low = line.lower()

        # Divider lines switch the active category
        if low in CATEGORY_DIVIDER_LINES:
            current_cat_name = _category_for(low)
            i += 1
            continue

        # "Total <n>" / "Overall <n>" — informational only, skip
        if re.match(r"(?i)^(total|overall)\s+\d", line):
            i += 1
            continue

        # Elective group header, e.g. "Professional Elective-1"
        elective_header_m = re.match(
            r"(?i)^(Professional|Open)\s+Elective[-\s]?(\d+)\s*$", line)
        if elective_header_m:
            pending_group_courses = []
            pending_group_active = True
            group_label = clean_text(line)
            i += 1
            continue

        # Bare "<CODE> <Title>" line with no leading number, no trailing credit
        # — this is an elective-option row inside an active group.
        bare_code_title_m = re.match(
            rf"^({CODE_TOKEN_RE.pattern})\s+(.+?)\s*$", line
        )
        if pending_group_active and bare_code_title_m and not re.search(r"\d+\s*$", line.split()[-1]):
            code = bare_code_title_m.group(1).upper()
            title = clean_text(bare_code_title_m.group(2))
            # Guard: title must not itself end in a bare integer (that would mean
            # this is actually the group-closing row, handled below instead)
            if not re.match(r".*\s\d+$", title):
                pending_group_courses.append((code, title))
                i += 1
                continue

        # Standard numbered row: "<no> <CODE> <Title...> <credits>"
        std_m = re.match(
            rf"^(\d+)\s+({CODE_TOKEN_RE.pattern})\s+(.+?)\s+(\d+)\s*$", line
        )
        if std_m:
            code = std_m.group(2).upper()
            title = clean_text(std_m.group(3))
            credits = safe_int(std_m.group(4))

            # If a pending elective group is open, this numbered row is the
            # group's *last* option and also carries the shared credit value.
            if pending_group_active:
                pending_group_courses.append((code, title))
                cat = get_or_create_cat(current_cat_name)
                for gc_code, gc_title in pending_group_courses:
                    cat["courses"].append({
                        "code": gc_code,
                        "title": gc_title,
                        "credits": credits,
                        "type": _infer_course_type(gc_title),
                        "category": "Professional Elective",
                    })
                pending_group_courses = []
                pending_group_active = False
            else:
                cat = get_or_create_cat(current_cat_name)
                cat["courses"].append({
                    "code": code,
                    "title": title,
                    "credits": credits,
                    "type": _infer_course_type(title),
                    "category": current_cat_name,
                })
            i += 1
            continue

        # Split row: "<no> <CODE> <Title (wrapped, no credit yet)>" then next
        # line is "(parenthetical continuation)" then a following line has the
        # lone credit number, e.g. Semester-1's Competitive Learning case:
        #   "8 CS26SACLXX 0"
        #   "(Seminar/Conference/Exhibition/Technical Competition)"
        # Here credit 0 already appears on the first line, so the std_m regex
        # above actually catches it ("8 CS26SACLXX 0" -> code, title="", credit
        # wrongly...). Guard with a dedicated pattern: "<no> <CODE> <credit>"
        # with title on the FOLLOWING line in parentheses.
        no_title_m = re.match(
            rf"^(\d+)\s+({CODE_TOKEN_RE.pattern})\s+(\d+)\s*$", line)
        if no_title_m:
            code = no_title_m.group(2).upper()
            credits = safe_int(no_title_m.group(3))
            title = ""
            if i + 1 < n:
                nxt = lines[i + 1]
                if nxt.startswith("(") or not re.match(rf"^\d", nxt):
                    title = clean_text(nxt.strip("()"))
                    i += 1
            cat = get_or_create_cat(current_cat_name)
            cat["courses"].append({
                "code": code,
                "title": title or "Competitive Learning",
                "credits": credits,
                "type": _infer_course_type(title),
                "category": current_cat_name,
            })
            i += 1
            continue

        # Anything else (continuation text, stray notes) — ignore.
        i += 1

    # Compute per-category credit totals
    for cat in categories:
        cat["totalCategoryCredits"] = sum(
            c.get("credits", 0) for c in cat["courses"])

    return {"sem_no": sem_no, "courses": [], "categories": categories}


def parse_semesters_2026(full_text: str, data: Dict[str, Any]) -> None:
    """
    Splits section 14 ("Courses and Credits") into one block per
    "Semester-<n>" heading and parses each via _parse_semester_block.
    """
    # Find every "Semester-<n>" or "Semester <roman/int>" heading and its offset
    heading_re = re.compile(r"(?im)^Semester[\s-]*([IVX\d]+)\s*$")
    matches = list(heading_re.finditer(full_text))
    if not matches:
        return

    semesters: List[Dict[str, Any]] = []
    for idx, m in enumerate(matches):
        sem_no = roman_to_int(m.group(1))
        if sem_no <= 0 or sem_no > 12:
            continue
        start = m.end()
        end = matches[idx + 1].start() if idx + \
            1 < len(matches) else len(full_text)
        # Stop a semester block early if it bleeds into section 15+ heading
        cutoff_m = re.search(
            r"(?im)^\s*15\s+(?:List of )?Technical Competency Courses", full_text[start:end])
        block_text = full_text[start:start +
                               cutoff_m.start()] if cutoff_m else full_text[start:end]
        sem_obj = _parse_semester_block(sem_no, block_text)
        if sem_obj["categories"]:
            semesters.append(sem_obj)

    semesters.sort(key=lambda s: s["sem_no"])
    if semesters:
        data["semesters"] = semesters


# ════════════════════════════════════════════════════════════════════════
# § 7. TECHNICAL COMPETENCY COURSES  (section 15)
# ════════════════════════════════════════════════════════════════════════

def parse_technical_competency_courses(full_text: str, spans: Dict[int, Tuple[int, int]], data: Dict[str, Any]) -> None:
    block = get_section_text(full_text, spans, 15)
    if not block:
        return
    lines = [l.strip() for l in block.split("\n") if l.strip()]
    lines = [l for l in lines if not re.match(
        r"(?i)^(course\s*$|s\.?\s*no\.?.*course title.*credits.*resource|note:.*)", l)]

    courses: List[Dict[str, Any]] = []
    tech_code_re = re.compile(r"\bCS\d{2}TSCS\d{2}\b", re.IGNORECASE)

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        # Shape A: "<no> <CODE> <Title> <credits> <Resource>" all on one line
        m_full = re.match(
            rf"^(\d+)\s+({tech_code_re.pattern})\s+(.+?)\s+(\d+)\s+(\S+)\s*$", line
        )
        if m_full:
            courses.append({
                "code": m_full.group(2).upper(),
                "title": clean_text(m_full.group(3)),
                "credits": safe_int(m_full.group(4)),
                "resource": clean_text(m_full.group(5)),
            })
            i += 1
            continue

        # Shape B: "<CODE> <Title> <Resource>" then next line "<no> <credits>"
        #          and a continuation description line in between, e.g.:
        #   "CS26TSCS02 Burp Suite SDTCD"
        #   "2 2"
        #   "Web application penetration testing"
        m_code_first = re.match(
            rf"^({tech_code_re.pattern})\s+(.+?)\s+(\S+)\s*$", line
        )
        if m_code_first:
            code = m_code_first.group(1).upper()
            title_part = clean_text(m_code_first.group(2))
            resource = clean_text(m_code_first.group(3))
            credits = 2  # template default for technical competency courses
            desc = ""
            # Look ahead for "<no> <credits>" line
            if i + 1 < n and re.match(r"^\d+\s+\d+\s*$", lines[i + 1]):
                parts = lines[i + 1].split()
                credits = safe_int(parts[-1])
                i += 1
                # Look further for a trailing description line
                if i + 1 < n and not re.match(rf"^\d+\s+{tech_code_re.pattern}", lines[i + 1]) \
                        and not tech_code_re.match(lines[i + 1]):
                    desc = clean_text(lines[i + 1])
                    i += 1
            full_title = f"{title_part} — {desc}" if desc else title_part
            courses.append({
                "code": code,
                "title": full_title,
                "credits": credits,
                "resource": resource,
            })
            i += 1
            continue

        # Shape C: "<no> <CODE> <Title> <credits>" (no separate resource column
        # captured, e.g. wrapped lines) — fallback single-line match
        m_simple = re.match(
            rf"^(\d+)\s+({tech_code_re.pattern})\s+(.+?)\s+(\d+)\s*$", line)
        if m_simple:
            courses.append({
                "code": m_simple.group(2).upper(),
                "title": clean_text(m_simple.group(3)),
                "credits": safe_int(m_simple.group(4)),
                "resource": "",
            })
            i += 1
            continue

        i += 1

    if courses:
        data["section4"]["technicalCompetencyCourses"] = courses


# ════════════════════════════════════════════════════════════════════════
# § 8. SECTION 4 INSTITUTIONAL TEXT BLOCKS (sections 16-22)
# ════════════════════════════════════════════════════════════════════════

def parse_section4_text_blocks(full_text: str, spans: Dict[int, Tuple[int, int]], data: Dict[str, Any]) -> None:
    s4 = data["section4"]

    # 16. Program Delivery and Attainment — plain paragraph
    delivery = get_section_text(full_text, spans, 16)
    if delivery:
        s4["programDeliveryAndAttainment"] = clean_text(delivery)

    # 17. Teaching and Learning Methods — numbered list
    teaching = get_section_text(full_text, spans, 17)
    if teaching:
        # Drop the trailing free-text sentence that isn't numbered, keep it
        # appended as a final item rather than discarding it.
        items = extract_numbered_or_bulleted_items(teaching)
        if items:
            s4["teachingLearningMethods"] = items

    # 18. Attendance — plain paragraph
    attendance = get_section_text(full_text, spans, 18)
    if attendance:
        s4["attendance"] = clean_text(attendance)

    # 19. Assessment and Grading — paragraph + components table + grade rules
    assessment_block = get_section_text(full_text, spans, 19)
    if assessment_block:
        parse_assessment_grading(assessment_block, s4)

    # 20. Award of Degree — paragraph (includes Degree Certificate / Medals info)
    award_block = get_section_text(full_text, spans, 20)
    if award_block:
        s4["awardOfDegree"] = clean_text(award_block)

    # 21. Student Support — numbered list
    support_block = get_section_text(full_text, spans, 21)
    if support_block:
        items = extract_numbered_or_bulleted_items(support_block)
        if items:
            s4["studentSupport"] = items

    # 22. Quality Control Measures — numbered list
    quality_block = get_section_text(full_text, spans, 22)
    if quality_block:
        items = extract_numbered_or_bulleted_items(quality_block)
        if items:
            s4["qualityControlMeasures"] = items


def parse_assessment_grading(block: str, s4: Dict[str, Any]) -> None:
    """
    Parses section 19's three sub-parts:
      - intro description ("Every course will be assessed for a weight of 100...")
      - the Assessment Component / Weightage table
      - grading scale text -> gradeRules
      - passing criteria sentence -> passingCriteria
    """
    ag = s4["assessmentGrading"]

    # Components table: lines like "Quiz : 10% (2 Nos. of 5 marks each) 10%"
    component_lines = re.findall(
        r"^(.+?)\s*:\s*(\d+%)[^\n]*?(\d+%)\s*$", block, re.MULTILINE
    )
    components = []
    for name_part, _inline_pct, trailing_pct in component_lines:
        components.append({
            "name": clean_text(name_part),
            "weightage": safe_int(trailing_pct),
        })
    if components:
        ag["components"] = components

    # Description: everything before the "Assessment Component" table header,
    # i.e. the lead-in numbered points (1, 2).
    desc_m = re.search(
        r"^(.*?)(?=Assessment Component\s+Weightage)", block, re.DOTALL
    )
    if desc_m:
        desc_items = extract_numbered_or_bulleted_items(desc_m.group(1))
        if desc_items:
            ag["description"] = " ".join(desc_items)

    # Grade rules: the "Based on total marks scored..." + grade-band sentence
    grade_m = re.search(
        r"(?i)(Based on total marks scored.*?)(?=A minimum of overall|\Z)",
        block,
        re.DOTALL,
    )
    if grade_m:
        ag["gradeRules"] = clean_text(grade_m.group(1))

    # Passing criteria
    pass_m = re.search(
        r"(?i)(A minimum of overall.*?)(?=\d+\.\s|\Z)", block, re.DOTALL
    )
    if pass_m:
        ag["passingCriteria"] = clean_text(pass_m.group(1))


# ════════════════════════════════════════════════════════════════════════
# § 9. WARNINGS / CONFIDENCE HOOKS
# ════════════════════════════════════════════════════════════════════════

def collect_parse_warnings(data: Dict[str, Any]) -> List[str]:
    """Lightweight, parser-local sanity checks surfaced to the UI as warnings
    (in addition to whatever normalize_and_score computes downstream)."""
    warnings: List[str] = []

    if not data["details"]["program_name"]:
        warnings.append(
            "Program name could not be detected — please verify Program Info.")
    if not data["peos"]:
        warnings.append("No Program Educational Objectives (PEOs) detected.")
    if not data["pos"]:
        warnings.append("No Program Outcomes (POs) detected.")
    if not data["psos"]:
        warnings.append("No Program Specific Outcomes (PSOs) detected.")
    if not data["structure_table"]:
        warnings.append(
            "Programme structure table could not be parsed — please verify Section 3.")
    if not data["semesters"]:
        warnings.append(
            "No semester course data detected — please verify Section 3.")
    else:
        empty_sems = [s["sem_no"] for s in data["semesters"]
                      if not any(c["courses"] for c in s["categories"])]
        if empty_sems:
            warnings.append(
                f"Semesters with no courses detected: {empty_sems}")
    if not data["section4"]["technicalCompetencyCourses"]:
        warnings.append(
            "No Technical Competency Courses detected — please verify Section 4.")
    if not data["section4"]["programDeliveryAndAttainment"]:
        warnings.append("Program Delivery & Attainment text not detected.")
    if not data["section4"]["assessmentGrading"]["components"]:
        warnings.append("Assessment component weightage table not detected.")

    return warnings


# ════════════════════════════════════════════════════════════════════════
# § 10. MAIN ENTRY POINT
# ════════════════════════════════════════════════════════════════════════

def parse_2026(file_path: str) -> Dict[str, Any]:
    """
    Main extraction pipeline for 2026 Schema PD Documents.
    Returns the exact JSON dictionary shape expected by the React frontend.
    Never raises — on any internal failure it returns the best-effort partial
    structure plus a 'parserWarnings' list so the caller can surface what
    needs manual verification instead of failing the whole upload.
    """
    data: Dict[str, Any] = {
        "details": {
            "university": "GM University", "faculty": "", "school": "",
            "department": "", "program_name": "", "director": "", "hod": "",
            "contact_email": "", "contact_phone": ""
        },
        "award": {
            "title": "", "mode": "Full Time", "awarding_body": "GM University",
            "joint_award": "Not Applicable", "teaching_institution": "GM University",
            "date_program_specs": "", "date_approval": "", "next_review": "",
            "approving_body": "", "accredited_body": "", "accreditation_grade": "",
            "accreditation_validity": "", "benchmark": "NEP 2020"
        },
        "overview": "",
        "peos": [],
        "pos": [],
        "psos": [],
        "credit_def": {"L": 1, "T": 1, "P": 1},
        "structure_table": [],
        "semesters": [],
        "section4": {
            "professionalElectives": [],
            "openElectives": [],
            "technicalCompetencyCourses": [],
            "programDeliveryAndAttainment": "",
            "teachingLearningMethods": [],
            "attendance": "",
            "assessmentGrading": {
                "description": "",
                "components": [],
                "gradeRules": "",
                "passingCriteria": ""
            },
            "awardOfDegree": "",
            "studentSupport": [],
            "qualityControlMeasures": [],
            "notes": ""
        },
        "parserWarnings": [],
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            page_texts = [(p.extract_text() or "") for p in pdf.pages]
        full_text = "\n".join(page_texts)

        if not full_text.strip():
            data["parserWarnings"].append(
                "No extractable text found in PDF (it may be a scanned/image PDF)."
            )
            return data

        spans = locate_numbered_sections(full_text)

        parse_metadata_2026(full_text, data)
        parse_outcomes_2026(full_text, spans, data)
        parse_credit_definition(full_text, data)
        parse_structure_table(full_text, data)
        parse_semesters_2026(full_text, data)
        parse_technical_competency_courses(full_text, spans, data)
        parse_section4_text_blocks(full_text, spans, data)

        data["parserWarnings"] = collect_parse_warnings(data)

    except Exception as exc:  # never let a single bad PDF crash the pipeline
        data["parserWarnings"].append(f"Parser encountered an error: {exc}")

    return data


# ════════════════════════════════════════════════════════════════════════
# § 11. STANDALONE TEST HOOK
# ════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import json

    target = sys.argv[1] if len(sys.argv) > 1 else None
    if not target:
        print("Usage: python parser_2026.py <path-to-pdf>")
        sys.exit(1)

    result = parse_2026(target)
    print(json.dumps(result, indent=2, ensure_ascii=False))
