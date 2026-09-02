'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Sparkles, Wand2, Search, Loader2, Download, FileText, X, Upload } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUploader, type OptionConfig } from '@/components/file-uploader';
import { CreatePdfEditor } from '@/components/create-pdf-editor';
import { TemplatesUI } from '@/components/templates-ui';
import { CompareDocumentsUI } from '@/components/compare-documents-ui';
import { RedactionUI } from '@/components/redaction-ui';
import { SignPdfUI } from '@/components/sign-pdf/sign-pdf';
import { ImageEditor } from '@/components/image-editor/image-editor';
import { getToolBySlug, type Tool } from '@/lib/tools';
import { SUPPORTED_TOOLS, CLIENT_SIDE_TOOLS, AI_TOOLS, UNSUPPORTED_TOOLS, CLOUDMERSIVE_TOOLS } from '@/lib/processors';
import { cn } from '@/lib/utils';

interface ProcessResponse {
  success: boolean;
  error?: string;
  outputFileName?: string;
  outputMimeType?: string;
  outputData?: string;
  outputFiles?: { name: string; mimeType: string; data: string }[];
  metadata?: {
    originalSize?: number;
    newSize?: number;
    savedPercent?: number;
    pageCount?: number;
    extractedPages?: number[];
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ToolDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const Icon = tool.icon;

  const isSupported = SUPPORTED_TOOLS.has(slug) || CLOUDMERSIVE_TOOLS.has(slug);
  const isClientSide = CLIENT_SIDE_TOOLS.has(slug);
  const isAITool = AI_TOOLS.has(slug);
  const isUnsupported = UNSUPPORTED_TOOLS.has(slug);
  const processingRef = useRef(false);

  const isGenerator = slug === 'ai-document-generator';
  const isSmartSearch = slug === 'smart-search';
  const isCreatePdf = slug === 'create-pdf';
  const isTemplates = slug === 'templates';
  const isCompare = slug === 'compare-documents';
  const isRedaction = slug === 'redaction';
  const isImageEditor = slug === 'image-enhancer';
  const isSignPdf = slug === 'sign-pdf';

  const handleProcess = useCallback(
    async (files: File[], options?: Record<string, unknown>): Promise<ProcessResponse> => {
      if (processingRef.current) {
        return { success: false, error: 'A request is already in progress. Please wait for it to finish.' };
      }
      processingRef.current = true;
      try {
        if (isClientSide) {
          return processClientSide(tool, files, options);
        }
        if (isAITool) {
          return processAITool(slug, files, options);
        }
        const formData = new FormData();
        formData.append('tool', slug);
        if (options) formData.append('options', JSON.stringify(options));
        for (const file of files) {
          formData.append('files', file);
        }
        const res = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });
        return res.json();
      } finally {
        processingRef.current = false;
      }
    },
    [slug, isClientSide, isAITool, tool],
  );

  return (
    <AppShell>
      <RequireAuth>
      <div className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:px-8", isTemplates || isImageEditor ? "max-w-7xl" : "max-w-3xl")}>
        <Link
          href="/tools"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All Tools
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {tool.name}
              </h1>
              {tool.badge && (
                <Badge
                  variant="secondary"
                  className={
                    tool.badge === 'ai'
                      ? 'bg-primary/10 text-primary'
                      : tool.badge === 'new'
                        ? 'bg-success/10 text-success'
                        : tool.badge === 'beta'
                          ? 'bg-chart-4/10 text-chart-4'
                          : ''
                  }
                >
                  {tool.badge}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{tool.description}</p>
          </div>
        </div>

        {isUnsupported ? (
          <UnsupportedNotice tool={tool} />
        ) : isImageEditor ? (
          <ImageEditor />
        ) : isCreatePdf ? (
          <CreatePdfEditor />
        ) : isTemplates ? (
          <TemplatesUI />
        ) : isCompare ? (
          <CompareDocumentsUI />
        ) : isRedaction ? (
          <RedactionUI />
        ) : isSignPdf ? (
          <SignPdfUI />
        ) : isGenerator ? (
          <DocumentGeneratorUI />
        ) : isSmartSearch ? (
          <SmartSearchUI />
        ) : (
          <FileUploader
            tool={tool}
            onProcess={handleProcess}
            optionsConfig={getOptionsConfig(slug)}
          />
        )}
      </div>
      </RequireAuth>
    </AppShell>
  );
}

function UnsupportedNotice({ tool }: { tool: Tool }) {
  const isAI = tool.badge === 'ai';
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        {isAI ? (
          <Sparkles className="h-8 w-8 text-warning" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-warning" />
        )}
      </div>
      <p className="font-display text-lg font-semibold">
        {isAI ? 'AI Processing Required' : 'Advanced Processing Required'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {isAI
          ? 'This tool requires an AI service to function. Connect an LLM API through a server-side edge function to enable real document intelligence.'
          : 'This tool requires native binaries (LibreOffice, Tesseract, or similar) that are not available in the current deployment environment.'}
      </p>
      <Button className="mt-6" variant="outline" asChild>
        <Link href="/tools">Browse other tools</Link>
      </Button>
    </div>
  );
}

function DocumentGeneratorUI() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const examples = [
    'Write a professional invoice template for a freelance web designer',
    'Create a non-disclosure agreement (NDA) for a software consultant',
    'Draft a cover letter for a senior frontend developer position',
    'Write a project proposal for a mobile app development project',
  ];

  const generate = async () => {
    if (!prompt.trim() || status === 'processing') return;
    setStatus('processing');
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'generate', prompt }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed.');
      }
      setResult(data.response);
      setStatus('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
      setStatus('failed');
    }
  };

  const download = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'completed' && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-success" />
            <span className="font-display text-lg font-semibold">Document Generated</span>
          </div>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-card p-4 text-sm leading-relaxed">
            {result}
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={download} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => { setStatus('idle'); setResult(''); setPrompt(''); }}
            variant="outline"
            className="flex-1"
          >
            Generate Another
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'failed' && error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-display text-lg font-semibold">Generation failed</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => setStatus('idle')} variant="outline" className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <label className="mb-2 block text-sm font-semibold">What document do you need?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the document you want to generate..."
          rows={5}
          className="w-full resize-none rounded-xl border border-border/60 bg-background p-3 text-sm outline-none focus:border-primary/40"
        />
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {ex.length > 50 ? ex.slice(0, 50) + '...' : ex}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button
        onClick={generate}
        disabled={!prompt.trim() || status === 'processing'}
        size="lg"
        className="w-full"
      >
        {status === 'processing' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Document
          </>
        )}
      </Button>
    </div>
  );
}

