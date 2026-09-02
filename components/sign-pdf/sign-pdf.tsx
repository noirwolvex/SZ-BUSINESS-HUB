'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Loader2,
  PenLine,
  AlertCircle,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignatureModal } from './signature-modal';
import {
  applySignatures,
  type SignatureImage,
  type SignaturePlacement,
} from '@/lib/pdf/sign-pdf';

type Phase = 'upload' | 'preview' | 'signing' | 'done' | 'error';

interface PagePreview {
  pageIndex: number;
  dataUrl: string;
  width: number;
  height: number;
}

const RENDER_SCALE = 1.5;
const DEFAULT_SIG_WIDTH = 22;

export function SignPdfUI() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [signature, setSignature] = useState<SignatureImage | null>(null);
  const [showSigModal, setShowSigModal] = useState(false);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<number | null>(null);
  const [draggingPlacement, setDraggingPlacement] = useState<number | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const fileBufferRef = useRef<ArrayBuffer | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.match(/\.pdf$/i)) return;
    setFile(f);
    setPhase('upload');
    setPages([]);
    setSignedUrl(null);
    setError(null);
    setSignature(null);
    setPlacements([]);
    setSelectedPlacement(null);
  };

  const loadPreview = async () => {
    if (!file) return;
    setPhase('preview');
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBufferRef.current = arrayBuffer.slice(0);

      const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;

      const allPages: PagePreview[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        allPages.push({
          pageIndex: i - 1,
          dataUrl: canvas.toDataURL('image/png'),
          width: viewport.width / RENDER_SCALE,
          height: viewport.height / RENDER_SCALE,
        });
      }
      setPages(allPages);
      setCurrentPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the document.');
      setPhase('error');
    }
  };

  const addPlacement = () => {
    if (!signature) {
      setShowSigModal(true);
      return;
    }
    const newPlacement: SignaturePlacement = {
      pageIndex: currentPage,
      xPercent: 50 - DEFAULT_SIG_WIDTH / 2,
      yPercent: 50,
      widthPercent: DEFAULT_SIG_WIDTH,
    };
    setPlacements((prev) => [...prev, newPlacement]);
    setSelectedPlacement(placements.length);
  };

  const removePlacement = (index: number) => {
    setPlacements((prev) => prev.filter((_, i) => i !== index));
    setSelectedPlacement(null);
  };

  const startDrag = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlacement(index);
    setDraggingPlacement(index);
    const placement = placements[index];
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    dragOffsetRef.current = { dx: px - placement.xPercent, dy: py - placement.yPercent };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingPlacement === null || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const offset = dragOffsetRef.current;
    setPlacements((prev) =>
      prev.map((p, i) =>
        i === draggingPlacement
          ? {
              ...p,
              xPercent: Math.max(0, Math.min(100 - p.widthPercent, px - offset.dx)),
              yPercent: Math.max(0, Math.min(100, py - offset.dy)),
            }
          : p,
      ),
    );
  };

  const stopDrag = () => {
    setDraggingPlacement(null);
  };

  const startResize = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const placement = placements[index];
    const startW = placement.widthPercent;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const onMove = (ev: MouseEvent) => {
      const deltaPct = ((ev.clientX - startX) / rect.width) * 100;
      setPlacements((prev) =>
        prev.map((p, i) => {
          if (i !== index) return p;
          const newW = Math.max(8, Math.min(60, startW + deltaPct * 2));
          return { ...p, widthPercent: newW };
        }),
      );
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const applySigning = useCallback(async () => {
    if (!fileBufferRef.current || !signature || placements.length === 0) return;
    setPhase('signing');
    setError(null);
    try {
      const pdfBytes = await applySignatures(
        fileBufferRef.current.slice(0),
        placements,
        signature,
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSignedUrl(url);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign the document.');
      setPhase('error');
    }
  }, [signature, placements]);

  const reset = () => {
    if (signedUrl) URL.revokeObjectURL(signedUrl);
    setFile(null);
    setPages([]);
    setSignedUrl(null);
    setError(null);
    setSignature(null);
    setPlacements([]);
    setSelectedPlacement(null);
    fileBufferRef.current = null;
    setPhase('upload');
  };

  const pagePlacements = placements.filter((p) => p.pageIndex === currentPage);
  const totalPages = pages.length;

  if (phase === 'done' && signedUrl) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <p className="font-display text-lg font-semibold">Document signed</p>
          <p className="mt-2 mx-auto max-w-sm text-sm text-muted-foreground">
            {placements.length} signature{placements.length === 1 ? '' : 's'} added across{' '}
            {pages.length} page{pages.length === 1 ? '' : 's'}. Download your signed PDF below.
          </p>
        </div>
        <div className="flex gap-3">
          <a href={signedUrl} download="signed.pdf" className="flex-1">
            <Button className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download Signed PDF
            </Button>
          </a>
          <Button onClick={reset} variant="outline" size="lg">
            Sign Another
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-display text-lg font-semibold">Processing failed</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button onClick={reset} variant="outline" className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  if (phase === 'signing') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium">Signing document…</p>
        <p className="mt-1 text-xs text-muted-foreground">Embedding signatures into your PDF</p>
      </div>
    );
  }

  if (phase === 'preview' && pages.length > 0) {
    const page = pages[currentPage];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PenLine className="h-4 w-4 text-primary" />
            {signature ? 'Signature ready' : 'No signature yet'}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowSigModal(true)}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" />
              {signature ? 'Change Signature' : 'Create Signature'}
            </Button>
            <Button size="sm" onClick={addPlacement} disabled={!signature}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add to Page {currentPage + 1}
            </Button>
          </div>
        </div>

        {signature && (
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-white">
              <img src={signature.dataUrl} alt="Signature preview" className="max-h-10 max-w-full" />
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Add to Page" to place this signature. Drag to reposition, use the right handle to resize.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div
          ref={previewRef}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          className="relative mx-auto max-w-md cursor-crosshair"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPlacement(null);
          }}
        >
          <img
            src={page.dataUrl}
            alt={`Page ${currentPage + 1}`}
            className="w-full rounded-lg border border-border/60"
            draggable={false}
          />
          {pagePlacements.map((placement) => {
            const globalIndex = placements.indexOf(placement);
            const isSelected = selectedPlacement === globalIndex;
            const aspectRatio = signature ? signature.width / signature.height : 3;
            const heightPercent = placement.widthPercent / aspectRatio * (page.width / page.height);
            return (
              <div
                key={globalIndex}
                onMouseDown={(e) => startDrag(globalIndex, e)}
                className={cn(
                  'absolute cursor-move border-2 transition-shadow',
                  isSelected
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-primary/60 shadow-md',
                )}
                style={{
                  left: `${placement.xPercent}%`,
                  top: `${placement.yPercent}%`,
                  width: `${placement.widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
              >
                <img
                  src={signature?.dataUrl}
                  alt="Signature"
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
                {isSelected && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlacement(globalIndex); }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div
                      onMouseDown={(e) => startResize(globalIndex, e)}
                      className="absolute -right-1.5 top-1/2 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-full bg-primary/80"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {placements.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {placements.length} signature{placements.length === 1 ? '' : 's'} placed.
            Click a signature to select, then drag to reposition.
          </p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={applySigning}
            disabled={placements.length === 0 || !signature}
            size="lg"
            className="flex-1"
          >
            <PenLine className="mr-2 h-4 w-4" />
            Apply Signatures ({placements.length})
          </Button>
          <Button onClick={reset} variant="outline" size="lg">
            Cancel
          </Button>
        </div>

        <SignatureModal
          open={showSigModal}
          onClose={() => setShowSigModal(false)}
          onSave={(sig) => {
            setSignature(sig);
            setShowSigModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            onClick={() => setFile(null)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] || null); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="font-display text-lg font-semibold">Drop PDF here</p>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        className="hidden"
      />

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">
          Sign PDF lets you create a signature by drawing, typing, or uploading an image,
          then place it anywhere on your document. All processing happens in your browser —
          your file never leaves your device.
        </p>
      </div>

      <Button onClick={loadPreview} disabled={!file} size="lg" className="w-full">
        <PenLine className="mr-2 h-4 w-4" />
        Open Document
      </Button>

      <SignatureModal
        open={showSigModal}
        onClose={() => setShowSigModal(false)}
        onSave={(sig) => {
          setSignature(sig);
          setShowSigModal(false);
        }}
      />
    </div>
  );
}
