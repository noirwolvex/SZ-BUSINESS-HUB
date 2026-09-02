'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  Plus, Trash2, Download, ImagePlus, Type, FileText, Loader2,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Square, Circle as CircleIcon, Minus, RotateCw, ZoomIn, ZoomOut,
  Copy, Layers, Palette, Grid3x3, ChevronDown, ChevronUp,
  MoveRight, MoveLeft, Sparkles, Undo2, Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type FontFamily = 'helvetica' | 'times' | 'courier';
type Alignment = 'left' | 'center' | 'right' | 'justify';
type Direction = 'ltr' | 'rtl';
type ShapeType = 'rectangle' | 'circle' | 'line';

interface BaseElement {
  id: string;
  x: number;
  y: number;
  page: number;
  rotation: number;
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  alignment: Alignment;
  direction: Direction;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  width: number;
}

interface ImageElement extends BaseElement {
  type: 'image';
  width: number;
  height: number;
  base64: string;
  mimeType: string;
  opacity: number;
}

interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeType;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

type Element = TextElement | ImageElement | ShapeElement;

const PAGE_SIZES: Record<string, { width: number; height: number; label: string }> = {
  a4: { width: 595, height: 842, label: 'A4' },
  letter: { width: 612, height: 792, label: 'Letter' },
  legal: { width: 612, height: 1008, label: 'Legal' },
  a3: { width: 842, height: 1191, label: 'A3' },
  a5: { width: 420, height: 595, label: 'A5' },
  tabloid: { width: 792, height: 1224, label: 'Tabloid' },
  businessCard: { width: 252, height: 144, label: 'Business Card' },
  instagram: { width: 540, height: 540, label: 'Instagram Post' },
  story: { width: 540, height: 960, label: 'Story' },
};

const FONT_MAP: Record<FontFamily, { regular: StandardFonts; bold: StandardFonts; italic: StandardFonts; boldItalic: StandardFonts; css: string }> = {
  helvetica: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
    boldItalic: StandardFonts.HelveticaBoldOblique,
    css: 'Helvetica, Arial, sans-serif',
  },
  times: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
    boldItalic: StandardFonts.TimesRomanBoldItalic,
    css: '"Times New Roman", Times, serif',
  },
  courier: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
    boldItalic: StandardFonts.CourierBoldOblique,
    css: '"Courier New", Courier, monospace',
  },
};

const FONT_LABELS: Record<FontFamily, string> = {
  helvetica: 'Helvetica',
  times: 'Times',
  courier: 'Courier',
};

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#ec4899',
  '#64748b', '#1e293b',
];

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return [r || 0, g || 0, b || 0];
}

function getFontKey(el: TextElement): keyof typeof FONT_MAP.helvetica {
  if (el.bold && el.italic) return 'boldItalic';
  if (el.bold) return 'bold';
  if (el.italic) return 'italic';
  return 'regular';
}

