// backend/services/pdfGenerator.js
import puppeteer from "puppeteer-core";
import fs from "fs";

/**
 * Find Chrome executable path on Windows
 */
const getChromePath = () => {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe",
    process.env.CHROME_PATH,
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      console.log(`✅ Chrome found at: ${p}`);
      return p;
    }
  }

  // If Chrome is installed via winget or chocolatey, try this:
  const commonPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Chrome found at: ${p}`);
      return p;
    }
  }

  throw new Error(
    "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable.\n" +
    "Common locations:\n" +
    "  - C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n" +
    "  - C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  );
};

/**
 * Convert HTML string to PDF buffer using Puppeteer
 * @param {string} html - Full HTML document as a string
 * @param {Object} options - PDF options (optional)
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generatePDF = async (html, options = {}) => {
  const {
    format = "A4",
    landscape = false,
    margin = { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
  } = options;

  // Get Chrome path
  const executablePath = getChromePath();

  // Launch browser with explicit path
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

/**
 * Alias for generatePDF - specifically for curriculum books
 */
export const generateCurriculumPDF = async (html) => {
  return generatePDF(html, {
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
  });
};