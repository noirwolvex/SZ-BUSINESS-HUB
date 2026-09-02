'use client';

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type MouseEvent,
} from 'react';

import {
  Upload,
  X,
  FileText,
  Loader2,
  Eraser,
  AlertCircle,
  Download,
  Mail,
  Phone,
  IdCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Landmark,
  Globe,
  Network,
  Plus,
  MousePointer2,
  Calendar,
  User,
  Search,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import {
  type Detection,
  type DetectionCategory,
  type RedactionRegion,
  detectSensitiveItems,
  detectionToRegion,
  summarizeDetections,
  DETECTION_PATTERNS,
  ALL_CATEGORIES,
} from '@/lib/redaction';

type Phase =
  | 'upload'
  | 'scanning'
  | 'review'
  | 'applying'
  | 'done'
  | 'error';

interface ManualRegion {
  id: string;
  page: number;

  // PDF coordinates: origin bottom-left
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PagePreview {
  pageIndex: number;
  dataUrl: string;

  // Display/PDF coordinate dimensions
  width: number;
  height: number;

  detections: Detection[];
  regions: RedactionRegion[];
}

interface DrawingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const RENDER_SCALE = 2;

const CATEGORY_ICONS: Record<
  DetectionCategory,
  typeof Mail
> = {
  email: Mail,
  phone: Phone,
  id: IdCard,
  creditCard: CreditCard,
  iban: Landmark,
  url: Globe,
  ip: Network,
  ssn: IdCard,
  dob: Calendar,
  name: User,
};

const CATEGORY_COLORS: Record<
  DetectionCategory,
  string
> = {
  email: 'text-primary',
  phone: 'text-chart-2',
  id: 'text-chart-5',
  creditCard: 'text-destructive',
  iban: 'text-chart-4',
  url: 'text-chart-3',
  ip: 'text-success',
  ssn: 'text-warning',
  dob: 'text-chart-3',
  name: 'text-chart-2',
};

const CATEGORY_BORDER: Record<
  DetectionCategory,
  string
> = {
  email: 'border-primary/70',
  phone: 'border-chart-2/70',
  id: 'border-chart-5/70',
  creditCard: 'border-destructive/70',
  iban: 'border-chart-4/70',
  url: 'border-chart-3/70',
  ip: 'border-success/70',
  ssn: 'border-warning/70',
  dob: 'border-chart-3/70',
  name: 'border-chart-2/70',
};

const CATEGORY_BG: Record<
  DetectionCategory,
  string
> = {
  email: 'bg-primary/10',
  phone: 'bg-chart-2/10',
  id: 'bg-chart-5/10',
  creditCard: 'bg-destructive/10',
  iban: 'bg-chart-4/10',
  url: 'bg-chart-3/10',
  ip: 'bg-success/10',
  ssn: 'bg-warning/10',
  dob: 'bg-chart-3/10',
  name: 'bg-chart-2/10',
};

export function RedactionUI() {
  const [file, setFile] = useState<File | null>(null);

  const [phase, setPhase] =
    useState<Phase>('upload');

  const [pages, setPages] =
    useState<PagePreview[]>([]);

  const [currentPage, setCurrentPage] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  const [redactedUrl, setRedactedUrl] =
    useState<string | null>(null);

  const [dragOver, setDragOver] =
    useState(false);

  const [excluded, setExcluded] =
    useState<Set<string>>(new Set());

  const [enabledCategories, setEnabledCategories] =
    useState<Set<DetectionCategory>>(
      new Set(ALL_CATEGORIES),
    );

  const [manualRegions, setManualRegions] =
    useState<ManualRegion[]>([]);

  const [drawMode, setDrawMode] =
    useState(false);

  const [drawingBox, setDrawingBox] =
    useState<DrawingBox | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showLowConfidence, setShowLowConfidence] =
    useState(true);

  /*
   * Kept as part of the original system.
   *
   * When true:
   * - all enabled detections are selected automatically.
   *
   * When false:
   * - the user can manually choose detections.
   */
  const [redactAllMode, setRedactAllMode] =
    useState(true);

  const inputRef =
    useRef<HTMLInputElement>(null);

  const fileBufferRef =
    useRef<ArrayBuffer | null>(null);

  const drawStartRef =
    useRef<{ x: number; y: number } | null>(null);

  const previewRef =
    useRef<HTMLDivElement>(null);

  /**
   * Creates a stable key for a redaction region.
   */
  const regionKey = useCallback(
    (r: RedactionRegion) =>
      [
        r.page,
        r.x.toFixed(2),
        r.y.toFixed(2),
        r.width.toFixed(2),
        r.height.toFixed(2),
      ].join(':'),
    [],
  );

  /**
   * Validate and load a PDF.
   */
  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) return;

      const isPdf =
        f.type === 'application/pdf' ||
        /\.pdf$/i.test(f.name);

      if (!isPdf) {
        setError('Please select a valid PDF file.');
        setPhase('error');
        return;
      }

      if (f.size === 0) {
        setError('The selected PDF is empty.');
        setPhase('error');
        return;
      }

      // Cleanup previous output URL.
      if (redactedUrl) {
        URL.revokeObjectURL(redactedUrl);
      }

      setFile(f);
      setPhase('upload');
      setPages([]);
      setRedactedUrl(null);
      setError(null);
      setExcluded(new Set());
      setManualRegions([]);
      setCurrentPage(0);
      setDrawMode(false);
      setDrawingBox(null);
      drawStartRef.current = null;
      fileBufferRef.current = null;
    },
    [redactedUrl],
  );

  /**
   * Configure PDF.js worker.
   */
  const configurePdfWorker = useCallback(
    async () => {
      const pdfjs =
        await import('pdfjs-dist/build/pdf.mjs');

      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

      return pdfjs;
    },
    [],
  );

  /**
   * Scan PDF.
   */
  const scan = useCallback(async () => {
    if (!file) return;

    setPhase('scanning');
    setError(null);
    setDrawingBox(null);
    drawStartRef.current = null;

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      fileBufferRef.current =
        arrayBuffer.slice(0);

      const pdfjs =
        await configurePdfWorker();

      const loadingTask =
        pdfjs.getDocument({
          data: arrayBuffer.slice(0),
        });

      const pdf =
        await loadingTask.promise;

      if (pdf.numPages === 0) {
        throw new Error(
          'The PDF does not contain any pages.',
        );
      }

      const allPages: PagePreview[] = [];

      for (
        let i = 1;
        i <= pdf.numPages;
        i++
      ) {
        const page =
          await pdf.getPage(i);

        const viewport =
          page.getViewport({
            scale: RENDER_SCALE,
          });

        const canvas =
          document.createElement('canvas');

        canvas.width =
          Math.ceil(viewport.width);

        canvas.height =
          Math.ceil(viewport.height);

        const ctx =
          canvas.getContext('2d');

        if (!ctx) {
          throw new Error(
            `Unable to create canvas for page ${i}.`,
          );
        }

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        const dataUrl =
          canvas.toDataURL(
            'image/jpeg',
            0.9,
          );

        const textContent =
          await page.getTextContent();

        const detections =
          detectSensitiveItems(
            textContent,
            i - 1,
          );

        const regions =
          detections.map(
            detectionToRegion,
          );

        allPages.push({
          pageIndex: i - 1,
          dataUrl,

          width:
            viewport.width /
            RENDER_SCALE,

          height:
            viewport.height /
            RENDER_SCALE,

          detections,
          regions,
        });
      }

      setPages(allPages);
      setCurrentPage(0);
      setPhase('review');

      // Auto-select all enabled detections
      // when redactAllMode is active.
      if (redactAllMode) {
        setExcluded(new Set());
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to scan the document.',
      );

      setPhase('error');
    }
  }, [
    file,
    configurePdfWorker,
    redactAllMode,
  ]);

  /**
   * Toggle a detected region.
   */
  const toggleRegion = useCallback(
    (key: string) => {
      setExcluded((prev) => {
        const next =
          new Set(prev);

        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }

        return next;
      });
    },
    [],
  );

  /**
   * Toggle a detection category.
   */
  const toggleCategory = useCallback(
    (cat: DetectionCategory) => {
      setEnabledCategories((prev) => {
        const next =
          new Set(prev);

        if (next.has(cat)) {
          next.delete(cat);
        } else {
          next.add(cat);
        }

        return next;
      });
    },
    [],
  );

  /**
   * Add manual redaction.
   */
  const addManualRegion = useCallback(
    (region: ManualRegion) => {
      setManualRegions((prev) => [
        ...prev,
        region,
      ]);
    },
    [],
  );

  /**
   * Remove manual redaction.
   */
  const removeManualRegion =
    useCallback((id: string) => {
      setManualRegions((prev) =>
        prev.filter(
          (r) => r.id !== id,
        ),
      );
    }, []);

  /**
   * Convert mouse coordinates into
   * page coordinates.
   *
   * UI coordinates:
   * top-left origin
   *
   * PDF coordinates:
   * bottom-left origin
   */
  const getPageMousePosition = useCallback(
    (e: MouseEvent) => {
      if (
        !previewRef.current ||
        !pages[currentPage]
      ) {
        return null;
      }

      const rect =
        previewRef.current.getBoundingClientRect();

      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return null;
      }

      const page =
        pages[currentPage];

      const rawX =
        ((e.clientX - rect.left) /
          rect.width) *
        page.width;

      const rawY =
        ((e.clientY - rect.top) /
          rect.height) *
        page.height;

      const x = Math.max(
        0,
        Math.min(page.width, rawX),
      );

      const y = Math.max(
        0,
        Math.min(page.height, rawY),
      );

      return {
        x,
        y,
      };
    },
    [pages, currentPage],
  );

  /**
   * Start manual drawing.
   */
  const handlePreviewMouseDown =
    useCallback(
      (e: MouseEvent) => {
        if (!drawMode) return;

        const position =
          getPageMousePosition(e);

        if (!position) return;

        drawStartRef.current =
          position;

        setDrawingBox({
          x: position.x,
          y: position.y,
          w: 0,
          h: 0,
        });
      },
      [drawMode, getPageMousePosition],
    );

  /**
   * Update manual drawing.
   */
  const handlePreviewMouseMove =
    useCallback(
      (e: MouseEvent) => {
        if (
          !drawMode ||
          !drawStartRef.current
        ) {
          return;
        }

        const position =
          getPageMousePosition(e);

        if (!position) return;

        const start =
          drawStartRef.current;

        const x =
          Math.min(
            start.x,
            position.x,
          );

        const y =
          Math.min(
            start.y,
            position.y,
          );

        const w =
          Math.abs(
            position.x - start.x,
          );

        const h =
          Math.abs(
            position.y - start.y,
          );

        setDrawingBox({
          x,
          y,
          w,
          h,
        });
      },
      [drawMode, getPageMousePosition],
    );

  /**
   * Finish manual drawing.
   *
   * IMPORTANT:
   * drawingBox uses top-left coordinates.
   * ManualRegion uses PDF bottom-left coordinates.
   *
   * We convert here.
   */
  const handlePreviewMouseUp =
    useCallback(() => {
      if (
        !drawMode ||
        !drawingBox ||
        !drawStartRef.current ||
        !pages[currentPage]
      ) {
        drawStartRef.current = null;
        setDrawingBox(null);
        return;
      }

      const page =
        pages[currentPage];

      if (
        drawingBox.w > 5 &&
        drawingBox.h > 5
      ) {
        const pdfY =
          page.height -
          drawingBox.y -
          drawingBox.h;

        addManualRegion({
          id:
            typeof crypto !== 'undefined' &&
            crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,

          page: currentPage,

          x: Math.max(
            0,
            Math.min(
              page.width,
              drawingBox.x,
            ),
          ),

          y: Math.max(
            0,
            Math.min(
              page.height -
                drawingBox.h,
              pdfY,
            ),
          ),

          width: Math.min(
            drawingBox.w,
            page.width,
          ),

          height: Math.min(
            drawingBox.h,
            page.height,
          ),
        });
      }

      setDrawingBox(null);
      drawStartRef.current = null;
    }, [
      drawMode,
      drawingBox,
      pages,
      currentPage,
      addManualRegion,
    ]);

  /**
   * Apply redactions and create output PDF.
   */
  const applyRedaction =
    useCallback(async () => {
      if (!fileBufferRef.current) {
        setError(
          'No PDF data is available. Please scan the document again.',
        );
        setPhase('error');
        return;
      }

      setPhase('applying');
      setError(null);

      try {
        const {
          PDFDocument,
        } = await import('pdf-lib');

        const pdfjs =
          await configurePdfWorker();

        const srcBuffer =
          fileBufferRef.current.slice(0);

        const srcDoc =
          await PDFDocument.load(
            srcBuffer,
            {
              ignoreEncryption: true,
            },
          );

        const pdfPageCount =
          srcDoc.getPageCount();

        if (pdfPageCount === 0) {
          throw new Error(
            'The PDF does not contain any pages.',
          );
        }

        const loadingTask =
          pdfjs.getDocument({
            data: srcBuffer.slice(0),
          });

        const pdf =
          await loadingTask.promise;

        const outDoc =
          await PDFDocument.create();

        for (
          let i = 1;
          i <= pdfPageCount;
          i++
        ) {
          const page =
            await pdf.getPage(i);

          const viewport =
            page.getViewport({
              scale: RENDER_SCALE,
            });

          const canvas =
            document.createElement(
              'canvas',
            );

          canvas.width =
            Math.ceil(viewport.width);

          canvas.height =
            Math.ceil(viewport.height);

          const ctx =
            canvas.getContext('2d');

          if (!ctx) {
            throw new Error(
              `Unable to create canvas for page ${i}.`,
            );
          }

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const pagePreview =
            pages[i - 1];

          if (pagePreview) {
            const scaleX =
              viewport.width /
              pagePreview.width;

            const scaleY =
              viewport.height /
              pagePreview.height;

            /**
             * Auto-detected redactions
             */
            for (
              const region of
                pagePreview.regions
            ) {
              if (
                !enabledCategories.has(
                  region.category,
                )
              ) {
                continue;
              }

              const key =
                regionKey(region);

              if (
                excluded.has(key)
              ) {
                continue;
              }

              ctx.fillStyle =
                '#000000';

              ctx.fillRect(
                region.x * scaleX,

                viewport.height -
                  (region.y +
                    region.height) *
                    scaleY,

                region.width *
                  scaleX,

                region.height *
                  scaleY,
              );
            }

            /**
             * Manual redactions
             */
            const pageManual =
              manualRegions.filter(
                (r) =>
                  r.page ===
                  i - 1,
              );

            for (
              const region of
                pageManual
            ) {
              ctx.fillStyle =
                '#000000';

              ctx.fillRect(
                region.x * scaleX,

                viewport.height -
                  (region.y +
                    region.height) *
                    scaleY,

                region.width *
                  scaleX,

                region.height *
                  scaleY,
              );
            }
          }

          /**
           * Convert canvas to JPEG.
           */
          const blob =
            await new Promise<Blob>(
              (resolve, reject) => {
                canvas.toBlob(
                  (result) => {
                    if (!result) {
                      reject(
                        new Error(
                          `Failed to render page ${i}.`,
                        ),
                      );
                      return;
                    }

                    resolve(result);
                  },
                  'image/jpeg',
                  0.95,
                );
              },
            );

          const imgBytes =
            new Uint8Array(
              await blob.arrayBuffer(),
            );

          const img =
            await outDoc.embedJpg(
              imgBytes,
            );

          const pdfPage =
            srcDoc.getPage(i - 1);

          const {
            width,
            height,
          } = pdfPage.getSize();

          const newPage =
            outDoc.addPage([
              width,
              height,
            ]);

          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }

        const pdfBytes =
          await outDoc.save();

        const outBlob =
          new Blob(
            [pdfBytes],
            {
              type:
                'application/pdf',
            },
          );

        const url =
          URL.createObjectURL(
            outBlob,
          );

        /**
         * Cleanup previous URL.
         */
        if (redactedUrl) {
          URL.revokeObjectURL(
            redactedUrl,
          );
        }

        setRedactedUrl(url);
        setPhase('done');
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to apply redactions.',
        );

        setPhase('error');
      }
    }, [
      pages,
      excluded,
      enabledCategories,
      manualRegions,
      redactedUrl,
      configurePdfWorker,
      regionKey,
    ]);

  /**
   * Reset everything.
   */
  const reset = useCallback(() => {
    if (redactedUrl) {
      URL.revokeObjectURL(
        redactedUrl,
      );
    }

    setFile(null);
    setPages([]);
    setRedactedUrl(null);
    setError(null);
    setExcluded(new Set());
    setManualRegions([]);
    setDrawMode(false);
    setDrawingBox(null);
    setSearchQuery('');
    setCurrentPage(0);

    setEnabledCategories(
      new Set(ALL_CATEGORIES),
    );

    fileBufferRef.current = null;
    drawStartRef.current = null;

    setPhase('upload');
  }, [redactedUrl]);

  /**
   * All detections.
   */
  const allDetections =
    useMemo(
      () =>
        pages.flatMap(
          (p) => p.detections,
        ),
      [pages],
    );

  const counts =
    useMemo(
      () =>
        summarizeDetections(
          allDetections,
        ),
      [allDetections],
    );

  /**
   * Active automatic regions.
   */
  const activeAutoRegions =
    useMemo(() => {
      return pages.flatMap(
        (p) =>
          p.regions.filter(
            (r) =>
              enabledCategories.has(
                r.category,
              ) &&
              !excluded.has(
                regionKey(r),
              ),
          ),
      );
    }, [
      pages,
      enabledCategories,
      excluded,
      regionKey,
    ]);

  const activeManualRegions =
    manualRegions;

  const totalActive =
    activeAutoRegions.length +
    activeManualRegions.length;

  /**
   * Filter detection sidebar.
   */
  const filteredDetections =
    useMemo(() => {
      return allDetections
        .filter((d) => {
          if (
            !showLowConfidence &&
            d.confidence < 0.7
          ) {
            return false;
          }

          if (
            searchQuery &&
            !d.text
              .toLowerCase()
              .includes(
                searchQuery.toLowerCase(),
              )
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (a, b) =>
            b.confidence -
            a.confidence,
        );
    }, [
      allDetections,
      showLowConfidence,
      searchQuery,
    ]);

  /**
   * Exclude all detections.
   */
  const excludeAll =
    useCallback(() => {
      const newExcluded =
        new Set(excluded);

      for (
        const d of allDetections
      ) {
        const r =
          detectionToRegion(d);

        newExcluded.add(
          regionKey(r),
        );
      }

      setExcluded(
        newExcluded,
      );
    }, [
      excluded,
      allDetections,
      regionKey,
    ]);

  /**
   * Include all detections.
   */
  const includeAll =
    useCallback(() => {
      setExcluded(
        new Set(),
      );
    }, []);

  /**
   * Navigate to detection.
   */
  const goToDetection =
    useCallback(
      (detection: Detection) => {
        setDrawingBox(null);
        drawStartRef.current = null;

        setCurrentPage(
          Math.max(
            0,
            Math.min(
              pages.length - 1,
              detection.page,
            ),
          ),
        );
      },
      [pages.length],
    );

  /**
   * Change page safely.
   */
  const changePage =
    useCallback(
      (page: number) => {
        if (!pages.length) return;

        const next =
          Math.max(
            0,
            Math.min(
              pages.length - 1,
              page,
            ),
          );

        setCurrentPage(next);

        setDrawingBox(null);
        drawStartRef.current =
          null;
      },
      [pages.length],
    );

  // ------------------------------------------
  // DONE VIEW
  // ------------------------------------------

  if (
    phase === 'done' &&
    redactedUrl
  ) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
            <ShieldCheck className="h-8 w-8 text-success" />
          </div>

          <p className="font-display text-lg font-semibold">
            Redaction complete
          </p>

          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {totalActive}{' '}
            item
            {totalActive === 1
              ? ''
              : 's'} redacted
            across{' '}
            {pages.length}{' '}
            page
            {pages.length === 1
              ? ''
              : 's'}.
          </p>

          <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground">
            The exported PDF is flattened into
            rendered page images, so the original
            PDF text layer is not preserved.
          </p>
        </div>

        <div className="flex gap-3">
          <a
            href={redactedUrl}
            download="redacted.pdf"
            className="flex-1"
          >
            <Button
              className="w-full"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Redacted PDF
            </Button>
          </a>

          <Button
            onClick={reset}
            variant="outline"
            size="lg"
          >
            Redact Another
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // ERROR VIEW
  // ------------------------------------------

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <p className="font-display text-lg font-semibold">
          Processing failed
        </p>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {error}
        </p>

        <Button
          onClick={reset}
          variant="outline"
          className="mt-6"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // ------------------------------------------
  // REVIEW VIEW
  // ------------------------------------------

  if (
    phase === 'review' &&
    pages.length > 0
  ) {
    const page =
      pages[currentPage];

    const pageManual =
      manualRegions.filter(
        (r) =>
          r.page === currentPage,
      );

    return (
      <div className="space-y-4">
        {/* CATEGORY FILTERS */}

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eraser className="h-5 w-5 text-primary" />

              <span className="font-display text-base font-semibold">
                Detection Categories
              </span>
            </div>

            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={includeAll}
                className="h-7 text-xs"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Include All
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={excludeAll}
                className="h-7 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Exclude All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ALL_CATEGORIES.map(
              (cat) => {
                const Icon =
                  CATEGORY_ICONS[
                    cat
                  ];

                const isEnabled =
                  enabledCategories.has(
                    cat,
                  );

                return (
                  <button
                    key={cat}
                    onClick={() =>
                      toggleCategory(
                        cat,
                      )
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors',
                      isEnabled
                        ? 'border-primary/40 bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/20 text-muted-foreground opacity-60',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        CATEGORY_COLORS[
                          cat
                        ],
                      )}
                    />

                    <span className="flex-1 truncate text-left">
                      {
                        DETECTION_PATTERNS[
                          cat
                        ].label
                      }
                    </span>

                    {counts[cat] >
                      0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                        {
                          counts[
                            cat
                          ]
                        }
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* MAIN REVIEW */}

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* SIDEBAR */}

          <div className="rounded-2xl border border-border/60 bg-card p-3 lg:max-h-[600px]">
            <div className="mb-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search detections…"
                  value={
                    searchQuery
                  }
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value,
                    )
                  }
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <button
                onClick={() =>
                  setShowLowConfidence(
                    (s) => !s,
                  )
                }
                className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {showLowConfidence ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}

                {showLowConfidence
                  ? 'Showing'
                  : 'Hiding'}{' '}
                low-confidence
              </button>
            </div>

            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-1.5">
                {filteredDetections.length ===
                  0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No detections match
                    your filters.
                  </p>
                )}

                {filteredDetections.map(
                  (
                    d,
                    idx,
                  ) => {
                    const region =
                      detectionToRegion(
                        d,
                      );

                    const key =
                      regionKey(
                        region,
                      );

                    const isExcluded =
                      excluded.has(
                        key,
                      );

                    const isCatEnabled =
                      enabledCategories.has(
                        d.category,
                      );

                    const Icon =
                      CATEGORY_ICONS[
                        d.category
                      ];

                    const isActive =
                      isCatEnabled &&
                      !isExcluded;

                    const isOnCurrentPage =
                      d.page ===
                      currentPage;

                    return (
                      <div
                        key={`det-${idx}`}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border p-2 transition-colors',

                          isActive
                            ? cn(
                                'border-border/60',
                                CATEGORY_BG[
                                  d.category
                                ],
                              )
                            : 'border-border/40 bg-muted/10 opacity-60',

                          isOnCurrentPage &&
                            'ring-1 ring-primary/40',
                        )}
                      >
                        <button
                          onClick={() => {
                            if (
                              !isCatEnabled
                            ) {
                              toggleCategory(
                                d.category,
                              );
                            }

                            /*
                             * If category was disabled,
                             * enable it and keep region active.
                             */
                            if (
                              isCatEnabled
                            ) {
                              toggleRegion(
                                key,
                              );
                            }

                            goToDetection(
                              d,
                            );
                          }}
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',

                            isActive
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40',
                          )}
                        >
                          {isActive && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </button>

                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            CATEGORY_COLORS[
                              d.category
                            ],
                          )}
                        />

                        <button
                          onClick={() =>
                            goToDetection(
                              d,
                            )
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-xs font-medium">
                            {d.text}
                          </p>

                          <p className="text-[10px] text-muted-foreground">
                            {
                              DETECTION_PATTERNS[
                                d.category
                              ].label
                            }{' '}
                            · Page{' '}
                            {d.page +
                              1}

                            {d.confidence <
                              0.7 &&
                              ' · low confidence'}
                          </p>
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            </ScrollArea>
          </div>

          {/* PREVIEW */}

          <div className="space-y-3">
            {/* PAGE NAVIGATION */}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pages.length >
                  1 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        changePage(
                          currentPage -
                            1,
                        )
                      }
                      disabled={
                        currentPage ===
                        0
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm font-medium">
                      Page{' '}
                      {currentPage +
                        1}{' '}
                      /{' '}
                      {
                        pages.length
                      }
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        changePage(
                          currentPage +
                            1,
                        )
                      }
                      disabled={
                        currentPage ===
                        pages.length -
                          1
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={
                    !drawMode
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => {
                    setDrawMode(
                      false,
                    );
                    setDrawingBox(
                      null,
                    );
                    drawStartRef.current =
                      null;
                  }}
                >
                  <MousePointer2 className="mr-1.5 h-3.5 w-3.5" />
                  Select
                </Button>

                <Button
                  size="sm"
                  variant={
                    drawMode
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => {
                    setDrawMode(
                      true,
                    );
                    setDrawingBox(
                      null,
                    );
                    drawStartRef.current =
                      null;
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Draw
                </Button>
              </div>
            </div>

            {/* PREVIEW */}

            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div
                ref={previewRef}
                className={cn(
                  'relative mx-auto max-w-md select-none overflow-visible',

                  drawMode &&
                    'cursor-crosshair',
                )}
                onMouseDown={
                  handlePreviewMouseDown
                }
                onMouseMove={
                  handlePreviewMouseMove
                }
                onMouseUp={
                  handlePreviewMouseUp
                }
                onMouseLeave={
                  handlePreviewMouseUp
                }
              >
                <img
                  src={page.dataUrl}
                  alt={`Page ${
                    currentPage + 1
                  }`}
                  draggable={false}
                  className="pointer-events-none block w-full rounded-lg border border-border/60"
                />

                {/* AUTO DETECTED */}

                {page.regions.map(
                  (
                    region,
                    idx,
                  ) => {
                    const key =
                      regionKey(
                        region,
                      );

                    const isExcluded =
                      excluded.has(
                        key,
                      );

                    const isCatEnabled =
                      enabledCategories.has(
                        region.category,
                      );

                    if (
                      !isCatEnabled
                    ) {
                      return null;
                    }

                    const scaleX =
                      100 /
                      page.width;

                    const scaleY =
                      100 /
                      page.height;

                    return (
                      <button
                        type="button"
                        key={`auto-${key}-${idx}`}
                        onClick={(
                          e,
                        ) => {
                          e.stopPropagation();

                          if (
                            !drawMode
                          ) {
                            toggleRegion(
                              key,
                            );
                          }
                        }}
                        className={cn(
                          'absolute border-2 transition-all pointer-events-auto',

                          drawMode &&
                            'pointer-events-none',

                          isExcluded
                            ? 'border-dashed border-muted-foreground/50 bg-transparent'
                            : cn(
                                'bg-black/85',
                                CATEGORY_BORDER[
                                  region.category
                                ],
                              ),
                        )}
                        style={{
                          left: `${region.x * scaleX}%`,
                          top: `${
                            (page.height -
                              region.y -
                              region.height) *
                            scaleY
                          }%`,
                          width: `${
                            region.width *
                            scaleX
                          }%`,
                          height: `${
                            region.height *
                            scaleY
                          }%`,
                        }}
                        title={
                          isExcluded
                            ? `${region.text} — click to include`
                            : `${DETECTION_PATTERNS[region.category].label}: ${region.text} — click to exclude`
                        }
                      />
                    );
                  },
                )}

                {/* MANUAL REDACTIONS */}

                {pageManual.map(
                  (region) => (
                    <div
                      key={`manual-${region.id}`}
                      className="pointer-events-auto absolute border-2 border-primary bg-black/85"
                      style={{
                        left: `${
                          (region.x /
                            page.width) *
                          100
                        }%`,

                        top: `${
                          ((page.height -
                            region.y -
                            region.height) /
                            page.height) *
                          100
                        }%`,

                        width: `${
                          (region.width /
                            page.width) *
                          100
                        }%`,

                        height: `${
                          (region.height /
                            page.height) *
                          100
                        }%`,
                      }}
                    >
                      {!drawMode && (
                        <button
                          type="button"
                          onClick={(
                            e,
                          ) => {
                            e.stopPropagation();

                            removeManualRegion(
                              region.id,
                            );
                          }}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md transition-transform hover:scale-110"
                          aria-label="Remove manual redaction"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ),
                )}

                {/* CURRENT DRAWING */}

                {drawingBox && (
                  <div
                    className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/20"
                    style={{
                      /*
                       * drawingBox is in screen/top-left
                       * coordinates, so DON'T invert Y here.
                       */
                      left: `${
                        (drawingBox.x /
                          page.width) *
                        100
                      }%`,

                      top: `${
                        (drawingBox.y /
                          page.height) *
                        100
                      }%`,

                      width: `${
                        (drawingBox.w /
                          page.width) *
                        100
                      }%`,

                      height: `${
                        (drawingBox.h /
                          page.height) *
                        100
                      }%`,
                    }}
                  />
                )}
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                {drawMode
                  ? 'Drag to draw a redaction box anywhere on the page.'
                  : 'Click a highlighted area to toggle it. Use Draw to manually redact any area.'}
              </p>
            </div>

            {/* SUMMARY */}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center text-sm">
              <span className="font-semibold text-primary">
                {totalActive}
              </span>{' '}
              items marked for redaction

              {activeManualRegions.length >
                0 && (
                <span className="text-muted-foreground">
                  {' '}
                  (
                  {
                    activeAutoRegions.length
                  }{' '}
                  auto +{' '}
                  {
                    activeManualRegions.length
                  }{' '}
                  manual)
                </span>
              )}
            </div>

            {/* ACTIONS */}

            <div className="flex gap-3">
              <Button
                onClick={
                  applyRedaction
                }
                disabled={
                  totalActive === 0
                }
                size="lg"
                className="flex-1"
              >
                <Eraser className="mr-2 h-4 w-4" />
                Apply Redaction (
                {totalActive})
              </Button>

              <Button
                onClick={reset}
                variant="outline"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // SCANNING VIEW
  // ------------------------------------------

  if (
    phase === 'scanning'
  ) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <p className="mt-4 text-sm font-medium">
          Scanning document…
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Extracting text and detecting sensitive information
        </p>
      </div>
    );
  }

  // ------------------------------------------
  // APPLYING VIEW
  // ------------------------------------------

  if (
    phase === 'applying'
  ) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <p className="mt-4 text-sm font-medium">
          Applying redactions…
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Building secure redacted PDF
        </p>
      </div>
    );
  }

  // ------------------------------------------
  // UPLOAD VIEW
  // ------------------------------------------

  return (
    <div className="space-y-4">
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {file.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {(
                file.size /
                1024 /
                1024
              ).toFixed(1)}{' '}
              MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFile(null);
              setError(null);
              setPages([]);
              setManualRegions([]);
              setExcluded(
                new Set(),
              );
              fileBufferRef.current =
                null;
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove PDF"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() =>
            setDragOver(false)
          }
          onDrop={(e) => {
            e.preventDefault();

            setDragOver(false);

            handleFile(
              e.dataTransfer.files?.[0] ??
                null,
            );
          }}
          onClick={() =>
            inputRef.current?.click()
          }
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

          <p className="font-display text-lg font-semibold">
            Drop PDF here
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          const f =
            e.target.files?.[0];

          if (f) {
            handleFile(f);
          }

          e.target.value = '';
        }}
        className="hidden"
      />

      {/* INFO */}

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />

          <p className="text-xs font-semibold text-foreground">
            Auto-detects{' '}
            {ALL_CATEGORIES.length}{' '}
            types of sensitive data:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {ALL_CATEGORIES.map(
            (cat) => {
              const Icon =
                CATEGORY_ICONS[
                  cat
                ];

              return (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      CATEGORY_COLORS[
                        cat
                      ],
                    )}
                  />

                  {
                    DETECTION_PATTERNS[
                      cat
                    ].label
                  }
                </div>
              );
            },
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Detected items are covered with permanent
          black bars in the exported PDF. You can
          review every detection before applying,
          manually draw redaction boxes, and enable
          or disable detection categories.
        </p>
      </div>

      {/* MODE */}

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
        <div>
          <p className="text-sm font-medium">
            Automatic redaction
          </p>

          <p className="text-xs text-muted-foreground">
            Automatically mark detected sensitive
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setRedactAllMode(
              (v) => !v,
            )
          }
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            redactAllMode
              ? 'bg-primary'
              : 'bg-muted',
          )}
          aria-label="Toggle automatic redaction"
        >
          <span
            className={cn(
              'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
              redactAllMode
                ? 'left-6'
                : 'left-1',
            )}
          />
        </button>
      </div>

      <Button
        onClick={scan}
        disabled={!file}
        size="lg"
        className="w-full"
      >
        <Eraser className="mr-2 h-4 w-4" />
        Scan Document
      </Button>
    </div>
  );
}