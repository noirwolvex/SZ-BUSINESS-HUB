import { EncryptedPDFError, PDFDocument } from '@cantoo/pdf-lib';
import type { ProcessResult } from '../processors';
 
export class UnlockPdfError extends Error {
  statusCode: number;
 
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'UnlockPdfError';
    this.statusCode = statusCode;
  }
}
 
function deriveUnlockedName(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'document';
  return `${baseName}.unlocked.pdf`;
}
 
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
 
function isLikelyWrongPassword(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /password|decrypt|cipher|auth|encrypt/i.test(message);
}
 
async function loadUnlocked(
  bytes: Uint8Array,
  password?: string,
): Promise<PDFDocument> {
  return PDFDocument.load(bytes, {
    password,
    ignoreEncryption: false,
  });
}
 
/**
 * Remove password protection locally. Saving after a successful decrypt
 * writes a new PDF without the Encrypt dictionary.
 */
export async function unlockPdfLocal(
  fileBuffer: ArrayBuffer,
  fileName: string,
  password: string,
): Promise<ProcessResult> {
  const bytes = new Uint8Array(fileBuffer);
  const trimmed = password.trim();
 
  let doc: PDFDocument;
  try {
    if (trimmed) {
      doc = await loadUnlocked(bytes, trimmed);
    } else {
      try {
        // Unencrypted files, or owner-restricted files with an empty user password
        doc = await loadUnlocked(bytes, '');
      } catch (emptyPassErr) {
        if (
          emptyPassErr instanceof EncryptedPDFError ||
          isLikelyWrongPassword(emptyPassErr)
        ) {
          throw new UnlockPdfError(
            'This PDF is password-protected. Enter the password to unlock it.',
            400,
          );
        }
        throw emptyPassErr;
      }
    }
  } catch (err) {
    if (err instanceof UnlockPdfError) throw err;
 
    if (err instanceof EncryptedPDFError) {
      throw new UnlockPdfError(
        trimmed
          ? 'Incorrect password. Please check the password and try again.'
          : 'This PDF is password-protected. Enter the password to unlock it.',
        400,
      );
    }
 
    if (isLikelyWrongPassword(err)) {
      throw new UnlockPdfError(
        'Incorrect password or this PDF uses an encryption type that could not be unlocked locally.',
        400,
      );
    }
 
    throw new UnlockPdfError(
      'Could not read this PDF. It may be corrupted.',
      400,
    );
  }
 
  const output = await doc.save({ useObjectStreams: false });
 
  return {
    outputMimeType: 'application/pdf',
    outputFileName: deriveUnlockedName(fileName),
    outputBuffer: toArrayBuffer(output),
    metadata: { pageCount: doc.getPageCount() },
  };
}