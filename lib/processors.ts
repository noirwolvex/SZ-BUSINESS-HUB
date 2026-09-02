import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';

export interface ProcessResult {
  outputMimeType: string;
  outputFileName: string;
  outputBuffer: ArrayBuffer;
  outputFiles?: { name: string; buffer: ArrayBuffer; mimeType: string }[];
  metadata?: {
    originalSize?: number;
    newSize?: number;
    savedPercent?: number;
    pageCount?: number;
    extractedPages?: number[];
  };
}

export interface ProcessOptions {
  format?: 'png' | 'jpg';
  quality?: 'low' | 'medium' | 'high';
  rotation?: 90 | 180 | 270;
  pageRanges?: string;
  pages?: number[];
  watermarkText?: string;
  watermarkOpacity?: number;
  password?: string;
  pageNumbersFormat?: string;
  pageNumbersPosition?: 'bottom-center' | 'bottom-right' | 'bottom-left';
  metadata?: { title?: string; author?: string; subject?: string };
  imageOrder?: number[];
  pageSize?: 'fit' | 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  language?: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowDocumentAssembly?: boolean;
  allowContentExtraction?: boolean;
  allowFormFilling?: boolean;
  allowEditing?: boolean;
  allowAnnotations?: boolean;
  allowDegradedPrinting?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  webp: [0x52, 0x49, 0x46, 0x46],
};

