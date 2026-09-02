import { createClient } from '@supabase/supabase-js';
import { ProcessResult, validateFile } from './processors';
import { UnlockPdfError, unlockPdfLocal } from './pdf/unlock-pdf';

const CLOUDMERSIVE_BASE = 'https://api.cloudmersive.com';

let cachedApiKey: string | null | undefined;

async function getApiKey(): Promise<string> {
  if (cachedApiKey !== undefined) {
    if (cachedApiKey === null) {
      throw new CloudmersiveError(
        'Document processing service is not configured. Please add the CLOUDMERSIVE_API_KEY secret.',
        503,
      );
    }

    return cachedApiKey;
  }

  const envKey = process.env.CLOUDMERSIVE_API_KEY;

  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    const supabase = createClient(supabaseUrl, anonKey);

    const { data, error } = await supabase.rpc('get_app_secret', {
      secret_key: 'CLOUDMERSIVE_API_KEY',
    });

    if (!error && data) {
      cachedApiKey = data as string;
      return data as string;
    }
  }

  cachedApiKey = null;

  throw new CloudmersiveError(
    'Document processing service is not configured. Please add the CLOUDMERSIVE_API_KEY secret.',
    503,
  );
}

export class CloudmersiveError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'CloudmersiveError';
    this.statusCode = statusCode;
  }
}

function mapCloudmersiveError(
  status: number,
  errorBody?: string,
): CloudmersiveError {
  const detail = errorBody ? ` (API: ${errorBody.slice(0, 200)})` : '';

  switch (status) {
    case 400:
      return new CloudmersiveError(
        `The document could not be processed. It may be corrupted or in an unsupported format.${detail}`,
        400,
      );

    case 401:
    case 403:
      return new CloudmersiveError(
        `Document processing service authentication failed. Please contact the administrator.${detail}`,
        502,
      );

    case 404:
      return new CloudmersiveError(
        'The requested processing service is currently unavailable. Please try again later.',
        502,
      );

    case 413:
      return new CloudmersiveError(
        'The uploaded file is too large for this processing service.',
        413,
      );

    case 429:
      return new CloudmersiveError(
        'Cloud processing is temporarily limited. Please try again later.',
        429,
      );

    case 500:
    case 502:
    case 503:
      return new CloudmersiveError(
        `The document processing service is temporarily unavailable. Please try again.${detail}`,
        502,
      );

    default:
      return new CloudmersiveError(
        `An error occurred while processing your document. Please try again.${detail}`,
        502,
      );
  }
}

async function callCloudmersive(
  endpoint: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  acceptTypes: string[],
  extraFields?: Record<string, string>,
  extraHeaders?: Record<string, string>,
): Promise<ArrayBuffer> {
  validateFile(fileBuffer, fileName, mimeType, acceptTypes);

  const apiKey = await getApiKey();

  const formData = new FormData();
  const fileBytes = new Uint8Array(fileBuffer);

  const safeName =
    mimeType === 'application/pdf' && !/\.pdf$/i.test(fileName)
      ? `${fileName}.pdf`
      : fileName;

  const blob = new Blob([fileBytes], {
    type: mimeType || 'application/octet-stream',
  });

  formData.append('inputFile', blob, safeName);

  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }

  const headers: Record<string, string> = {
    Apikey: apiKey,
  };

  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers[key] = value;
    }
  }

  let response: Response;

  try {
    response = await fetch(`${CLOUDMERSIVE_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new CloudmersiveError(
      'Could not connect to the document processing service. Please check your connection and try again.',
      502,
    );
  }

  if (!response.ok) {
    let errorBody = '';

    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }

    console.error('[Cloudmersive] API error:', {
      status: response.status,
      endpoint,
      errorBody: errorBody.slice(0, 500),
    });

    throw mapCloudmersiveError(response.status, errorBody);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new CloudmersiveError(
      'The processing service returned an empty result. The file may be corrupted or unsupported.',
      502,
    );
  }

  return arrayBuffer;
}

function deriveOutputName(
  originalName: string,
  newExtension: string,
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}.${newExtension}`;
}

export async function convertPdfToWord(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ProcessResult> {
  const output = await callCloudmersive(
    '/convert/pdf/to/docx/rasterize',
    fileBuffer,
    fileName,
    mimeType,
    ['application/pdf'],
  );

  return {
    outputMimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    outputFileName: deriveOutputName(fileName, 'docx'),
    outputBuffer: output,
  };
}

export async function convertPdfToPowerPoint(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ProcessResult> {
  const output = await callCloudmersive(
    '/convert/pdf/to/pptx',
    fileBuffer,
    fileName,
    mimeType,
    ['application/pdf'],
  );

  return {
    outputMimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    outputFileName: deriveOutputName(fileName, 'pptx'),
    outputBuffer: output,
  };
}

export async function convertWordToPdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ProcessResult> {
  const isDocx =
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const endpoint = isDocx
    ? '/convert/docx/to/pdf'
    : '/convert/doc/to/pdf';

  const output = await callCloudmersive(
    endpoint,
    fileBuffer,
    fileName,
    mimeType,
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
  );

  return {
    outputMimeType: 'application/pdf',
    outputFileName: deriveOutputName(fileName, 'pdf'),
    outputBuffer: output,
  };
}

export async function ocrPdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  language: string,
): Promise<ProcessResult> {
  const apiKey = await getApiKey();

  validateFile(fileBuffer, fileName, mimeType, [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ]);

  const isPdf = mimeType === 'application/pdf';
  const endpoint = isPdf ? '/ocr/pdf/toText' : '/ocr/image/toText';

  const formData = new FormData();

  const blob = new Blob([fileBuffer], {
    type: mimeType,
  });

  formData.append('inputFile', blob, fileName);

  const url = new URL(`${CLOUDMERSIVE_BASE}${endpoint}`);

  if (language) {
    url.searchParams.set('language', language);
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Apikey: apiKey,
      },
      body: formData,
    });
  } catch {
    throw new CloudmersiveError(
      'Could not connect to the OCR processing service. Please check your connection and try again.',
      502,
    );
  }

  if (!response.ok) {
    let errorBody = '';

    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }

    console.error('[Cloudmersive OCR] API error:', {
      status: response.status,
      endpoint,
      errorBody: errorBody.slice(0, 500),
    });

    throw mapCloudmersiveError(response.status, errorBody);
  }

  const data = await response.json();
  const extractedText: string =
    data?.text || data?.ocrText || '';

  if (!extractedText) {
    throw new CloudmersiveError(
      'OCR processing completed but no text was found. The document may not contain recognizable text.',
      502,
    );
  }

  const textBuffer = new TextEncoder()
    .encode(extractedText)
    .buffer;

  return {
    outputMimeType: 'text/plain',
    outputFileName: deriveOutputName(fileName, 'txt'),
    outputBuffer: textBuffer,
    metadata: {
      pageCount: undefined,
    },
  };
}

