import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import parse from "html-react-parser";
import { toast } from "react-hot-toast";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { axios, createrToken } = useAppContext();

  const componentRef = useRef(null);
  const scalingWrapperRef = useRef(null);

  const [data, setData] = useState(
    location.state?.pdData
      ? {
          pdData: location.state.pdData,
          metaData: location.state.metaData,
        }
      : null,
  );
  const [loading, setLoading] = useState(!data && !!params.id);
  const [zoom, setZoom] = useState(1.0);

  // --- Fetch data if URL accessed directly with ID ---
  useEffect(() => {
    const loadDocument = async () => {
      if (data) return; // already have data from state
      if (!params.id) {
        toast.error("No document ID provided");
        navigate("/creator/history");
        return;
      }

      try {
        const res = await axios.get(`/api/creater/pd/fetch/${params.id}`, {
          headers: { createrToken },
        });
        if (res.data.success) {
          const pd = res.data.pd;
          const s1 = pd.section1_info;
          const s2 = pd.section2_objectives;
          const s3 = pd.section3_structure;
          const s4 = pd.section4_electives;

          setData({
            metaData: {
              programName: s1.programName,
              programCode: pd.programCode,
              schemeYear: pd.schemeYear,
              versionNo: pd.pdVersion,
              effectiveAy: pd.effectiveAcademicYear,
            },
            pdData: {
              details: {
                university: "GM UNIVERSITY",
                faculty: s1.faculty,
                school: s1.school,
                department: s1.department,
                program_name: s1.programName,
                director: s1.directorOfSchool,
                hod: s1.headOfDepartment,
              },
              award: {
                title: s1.awardTitle,
                mode: s1.modeOfStudy,
                awarding_body: s1.awardingInstitution,
                joint_award: s1.jointAward,
                teaching_institution: s1.teachingInstitution,
                date_program_specs: s1.dateOfProgramSpecs,
                date_approval: s1.dateOfCourseApproval,
                next_review: s1.nextReviewDate,
                approving_body: s1.approvingRegulatingBody,
                accredited_body: s1.accreditedBody,
                accreditation_grade: s1.gradeAwarded,
                accreditation_validity: s1.accreditationValidity,
                benchmark: s1.programBenchmark,
              },
              overview: s2.programOverview,
              peos: s2.peos,
              pos: s2.pos,
              psos: s2.psos,
              credit_def: {
                L: s3.creditDefinition.lecture,
                T: s3.creditDefinition.tutorial,
                P: s3.creditDefinition.practical,
              },
              structure_table: s3.structureTable,
              semesters: s3.semesters.map((s) => ({
                sem_no: s.semNumber,
                courses: s.courses,
              })),
              prof_electives: s4.professionalElectives.map((g) => ({
                sem: g.semester,
                title: g.title,
                courses: g.courses,
              })),
              open_electives: s4.openElectives.map((g) => ({
                sem: g.semester,
                title: g.title,
                courses: g.courses,
              })),
            },
          });
        } else {
          toast.error(res.data.message || "Failed to load document");
          navigate("/creator/history");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Error loading document");
        navigate("/creator/history");
      } finally {
        setLoading(false);
      }
    };

    if (!data && params.id) {
      loadDocument();
    } else if (!data && !params.id && !location.state) {
      // No data and no ID – probably direct access without state
      navigate("/creator/history");
    } else {
      setLoading(false);
    }
  }, [params.id, data, location.state, axios, createrToken, navigate]);

  // --- Auto-print if flag is set ---
  useEffect(() => {
    if (!loading && data && location.state?.autoPrint) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, data, location.state?.autoPrint]);

  // --- Zoom controls ---
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  // --- Browser print ---
  const handlePrint = () => window.print();

  // --- Helper to split objective HTML into title and description ---
  const splitObjective = (htmlString, defaultTitle = "") => {
    if (!htmlString) return { title: defaultTitle, description: "" };
    const titleMatch = htmlString.match(/<b>(.*?)<\/b>/);
    const title = titleMatch ? titleMatch[1].trim() : defaultTitle;
    let description = htmlString
      .replace(/<b>.*?<\/b>/, "")
      .replace(/^<br\/?>/, "")
      .trim();
    return { title, description };
  };

  // --- Loading state ---
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <RefreshCw className="animate-spin text-gray-500" size={40} />
      </div>
    );

  if (!data)
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Error: No document data available.
      </div>
    );

  const { pdData, metaData } = data;
  const sumCredits = (courses) =>
    courses.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0);

  // --- Timestamp for the footer ---
  const generatedTimestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // ========== STYLES – PURE BLACK & WHITE, GRAY HEADERS, NO UNDERLINES ==========
  const styles = `
    /* Screen View */
    .pd-preview-wrapper {
        background-color: #525659;
        padding: 40px 0;
        min-height: 100vh;
        overflow: auto;
        display: flex;
        justify-content: center;
        font-family: Arial, Helvetica, sans-serif;
    }

    .scaling-wrapper {
        transform-origin: top center;
        transition: transform 0.15s ease;
        will-change: transform;
        width: 100%;
        display: flex;
        justify-content: center;
    }

    /* A4 Container – perfect centered box */
    .doc-container {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background-color: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        box-sizing: border-box;
        color: #000;
        font-size: 10.5pt;
        line-height: 1.5;
        margin: 0 auto;
    }

    /* Table Styles – crisp black borders, gray headers */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        page-break-inside: auto;
        border: 1px solid #000;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td {
        border: 1px solid #000;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
    }
    th {
        background-color: #f0f0f0;
        font-weight: bold;
        text-align: center;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    td {
        background-color: white;
    }

    /* Utilities */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
    .font-bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }

    /* Fixed column widths */
    .w-40px { width: 40px; text-align: center; }
    .w-100px { width: 100px; }
    .w-200px { width: 200px; font-weight: bold; }
    .w-300px { width: 300px; font-weight: bold; }

    /* Cover page – no underline, pure black */
    .cover-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        height: 257mm;
        page-break-after: always;
    }
    .uni-name {
        font-size: 36pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 40px;
        text-transform: uppercase;
    }
    .doc-type-title {
        font-size: 22pt;
        font-weight: bold;
        margin-bottom: 5px;
        text-transform: uppercase;
    }
    .scheme-title {
        font-size: 20pt;
        font-weight: bold;
        margin-bottom: 10px;
        text-transform: uppercase;
    }
    .sem-range {
        font-size: 16pt;
        margin-bottom: 60px;
        text-transform: uppercase;
    }
    .program-title {
        font-size: 24pt;
        font-weight: bold;
        line-height: 1.4;
        margin-top: 40px;
        text-transform: uppercase;
    }

    /* Internal headers – centered, bold, no underline */
    h1.internal-header {
        font-size: 18pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin: 20px 0 10px;
    }
    h2.section-header {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin: 30px 0 15px;
        text-transform: uppercase;
    }
    h3.sem-header {
        font-size: 12pt;
        font-weight: bold;
        text-align: center;
        margin: 15px 0 10px;
        text-transform: uppercase;
    }

    /* Page break control */
    .page-break {
        page-break-after: always;
        display: block;
        height: 0;
    }

    /* Print overrides – ensure gray headers print */
    @media print {
        .no-print { display: none !important; }
        .pd-preview-wrapper { background-color: white; padding: 0; }
        .scaling-wrapper { transform: none !important; }
        .doc-container { box-shadow: none; margin: 0; width: 100%; padding: 10mm; }
        @page { size: A4; margin: 15mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        th { background-color: #f0f0f0 !important; }
    }
  `;

  return (
    <div className="pd-preview-wrapper">
      <style>{styles}</style>

      {/* Toolbar – no-print */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b shadow-sm p-2 flex justify-between items-center z-50 px-4 h-14">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-semibold w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Scaling wrapper – zoom only affects preview */}
      <div
        ref={scalingWrapperRef}
        className="scaling-wrapper"
        style={{ transform: `scale(${zoom})`, marginTop: "60px" }}
      >
        {/* Document container – captured for print */}
        <div ref={componentRef} className="doc-container">
          {/* ---------- COVER PAGE ---------- */}
          <div className="cover-page">
            <div className="uni-name">{pdData.details.university}</div>
            <div className="doc-type-title">PROGRAM DOCUMENT</div>
            <div className="scheme-title">{metaData.schemeYear} SCHEME</div>
            <div className="sem-range">I - VIII SEMESTER</div>
            <div className="program-title">
              {pdData.award.title?.toUpperCase() ||
                metaData.programName?.toUpperCase() ||
                "PROGRAM NAME"}
            </div>
            <div
              style={{
                marginTop: "80px",
                fontSize: "14pt",
                fontWeight: "bold",
              }}
            >
              {pdData.details.school}
              <br />
              {pdData.details.faculty}
            </div>
          </div>

          {/* ---------- PROGRAM & AWARD DETAILS ---------- */}
          <h1 className="internal-header">{pdData.details.program_name}</h1>
          <div
            className="text-center font-bold mb-4"
            style={{ fontSize: "11pt" }}
          >
            Version: {metaData.versionNo}{" "}
            {metaData.effectiveAy &&
              `| Effective Academic Year: ${metaData.effectiveAy}`}
          </div>

          <table>
            <tbody>
              <tr>
                <td className="w-200px">Faculty</td>
                <td>{pdData.details.faculty}</td>
              </tr>
              <tr>
                <td className="w-200px">School</td>
                <td>{pdData.details.school}</td>
              </tr>
              <tr>
                <td className="w-200px">Department</td>
                <td>{pdData.details.department}</td>
              </tr>
              <tr>
                <td className="w-200px">Program</td>
                <td>{pdData.details.program_name}</td>
              </tr>
              <tr>
                <td className="w-200px">Director of School</td>
                <td>{pdData.details.director}</td>
              </tr>
              <tr>
                <td className="w-200px">Head of Department</td>
                <td>{pdData.details.hod}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <tbody>
              {[
                {
                  id: "1.",
                  label: "Title of the Award",
                  val: pdData.award.title,
                },
                { id: "2.", label: "Modes of Study", val: pdData.award.mode },
                {
                  id: "3.",
                  label: "Awarding Institution / Body",
                  val: pdData.award.awarding_body,
                },
                {
                  id: "4.",
                  label: "Joint Award",
                  val: pdData.award.joint_award,
                },
                {
                  id: "5.",
                  label: "Teaching Institution",
                  val: pdData.award.teaching_institution,
                },
                {
                  id: "6.",
                  label: "Date of Program Specifications",
                  val: pdData.award.date_program_specs,
                },
                {
                  id: "7.",
                  label: "Date of Course Approval",
                  val: pdData.award.date_approval,
                },
                {
                  id: "8.",
                  label: "Next Review Date",
                  val: pdData.award.next_review,
                },
                {
                  id: "9.",
                  label: "Program Approving Body",
                  val: pdData.award.approving_body,
                },
                {
                  id: "10.",
                  label: "Program Accredited Body",
                  val: pdData.award.accredited_body,
                },
                {
                  id: "11.",
                  label: "Grade Awarded",
                  val: pdData.award.accreditation_grade,
                },
                {
                  id: "12.",
                  label: "Accreditation Validity",
                  val: pdData.award.accreditation_validity,
                },
                {
                  id: "13.",
                  label: "Program Benchmark",
                  val: pdData.award.benchmark,
                },
              ].map((row) => (
                <tr key={row.id}>
                  <td className="w-40px font-bold">{row.id}</td>
                  <td className="w-300px">{row.label}</td>
                  <td>{row.val || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 14. PROGRAM OVERVIEW */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">14.</td>
                <td>
                  <div className="font-bold mb-2">PROGRAM OVERVIEW</div>
                  <div className="text-justify">
                    {parse(pdData.overview || "")}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 15. PEOs – CORRECT FORMAT: PEO-1: Title (bold) + description */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">15.</td>
                <td>
                  <div className="font-bold mb-2">
                    PROGRAM EDUCATIONAL OBJECTIVES (PEOs)
                  </div>
                  {pdData.peos.map((peo, i) => {
                    if (!peo) return null;
                    const { title, description } = splitObjective(
                      peo,
                      `PEO-${i + 1}`,
                    );
                    return (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        <div
                          className="font-bold"
                          style={{ marginBottom: "2px" }}
                        >
                          PEO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 16. POs – CORRECT FORMAT: PO-1: Title (bold) + description */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">16.</td>
                <td>
                  <div className="font-bold mb-2">PROGRAM OUTCOMES (POs)</div>
                  {pdData.pos.map((po, i) => {
                    if (!po) return null;
                    const { title, description } = splitObjective(
                      po,
                      `PO-${i + 1}`,
                    );
                    return (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        <div
                          className="font-bold"
                          style={{ marginBottom: "2px" }}
                        >
                          PO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 17. PSOs – CORRECT FORMAT: PSO-1: Title (bold) + description */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">17.</td>
                <td>
                  <div className="font-bold mb-2">
                    PROGRAM SPECIFIC OUTCOMES (PSOs)
                  </div>
                  <p className="italic mb-2">
                    Upon successful completion of the program, graduates will
                    possess the capability to:
                  </p>
                  {pdData.psos.map((pso, i) => {
                    if (!pso) return null;
                    const { title, description } = splitObjective(
                      pso,
                      `PSO-${i + 1}`,
                    );
                    return (
                      <div key={i} style={{ marginBottom: "12px" }}>
                        <div
                          className="font-bold"
                          style={{ marginBottom: "2px" }}
                        >
                          PSO-{i + 1}: {title}
                        </div>
                        <div>{parse(description)}</div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 18. PROGRAMME STRUCTURE */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">18.</td>
                <td>
                  <div className="font-bold mb-2">PROGRAMME STRUCTURE</div>
                  <div
                    className="mb-4 p-2 border"
                    style={{
                      border: "1px solid black",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <span className="font-bold">Definition of Credit:</span>
                    <br />1 Hr. Lecture (L) per week : {
                      pdData.credit_def.L
                    }{" "}
                    Credit |&nbsp; 2 Hr. Tutorial (T) per week :{" "}
                    {pdData.credit_def.T} Credit |&nbsp; 2 Hr. Practical (P) per
                    week : {pdData.credit_def.P} Credit
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th className="text-center">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdData.structure_table.map((row, i) => (
                        <tr key={i}>
                          <td>{row.category || "—"}</td>
                          <td className="text-center">{row.credits ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          backgroundColor: "#f0f0f0",
                          fontWeight: "bold",
                        }}
                      >
                        <td
                          className="text-right"
                          style={{ paddingRight: "15px" }}
                        >
                          Total Credits:
                        </td>
                        <td className="text-center">
                          {pdData.structure_table.reduce(
                            (acc, r) => acc + (parseFloat(r.credits) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 19. CREDIT DEFINITIONS (L-T-P) */}
          <table>
            <tbody>
              <tr>
                <td className="w-40px font-bold">19.</td>
                <td>
                  <div className="font-bold mb-2">
                    CREDIT DEFINITIONS (L-T-P)
                  </div>
                  <table style={{ width: "60%", margin: "0 auto" }}>
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center">Lecture</td>
                        <td className="text-center">{pdData.credit_def.L}</td>
                      </tr>
                      <tr>
                        <td className="text-center">Tutorial</td>
                        <td className="text-center">{pdData.credit_def.T}</td>
                      </tr>
                      <tr>
                        <td className="text-center">Practical</td>
                        <td className="text-center">{pdData.credit_def.P}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="page-break"></div>

          {/* 20. SEMESTER-WISE COURSES */}
          <h2 className="section-header">20. SEMESTER-WISE COURSES</h2>
          {pdData.semesters.map((sem) =>
            sem.courses.length > 0 ? (
              <div
                key={sem.sem_no}
                style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
              >
                <h3 className="sem-header">Semester {sem.sem_no}</h3>
                <table>
                  <thead>
                    <tr>
                      <th className="w-40px">S.No</th>
                      <th className="w-100px">Code</th>
                      <th>Course Title</th>
                      <th className="w-40px">Cr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, i) => (
                      <tr key={i}>
                        <td className="text-center">{i + 1}</td>
                        <td>{c.code || "—"}</td>
                        <td>{c.title || "—"}</td>
                        <td className="text-center">{c.credits ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}
                    >
                      <td
                        colSpan="3"
                        className="text-right"
                        style={{ paddingRight: "15px" }}
                      >
                        Total:
                      </td>
                      <td className="text-center">{sumCredits(sem.courses)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : null,
          )}

          <div className="page-break"></div>

          {/* 21. PROFESSIONAL ELECTIVES */}
          {pdData.prof_electives.length > 0 && (
            <>
              <h2 className="section-header">21. PROFESSIONAL ELECTIVES</h2>
              {pdData.prof_electives.map((group, i) => (
                <div
                  key={i}
                  style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                      fontSize: "11pt",
                    }}
                  >
                    {group.title} (Semester {group.sem})
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="w-40px">#</th>
                        <th className="w-100px">Code</th>
                        <th>Title</th>
                        <th className="w-40px">Cr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.courses.map((c, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{c.code || "—"}</td>
                          <td>{c.title || "—"}</td>
                          <td className="text-center">{c.credits ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* 22. OPEN ELECTIVES */}
          {pdData.open_electives.length > 0 && (
            <>
              <h2 className="section-header">22. OPEN ELECTIVES</h2>
              {pdData.open_electives.map((group, i) => (
                <div
                  key={i}
                  style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                      fontSize: "11pt",
                    }}
                  >
                    {group.title} (Semester {group.sem})
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="w-40px">#</th>
                        <th className="w-100px">Code</th>
                        <th>Title</th>
                        <th className="w-40px">Cr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.courses.map((c, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{c.code || "—"}</td>
                          <td>{c.title || "—"}</td>
                          <td className="text-center">{c.credits ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* FOOTER with Program Name, Version, Timestamp */}
          <div
            style={{
              marginTop: "50px",
              textAlign: "center",
              fontSize: "8pt",
              color: "#666",
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
            }}
          >
            {pdData.details.program_name} • Version {metaData.versionNo} •
            Generated on: {generatedTimestamp}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
