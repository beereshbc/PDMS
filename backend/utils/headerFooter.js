// backend/utils/headerFooter.js
import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Decorate a PDF with minimal headers and footers.
 * - Front matter: Roman numerals (i, ii, iii, ...)
 * - Main content: Arabic numerals (1, 2, 3, ...)
 * - Header: Program name + scheme (right-aligned, tiny, subtle) – NO LINE
 * - Footer: University name (left, tiny, subtle) + Page number (right, visible)
 * 
 * @param {Buffer} pdfBuffer - The merged PDF (cover + curriculum)
 * @param {Object} options - Configuration options
 * @param {number} options.coverPageCount - Number of pages in the cover PDF
 * @param {string} options.headerText - Text for header (e.g., "Computer Science & Engineering – 2024")
 * @param {string} options.universityName - University name for footer (e.g., "GM University")
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const decoratePDF = async (pdfBuffer, options = {}) => {
  const {
    coverPageCount = 0,
    headerText = "",
    universityName = "GM University",
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont('Helvetica');

  // Subtle colors
  const subtleGray = rgb(0.6, 0.6, 0.6);    // for header and university name
  const darkVisible = rgb(0.1, 0.1, 0.1);   // for page numbers (visible)

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    // ── 1. PAGE NUMBER (just the number) ──
    let pageNumberStr = "";
    if (i < coverPageCount) {
      pageNumberStr = toRoman(i + 1);
    } else {
      const arabicNum = i - coverPageCount + 1;
      pageNumberStr = arabicNum.toString();
    }

    // ── 2. FOOTER: University (left) + Page Number (right) ──
    const footerY = 28;
    const footerFontSize = 8;      // small for university name
    const pageNumFontSize = 10;    // slightly larger for page number

    // Left: University name (subtle)
    page.drawText(universityName, {
      x: 30,
      y: footerY,
      size: footerFontSize,
      font: font,
      color: subtleGray,
    });

    // Right: Page number (visible, dark)
    const numWidth = font.widthOfTextAtSize(pageNumberStr, pageNumFontSize);
    page.drawText(pageNumberStr, {
      x: width - numWidth - 30,
      y: footerY,
      size: pageNumFontSize,
      font: font,
      color: darkVisible,
    });

    // ── 3. HEADER (only on main content, right-aligned, tiny, no line) ──
    if (i >= coverPageCount && headerText) {
      const headerY = height - 32;
      const headerFontSize = 9;    // very small

      const textWidth = font.widthOfTextAtSize(headerText, headerFontSize);
      page.drawText(headerText, {
        x: width - textWidth - 30,
        y: headerY,
        size: headerFontSize,
        font: font,
        color: subtleGray,
      });
    }
  }

  return Buffer.from(await pdfDoc.save());
};

/**
 * Convert number to Roman numerals (up to 20)
 */
function toRoman(num) {
  const romanNumerals = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' },
  ];
  let result = '';
  for (const numeral of romanNumerals) {
    while (num >= numeral.value) {
      result += numeral.symbol;
      num -= numeral.value;
    }
  }
  return result;
}