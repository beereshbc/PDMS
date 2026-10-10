// admin/pages/CurriculumCompiler.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Layers,
  Search,
  FileWarning,
  Download,
  FileText,
  Loader2,
  BarChart3,
  ChevronRight,
  Settings,
  Eye,
  Edit,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Eraser,
  BookOpen,
  Globe,
  FileDown,
  SortAsc,
  RefreshCw,
  FileCode,
  Save,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import {
  CD_PREVIEW_STYLES,
  getDefaultSections,
  SingleCDPreviewModal,
  FullCurriculumPreview,
  CDSelectionCard,
  UniversalSectionSelector,
  generateStandaloneHTML,
  downloadHTML,
  downloadPDF,
} from "../components/CurriculumPreview";

/* ============================================================
   STATUS CONFIG
============================================================ */

const STATUS_CONFIG = {
  Approved: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Pending:  { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400 animate-pulse" },
  Missing:  { badge: "bg-red-50 text-red-500",      dot: "bg-red-300" },
};

const DEFAULT_FILTERS = {
  search: "",
  semesters: new Set(),
  statuses: new Set(),
  onlyAvailable: false,
  sortBy: "semester-asc",
};

/* ============================================================
   PROGRESS BAR
============================================================ */

const ProgressBar = ({ pct }) => (
  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full transition-all duration-700 ${
        pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
      }`}
      style={{ width: `${pct}%` }}
    />
  </div>
);

/* ============================================================
   HELPERS FOR FRONT MATTER EDITOR
============================================================ */

const fmBasename = (src) => {
  if (!src) return "";
  const clean = src.split("?")[0].split("#")[0];
  return clean.split("/").pop() || "";
};

const fmEscapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fmDisplaySrc = (src) => {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  const filename = fmBasename(src);
  if (!filename) return src;
  const base =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BASE_URL) ||
    "http://localhost:5000";
  return `${base}/templates/front_matter/images/${filename}`;
};

/* ============================================================
   CURRICULUM COMPILER - Main Component
============================================================ */

const CurriculumCompiler = () => {
  const { axios, adminToken } = useAppContext();

  /* ---------------- Program state ---------------- */
  const [programs, setPrograms] = useState([]);
  const [selectedPd, setSelectedPd] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [checking, setChecking] = useState(false);
  const [searchTerm, setSearch] = useState("");

  /* ---------------- CD selection ---------------- */
  const [availableCDs, setAvailableCDs] = useState([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState([]);
  const [loadingCDs, setLoadingCDs] = useState(false);
  const [cdOrder, setCdOrder] = useState([]);

  /* ---------------- Universal section selection ---------------- */
  const [globalSections, setGlobalSections] = useState(() => getDefaultSections());

  /* ---------------- Filters ---------------- */
  const [filters, setFilters] = useState(() => ({
    search: "",
    semesters: new Set(),
    statuses: new Set(),
    onlyAvailable: false,
    sortBy: "semester-asc",
  }));

  /* ---------------- Front matter (list) ---------------- */
  const [frontMatterPages, setFrontMatterPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  /* ---------------- Front matter editor state ---------------- */
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [editorDraft, setEditorDraft] = useState("");
  const [editorOriginal, setEditorOriginal] = useState("");
  const [editorTab, setEditorTab] = useState("visual"); // "visual" | "html"
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorResetting, setEditorResetting] = useState(false);
  const [editorUploadingImage, setEditorUploadingImage] = useState(null);
  const editorRef = useRef(null);

  /* ---------------- Preview ---------------- */
  const [singlePreviewCD, setSinglePreviewCD] = useState(null);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  const [curriculumConfig, setCurriculumConfig] = useState({
    title: "Bachelor of Technology",
    subtitle: "Computer Science and Engineering",
    scheme: "2026 Scheme",
  });

  /* ============================================================
     FETCH PROGRAMS
  ============================================================ */

  const fetchApprovedPrograms = async () => {
    setLoadingList(true);
    try {
      const { data } = await axios.get("/api/admin/approved/pds", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) setPrograms(data.pds);
    } catch (err) {
      toast.error("Failed to load approved programs");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (adminToken) fetchApprovedPrograms();
    // eslint-disable-next-line
  }, [adminToken]);

  /* ============================================================
     FETCH CDS
  ============================================================ */

  const fetchAvailableCDs = async (programId) => {
    setLoadingCDs(true);
    try {
      const { data } = await axios.get(`/api/admin/compiler/program/${programId}/cds`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) {
        setAvailableCDs(data.availableCDs);
        const availableCodes = data.availableCDs
          .filter((c) => c.available)
          .map((c) => c.courseCode);
        setSelectedCourseCodes(availableCodes);
        setCdOrder(availableCodes);
        if (data.programInfo) {
          setCurriculumConfig((prev) => ({
            ...prev,
            subtitle: data.programInfo.programName || prev.subtitle,
            scheme: data.programInfo.schemeYear
              ? `${data.programInfo.schemeYear} Scheme`
              : prev.scheme,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch CDs:", err);
      toast.error("Failed to load course documents");
    } finally {
      setLoadingCDs(false);
    }
  };

  /* ============================================================
     FETCH FRONT MATTER
  ============================================================ */

  const fetchFrontMatterPages = async () => {
    setLoadingPages(true);
    try {
      const { data } = await axios.get("/api/admin/compiler/frontmatter/pages", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) setFrontMatterPages(data.pages);
    } catch (err) {
      console.error("Failed to fetch front matter pages:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  /* ============================================================
     READINESS
  ============================================================ */

  const checkReadiness = async (pd) => {
    setSelectedPd(pd);
    setReadiness(null);
    setChecking(true);
    setAvailableCDs([]);
    setSelectedCourseCodes([]);
    setCdOrder([]);
    setGlobalSections(getDefaultSections());
    setFilters({
      search: "",
      semesters: new Set(),
      statuses: new Set(),
      onlyAvailable: false,
      sortBy: "semester-asc",
    });

    try {
      const { data } = await axios.get(`/api/admin/compiler/readiness/${pd._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (data.success) {
        setReadiness(data.analysis);
        setCurriculumConfig((prev) => ({
          ...prev,
          subtitle: data.analysis.programName || prev.subtitle,
          scheme: `${pd.scheme_year} Scheme` || prev.scheme,
        }));
      }
    } catch (err) {
      toast.error("Error analyzing curriculum");
    } finally {
      setChecking(false);
    }

    fetchAvailableCDs(pd._id);
    fetchFrontMatterPages();
  };

  /* ============================================================
     DISPLAY NAME
  ============================================================ */

  const getDisplayName = useCallback((name) => {
    const map = {
      cover: "Cover Page",
      chancellor: "Chancellor's Message",
      vc: "Vice Chancellor's Message",
      registrar: "Registrar's Message",
      director: "Director's Message",
      hod: "Head of Department Message",
      bos: "Board of Studies",
      academic_council: "Academic Council",
      acknowledgement: "Acknowledgements",
      back_cover: "Back Cover",
      pvc: "Pro-Vice Chancellor's Message",
    };
    return map[name] || name;
  }, []);

  /* ============================================================
     FRONT MATTER EDITOR HANDLERS
  ============================================================ */

  const editorDirty = editorDraft !== editorOriginal;

  const openEditor = () => {
    if (frontMatterPages.length === 0) {
      toast.error("No front matter pages available");
      return;
    }
    const coverPage =
      frontMatterPages.find((p) => p.name === "cover") || frontMatterPages[0];
    setSelectedPage(coverPage);
    setEditorDraft(coverPage.content || "");
    setEditorOriginal(coverPage.content || "");
    setEditorTab("visual");
    setPageEditorOpen(true);
  };

  // Prepare HTML for the visual editor.
  // The saved HTML keeps the original image source, while the visual editor
  // uses a browser-accessible URL for rendering.
  const prepareVisualHtml = useCallback((html) => {
    if (!html || typeof document === "undefined") return html || "";

    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll("img").forEach((img) => {
      const originalSrc =
        img.getAttribute("data-original-src") || img.getAttribute("src") || "";

      img.setAttribute("data-original-src", originalSrc);
      img.setAttribute("data-editor-image", "true");
      img.setAttribute("src", fmDisplaySrc(originalSrc));
      img.setAttribute("title", "Click to replace this image");
      img.style.cursor = "pointer";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    });

    return container.innerHTML;
  }, []);

  // Convert the visual editor HTML back to the original HTML before saving.
  const serializeVisualHtml = useCallback(() => {
    if (!editorRef.current) return editorDraft;

    const container = editorRef.current.cloneNode(true);

    container.querySelectorAll("img").forEach((img) => {
      const originalSrc = img.getAttribute("data-original-src");
      if (originalSrc) img.setAttribute("src", originalSrc);

      img.removeAttribute("data-original-src");
      img.removeAttribute("data-editor-image");
      img.removeAttribute("title");
      img.style.cursor = "";
      img.style.maxWidth = "";
      img.style.height = "";
    });

    return container.innerHTML;
  }, [editorDraft]);

  // Sync the contentEditable DOM whenever the selected page, editor tab,
  // or modal visibility changes.
  useEffect(() => {
    if (!pageEditorOpen || editorTab !== "visual" || !editorRef.current) return;
    editorRef.current.innerHTML = prepareVisualHtml(editorDraft);
  }, [selectedPage, editorTab, pageEditorOpen, prepareVisualHtml]);

  const handleSelectEditorPage = (page) => {
    if (page.name === selectedPage?.name) return;

    if (editorDirty && !confirm("You have unsaved changes. Discard them?")) {
      return;
    }

    setSelectedPage(page);
    setEditorDraft(page.content || "");
    setEditorOriginal(page.content || "");
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;

    // Keep the browser/display URL out of the saved HTML.
    const content = serializeVisualHtml();
    setEditorDraft(content);
  };

  const handleEditorImageClick = (event) => {
    const image = event.target.closest("img[data-editor-image='true']");
    if (!image) return;

    event.preventDefault();
    event.stopPropagation();

    const originalSrc =
      image.getAttribute("data-original-src") || image.getAttribute("src") || "";

    handleEditorReplaceImage({
      src: originalSrc,
      filename: fmBasename(originalSrc),
      alt: image.getAttribute("alt") || "",
      element: image,
    });
  };

  const handleEditorSave = async () => {
    if (!selectedPage) return;

    setEditorSaving(true);

    try {
      const contentToSave =
        editorTab === "visual" && editorRef.current
          ? serializeVisualHtml()
          : editorDraft;

      await axios.post(
        "/api/admin/compiler/frontmatter/save",
        { pageName: selectedPage.name, content: contentToSave },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setEditorDraft(contentToSave);
      setEditorOriginal(contentToSave);
      toast.success("Changes saved successfully");
      fetchFrontMatterPages();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setEditorSaving(false);
    }
  };

  const handleEditorReset = async () => {
    if (!selectedPage) return;

    const confirmed = confirm(
      `Reset "${getDisplayName(selectedPage.name)}" to default?\n\nAll unsaved changes on this page will be lost.`
    );

    if (!confirmed) return;

    setEditorResetting(true);

    try {
      const resetResponse = await axios.post(
        `/api/admin/compiler/frontmatter/reset/${selectedPage.name}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (resetResponse.data?.success === false) {
        throw new Error(resetResponse.data?.message || "Reset failed");
      }

      const { data } = await axios.get(
        `/api/admin/compiler/frontmatter/page/${selectedPage.name}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (!data.success || !data.page) {
        throw new Error(data.message || "Failed to load the reset page");
      }

      const resetContent = data.page.content || "";

      setSelectedPage(data.page);
      setEditorDraft(resetContent);
      setEditorOriginal(resetContent);
      setEditorTab("visual");

      if (editorRef.current) {
        editorRef.current.innerHTML = prepareVisualHtml(resetContent);
      }

      await fetchFrontMatterPages();
      toast.success("Page restored to default");
    } catch (err) {
      console.error("Reset error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Reset failed"
      );
    } finally {
      setEditorResetting(false);
    }
  };

  const handleEditorReplaceImage = (imageMeta) => {
    if (!selectedPage || !imageMeta?.filename) {
      toast.error("Unable to identify the selected image");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setEditorUploadingImage(imageMeta.filename);

      try {
        const formData = new FormData();
        formData.append("pageName", selectedPage.name);
        formData.append("filename", file.name);
        formData.append("oldFilename", imageMeta.filename);
        formData.append("image", file);

        const { data } = await axios.post(
          "/api/admin/compiler/frontmatter/image",
          formData,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (!data.success) {
          toast.error(data.message || "Upload failed");
          return;
        }

        const oldFilename = imageMeta.filename;
        const newFilename = data.filename || file.name;

        // Update the saved HTML source.
        const re = new RegExp(
          `(src\\s*=\\s*["'])([^"']*?${fmEscapeRe(oldFilename)})(["'])`,
          "gi"
        );

        const updatedDraft = editorDraft.replace(
          re,
          (_match, quoteStart, src, quoteEnd) =>
            `${quoteStart}${src.replace(oldFilename, newFilename)}${quoteEnd}`
        );

        setEditorDraft(updatedDraft);

        // Update the image currently visible in the editor immediately.
        if (editorRef.current) {
          editorRef.current.querySelectorAll("img[data-editor-image='true']").forEach((img) => {
            const currentOriginal =
              img.getAttribute("data-original-src") || img.getAttribute("src") || "";

            if (currentOriginal.includes(oldFilename)) {
              const newOriginal = currentOriginal.replace(
                oldFilename,
                newFilename
              );

              img.setAttribute("data-original-src", newOriginal);
              img.setAttribute("src", fmDisplaySrc(newOriginal));
              img.setAttribute("title", "Click to replace this image");
            }
          });
        }

        toast.success("Image replaced. Click Save Changes to save it.");
      } catch (err) {
        console.error("Image replacement error:", err);
        toast.error(
          err.response?.data?.message || "Image upload failed"
        );
      } finally {
        setEditorUploadingImage(null);
      }
    };

    input.click();
  };

  const handleEditorClose = () => {
    if (editorDirty && !confirm("You have unsaved changes. Close anyway?")) {
      return;
    }

    setPageEditorOpen(false);
    setSelectedPage(null);
    setEditorDraft("");
    setEditorOriginal("");
    setEditorTab("visual");
    setEditorUploadingImage(null);
  };

  /* ============================================================
     CD SELECTION HANDLERS
  ============================================================ */

  const handleToggleCD = (courseCode) => {
    setSelectedCourseCodes((prev) =>
      prev.includes(courseCode)
        ? prev.filter((c) => c !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleMoveUp = (courseCode) => {
    const i = cdOrder.indexOf(courseCode);
    if (i > 0) {
      const next = [...cdOrder];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      setCdOrder(next);
    }
  };
  const handleMoveDown = (courseCode) => {
    const i = cdOrder.indexOf(courseCode);
    if (i < cdOrder.length - 1) {
      const next = [...cdOrder];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      setCdOrder(next);
    }
  };

  /* ============================================================
     FILTER LOGIC
  ============================================================ */

  const allSemesters = useMemo(() => {
    const set = new Set();
    availableCDs.forEach((cd) => set.add(cd.semester));
    return Array.from(set).sort((a, b) => {
      const na = typeof a === "number" ? a : 999;
      const nb = typeof b === "number" ? b : 999;
      return na - nb;
    });
  }, [availableCDs]);

  const visibleCDs = useMemo(() => {
    let list = [...availableCDs];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (cd) =>
          (cd.courseCode || "").toLowerCase().includes(q) ||
          (cd.courseTitle || "").toLowerCase().includes(q)
      );
    }
    if (filters.semesters.size > 0) {
      list = list.filter((cd) => filters.semesters.has(cd.semester));
    }
    if (filters.statuses.size > 0) {
      list = list.filter((cd) =>
        filters.statuses.has(cd.available ? "available" : "missing")
      );
    }
    if (filters.onlyAvailable) {
      list = list.filter((cd) => cd.available);
    }

    const [key, dir] = filters.sortBy.split("-");
    const sign = dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      if (key === "semester") {
        const sa = typeof a.semester === "number" ? a.semester : 999;
        const sb = typeof b.semester === "number" ? b.semester : 999;
        if (sa !== sb) return sign * (sa - sb);
        return (a.courseCode || "").localeCompare(b.courseCode || "");
      }
      if (key === "code")  return sign * (a.courseCode || "").localeCompare(b.courseCode || "");
      if (key === "title") return sign * (a.courseTitle || "").localeCompare(b.courseTitle || "");
      if (key === "status") {
        const sa = a.available ? 1 : 0;
        const sb = b.available ? 1 : 0;
        return sign * (sa - sb);
      }
      return 0;
    });

    return list;
  }, [availableCDs, filters]);

  const visibleCourseCodes = useMemo(
    () => visibleCDs.map((cd) => cd.courseCode),
    [visibleCDs]
  );

  /* ============================================================
     UNIVERSAL SELECTION
  ============================================================ */

  const globalSelectedCount = useMemo(
    () => visibleCourseCodes.filter((c) => selectedCourseCodes.includes(c)).length,
    [visibleCourseCodes, selectedCourseCodes]
  );
  const globalAllSelected =
    visibleCourseCodes.length > 0 && globalSelectedCount === visibleCourseCodes.length;
  const globalSomeSelected =
    globalSelectedCount > 0 && globalSelectedCount < visibleCourseCodes.length;

  const handleToggleAllVisible = () => {
    if (globalAllSelected) {
      setSelectedCourseCodes((prev) =>
        prev.filter((c) => !visibleCourseCodes.includes(c))
      );
    } else {
      setSelectedCourseCodes((prev) => {
        const set = new Set(prev);
        visibleCourseCodes.forEach((c) => set.add(c));
        return Array.from(set);
      });
    }
  };

  const isSemesterFullySelected = (sem) => {
    const codes = visibleCDs
      .filter((cd) => cd.semester === sem)
      .map((cd) => cd.courseCode);
    return codes.length > 0 && codes.every((c) => selectedCourseCodes.includes(c));
  };

  const isSemesterPartiallySelected = (sem) => {
    const codes = visibleCDs
      .filter((cd) => cd.semester === sem)
      .map((cd) => cd.courseCode);
    const on = codes.filter((c) => selectedCourseCodes.includes(c)).length;
    return on > 0 && on < codes.length;
  };

  const handleToggleSemester = (sem) => {
    const codes = visibleCDs
      .filter((cd) => cd.semester === sem)
      .map((cd) => cd.courseCode);
    if (codes.length === 0) return;

    const allOn = codes.every((c) => selectedCourseCodes.includes(c));
    setSelectedCourseCodes((prev) => {
      const set = new Set(prev);
      if (allOn) codes.forEach((c) => set.delete(c));
      else codes.forEach((c) => set.add(c));
      return Array.from(set);
    });
  };

  const visibleGroupedBySemester = useMemo(() => {
    const map = new Map();
    visibleCDs.forEach((cd) => {
      const s = cd.semester ?? "Other";
      if (!map.has(s)) map.set(s, []);
      map.get(s).push(cd);
    });
    return map;
  }, [visibleCDs]);

  /* ============================================================
     FILTER HANDLERS
  ============================================================ */

  const toggleFilterSemester = (sem) => {
    setFilters((prev) => {
      const next = new Set(prev.semesters);
      if (next.has(sem)) next.delete(sem);
      else next.add(sem);
      return { ...prev, semesters: next };
    });
  };

  const toggleFilterStatus = (st) => {
    setFilters((prev) => {
      const next = new Set(prev.statuses);
      if (next.has(st)) next.delete(st);
      else next.add(st);
      return { ...prev, statuses: next };
    });
  };

  const clearAllFilters = () =>
    setFilters({ ...DEFAULT_FILTERS, semesters: new Set(), statuses: new Set() });
  const selectAllSemestersFilter = () =>
    setFilters((p) => ({ ...p, semesters: new Set(allSemesters) }));

  /* ============================================================
     SORTED SELECTED CDS
  ============================================================ */

  const getSelectedCDs = useMemo(() => {
    const selected = availableCDs.filter((c) =>
      selectedCourseCodes.includes(c.courseCode)
    );
    return selected.sort((a, b) => {
      const ia = cdOrder.indexOf(a.courseCode);
      const ib = cdOrder.indexOf(b.courseCode);
      if (ia !== -1 && ib !== -1) return ia - ib;
      const sa = typeof a.semester === "number" ? a.semester : 999;
      const sb = typeof b.semester === "number" ? b.semester : 999;
      if (sa !== sb) return sa - sb;
      return a.courseCode.localeCompare(b.courseCode);
    });
  }, [availableCDs, selectedCourseCodes, cdOrder]);

  /* ============================================================
     PREVIEW / EXPORT
  ============================================================ */

  const handlePreviewSingleCD = (cd) => {
    if (!cd.available) {
      toast.error("This CD is not available");
      return;
    }
    setSinglePreviewCD(cd);
  };

  const handlePreviewFullCurriculum = () => {
    if (selectedCourseCodes.length === 0) {
      toast.error("Please select at least one course");
      return;
    }
    setFullPreviewOpen(true);
  };

  const buildArgs = () => ({
    frontMatterPages: frontMatterPages.map((p) => ({
      ...p,
      displayName: getDisplayName(p.name),
    })),
    selectedCDs: getSelectedCDs,
    selectedSections: globalSections,
    programInfo: {
      programName: selectedPd?.program_name,
      programCode: selectedPd?.program_id,
    },
    curriculumConfig,
  });

  const handleExportHTML = () => {
    if (selectedCourseCodes.length === 0) {
      toast.error("Please select at least one course");
      return;
    }
    const html = generateStandaloneHTML(buildArgs());
    downloadHTML(
      html,
      `${selectedPd?.program_id || "curriculum"}_Curriculum_${new Date()
        .toISOString()
        .slice(0, 10)}.html`
    );
    toast.success("HTML file downloaded!");
  };

  const handleExportPDF = () => {
    if (selectedCourseCodes.length === 0) {
      toast.error("Please select at least one course");
      return;
    }
    const html = generateStandaloneHTML(buildArgs());
    downloadPDF(html, `${selectedPd?.program_id || "curriculum"}_Curriculum.pdf`);
    toast.success("PDF print dialog opened!");
  };

  /* ============================================================
     FILTER PROGRAMS
  ============================================================ */

  const filtered = programs.filter(
    (pd) =>
      pd.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pd.program_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pct = readiness?.completionPercentage || 0;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <AdminLayout>
      <style>{CD_PREVIEW_STYLES}</style>
      <div className="space-y-8 max-w-7xl pb-10">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Layers size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">
              Curriculum Compiler
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Assemble approved course documents into a publication-ready PDF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Program List */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber-400 transition"
              />
            </div>

            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-amber-600" size={28} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <FileWarning size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No approved programs found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map((pd) => {
                  const isSelected = selectedPd?._id === pd._id;
                  return (
                    <button
                      key={pd._id}
                      onClick={() => checkReadiness(pd)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/70 shadow-sm"
                          : "border-stone-200 hover:border-amber-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">
                            {pd.program_name}
                          </p>
                          <p className="text-xs text-stone-400 font-mono">
                            {pd.program_id}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`text-stone-400 transition ${
                            isSelected ? "rotate-90 text-amber-600" : ""
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPd && checking && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm min-h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 size={42} className="animate-spin text-amber-600" />
                  <div className="text-center">
                    <p className="font-bold text-stone-800">Loading curriculum...</p>
                    <p className="text-sm text-stone-400 mt-1">
                      Analyzing {selectedPd.program_name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Configuration */}
            {selectedPd && readiness && !checking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={18} className="text-stone-400" />
                  <h3 className="font-bold text-stone-700">Document Configuration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Degree Title
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.title}
                      onChange={(e) =>
                        setCurriculumConfig({ ...curriculumConfig, title: e.target.value })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.subtitle}
                      onChange={(e) =>
                        setCurriculumConfig({ ...curriculumConfig, subtitle: e.target.value })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">
                      Scheme / Year
                    </label>
                    <input
                      type="text"
                      value={curriculumConfig.scheme}
                      onChange={(e) =>
                        setCurriculumConfig({ ...curriculumConfig, scheme: e.target.value })
                      }
                      className="w-full text-sm border border-stone-200 rounded-lg p-2 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Front Matter Editor card */}
            {selectedPd && readiness && !checking && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode size={18} className="text-stone-400" />
                    <h3 className="font-bold text-stone-700">Front Matter Pages</h3>
                  </div>
                  <button
                    onClick={openEditor}
                    disabled={frontMatterPages.length === 0 || loadingPages}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit size={16} /> Edit Cover Pages
                  </button>
                </div>
                {loadingPages && (
                  <div className="flex justify-center py-4 mt-2">
                    <Loader2 size={20} className="animate-spin text-amber-600" />
                  </div>
                )}
                {!loadingPages && frontMatterPages.length === 0 && (
                  <div className="text-center py-4 mt-2 text-stone-400">
                    <p className="text-sm font-medium">No front matter pages found</p>
                    <p className="text-xs">
                      Make sure the templates exist in the backend
                    </p>
                  </div>
                )}
                {!loadingPages && frontMatterPages.length > 0 && (
                  <div className="mt-3 text-xs text-stone-500">
                    {frontMatterPages.length} pages available for editing
                  </div>
                )}
              </div>
            )}

            {/* UNIVERSAL SECTION SELECTOR */}
            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <UniversalSectionSelector value={globalSections} onChange={setGlobalSections} />
                <p className="text-[11px] text-stone-400 mt-3">
                  These section toggles apply uniformly to every selected course
                  document in preview and export.
                </p>
              </div>
            )}

            {/* FILTER / SELECTION PANEL */}
            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-stone-400" />
                    <h3 className="font-bold text-stone-700">Select Course Documents</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      {selectedCourseCodes.length} / {availableCDs.length} selected
                    </span>
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                      {filters.semesters.size || allSemesters.length} semesters
                    </span>
                  </div>
                </div>

                {/* Filter panel */}
                <div className="p-5 border-b border-stone-200 bg-stone-50/30 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) =>
                          setFilters((p) => ({ ...p, search: e.target.value }))
                        }
                        placeholder="Search by course code or title…"
                        className="w-full border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <SortAsc size={14} className="text-stone-400" />
                      <select
                        value={filters.sortBy}
                        onChange={(e) =>
                          setFilters((p) => ({ ...p, sortBy: e.target.value }))
                        }
                        className="w-full border border-stone-200 rounded-lg py-2 px-2 text-xs outline-none focus:border-amber-400"
                      >
                        <option value="semester-asc">Semester ↑</option>
                        <option value="semester-desc">Semester ↓</option>
                        <option value="code-asc">Course Code ↑</option>
                        <option value="code-desc">Course Code ↓</option>
                        <option value="title-asc">Course Title ↑</option>
                        <option value="title-desc">Course Title ↓</option>
                        <option value="status-asc">Status (A → M)</option>
                        <option value="status-desc">Status (M → A)</option>
                      </select>
                    </div>

                    <button
                      onClick={clearAllFilters}
                      className="flex items-center justify-center gap-2 border border-stone-200 rounded-lg py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100"
                    >
                      <RefreshCw size={12} /> Reset Filters
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
                      Semesters:
                    </span>
                    <button
                      onClick={selectAllSemestersFilter}
                      className="text-[11px] px-2 py-1 rounded-full border border-stone-300 hover:bg-stone-100 font-bold text-stone-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setFilters((p) => ({ ...p, semesters: new Set() }))}
                      className="text-[11px] px-2 py-1 rounded-full border border-stone-300 hover:bg-stone-100 font-medium text-stone-500"
                    >
                      Clear
                    </button>
                    {allSemesters.map((sem) => {
                      const active = filters.semesters.has(sem);
                      const label =
                        typeof sem === "number" ? `Sem ${sem}` : String(sem);
                      return (
                        <button
                          key={String(sem)}
                          onClick={() => toggleFilterSemester(sem)}
                          className={`text-[11px] px-2 py-1 rounded-full border font-bold transition-colors ${
                            active
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "border-stone-300 text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
                      Status:
                    </span>
                    <button
                      onClick={() => toggleFilterStatus("available")}
                      className={`text-[11px] px-2 py-1 rounded-full border font-bold ${
                        filters.statuses.has("available")
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-stone-300 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => toggleFilterStatus("missing")}
                      className={`text-[11px] px-2 py-1 rounded-full border font-bold ${
                        filters.statuses.has("missing")
                          ? "bg-red-600 border-red-600 text-white"
                          : "border-stone-300 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      Missing
                    </button>

                    <label className="ml-auto flex items-center gap-1.5 text-[11px] text-stone-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.onlyAvailable}
                        onChange={(e) =>
                          setFilters((p) => ({ ...p, onlyAvailable: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 accent-amber-600"
                      />
                      Only available
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-200">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={globalAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = globalSomeSelected;
                        }}
                        onChange={handleToggleAllVisible}
                        className="w-4 h-4 accent-amber-600"
                      />
                      <span className="text-xs font-bold text-stone-700">
                        Select All (visible: {visibleCDs.length})
                      </span>
                    </label>
                    <button
                      onClick={() => setSelectedCourseCodes([])}
                      className="text-xs text-stone-500 hover:text-stone-700 font-medium px-2 py-1 rounded hover:bg-stone-100"
                    >
                      Deselect All
                    </button>
                    <span className="text-[11px] text-stone-400 ml-auto">
                      {visibleCDs.length} shown · {availableCDs.length} total
                    </span>
                  </div>
                </div>

                {/* CD list */}
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {loadingCDs ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-amber-600" />
                    </div>
                  ) : availableCDs.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <FileWarning size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No course documents found</p>
                    </div>
                  ) : visibleCDs.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <FileWarning size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">
                        No course documents match the current filters
                      </p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 text-xs text-amber-600 font-medium hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {Array.from(visibleGroupedBySemester.entries()).map(
                        ([sem, list]) => {
                          const semLabel =
                            typeof sem === "number" ? `Semester ${sem}` : String(sem);
                          const fullySelected = isSemesterFullySelected(sem);
                          const partiallySelected = isSemesterPartiallySelected(sem);
                          const semSelectedCount = list.filter((cd) =>
                            selectedCourseCodes.includes(cd.courseCode)
                          ).length;

                          return (
                            <div key={String(sem)}>
                              <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone-200">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={fullySelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = partiallySelected;
                                    }}
                                    onChange={() => handleToggleSemester(sem)}
                                    className="w-4 h-4 accent-amber-600"
                                  />
                                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                                    {semLabel}
                                  </span>
                                </label>
                                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                  {semSelectedCount} / {list.length}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {list.map((cd) => {
                                  const isSelected = selectedCourseCodes.includes(
                                    cd.courseCode
                                  );
                                  const orderIndex = cdOrder.indexOf(cd.courseCode);

                                  return (
                                    <CDSelectionCard
                                      key={cd.courseCode}
                                      cd={cd}
                                      isSelected={isSelected}
                                      onToggle={() => handleToggleCD(cd.courseCode)}
                                      onPreview={() => handlePreviewSingleCD(cd)}
                                      onMoveUp={() => handleMoveUp(cd.courseCode)}
                                      onMoveDown={() => handleMoveDown(cd.courseCode)}
                                      canMoveUp={orderIndex > 0}
                                      canMoveDown={orderIndex < cdOrder.length - 1}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Preview bar */}
                {selectedCourseCodes.length > 0 && (
                  <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between">
                    <div className="text-xs text-stone-500">
                      {selectedCourseCodes.length} courses selected · Ready for preview
                    </div>
                    <button
                      onClick={handlePreviewFullCurriculum}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
                    >
                      <Eye size={16} />
                      Preview Full Curriculum
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Export Section */}
            {selectedPd && !checking && readiness && selectedCourseCodes.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Download size={18} className="text-stone-400" />
                  <h3 className="font-bold text-stone-700">Export Options</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportHTML}
                    className="flex items-center gap-2 px-5 py-3 bg-stone-800 text-white text-sm font-bold rounded-lg hover:bg-stone-900 transition-all"
                  >
                    <Globe size={16} /> Download HTML
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <FileDown size={16} /> Download PDF
                  </button>
                </div>
                <p className="text-xs text-stone-400 mt-3">
                  HTML downloads as a standalone file. PDF opens a print dialog for
                  saving as PDF.
                </p>
              </div>
            )}

            {/* Readiness Report */}
            {selectedPd && !checking && readiness && (
              <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
                <div className="p-7 border-b border-stone-100 bg-stone-50/50 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={15} className="text-amber-700" />
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                          Readiness Report
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-stone-900">
                        {readiness.programName || readiness.programCode}
                      </h3>
                      <p className="text-stone-400 text-sm font-medium mt-0.5">
                        {readiness.programCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-4xl font-black tabular-nums tracking-tighter ${
                          pct === 100
                            ? "text-green-600"
                            : pct >= 60
                            ? "text-amber-700"
                            : "text-red-500"
                        }`}
                      >
                        {pct}%
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Ready
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <ProgressBar pct={pct} />
                    <div className="flex justify-between text-[11px] text-stone-400 font-medium mt-1.5">
                      <span className="text-green-600 font-bold">
                        {readiness.totalApproved} approved
                      </span>
                      <span>{readiness.totalRequired} total courses required</span>
                    </div>
                  </div>
                </div>

                <div className="p-7 space-y-7 overflow-y-auto flex-1 bg-stone-50/30">
                  {readiness.semesters?.map((sem) => (
                    <div key={sem.number}>
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-black text-stone-800 uppercase tracking-wide">
                          Semester {sem.number}
                        </h4>
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-[10px] font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                          {sem.courses?.length} courses
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {sem.courses?.map((course) => {
                          const S = STATUS_CONFIG[course.status] || STATUS_CONFIG.Missing;
                          return (
                            <div
                              key={course.code}
                              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${S.dot}`}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-800 truncate">
                                    {course.code}
                                  </p>
                                  <p className="text-[10px] text-stone-500 truncate w-32">
                                    {course.title}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/50 ${S.badge}`}
                                >
                                  {course.status}
                                </span>
                                {course.version && (
                                  <span className="text-[9px] font-bold text-stone-400 font-mono">
                                    v{course.version}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-white border-t border-stone-200 flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2.5 text-stone-600 text-sm bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                    <FileText size={16} className="text-amber-600" />
                    Book contains <strong>1 PD</strong> and{" "}
                    <strong>{readiness.totalApproved} CDs</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single CD Preview */}
      <SingleCDPreviewModal
        isOpen={!!singlePreviewCD}
        onClose={() => setSinglePreviewCD(null)}
        cd={singlePreviewCD?.cdData}
        meta={{ versionNo: singlePreviewCD?.cdVersion }}
        selectedSections={globalSections}
      />

      {/* Full Curriculum Preview */}
      <FullCurriculumPreview
        isOpen={fullPreviewOpen}
        onClose={() => setFullPreviewOpen(false)}
        frontMatterPages={frontMatterPages.map((p) => ({
          ...p,
          displayName: getDisplayName(p.name),
        }))}
        selectedCDs={getSelectedCDs}
        selectedSections={globalSections}
        programInfo={{
          programName: selectedPd?.program_name,
          programCode: selectedPd?.program_id,
        }}
        curriculumConfig={curriculumConfig}
      />

      {/* ============================================================
          FRONT MATTER EDITOR MODAL (inline)
      ============================================================ */}
      {pageEditorOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1180px] h-[88vh] min-h-[560px] flex flex-col overflow-hidden border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-stone-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileCode size={18} className="text-amber-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-stone-900 truncate">
                      Front Matter Editor
                    </h2>
                    {selectedPage && (
                      <span className="hidden sm:inline-flex text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-1 rounded-full">
                        {getDisplayName(selectedPage.name)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                    Edit pages directly. Click an image to replace it.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleEditorReset}
                  disabled={editorResetting || !selectedPage}
                  title="Restore this page to its default content"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 hover:border-stone-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editorResetting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  Reset to Default
                </button>

                <button
                  onClick={handleEditorSave}
                  disabled={editorSaving || !editorDirty || !selectedPage}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editorSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  {editorDirty ? "Save Changes" : "Saved"}
                </button>

                <button
                  onClick={handleEditorClose}
                  title="Close editor"
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <aside className="w-56 flex-shrink-0 border-r border-stone-200 bg-stone-50/70 overflow-y-auto">
                <div className="p-3">
                  <div className="flex items-center justify-between px-1 mb-2.5">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Pages
                    </p>
                    <span className="text-[10px] font-bold text-stone-400">
                      {frontMatterPages.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {frontMatterPages.map((page) => {
                      const isActive = page.name === selectedPage?.name;
                      return (
                        <button
                          key={page.name}
                          onClick={() => handleSelectEditorPage(page)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? "bg-amber-100 text-amber-900 font-bold shadow-sm"
                              : "text-stone-600 hover:bg-white hover:text-stone-900"
                          }`}
                        >
                          <span className="block truncate">
                            {getDisplayName(page.name)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Main editor */}
              <main className="flex-1 flex flex-col min-w-0 bg-stone-100">
                {/* Tab bar */}
                <div className="h-11 flex items-end gap-1 px-4 border-b border-stone-200 bg-white flex-shrink-0">
                  <button
                    onClick={() => setEditorTab("visual")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                      editorTab === "visual"
                        ? "bg-stone-50 border-b-2 border-amber-600 text-amber-700"
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Eye size={13} /> Visual
                  </button>

                  <button
                    onClick={() => {
                      if (editorTab === "visual") {
                        setEditorDraft(serializeVisualHtml());
                      }
                      setEditorTab("html");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                      editorTab === "html"
                        ? "bg-stone-50 border-b-2 border-amber-600 text-amber-700"
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <FileCode size={13} /> HTML
                  </button>

                  {editorDirty && (
                    <span className="ml-auto mr-2 mb-2 flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                      <AlertTriangle size={11} /> Unsaved changes
                    </span>
                  )}
                </div>

                {/* Content area */}
                <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
                  {editorTab === "visual" ? (
                    <div className="h-full overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                      <div className="min-h-full px-6 py-7 sm:px-10 sm:py-9">
                        <div
                          ref={editorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={handleEditorInput}
                          onClick={handleEditorImageClick}
                          className="editor-document outline-none min-h-full text-stone-800 [&_img[data-editor-image='true']]:cursor-pointer [&_img[data-editor-image='true']]:transition-all [&_img[data-editor-image='true']:hover]:opacity-80 [&_img[data-editor-image='true']:hover]:ring-4 [&_img[data-editor-image='true']:hover]:ring-amber-200 [&_img[data-editor-image='true']:hover]:rounded-md"
                          style={{
                            fontFamily: "'Times New Roman', Times, serif",
                            fontSize: "14px",
                            lineHeight: 1.6,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={editorDraft}
                      onChange={(event) => setEditorDraft(event.target.value)}
                      spellCheck={false}
                      className="w-full h-full bg-slate-950 text-green-300 font-mono text-xs leading-6 p-4 rounded-xl border border-slate-800 outline-none resize-none focus:ring-2 focus:ring-amber-200"
                    />
                  )}
                </div>

                {/* Helpful footer */}
                <div className="h-9 flex items-center justify-between px-4 border-t border-stone-200 bg-white text-[10px] text-stone-400 flex-shrink-0">
                  <span>
                    {editorTab === "visual"
                      ? "Tip: click an image to replace it"
                      : "HTML changes are applied when you switch to Visual"}
                  </span>
                  {editorUploadingImage && (
                    <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                      <Loader2 size={11} className="animate-spin" />
                      Uploading image…
                    </span>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CurriculumCompiler;