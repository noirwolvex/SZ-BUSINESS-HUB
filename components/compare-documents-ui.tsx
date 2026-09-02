'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2, GitCompare, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageComparison {
  pageIndex: number;
  hasDiff: boolean;
  diffPercent: number;
  diffRegions: { x: number; y: number; width: number; height: number }[];
  canvasA: string;
  canvasB: string;
  canvasDiff: string;
}

interface ComparisonResult {
  pages: PageComparison[];
  totalPagesA: number;
  totalPagesB: number;
  summary: {
    identicalPages: number;
    differentPages: number;
    onlyInA: number;
    onlyInB: number;
    avgDiffPercent: number;
  };
}

const RENDER_SCALE = 1.5;
const DIFF_THRESHOLD = 30;
const REGION_SIZE = 20;

export function CompareDocumentsUI() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [dragOverA, setDragOverA] = useState(false);
  const [dragOverB, setDragOverB] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const handleFileA = (file: File | null) => {
    if (file && (file.type === 'application/pdf' || file.name.match(/\.pdf$/i))) {
      setFileA(file);
      setResult(null);
    }
  };

  const handleFileB = (file: File | null) => {
    if (file && (file.type === 'application/pdf' || file.name.match(/\.pdf$/i))) {
      setFileB(file);
      setResult(null);
    }
  };

  const renderPdfToCanvases = async (file: File): Promise<HTMLCanvasElement[]> => {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const canvases: HTMLCanvasElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      canvases.push(canvas);
    }
    return canvases;
  };

  const compareCanvases = (
    canvasA: HTMLCanvasElement,
    canvasB: HTMLCanvasElement,
  ): { diffPercent: number; diffRegions: { x: number; y: number; width: number; height: number }[]; diffCanvas: HTMLCanvasElement } => {
    const width = Math.max(canvasA.width, canvasB.width);
    const height = Math.max(canvasA.height, canvasB.height);

    const canvasA2 = document.createElement('canvas');
    canvasA2.width = width;
    canvasA2.height = height;
    const ctxA2 = canvasA2.getContext('2d')!;
    ctxA2.fillStyle = '#ffffff';
    ctxA2.fillRect(0, 0, width, height);
    ctxA2.drawImage(canvasA, 0, 0);

    const canvasB2 = document.createElement('canvas');
    canvasB2.width = width;
    canvasB2.height = height;
    const ctxB2 = canvasB2.getContext('2d')!;
    ctxB2.fillStyle = '#ffffff';
    ctxB2.fillRect(0, 0, width, height);
    ctxB2.drawImage(canvasB, 0, 0);

    const dataA = ctxA2.getImageData(0, 0, width, height);
    const dataB = ctxB2.getImageData(0, 0, width, height);

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = width;
    diffCanvas.height = height;
    const diffCtx = diffCanvas.getContext('2d')!;
    const diffData = diffCtx.createImageData(width, height);

    const regionMap = new Map<string, number>();
    let totalDiffPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const rDiff = Math.abs(dataA.data[idx] - dataB.data[idx]);
        const gDiff = Math.abs(dataA.data[idx + 1] - dataB.data[idx + 1]);
        const bDiff = Math.abs(dataA.data[idx + 2] - dataB.data[idx + 2]);
        const pixelDiff = (rDiff + gDiff + bDiff) / 3;

        if (pixelDiff > DIFF_THRESHOLD) {
          totalDiffPixels++;
          diffData.data[idx] = 255;
          diffData.data[idx + 1] = 50;
          diffData.data[idx + 2] = 50;
          diffData.data[idx + 3] = 180;

          const rx = Math.floor(x / REGION_SIZE);
          const ry = Math.floor(y / REGION_SIZE);
          const key = `${rx},${ry}`;
          regionMap.set(key, (regionMap.get(key) || 0) + 1);
        } else {
          diffData.data[idx] = dataA.data[idx];
          diffData.data[idx + 1] = dataA.data[idx + 1];
          diffData.data[idx + 2] = dataA.data[idx + 2];
          diffData.data[idx + 3] = 255;
        }
      }
    }

    diffCtx.putImageData(diffData, 0, 0);

    const diffRegions: { x: number; y: number; width: number; height: number }[] = [];
    for (const key of Array.from(regionMap.keys())) {
      const count = regionMap.get(key)!;
      if (count > REGION_SIZE * 2) {
        const [rx, ry] = key.split(',').map(Number);
        diffRegions.push({
          x: rx * REGION_SIZE,
          y: ry * REGION_SIZE,
          width: REGION_SIZE,
          height: REGION_SIZE,
        });
      }
    }

    const totalPixels = width * height;
    const diffPercent = (totalDiffPixels / totalPixels) * 100;

    return { diffPercent, diffRegions, diffCanvas };
  };

  const compare = async () => {
    if (!fileA || !fileB || comparing) return;
    setComparing(true);
    setError(null);
    try {
      const canvasesA = await renderPdfToCanvases(fileA);
      const canvasesB = await renderPdfToCanvases(fileB);

      const maxPages = Math.max(canvasesA.length, canvasesB.length);
      const pages: PageComparison[] = [];

      for (let i = 0; i < maxPages; i++) {
        const cA = canvasesA[i];
        const cB = canvasesB[i];

        if (!cA && cB) {
          pages.push({
            pageIndex: i,
            hasDiff: true,
            diffPercent: 100,
            diffRegions: [],
            canvasA: '',
            canvasB: cB.toDataURL(),
            canvasDiff: cB.toDataURL(),
          });
          continue;
        }
        if (cA && !cB) {
          pages.push({
            pageIndex: i,
            hasDiff: true,
            diffPercent: 100,
            diffRegions: [],
            canvasA: cA.toDataURL(),
            canvasB: '',
            canvasDiff: cA.toDataURL(),
          });
          continue;
        }
        if (!cA || !cB) continue;

        const { diffPercent, diffRegions, diffCanvas } = compareCanvases(cA, cB);
        pages.push({
          pageIndex: i,
          hasDiff: diffPercent > 0.5,
          diffPercent,
          diffRegions,
          canvasA: cA.toDataURL(),
          canvasB: cB.toDataURL(),
          canvasDiff: diffCanvas.toDataURL(),
        });
      }

      const identicalPages = pages.filter((p) => !p.hasDiff).length;
      const differentPages = pages.filter((p) => p.hasDiff).length;
      const onlyInA = Math.max(0, canvasesA.length - canvasesB.length);
      const onlyInB = Math.max(0, canvasesB.length - canvasesA.length);
      const avgDiffPercent = pages.reduce((sum, p) => sum + p.diffPercent, 0) / pages.length;

      setResult({
        pages,
        totalPagesA: canvasesA.length,
        totalPagesB: canvasesB.length,
        summary: {
          identicalPages,
          differentPages,
          onlyInA,
          onlyInB,
          avgDiffPercent,
        },
      });
      setCurrentPageIdx(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare documents.');
    } finally {
      setComparing(false);
    }
  };

  // Result view
  if (result) {
    const page = result.pages[currentPageIdx];
    if (!page) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="font-display text-base font-semibold">Comparison Results</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-success/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Identical Pages</p>
              <p className="font-display text-lg font-bold text-success">{result.summary.identicalPages}</p>
            </div>
            <div className="rounded-lg bg-destructive/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Different Pages</p>
              <p className="font-display text-lg font-bold text-destructive">{result.summary.differentPages}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Only in A</p>
              <p className="font-display text-lg font-bold">{result.summary.onlyInA}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Only in B</p>
              <p className="font-display text-lg font-bold">{result.summary.onlyInB}</p>
            </div>
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            Document A: {result.totalPagesA} pages · Document B: {result.totalPagesB} pages · Average visual difference: {result.summary.avgDiffPercent.toFixed(1)}%
          </div>
        </div>

        {/* Page navigation */}
        {result.pages.length > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPageIdx((p) => Math.max(0, p - 1))}
              disabled={currentPageIdx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm font-medium">
              Page {currentPageIdx + 1} of {result.pages.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPageIdx((p) => Math.min(result.pages.length - 1, p + 1))}
              disabled={currentPageIdx === result.pages.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Page comparison */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Page {currentPageIdx + 1}</span>
            {page.hasDiff ? (
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                {page.diffPercent.toFixed(1)}% visual difference
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3 w-3" />
                Pages match
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Document A</p>
              {page.canvasA ? (
                <img src={page.canvasA} alt="Page A" className="w-full rounded-lg border border-border/60" />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  No page in A
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Document B</p>
              {page.canvasB ? (
                <img src={page.canvasB} alt="Page B" className="w-full rounded-lg border border-border/60" />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  No page in B
                </div>
              )}
            </div>
          </div>

          {page.hasDiff && page.canvasA && page.canvasB && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Visual difference overlay (red = changed pixels)
              </p>
              <img src={page.canvasDiff} alt="Diff overlay" className="w-full rounded-lg border border-border/60" />
            </div>
          )}
        </div>

        <Button
          onClick={() => { setResult(null); setFileA(null); setFileB(null); }}
          variant="outline"
          className="w-full"
        >
          Compare New Documents
        </Button>
      </div>
    );
  }

  // Upload view
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Document A */}
        <FileDropZone
          label="Document A"
          file={fileA}
          dragOver={dragOverA}
          onDragOver={(e) => { e.preventDefault(); setDragOverA(true); }}
          onDragLeave={() => setDragOverA(false)}
          onDrop={(e) => { e.preventDefault(); setDragOverA(false); handleFileA(e.dataTransfer.files?.[0] || null); }}
          onClick={() => inputARef.current?.click()}
          inputRef={inputARef}
          onFileSelect={(f) => handleFileA(f)}
          onRemove={() => setFileA(null)}
        />

        {/* Document B */}
        <FileDropZone
          label="Document B"
          file={fileB}
          dragOver={dragOverB}
          onDragOver={(e) => { e.preventDefault(); setDragOverB(true); }}
          onDragLeave={() => setDragOverB(false)}
          onDrop={(e) => { e.preventDefault(); setDragOverB(false); handleFileB(e.dataTransfer.files?.[0] || null); }}
          onClick={() => inputBRef.current?.click()}
          inputRef={inputBRef}
          onFileSelect={(f) => handleFileB(f)}
          onRemove={() => setFileB(null)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">
          The comparison renders both PDFs page-by-page and performs a visual pixel-level diff.
          Differences are highlighted in red on an overlay image. This is a visual comparison — it does not
          detect text-level changes.
        </p>
      </div>

      <Button
        onClick={compare}
        disabled={!fileA || !fileB || comparing}
        size="lg"
        className="w-full"
      >
        {comparing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Comparing documents…
          </>
        ) : (
          <>
            <GitCompare className="mr-2 h-4 w-4" />
            Compare Documents
          </>
        )}
      </Button>
    </div>
  );
}

interface FileDropZoneProps {
  label: string;
  file: File | null;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function FileDropZone({
  label,
  file,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  onFileSelect,
  onRemove,
}: FileDropZoneProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Drop PDF here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ''; }}
        className="hidden"
      />
    </div>
  );
}
