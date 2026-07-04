// backend/utils/pdfMerger.js
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Merge multiple PDF buffers into a single PDF
 * @param {Buffer[]} pdfBuffers - Array of PDF buffers to merge
 * @returns {Promise<Buffer>} - Merged PDF buffer
 */
export const mergePDFs = async (pdfBuffers) => {
  if (!pdfBuffers || pdfBuffers.length === 0) {
    throw new Error("No PDF buffers provided for merging");
  }

  // Create a new empty PDF document
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    if (!buffer || buffer.length === 0) continue;

    try {
      const pdf = await PDFDocument.load(buffer);
      const pageIndices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (error) {
      console.error("Error loading PDF buffer:", error.message);
      throw new Error(`Failed to merge one of the PDFs: ${error.message}`);
    }
  }

  return Buffer.from(await mergedPdf.save());
};

/**
 * Merge the static cover PDF with the generated curriculum PDF
 * @param {Buffer} curriculumPdfBuffer - The generated curriculum PDF as buffer
 * @returns {Promise<Buffer>} - Merged PDF buffer (cover + curriculum)
 */
export const mergeWithCover = async (curriculumPdfBuffer) => {
  // 1. Build the path to the cover PDF
  const coverPath = path.join(
    process.cwd(),
    "public",
    "templates",
    "cover_page_pd.pdf"
  );

  // 2. Check if cover PDF exists
  if (!fs.existsSync(coverPath)) {
    throw new Error(
      `Cover PDF not found at: ${coverPath}. Please ensure cover_page_pd.pdf is placed in backend/public/templates/`
    );
  }

  // 3. Read the cover PDF
  const coverBuffer = fs.readFileSync(coverPath);
  console.log(`✅ Cover PDF loaded: ${coverPath} (${coverBuffer.length} bytes)`);
  console.log(`✅ Curriculum PDF size: ${curriculumPdfBuffer.length} bytes`);

  // 4. Merge cover + curriculum
  const mergedBuffer = await mergePDFs([coverBuffer, curriculumPdfBuffer]);

  console.log(
    `✅ Merged PDF created: ${mergedBuffer.length} bytes (Cover + Curriculum)`
  );

  return mergedBuffer;
};

/**
 * Read the cover PDF buffer (useful if you just need to inspect it)
 * @returns {Buffer} - Cover PDF buffer
 */
export const getCoverPDF = () => {
  const coverPath = path.join(
    process.cwd(),
    "public",
    "templates",
    "cover_page_pd.pdf"
  );

  if (!fs.existsSync(coverPath)) {
    throw new Error(`Cover PDF not found at: ${coverPath}`);
  }

  return fs.readFileSync(coverPath);
};

/**
 * Get the number of pages in a PDF buffer
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<number>} - Number of pages
 */
export const getPageCount = async (pdfBuffer) => {
  const pdf = await PDFDocument.load(pdfBuffer);
  return pdf.getPageCount();
};

/**
 * Get page count of the cover PDF (for debugging/info)
 * @returns {Promise<number>} - Number of pages in cover PDF
 */
export const getCoverPageCount = async () => {
  const coverBuffer = getCoverPDF();
  return getPageCount(coverBuffer);
};



/**
 * Merge cover, TOC, and curriculum PDFs
 * @param {Buffer} curriculumPdf - Curriculum PDF buffer (without TOC)
 * @param {Buffer} tocPdf - TOC PDF buffer
 * @returns {Promise<Buffer>} - Merged PDF (cover + TOC + curriculum)
 */
export const mergeWithCoverAndTOC = async (curriculumPdf, tocPdf) => {
  const coverBuffer = getCoverPDF();
  return mergePDFs([coverBuffer, tocPdf, curriculumPdf]);
};