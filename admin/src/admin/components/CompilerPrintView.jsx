import React, { forwardRef } from "react";
import parse from "html-react-parser";

const isEmpty = (html) =>
  !html ||
  !html.trim() ||
  html.trim() === "<p><br></p>" ||
  html.trim() === "<p></p>";
const P = (html, fb = "Not provided.") =>
  parse(
    isEmpty(html) ? `<p style="color:#888;font-style:italic;">${fb}</p>` : html,
  );

const CompilerPrintView = forwardRef(({ bookData }, ref) => {
  if (!bookData) return null;

  const { programData: pd, courses } = bookData;
  const pdd = pd.pd_data || {};

  return (
    <div
      ref={ref}
      className="curriculum-print-container"
      style={{ display: "none" }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .curriculum-print-container, .curriculum-print-container * { visibility: visible; }
          .curriculum-print-container { 
            position: absolute; left: 0; top: 0; width: 100%; display: block !important; 
            font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000;
          }
          .page-break { page-break-before: always; }
          .cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
          h1 { font-family: Arial, sans-serif; font-size: 24pt; margin-bottom: 10px; color: #1a3a5c; }
          h2 { font-family: Arial, sans-serif; font-size: 18pt; margin-bottom: 5px; }
          h3 { font-family: Arial, sans-serif; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px;}
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; page-break-inside: auto;}
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top;}
          th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold;}
          .text-center { text-align: center; }
          .cdp-rich p { margin: 0 0 5px 0; text-align: justify;}
          .cdp-rich ul, .cdp-rich ol { padding-left: 20px; margin: 0 0 10px 0;}
          @page { size: A4 portrait; margin: 15mm 15mm; }
        }
      `}</style>

      {/* ─── COVER PAGE ─── */}
      <div className="cover-page">
        <h2>Curriculum Book</h2>
        <h1>{pd.program_name}</h1>
        <h3>Program Code: {pd.program_id}</h3>
        <p style={{ marginTop: "20px", fontSize: "14pt" }}>
          Scheme Year: {pd.scheme_year}
        </p>
        <p style={{ fontSize: "14pt" }}>Academic Year: {pd.effective_ay}</p>
        <p style={{ marginTop: "40px", fontSize: "12pt", color: "#555" }}>
          Document Version: v{pd.version_no}
        </p>
      </div>

      <div className="page-break"></div>

      {/* ─── PROGRAM DOCUMENT (PD) SUMMARY ─── */}
      <h1>Program Overview</h1>

      <h3>1. Institution Details</h3>
      <table>
        <tbody>
          <tr>
            <th style={{ width: "30%" }}>University</th>
            <td>{pdd.details?.university}</td>
          </tr>
          <tr>
            <th>Faculty</th>
            <td>{pdd.details?.faculty}</td>
          </tr>
          <tr>
            <th>School</th>
            <td>{pdd.details?.school}</td>
          </tr>
          <tr>
            <th>Department</th>
            <td>{pdd.details?.department}</td>
          </tr>
          <tr>
            <th>Head of Department</th>
            <td>{pdd.details?.hod}</td>
          </tr>
        </tbody>
      </table>

      <h3>2. Program Objectives</h3>
      <div className="cdp-rich">{P(pdd.overview)}</div>

      <h3>3. Program Educational Objectives (PEOs)</h3>
      <div className="cdp-rich">
        <ol>
          {pdd.peos?.filter(Boolean).map((peo, i) => (
            <li key={i}>{parse(peo)}</li>
          ))}
        </ol>
      </div>

      <h3>4. Program Structure</h3>
      {pdd.semesters?.map((sem, i) => (
        <div key={i}>
          <h4
            style={{ fontFamily: "Arial", fontSize: "12pt", marginTop: "15px" }}
          >
            Semester {sem.sem_no}
          </h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Type</th>
                <th className="text-center">Credits</th>
              </tr>
            </thead>
            <tbody>
              {sem.courses?.map((c, j) => (
                <tr key={j}>
                  <td className="text-center">{j + 1}</td>
                  <td>
                    <strong>{c.code}</strong>
                  </td>
                  <td>{c.title}</td>
                  <td>{c.type}</td>
                  <td className="text-center">{c.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ─── ALL COURSE DOCUMENTS (CDs) ─── */}
      {courses.map((cd, index) => (
        <div key={cd.courseCode}>
          <div className="page-break"></div>
          <h1>
            {cd.courseCode}: {cd.courseTitle}
          </h1>
          <p style={{ fontStyle: "italic", marginBottom: "20px" }}>
            Document Version: v{cd.cdVersion}
          </p>

          <h3>1. Course Identity</h3>
          <table>
            <tbody>
              <tr>
                <th style={{ width: "30%" }}>Course Code</th>
                <td>{cd.courseCode}</td>
              </tr>
              <tr>
                <th>Course Title</th>
                <td>{cd.courseTitle}</td>
              </tr>
              <tr>
                <th>Credits (L:T:P)</th>
                <td>
                  {cd.credits?.total} ({cd.credits?.L}:{cd.credits?.T}:
                  {cd.credits?.P})
                </td>
              </tr>
              <tr>
                <th>Total Hours</th>
                <td>{cd.totalHours}</td>
              </tr>
              <tr>
                <th>Faculty</th>
                <td>{cd.facultyTitle}</td>
              </tr>
            </tbody>
          </table>

          <h3>2. Course Overview & Objectives</h3>
          <div className="cdp-rich">
            <strong>Aims & Summary:</strong> {P(cd.aimsSummary)}
            <strong>Objectives:</strong> {P(cd.objectives)}
          </div>

          <h3>3. Course Outcomes (COs)</h3>
          {cd.courseOutcomes?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>CO</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {cd.courseOutcomes.map((co, j) => (
                  <tr key={j}>
                    <td className="text-center">
                      <strong>{co.code}</strong>
                    </td>
                    <td className="cdp-rich">{P(co.description)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No specific course outcomes provided.</p>
          )}

          <h3>4. Syllabus Content</h3>
          <div className="cdp-rich">{P(cd.courseContent)}</div>

          <h3>5. Resources</h3>
          <div className="cdp-rich">
            <strong>Text Books:</strong>
            <ul>
              {cd.resources?.textBooks?.length ? (
                cd.resources.textBooks.map((t, j) => <li key={j}>{t}</li>)
              ) : (
                <li>None</li>
              )}
            </ul>
            <strong>References:</strong>
            <ul>
              {cd.resources?.references?.length ? (
                cd.resources.references.map((r, j) => <li key={j}>{r}</li>)
              ) : (
                <li>None</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
});

export default CompilerPrintView;
