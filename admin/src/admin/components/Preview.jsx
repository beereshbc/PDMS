import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import parse from "html-react-parser";
import { toast } from "react-hot-toast";

const Preview = ({
  isModal = false,
  onClose,
  passedPdData,
  passedMetaData,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { axios, createrToken } = useAppContext();

  const componentRef = useRef(null);
  const scalingWrapperRef = useRef(null);

  const [data, setData] = useState(
    passedPdData && passedMetaData
      ? { pdData: passedPdData, metaData: passedMetaData }
      : location.state?.pdData
        ? { pdData: location.state.pdData, metaData: location.state.metaData }
        : null,
  );

  const [loading, setLoading] = useState(!data && !!params.id);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [isModal]);

  useEffect(() => {
    if (passedPdData && passedMetaData) {
      setData({ pdData: passedPdData, metaData: passedMetaData });
      setLoading(false);
    }
  }, [passedPdData, passedMetaData]);

  useEffect(() => {
    const loadDocument = async () => {
      if (data) return;
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
          // Unified 2024 / 2026 data mapping directly from `pd.pd_data`
          const pdData = pd.pd_data || {};

          setData({
            metaData: {
              programName: pd.program_name,
              programCode: pd.program_id,
              schemeYear: pd.scheme_year,
              versionNo: pd.version_no,
              effectiveAy: pd.effective_ay,
            },
            pdData: pdData,
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

    if (!isModal && !data && params.id) loadDocument();
    else if (!isModal && !data && !params.id && !location.state)
      navigate("/creator/history");
    else setLoading(false);
  }, [params.id, data, location.state, axios, createrToken, navigate, isModal]);

  useEffect(() => {
    if (!loading && data && location.state?.autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, data, location.state?.autoPrint]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

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

  const generateFilename = () => {
    if (!data) return "Program_Document.pdf";
    const program = data.pdData?.details?.program_name || "Program";
    const sanitizedProgram = program
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    const branch =
      data.pdData?.details?.department || data.metaData?.programCode || "CSE";
    const sanitizedBranch = branch
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    const version = data.metaData?.versionNo?.replace(/\./g, "_") || "1_0_0";
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
    return `${sanitizedProgram}_${sanitizedBranch}_v${version}_${date}_${time}.pdf`;
  };

  const handlePrint = async () => {
    const filename = generateFilename();
    alert("File Name Copied...Please Paste while Saving..");
    try {
      await navigator.clipboard.writeText(filename);
      toast.success(`📋 Copied file name: ${filename}`);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
    window.print();
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <RefreshCw className="animate-spin text-gray-500" size={40} />
      </div>
    );
  if (!data || !data.pdData) return null;

  const { pdData, metaData } = data;
  const sumCredits = (courses) =>
    (courses || []).reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0);

  // Safe Fallbacks
  const details = pdData.details || {};
  const award = pdData.award || {};
  const structureTable = pdData.structure_table || [];
  const semesters = pdData.semesters || [];
  const section4 = pdData.section4 || {};

  // Fallbacks for arrays to ensure mapping works regardless of schema structure
  const profElectives =
    pdData.prof_electives || section4.professionalElectives || [];
  const openElectives = pdData.open_electives || section4.openElectives || [];

  const generatedTimestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const styles = `
    .preview-overlay { position: fixed; inset: 0; background-color: rgba(82, 86, 89, 0.98); z-index: 9999; overflow-y: auto; padding-top: 60px; padding-bottom: 60px; }
    .pd-preview-wrapper { background-color: #525659; padding: 40px 0; min-height: 100vh; overflow: auto; display: flex; justify-content: center; font-family: Arial, Helvetica, sans-serif; }
    .scaling-wrapper { transform-origin: top center; transition: transform 0.15s ease; will-change: transform; width: 100%; display: flex; justify-content: center; }
    .doc-container { width: 210mm; min-height: 297mm; padding: 20mm; background-color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); box-sizing: border-box; color: #000; font-size: 10.5pt; line-height: 1.5; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; border: 1px solid #000; }
    thead { display: table-header-group; } tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background-color: #f0f0f0; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { background-color: white; }
    .text-center { text-align: center; } .text-right { text-align: right; } .text-justify { text-align: justify; }
    .font-bold { font-weight: bold; } .italic { font-style: italic; } .uppercase { text-transform: uppercase; }
    .mb-2 { margin-bottom: 0.5rem; } .mb-4 { margin-bottom: 1rem; }
    .w-40px { width: 40px; text-align: center; } .w-100px { width: 100px; } .w-200px { width: 200px; font-weight: bold; } .w-300px { width: 300px; font-weight: bold; }
    .cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 257mm; page-break-after: always; }
    .uni-name { font-size: 36pt; font-weight: bold; color: #000; margin-bottom: 40px; text-transform: uppercase; }
    .doc-type-title { font-size: 22pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
    .scheme-title { font-size: 20pt; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
    .sem-range { font-size: 16pt; margin-bottom: 60px; text-transform: uppercase; }
    .program-title { font-size: 24pt; font-weight: bold; line-height: 1.4; margin-top: 40px; text-transform: uppercase; }
    h1.internal-header { font-size: 18pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 20px 0 10px; }
    h2.section-header { font-size: 14pt; font-weight: bold; text-align: center; margin: 30px 0 15px; text-transform: uppercase; }
    h3.sem-header { font-size: 12pt; font-weight: bold; text-align: center; margin: 15px 0 10px; text-transform: uppercase; }
    h4.cat-header { font-size: 10.5pt; font-weight: bold; margin: 10px 0; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .page-break { page-break-after: always; display: block; height: 0; }
    @media print {
        body * { visibility: hidden !important; } .print-area, .print-area * { visibility: visible !important; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        .no-print { display: none !important; } .scaling-wrapper { transform: none !important; margin: 0 !important; }
        .doc-container { box-shadow: none; margin: 0; width: 100%; padding: 10mm; } @page { size: A4; margin: 15mm; }
    }
  `;

  return (
    <div className={isModal ? "preview-overlay" : "pd-preview-wrapper"}>
      <style>{styles}</style>
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b shadow-sm p-2 flex justify-between items-center z-[10000] px-4 h-14">
        <button
          onClick={isModal ? onClose : () => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-medium"
        >
          {isModal ? <X size={18} /> : <ArrowLeft size={18} />}{" "}
          {isModal ? "Close Preview" : "Back"}
        </button>
        <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-semibold w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-200 rounded"
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

      <div className="print-area">
        <div
          ref={scalingWrapperRef}
          className="scaling-wrapper"
          style={{
            transform: `scale(${zoom})`,
            marginTop: isModal ? "20px" : "60px",
          }}
        >
          <div ref={componentRef} className="doc-container">
            {/* COVER PAGE */}
            <div className="cover-page">
              <div className="uni-name">
                {details.university || "GM UNIVERSITY"}
              </div>
              <div className="doc-type-title">PROGRAM DOCUMENT</div>
              <div className="scheme-title">{metaData.schemeYear} SCHEME</div>
              <div className="sem-range">I - VIII SEMESTER</div>
              <div className="program-title">
                {award.title?.toUpperCase() ||
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
                {details.school}
                <br />
                {details.faculty}
              </div>
            </div>

            <h1 className="internal-header">
              {details.program_name || metaData.programName}
            </h1>
            <div
              className="text-center font-bold mb-4"
              style={{ fontSize: "11pt" }}
            >
              Version: {metaData.versionNo}{" "}
              {metaData.effectiveAy &&
                `| Effective Academic Year: ${metaData.effectiveAy}`}
            </div>

            {/* DETAILS TABLE */}
            <table>
              <tbody>
                <tr>
                  <td className="w-200px">Faculty</td>
                  <td>{details.faculty}</td>
                </tr>
                <tr>
                  <td className="w-200px">School</td>
                  <td>{details.school}</td>
                </tr>
                <tr>
                  <td className="w-200px">Department</td>
                  <td>{details.department}</td>
                </tr>
                <tr>
                  <td className="w-200px">Program</td>
                  <td>{details.program_name}</td>
                </tr>
                <tr>
                  <td className="w-200px">Director of School</td>
                  <td>{details.director}</td>
                </tr>
                <tr>
                  <td className="w-200px">Head of Department</td>
                  <td>{details.hod}</td>
                </tr>
              </tbody>
            </table>

            {/* AWARD DETAILS TABLE */}
            <table>
              <tbody>
                {[
                  { id: "1.", label: "Title of the Award", val: award.title },
                  { id: "2.", label: "Modes of Study", val: award.mode },
                  {
                    id: "3.",
                    label: "Awarding Institution / Body",
                    val: award.awarding_body,
                  },
                  { id: "4.", label: "Joint Award", val: award.joint_award },
                  {
                    id: "5.",
                    label: "Teaching Institution",
                    val: award.teaching_institution,
                  },
                  {
                    id: "6.",
                    label: "Date of Program Specifications",
                    val: award.date_program_specs,
                  },
                  {
                    id: "7.",
                    label: "Date of Course Approval",
                    val: award.date_approval,
                  },
                  {
                    id: "8.",
                    label: "Next Review Date",
                    val: award.next_review,
                  },
                  {
                    id: "9.",
                    label: "Program Approving Body",
                    val: award.approving_body,
                  },
                  {
                    id: "10.",
                    label: "Program Accredited Body",
                    val: award.accredited_body,
                  },
                  {
                    id: "11.",
                    label: "Grade Awarded",
                    val: award.accreditation_grade,
                  },
                  {
                    id: "12.",
                    label: "Accreditation Validity",
                    val: award.accreditation_validity,
                  },
                  {
                    id: "13.",
                    label: "Program Benchmark",
                    val: award.benchmark,
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

            {/* 15. PEOs */}
            <table>
              <tbody>
                <tr>
                  <td className="w-40px font-bold">15.</td>
                  <td>
                    <div className="font-bold mb-2">
                      PROGRAM EDUCATIONAL OBJECTIVES (PEOs)
                    </div>
                    {(pdData.peos || []).map((peo, i) => {
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

            {/* 16. POs */}
            <table>
              <tbody>
                <tr>
                  <td className="w-40px font-bold">16.</td>
                  <td>
                    <div className="font-bold mb-2">PROGRAM OUTCOMES (POs)</div>
                    {(pdData.pos || []).map((po, i) => {
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

            {/* 17. PSOs */}
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
                    {(pdData.psos || []).map((pso, i) => {
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
                      <br />1 Hr. Lecture (L) per week :{" "}
                      {pdData.credit_def?.L || 1} Credit |&nbsp; 2 Hr. Tutorial
                      (T) per week : {pdData.credit_def?.T || 1} Credit |&nbsp;
                      2 Hr. Practical (P) per week : {pdData.credit_def?.P || 1}{" "}
                      Credit
                    </div>
                    {structureTable.length > 0 && (
                      <table>
                        <thead>
                          <tr>
                            <th>Category Name</th>
                            <th className="text-center">Credits</th>
                          </tr>
                        </thead>
                        <tbody>
                          {structureTable.map((row, i) => (
                            <tr key={i}>
                              <td>{row.category || "—"}</td>
                              <td className="text-center">
                                {row.credits ?? 0}
                              </td>
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
                              {structureTable.reduce(
                                (acc, r) => acc + (parseFloat(r.credits) || 0),
                                0,
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="page-break"></div>

            {/* 20. SEMESTER-WISE COURSES (Handles both 2024 Array and 2026 Categories) */}
            <h2 className="section-header">20. SEMESTER-WISE COURSES</h2>
            {semesters.map((sem) => {
              const hasCategories = sem.categories && sem.categories.length > 0;
              const hasCourses = sem.courses && sem.courses.length > 0;

              if (!hasCategories && !hasCourses) return null;

              return (
                <div
                  key={sem.sem_no}
                  style={{ marginBottom: "25px", pageBreakInside: "auto" }}
                >
                  <h3 className="sem-header">Semester {sem.sem_no}</h3>

                  {/* Handle 2026 Nested Categories */}
                  {hasCategories ? (
                    sem.categories.map(
                      (cat, catIdx) =>
                        cat.courses &&
                        cat.courses.length > 0 && (
                          <div key={catIdx}>
                            <h4 className="cat-header">{cat.categoryName}</h4>
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
                                {cat.courses.map((c, i) => (
                                  <tr key={i}>
                                    <td className="text-center">{i + 1}</td>
                                    <td>{c.code || "—"}</td>
                                    <td>{c.title || "—"}</td>
                                    <td className="text-center">
                                      {c.credits ?? 0}
                                    </td>
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
                                    colSpan="3"
                                    className="text-right"
                                    style={{ paddingRight: "15px" }}
                                  >
                                    Category Total:
                                  </td>
                                  <td className="text-center">
                                    {sumCredits(cat.courses)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ),
                    )
                  ) : (
                    // Handle 2024 Flat Courses
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
                          style={{
                            backgroundColor: "#f0f0f0",
                            fontWeight: "bold",
                          }}
                        >
                          <td
                            colSpan="3"
                            className="text-right"
                            style={{ paddingRight: "15px" }}
                          >
                            Total:
                          </td>
                          <td className="text-center">
                            {sumCredits(sem.courses)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              );
            })}

            <div className="page-break"></div>

            {/* PROFESSIONAL ELECTIVES */}
            {profElectives.length > 0 && (
              <>
                <h2 className="section-header">PROFESSIONAL ELECTIVES</h2>
                {profElectives.map((group, i) => (
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
                      {group.title || `Professional Electives`} (Semester{" "}
                      {group.sem || group.semester || "—"})
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
                        {(group.courses || []).map((c, idx) => (
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

            {/* OPEN ELECTIVES */}
            {openElectives.length > 0 && (
              <>
                <h2 className="section-header">OPEN ELECTIVES</h2>
                {openElectives.map((group, i) => (
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
                      {group.title || `Open Electives`} (Semester{" "}
                      {group.sem || group.semester || "—"})
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
                        {(group.courses || []).map((c, idx) => (
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

            {/* 2026: SECTION 4 INSTITUTIONAL TEXT EXTENSIONS */}
            {section4 && Object.keys(section4).length > 0 && (
              <>
                {section4.technicalCompetencyCourses &&
                  section4.technicalCompetencyCourses.length > 0 && (
                    <div
                      style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
                    >
                      <h2 className="section-header">
                        TECHNICAL COMPETENCY COURSES
                      </h2>
                      <table>
                        <thead>
                          <tr>
                            <th className="w-100px">Code</th>
                            <th>Title</th>
                            <th>Resource Platform</th>
                            <th className="w-40px">Cr</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section4.technicalCompetencyCourses.map((c, idx) => (
                            <tr key={idx}>
                              <td>{c.code}</td>
                              <td>{c.title}</td>
                              <td>{c.resource || "—"}</td>
                              <td className="text-center">{c.credits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {section4.assessmentGrading &&
                  section4.assessmentGrading.components &&
                  section4.assessmentGrading.components.length > 0 && (
                    <div
                      style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
                    >
                      <h2 className="section-header">ASSESSMENT AND GRADING</h2>
                      <p>
                        {parse(section4.assessmentGrading.description || "")}
                      </p>

                      <table
                        style={{
                          marginTop: "15px",
                          width: "70%",
                          margin: "15px auto",
                        }}
                      >
                        <thead>
                          <tr>
                            <th>Assessment Component</th>
                            <th className="w-100px">Weightage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section4.assessmentGrading.components.map(
                            (c, idx) => (
                              <tr key={idx}>
                                <td>{c.name}</td>
                                <td className="text-center">{c.weightage}</td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>

                      {section4.assessmentGrading.gradeRules && (
                        <div className="mt-4">
                          <h4 className="font-bold">Grading Rules:</h4>
                          <p>{parse(section4.assessmentGrading.gradeRules)}</p>
                        </div>
                      )}
                      {section4.assessmentGrading.passingCriteria && (
                        <div className="mt-2">
                          <h4 className="font-bold">Passing Criteria:</h4>
                          <p>
                            {parse(section4.assessmentGrading.passingCriteria)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {section4.awardOfDegree && (
                  <div style={{ marginBottom: "25px" }}>
                    <h2 className="section-header">AWARD OF DEGREE</h2>
                    <p className="text-justify">
                      {parse(section4.awardOfDegree)}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* FOOTER */}
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
              {details.program_name || metaData.programName} • Version{" "}
              {metaData.versionNo} • Generated on: {generatedTimestamp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
