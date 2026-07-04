// backend/utils/curriculumHtmlGenerator.js

/**
 * Generate the full HTML string for the Curriculum Book
 * (without the cover page – static cover PDF is merged separately)
 * @param {Object} bookData - Contains programData and courses
 * @param {Object} options - Options for generation
 * @param {boolean} options.includeTOC - Whether to include TOC (default: true)
 * @returns {string} - Full HTML document as string
 */
// backend/utils/curriculumHtmlGenerator.js

export const generateCurriculumHTML = (bookData, options = {}) => {
  const { includeTOC = true } = options;
  if (!bookData) return "";

  const { programData, courses } = bookData;
  const pd = programData?.pd_data || {};
  const pdd = pd;

  const renderHTML = (content) => content || "";

  // ──────────────────────────────────────────────────────────────
  // 1. BUILD TABLE OF CONTENTS (Without Page Numbers)
  // ──────────────────────────────────────────────────────────────
  const buildTOC = () => {
    let tocItems = [];

    // Semesters and their courses
    const semesters = pdd.semesters || [];
    semesters.forEach((sem) => {
      const semNo = sem.sem_no || "?";
      tocItems.push({ level: 1, title: `Semester ${semNo}` });

      // Flat courses (2024 schema)
      const coursesList = sem.courses || [];
      coursesList.forEach((c) => {
        if (c.code && c.title) {
          tocItems.push({ level: 2, title: `${c.code} – ${c.title}` });
        }
      });

      // Categories (2026 schema)
      const categories = sem.categories || [];
      categories.forEach((cat) => {
        if (cat.categoryName) {
          tocItems.push({ level: 2, title: cat.categoryName });
        }
        (cat.courses || []).forEach((c) => {
          if (c.code && c.title) {
            tocItems.push({ level: 3, title: `${c.code} – ${c.title}` });
          }
        });
      });
    });

    // Generate TOC HTML
    let html = `
      <div style="page-break-before: always; padding: 40px; font-family: 'Times New Roman', Times, serif;">
        <h1 style="text-align: center; font-size: 20pt; border-bottom: 2px solid #000; padding-bottom: 10px;">Table of Contents</h1>
        <ul style="list-style: none; padding-left: 0; font-size: 11pt; line-height: 2;">
    `;

    tocItems.forEach((item) => {
      const indent = item.level * 20;
      const isBold = item.level === 0 ? "font-weight: bold;" : "";
      html += `<li style="padding-left: ${indent}px; ${isBold}">${item.title}</li>`;
    });

    html += `
        </ul>
      </div>
    `;
    return html;
  };

  // ──────────────────────────────────────────────────────────────
  // 2. RENDER PROGRAM OVERVIEW (without semesters)
  // ──────────────────────────────────────────────────────────────
  const renderOverview = () => {
    return `
      <div style="page-break-before: always; padding: 40px;">
        <h1 style="text-align: center;">Program Overview</h1>

        <h3>1. Institution Details</h3>
        <table>
          <tbody>
            <tr><th style="width:30%;">University</th><td>${pdd.details?.university || ""}</td></tr>
            <tr><th>Faculty</th><td>${pdd.details?.faculty || ""}</td></tr>
            <tr><th>School</th><td>${pdd.details?.school || ""}</td></tr>
            <tr><th>Department</th><td>${pdd.details?.department || ""}</td></tr>
            <tr><th>Head of Department</th><td>${pdd.details?.hod || ""}</td></tr>
          </tbody>
        </table>

        <h3>2. Program Objectives</h3>
        <div class="cdp-rich">${renderHTML(pdd.overview)}</div>

        <h3>3. Program Educational Objectives (PEOs)</h3>
        <div class="cdp-rich">
          <ol>
            ${(pdd.peos || [])
              .filter(Boolean)
              .map((peo) => `<li>${renderHTML(peo)}</li>`)
              .join("")}
          </ol>
        </div>
      </div>
    `;
  };

  // ──────────────────────────────────────────────────────────────
  // 3. RENDER SEMESTERS (Program Structure)
  // ──────────────────────────────────────────────────────────────
  const renderSemesters = () => {
    if (!pdd.semesters || pdd.semesters.length === 0) return "";

    return `
      <div style="padding: 40px;">
        <h3>4. Program Structure</h3>
        ${pdd.semesters
          .map((sem) => {
            const coursesList = sem.courses || [];
            if (coursesList.length === 0) return "";

            return `
              <div style="page-break-before: auto; margin-bottom: 30px;">
                <h4 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                  Semester ${sem.sem_no}
                </h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; page-break-inside: auto;">
                  <thead>
                    <tr>
                      <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0; font-weight: bold;">#</th>
                      <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0; font-weight: bold;">Course Code</th>
                      <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0; font-weight: bold;">Course Title</th>
                      <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0; font-weight: bold;">Type</th>
                      <th style="border: 1px solid #000; padding: 6px; text-align: center; background-color: #f0f0f0; font-weight: bold;">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${coursesList
                      .map(
                        (c, idx) => `
                        <tr>
                          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
                          <td style="border: 1px solid #000; padding: 6px;"><strong>${c.code || ""}</strong></td>
                          <td style="border: 1px solid #000; padding: 6px;">${c.title || ""}</td>
                          <td style="border: 1px solid #000; padding: 6px;">${c.type || "Theory"}</td>
                          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.credits || 0}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  // ──────────────────────────────────────────────────────────────
  // 4. RENDER COURSE DOCUMENTS
  // ──────────────────────────────────────────────────────────────
  const renderCourseDocuments = () => {
    if (!courses || courses.length === 0) return "";

    return courses
      .map((cd) => {
        const cdData = cd || {};

        return `
          <div style="page-break-before: always; padding-top: 20px;">
            <h1 style="font-family: Arial, sans-serif; font-size: 24pt; margin-bottom: 10px; color: #1a3a5c;">
              ${cdData.courseCode || "Course"}: ${cdData.courseTitle || "Untitled"}
            </h1>
            <p style="font-style: italic; margin-bottom: 20px;">
              Document Version: v${cdData.cdVersion || "1.0.0"}
            </p>

            <!-- Course Identity -->
            <h3 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">1. Course Identity</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt;">
              <tbody>
                <tr>
                  <th style="width: 30%; border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Course Code</th>
                  <td style="border: 1px solid #000; padding: 6px;">${cdData.courseCode || ""}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Course Title</th>
                  <td style="border: 1px solid #000; padding: 6px;">${cdData.courseTitle || ""}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Credits (L:T:P)</th>
                  <td style="border: 1px solid #000; padding: 6px;">${cdData.credits?.total || 0} (${cdData.credits?.L || 0}:${cdData.credits?.T || 0}:${cdData.credits?.P || 0})</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Total Hours</th>
                  <td style="border: 1px solid #000; padding: 6px;">${cdData.totalHours || 0}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Faculty</th>
                  <td style="border: 1px solid #000; padding: 6px;">${cdData.facultyTitle || ""}</td>
                </tr>
              </tbody>
            </table>

            <!-- Overview & Objectives -->
            <h3 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">2. Course Overview & Objectives</h3>
            <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 15px;">
              <strong>Aims & Summary:</strong>
              <div style="margin-left: 10px; margin-bottom: 10px;">${renderHTML(cdData.aimsSummary)}</div>
              <strong>Objectives:</strong>
              <div style="margin-left: 10px;">${renderHTML(cdData.objectives)}</div>
            </div>

            <!-- Course Outcomes -->
            <h3 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">3. Course Outcomes (COs)</h3>
            ${
              cdData.courseOutcomes && cdData.courseOutcomes.length > 0
                ? `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt;">
                  <thead>
                    <tr>
                      <th style="width: 15%; border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">CO</th>
                      <th style="border: 1px solid #000; padding: 6px; text-align: left; background-color: #f0f0f0;">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cdData.courseOutcomes
                      .map(
                        (co) => `
                        <tr>
                          <td style="border: 1px solid #000; padding: 6px; text-align: center;"><strong>${co.code || ""}</strong></td>
                          <td style="border: 1px solid #000; padding: 6px;">${renderHTML(co.description)}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
                `
                : "<p>No specific course outcomes provided.</p>"
            }

            <!-- Syllabus Content -->
            <h3 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">4. Syllabus Content</h3>
            <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 15px;">${renderHTML(cdData.courseContent)}</div>

            <!-- Resources -->
            <h3 style="font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;">5. Resources</h3>
            <div style="font-size: 11pt; line-height: 1.6;">
              <strong>Text Books:</strong>
              <ul>
                ${cdData.resources?.textBooks?.length
                  ? cdData.resources.textBooks.map((t) => `<li>${t}</li>`).join("")
                  : "<li>None</li>"
                }
              </ul>
              <strong>References:</strong>
              <ul>
                ${cdData.resources?.references?.length
                  ? cdData.resources.references.map((r) => `<li>${r}</li>`).join("")
                  : "<li>None</li>"
                }
              </ul>
            </div>
          </div>
        `;
      })
      .join("");
  };

  // ──────────────────────────────────────────────────────────────
  // 5. BUILD FINAL HTML (new order)
  // ──────────────────────────────────────────────────────────────

  const overviewHtml = renderOverview();
  const semestersHtml = renderSemesters();
  const tocHtml = includeTOC ? buildTOC() : '';
  const courseHtml = renderCourseDocuments();

  // Assemble: Overview → Semesters → TOC → Course Documents
  const fullContent = `
    ${overviewHtml}
    ${semestersHtml}
    ${tocHtml}
    ${courseHtml}
  `;

  // ──────────────────────────────────────────────────────────────
  // 6. WRAP IN FULL HTML DOCUMENT
  // ──────────────────────────────────────────────────────────────

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${programData.program_name || "Curriculum Book"}</title>
      <style>
        /* --- Base Print Styles --- */
        @page {
          size: A4 portrait;
          margin: 15mm 15mm;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .curriculum-print-container {
          display: block;
          width: 100%;
        }
        .page-break {
          page-break-before: always;
        }
        h1 {
          font-family: Arial, sans-serif;
          font-size: 24pt;
          margin-bottom: 10px;
          color: #1a3a5c;
        }
        h2 {
          font-family: Arial, sans-serif;
          font-size: 18pt;
          margin-bottom: 5px;
        }
        h3 {
          font-family: Arial, sans-serif;
          font-size: 14pt;
          margin-top: 20px;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        h4 {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          margin-top: 15px;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10pt;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f0f0f0 !important;
          font-weight: bold;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .text-center {
          text-align: center;
        }
        .cdp-rich p {
          margin: 0 0 5px 0;
          text-align: justify;
        }
        .cdp-rich ul, .cdp-rich ol {
          padding-left: 20px;
          margin: 0 0 10px 0;
        }

        /* --- Print-specific overrides --- */
        @media print {
          body * { visibility: visible; }
          .curriculum-print-container, .curriculum-print-container * { visibility: visible; }
          .curriculum-print-container {
            position: relative;
            display: block;
            width: 100%;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="curriculum-print-container">
        ${fullContent}
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for the Table of Contents with accurate page numbers
 * @param {Object} bookData - Contains programData and courses
 * @param {Map<string, number>} coursePageMap - Map of courseCode -> page index (0‑based in curriculum PDF)
 * @param {number} coverPageCount - Number of pages in the cover PDF (to offset page numbers)
 * @returns {string} - HTML string for the TOC page
 */
export const generateTOCWithPageNumbers = (bookData, coursePageMap, coverPageCount = 0) => {
  const { programData } = bookData;
  const pd = programData?.pd_data || {};
  const pdd = pd;

  const getPage = (code) => {
    const pageIndex = coursePageMap.get(code);
    if (pageIndex === undefined) return '?';
    return pageIndex + 1 + coverPageCount;
  };

  let tocItems = [];

  // Program Overview
  tocItems.push({ level: 0, title: "Program Overview", page: 1 + coverPageCount });

  // Semesters and courses
  const semesters = pdd.semesters || [];
  semesters.forEach((sem) => {
    const semNo = sem.sem_no || "?";
    const firstCourse = sem.courses?.[0] || sem.categories?.[0]?.courses?.[0];
    let semPage = '?';
    if (firstCourse && firstCourse.code) {
      semPage = getPage(firstCourse.code);
    }
    tocItems.push({ level: 1, title: `Semester ${semNo}`, page: semPage });

    // Flat courses
    const coursesList = sem.courses || [];
    coursesList.forEach((c) => {
      if (c.code && c.title) {
        tocItems.push({ level: 2, title: `${c.code} – ${c.title}`, page: getPage(c.code) });
      }
    });

    // Categories
    const categories = sem.categories || [];
    categories.forEach((cat) => {
      if (cat.categoryName) {
        tocItems.push({ level: 2, title: cat.categoryName, page: '—' });
      }
      (cat.courses || []).forEach((c) => {
        if (c.code && c.title) {
          tocItems.push({ level: 3, title: `${c.code} – ${c.title}`, page: getPage(c.code) });
        }
      });
    });
  });

  // Build HTML
  let html = `
    <div style="page-break-before: always; padding: 40px; font-family: 'Times New Roman', Times, serif;">
      <h1 style="text-align: center; font-size: 20pt; border-bottom: 2px solid #000; padding-bottom: 10px;">Table of Contents</h1>
      <ul style="list-style: none; padding-left: 0; font-size: 11pt; line-height: 2;">
  `;

  tocItems.forEach((item) => {
    const indent = item.level * 20;
    const isBold = item.level === 0 ? "font-weight: bold;" : "";
    const pageStr = item.page !== undefined ? item.page : '—';
    html += `
      <li style="display: flex; justify-content: space-between; align-items: center; padding-left: ${indent}px; ${isBold}">
        <span>${item.title}</span>
        <span style="font-family: 'Times New Roman', Times, serif;">${pageStr}</span>
      </li>
    `;
  });

  html += `
      </ul>
    </div>
  `;

  return html;
};