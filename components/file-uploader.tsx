'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Download,
  RefreshCw,
  CheckCircle2,
  Files,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { Tool } from '@/lib/tools';

type ProcessStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface OutputFile {
  name: string;
  mimeType: string;
  data: string;
  url?: string;
}

interface ProcessResponse {
  success: boolean;
  error?: string;
  outputFileName?: string;
  outputMimeType?: string;
  outputData?: string;
  outputFiles?: OutputFile[];
  metadata?: {
    originalSize?: number;
    newSize?: number;
    savedPercent?: number;
    pageCount?: number;
    extractedPages?: number[];
  };
}

interface FileUploaderProps {
  tool: Tool;
  onProcess: (files: File[], options?: Record<string, unknown>) => Promise<ProcessResponse>;
  optionsConfig?: OptionConfig[];
}

export interface OptionConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'pageRanges' | 'password';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}

export function FileUploader({ tool, onProcess, optionsConfig }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [options, setOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    optionsConfig?.forEach((opt) => {
      if (opt.defaultValue) defaults[opt.key] = opt.defaultValue;
    });
    return defaults;
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const accept = tool.acceptTypes.join(',');
  const maxFiles = tool.multiple ? 20 : 1;

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const arr = Array.from(incoming);
      const valid = arr.filter((f) => {
        if (tool.acceptTypes.length === 0) return true;
        return tool.acceptTypes.some((t) => f.type === t || f.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i));
      });
      if (valid.length === 0) {
        toast({ title: 'Invalid file type', description: `Expected: ${tool.acceptTypes.join(', ')}`, variant: 'destructive' });
        return;
      }
      if (!tool.multiple) {
        setFiles([valid[0]]);
      } else {
        setFiles((prev) => [...prev, ...valid].slice(0, maxFiles));
      }
      setStatus('idle');
      setError(null);
      setResult(null);
    },
    [tool, maxFiles, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const process = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setError(null);
    try {
      const opts: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(options)) {
        if (key === 'rotation') opts.rotation = parseInt(value, 10) as 90 | 180 | 270;
        else if (key === 'quality') opts.quality = value as 'low' | 'medium' | 'high';
        else if (key === 'watermarkOpacity') opts.watermarkOpacity = parseFloat(value);
        else if (key === 'pageNumbersPosition') opts.pageNumbersPosition = value as 'bottom-center' | 'bottom-right' | 'bottom-left';
        else if (key === 'pageSize') opts.pageSize = value as 'fit' | 'a4' | 'letter';
        else if (key === 'orientation') opts.orientation = value as 'portrait' | 'landscape';
        else if (key === 'format') opts.format = value as 'png' | 'jpg';
        else if (key === 'metadata') {
          try { opts.metadata = JSON.parse(value); } catch { /* ignore */ }
        } else {
          opts[key] = value;
        }
      }
      const res = await onProcess(files, opts);
      if (res.success) {
        setResult(res);
        setStatus('completed');
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const outputSize = res.outputFiles?.reduce((sum, f) => sum + (f.data.length * 0.75), 0) || 0;
        const firstName = files[0]?.name || 'document';
        const outputName = res.outputFiles?.[0]?.name || firstName;
        await supabase.from('file_records').insert({
          file_name: firstName,
          tool_slug: tool.slug,
          tool_name: tool.name,
          status: 'completed',
          file_size: totalSize,
          output_size: Math.round(outputSize),
          output_name: outputName,
          metadata: res.metadata || {},
        });
      } else {
        setError(res.error || 'Processing failed.');
        setStatus('failed');
        await supabase.from('file_records').insert({
          file_name: files[0]?.name || 'document',
          tool_slug: tool.slug,
          tool_name: tool.name,
          status: 'failed',
          file_size: files[0]?.size || 0,
          metadata: {},
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed.');
      setStatus('failed');
    }
  };

  const retry = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  const downloadFile = (data: string, name: string, mimeType: string) => {
    const byteChars = atob(data);
    const byteArrays: Uint8Array[] = [];
    const chunkSize = 0x8000;
    for (let i = 0; i < byteChars.length; i += chunkSize) {
      const chunk = byteChars.slice(i, i + chunkSize);
      const byteArr = new Uint8Array(chunk.length);
      for (let j = 0; j < chunk.length; j++) byteArr[j] = chunk.charCodeAt(j);
      byteArrays.push(byteArr);
    }
    const blob = new Blob(byteArrays, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllZip = async () => {
    if (!result?.outputFiles) return;
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const f of result.outputFiles) {
      zip.file(f.name, atob(f.data), { binary: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sztools-results.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Completed state ──
  if (status === 'completed' && result) {
    return (
      <CompletedView
        result={result}
        formatBytes={formatBytes}
        onDownload={downloadFile}
        onDownloadAll={downloadAllZip}
        onReset={retry}
      />
    );
  }

  // ── Failed state ──
  if (status === 'failed' && error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-display text-lg font-semibold">Processing failed</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={retry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Upload / Processing state ──
  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {files.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="font-display text-lg font-semibold">
            Drop {tool.multiple ? 'files' : 'a file'} here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse — {tool.acceptTypes.map((t) => t.split('/')[1]?.toUpperCase()).filter(Boolean).join(', ')}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Max 50 MB per file</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={tool.multiple}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* File list */}
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                {tool.multiple && files.length > 1 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveFile(i, -1)}
                      disabled={i === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveFile(i, 1)}
                      disabled={i === files.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add more files (multiple mode) */}
          {tool.multiple && files.length < maxFiles && (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              Add more files
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={tool.multiple}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {/* Options */}
          {optionsConfig && optionsConfig.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="mb-3 text-sm font-semibold">Options</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {optionsConfig.map((opt) => (
                  <div key={opt.key}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {opt.label}
                    </label>
                    {opt.type === 'select' ? (
                      <select
                        value={options[opt.key] || ''}
                        onChange={(e) => setOptions((p) => ({ ...p, [opt.key]: e.target.value }))}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
                      >
                        {opt.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : opt.type === 'pageRanges' ? (
                      <input
                        type="text"
                        value={options[opt.key] || ''}
                        onChange={(e) => setOptions((p) => ({ ...p, [opt.key]: e.target.value }))}
                        placeholder={opt.placeholder || 'e.g. 1-3, 5, 7-10'}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
                      />
                    ) : (
                      <input
                        type={opt.type === 'password' ? 'password' : 'text'}
                        value={options[opt.key] || ''}
                        onChange={(e) => setOptions((p) => ({ ...p, [opt.key]: e.target.value }))}
                        placeholder={opt.placeholder}
                        autoComplete={opt.type === 'password' ? 'off' : undefined}
                        className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process button */}
          <Button
            onClick={process}
            disabled={status === 'processing'}
            className="w-full"
            size="lg"
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Process {files.length > 1 ? `${files.length} files` : 'file'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function CompletedView({
  result,
  formatBytes,
  onDownload,
  onDownloadAll,
  onReset,
}: {
  result: ProcessResponse;
  formatBytes: (n: number) => string;
  onDownload: (data: string, name: string, mime: string) => void;
  onDownloadAll: () => void;
  onReset: () => void;
}) {
  const hasMultiple = result.outputFiles && result.outputFiles.length > 1;
  const meta = result.metadata;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <p className="font-display text-lg font-semibold">Your file is ready</p>
        {meta?.pageCount && (
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.pageCount} pages
            {meta.extractedPages ? ` (pages: ${meta.extractedPages.join(', ')})` : ''}
          </p>
        )}
      </div>

      {/* Compression stats */}
      {meta?.originalSize && meta?.newSize && (
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-card p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="font-display text-lg font-bold">{formatBytes(meta.originalSize)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Compressed</p>
            <p className="font-display text-lg font-bold">{formatBytes(meta.newSize)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="font-display text-lg font-bold text-success">
              {meta.savedPercent}%
            </p>
          </div>
        </div>
      )}

      {/* Single file download */}
      {!hasMultiple && result.outputData && (
        <Button
          onClick={() => onDownload(result.outputData!, result.outputFileName!, result.outputMimeType!)}
          className="w-full"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          Download {result.outputFileName}
        </Button>
      )}

      {/* Multiple files download */}
      {hasMultiple && (
        <div className="space-y-3">
          <div className="space-y-2">
            {result.outputFiles!.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {f.mimeType === 'application/zip' ? (
                    <Archive className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.mimeType}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(f.data, f.name, f.mimeType)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={onDownloadAll} className="w-full" size="lg">
            <Files className="mr-2 h-4 w-4" />
            Download All as ZIP
          </Button>
        </div>
      )}

      <Button onClick={onReset} variant="outline" className="w-full">
        <RefreshCw className="mr-2 h-4 w-4" />
        Process Another File
      </Button>
    </div>
  );
}
