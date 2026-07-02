#!/usr/bin/env python3
"""
Advanced Unified Polymorphic PD Document Parser
Supports both 2024 (Legacy/Flat) and 2026 (Merged Categories) Schemas across ALL Departments.
"""

import sys
import json
import re
from typing import Dict, Any, List, Tuple

try:
    import pdfplumber
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "pdfplumber library not installed. Run: pip install pdfplumber"
    }))
    sys.exit(1)

# ════════════════════════════════════════════════════════════════════════
# § 1. SHARED HELPERS & DATA STRUCTURES
# ════════════════════════════════════════════════════════════════════════

# Matches ANY department course code like UE24CS3540, UE26ME101, UE26TSCV01, etc.
UNIVERSAL_CODE_RE = re.compile(
    r"\b[A-Z]{2,4}\d{2}[A-Z]{2,5}\d{2,4}\b", re.IGNORECASE)

# Fuzzy matchers for 2026 Schema Categories
CATEGORY_MATCHERS = {
    "Academic": re.compile(r"^\s*(?:\d+\.\s*)?academic(?: courses)?\s*$", re.IGNORECASE),
    "Competency and Skills": re.compile(r"^\s*(?:\d+\.\s*)?competency\s+and\s+skills?(?: courses)?\s*$", re.IGNORECASE),
    "Professional Skills": re.compile(r"^\s*(?:\d+\.\s*)?professional\s+skills?(?: courses)?\s*$", re.IGNORECASE),
    "Sports, Culture and Environment": re.compile(r"^\s*(?:\d+\.\s*)?sports[,\s]+culture\s+and\s+environment(?: courses)?\s*$", re.IGNORECASE)
}

NOISE_LINE_RE = re.compile(
    r"^(s\.?\s*no\.?\s*course code\s*course title\s*credits|page\s*\|\s*\d+|note:.*)$", re.IGNORECASE)


def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()


def safe_int(val, default: int = 0) -> int:
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
    if not block:
        return []
    block = block.strip()
    items = re.split(r"\n?\s*\d+\.\s+", "\n" + block)
    items = [clean_text(i) for i in items if len(clean_text(i)) > 2]
    if len(items) > 1:
        return [re.sub(r"^(\d+\.\s*)+", "", it).strip() for it in items if it]

    items = re.split(r"\n\s*[-*•]\s+", "\n" + block)
    items = [clean_text(i) for i in items if len(clean_text(i)) > 2]
    if len(items) > 1:
        return items

    lines = [clean_text(l) for l in block.split("\n") if clean_text(l)]
    return lines if lines else [clean_text(block)]


def create_blank_pd_data() -> Dict[str, Any]:
    return {
        "details": {"university": "GM University", "faculty": "", "school": "", "department": "", "program_name": "", "director": "", "hod": "", "contact_email": "", "contact_phone": ""},
        "award": {"title": "", "mode": "Full Time", "awarding_body": "GM University", "joint_award": "Not Applicable", "teaching_institution": "GM University", "date_program_specs": "", "date_approval": "", "next_review": "", "approving_body": "", "accredited_body": "", "accreditation_grade": "", "accreditation_validity": "", "benchmark": "NEP 2020"},
        "overview": "", "peos": [], "pos": [], "psos": [], "credit_def": {"L": 0, "T": 0, "P": 0},
        "structure_table": [], "semesters": [], "prof_electives": [], "open_electives": [],
        "section4": {
            "professionalElectives": [], "openElectives": [], "technicalCompetencyCourses": [],
            "programDeliveryAndAttainment": "", "teachingLearningMethods": [], "attendance": "",
            "assessmentGrading": {"description": "", "components": [], "gradeRules": "", "passingCriteria": ""},
            "awardOfDegree": "", "studentSupport": [], "qualityControlMeasures": [], "notes": ""
        },
        "parserWarnings": []
    }

