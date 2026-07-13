/**
 * File Parser — Client-side file parsing for AI document analyzers.
 *
 * Uses the following npm packages (installed separately):
 *   - pdfjs-dist   → PDF text extraction
 *   - mammoth      → Word (.docx) text extraction
 *   - xlsx         → Excel (.xlsx / .xls) data extraction
 *   - papaparse    → CSV text parsing
 *   - jszip        → PPTX XML extraction (pptx is a zip of XML files)
 */
import { AI_TOOL_TYPES } from './config';

// ─── Max file size ───────────────────────────────────────────────
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── PDF parsing ─────────────────────────────────────────────────
async function parsePDF(file) {
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker path for Vite — wrap in try/catch as the URL resolution
  // can fail in some Vite production builds
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  } catch {
    // Fallback: use CDN worker (slower but reliable)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(`--- Page ${i} ---\n${text}`);
  }

  return {
    content: pages.join('\n\n'),
    meta: { totalPages: pdf.numPages },
  };
}

// ─── Word parsing ────────────────────────────────────────────────
async function parseWord(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    content: result.value,
    meta: { warnings: result.messages },
  };
}

// ─── Excel parsing ───────────────────────────────────────────────
async function parseExcel(file) {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const lines = [`Sheet Names: ${workbook.SheetNames.join(', ')}\n`];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    lines.push(`\n=== Sheet: ${sheetName} ===`);
    for (const row of json) {
      lines.push((row || []).join('\t'));
    }
  }

  return {
    content: lines.join('\n'),
    meta: { sheetNames: workbook.SheetNames },
  };
}

// ─── Content size cap ─────────────────────────────────────────────
const MAX_CONTENT_CHARS = 50000;

function truncateContent(content, meta) {
  if (content.length <= MAX_CONTENT_CHARS) return { content, meta };
  return {
    content: content.slice(0, MAX_CONTENT_CHARS) +
      `\n\n[... content truncated at ${MAX_CONTENT_CHARS.toLocaleString()} characters. ${content.length - MAX_CONTENT_CHARS} more characters omitted.]`,
    meta: { ...meta, truncated: true, originalLength: content.length },
  };
}

// ─── CSV parsing ──────────────────────────────────────────────────
async function parseCSV(file) {
  const Papa = await import('papaparse');
  const text = await file.text();
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });

  // If parsing failed, return raw text as fallback
  if (result.errors?.length > 0 && result.data.length === 0) {
    // Try without headers
    const fallback = Papa.parse(text, { header: false, skipEmptyLines: true });
    if (fallback.data.length > 0) {
      const rows = fallback.data.map((r) => r.join('\t')).join('\n');
      return {
        content: `--- Raw CSV Data ---\n${rows}`,
        meta: { rows: fallback.data.length, columns: fallback.data[0]?.length || 0 },
      };
    }
    return { content: text, meta: { raw: true } };
  }

  const fields = result.meta.fields || [];
  const preview = result.data.slice(0, 20);
  const output = [
    `Columns: ${fields.join(', ')}`,
    `Total Rows: ${result.data.length}`,
    '',
    '--- Data Preview (first 20 rows) ---',
    fields.join('\t'),
    ...preview.map((row) => fields.map((f) => row[f] ?? '').join('\t')),
  ];

  if (result.data.length > 20) {
    output.push(`\n... and ${result.data.length - 20} more rows`);
  }

  return {
    content: output.join('\n'),
    meta: {
      rows: result.data.length,
      columns: fields.length,
      fields,
    },
  };
}

// ─── PowerPoint parsing ───────────────────────────────────────────
async function parsePPT(file) {
  const JSZip = await import('jszip');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // PPTX is a zip; slides are in ppt/slides/slideN.xml
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

  if (slideFiles.length === 0) {
    // Try ppt/slides/_rels/ or alternative paths
    const altSlides = Object.keys(zip.files).filter(
      (f) => f.endsWith('.xml') && f.includes('slide'),
    );
    if (altSlides.length === 0) {
      return {
        content: '',
        meta: {},
        error: 'No slide content found in the presentation.',
      };
    }
    slideFiles.push(...altSlides);
  }

  const slides = [];
  for (const slidePath of slideFiles) {
    const xmlContent = await zip.files[slidePath].async('text');
    // Extract text from <a:t> elements
    const textMatches = xmlContent.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g);
    const slideText = [...textMatches].map((m) => m[1]).join(' ');
    const slideNum = slidePath.match(/(\d+)/)?.[1] || slidePath;
    slides.push(`--- Slide ${slideNum} ---\n${slideText}`);
  }

  return {
    content: slides.join('\n\n'),
    meta: { totalSlides: slideFiles.length },
  };
}

// ─── Main dispatch ────────────────────────────────────────────────

const EXTENSION_MAP = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'excel',
  xls: 'excel',
  csv: 'csv',
  pptx: 'ppt',
};

/**
 * Parse a File object by detecting its extension.
 *
 * @param {File} file - The uploaded file
 * @returns {Promise<{content: string, fileName: string, fileType: string, meta?: object, error?: string}>}
 */
export async function parseFile(file) {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();
  const fileType = EXTENSION_MAP[extension] || extension || 'unknown';

  // Reject files over the size limit
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      content: '',
      fileName,
      fileType,
      error: `File is ${sizeMB} MB. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
    };
  }

  try {
    let result;
    switch (extension) {
      case 'pdf':
        result = await parsePDF(file);
        break;
      case 'docx':
        result = await parseWord(file);
        break;
      case 'xlsx':
      case 'xls':
        result = await parseExcel(file);
        break;
      case 'csv':
        result = await parseCSV(file);
        break;
      case 'pptx':
        result = await parsePPT(file);
        break;
      default:
        return {
          content: '',
          fileName,
          fileType,
          error: `Unsupported file type: .${extension}`,
        };
    }

    if (result.error) {
      return { content: result.content, fileName, fileType, meta: result.meta, error: result.error };
    }

    const truncated = truncateContent(result.content, result.meta);
    return { content: truncated.content, fileName, fileType, meta: truncated.meta };
  } catch (err) {
    return {
      content: '',
      fileName,
      fileType,
      error: `Failed to parse: ${err.message || err}`,
    };
  }
}

// ─── Tool type detection ──────────────────────────────────────────

/**
 * List of AI tool types that support file upload.
 * Each maps to one or more accepted file extensions.
 */
export const FILE_ANALYZER_TOOLS = {
  [AI_TOOL_TYPES.PDF_ANALYZER]: { extensions: ['.pdf'], label: 'PDF', accept: '.pdf' },
  [AI_TOOL_TYPES.WORD_ANALYZER]: { extensions: ['.docx'], label: 'Word', accept: '.docx' },
  [AI_TOOL_TYPES.EXCEL_ANALYZER]: { extensions: ['.xlsx', '.xls'], label: 'Excel', accept: '.xlsx,.xls' },
  [AI_TOOL_TYPES.CSV_ANALYZER]: { extensions: ['.csv'], label: 'CSV', accept: '.csv' },
  [AI_TOOL_TYPES.POWERPOINT_ANALYZER]: { extensions: ['.pptx'], label: 'PowerPoint', accept: '.pptx' },
};

/**
 * Check whether a tool type supports file upload.
 * @param {string} toolType
 * @returns {{ supported: boolean, config?: object }}
 */
export function getFileUploadConfig(toolType) {
  const config = FILE_ANALYZER_TOOLS[toolType];
  return config ? { supported: true, config } : { supported: false };
}