export async function encryptPdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  password: string,
): Promise<ProcessResult> {
  if (!password) {
    throw new CloudmersiveError(
      'A password is required.',
      400,
    );
  }

  const output = await callCloudmersive(
    '/convert/edit/pdf/encrypt',
    fileBuffer,
    fileName,
    mimeType,
    ['application/pdf'],
    undefined,
    {
      ownerPassword: password,
      userPassword: password,
      encryptionKeyLength: '256',
    },
  );

  return {
    outputMimeType: 'application/pdf',
    outputFileName: deriveOutputName(
      fileName,
      'protected.pdf',
    ),
    outputBuffer: output,
  };
}

export async function decryptPdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  password: string,
): Promise<ProcessResult> {
  const pdfMime = mimeType || 'application/pdf';

  try {
    return await unlockPdfLocal(
      fileBuffer,
      fileName,
      password,
    );
  } catch (localErr) {
    const localMessage =
      localErr instanceof Error
        ? localErr.message
        : 'Could not unlock this PDF.';

    const needsPassword =
      localErr instanceof UnlockPdfError &&
      /enter the password/i.test(localErr.message);

    // Missing password is a user error — do not fall through to the API.
    if (needsPassword) {
      throw new CloudmersiveError(
        localMessage,
        400,
      );
    }

    try {
      const output = await callCloudmersive(
        '/convert/edit/pdf/decrypt',
        fileBuffer,
        fileName,
        pdfMime,
        ['application/pdf'],
        { password },
        { password },
      );

      return {
        outputMimeType: 'application/pdf',
        outputFileName: deriveOutputName(
          fileName,
          'unlocked.pdf',
        ),
        outputBuffer: output,
      };
    } catch (apiErr) {
      if (
        apiErr instanceof CloudmersiveError &&
        apiErr.statusCode === 503
      ) {
        throw new CloudmersiveError(
          localMessage,
          localErr instanceof UnlockPdfError
            ? localErr.statusCode
            : 400,
        );
      }

      if (
        apiErr instanceof CloudmersiveError &&
        apiErr.statusCode === 400
      ) {
        throw new CloudmersiveError(
          password
            ? 'Incorrect password, or this PDF could not be unlocked. Check the password and try again.'
            : localMessage,
          400,
        );
      }

      throw apiErr;
    }
  }
}

export interface PdfPermissions {
  allowPrinting: boolean;
  allowDocumentAssembly: boolean;
  allowContentExtraction: boolean;
  allowFormFilling: boolean;
  allowEditing: boolean;
  allowAnnotations: boolean;
  allowDegradedPrinting: boolean;
}

export async function setPdfPermissions(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  ownerPassword: string,
  permissions: Partial<PdfPermissions>,
): Promise<ProcessResult> {
  if (!ownerPassword) {
    throw new CloudmersiveError(
      'An owner password is required to set permissions.',
      400,
    );
  }

  const defaults: PdfPermissions = {
    allowPrinting: true,
    allowDocumentAssembly: true,
    allowContentExtraction: true,
    allowFormFilling: true,
    allowEditing: true,
    allowAnnotations: true,
    allowDegradedPrinting: true,
  };

  const merged = {
    ...defaults,
    ...permissions,
  };

  const output = await callCloudmersive(
    '/convert/edit/pdf/encrypt/set-permissions',
    fileBuffer,
    fileName,
    mimeType,
    ['application/pdf'],
    undefined,
    {
      ownerPassword,
      userPassword: '',
      encryptionKeyLength: '256',
      allowPrinting: String(merged.allowPrinting),
      allowDocumentAssembly: String(
        merged.allowDocumentAssembly,
      ),
      allowContentExtraction: String(
        merged.allowContentExtraction,
      ),
      allowFormFilling: String(
        merged.allowFormFilling,
      ),
      allowEditing: String(merged.allowEditing),
      allowAnnotations: String(
        merged.allowAnnotations,
      ),
      allowDegradedPrinting: String(
        merged.allowDegradedPrinting,
      ),
    },
  );

  return {
    outputMimeType: 'application/pdf',
    outputFileName: deriveOutputName(
      fileName,
      'permissions.pdf',
    ),
    outputBuffer: output,
  };
}

export const CLOUDMERSIVE_TOOLS = new Set([
  'pdf-to-word',
  'pdf-to-ppt',
  'word-to-pdf',
  'ocr-pdf',
  'unlock-pdf',
  'permissions',
]);