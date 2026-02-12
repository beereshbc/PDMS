#!/usr/bin/env python3
"""
PD Document Parser – Enhanced for GM University 2024 Scheme
Extracts ALL structured data and returns JSON in the exact format expected by the React frontend.
"""

import sys
import json
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print(json.dumps({
        "error": "pdfplumber library not installed. Run: pip install pdfplumber"
    }))
    sys.exit(1)

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------


def clean_text(text):
    """Remove excessive whitespace and newlines, but preserve basic structure."""
    if not text:
        return ""
    return " ".join(text.split()).strip()


def safe_int(val, default=0):
    try:
        return int(val)
    except:
        return default

# ----------------------------------------------------------------------
# Main parser
# ----------------------------------------------------------------------


def parse_pdf_document(file_path):
    """Extract all data and return a dict that matches the frontend pdData shape."""
    # Default structure (identical to PREPOPULATED_DATA in React)
    data = {
        "details": {
            "university": "GM University",
            "faculty": "",
            "school": "",
            "department": "",
            "program_name": "",
            "director": "",
            "hod": "",
            "contact_email": "hod.cse@gmu.edu",
            "contact_phone": "+91-1234567890"
        },
        "award": {
            "title": "",
            "mode": "Full Time",
            "awarding_body": "GM University",
            "joint_award": "Not Applicable",
            "teaching_institution": "Faculty of Engineering and Technology, GM University",
            "date_program_specs": "",
            "date_approval": "---",
            "next_review": "---",
            "approving_body": "---",
            "accredited_body": "---",
            "accreditation_grade": "---",
            "accreditation_validity": "---",
            "benchmark": "N/A"
        },
        "overview": "",
        "peos": [],
        "pos": [],
        "psos": [],
        "credit_def": {"L": 1, "T": 1, "P": 1},
        "structure_table": [],
        "semesters": [],
        "prof_electives": [],
        "open_electives": []
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            # ----- Metadata (page 2) -----
            parse_metadata(full_text, data)

            # ----- Program Overview (page 3) -----
            parse_overview(full_text, data)

            # ----- PEOs, POs, PSOs (pages 3-6) -----
            parse_peos(full_text, data)
            parse_pos(full_text, data)
            parse_psos(full_text, data)

            # ----- Credit definitions & structure table (page 7) -----
            parse_credit_definitions(full_text, data)
            parse_structure_table(full_text, data)

            # ----- Semester wise courses (pages 8-15) -----
            parse_semester_courses(pdf, data)

            # ----- Electives (pages 16-17) -----
            parse_electives(pdf, data)

    except Exception as e:
        # Log error but still return whatever was extracted
        print(f"Parser error: {e}", file=sys.stderr)

    # Ensure at least 8 semesters are present
    while len(data["semesters"]) < 8:
        data["semesters"].append(
            {"sem_no": len(data["semesters"]) + 1, "courses": []})
    data["semesters"].sort(key=lambda x: x["sem_no"])

    return data


def parse_metadata(text, data):
    """Extract faculty, school, department, director, HOD, award details, etc."""
    # Faculty
    m = re.search(r'Faculty\s+(.+?)(?:\n|School)', text, re.IGNORECASE)
    if m:
        data["details"]["faculty"] = clean_text(m.group(1))

    # School
    m = re.search(r'School\s+(.+?)(?:\n|Department)', text, re.IGNORECASE)
    if m:
        data["details"]["school"] = clean_text(m.group(1))

    # Department
    m = re.search(r'Department\s+(.+?)(?:\n|Program)', text, re.IGNORECASE)
    if m:
        data["details"]["department"] = clean_text(m.group(1))

    # Director of School
    m = re.search(r'Director of School\s+(.+?)(?:\n|Head)',
                  text, re.IGNORECASE)
    if m:
        data["details"]["director"] = clean_text(m.group(1))

    # Head of Department
    m = re.search(r'Head of Department\s+(.+?)(?:\n|\d+\.)',
                  text, re.IGNORECASE)
    if m:
        data["details"]["hod"] = clean_text(m.group(1))

    # Program Name
    m = re.search(r'B\.Tech\.?\s+in\s+(.+?)(?:\n|$)', text, re.IGNORECASE)
    if m:
        data["details"]["program_name"] = clean_text(m.group(1))
    else:
        # fallback
        data["details"]["program_name"] = "Computer Science & Engineering"

    # ---- Award table details (numbered 1..13) ----
    # 1. Title of the Award
    m = re.search(r'1\.\s*Title of the Award\s+(.+?)(?:\n|2\.)',
                  text, re.IGNORECASE)
    if m:
        data["award"]["title"] = clean_text(m.group(1))

    # 2. Modes of Study
    m = re.search(r'2\.\s*Modes of Study\s+(.+?)(?:\n|3\.)',
                  text, re.IGNORECASE)
    if m:
        data["award"]["mode"] = clean_text(m.group(1))

    # 3. Awarding Institution
    m = re.search(
        r'3\.\s*Awarding Institution.*?\s+(.+?)(?:\n|4\.)', text, re.IGNORECASE)
    if m:
        data["award"]["awarding_body"] = clean_text(m.group(1))

    # 4. Joint Award
    m = re.search(r'4\.\s*Joint Award\s+(.+?)(?:\n|5\.)', text, re.IGNORECASE)
    if m:
        data["award"]["joint_award"] = clean_text(m.group(1))

    # 5. Teaching Institution
    m = re.search(r'5\.\s*Teaching Institution\s+(.+?)(?:\n|6\.)',
                  text, re.IGNORECASE | re.DOTALL)
    if m:
        data["award"]["teaching_institution"] = clean_text(m.group(1))

    # 6. Date of Program Specifications
    m = re.search(
        r'6\.\s*Date of Program Specifications\s+(.+?)(?:\n|7\.)', text, re.IGNORECASE)
    if m:
        data["award"]["date_program_specs"] = clean_text(m.group(1))

    # 7. Date of Course Approval – default "---"
    # 8. Next Review Date – default "---"
    # 9. Program Approving Regulating Body – default "---"
    # 10. Program Accredited Body – default "---"
    # 11. Grade Awarded – default "---"
    # 12. Program Accreditation Validity – default "---"
    # 13. Program Benchmark – default "N/A"
    # (We keep defaults)


def parse_overview(text, data):
    """Extract Program Overview (section 14)."""
    m = re.search(r'14\.\s*Program Overview.*?\n(.+?)(?=15\.|Program Educational)',
                  text, re.IGNORECASE | re.DOTALL)
    if m:
        data["overview"] = clean_text(m.group(1))


def parse_peos(text, data):
    """Extract PEOs as plain strings (the React component stores them as HTML)."""
    peo_section = re.search(
        r'Program Educational Objectives.*?(?=Program Outcomes|Program Specific|$)',
        text, re.IGNORECASE | re.DOTALL
    )
    if peo_section:
        peo_matches = re.findall(
            r'PEO-(\d+):\s*([^\n]+)\n(.*?)(?=PEO-\d+:|Program Outcomes|Program Specific|$)',
            peo_section.group(0), re.DOTALL
        )
        for num, title, desc in peo_matches:
            full_text = f"<b>{title.strip()}</b><br/>{desc.strip()}"
            data["peos"].append(full_text)
    if not data["peos"]:
        # fallback with 3 empty slots
        data["peos"] = ["", "", ""]


def parse_pos(text, data):
    """Extract POs as plain strings (React stores them as HTML)."""
    po_section = re.search(
        r'Program Outcomes.*?(?=Program Specific|$)',
        text, re.IGNORECASE | re.DOTALL
    )
    if po_section:
        po_matches = re.findall(
            r'PO-(\d+):\s*([^:]+?):\s*(.*?)(?=PO-\d+:|Program Specific|$)',
            po_section.group(0), re.DOTALL
        )
        for num, title, desc in po_matches:
            full_text = f"<b>{title.strip()}</b>: {desc.strip()}"
            data["pos"].append(full_text)
    # If none found, the React component will fallback to STANDARD_POS


def parse_psos(text, data):
    """Extract PSOs as plain strings."""
    pso_section = re.search(
        r'Program Specific Outcomes.*?(?=Programme Structure|Definition of Credit|Courses and Credits|$)',
        text, re.IGNORECASE | re.DOTALL
    )
    if pso_section:
        pso_matches = re.findall(
            r'PSO-(\d+):\s*([^\n]+)\n(.*?)(?=PSO-\d+:|Programme Structure|Definition of Credit|$)',
            pso_section.group(0), re.DOTALL
        )
        for num, title, desc in pso_matches:
            full_text = f"<b>{title.strip()}</b><br/>{desc.strip()}"
            data["psos"].append(full_text)
    if not data["psos"]:
        data["psos"] = ["", "", ""]


def parse_credit_definitions(text, data):
    """
    Extract L:T:P mapping from text like:
    "1 Hr. Lecture (L) per week 1 Credit"
    "2 Hr. Tutorial (T) per week 1 Credit"
    "2 Hr. Practical (P) per week 1 Credit"
    """
    # Lecture
    m = re.search(r'(\d+)\s*Hr\.?\s*Lecture.*?(\d+)\s*Credit',
                  text, re.IGNORECASE)
    if m:
        data["credit_def"]["L"] = safe_int(m.group(2))
    # Tutorial
    m = re.search(r'(\d+)\s*Hr\.?\s*Tutorial.*?(\d+)\s*Credit',
                  text, re.IGNORECASE)
    if m:
        data["credit_def"]["T"] = safe_int(m.group(2))
    # Practical
    m = re.search(r'(\d+)\s*Hr\.?\s*Practical.*?(\d+)\s*Credit',
                  text, re.IGNORECASE)
    if m:
        data["credit_def"]["P"] = safe_int(m.group(2))


def parse_structure_table(text, data):
    """
    Extract the credit structure table (page 7).
    Each row: Sl. No., Category, Credits, and optional Code in parentheses.
    """
    struct_section = re.search(
        r'Sl\. No\. Program -?Category Credits(.+?)(?=Semester|Total|$)',
        text, re.IGNORECASE | re.DOTALL
    )
    if not struct_section:
        return

    lines = struct_section.group(1).strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line or line[0].isdigit() is False:
            continue

        # Match pattern: "1. Program-Core courses, elective Courses, open electives 130"
        # or "2. Technical Competency 10 (SDTCD)"
        m = re.match(r'^(\d+)\.\s+(.*?)\s+(\d+)(?:\s*\(([^)]+)\))?\s*$', line)
        if m:
            num, category, credits, code = m.groups()
            category = clean_text(category)
            credits = safe_int(credits)
            code = code.strip() if code else ""
            data["structure_table"].append({
                "category": category,
                "credits": credits,
                "code": code
            })
    # If no rows found, try a more lenient regex
    if not data["structure_table"]:
        rows = re.findall(
            r'(\d+)\.\s*(.+?)(\d+)\s*(?:\(([^)]+)\))?\s*(?=\d+\.|Total|$)', struct_section.group(0), re.DOTALL)
        for num, cat, cred, code in rows:
            data["structure_table"].append({
                "category": clean_text(cat),
                "credits": safe_int(cred),
                "code": code.strip() if code else ""
            })


def parse_semester_courses(pdf, data):
    """
    Iterate through all pages, detect semester tables and extract courses.
    Sets default type="Theory", category="Core". 0-credit courses are also included.
    """
    for page in pdf.pages:
        text = page.extract_text() or ""
        if 'semester' not in text.lower():
            continue

        # Detect semester number
        sem_match = re.search(r'Semester[- ](\d+)', text, re.IGNORECASE)
        if not sem_match:
            continue
        sem_no = int(sem_match.group(1))

        tables = page.extract_tables()
        if not tables:
            continue

        # Find the main course table (first table with "Course Code" header)
        table = None
        for tbl in tables:
            for row in tbl[:3]:
                row_text = " ".join([str(c) for c in row if c]).lower()
                if "course code" in row_text and "course title" in row_text:
                    table = tbl
                    break
            if table:
                break

        if not table:
            continue

        # Locate header row
        header_idx = -1
        for i, row in enumerate(table):
            if row and any("course code" in str(c).lower() for c in row):
                header_idx = i
                break
        if header_idx == -1:
            continue

        # Ensure semesters list has this semester
        sem_obj = next(
            (s for s in data["semesters"] if s["sem_no"] == sem_no), None)
        if not sem_obj:
            sem_obj = {"sem_no": sem_no, "courses": []}
            data["semesters"].append(sem_obj)

        # Parse rows
        for row in table[header_idx + 1:]:
            if not row or len(row) < 2:
                continue

            cells = [str(c).strip() if c else "" for c in row]

            # Find course code (UE24... or special codes)
            code = ""
            for cell in cells:
                if re.match(r'^UE\d{2}[A-Z]{2}\d{4}$', cell) or cell in ["SDTCD", "CASP", "CIBI", "SA", "SASP"]:
                    code = cell
                    break

            if not code:
                continue

            code_idx = cells.index(code)
            title = cells[code_idx + 1] if code_idx + 1 < len(cells) else ""

            # Credits: search from end for a digit
            credits = 0
            for cell in reversed(cells):
                if cell.isdigit():
                    credits = int(cell)
                    break

            # Default type & category (user can edit later)
            sem_obj["courses"].append({
                "code": code,
                "title": clean_text(title),
                "credits": credits,
                "type": "Theory",      # default, override if needed
                "category": "Core"     # default
            })


def parse_electives(pdf, data):
    """
    Extract professional and open electives from pages containing "List of Electives".
    Groups them by semester and type, outputting the structure expected by frontend.
    """
    for page in pdf.pages:
        text = page.extract_text() or ""
        if "list of" not in text.lower() or "elective" not in text.lower():
            continue

        # Determine if professional or open
        is_prof = "professional" in text.lower()
        is_open = "open" in text.lower()
        if not is_prof and not is_open:
            continue

        # Find semester number(s) on this page
        sem_numbers = re.findall(
            r'(\d+)(?:th|st|nd|rd)?\s*Semester', text, re.IGNORECASE)
        if not sem_numbers:
            continue
        semester = int(sem_numbers[0])  # use first one

        tables = page.extract_tables()
        if not tables:
            continue

        for table in tables:
            # Find header row
            header_idx = -1
            for i, row in enumerate(table[:3]):
                row_text = " ".join([str(c) for c in row if c]).lower()
                if "course code" in row_text and "course title" in row_text:
                    header_idx = i
                    break
            if header_idx == -1:
                continue

            # Determine if this table belongs to the same semester / type
            # (Sometimes multiple tables on one page – we rely on page context)
            elective_type = "prof" if is_prof else "open"

            # Prepare target group
            target_list = data["prof_electives"] if elective_type == "prof" else data["open_electives"]
            group = next(
                (g for g in target_list if g["sem"] == semester), None)
            if not group:
                group = {
                    "sem": semester,
                    "title": f"{'Professional' if is_prof else 'Open'} Electives - Semester {semester}",
                    "courses": []
                }
                target_list.append(group)

            # Parse courses
            for row in table[header_idx + 1:]:
                if not row or len(row) < 2:
                    continue
                cells = [str(c).strip() if c else "" for c in row]

                # Find course code (UE24...)
                code = ""
                for cell in cells:
                    if re.match(r'^UE\d{2}[A-Z]{2}\d{4}$', cell):
                        code = cell
                        break
                if not code:
                    continue

                code_idx = cells.index(code)
                title = cells[code_idx + 1] if code_idx + \
                    1 < len(cells) else ""

                # Credits (default 3 if not found)
                credits = 3
                for cell in reversed(cells):
                    if cell.isdigit():
                        credits = int(cell)
                        break

                group["courses"].append({
                    "code": code,
                    "title": clean_text(title),
                    "credits": credits
                })


# ----------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not Path(file_path).exists():
        print(json.dumps({"error": "File not found"}))
        sys.exit(1)

    result = parse_pdf_document(file_path)
    # Ensure valid JSON
    print(json.dumps(result, indent=2))
