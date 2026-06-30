import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSER_TIMEOUT = 300000; // 5 Minutes

export const executePythonParser = (
  filePath,
  schemaVersion = "auto",
  isDynamic = true,
) => {
  return new Promise((resolve, reject) => {
    let responseSent = false;

    // Choose entry point based on route
    const scriptName = isDynamic
      ? path.join("dynamic_parser", "main_parser.py")
      : "pd_parser.py"; // Legacy fallback

    const scriptPath = path.join(__dirname, "..", "scripts", scriptName);
    const pythonCommand =
      process.env.NODE_ENV === "production" ? "python3" : "python";

    if (!fs.existsSync(scriptPath)) {
      return reject(new Error("Parser architecture missing at: " + scriptPath));
    }

    const pythonProcess = spawn(pythonCommand, [
      scriptPath,
      filePath,
      schemaVersion,
    ]);

    let stdoutData = "";
    let stderrData = "";

    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        pythonProcess.kill("SIGKILL");
        responseSent = true;
        reject(
          new Error("Parsing timed out. Document is too large or complex."),
        );
      }
    }, PARSER_TIMEOUT);

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
      // Only log python errors to node console, do not pollute JSON
      console.error(`[Python Parser Log]: ${data.toString().trim()}`);
    });

    pythonProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      if (!responseSent) {
        responseSent = true;
        reject(new Error("Failed to start Python engine."));
      }
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      if (responseSent) return;
      responseSent = true;

      if (code !== 0) {
        return reject(
          new Error(
            stderrData || "Python parsing engine crashed unexpectedly.",
          ),
        );
      }

      try {
        // Safely extract only the JSON payload from stdout
        const jsonStart = stdoutData.indexOf("{");
        const jsonEnd = stdoutData.lastIndexOf("}") + 1;

        if (jsonStart === -1) throw new Error("No JSON found in python output");

        const parsedData = JSON.parse(stdoutData.slice(jsonStart, jsonEnd));
        resolve(parsedData);
      } catch (err) {
        console.error("Parse Error Raw Output:", stdoutData);
        reject(new Error("Invalid JSON response from parsing engine."));
      }
    });
  });
};
