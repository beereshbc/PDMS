from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import pdfplumber
import re
import json
import io
import uuid
from datetime import datetime
import asyncio
from concurrent.futures import ProcessPoolExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Program Document Parser API",
    description="API for parsing and processing academic program documents",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for parsed documents (replace with database in production)
parsed_docs_store = {}

# Process pool for parallel processing
executor = ProcessPoolExecutor(max_workers=4)


class PDDataExtractor:
    """Enhanced Program Document data extractor"""

    @staticmethod
    def extract_program_metadata(text: str) -> Dict[str, str]:
        """Extract metadata from the document"""
        metadata = {
            "program_name": "",
            "program_code": "",
            "university": "",
            "faculty": "",
            "school": "",
            "department": "",
            "director_name": "",
            "hod_name": "",
            "scheme_year": "",
            "effective_ay": "",
            "version_no": "1.0.0",
            "title_of_award": "",
            "modes_of_study": "",
            "awarding_body": "",
            "joint_award": "",
            "teaching_institution": "",
            "date_program_specs": "",
            "date_approval": "",
            "next_review": "",
            "approving_body": "",
            "accredited_body": "",
            "accreditation_grade": "",
            "accreditation_validity": "",
            "benchmark": "",
            "program_overview": "",
        }

        try:
            # Extract university name
            uni_match = re.search(
                r'^(.*?UNIVERSITY|.*?INSTITUTE)', text, re.MULTILINE | re.IGNORECASE)
            if uni_match:
                metadata["university"] = uni_match.group(1).strip()

            # Extract program name and code
            prog_patterns = [
                r'(?:B\.Tech|Bachelor.*?Technology).*?(?:Computer Science|CSE|Information Technology|IT)',
                r'(?:M\.Tech|Master.*?Technology).*?(?:Computer Science|CSE|Information Technology|IT)',
                r'(?:B\.E\.).*?(?:Computer.*?Engineering|CSE)',
            ]

            for pattern in prog_patterns:
                prog_match = re.search(pattern, text, re.IGNORECASE)
                if prog_match:
                    metadata["program_name"] = prog_match.group(0).strip()
                    # Look for program code
                    code_match = re.search(
                        r'[A-Z]{2,4}\s*\d{3,4}', text[prog_match.end():prog_match.end()+50])
                    if code_match:
                        metadata["program_code"] = code_match.group(0).strip()
                    break

            # Extract scheme year
            year_match = re.search(
                r'(\d{4})[\-\s]*(?:SCHEME|SCHEMES|CURRICULUM)', text, re.IGNORECASE)
            if year_match:
                metadata["scheme_year"] = year_match.group(1)
                # Calculate effective academic year
                year = int(year_match.group(1))
                metadata["effective_ay"] = f"{year}-{(year+1) % 100:02d}"

            # Extract faculty, school, department
            lines = text.split('\n')
            for i, line in enumerate(lines):
                line_lower = line.lower()
                if 'faculty' in line_lower and not metadata["faculty"]:
                    metadata["faculty"] = line.replace(
                        'Faculty', '').replace('faculty', '').strip()
                elif 'school' in line_lower and not metadata["school"]:
                    metadata["school"] = line.replace(
                        'School', '').replace('school', '').strip()
                elif 'department' in line_lower and not metadata["department"]:
                    metadata["department"] = line.replace(
                        'Department', '').replace('department', '').strip()
                elif 'director' in line_lower and 'school' in line_lower and not metadata["director_name"]:
                    metadata["director_name"] = re.sub(
                        r'(?:Director|director).*?(?:School|school)[:\s]*', '', line).strip()
                elif ('head' in line_lower or 'hod' in line_lower) and 'department' in line_lower and not metadata["hod_name"]:
                    metadata["hod_name"] = re.sub(
                        r'(?:Head|head|HOD|hod).*?(?:Department|department)[:\s]*', '', line).strip()

            # Extract program overview (section 14)
            overview_section = re.search(
                r'14\.\s*Program Overview.*?\n(.+?)(?=15\.|Program Educational|$)', text, re.IGNORECASE | re.DOTALL)
            if overview_section:
                metadata["program_overview"] = overview_section.group(1).strip()[
                    :2000]

            # Extract award details (sections 1-13)
            award_details = PDDataExtractor.extract_award_details(text)
            metadata.update(award_details)

        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")

        return metadata

    @staticmethod
    def extract_award_details(text: str) -> Dict[str, str]:
        """Extract award and accreditation details"""
        award = {
            "title_of_award": "",
            "modes_of_study": "",
            "awarding_body": "",
            "joint_award": "",
            "teaching_institution": "",
            "date_program_specs": "",
            "date_approval": "",
            "next_review": "",
            "approving_body": "",
            "accredited_body": "",
            "accreditation_grade": "",
            "accreditation_validity": "",
            "benchmark": "",
        }

        try:
            # Extract each numbered item
            patterns = {
                "title_of_award": r'1\.\s*(?:Title of the Award|Title of Award)[:\s]*([^\n]+)',
                "modes_of_study": r'2\.\s*(?:Modes of Study)[:\s]*([^\n]+)',
                "awarding_body": r'3\.\s*(?:Awarding Institution|Awarding Body)[:\s]*([^\n]+)',
                "joint_award": r'4\.\s*(?:Joint Award)[:\s]*([^\n]+)',
                "teaching_institution": r'5\.\s*(?:Teaching Institution)[:\s]*([^\n]+)',
                "date_program_specs": r'6\.\s*(?:Date of Program Specifications)[:\s]*([^\n]+)',
                "date_approval": r'7\.\s*(?:Date of Course Approval)[:\s]*([^\n]+)',
                "next_review": r'8\.\s*(?:Next Review Date)[:\s]*([^\n]+)',
                "approving_body": r'9\.\s*(?:Program Approving Body)[:\s]*([^\n]+)',
                "accredited_body": r'10\.\s*(?:Program Accredited Body)[:\s]*([^\n]+)',
                "accreditation_grade": r'11\.\s*(?:Grade Awarded)[:\s]*([^\n]+)',
                "accreditation_validity": r'12\.\s*(?:Program Accreditation Validity)[:\s]*([^\n]+)',
                "benchmark": r'13\.\s*(?:Program Benchmark)[:\s]*([^\n]+)',
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    award[key] = match.group(1).strip()

        except Exception as e:
            logger.error(f"Error extracting award details: {e}")

        return award

    @staticmethod
    def extract_peos(text: str) -> List[Dict[str, str]]:
        """Extract Program Educational Objectives"""
        peos = []
        try:
            # Find PEO section
            peo_section = re.search(
                r'15\.\s*Program Educational Objectives.*?(?=16\.|Program Outcomes|Program Specific|$)',
                text,
                re.IGNORECASE | re.DOTALL
            )

            if peo_section:
                peo_text = peo_section.group(0)
                # Extract PEOs with numbers
                peo_items = re.findall(
                    r'(?:PEO[- ]?\d+|PE[- ]?\d+)[:\s\.]*([^\n]+(?:\n[^\n]+)*?)(?=PEO[- ]?\d+|PE[- ]?\d+|$)',
                    peo_text,
                    re.IGNORECASE
                )

                for i, desc in enumerate(peo_items, 1):
                    if desc.strip():
                        peos.append({
                            "peo_code": f"PEO{i}",
                            "description": desc.strip(),
                            "order": i
                        })

        except Exception as e:
            logger.error(f"Error extracting PEOs: {e}")

        return peos

    @staticmethod
    def extract_pos(text: str) -> List[Dict[str, str]]:
        """Extract Program Outcomes"""
        pos = []
        try:
            # Find PO section
            po_section = re.search(
                r'16\.\s*Program Outcomes.*?(?=17\.|Program Specific|$)',
                text,
                re.IGNORECASE | re.DOTALL
            )

            if po_section:
                po_text = po_section.group(0)
                # Extract POs with numbers (engineering POs typically 1-12)
                po_items = re.findall(
                    r'(?:PO[- ]?\d+|PO[- ]?\([a-z]\))[:\s\.]*([^\n]+(?:\n[^\n]+)*?)(?=PO[- ]?\d+|PO[- ]?\([a-z]\)|$)',
                    po_text,
                    re.IGNORECASE
                )

                for i, desc in enumerate(po_items, 1):
                    if desc.strip():
                        pos.append({
                            "po_code": f"PO{i}",
                            "description": desc.strip(),
                            "order": i
                        })

        except Exception as e:
            logger.error(f"Error extracting POs: {e}")

        return pos

    @staticmethod
    def extract_psos(text: str) -> List[Dict[str, str]]:
        """Extract Program Specific Outcomes"""
        psos = []
        try:
            # Find PSO section
            pso_section = re.search(
                r'17\.\s*Program Specific Outcomes.*?(?=18\.|Definition of Credit|Programme Structure|$)',
                text,
                re.IGNORECASE | re.DOTALL
            )

            if pso_section:
                pso_text = pso_section.group(0)
                # Extract PSOs with numbers
                pso_items = re.findall(
                    r'(?:PSO[- ]?\d+)[:\s\.]*([^\n]+(?:\n[^\n]+)*?)(?=PSO[- ]?\d+|$)',
                    pso_text,
                    re.IGNORECASE
                )

                for i, desc in enumerate(pso_items, 1):
                    if desc.strip():
                        psos.append({
                            "pso_code": f"PSO{i}",
                            "description": desc.strip(),
                            "order": i
                        })

        except Exception as e:
            logger.error(f"Error extracting PSOs: {e}")

        return psos

    @staticmethod
    def extract_credit_definitions(text: str) -> Dict[str, int]:
        """Extract credit definitions"""
        credit_def = {"L": 1, "T": 1, "P": 2}  # Default values

        try:
            # Find credit definition section
            credit_section = re.search(
                r'Definition of Credit.*?(?=Sl\. No|Program - Category|Semester|$)',
                text,
                re.IGNORECASE | re.DOTALL
            )

            if credit_section:
                credit_text = credit_section.group(0)

                # Extract L, T, P definitions
                for component in ['L', 'T', 'P']:
                    pattern = rf'{component}.*?(\d+)\s*(?:credit|cr\.?)'
                    match = re.search(pattern, credit_text, re.IGNORECASE)
                    if match:
                        credit_def[component] = int(match.group(1))

        except Exception as e:
            logger.error(f"Error extracting credit definitions: {e}")

        return credit_def

    @staticmethod
    def extract_courses(text: str, tables: List) -> Dict[int, List[Dict]]:
        """Extract semester-wise courses"""
        courses_by_sem = {sem: [] for sem in range(1, 9)}

        try:
            # First, try to extract from text
            for sem in range(1, 9):
                sem_pattern = rf'Semester[- ]?{sem}.*?(?=Semester[- ]?{sem+1}|$)'
                sem_match = re.search(
                    sem_pattern, text, re.IGNORECASE | re.DOTALL)

                if sem_match:
                    sem_text = sem_match.group(0)
                    # Find course codes (UE24CSXXXX pattern or similar)
                    course_codes = re.findall(
                        r'([A-Z]{2}\d{2}[A-Z]{2}\d{4}|[A-Z]{4}\d{4})', sem_text)

                    for code in course_codes:
                        # Find title after code
                        title_pattern = rf'{code}\s+([^\n]+)'
                        title_match = re.search(title_pattern, sem_text)
                        title = title_match.group(
                            1).strip() if title_match else ""

                        # Find credits (usually at end of line)
                        credit_match = re.search(
                            rf'{code}.*?(\d+)\s*$', sem_text, re.MULTILINE)
                        credits = int(credit_match.group(
                            1)) if credit_match else 3

                        if title:
                            courses_by_sem[sem].append({
                                "code": code,
                                "title": title,
                                "credits": credits,
                                "type": "Theory",
                                "category": "Core"
                            })

            # Then, try to extract from tables
            for table in tables:
                if len(table) > 2:  # Reasonable table size
                    # Check if table has course-like structure
                    header_row = None
                    for i, row in enumerate(table[:3]):
                        row_str = ' '.join(str(cell) for cell in row if cell)
                        if 'course' in row_str.lower() and 'code' in row_str.lower():
                            header_row = i
                            break

                    if header_row is not None:
                        for row in table[header_row + 1:]:
                            if len(row) >= 2:
                                code = str(row[0]).strip() if row[0] else ""
                                title = str(row[1]).strip() if len(
                                    row) > 1 and row[1] else ""

                                # Only process if it looks like a course code
                                if code and re.match(r'[A-Z]{2,}\d{3,}', code):
                                    credits = 3
                                    if len(row) >= 3 and row[2]:
                                        try:
                                            credits = int(str(row[2]).strip())
                                        except:
                                            pass

                                    # Determine semester (could be in table context)
                                    semester = 1  # default
                                    for sem in range(1, 9):
                                        if f'sem{sem}' in str(table).lower() or f'semester{sem}' in str(table).lower():
                                            semester = sem
                                            break

                                    courses_by_sem[semester].append({
                                        "code": code,
                                        "title": title,
                                        "credits": credits,
                                        "type": "Theory",
                                        "category": "Core"
                                    })

        except Exception as e:
            logger.error(f"Error extracting courses: {e}")

        return courses_by_sem

    @staticmethod
    def extract_electives(text: str, tables: List) -> Dict[str, List[Dict]]:
        """Extract professional and open electives"""
        electives = {
            "professional": [],
            "open": []
        }

        try:
            # Find elective sections
            elective_patterns = {
                "professional": r'Professional Electives.*?(?=Open Electives|Elective Pools|$)',
                "open": r'Open Electives.*?(?=Professional Electives|Elective Pools|$)'
            }

            for elec_type, pattern in elective_patterns.items():
                elec_section = re.search(
                    pattern, text, re.IGNORECASE | re.DOTALL)
                if elec_section:
                    elec_text = elec_section.group(0)

                    # Extract course codes from elective section
                    course_codes = re.findall(
                        r'([A-Z]{2}\d{2}[A-Z]{2}\d{4}|[A-Z]{4}\d{4})', elec_text)

                    for code in course_codes:
                        # Find title after code
                        title_pattern = rf'{code}\s+([^\n]+)'
                        title_match = re.search(title_pattern, elec_text)
                        title = title_match.group(
                            1).strip() if title_match else ""

                        if title:
                            electives[elec_type].append({
                                "code": code,
                                "title": title,
                                "credits": 3,  # Default for electives
                                "semester": 5   # Default semester for electives
                            })

        except Exception as e:
            logger.error(f"Error extracting electives: {e}")

        return electives


def parse_pdf_document(file_content: bytes) -> Dict[str, Any]:
    """Main PDF parsing function"""
    doc_id = str(uuid.uuid4())
    result = {
        "doc_id": doc_id,
        "timestamp": datetime.now().isoformat(),
        "metadata": {},
        "peos": [],
        "pos": [],
        "psos": [],
        "credit_def": {"L": 1, "T": 1, "P": 2},
        "courses": {},
        "electives": {"professional": [], "open": []},
        "parsing_errors": [],
        "extracted_tables": [],
        "raw_text": "",
        "statistics": {
            "pages_processed": 0,
            "tables_found": 0,
            "courses_found": 0,
            "outcomes_found": 0
        }
    }

    try:
        pdf_file = io.BytesIO(file_content)

        with pdfplumber.open(pdf_file) as pdf:
            full_text = ""
            all_tables = []

            # Process each page
            for page_num, page in enumerate(pdf.pages, 1):
                try:
                    # Extract text
                    page_text = page.extract_text() or ""
                    full_text += f"\n--- Page {page_num} ---\n{page_text}"

                    # Extract tables
                    page_tables = page.extract_tables()
                    for table in page_tables:
                        if table and len(table) > 1:
                            all_tables.append({
                                "page": page_num,
                                "data": table
                            })

                except Exception as e:
                    result["parsing_errors"].append({
                        "page": page_num,
                        "error": f"Page processing error: {str(e)}"
                    })

            result["raw_text"] = full_text[:10000]  # Store first 10k chars
            result["extracted_tables"] = all_tables
            result["statistics"]["pages_processed"] = len(pdf.pages)
            result["statistics"]["tables_found"] = len(all_tables)

            # Extract all data
            extractor = PDDataExtractor()

            # Metadata
            result["metadata"] = extractor.extract_program_metadata(full_text)

            # Outcomes
            result["peos"] = extractor.extract_peos(full_text)
            result["pos"] = extractor.extract_pos(full_text)
            result["psos"] = extractor.extract_psos(full_text)
            result["statistics"]["outcomes_found"] = len(
                result["peos"]) + len(result["pos"]) + len(result["psos"])

            # Credit definitions
            result["credit_def"] = extractor.extract_credit_definitions(
                full_text)

            # Courses
            courses_by_sem = extractor.extract_courses(full_text, all_tables)
            result["courses"] = courses_by_sem

            # Calculate total courses
            total_courses = sum(len(courses)
                                for courses in courses_by_sem.values())
            result["statistics"]["courses_found"] = total_courses

            # Calculate total credits
            total_credits = 0
            for sem, courses in courses_by_sem.items():
                for course in courses:
                    total_credits += course.get("credits", 0)

            result["metadata"]["total_credits"] = total_credits
            result["metadata"]["academic_credits"] = total_credits

            # Electives
            electives = extractor.extract_electives(full_text, all_tables)
            result["electives"] = electives

            # Store in memory
            parsed_docs_store[doc_id] = result

    except Exception as e:
        result["parsing_errors"].append({
            "field": "Document",
            "reason": f"Document parsing failed: {str(e)}"
        })

    return result


async def parse_pdf_background(file_content: bytes, doc_id: str):
    """Background task for parsing PDF"""
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            executor,
            parse_pdf_document,
            file_content
        )
        parsed_docs_store[doc_id] = result
    except Exception as e:
        logger.error(f"Background parsing failed: {e}")