# ════════════════════════════════════════════════════════════════════════
# § 2. PARSER: 2024 SCHEMA (Legacy)
# ════════════════════════════════════════════════════════════════════════


def parse_2024(pdf, full_text: str, data: Dict[str, Any]) -> None:
    # --- Metadata ---
    metadata_patterns = [
        (r'Faculty\s+(.+?)(?:\n|School)', 'faculty'),
        (r'School\s+(.+?)(?:\n|Department)', 'school'),
        (r'Department\s+(.+?)(?:\n|Program)', 'department'),
        (r'Director of School\s+(.+?)(?:\n|Head)', 'director'),
        (r'Head of Department\s+(.+?)(?:\n|\d+\.)', 'hod'),
        (r'B\.Tech\.?\s+in\s+(.+?)(?:\n|$)', 'program_name')
    ]
    for pattern, key in metadata_patterns:
        m = re.search(pattern, full_text, re.IGNORECASE)
        if m:
            data["details"][key] = clean_text(m.group(1))

    if not data["details"]["program_name"]:
        data["details"]["program_name"] = "Engineering"

    # --- Award Details ---
    award_patterns = [
        (r'1\.\s*Title of the Award\s+(.+?)(?:\n|2\.)', 'title'),
        (r'2\.\s*Modes of Study\s+(.+?)(?:\n|3\.)', 'mode'),
        (r'3\.\s*Awarding Institution.*?\s+(.+?)(?:\n|4\.)', 'awarding_body'),
        (r'4\.\s*Joint Award\s+(.+?)(?:\n|5\.)', 'joint_award'),
        (r'5\.\s*Teaching Institution\s+(.+?)(?:\n|6\.)', 'teaching_institution'),
        (r'6\.\s*Date of Program Specifications\s+(.+?)(?:\n|7\.)', 'date_program_specs')
    ]
    for pattern, key in award_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE | re.DOTALL)
        if match:
            data["award"][key] = clean_text(match.group(1))

    # --- Outcomes ---
    m = re.search(r'14\.\s*Program Overview.*?\n(.+?)(?=15\.|Program Educational)',
                  full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data["overview"] = clean_text(m.group(1))

    peo = re.search(r'Program Educational Objectives.*?(?=Program Outcomes|Program Specific|$)',
                    full_text, re.IGNORECASE | re.DOTALL)
    if peo:
        peos = re.findall(
            r'PEO-(\d+):\s*([^\n]+)\n(.*?)(?=PEO-\d+:|Program Outcomes|Program Specific|$)', peo.group(0), re.DOTALL)
        data["peos"] = [
            f"<b>{t.strip()}</b><br/>{d.strip()}" for _, t, d in peos]

    po = re.search(r'Program Outcomes.*?(?=Program Specific|$)',
                   full_text, re.IGNORECASE | re.DOTALL)
    if po:
        pos = re.findall(
            r'PO-(\d+):\s*([^:]+?):\s*(.*?)(?=PO-\d+:|Program Specific|$)', po.group(0), re.DOTALL)
        data["pos"] = [f"<b>{t.strip()}</b>: {d.strip()}" for _, t, d in pos]

    pso = re.search(r'Program Specific Outcomes.*?(?=Programme Structure|Definition of Credit|Courses and Credits|$)',
                    full_text, re.IGNORECASE | re.DOTALL)
    if pso:
        psos = re.findall(
            r'PSO-(\d+):\s*([^\n]+)\n(.*?)(?=PSO-\d+:|Programme Structure|Definition of Credit|$)', pso.group(0), re.DOTALL)
        data["psos"] = [
            f"<b>{t.strip()}</b><br/>{d.strip()}" for _, t, d in psos]

    # --- Credit Defs ---
    m = re.search(r'(\d+)\s*Hr\.?\s*Lecture.*?(\d+)\s*Credit',
                  full_text, re.IGNORECASE)
    if m:
        data["credit_def"]["L"] = safe_int(m.group(2))
    m = re.search(r'(\d+)\s*Hr\.?\s*Tutorial.*?(\d+)\s*Credit',
                  full_text, re.IGNORECASE)
    if m:
        data["credit_def"]["T"] = safe_int(m.group(2))
    m = re.search(r'(\d+)\s*Hr\.?\s*Practical.*?(\d+)\s*Credit',
                  full_text, re.IGNORECASE)
    if m:
        data["credit_def"]["P"] = safe_int(m.group(2))

    # --- Semesters & Electives Parsing from Tables ---
    for page in pdf.pages:
        text = page.extract_text() or ""
        text_lower = text.lower()
        tables = page.extract_tables()

        if not tables:
            continue

        # Parse Standard Semesters
        if 'semester' in text_lower and not any(k in text_lower for k in ['professional elective', 'open elective']):
            sem_match = re.search(r'Semester[- ](\d+)', text, re.IGNORECASE)
            if sem_match:
                sem_no = int(sem_match.group(1))
                for table in tables:
                    header_idx = next((i for i, r in enumerate(table[:3]) if r and any(
                        "course code" in str(c).lower() for c in r if c)), -1)
                    if header_idx != -1:
                        sem_obj = next(
                            (s for s in data["semesters"] if s["sem_no"] == sem_no), None)
                        if not sem_obj:
                            sem_obj = {"sem_no": sem_no,
                                       "courses": [], "categories": []}
                            data["semesters"].append(sem_obj)

                        for row in table[header_idx + 1:]:
                            if not row or len(row) < 2:
                                continue
                            cells = [str(c).strip() if c else "" for c in row]
                            code = next((c for c in cells if UNIVERSAL_CODE_RE.match(
                                c) or c in ["SDTCD", "CASP", "CIBI", "SA", "SASP"]), "")
                            if not code:
                                continue

                            code_idx = cells.index(code)
                            title = cells[code_idx + 1] if code_idx + \
                                1 < len(cells) else ""
                            credits = next(
                                (int(c) for c in reversed(cells) if c.isdigit()), 0)

                            sem_obj["courses"].append({
                                "code": code, "title": clean_text(title), "credits": credits,
                                "type": "Lab" if "lab" in title.lower() else "Theory", "category": "Core"
                            })

        # Parse Electives
        is_prof = "professional elective" in text_lower
        is_open = "open elective" in text_lower

        if is_prof or is_open:
            sem_numbers = re.findall(
                r'(\d+)(?:th|st|nd|rd)?\s*Semester', text, re.IGNORECASE)
            if sem_numbers:
                semester = int(sem_numbers[0])
                target_list = data["section4"]["professionalElectives"] if is_prof else data["section4"]["openElectives"]

                for table in tables:
                    header_idx = next((i for i, r in enumerate(table[:3]) if any(
                        "course code" in str(c).lower() for c in r if c)), -1)
                    if header_idx != -1:
                        group = next(
                            (g for g in target_list if g["semester"] == semester), None)
                        if not group:
                            group = {
                                "semester": semester, "title": f"{'Professional' if is_prof else 'Open'} Electives - Sem {semester}", "courses": []}
                            target_list.append(group)

                        for row in table[header_idx + 1:]:
                            if not row or len(row) < 2:
                                continue
                            cells = [str(c).strip() if c else "" for c in row]
                            code = next(
                                (c for c in cells if UNIVERSAL_CODE_RE.match(c)), "")
                            if not code:
                                continue

                            code_idx = cells.index(code)
                            title = cells[code_idx + 1] if code_idx + \
                                1 < len(cells) else ""
                            credits = next(
                                (int(c) for c in reversed(cells) if c.isdigit()), 3)

                            group["courses"].append(
                                {"code": code, "title": clean_text(title), "credits": credits})

    data["prof_electives"] = data["section4"]["professionalElectives"]
    data["open_electives"] = data["section4"]["openElectives"]


# ════════════════════════════════════════════════════════════════════════
# § 3. PARSER: 2026 SCHEMA (Merged Categories / Dynamic Lines)
# ════════════════════════════════════════════════════════════════════════

SECTION_HEADING_PATTERNS = [
    (10, r"Program\s+Overview"), (11, r"Program\s+Educational\s+Objectives"),
    (12, r"Program\s+Outcomes\b"), (13, r"Program\s+Specific\s+Outcomes"),
    (14, r"Courses\s+and\s+Credits"), (15,
                                       r"(?:List\s+of\s+)?Technical\s+Competency\s+Courses"),
    (16, r"Program\s+Delivery(?:\s+and\s+Attainment)?"), (17,
                                                          r"Teaching\s+and\s+Learning\s+Methods"),
    (18, r"Attendance\b"), (19, r"Assessment\s+and\s+Grading"), (20,
                                                                 r"Award\s+of(?:\s+the)?\s+Degree"),
    (21, r"Student\s+Support(?:\s+for\s+Learning)?"), (22,
                                                       r"Quality\s+Control\s+Measures"),
]


def _get_section_spans(full_text: str) -> Dict[int, Tuple[int, int]]:
    found = []
    for sec_no, pattern in SECTION_HEADING_PATTERNS:
        m = re.search(rf"(?m)^\s*{sec_no}\s+(?={pattern})", full_text) or re.search(
            rf"(?m)^\s*{sec_no}\s*{pattern}", full_text)
        if m:
            found.append((sec_no, m.start(), m.end()))
    found.sort(key=lambda x: x[1])
    spans = {}
    for idx, (sec_no, start, _) in enumerate(found):
        end = found[idx + 1][1] if idx + 1 < len(found) else len(full_text)
        spans[sec_no] = (start, end)
    return spans


def _get_section_text(full_text: str, spans: Dict[int, Tuple[int, int]], sec_no: int) -> str:
    if sec_no not in spans:
        return ""
    start, end = spans[sec_no]
    return re.sub(r"^\s*\d+\s+[^\n]*\n", "", full_text[start:end], count=1).strip()


def parse_2026(pdf, full_text: str, data: Dict[str, Any]) -> None:
    spans = _get_section_spans(full_text)

    # --- Metadata ---
    m = re.search(
        r"(?i)Title of the Award\s+(B\.?\s?Tech\.?,?\s*(?:in\s*)?.+?)(?:\n|\s{2,}\d|$)", full_text)
    if m:
        data["award"]["title"] = clean_text(m.group(1))
        prog = re.sub(r"(?i)^B\.?\s?Tech\.?,?\s*(in\s*)?",
                      "", data["award"]["title"]).strip()
        if prog:
            data["details"]["program_name"] = prog

    for regex, key in [
        (r"(?i)Faculty\s+(?:of\s+)?(.+?)(?:\n|(?=School))", "faculty"),
        (r"(?i)School\s+(School of .+?)(?:\n|(?=Department))", "school"),
        (r"(?i)Department\s+(.+?)(?:\n|(?=Program\b))", "department"),
        (r"(?i)Director of (?:the )?School\s+(Dr\.?.+?|Prof\.?.+?|Mr\.?.+?|Ms\.?.+?|[A-Z].+?)(?:\n|(?=Head))", "director"),
        (r"(?i)Head of the\s*\n?\s*Department\s+(.+?)(?:\n|(?=\d+\s+Title))", "hod")
    ]:
        m = re.search(regex, full_text)
        if m:
            data["details"][key] = clean_text(m.group(1))

    # --- Outcomes ---
    data["overview"] = clean_text(_get_section_text(full_text, spans, 10))
    peo_text = re.sub(r"(?i)^The Program Educational Objectives include:?\s*",
                      "", _get_section_text(full_text, spans, 11))
    data["peos"] = [clean_text(p) for p in re.findall(
        r"(PEO-\d+\s*:.*?)(?=PEO-\d+\s*:|\Z)", peo_text, re.DOTALL) if len(clean_text(p)) > 10]

    po_text = _get_section_text(full_text, spans, 12)
    data["pos"] = [clean_text(p) for p in re.findall(
        r"(PO-\d+\s*:.*?)(?=PO-\d+\s*:|\Z)", po_text, re.DOTALL) if len(clean_text(p)) > 10]

    pso_text = re.sub(r"(?i)^Upon completion of the program.*?:?\s*",
                      "", _get_section_text(full_text, spans, 13))
    data["psos"] = [clean_text(p) for p in re.findall(
        r"(PSO-\d+\s*:.*?)(?=PSO-\d+\s*:|\Z)", pso_text, re.DOTALL) if len(clean_text(p)) > 10]

    # --- Credit Def ---
    for pat, key in [(r"(?i)Lecture\s*\(L\)\s*per week\s*(\d+)\s*Credit", "L"),
                     (r"(?i)Tutorial\s*\(T\)\s*per week\s*(\d+)\s*Credit", "T"),
                     (r"(?i)Practical\s*\(P\)\s*per week\s*(\d+)\s*Credit", "P")]:
        m = re.search(pat, full_text)
        if m:
            data["credit_def"][key] = safe_int(m.group(1))

    # --- Semesters (2026 Line-Based Logic with fuzzy category matcher) ---
    sem_matches = list(re.finditer(
        r"(?im)^Semester[\s-]*([IVX\d]+)\s*$", full_text))
    for idx, m in enumerate(sem_matches):
        sem_no = roman_to_int(m.group(1))
        if sem_no <= 0 or sem_no > 12:
            continue

        start = m.end()
        end = sem_matches[idx + 1].start() if idx + \
            1 < len(sem_matches) else len(full_text)

        # Stop semester reading if we hit section 15
        cutoff = re.search(
            r"(?im)^\s*15\s+(?:List of )?Technical Competency Courses", full_text[start:end])
        block_text = full_text[start:start +
                               cutoff.start()] if cutoff else full_text[start:end]

        lines = [l.strip() for l in block_text.split(
            "\n") if l.strip() and not NOISE_LINE_RE.match(l)]
        categories, current_cat = [], "Academic"
        pending_group_courses, pending_group_active = [], False

        def _get_cat(name):
            for c in categories:
                if c["categoryName"] == name:
                    return c
            c = {"categoryName": name, "totalCategoryCredits": 0, "courses": []}
            categories.append(c)
            return c

        i, n = 0, len(lines)
        while i < n:
            line = lines[i]

            # Check if line is a Category Header using fuzzy Regex
            matched_cat = next(
                (cat_name for cat_name, rgx in CATEGORY_MATCHERS.items() if rgx.match(line)), None)
            if matched_cat:
                current_cat = matched_cat
                i += 1
                continue

            if re.match(r"(?i)^(total|overall)\s+\d", line):
                i += 1
                continue

            el_head = re.match(
                r"(?i)^(Professional|Open)\s+Elective[-\s]?(\d+)\s*$", line)
            if el_head:
                pending_group_courses, pending_group_active = [], True
                i += 1
                continue

            # Bare Match: Code + Title (missing credits because they span lines)
            bare_m = re.match(
                rf"^({UNIVERSAL_CODE_RE.pattern})\s+(.+?)\s*$", line, re.IGNORECASE)
            if pending_group_active and bare_m and not re.search(r"\d+\s*$", line.split()[-1]):
                title = clean_text(bare_m.group(2))
                if not re.match(r".*\s\d+$", title):
                    pending_group_courses.append(
                        (bare_m.group(1).upper(), title))
                    i += 1
                    continue

            # Standard Match: SlNo Code Title Credits
            std_m = re.match(
                rf"^(\d+)\s+({UNIVERSAL_CODE_RE.pattern})\s+(.+?)\s+(\d+)\s*$", line, re.IGNORECASE)
            if std_m:
                code, title, credits = std_m.group(2).upper(), clean_text(
                    std_m.group(3)), safe_int(std_m.group(4))
                ctype = "Lab" if "lab" in title.lower(
                ) else "Project" if "project" in title.lower() else "Theory"

                if pending_group_active:
                    pending_group_courses.append((code, title))
                    cat = _get_cat(current_cat)
                    for gc, gt in pending_group_courses:
                        cat["courses"].append(
                            {"code": gc, "title": gt, "credits": credits, "type": "Theory", "category": "Professional Elective"})
                    pending_group_active = False
                else:
                    _get_cat(current_cat)["courses"].append(
                        {"code": code, "title": title, "credits": credits, "type": ctype, "category": current_cat})
                i += 1
                continue

            # No Title Match: Code Credits (Title is on next line)
            no_title_m = re.match(
                rf"^(\d+)\s+({UNIVERSAL_CODE_RE.pattern})\s+(\d+)\s*$", line, re.IGNORECASE)
            if no_title_m:
                code, credits = no_title_m.group(
                    2).upper(), safe_int(no_title_m.group(3))
                title = ""
                if i + 1 < n and (lines[i + 1].startswith("(") or not re.match(r"^\d", lines[i + 1])):
                    title = clean_text(lines[i + 1].strip("()"))
                    i += 1
                _get_cat(current_cat)["courses"].append(
                    {"code": code, "title": title or "Competitive Learning", "credits": credits, "type": "Theory", "category": current_cat})
                i += 1
                continue

            i += 1

        for cat in categories:
            cat["totalCategoryCredits"] = sum(
                c.get("credits", 0) for c in cat["courses"])
        if categories:
            data["semesters"].append(
                {"sem_no": sem_no, "courses": [], "categories": categories})

    # --- Section 4 Institutional Text (2026 Specific) ---
    s4 = data["section4"]
    tc = _get_section_text(full_text, spans, 15)
    if tc:
        tlines = [l.strip() for l in tc.split("\n") if l.strip()
                  and not re.match(r"(?i)^(course|s\.?no|note:)", l)]
        i, n = 0, len(tlines)
        while i < n:
            l = tlines[i]
            # Match Line with Universal Course Code + Title + Credits + Platform
            m1 = re.match(
                rf"^(\d+)\s+({UNIVERSAL_CODE_RE.pattern})\s+(.+?)\s+(\d+)\s+(\S+)\s*$", l, re.IGNORECASE)
            if m1:
                s4["technicalCompetencyCourses"].append({"code": m1.group(2).upper(), "title": clean_text(
                    m1.group(3)), "credits": safe_int(m1.group(4)), "resource": clean_text(m1.group(5))})
                i += 1
                continue

            m2 = re.match(
                rf"^({UNIVERSAL_CODE_RE.pattern})\s+(.+?)\s+(\S+)\s*$", l, re.IGNORECASE)
            if m2:
                code, title, res, cr, desc = m2.group(1).upper(), clean_text(
                    m2.group(2)), clean_text(m2.group(3)), 2, ""
                if i+1 < n and re.match(r"^\d+\s+\d+\s*$", tlines[i+1]):
                    cr = safe_int(tlines[i+1].split()[-1])
                    i += 1
                    if i+1 < n and not UNIVERSAL_CODE_RE.search(tlines[i+1]):
                        desc = clean_text(tlines[i+1])
                        i += 1
                s4["technicalCompetencyCourses"].append(
                    {"code": code, "title": f"{title} - {desc}" if desc else title, "credits": cr, "resource": res})
                i += 1
                continue
            i += 1

    s4["programDeliveryAndAttainment"] = clean_text(
        _get_section_text(full_text, spans, 16))
    s4["teachingLearningMethods"] = extract_numbered_or_bulleted_items(
        _get_section_text(full_text, spans, 17))
    s4["attendance"] = clean_text(_get_section_text(full_text, spans, 18))

    ag_txt = _get_section_text(full_text, spans, 19)
    if ag_txt:
        comps = re.findall(
            r"^(.+?)\s*:\s*(\d+%)[^\n]*?(\d+%)\s*$", ag_txt, re.MULTILINE)
        if comps:
            s4["assessmentGrading"]["components"] = [
                {"name": clean_text(n), "weightage": safe_int(t)} for n, _, t in comps]
        d_m = re.search(
            r"^(.*?)(?=Assessment Component\s+Weightage)", ag_txt, re.DOTALL)
        if d_m:
            s4["assessmentGrading"]["description"] = " ".join(
                extract_numbered_or_bulleted_items(d_m.group(1)))
        g_m = re.search(
            r"(?i)(Based on total marks scored.*?)(?=A minimum of overall|\Z)", ag_txt, re.DOTALL)
        if g_m:
            s4["assessmentGrading"]["gradeRules"] = clean_text(g_m.group(1))
        p_m = re.search(
            r"(?i)(A minimum of overall.*?)(?=\d+\.\s|\Z)", ag_txt, re.DOTALL)
        if p_m:
            s4["assessmentGrading"]["passingCriteria"] = clean_text(
                p_m.group(1))

    s4["awardOfDegree"] = clean_text(_get_section_text(full_text, spans, 20))
    s4["studentSupport"] = extract_numbered_or_bulleted_items(
        _get_section_text(full_text, spans, 21))
    s4["qualityControlMeasures"] = extract_numbered_or_bulleted_items(
        _get_section_text(full_text, spans, 22))

# ════════════════════════════════════════════════════════════════════════
# § 4. ROUTER AND EXECUTION
# ════════════════════════════════════════════════════════════════════════


def detect_schema_version(file_path: str) -> str:
    try:
        with pdfplumber.open(file_path) as pdf:
            text = "".join([p.extract_text() or "" for p in pdf.pages[:5]])
            if re.search(r'(?i)2026\s*Scheme', text) or re.search(r'UE26', text):
                return "2026"
            return "2024"
    except Exception:
        return "2024"


def process_pdf(file_path: str, requested_schema: str = "auto") -> Dict[str, Any]:
    data = create_blank_pd_data()
    schema = requested_schema if requested_schema in [
        "2024", "2026"] else detect_schema_version(file_path)

    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = "\n".join([(p.extract_text() or "")
                                  for p in pdf.pages])
            if not full_text.strip():
                return {"success": False, "error": "No text found in PDF (might be scanned)."}

            if schema == "2026":
                parse_2026(pdf, full_text, data)
            else:
                parse_2024(pdf, full_text, data)

        # Standardize 8 Semesters minimum
        while len(data["semesters"]) < 8:
            data["semesters"].append(
                {"sem_no": len(data["semesters"]) + 1, "courses": [], "categories": []})
        data["semesters"].sort(key=lambda x: x["sem_no"])

        score = 100
        warnings = []
        if not data.get("peos"):
            score -= 20
            warnings.append("No PEOs detected.")
        if not data["details"].get("program_name"):
            warnings.append("Program Name missing.")

        courses_count = sum(len(s.get("courses", [])) + sum(len(c.get("courses", []))
                            for c in s.get("categories", [])) for s in data.get("semesters", []))
        if courses_count < 10:
            score -= 40
            warnings.append("Very few or no courses detected.")

        if schema == "2026" and not data["section4"]["technicalCompetencyCourses"]:
            warnings.append("Technical Competency Courses not found.")

        data["parserWarnings"] = warnings

        return {
            "success": True,
            "schemaVersion": schema,
            "confidence": max(0, score),
            "warnings": warnings,
            "data": data
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    schema_arg = sys.argv[2] if len(sys.argv) > 2 else "auto"

    result = process_pdf(pdf_path, schema_arg)
    print(json.dumps(result, ensure_ascii=False))
