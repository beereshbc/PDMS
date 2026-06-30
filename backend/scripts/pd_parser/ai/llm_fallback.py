import os
import json


def ai_fallback_parse(file_path, current_data, warnings):
    """
    If the normal extraction fails (Confidence < 60%), this hooks into 
    Google Generative AI (if configured) to repair broken JSON arrays.
    """
    api_key = os.environ.get("AIzaSyDgC0oqPKWRkw1IHR51V5bTghX1s9VDGdI")
    if not api_key:
        return current_data  # Return as-is if no API key is available

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        # Initialize the model (using JSON mode if supported by the model version)
        model = genai.GenerativeModel('gemini-3-flash-preview')

        prompt = f"""
        You are an AI recovery agent for an academic parsing system.
        The standard regex parser failed to extract the following sections properly: {', '.join(warnings)}.
        
        Here is the partially extracted JSON:
        {json.dumps(current_data, indent=2)}
        
        Please return the repaired JSON. Ensure missing courses or broken strings are fixed based on typical academic formatting. 
        CRITICAL: Return ONLY valid JSON.
        """

        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        repaired_data = json.parse(text)

        return repaired_data
    except Exception as e:
        # If AI fails, gracefully degrade back to the original extracted data
        print(f"AI Fallback failed: {str(e)}")
        return current_data
