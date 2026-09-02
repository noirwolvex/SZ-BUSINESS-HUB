import { NextRequest, NextResponse } from 'next/server';
import {
  validateFile,
  mergePdf,
  splitPdf,
  compressPdf,
  rotatePdf,
  extractPages,
  deletePages,
  addWatermark,
  addPageNumbers,
  editMetadata,
  imagesToPdf,
  getPdfInfo,
  SUPPORTED_TOOLS,
  CLOUDMERSIVE_TOOLS,
  type ProcessOptions,
} from '@/lib/processors';
import {
  convertPdfToWord,
  convertPdfToPowerPoint,
  convertWordToPdf,
  ocrPdf,
  encryptPdf,
  decryptPdf,
  setPdfPermissions,
  CloudmersiveError,
} from '@/lib/cloudmersive';
import { UnlockPdfError } from '@/lib/pdf/unlock-pdf';
 
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const tool = formData.get('tool') as string;
    const optionsRaw = formData.get('options') as string | null;

    if (!tool || !SUPPORTED_TOOLS.has(tool)) {
      if (!tool || !CLOUDMERSIVE_TOOLS.has(tool)) {
        return NextResponse.json(
          { error: 'Unsupported or unknown tool.' },
          { status: 400 },
        );
      }
    }

    const options: ProcessOptions = optionsRaw
      ? JSON.parse(optionsRaw)
      : {};

    const files = formData.getAll('files');
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided.' },
        { status: 400 },
      );
    }

    const fileBuffers: { buffer: ArrayBuffer; name: string; mimeType: string }[] = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;
      const buffer = await file.arrayBuffer();
      const acceptTypes = getAcceptTypes(tool);
      const mimeType = resolveMimeType(file, acceptTypes);
      validateFile(buffer, file.name, mimeType, acceptTypes);
      fileBuffers.push({ buffer, name: file.name, mimeType });
    }

    if (fileBuffers.length === 0) {
      return NextResponse.json(
        { error: 'No valid files after validation.' },
        { status: 400 },
      );
    }

    let result;
    switch (tool) {
      case 'merge-pdf':
        result = await mergePdf(fileBuffers.map((f) => f.buffer));
        break;
      case 'split-pdf':
        result = await splitPdf(fileBuffers[0].buffer, options);
        break;
      case 'compress-pdf':
        result = await compressPdf(fileBuffers[0].buffer, options);
        break;
      case 'rotate-pdf':
        result = await rotatePdf(fileBuffers[0].buffer, options);
        break;
      case 'extract-pages':
        result = await extractPages(fileBuffers[0].buffer, options);
        break;
      case 'delete-pages':
        result = await deletePages(fileBuffers[0].buffer, options);
        break;
      case 'watermark':
        result = await addWatermark(fileBuffers[0].buffer, options);
        break;
      case 'page-numbers':
        result = await addPageNumbers(fileBuffers[0].buffer, options);
        break;
      case 'edit-metadata':
        result = await editMetadata(fileBuffers[0].buffer, options);
        break;
      case 'protect-pdf':
        result = await encryptPdf(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType, (options.password as string) || '');
        break;
      case 'images-to-pdf':
        result = await imagesToPdf(fileBuffers, options);
        break;
      case 'document-viewer':
      case 'organize-pages':
        result = await getPdfInfo(fileBuffers[0].buffer);
        break;
      case 'pdf-to-word':
        result = await convertPdfToWord(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType);
        break;
      case 'pdf-to-ppt':
        result = await convertPdfToPowerPoint(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType);
        break;
      case 'word-to-pdf':
        result = await convertWordToPdf(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType);
        break;
      case 'ocr-pdf':
        result = await ocrPdf(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType, (options.language as string) || 'ENG');
        break;
      case 'unlock-pdf':
        result = await decryptPdf(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType, (options.password as string) || '');
        break;
      case 'permissions':
        result = await setPdfPermissions(fileBuffers[0].buffer, fileBuffers[0].name, fileBuffers[0].mimeType, (options.ownerPassword as string) || '', {
          allowPrinting: options.allowPrinting !== false,
          allowDocumentAssembly: options.allowDocumentAssembly !== false,
          allowContentExtraction: options.allowContentExtraction !== false,
          allowFormFilling: options.allowFormFilling !== false,
          allowEditing: options.allowEditing !== false,
          allowAnnotations: options.allowAnnotations !== false,
          allowDegradedPrinting: options.allowDegradedPrinting !== false,
        });
        break;
      default:
        return NextResponse.json(
          { error: `Tool "${tool}" is not implemented.` },
          { status: 400 },
        );
    }

    const base64 = arrayBufferToBase64(result.outputBuffer);
    const outputFiles = result.outputFiles
      ? await Promise.all(
          result.outputFiles.map(async (f) => ({
            name: f.name,
            mimeType: f.mimeType,
            data: arrayBufferToBase64(f.buffer),
          })),
        )
      : undefined;

    return NextResponse.json({
      success: true,
      tool,
      outputMimeType: result.outputMimeType,
      outputFileName: result.outputFileName,
      outputData: base64,
      outputFiles,
      metadata: result.metadata,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed.';
    const status =
      err instanceof CloudmersiveError || err instanceof UnlockPdfError
        ? err.statusCode
        : 500;   
   return NextResponse.json({ error: message }, { status });
  }
}
 
function resolveMimeType(file: File, acceptTypes: string[]): string {
  if (file.type && (acceptTypes.length === 0 || acceptTypes.includes(file.type))) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (name.endsWith('.doc')) return 'application/msword';
  return file.type;
}

function getAcceptTypes(tool: string): string[] {
  if (tool === 'images-to-pdf') {
    return ['image/jpeg', 'image/png', 'image/webp'];
  }
  if (tool === 'ocr-pdf') {
    return ['application/pdf', 'image/jpeg', 'image/png'];
  }
  if (tool === 'word-to-pdf') {
    return [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
  }
  return ['application/pdf'];
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}