function SmartSearchUI() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter((f) => f.type === 'application/pdf' || f.name.match(/\.pdf$/i));
    setFiles((prev) => [...prev, ...pdfs].slice(0, 20));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const search = async () => {
    if (files.length === 0 || !query.trim() || status === 'processing') return;
    setStatus('processing');
    setError(null);
    try {
      const documents: { name: string; text: string }[] = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractPdfTextForAI(arrayBuffer);
        documents.push({ name: file.name, text: text || '(No extractable text)' });
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'search', prompt: query, documents }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Search failed.');
      }
      setResult(data.response);
      setStatus('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
      setStatus('failed');
    }
  };

  if (status === 'completed' && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-success" />
            <span className="font-display text-lg font-semibold">Search Results</span>
          </div>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-card p-4 text-sm leading-relaxed">
            {result}
          </div>
        </div>
        <Button
          onClick={() => { setStatus('idle'); setResult(''); setQuery(''); }}
          variant="outline"
          className="w-full"
        >
          Search Again
        </Button>
      </div>
    );
  }

  if (status === 'failed' && error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-display text-lg font-semibold">Search failed</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => setStatus('idle')} variant="outline" className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="font-display text-lg font-semibold">Drop PDF documents here</p>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse — PDF</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Upload className="h-4 w-4" />
            Add more files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <label className="mb-2 block text-sm font-semibold">What are you looking for?</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="e.g. Find all mentions of payment terms"
          className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
        />
      </div>

      <Button
        onClick={search}
        disabled={files.length === 0 || !query.trim() || status === 'processing'}
        size="lg"
        className="w-full"
      >
        {status === 'processing' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching…
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Search Documents
          </>
        )}
      </Button>
    </div>
  );
}