@app.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Parse PDF document endpoint"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400, detail="Only PDF files are supported")

        content = await file.read()
        doc_id = str(uuid.uuid4())

        if background_tasks:
            # Process in background
            background_tasks.add_task(parse_pdf_background, content, doc_id)
            return JSONResponse({
                "success": True,
                "doc_id": doc_id,
                "message": "Document queued for parsing",
                "status": "processing"
            })
        else:
            # Process immediately
            result = parse_pdf_document(content)
            return JSONResponse({
                "success": True,
                "doc_id": doc_id,
                "data": result,
                "status": "completed"
            })

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Parsing failed: {str(e)}")


@app.get("/api/parse-status/{doc_id}")
async def get_parse_status(doc_id: str):
    """Get parsing status for a document"""
    if doc_id in parsed_docs_store:
        return JSONResponse({
            "success": True,
            "status": "completed",
            "data": parsed_docs_store[doc_id]
        })
    else:
        return JSONResponse({
            "success": True,
            "status": "processing",
            "message": "Document is still being processed"
        })


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "PD Parser API",
        "version": "2.0.0",
        "docs_processed": len(parsed_docs_store)
    }


@app.post("/api/validate-pd-data")
async def validate_pd_data(data: Dict[str, Any]):
    """Validate extracted PD data"""
    try:
        required_fields = [
            "metadata.program_name",
            "metadata.scheme_year",
            "metadata.faculty",
            "metadata.department"
        ]

        errors = []
        warnings = []

        # Check required fields
        for field in required_fields:
            parts = field.split('.')
            current = data
            for part in parts:
                if part in current:
                    current = current[part]
                else:
                    errors.append(f"Missing required field: {field}")
                    break
            else:
                if not current:
                    warnings.append(f"Empty value for field: {field}")

        # Validate credit structure
        if "credit_def" in data:
            credits = data["credit_def"]
            if not all(isinstance(v, (int, float)) for v in credits.values()):
                errors.append("Credit definitions must be numeric")

        # Validate courses
        total_courses = 0
        if "courses" in data:
            for sem, courses in data["courses"].items():
                if isinstance(courses, list):
                    total_courses += len(courses)
                    for course in courses:
                        if "code" not in course or "title" not in course:
                            warnings.append(
                                f"Course missing code or title in semester {sem}")

        return JSONResponse({
            "success": True,
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "statistics": {
                "total_courses": total_courses,
                "total_errors": len(errors),
                "total_warnings": len(warnings)
            }
        })

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Validation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
