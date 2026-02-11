import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAppContext } from "../context/AppContext"; // Adjust path if needed
import html2pdf from "html2pdf.js";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams(); // In case we load by ID URL
  const { axios, createrToken } = useAppContext();
  const componentRef = useRef(null);

  // State to hold data (either passed via nav or fetched)
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);

  // --- Fetch Data if accessed directly via URL (Optional Fallback) ---
  useEffect(() => {
    const loadData = async () => {
      if (!data && params.id) {
        try {
          const res = await axios.get(`/api/creater/pd/fetch/${params.id}`, {
            headers: { createrToken },
          });
          if (res.data.success) {
            // Transform Backend Data Structure to Frontend State Structure
            // (Reusing the populate logic from CreatePD would be ideal, but mapping here for display)
            const pd = res.data.pd;
            const s1 = pd.section1_info;
            const s2 = pd.section2_objectives;
            const s3 = pd.section3_structure;
            const s4 = pd.section4_electives;

            const formattedData = {
              metaData: {
                programName: s1.programName,
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
            };
            setData(formattedData);
          }
        } catch (error) {
          console.error("Failed to load preview data");
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [params.id, data, axios, createrToken]);

  if (loading)
    return <div className="p-10 text-center">Loading Preview...</div>;
  if (!data) return <div className="p-10 text-center">No Data to Preview</div>;

  const { pdData, metaData } = data;

  // --- DOWNLOAD HANDLERS ---

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = componentRef.current;
    const opt = {
      margin: [10, 10, 10, 10], // mm
      filename: `PD_${metaData.programCode || "Doc"}_${metaData.versionNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    html2pdf().set(opt).from(element).save();
  };

  // --- STYLES (Exact copy of PHP CSS) ---
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    
    .pd-preview-root {
        font-family: 'Times New Roman', Times, serif;
        color: #000;
        background-color: #525659;
        padding: 40px 0;
        min-height: 100vh;
    }

    .doc-container {
        width: 210mm; /* A4 Width */
        min-height: 297mm; /* A4 Height */
        margin: 0 auto;
        padding: 15mm;
        background-color: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        box-sizing: border-box;
        position: relative;
    }

    /* Typography Matches */
    .uni-name {
        font-size: 36pt;
        font-weight: bold;
        color: #800000; /* Dark Maroon */
        margin-bottom: 40px;
        text-align: center;
    }
    .doc-type-title {
        font-size: 22pt;
        font-weight: bold;
        text-decoration: underline;
        margin-bottom: 5px;
        text-align: center;
    }
    .scheme-title {
        font-size: 20pt;
        font-weight: bold;
        margin-bottom: 10px;
        text-align: center;
    }
    .sem-range {
        font-size: 16pt;
        margin-bottom: 60px;
        text-align: center;
    }
    .prog-name-title {
        font-size: 24pt;
        font-weight: bold;
        line-height: 1.2;
        text-align: center;
    }
    
    h1.internal-header {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        margin: 0 0 5px 0;
        color: #000;
        text-transform: uppercase;
    }

    /* Table Styles */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    th, td {
        border: 1px solid #000;
        padding: 8px 12px;
        text-align: left;
        vertical-align: top;
        font-size: 11pt;
        line-height: 1.4;
    }
    th {
        background-color: #f0f0f0;
        font-weight: bold;
    }
    
    /* Utility Classes */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .w-40px { width: 40px; }
    .w-200px { width: 200px; }
    .w-300px { width: 300px; }
    .mt-15 { margin-top: 15px; }
    .mb-10 { margin-bottom: 10px; }
    .text-justify { text-align: justify; }
    .page-break { page-break-after: always; }
    .cover-page {
        height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    @media print {
        .no-print { display: none !important; }
        .pd-preview-root { padding: 0; background-color: white; }
        .doc-container { box-shadow: none; margin: 0; width: 100%; }
        @page { size: A4; margin: 15mm; }
    }
  `;

  return (
    <div className="pd-preview-root">
      <style>{styles}</style>

      {/* Toolbar - No Print */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-medium"
        >
          <ArrowLeft size={20} /> Back to Editor
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Printer size={18} /> Print / Save as PDF
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
            <Download size={18} /> Download
          </button>
        </div>
      </div>

      {/* PREVIEW CONTENT START */}
      <div ref={componentRef} className="doc-container">
        {/* --- COVER PAGE --- */}
        <div className="cover-page page-break">
          <div className="uni-name">{pdData.details.university}</div>
          <div className="doc-type-title">PROGRAM DOCUMENT</div>
          <div className="scheme-title">{metaData.schemeYear} SCHEME</div>
          <div className="sem-range">I - VIII SEMESTER</div>

          <div style={{ marginTop: "20px" }}>
            <div className="prog-name-title">
              {pdData.award.title.toUpperCase() || metaData.programName}
            </div>
          </div>
        </div>

        {/* --- PAGE 2: DETAILS --- */}
        <h1 className="internal-header">{pdData.details.program_name}</h1>
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontWeight: "bold",
            fontSize: "11pt",
            color: "#666",
          }}
        >
          Version: {metaData.versionNo}
          {metaData.effectiveAy &&
            ` | Effective Academic Year: ${metaData.effectiveAy}`}
        </div>

        {/* Info Table */}
        <table>
          <tbody>
            <tr>
              <td className="w-200px font-bold">Faculty</td>
              <td>{pdData.details.faculty}</td>
            </tr>
            <tr>
              <td className="font-bold">School</td>
              <td>{pdData.details.school}</td>
            </tr>
            <tr>
              <td className="font-bold">Department</td>
              <td>{pdData.details.department}</td>
            </tr>
            <tr>
              <td className="font-bold">Director of School</td>
              <td>{pdData.details.director}</td>
            </tr>
            <tr>
              <td className="font-bold">Head of Department</td>
              <td>{pdData.details.hod}</td>
            </tr>
          </tbody>
        </table>

        {/* Specs Table */}
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
                label: "Awarding Institution /Body",
                val: pdData.award.awarding_body,
              },
              { id: "4.", label: "Joint Award", val: pdData.award.joint_award },
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
                <td className="w-40px text-center font-bold">{row.id}</td>
                <td className="w-300px font-bold">{row.label}</td>
                <td>{row.val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- SECTION 14: OVERVIEW --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">14.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Program Overview</div>
                <div className="text-justify whitespace-pre-wrap">
                  {pdData.overview}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 15: PEOs --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">15.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">
                  Program Educational Objectives (PEOs)
                </div>
                <div className="mt-15">
                  {pdData.peos.map(
                    (peo, i) =>
                      peo && (
                        <div key={i} className="mb-10 text-justify">
                          <span className="font-bold">PEO-{i + 1}: </span> {peo}
                        </div>
                      ),
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 16: POs --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">16.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Program Outcomes (POs)</div>
                <div>
                  {pdData.pos.map((po, i) => (
                    <div key={i} className="mb-10 text-justify">
                      <span className="font-bold">PO-{i + 1}: </span> {po}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 17: PSOs --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">17.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">
                  Program Specific Outcomes (PSOs)
                </div>
                <p
                  className="mb-10 italic text-justify"
                  style={{ fontSize: "11pt" }}
                >
                  Upon successful completion of the program, graduates will
                  possess the capability to:
                </p>
                <div>
                  {pdData.psos.map(
                    (pso, i) =>
                      pso && (
                        <div key={i} className="mb-10 text-justify">
                          <span className="font-bold">PSO-{i + 1}: </span> {pso}
                        </div>
                      ),
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 18: STRUCTURE --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">18.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Programme Structure</div>
                <div className="mb-10" style={{ fontSize: "10.5pt" }}>
                  <span className="font-bold underline">
                    Definition of Credit:
                  </span>
                  <br />1 Hr. Lecture (L) per week : {pdData.credit_def.L}{" "}
                  Credit | 2 Hr. Tutorial (T) per week : {pdData.credit_def.T}{" "}
                  Credit | 2 Hr. Practical (P) per week : {pdData.credit_def.P}{" "}
                  Credit
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdData.structure_table.map((row, i) => (
                      <tr key={i}>
                        <td>{row.category}</td>
                        <td className="text-center">{row.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <td
                        className="text-right font-bold"
                        style={{ paddingRight: "15px" }}
                      >
                        Total Credits:
                      </td>
                      <td className="text-center font-bold">
                        {pdData.structure_table.reduce(
                          (acc, curr) => acc + (parseInt(curr.credits) || 0),
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

        {/* --- SECTION 19: CREDIT DEF (Table) --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">19.</td>
              <td colSpan="2">
                <div className="font-bold mt-15 mb-10">
                  Credit Definitions (L-T-P)
                </div>
                <table>
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

        {/* --- SECTION 20: SEMESTER COURSES --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">20.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Semester-wise Courses</div>
                {pdData.semesters.map(
                  (sem) =>
                    sem.courses.length > 0 && (
                      <div key={sem.sem_no}>
                        <h3
                          style={{
                            margin: "15px 0 10px 0",
                            fontSize: "11pt",
                            fontWeight: "bold",
                          }}
                        >
                          Semester {sem.sem_no}
                        </h3>
                        <table>
                          <thead>
                            <tr>
                              <th className="w-40px">S.No</th>
                              <th style={{ width: "100px" }}>Code</th>
                              <th>Title</th>
                              <th style={{ width: "50px" }}>Credits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sem.courses.map((course, i) => (
                              <tr key={i}>
                                <td className="text-center">{i + 1}</td>
                                <td>{course.code}</td>
                                <td>{course.title}</td>
                                <td className="text-center">
                                  {course.credits}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                              <td
                                colSpan="3"
                                className="text-right font-bold"
                                style={{ paddingRight: "15px" }}
                              >
                                Total Credits:
                              </td>
                              <td className="text-center font-bold">
                                {sem.courses.reduce(
                                  (acc, curr) =>
                                    acc + (parseInt(curr.credits) || 0),
                                  0,
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ),
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 21: PROFESSIONAL ELECTIVES --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">21.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Professional Electives</div>
                {pdData.prof_electives.length > 0 ? (
                  pdData.prof_electives.map((group, i) => (
                    <div key={i} className="mb-10">
                      <div className="font-bold mb-10 italic">
                        {group.title} (Sem {group.sem})
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th className="w-40px">#</th>
                            <th>Code</th>
                            <th>Title</th>
                            <th>Credits</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.courses.map((c, idx) => (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>{c.code}</td>
                              <td>{c.title}</td>
                              <td className="text-center">{c.credits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <p className="italic text-gray-500">None specified</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- SECTION 22: OPEN ELECTIVES --- */}
        <table>
          <tbody>
            <tr>
              <td className="w-40px text-center font-bold">22.</td>
              <td colSpan="2">
                <div className="font-bold mb-10">Open Electives</div>
                {pdData.open_electives.length > 0 ? (
                  pdData.open_electives.map((group, i) => (
                    <div key={i} className="mb-10">
                      <div className="font-bold mb-10 italic">
                        {group.title} (Sem {group.sem})
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th className="w-40px">#</th>
                            <th>Code</th>
                            <th>Title</th>
                            <th>Credits</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.courses.map((c, idx) => (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>{c.code}</td>
                              <td>{c.title}</td>
                              <td className="text-center">{c.credits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <p className="italic text-gray-500">None specified</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- FOOTER --- */}
        <div
          style={{
            marginTop: "50px",
            textAlign: "center",
            fontSize: "9pt",
            color: "#999",
          }}
        >
          <p>Generated by CDMS Program Document System</p>
        </div>
      </div>
    </div>
  );
};

export default Preview;