function getOptionsConfig(slug: string): OptionConfig[] {
  switch (slug) {
    case 'compress-pdf':
      return [
        {
          key: 'quality',
          label: 'Compression Level',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { value: 'low', label: 'Strong compression (smallest file)' },
            { value: 'medium', label: 'Balanced (recommended)' },
            { value: 'high', label: 'High quality (larger file)' },
          ],
        },
      ];
    case 'rotate-pdf':
      return [
        {
          key: 'rotation',
          label: 'Rotation',
          type: 'select',
          defaultValue: '90',
          options: [
            { value: '90', label: '90° (clockwise)' },
            { value: '180', label: '180°' },
            { value: '270', label: '270° (counter-clockwise)' },
          ],
        },
      ];
    case 'split-pdf':
      return [
        {
          key: 'pageRanges',
          label: 'Page Ranges',
          type: 'pageRanges',
          placeholder: 'e.g. 1-3, 5, 7-10',
          defaultValue: '1',
        },
      ];
    case 'extract-pages':
      return [
        {
          key: 'pageRanges',
          label: 'Pages to Extract',
          type: 'pageRanges',
          placeholder: 'e.g. 2, 4, 7-10',
          defaultValue: '1',
        },
      ];
    case 'delete-pages':
      return [
        {
          key: 'pageRanges',
          label: 'Pages to Delete',
          type: 'pageRanges',
          placeholder: 'e.g. 3, 5, 8-12',
          defaultValue: '1',
        },
      ];
    case 'watermark':
      return [
        {
          key: 'watermarkText',
          label: 'Watermark Text',
          type: 'text',
          placeholder: 'CONFIDENTIAL',
          defaultValue: 'CONFIDENTIAL',
        },
        {
          key: 'watermarkOpacity',
          label: 'Opacity',
          type: 'select',
          defaultValue: '0.3',
          options: [
            { value: '0.15', label: 'Very light' },
            { value: '0.3', label: 'Light' },
            { value: '0.5', label: 'Medium' },
            { value: '0.7', label: 'Strong' },
          ],
        },
      ];
    case 'page-numbers':
      return [
        {
          key: 'pageNumbersPosition',
          label: 'Position',
          type: 'select',
          defaultValue: 'bottom-center',
          options: [
            { value: 'bottom-center', label: 'Bottom center' },
            { value: 'bottom-right', label: 'Bottom right' },
            { value: 'bottom-left', label: 'Bottom left' },
          ],
        },
      ];
    case 'protect-pdf':
      return [
        {
          key: 'password',
          label: 'Password',
          type: 'password',
          placeholder: 'Enter a password',
        },
      ];
    case 'edit-metadata':
      return [
        {
          key: 'metadata',
          label: 'Metadata (JSON)',
          type: 'text',
          placeholder: '{"title":"My Document","author":"John"}',
        },
      ];
    case 'pdf-to-images':
      return [
        {
          key: 'format',
          label: 'Image Format',
          type: 'select',
          defaultValue: 'png',
          options: [
            { value: 'png', label: 'PNG (lossless)' },
            { value: 'jpg', label: 'JPG (smaller)' },
          ],
        },
      ];
    case 'translate':
      return [
        {
          key: 'prompt',
          label: 'Target Language',
          type: 'select',
          defaultValue: 'Translate this document into English.',
          options: [
            { value: 'Translate this document into English.', label: 'English' },
            { value: 'Translate this document into Arabic.', label: 'Arabic' },
            { value: 'Translate this document into Spanish.', label: 'Spanish' },
            { value: 'Translate this document into French.', label: 'French' },
            { value: 'Translate this document into German.', label: 'German' },
            { value: 'Translate this document into Hindi.', label: 'Hindi' },
            { value: 'Translate this document into Chinese.', label: 'Chinese' },
          ],
        },
      ];
    case 'ocr-pdf':
      return [
        {
          key: 'language',
          label: 'Document Language',
          type: 'select',
          defaultValue: 'ENG',
          options: [
            { value: 'ENG', label: 'English' },
            { value: 'ARA', label: 'Arabic' },
            { value: 'FRE', label: 'French' },
            { value: 'SPA', label: 'Spanish' },
            { value: 'GER', label: 'German' },
            { value: 'CHI_SIM', label: 'Chinese (Simplified)' },
            { value: 'HIN', label: 'Hindi' },
            { value: 'RUS', label: 'Russian' },
          ],
        },
      ];
    case 'unlock-pdf':
      return [
        {
          key: 'password',
          label: 'PDF Password',
          type: 'password',
          placeholder: 'Enter the password to remove',
        },
      ];
    case 'permissions':
      return [
        {
          key: 'ownerPassword',
          label: 'Owner Password',
          type: 'text',
          placeholder: 'Set a password to control permissions',
        },
      ];
    default:
      return [];
  }
}

async function processClientSide(
  tool: Tool,
  files: File[],
  options?: Record<string, unknown>,
): Promise<ProcessResponse> {
  if (tool.slug === 'pdf-to-excel') {
    return processPdfToExcel(files);
  }
  if (tool.slug !== 'pdf-to-images') {
    return { success: false, error: 'This tool is not available.' };
  }

  const format = (options?.format as 'png' | 'jpg') || 'png';
  const file = files[0];
  if (!file) return { success: false, error: 'No file provided.' };

  const arrayBuffer = await file.arrayBuffer();

  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const outputFiles: { name: string; mimeType: string; data: string }[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, 0.9);
    const base64 = dataUrl.split(',')[1];

    outputFiles.push({
      name: `page-${i}.${format}`,
      mimeType,
      data: base64,
    });
  }

  return {
    success: true,
    outputFileName: 'pages.zip',
    outputMimeType: 'application/zip',
    outputData: '',
    outputFiles,
    metadata: { pageCount: numPages },
  };
}