export function validateFile(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  acceptTypes: string[],
): void {
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 50 MB.');
  }

  if (acceptTypes.length > 0 && !acceptTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type. Expected: ${acceptTypes.join(', ')}`);
  }

  const bytes = new Uint8Array(buffer.slice(0, 8));
  let matched = false;
  for (const [, sig] of Object.entries(SIGNATURES)) {
    if (sig.every((b, i) => bytes[i] === b)) {
      matched = true;
      break;
    }
  }
  if (!matched && mimeType.startsWith('image/')) {
    const imgSig = mimeType === 'image/png' ? SIGNATURES.png
      : mimeType === 'image/jpeg' ? SIGNATURES.jpg
      : SIGNATURES.webp;
    if (!imgSig.every((b, i) => bytes[i] === b)) {
      throw new Error('File content does not match the declared type.');
    }
  }
  if (mimeType === 'application/pdf') {
    if (!SIGNATURES.pdf.every((b, i) => bytes[i] === b)) {
      throw new Error('Invalid or corrupted PDF file.');
    }
  }
}

async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch {
    throw new Error('Could not read this PDF. It may be corrupted or password-protected.');
  }
}

export async function mergePdf(files: ArrayBuffer[]): Promise<ProcessResult> {
  const merged = await PDFDocument.create();
  for (const fileBuffer of files) {
    const src = await loadPdf(fileBuffer);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const output = await merged.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'merged.pdf',
    outputBuffer: output,
    metadata: { pageCount: merged.getPageCount() },
  };
}

export async function splitPdf(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const totalPages = src.getPageCount();
  const ranges = parsePageRanges(options.pageRanges || '', totalPages);

  if (ranges.length === 0) {
    throw new Error('No valid page ranges specified.');
  }

  const outputFiles: ProcessResult['outputFiles'] = [];
  for (const range of ranges) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, range);
    pages.forEach((p) => doc.addPage(p));
    const out = await doc.save();
    const name = range.length === 1
      ? `page-${range[0] + 1}.pdf`
      : `pages-${range[0] + 1}-${range[range.length - 1] + 1}.pdf`;
    outputFiles.push({ name, buffer: out, mimeType: 'application/pdf' });
  }

  if (outputFiles.length === 1) {
    return {
      outputMimeType: 'application/pdf',
      outputFileName: outputFiles[0].name,
      outputBuffer: outputFiles[0].buffer,
      metadata: { extractedPages: ranges[0].map((p) => p + 1) },
    };
  }

  const zip = new JSZip();
  outputFiles.forEach((f) => zip.file(f.name, f.buffer));
  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  return {
    outputMimeType: 'application/zip',
    outputFileName: 'split-pages.zip',
    outputBuffer: zipBuffer,
    outputFiles,
    metadata: { extractedPages: ranges.flat().map((p) => p + 1) },
  };
}

export async function compressPdf(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const originalSize = buffer.byteLength;

  const level = options.quality || 'medium';
  const saveOptions = {
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick:
      level === 'low' ? 50 : level === 'medium' ? 200 : 500,
  };

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, src.getPageIndices());
  pages.forEach((p) => doc.addPage(p));

  const output = await doc.save(saveOptions);
  const newSize = output.byteLength;
  const savedPercent = Math.round(
    ((originalSize - newSize) / originalSize) * 100,
  );

  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'compressed.pdf',
    outputBuffer: output,
    metadata: {
      originalSize,
      newSize,
      savedPercent: Math.max(0, savedPercent),
      pageCount: doc.getPageCount(),
    },
  };
}

export async function rotatePdf(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const rotation = options.rotation || 90;
  const pages = src.getPages();
  pages.forEach((page) => {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotation) % 360));
  });
  const output = await src.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'rotated.pdf',
    outputBuffer: output,
    metadata: { pageCount: pages.length },
  };
}

export async function extractPages(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const totalPages = src.getPageCount();
  const pageIndices = parsePageList(options.pageRanges || '', totalPages);

  if (pageIndices.length === 0) {
    throw new Error('No valid pages specified.');
  }

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, pageIndices);
  pages.forEach((p) => doc.addPage(p));
  const output = await doc.save();

  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'extracted-pages.pdf',
    outputBuffer: output,
    metadata: {
      extractedPages: pageIndices.map((p) => p + 1),
      pageCount: doc.getPageCount(),
    },
  };
}

export async function deletePages(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const totalPages = src.getPageCount();
  const toDelete = new Set(parsePageList(options.pageRanges || '', totalPages));
  const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => !toDelete.has(i),
  );

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete all pages.');
  }

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, keepIndices);
  pages.forEach((p) => doc.addPage(p));
  const output = await doc.save();

  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'document.pdf',
    outputBuffer: output,
    metadata: {
      pageCount: doc.getPageCount(),
      extractedPages: keepIndices.map((p) => p + 1),
    },
  };
}

export async function addWatermark(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const font = await src.embedFont(StandardFonts.HelveticaBold);
  const text = options.watermarkText || 'CONFIDENTIAL';
  const opacity = options.watermarkOpacity ?? 0.3;

  const pages = src.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textSize = 50;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: textSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(45),
    });
  });

  const output = await src.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'watermarked.pdf',
    outputBuffer: output,
    metadata: { pageCount: pages.length },
  };
}

export async function addPageNumbers(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  const font = await src.embedFont(StandardFonts.Helvetica);
  const position = options.pageNumbersPosition || 'bottom-center';
  const pages = src.getPages();

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const text = String(i + 1);
    const textSize = 12;
    const textWidth = font.widthOfTextAtSize(text, textSize);

    let x = (width - textWidth) / 2;
    if (position === 'bottom-right') x = width - textWidth - 30;
    if (position === 'bottom-left') x = 30;

    page.drawText(text, {
      x,
      y: 20,
      size: textSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const output = await src.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'numbered.pdf',
    outputBuffer: output,
    metadata: { pageCount: pages.length },
  };
}

export async function editMetadata(
  buffer: ArrayBuffer,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  if (options.metadata) {
    if (options.metadata.title) src.setTitle(options.metadata.title);
    if (options.metadata.author) src.setAuthor(options.metadata.author);
    if (options.metadata.subject) src.setSubject(options.metadata.subject);
  }
  const output = await src.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'metadata-edited.pdf',
    outputBuffer: output,
    metadata: { pageCount: src.getPageCount() },
  };
}

export async function imagesToPdf(
  files: { buffer: ArrayBuffer; name: string; mimeType: string }[],
  options: ProcessOptions,
): Promise<ProcessResult> {
  if (files.length === 0) {
    throw new Error('No images provided.');
  }

  const doc = await PDFDocument.create();
  const order = options.imageOrder || files.map((_, i) => i);

  for (const idx of order) {
    const file = files[idx];
    if (!file) continue;
    let image;
    if (file.mimeType === 'image/png') {
      image = await doc.embedPng(file.buffer);
    } else if (file.mimeType === 'image/jpeg') {
      image = await doc.embedJpg(file.buffer);
    } else {
      continue;
    }
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const output = await doc.save();
  return {
    outputMimeType: 'application/pdf',
    outputFileName: 'images.pdf',
    outputBuffer: output,
    metadata: { pageCount: doc.getPageCount() },
  };
}

export async function getPdfInfo(buffer: ArrayBuffer): Promise<ProcessResult> {
  const src = await loadPdf(buffer);
  return {
    outputMimeType: 'application/json',
    outputFileName: 'info.json',
    outputBuffer: new TextEncoder().encode(
      JSON.stringify({
        pageCount: src.getPageCount(),
        title: src.getTitle(),
        author: src.getAuthor(),
        subject: src.getSubject(),
        creator: src.getCreator(),
        producer: src.getProducer(),
        creationDate: src.getCreationDate(),
        modificationDate: src.getModificationDate(),
      }),
    ).buffer,
    metadata: { pageCount: src.getPageCount() },
  };
}

function parsePageRanges(
  input: string,
  totalPages: number,
): number[][] {
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  const ranges: number[][] = [];
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (start > end || start < 1 || end > totalPages) {
        throw new Error(`Invalid range: ${part}. Document has ${totalPages} pages.`);
      }
      ranges.push(Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i));
    } else {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 1 || num > totalPages) {
        throw new Error(`Invalid page: ${part}. Document has ${totalPages} pages.`);
      }
      ranges.push([num - 1]);
    }
  }
  return ranges;
}

function parsePageList(input: string, totalPages: number): number[] {
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
  const indices: number[] = [];
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (start > end || start < 1 || end > totalPages) {
        throw new Error(`Invalid range: ${part}. Document has ${totalPages} pages.`);
      }
      for (let i = start; i <= end; i++) indices.push(i - 1);
    } else {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 1 || num > totalPages) {
        throw new Error(`Invalid page: ${part}. Document has ${totalPages} pages.`);
      }
      indices.push(num - 1);
    }
  }
  return Array.from(new Set(indices)).sort((a, b) => a - b);
}

export const SUPPORTED_TOOLS = new Set([
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'rotate-pdf',
  'extract-pages',
  'delete-pages',
  'watermark',
  'page-numbers',
  'edit-metadata',
  'images-to-pdf',
  'organize-pages',
  'document-viewer',
  'unlock-pdf',
]);

export const CLIENT_SIDE_TOOLS = new Set([
  'pdf-to-images',
  'pdf-to-excel',
  'create-pdf',
  'templates',
  'compare-documents',
  'redaction',
  'image-enhancer',
  'sign-pdf',
]);

export const AI_TOOLS = new Set([
  'summarize-pdf',
  'ask-document',
  'extract-info',
  'translate',
  'analyze-document',
  'ai-document-generator',
  'smart-search',
]);

export const CLOUDMERSIVE_TOOLS = new Set([
  'pdf-to-word',
  'pdf-to-ppt',
  'word-to-pdf',
  'ocr-pdf',
  'unlock-pdf',
  'protect-pdf',
  'permissions',
]);



export const UNSUPPORTED_TOOLS = new Set<string>([]);

export function isToolSupported(slug: string): boolean {
  return (
    SUPPORTED_TOOLS.has(slug) ||
    CLIENT_SIDE_TOOLS.has(slug) ||
    AI_TOOLS.has(slug) ||
    CLOUDMERSIVE_TOOLS.has(slug)
  );
}
