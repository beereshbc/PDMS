// backend/services/pdfGenerator.js
import puppeteer from "puppeteer-core";
import fs from "fs";
import chromium from "@sparticuz/chromium";

const getChromePath = () => {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe",
    process.env.CHROME_PATH,
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      console.log(`Chrome found at: ${p}`);
      return p;
    }
  }
  throw new Error("Chrome not found. Please install Google Chrome.");
};

const isProduction =
  process.env.NODE_ENV === "production" ||
  !!process.env.VERCEL ||
  !!process.env.RENDER;

export const generatePDF = async (html, options = {}) => {
  const {
    format = "A4",
    landscape = false,
    margin = {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm",
    },
    baseUrl = null,
  } = options;
  let browser;
  try {
    if (isProduction) {
      console.log("Launching bundled Chromium...");
      browser = await puppeteer.launch({
        executablePath: await chromium.executablePath(),
        headless: true,
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    } else {
      console.log("Launching local Chrome...");
      browser = await puppeteer.launch({
        executablePath: getChromePath(),
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    }
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      if (
        resourceType === "document" ||
        resourceType === "stylesheet" ||
        resourceType === "image" ||
        resourceType === "font"
      ) {
        request.continue();
        return;
      }
      if (
        resourceType === "script" ||
        resourceType === "xhr" ||
        resourceType === "fetch" ||
        resourceType === "media" ||
        resourceType === "websocket" ||
        resourceType === "manifest"
      ) {
        console.log(`Blocking ${resourceType}: ${url}`);
        request.abort();
        return;
      }
      request.continue();
    });
    page.on("requestfailed", (request) => {
      console.warn(
        `Resource failed: ${request.url()} | ${request.failure()?.errorText || "unknown"}`
      );
    });

    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm;
      min-height: 297mm;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: #ffffff;
    }
    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
      }
      .page {
        width: 210mm !important;
        height: 297mm !important;
        page-break-after: always;
        break-after: page;
      }
    }
    .page {
      position: relative;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      background: #ffffff;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    .cover-bg {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
      display: block;
      z-index: 0;
    }
    .university,
    .curriculum,
    .scheme,
    .semester,
    .btech,
    .in,
    .course,
    .logo,
    .school,
    .year {
      z-index: 2;
      position: absolute;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      max-width: 80%;
    }
    .university {
      top: 8%;
      left: 69%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 70%;
      text-align: center;
      color: #5a1719;
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 700;
      letter-spacing: 3px;
    }
    .curriculum {
      top: 16%;
      left: 69%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 70%;
      text-align: center;
      color: #5a1719;
      font-size: clamp(28px, 4.5vw, 44px);
      font-weight: 700;
      text-decoration: underline;
      text-decoration-thickness: 3px;
      text-underline-offset: 12px;
    }
    .scheme {
      top: 23%;
      left: 70%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 70%;
      text-align: center;
      color: #5a1719;
      font-size: clamp(26px, 4vw, 42px);
      font-weight: 700;
    }
    .semester {
      top: 30%;
      left: 70%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 70%;
      text-align: center;
      color: #5a1719;
      font-size: clamp(24px, 3.8vw, 38px);
      font-weight: 700;
    }
    .btech {
      top: 39%;
      left: 55%;
      width: 180px;
      max-width: 25%;
      text-align: right;
      color: #5a1719;
      font-size: clamp(20px, 3.2vw, 34px);
      font-weight: 400;
    }
    .in {
      top: 44%;
      left: 72%;
      transform: translateX(-50%);
      width: auto;
      max-width: 20%;
      text-align: center;
      color: #5a1719;
      font-size: clamp(18px, 2.8vw, 28px);
      font-weight: 400;
    }
    .course {
      top: 48%;
      right: -4%;
      width: 420px;
      max-width: 55%;
      text-align: left;
      color: #5a1719;
      font-size: clamp(22px, 3.5vw, 36px);
      font-weight: 700;
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }
    .course .indent {
      padding-left: 60px;
      display: inline-block;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }
    .logo {
      left: 4%;
      bottom: 40%;
      width: clamp(150px, 24vw, 250px);
      height: auto;
      object-fit: contain;
      display: block;
    }
    .school {
      left: 30%;
      transform: translateX(-50%);
      bottom: 30%;
      width: 700px;
      max-width: 70%;
      text-align: center;
      color: #e4a92b;
      font-size: clamp(18px, 2.6vw, 24px);
      line-height: 1.5;
      font-weight: 300;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }
    .year {
      right: 6%;
      bottom: 4%;
      color: #e4a92b;
      font-size: clamp(20px, 3vw, 30px);
      letter-spacing: 8px;
      font-weight: 400;
      white-space: nowrap;
      max-width: 40%;
    }
    .year::before,
    .year::after {
      content: "";
      display: inline-block;
      width: clamp(30px, 5vw, 50px);
      height: 2px;
      background: #e4a92b;
      vertical-align: middle;
      margin: 0 12px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
`;
    console.log(`HTML length: ${styledHtml.length}`);
    if (baseUrl) {
      console.log(`Base URL requested: ${baseUrl}`);
    }

    console.log("Starting Puppeteer setContent...");
    const startTime = Date.now();
    
    await page.setContent(styledHtml, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log(
      `setContent completed in ${Date.now() - startTime}ms`
    );

    try {
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images.map((img) => {
            if (img.complete) {
              return Promise.resolve();
            }
            return new Promise((resolve) => {
              img.addEventListener("load", resolve, {
                once: true,
              });
              img.addEventListener("error", resolve, {
                once: true,
              });
            });
          })
        );
      });
      console.log("Images finished loading");
    } catch (imageError) {
      console.warn(
        "Image loading check failed:",
        imageError.message
      );
    }

    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(
      `PDF generated successfully: ${pdfBuffer.length} bytes`
    );
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw err;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed");
      } catch (closeError) {
        console.error(
          "Failed to close browser:",
          closeError.message
        );
      }
    }
  }
};

export const generateCurriculumPDF = async (
  html,
  options = {}
) => {
  const { returnMarkers = false } = options;
  const buffer = await generatePDF(html, {
    format: "A4",
    margin: {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm",
    },
    baseUrl: `file://${process.cwd()}/public/templates/front_matter/`,
  });

  if (!returnMarkers) {
    return buffer;
  }

  try {
    console.log("Extracting PDF markers...");
    const pdfjs = await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    );
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const pages = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => item.str)
        .join(" ");
      pages.push(text);
    }
    const markerMap = new Map();
    
    const markerRegex = /\[MARKER:([^\]]+)\]/g;
    pages.forEach((text, idx) => {
      let m;
      while ((m = markerRegex.exec(text)) !== null) {
        if (!markerMap.has(m[1])) {
          markerMap.set(m[1], idx);
        }
      }
    });

    if (markerMap.size === 0) {
      console.warn(
        "No markers found. Using text-based detection."
      );
      const courseRegex = /UE24CS\d{4}/g;
      const semRegex = /Semester (\d+)/g;
      const overviewRegex = /Program Overview/i;
      const structureRegex = /Program Structure/i;
      pages.forEach((text, idx) => {
        if (!text || text.trim().length < 10) {
          return;
        }
        if (
          overviewRegex.test(text) &&
          !markerMap.has("overview")
        ) {
          markerMap.set("overview", idx);
        }
        if (
          structureRegex.test(text) &&
          !markerMap.has("structure")
        ) {
          markerMap.set("structure", idx);
        }
        const semMatch = text.match(semRegex);
        if (semMatch && semMatch.length > 0) {
          const num = semMatch[0].match(/\d+/);
          if (
            num &&
            !markerMap.has(`semester-${num[0]}`)
          ) {
            markerMap.set(
              `semester-${num[0]}`,
              idx
            );
          }
        }
        const codes = text.match(courseRegex);
        if (codes && codes.length > 0) {
          const code = codes[0];
          if (!markerMap.has(`course-${code}`)) {
            markerMap.set(`course-${code}`, idx);
          }
        }
      });
    }
    console.log(
      `Extracted ${markerMap.size} markers/detections from ${pages.length} pages.`
    );
    return {
      buffer,
      markerMap,
    };
  } catch (err) {
    console.error(
      "Failed to extract markers:",
      err
    );
    return {
      buffer,
      markerMap: new Map(),
    };
  }
};