async function processPdfToExcel(files: File[]): Promise<ProcessResponse> {
  const file = files[0];
  if (!file) return { success: false, error: 'No file provided.' };

  const arrayBuffer = await file.arrayBuffer();

  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const rows = extractRowsFromTextContent(content);
    const sheetData =
      rows.length > 0 ? rows : [['(No extractable text on this page)']];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = `Page ${i}`.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const xlsxBuffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer;

  const base64 = bufferToBase64(xlsxBuffer);

  return {
    success: true,
    outputFileName: file.name.replace(/\.pdf$/i, '') + '.xlsx',
    outputMimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    outputData: base64,
    metadata: { pageCount: numPages },
  };
}

function extractRowsFromTextContent(
  content: { items: Array<{ str?: string; transform?: number[] }> },
): string[][] {
  const items = content.items.filter((item) => item.str && item.str.trim());
  if (items.length === 0) return [];

  const rowMap = new Map<number, Array<{ x: number; text: string }>>();

  for (const item of items) {
    const y = item.transform ? Math.round(item.transform[5]) : 0;
    const x = item.transform ? item.transform[4] : 0;
    const rowKey = Math.round(y / 3) * 3;
    if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
    rowMap.get(rowKey)!.push({ x, text: item.str!.trim() });
  }

  const sortedKeys = Array.from(rowMap.keys()).sort((a, b) => b - a);
  const rows: string[][] = [];

  for (const key of sortedKeys) {
    const cells = rowMap.get(key)!.sort((a, b) => a.x - b.x);
    const row: string[] = [];
    for (const cell of cells) {
      if (row.length > 0) {
        const last = row[row.length - 1];
        const lastCell = cells[row.length - 1];
        if (cell.x - lastCell.x < 20) {
          row[row.length - 1] = last + ' ' + cell.text;
          continue;
        }
      }
      row.push(cell.text);
    }
    rows.push(row);
  }

  return rows;
}

const AI_ACTION_MAP: Record<string, 'summarize' | 'chat' | 'extract' | 'translate' | 'analyze'> = {
  'summarize-pdf': 'summarize',
  'ask-document': 'chat',
  'extract-info': 'extract',
  'translate': 'translate',
  'analyze-document': 'analyze',
};

const AI_DEFAULT_PROMPT: Record<string, string> = {
  'summarize-pdf': 'Provide a comprehensive summary of this document with key points.',
  'ask-document': 'What are the key takeaways from this document?',
  'extract-info': 'Extract all important information: names, dates, amounts, addresses, emails, and phone numbers.',
  'translate': 'Translate this document into English.',
  'analyze-document': 'Analyze this document for any risks, unusual clauses, or problematic language.',
};

async function processAITool(
  slug: string,
  files: File[],
  options?: Record<string, unknown>,
): Promise<ProcessResponse> {
  const file = files[0];
  if (!file) return { success: false, error: 'No file provided.' };

  const action = AI_ACTION_MAP[slug] || 'chat';
  const customPrompt = (options?.prompt as string) || AI_DEFAULT_PROMPT[slug] || 'Analyze this document.';

  let documentText = '';
  let documentBase64: string | undefined;
  let documentMimeType: string | undefined;

  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    documentText = await extractPdfTextForAI(arrayBuffer);
    if (!documentText) {
      documentBase64 = bufferToBase64(arrayBuffer);
      documentMimeType = 'application/pdf';
    }
  } else if (file.type.startsWith('text/')) {
    documentText = await file.text();
  } else {
    const arrayBuffer = await file.arrayBuffer();
    documentBase64 = bufferToBase64(arrayBuffer);
    documentMimeType = file.type;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action,
        prompt: customPrompt,
        documentText: documentText || undefined,
        documentBase64,
        documentMimeType,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || `AI request failed (${response.status}).` };
    }

    const textContent = data.response as string;
    const base64 = btoa(unescape(encodeURIComponent(textContent)));

    return {
      success: true,
      outputFileName: `${slug}-result.txt`,
      outputMimeType: 'text/plain',
      outputData: base64,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'AI processing failed.',
    };
  }
}

async function extractPdfTextForAI(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjs.getDocument({ data: buffer.slice(0) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => item.str || '')
        .join(' ');
      textParts.push(`--- Page ${i} ---\n${pageText}`);
    }

    return textParts.join('\n\n');
  } catch {
    return '';
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
