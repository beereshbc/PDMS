def normalize_and_score(raw_data):
    """
    Ensures structural integrity matching React pdData format exactly.
    Calculates confidence based on successfully extracted components.
    """
    # Base structure required by frontend
    normalized = {
        "details": raw_data.get("details", {}),
        "award": raw_data.get("award", {}),
        "overview": raw_data.get("overview", ""),
        "peos": raw_data.get("peos", []),
        "pos": raw_data.get("pos", []),
        "psos": raw_data.get("psos", []),
        "credit_def": raw_data.get("credit_def", {"L": 0, "T": 0, "P": 0}),
        "structure_table": raw_data.get("structure_table", []),
        "semesters": raw_data.get("semesters", []),
        "prof_electives": raw_data.get("prof_electives", []),
        "open_electives": raw_data.get("open_electives", [])
    }

    warnings = []
    score = 0
    max_score = 100

    # 1. Metadata check (15%)
    if normalized["details"].get("program_name"):
        score += 15
    else:
        warnings.append("Missing program name in metadata.")

    # 2. Outcomes check (15%)
    if len(normalized["peos"]) > 0 and len(normalized["pos"]) > 0:
        score += 15
    else:
        warnings.append("Missing PEOs or POs.")

    # 3. Semester Structure Check (50%)
    sems = normalized["semesters"]
    if len(sems) >= 4:
        score += 25
        # Check if courses/categories actually got extracted
        total_courses = 0
        for s in sems:
            total_courses += len(s.get("courses", []))  # 2024 flat
            for cat in s.get("categories", []):        # 2026 merged
                total_courses += len(cat.get("courses", []))

        if total_courses > 10:
            score += 25
        else:
            warnings.append("Very few courses detected in semesters.")
    else:
        warnings.append(f"Only {len(sems)} semesters detected.")

    # 4. Electives (20%)
    if len(normalized["prof_electives"]) > 0 or len(normalized["open_electives"]) > 0:
        score += 20
    else:
        warnings.append("No professional or open electives detected.")

    confidence = score / max_score
    return normalized, confidence, warnings