export function CreatePdfEditor() {
  const [pageSize, setPageSize] = useState<string>('a4');
  const [pages, setPages] = useState<number>(1);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.7);
  const [showGrid, setShowGrid] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [activePanel, setActivePanel] = useState<'text' | 'shape' | 'image' | 'page'>('text');
  const [history, setHistory] = useState<Element[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<Element | null>(null);

  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number; elemW: number; elemH: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dims = PAGE_SIZES[pageSize];

  const pushHistory = useCallback((els: Element[]) => {
    setHistory((prev) => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(JSON.parse(JSON.stringify(els)));
      if (newHist.length > 50) newHist.shift();
      return newHist;
    });
    setHistoryIndex((i) => Math.min(i + 1, 49));
  }, [historyIndex]);

  const updateElements = useCallback((updater: (prev: Element[]) => Element[], record = true) => {
    setElements((prev) => {
      const next = updater(prev);
      if (record) pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setElements(history[idx] || []);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setElements(history[idx] || []);
  }, [history, historyIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        const el = elements.find((x) => x.id === selectedId);
        if (el) setClipboard(el);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        const newEl = { ...clipboard, id: crypto.randomUUID(), x: clipboard.x + 20, y: clipboard.y - 20 } as Element;
        updateElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          updateElements((prev) => prev.filter((x) => x.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedId, elements, clipboard, updateElements]);

  const addText = (preset?: Partial<TextElement>) => {
    const newEl: TextElement = {
      id: crypto.randomUUID(),
      type: 'text',
      text: 'Double-click to edit',
      x: 50,
      y: dims.height - 100,
      fontSize: 16,
      fontFamily: 'helvetica',
      bold: false,
      italic: false,
      alignment: 'left',
      direction: 'ltr',
      color: '#000000',
      lineHeight: 1.4,
      letterSpacing: 0,
      width: 300,
      rotation: 0,
      page: currentPage,
      ...preset,
    };
    updateElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setActivePanel('text');
  };

  const addShape = (shape: ShapeType) => {
    const newEl: ShapeElement = {
      id: crypto.randomUUID(),
      type: 'shape',
      shape,
      x: 100,
      y: dims.height - 200,
      width: shape === 'line' ? 200 : 120,
      height: shape === 'line' ? 4 : 120,
      fillColor: shape === 'line' ? 'transparent' : '#3b82f6',
      strokeColor: '#1e293b',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      page: currentPage,
    };
    updateElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setActivePanel('shape');
  };

  const addPage = () => {
    setPages((p) => p + 1);
    setCurrentPage(pages + 1);
  };

  const deletePage = () => {
    if (pages <= 1) return;
    updateElements((prev) => prev.filter((e) => e.page !== currentPage));
    setPages((p) => p - 1);
    if (currentPage > pages - 1) setCurrentPage(pages - 1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG or JPEG image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const img = new Image();
      img.onload = () => {
        const maxW = 300;
        const ratio = img.height / img.width;
        const w = Math.min(img.width, maxW);
        const h = w * ratio;
        const newEl: ImageElement = {
          id: crypto.randomUUID(),
          type: 'image',
          x: 50,
          y: dims.height - 200,
          width: w,
          height: h,
          base64,
          mimeType: file.type,
          opacity: 1,
          rotation: 0,
          page: currentPage,
        };
        updateElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
        setActivePanel('image');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    updateElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } as Element : el)));
  };

  const updateElementNoHistory = (id: string, updates: Partial<Element>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } as Element : el)));
  };

  const deleteElement = (id: string) => {
    updateElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    const newEl = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y - 20 } as Element;
    updateElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const startDrag = (e: React.MouseEvent, el: Element) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setDragging(el.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: el.x,
      elemY: el.y,
      elemW: 'width' in el ? el.width : 0,
      elemH: 'height' in el ? el.height : 0,
    };
  };

  const startResize = (e: React.MouseEvent, el: ImageElement | ShapeElement) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(el.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: el.x,
      elemY: el.y,
      elemW: el.width,
      elemH: el.height,
    };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;

    if (dragging && dragRef.current) {
      const snap = showGrid ? 10 : 1;
      let newX = dragRef.current.elemX + dx;
      let newY = dragRef.current.elemY + dy;
      if (showGrid) {
        newX = Math.round(newX / snap) * snap;
        newY = Math.round(newY / snap) * snap;
      }
      newX = Math.max(0, Math.min(dims.width - 20, newX));
      newY = Math.max(10, Math.min(dims.height, newY));
      updateElementNoHistory(dragging, { x: newX, y: newY });
    }
    if (resizing && dragRef.current) {
      const newW = Math.max(20, dragRef.current.elemW + dx);
      const ratio = dragRef.current.elemH / dragRef.current.elemW;
      const newH = newW * ratio;
      updateElementNoHistory(resizing, { width: newW, height: newH });
    }
  }, [dragging, resizing, dims.width, dims.height, zoom, showGrid]);

  const endDrag = () => {
    if (dragging || resizing) {
      pushHistory(elements);
    }
    setDragging(null);
    setResizing(null);
    dragRef.current = null;
  };

  const generatePdf = async () => {
    setGenerating(true);
    setError(null);
    try {
      const pdfDoc = await PDFDocument.create();
      const fontCache: Record<string, any> = {};
      const getFont = async (family: FontFamily, key: string) => {
        const cacheKey = `${family}-${key}`;
        if (!fontCache[cacheKey]) {
          fontCache[cacheKey] = await pdfDoc.embedFont(FONT_MAP[family][key as keyof typeof FONT_MAP.helvetica]);
        }
        return fontCache[cacheKey];
      };

      const [bgR, bgG, bgB] = hexToRgb(bgColor);

      for (let p = 1; p <= pages; p++) {
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawRectangle({
          x: 0, y: 0, width: dims.width, height: dims.height,
          color: rgb(bgR, bgG, bgB),
        });
        const pageElements = elements.filter((el) => el.page === p);

        for (const el of pageElements) {
          if (el.type === 'text') {
            const fontKey = getFontKey(el);
            const font = await getFont(el.fontFamily, fontKey);
            const [r, g, b] = hexToRgb(el.color);
            const fontSize = el.fontSize;
            const lineHeightVal = fontSize * el.lineHeight;
            const maxWidth = el.width;

            const paragraphs = el.text.split('\n');
            let yPos = el.y;

            for (const para of paragraphs) {
              const words = para.split(' ');
              const lines: string[] = [];
              let currentLine = el.direction === 'rtl' ? '' : '';

              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = font.widthOfTextAtSize(testLine, fontSize);
                if (testWidth > maxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);
              if (lines.length === 0) lines.push('');

              const totalHeight = lines.length * lineHeightVal;
              let startY = el.y;
              if (el.alignment === 'center') startY = el.y;
              else if (el.alignment === 'right') startY = el.y;

              lines.forEach((line, i) => {
                const lineWidth = font.widthOfTextAtSize(line, fontSize);
                let xPos = el.x;
                if (el.alignment === 'center') xPos = el.x + (maxWidth - lineWidth) / 2;
                else if (el.alignment === 'right') xPos = el.x + (maxWidth - lineWidth);
                else if (el.direction === 'rtl' && el.alignment === 'left') {
                  xPos = el.x + (maxWidth - lineWidth);
                }

                page.drawText(line, {
                  x: xPos,
                  y: startY - i * lineHeightVal,
                  size: fontSize,
                  font,
                  color: rgb(r, g, b),
                  rotate: degrees(el.rotation || 0),
                });
              });
              yPos -= totalHeight;
            }
          } else if (el.type === 'image') {
            const imageBytes = Uint8Array.from(atob(el.base64), (c) => c.charCodeAt(0));
            let img;
            if (el.mimeType === 'image/png') {
              img = await pdfDoc.embedPng(imageBytes);
            } else {
              img = await pdfDoc.embedJpg(imageBytes);
            }
            page.drawImage(img, {
              x: el.x,
              y: el.y - el.height,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              rotate: degrees(el.rotation || 0),
            });
          } else if (el.type === 'shape') {
            const [fr, fg, fb] = el.fillColor !== 'transparent' ? hexToRgb(el.fillColor) : [1, 1, 1];
            const [sr, sg, sb] = hexToRgb(el.strokeColor);

            if (el.shape === 'rectangle') {
              page.drawRectangle({
                x: el.x,
                y: el.y - el.height,
                width: el.width,
                height: el.height,
                color: el.fillColor !== 'transparent' ? rgb(fr, fg, fb) : undefined,
                borderColor: rgb(sr, sg, sb),
                borderWidth: el.strokeWidth,
                opacity: el.opacity,
                rotate: degrees(el.rotation || 0),
              });
            } else if (el.shape === 'circle') {
              page.drawEllipse({
                x: el.x + el.width / 2,
                y: el.y - el.height / 2,
                xScale: el.width / 2,
                yScale: el.height / 2,
                color: el.fillColor !== 'transparent' ? rgb(fr, fg, fb) : undefined,
                borderColor: rgb(sr, sg, sb),
                borderWidth: el.strokeWidth,
                opacity: el.opacity,
                rotate: degrees(el.rotation || 0),
              });
            } else if (el.shape === 'line') {
              page.drawLine({
                start: { x: el.x, y: el.y },
                end: { x: el.x + el.width, y: el.y },
                thickness: el.strokeWidth,
                color: rgb(sr, sg, sb),
                opacity: el.opacity,
              });
            }
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'created-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const selected = elements.find((el) => el.id === selectedId);
  const pageElements = elements.filter((el) => el.page === currentPage);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Page</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          >
            {Object.entries(PAGE_SIZES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => addText()} disabled={activePanel !== 'text' && activePanel !== 'shape' && activePanel !== 'image' && activePanel !== 'page' ? false : false}>
              <Type className="mr-1.5 h-3.5 w-3.5" />
              Text
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add text box</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => addShape('rectangle')}>
              <Square className="mr-1.5 h-3.5 w-3.5" />
              Rect
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add rectangle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => addShape('circle')}>
              <CircleIcon className="mr-1.5 h-3.5 w-3.5" />
              Circle
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add circle / ellipse</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => addShape('line')}>
              <Minus className="mr-1.5 h-3.5 w-3.5" />
              Line
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add line</TooltipContent>
        </Tooltip>

        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-xs font-medium transition-colors hover:bg-muted/50">
          <ImagePlus className="h-3.5 w-3.5" />
          Image
          <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
        </label>

        <div className="h-5 w-px bg-border" />

        <Button size="sm" variant="outline" onClick={addPage}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Page
        </Button>
        {pages > 1 && (
          <Button size="sm" variant="outline" onClick={deletePage}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Del Page
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} className="h-8 w-8 p-0">
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} className="h-8 w-8 p-0">
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
          <div className="h-5 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={() => setShowGrid((s) => !s)} className={cn('h-8 w-8 p-0', showGrid && 'bg-primary/10')}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle grid snapping</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background px-1">
            <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="h-7 w-7 p-0">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="w-10 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="h-7 w-7 p-0">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Page tabs */}
      {pages > 1 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
                currentPage === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <FileText className="h-3 w-3" />
              Page {p}
            </button>
          ))}
        </div>
      )}

      {/* Main editor area: canvas + side panel */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Canvas */}
        <div className="flex flex-1 justify-center overflow-auto rounded-xl border border-border/60 bg-muted/20 p-6">
          <div
            ref={canvasRef}
            className="relative shadow-lg"
            style={{
              width: dims.width * zoom,
              height: dims.height * zoom,
              backgroundColor: bgColor,
              backgroundImage: showGrid
                ? `linear-gradient(to right, hsl(var(--border) / 0.5) 1px, transparent 1px),
                   linear-gradient(to bottom, hsl(var(--border) / 0.5) 1px, transparent 1px)`
                : undefined,
              backgroundSize: showGrid ? `${10 * zoom}px ${10 * zoom}px` : undefined,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onClick={() => setSelectedId(null)}
          >
            {pageElements.map((el) => (
              <div
                key={el.id}
                onMouseDown={(e) => startDrag(e, el)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                className={cn(
                  'absolute cursor-move border-2 transition-colors',
                  selectedId === el.id
                    ? 'border-primary'
                    : 'border-transparent hover:border-primary/30',
                )}
                style={getElementStyle(el, dims, zoom)}
              >
                {el.type === 'text' && (
                  <div
                    style={{
                      fontFamily: FONT_MAP[el.fontFamily].css,
                      fontSize: el.fontSize * zoom,
                      fontWeight: el.bold ? 700 : 400,
                      fontStyle: el.italic ? 'italic' : 'normal',
                      textAlign: el.alignment,
                      direction: el.direction,
                      lineHeight: el.lineHeight,
                      letterSpacing: `${el.letterSpacing}px`,
                      color: el.color,
                      whiteSpace: 'pre-wrap',
                      width: '100%',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {el.text}
                  </div>
                )}
                {el.type === 'image' && (
                  <>
                    <img
                      src={`data:${el.mimeType};base64,${el.base64}`}
                      alt=""
                      className="pointer-events-none h-full w-full object-contain"
                      style={{ opacity: el.opacity }}
                      draggable={false}
                    />
                    {selectedId === el.id && (
                      <ResizeHandle el={el} onResize={startResize} zoom={zoom} />
                    )}
                  </>
                )}
                {el.type === 'shape' && (
                  <>
                    {el.shape === 'rectangle' && (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: el.fillColor !== 'transparent' ? el.fillColor : 'transparent',
                          border: `${el.strokeWidth * zoom}px solid ${el.strokeColor}`,
                          opacity: el.opacity,
                          borderRadius: '2px',
                        }}
                      />
                    )}
                    {el.shape === 'circle' && (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: el.fillColor !== 'transparent' ? el.fillColor : 'transparent',
                          border: `${el.strokeWidth * zoom}px solid ${el.strokeColor}`,
                          opacity: el.opacity,
                          borderRadius: '50%',
                        }}
                      />
                    )}
                    {el.shape === 'line' && (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: el.strokeColor,
                          opacity: el.opacity,
                        }}
                      />
                    )}
                    {selectedId === el.id && (
                      <ResizeHandle el={el} onResize={startResize} zoom={zoom} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-full shrink-0 lg:w-80">
          {selected ? (
            <PropertiesPanel
              selected={selected}
              updateElement={updateElement}
              deleteElement={deleteElement}
              duplicateElement={duplicateElement}
            />
          ) : (
            <PagePanel
              bgColor={bgColor}
              setBgColor={setBgColor}
              pageSize={pageSize}
              setPageSize={setPageSize}
              pages={pages}
              addPage={addPage}
              deletePage={deletePage}
              addText={addText}
              addShape={addShape}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={generatePdf} disabled={generating} size="lg" className="w-full">
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating PDF…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </>
        )}
      </Button>
    </div>
    </TooltipProvider>
  );
}

function getElementStyle(el: Element, dims: { width: number; height: number }, zoom: number): React.CSSProperties {
  const base: React.CSSProperties = {
    left: el.x * zoom,
    top: (dims.height - el.y) * zoom,
    transform: `rotate(${el.rotation}deg)`,
    transformOrigin: 'top left',
  };
  if (el.type === 'text') {
    return { ...base, width: el.width * zoom, minHeight: el.fontSize * zoom * el.lineHeight };
  }
  return { ...base, width: el.width * zoom, height: el.height * zoom };
}

function ResizeHandle({ el, onResize, zoom }: { el: ImageElement | ShapeElement; onResize: (e: React.MouseEvent, el: ImageElement | ShapeElement) => void; zoom: number }) {
  return (
    <div
      onMouseDown={(e) => onResize(e, el)}
      className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-full border-2 border-primary bg-white"
      style={{ transform: `scale(${1 / zoom})` }}
    />
  );
}

function PropertiesPanel({
  selected, updateElement, deleteElement, duplicateElement,
}: {
  selected: Element;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize">
          {selected.type === 'text' ? 'Text Properties' : selected.type === 'image' ? 'Image Properties' : 'Shape Properties'}
        </p>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={() => duplicateElement(selected.id)} className="h-7 w-7 p-0">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
          <Button size="sm" variant="ghost" onClick={() => deleteElement(selected.id)} className="h-7 w-7 p-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {selected.type === 'text' && <TextProperties el={selected} updateElement={updateElement} />}
      {selected.type === 'image' && <ImageProperties el={selected} updateElement={updateElement} />}
      {selected.type === 'shape' && <ShapeProperties el={selected} updateElement={updateElement} />}

      {/* Common: position & rotation */}
      <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">X</label>
            <input
              type="number"
              value={Math.round(selected.x)}
              onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) })}
              className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Y</label>
            <input
              type="number"
              value={Math.round(selected.y)}
              onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) })}
              className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotation</span>
            <span>{selected.rotation}°</span>
          </label>
          <Slider
            value={[selected.rotation]}
            min={0}
            max={360}
            step={1}
            onValueChange={(v) => updateElement(selected.id, { rotation: v[0] })}
          />
        </div>
      </div>
    </div>
  );
}

