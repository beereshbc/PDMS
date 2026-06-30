import pdfplumber
import re


def detect_schema(file_path):
    """
    Dynamically identifies the schema version using regex patterns, 
    course codes (UE24 vs UE26), and semantic keywords.
    """
    text_sample = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            # Read first 6 pages to grab metadata and early tables
            for i in range(min(6, len(pdf.pages))):
                page_text = pdf.pages[i].extract_text()
                if page_text:
                    text_sample += page_text + "\n"

        # 1. Explicit Headers
        if re.search(r'(?i)2026\s*Scheme', text_sample):
            return "2026"
        if re.search(r'(?i)2024\s*Scheme', text_sample):
            return "2024"

        # 2. Course Code Patterns
        if re.search(r'UE26[A-Z]{2}\d+', text_sample):
            return "2026"
        if re.search(r'UE24[A-Z]{2}\d+', text_sample):
            return "2024"

        # 3. Structural Categories (Merged vs Separated)
        if re.search(r'(?i)Competency\s+and\s+Skills', text_sample):
            return "2026"
        if re.search(r'(?i)Technical\s+Competency', text_sample):
            return "2024"

        # Fallback to existing 2024 format if uncertain
        return "2024"
    except Exception:
        return "2024"
