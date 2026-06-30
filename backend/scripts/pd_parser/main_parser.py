#!/usr/bin/env python3

from ai.llm_fallback import ai_fallback_parse
from normalizer import normalize_and_score
from schema_detector import detect_schema
import sys
import json
import traceback
import importlib.util
from pathlib import Path


# ==============================
# BASE PATH CONFIGURATION
# ==============================

BASE_DIR = Path(__file__).resolve().parent

SCHEMA_DIR = BASE_DIR / "schemas"


# ==============================
# Dynamic Import Helper
# ==============================

def load_module(module_name, file_path):

    spec = importlib.util.spec_from_file_location(
        module_name,
        file_path
    )

    module = importlib.util.module_from_spec(spec)

    spec.loader.exec_module(module)

    return module


# ==============================
# Load Schema Parsers
# ==============================
parser_2024_module = load_module(
    "parser_2024",
    SCHEMA_DIR / "parser_2024.py"
)


parser_2026_module = load_module(
    "parser_2026",
    SCHEMA_DIR / "parser_2026.py"
)


parse_2024 = parser_2024_module.parse_2024

parse_2026 = parser_2026_module.parse_2026


# ==============================
# Internal Modules
# ==============================


# ==============================
# Main Processing Engine
# ==============================

def process_pdf(file_path, requested_schema="auto"):

    try:

        # -----------------------
        # Schema Detection
        # -----------------------

        schema_version = requested_schema

        if schema_version not in ["2024", "2026"]:

            schema_version = detect_schema(file_path)

        # -----------------------
        # Parser Routing
        # -----------------------

        if schema_version == "2024":

            raw_data = parse_2024(file_path)

        elif schema_version == "2026":

            raw_data = parse_2026(file_path)

        else:

            raise Exception(
                f"Unsupported schema: {schema_version}"
            )

        # -----------------------
        # Normalization
        # -----------------------

        normalized_data, confidence, warnings = (
            normalize_and_score(raw_data)
        )

        # -----------------------
        # AI Recovery Layer
        # -----------------------

        if confidence < 0.60:

            normalized_data = ai_fallback_parse(

                file_path,

                normalized_data,

                warnings

            )

            normalized_data, confidence, warnings = (
                normalize_and_score(normalized_data)
            )

        return {

            "success": True,

            "schemaVersion": schema_version,

            "confidence": round(float(confidence), 2),

            "warnings": warnings,

            "data": normalized_data

        }

    except Exception as e:

        return {

            "success": False,

            "error": str(e),

            "traceback": traceback.format_exc()

        }


# ==============================
# CLI ENTRY
# ==============================
if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(json.dumps({

            "success": False,

            "error": "No PDF file path supplied"

        }))

        sys.exit(1)

    pdf_path = sys.argv[1]

    schema = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "auto"
    )

    output = process_pdf(
        pdf_path,
        schema
    )

    print(
        json.dumps(
            output,
            ensure_ascii=False
        )
    )
