import re
import pdfplumber
from core.base_parser import BaseParser
from core.text_cleaner import normalize_course_code


class PD2026AdvancedParser(BaseParser):
    def __init__(self, file_path):
        super().__init__(file_path)
        self.validation["schemaVersion"] = "2026"

    def extract_metadata(self, text):
        match = re.search(r'(?i)B\.Tech\.?\s*in\s*(.+?)\n', text)
        self.data["details"]["program_name"] = match.group(
            1).strip() if match else "Computer Science and Engineering"

    def extract_outcomes(self, text):
        # Extract PEOs
        peo_block = re.search(
            r'(?i)Program Educational Objectives(.*?)(?=Program Outcomes)', text, re.DOTALL)
        if peo_block:
            peos = re.findall(r'(PEO-\d+.*?)(?=PEO-\d+|\Z)',
                              peo_block.group(1), re.DOTALL)
            self.data["peos"] = [p.replace('\n', ' ').strip() for p in peos]

        # Extract POs
        po_block = re.search(
            r'(?i)Program Outcomes(.*?)(?=Program Specific)', text, re.DOTALL)
        if po_block:
            pos = re.findall(r'(PO-\d+.*?)(?=PO-\d+|\Z)',
                             po_block.group(1), re.DOTALL)
            self.data["pos"] = [p.replace('\n', ' ').strip() for p in pos]

        # Extract PSOs
        pso_block = re.search(
            r'(?i)Program Specific Outcomes(.*?)(?=Programme Structure|Definition of Credit)', text, re.DOTALL)
        if pso_block:
            psos = re.findall(r'(PSO-\d+.*?)(?=PSO-\d+|\Z)',
                              pso_block.group(1), re.DOTALL)
            self.data["psos"] = [p.replace('\n', ' ').strip() for p in psos]

    def extract_semesters(self):
        """Intelligent Context-Aware Table Parsing for 2026 Merged Layout"""
        active_semester = 0
        active_category = "Academic"
        active_elective_group = None

        # Advanced extraction settings to handle broken/merged cells in 2026 tables
        table_settings = {
            "vertical_strategy": "lines",
            # Text strategy handles missing horizontal lines better
            "horizontal_strategy": "text",
            "intersection_y_tolerance": 15,
            "snap_tolerance": 5,
        }

        for page in self.pdf.pages:
            text = page.extract_text() or ""

            # Detect Semester Transition (Handles "Semester 1", "Semester - 1", "Semester-VIII")
            sem_match = re.search(r'(?i)Semester[- ]?([IVX1-8]+)', text)
            if sem_match:
                # Convert Roman numerals if necessary, otherwise keep integer
                val = sem_match.group(1)
                active_semester = self._roman_to_int(
                    val) if not val.isdigit() else int(val)

            tables = page.extract_tables(table_settings)
            for tbl in tables:
                if not tbl or len(tbl) < 2:
                    continue

                header_text = " ".join([str(c) for c in tbl[0] if c]).lower()

                # Dynamic Category Switching
                if "category" in header_text or "academic" in header_text:
                    if "competency" in header_text:
                        active_category = "Competency and Skills"
                    elif "professional" in header_text:
                        active_category = "Professional Skills"
                    elif "sports" in header_text or "culture" in header_text:
                        active_category = "Sports, Culture and Environment"
                    else:
                        active_category = "Academic"

                    # Reset elective group when the overarching category changes
                    active_elective_group = None

                current_course_ref = None  # Pointer to handle multiline text spillovers

                # Parse rows
                for row in tbl:
                    cells = [str(c).replace('\n', ' ').strip()
                             if c else "" for c in row]
                    row_joined = " ".join(cells).lower()

                    if not any(cells):
                        continue  # Skip entirely empty rows

                    # 1. Detect Elective Group rows (e.g., "Professional Elective - 1")
                    if "elective -" in row_joined or "elective-" in row_joined or "micro credential" in row_joined:
                        group_name = next((c for c in cells if "elective" in c.lower(
                        ) or "credential" in c.lower()), "Elective Group")
                        active_elective_group = group_name.strip()
                        current_course_ref = None  # Break course context
                        continue

                    # 2. Detect Course Code (Robust Regex handles 'UE 26 CS 1001' or 'UE26CS1001')
                    code_match = next((c for c in cells if re.match(
                        r'UE\s*\d{2}\s*[A-Z]{2}\s*\d+', c, re.IGNORECASE)), None)

                    if code_match:
                        code = normalize_course_code(code_match)
                        code_idx = cells.index(code_match)

                        # Extract Title (Usually immediately following the code)
                        title = cells[code_idx + 1] if code_idx + \
                            1 < len(cells) else ""

                        # Extract Credits (Search backwards for a standalone digit/decimal)
                        credits = 0
                        for cell in reversed(cells):
                            if re.match(r'^\d+(\.\d+)?$', cell):
                                credits = float(
                                    cell) if '.' in cell else int(cell)
                                break

                        # Create course dictionary
                        course_data = {
                            "code": code,
                            "title": title,
                            "credits": credits,
                            "type": self._infer_course_type(cells),
                            "category": active_category
                        }

                        # Insert course and keep a reference in case the next row is a multiline spillover
                        self._insert_course(
                            active_semester, active_category, active_elective_group, course_data)
                        current_course_ref = course_data

                    # 3. Handle Multiline Titles / Merged Cells Spillover
                    elif current_course_ref and any(cells):
                        # If there's no course code, but there IS text, it's likely a title that wrapped to the next line
                        potential_text = cells[1] if len(
                            cells) > 1 else cells[0]
                        if potential_text and not potential_text.isdigit() and len(potential_text) > 2:
                            current_course_ref["title"] += f" {potential_text.strip()}"

    def _insert_course(self, sem_no, category, elective_group, course_data):
        if sem_no == 0:
            return  # Orphaned course before semester was detected

        # Ensure Semester exists
        sem_obj = next(
            (s for s in self.data["semesters"] if s["sem_no"] == sem_no), None)
        if not sem_obj:
            sem_obj = {"sem_no": sem_no, "courses": [], "categories": []}
            self.data["semesters"].append(sem_obj)

        # Ensure Category exists
        cat_obj = next(
            (c for c in sem_obj["categories"] if c["categoryName"] == category), None)
        if not cat_obj:
            cat_obj = {"categoryName": category,
                       "courses": [], "electiveGroup": elective_group}
            sem_obj["categories"].append(cat_obj)
        else:
            # Update elective group if it changed within the same category
            if elective_group and not cat_obj.get("electiveGroup"):
                cat_obj["electiveGroup"] = elective_group

        cat_obj["courses"].append(course_data)

    def _infer_course_type(self, cells):
        """Infers if a course is Theory, Lab, or Project based on L-T-P columns if available"""
        row_str = " ".join(cells).lower()
        if "lab" in row_str or "practical" in row_str:
            return "Lab"
        if "project" in row_str or "internship" in row_str:
            return "Project"
        return "Theory"

    def _roman_to_int(self, s):
        rom_val = {'I': 1, 'V': 5, 'X': 10}
        int_val = 0
        s = s.upper()
        for i in range(len(s)):
            if i > 0 and rom_val.get(s[i], 0) > rom_val.get(s[i - 1], 0):
                int_val += rom_val.get(s[i], 0) - 2 * rom_val.get(s[i - 1], 0)
            else:
                int_val += rom_val.get(s[i], 0)
        return int_val if int_val > 0 else 0