function TextProperties({ el, updateElement }: { el: TextElement; updateElement: (id: string, updates: Partial<Element>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Content</label>
        <textarea
          value={el.text}
          onChange={(e) => updateElement(el.id, { text: e.target.value } as Partial<TextElement>)}
          rows={4}
          className="w-full resize-none rounded-lg border border-border/60 bg-background p-2 text-sm outline-none focus:border-primary/40"
        />
      </div>

      {/* Font family */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Font Family</label>
        <select
          value={el.fontFamily}
          onChange={(e) => updateElement(el.id, { fontFamily: e.target.value as FontFamily } as Partial<TextElement>)}
          className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
        >
          {Object.entries(FONT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Bold / Italic */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={el.bold ? 'default' : 'outline'}
          onClick={() => updateElement(el.id, { bold: !el.bold } as Partial<TextElement>)}
          className="h-8 flex-1"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant={el.italic ? 'default' : 'outline'}
          onClick={() => updateElement(el.id, { italic: !el.italic } as Partial<TextElement>)}
          className="h-8 flex-1"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Font size */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Font Size</span>
          <span>{el.fontSize}px</span>
        </label>
        <Slider
          value={[el.fontSize]}
          min={6}
          max={72}
          step={1}
          onValueChange={(v) => updateElement(el.id, { fontSize: v[0] } as Partial<TextElement>)}
        />
      </div>

      {/* Line height */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Line Height</span>
          <span>{el.lineHeight.toFixed(1)}</span>
        </label>
        <Slider
          value={[el.lineHeight]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={(v) => updateElement(el.id, { lineHeight: v[0] } as Partial<TextElement>)}
        />
      </div>

      {/* Letter spacing */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Letter Spacing</span>
          <span>{el.letterSpacing}px</span>
        </label>
        <Slider
          value={[el.letterSpacing]}
          min={-2}
          max={10}
          step={0.5}
          onValueChange={(v) => updateElement(el.id, { letterSpacing: v[0] } as Partial<TextElement>)}
        />
      </div>

      {/* Width */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Text Box Width</span>
          <span>{Math.round(el.width)}px</span>
        </label>
        <Slider
          value={[el.width]}
          min={50}
          max={dims_width_max(el)}
          step={5}
          onValueChange={(v) => updateElement(el.id, { width: v[0] } as Partial<TextElement>)}
        />
      </div>

      {/* Alignment */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Alignment</label>
        <div className="flex gap-1">
          {([
            { val: 'left', icon: AlignLeft },
            { val: 'center', icon: AlignCenter },
            { val: 'right', icon: AlignRight },
            { val: 'justify', icon: AlignJustify },
          ] as const).map(({ val, icon: Icon }) => (
            <Button
              key={val}
              size="sm"
              variant={el.alignment === val ? 'default' : 'outline'}
              onClick={() => updateElement(el.id, { alignment: val } as Partial<TextElement>)}
              className="h-8 flex-1 p-0"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </div>

      {/* Direction (RTL/LTR) */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Text Direction</label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={el.direction === 'ltr' ? 'default' : 'outline'}
            onClick={() => updateElement(el.id, { direction: 'ltr' } as Partial<TextElement>)}
            className="h-8 flex-1"
          >
            <MoveRight className="mr-1.5 h-3.5 w-3.5" />
            LTR
          </Button>
          <Button
            size="sm"
            variant={el.direction === 'rtl' ? 'default' : 'outline'}
            onClick={() => updateElement(el.id, { direction: 'rtl' } as Partial<TextElement>)}
            className="h-8 flex-1"
          >
            <MoveLeft className="mr-1.5 h-3.5 w-3.5" />
            RTL
          </Button>
        </div>
      </div>

      {/* Color */}
      <ColorPicker
        label="Text Color"
        value={el.color}
        onChange={(c) => updateElement(el.id, { color: c } as Partial<TextElement>)}
      />
    </div>
  );
}

function dims_width_max(_el: TextElement): number {
  return 800;
}

function ImageProperties({ el, updateElement }: { el: ImageElement; updateElement: (id: string, updates: Partial<Element>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Width</label>
          <input
            type="number"
            value={Math.round(el.width)}
            onChange={(e) => {
              const w = Number(e.target.value);
              const ratio = el.height / el.width;
              updateElement(el.id, { width: w, height: w * ratio } as Partial<ImageElement>);
            }}
            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Height</label>
          <input
            type="number"
            value={Math.round(el.height)}
            onChange={(e) => {
              const h = Number(e.target.value);
              const ratio = el.width / el.height;
              updateElement(el.id, { height: h, width: h * ratio } as Partial<ImageElement>);
            }}
            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Opacity</span>
          <span>{Math.round(el.opacity * 100)}%</span>
        </label>
        <Slider
          value={[el.opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={(v) => updateElement(el.id, { opacity: v[0] } as Partial<ImageElement>)}
        />
      </div>
    </div>
  );
}

function ShapeProperties({ el, updateElement }: { el: ShapeElement; updateElement: (id: string, updates: Partial<Element>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Width</label>
          <input
            type="number"
            value={Math.round(el.width)}
            onChange={(e) => updateElement(el.id, { width: Number(e.target.value) } as Partial<ShapeElement>)}
            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Height</label>
          <input
            type="number"
            value={Math.round(el.height)}
            onChange={(e) => updateElement(el.id, { height: Number(e.target.value) } as Partial<ShapeElement>)}
            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {el.shape !== 'line' && (
        <ColorPicker
          label="Fill Color"
          value={el.fillColor}
          allowTransparent
          onChange={(c) => updateElement(el.id, { fillColor: c } as Partial<ShapeElement>)}
        />
      )}

      <ColorPicker
        label="Stroke Color"
        value={el.strokeColor}
        onChange={(c) => updateElement(el.id, { strokeColor: c } as Partial<ShapeElement>)}
      />

      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Stroke Width</span>
          <span>{el.strokeWidth}px</span>
        </label>
        <Slider
          value={[el.strokeWidth]}
          min={0}
          max={20}
          step={0.5}
          onValueChange={(v) => updateElement(el.id, { strokeWidth: v[0] } as Partial<ShapeElement>)}
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Opacity</span>
          <span>{Math.round(el.opacity * 100)}%</span>
        </label>
        <Slider
          value={[el.opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={(v) => updateElement(el.id, { opacity: v[0] } as Partial<ShapeElement>)}
        />
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange, allowTransparent }: { label: string; value: string; onChange: (c: string) => void; allowTransparent?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-lg border border-border/60 bg-background p-1"
        />
        <div className="flex flex-1 flex-wrap gap-1">
          {allowTransparent && (
            <button
              onClick={() => onChange('transparent')}
              className={cn(
                'h-6 w-6 rounded-md border-2 text-[10px] font-bold',
                value === 'transparent' ? 'border-primary' : 'border-border/60',
              )}
              style={{
                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              }}
              title="Transparent"
            />
          )}
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                'h-6 w-6 rounded-md border-2 transition-transform hover:scale-110',
                value === c ? 'border-primary' : 'border-border/60',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PagePanel({
  bgColor, setBgColor, pageSize, setPageSize, pages, addPage, deletePage, addText, addShape,
}: {
  bgColor: string;
  setBgColor: (c: string) => void;
  pageSize: string;
  setPageSize: (s: string) => void;
  pages: number;
  addPage: () => void;
  deletePage: () => void;
  addText: (preset?: Partial<TextElement>) => void;
  addShape: (s: ShapeType) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" />
        Quick Start
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Click the canvas to add elements, or use the quick actions below. Select any element to edit its properties.
      </p>

      <div className="space-y-3">
        <ColorPicker label="Page Background" value={bgColor} onChange={setBgColor} />

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Page Size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
          >
            {Object.entries(PAGE_SIZES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => addText()}>
            <Type className="mr-1.5 h-3.5 w-3.5" />
            Add Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => addShape('rectangle')}>
            <Square className="mr-1.5 h-3.5 w-3.5" />
            Shape
          </Button>
        </div>

        <div className="flex gap-2 border-t border-border/60 pt-3">
          <Button size="sm" variant="outline" onClick={addPage} className="flex-1">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Page
          </Button>
          {pages > 1 && (
            <Button size="sm" variant="outline" onClick={deletePage} className="flex-1">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
