import { PDFDocument } from 'pdf-lib';

export type SignatureSource = 'draw' | 'type' | 'upload';

export interface SignaturePlacement {
  pageIndex: number;
  /** Percentage from left edge of page (0-100) */
  xPercent: number;
  /** Percentage from top edge of page (0-100) */
  yPercent: number;
  /** Width as percentage of page width (8-60) */
  widthPercent: number;
}

export interface SignatureImage {
  dataUrl: string;
  width: number;
  height: number;
}

export async function applySignatures(
  pdfBuffer: ArrayBuffer,
  placements: SignaturePlacement[],
  signatureImage: SignatureImage,
): Promise<ArrayBuffer> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = srcDoc.getPages();

  const base64 = signatureImage.dataUrl.split(',')[1];
  const imageBytes = base64ToUint8Array(base64);
  const isPng = signatureImage.dataUrl.startsWith('data:image/png');
  const embedded = isPng
    ? await srcDoc.embedPng(imageBytes)
    : await srcDoc.embedJpg(imageBytes);

  const aspectRatio = embedded.width / embedded.height;

  for (const placement of placements) {
    const page = pages[placement.pageIndex];
    if (!page) continue;
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const w = pageWidth * (placement.widthPercent / 100);
    const h = w / aspectRatio;

    const x = pageWidth * (placement.xPercent / 100);
    // Convert top-based percentage to PDF's bottom-based coordinate
    const y = pageHeight * (1 - placement.yPercent / 100) - h;

    page.drawImage(embedded, { x, y, width: w, height: h });
  }

  return srcDoc.save();
}

export function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return canvas;

  const padding = 8;
  const trimX = Math.max(0, minX - padding);
  const trimY = Math.max(0, minY - padding);
  const trimW = Math.min(width - trimX, maxX - minX + 1 + padding * 2);
  const trimH = Math.min(height - trimY, maxY - minY + 1 + padding * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  const trimCtx = trimmed.getContext('2d');
  if (!trimCtx) return canvas;
  trimCtx.drawImage(canvas, trimX, trimY, trimW, trimH, 0, 0, trimW, trimH);
  return trimmed;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
