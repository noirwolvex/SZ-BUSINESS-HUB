'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Crop,
  SlidersHorizontal,
  Sparkles,
  Download,
  Paintbrush,
  Type,
  Palette,
  Frame as FrameIcon,
  Scaling,
  Droplets,
  PanelRightClose,
  PanelRightOpen,
  Keyboard,
  Undo2,
  Redo2,
  RotateCcw,
  Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UploadArea } from './upload-area';
import { EditorCanvas } from './editor-canvas';
import { EditorToolbar } from './editor-toolbar';
import { AdjustmentsPanel } from './adjustments-panel';
import { EnhancementPanel } from './enhancement-panel';
import { BeforeAfter } from './before-after';
import { ExportControls } from './export-controls';
import { HistoryControls } from './history-controls';
import { CropTool } from './crop-tool';
import { FiltersPanel } from './filters-panel';
import { DrawPanel } from './draw-panel';
import { TextPanel } from './text-panel';
import { FramesPanel } from './frames-panel';
import { WatermarkPanel } from './watermark-panel';
import { ResizePanel } from './resize-panel';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { CanvasInfoBar } from './canvas-info-bar';
import {
  type AdjustmentValues,
  type AdjustKey,
  type ExportFormat,
  type EnhanceOperation,
  type EnhanceState,
  type HistoryEntry,
  type DrawSettings,
  type TextSettings,
  type FilterPresetName,
  type FrameOptions,
  type WatermarkOptions,
  type PanelTab,
  type EditorMode,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_DRAW_SETTINGS,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_FRAME,
  DEFAULT_WATERMARK,
} from '@/lib/image/types';
import { enhanceImage } from '@/lib/image/enhancement-service';
import { getPreset } from '@/lib/image/filter-presets';

type FabricCanvas = import('fabric').Canvas;
type FabricImage = import('fabric').FabricImage;

const MAX_HISTORY = 30;

export function ImageEditor() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [adjustments, setAdjustments] = useState<AdjustmentValues>(DEFAULT_ADJUSTMENTS);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [activeTab, setActiveTab] = useState<PanelTab>('adjust');
  const [panelOpen, setPanelOpen] = useState(true);
  const [enhanceState, setEnhanceState] = useState<EnhanceState>({
    status: 'idle',
    progress: 0,
    error: null,
    result: null,
  });
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Creative & Pro tools state
  const [activePreset, setActivePreset] = useState<FilterPresetName>('none');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [drawSettings, setDrawSettings] = useState<DrawSettings>(DEFAULT_DRAW_SETTINGS);
  const [textSettings, setTextSettings] = useState<TextSettings>(DEFAULT_TEXT_SETTINGS);
  const [hasSelectedText, setHasSelectedText] = useState(false);
  const [frameOptions, setFrameOptions] = useState<FrameOptions>(DEFAULT_FRAME);
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>(DEFAULT_WATERMARK);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [showFramesModal, setShowFramesModal] = useState(false);

  const fabricRef = useRef<FabricCanvas | null>(null);
  const imgRef = useRef<FabricImage | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(
    (label: string, stateOverride?: Partial<HistoryEntry>) => {
      const entry: HistoryEntry = {
        adjustments: stateOverride?.adjustments ?? adjustments,
        rotation: stateOverride?.rotation ?? rotation,
        flipX: stateOverride?.flipX ?? flipX,
        flipY: stateOverride?.flipY ?? flipY,
        cropRect: stateOverride?.cropRect ?? null,
        label,
      };
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const next = [...truncated, entry];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [adjustments, rotation, flipX, flipY, historyIndex],
  );

  // Apply Adjustments + Filter Presets combined
  const applyFilters = useCallback(async () => {
    if (!imgRef.current || !fabricRef.current) return;
    const fabric = await import('fabric');
    const filters: import('fabric').filters.BaseFilter<string>[] = [];

    const preset = getPreset(activePreset);
    const intensityFactor = activePreset === 'none' ? 0 : filterIntensity / 100;

    const totalBrightness = (adjustments.brightness + preset.brightness * intensityFactor) / 100;
    const totalContrast = (adjustments.contrast + preset.contrast * intensityFactor) / 100;
    const totalSaturation = (adjustments.saturation + preset.saturation * intensityFactor) / 100;
    const totalGrayscale = Math.min(100, adjustments.grayscale + preset.grayscale * intensityFactor);
    const totalSepia = Math.min(100, adjustments.sepia + preset.sepia * intensityFactor);
    const totalHue = (adjustments.hue + preset.hue * intensityFactor) % 360;

    if (totalBrightness !== 0) {
      filters.push(
        new fabric.filters.Brightness({
          brightness: Math.max(-1, Math.min(1, totalBrightness)),
        }),
      );
    }
    if (totalContrast !== 0) {
      filters.push(
        new fabric.filters.Contrast({
          contrast: Math.max(-1, Math.min(1, totalContrast)),
        }),
      );
    }
    if (totalSaturation !== 0) {
      filters.push(
        new fabric.filters.Saturation({
          saturation: Math.max(-1, Math.min(1, totalSaturation)),
        }),
      );
    }
    if (adjustments.exposure !== 0) {
      filters.push(
        new fabric.filters.BlendColor({
          color: adjustments.exposure > 0 ? '#ffffff' : '#000000',
          mode: 'tint',
          alpha: Math.min(1, Math.abs(adjustments.exposure) / 150),
        }),
      );
    }
    if (adjustments.blur > 0) {
      filters.push(new fabric.filters.Blur({ blur: Math.min(1, adjustments.blur / 10) }));
    }
    if (adjustments.sharpen > 0) {
      const w = 4 + (adjustments.sharpen / 10) * 4;
      filters.push(
        new fabric.filters.Convolute({
          matrix: [0, -1, 0, -1, w, -1, 0, -1, 0],
        }),
      );
    }
    if (totalGrayscale > 0) {
      filters.push(new fabric.filters.Grayscale());
    }
    if (totalSepia > 0) {
      filters.push(new fabric.filters.Sepia());
    }
    if (totalHue > 0) {
      filters.push(
        new fabric.filters.HueRotation({
          rotation: (totalHue / 180) - 1,
        }),
      );
    }
    if (preset.blendColor && preset.blendAlpha && intensityFactor > 0) {
      filters.push(
        new fabric.filters.BlendColor({
          color: preset.blendColor,
          mode: 'tint',
          alpha: Math.min(1, preset.blendAlpha * intensityFactor),
        }),
      );
    }

    imgRef.current.filters = filters;
    imgRef.current.applyFilters();
    imgRef.current.set('opacity', adjustments.opacity);
    fabricRef.current.requestRenderAll();
  }, [adjustments, activePreset, filterIntensity]);

  useEffect(() => {
    if (imageDataUrl) applyFilters();
  }, [adjustments, activePreset, filterIntensity, applyFilters, imageDataUrl]);

  useEffect(() => {
    if (!imgRef.current) return;
    imgRef.current.set({
      angle: rotation,
      flipX,
      flipY,
    });
    fabricRef.current?.requestRenderAll();
  }, [rotation, flipX, flipY]);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageDataUrl(url);
    setOriginalDataUrl(url);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePreset('none');
    setFilterIntensity(100);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setEnhancedUrl(null);
    setEnhanceState({ status: 'idle', progress: 0, error: null, result: null });
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    fabricRef.current = canvas;
  }, []);

  const handleImageLoaded = useCallback(
    (img: FabricImage) => {
      imgRef.current = img;
      if (img.width && img.height) {
        setImageDimensions({ width: img.width, height: img.height });
      }
      applyFilters();
    },
    [applyFilters],
  );

  const handleAdjust = useCallback((key: AdjustKey, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    pushHistory('Reset adjustments');
  }, [pushHistory]);

  const handleRotate = useCallback(
    (dir: 'left' | 'right') => {
      const newRotation = dir === 'left' ? rotation - 90 : rotation + 90;
      setRotation(newRotation);
      pushHistory(`Rotate ${dir}`);
    },
    [rotation, pushHistory],
  );

  const handleFlip = useCallback(
    (axis: 'x' | 'y') => {
      if (axis === 'x') {
        setFlipX((v) => !v);
        pushHistory('Flip horizontal');
      } else {
        setFlipY((v) => !v);
        pushHistory('Flip vertical');
      }
    },
    [pushHistory],
  );

  const handleRemove = useCallback(() => {
    setImageDataUrl(null);
    setOriginalDataUrl(null);
    setImageDimensions(null);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePreset('none');
    setHistory([]);
    setHistoryIndex(-1);
    setEnhancedUrl(null);
    if (fabricRef.current) {
      fabricRef.current.remove(...fabricRef.current.getObjects());
      fabricRef.current.requestRenderAll();
    }
    imgRef.current = null;
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat, quality: number, multiplier: number = 2) => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;
      const dataUrl = canvas.toDataURL({
        format,
        quality,
        multiplier,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `enhanced-design.${format}`;
      link.click();
    },
    [],
  );

  const handleCopyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!fabricRef.current) return false;
    try {
      const dataUrl = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  }, []);

  const handleEnhance = useCallback(
    async (operation: EnhanceOperation, scale?: 2 | 4) => {
      if (!imageDataUrl) return;
      setEnhanceState({ status: 'preparing', progress: 10, error: null, result: null });
      try {
        await new Promise((r) => setTimeout(r, 100));
        setEnhanceState((s) => ({ ...s, status: 'enhancing', progress: 40 }));
        const result = await enhanceImage(imageDataUrl, { operation, scale: scale ?? 2 });
        setEnhanceState((s) => ({ ...s, status: 'finalizing', progress: 80 }));
        await new Promise((r) => setTimeout(r, 100));
        setEnhancedUrl(result.dataUrl);
        setImageDataUrl(result.dataUrl);
        setImageDimensions({ width: result.width, height: result.height });
        setEnhanceState({ status: 'done', progress: 100, error: null, result });
        setShowCompare(true);
        pushHistory(`AI Enhance: ${operation}`);
      } catch (err) {
        setEnhanceState({
          status: 'error',
          progress: 0,
          error: err instanceof Error ? err.message : 'Enhancement failed.',
          result: null,
        });
      }
    },
    [imageDataUrl, pushHistory],
  );

  const handleCropApply = useCallback(
    async (rect: { x: number; y: number; width: number; height: number }) => {
      if (!originalDataUrl && !imageDataUrl) return;
      const sourceUrl = imageDataUrl!;
      const img = new Image();
      img.src = sourceUrl;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      const croppedUrl = canvas.toDataURL('image/png');
      setImageDataUrl(croppedUrl);
      setImageDimensions({ width: canvas.width, height: canvas.height });
      setMode('edit');
      pushHistory('Crop');
    },
    [imageDataUrl, originalDataUrl, pushHistory],
  );

  // Resize Handler
  const handleResizeApply = useCallback(
    async (targetWidth: number, targetHeight: number) => {
      if (!imageDataUrl) return;
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const resizedUrl = canvas.toDataURL('image/png');
      setImageDataUrl(resizedUrl);
      setImageDimensions({ width: targetWidth, height: targetHeight });
      setShowResizeModal(false);
      pushHistory(`Resize: ${targetWidth}×${targetHeight}`);
    },
    [imageDataUrl, pushHistory],
  );

  // Text Tool Handlers
  const handleAddText = useCallback(async () => {
    if (!fabricRef.current) return;
    const fabric = await import('fabric');
    const canvas = fabricRef.current;

    const shadow = textSettings.shadow
      ? new fabric.Shadow({
          color: 'rgba(0,0,0,0.6)',
          blur: textSettings.shadowBlur,
          offsetX: 2,
          offsetY: 2,
        })
      : null;

    const text = new fabric.IText('Add your title', {
      left: canvas.getWidth() / 2 - 100,
      top: canvas.getHeight() / 2 - 20,
      fontFamily: textSettings.fontFamily,
      fontSize: textSettings.fontSize,
      fill: textSettings.color,
      fontWeight: textSettings.bold ? 'bold' : 'normal',
      fontStyle: textSettings.italic ? 'italic' : 'normal',
      underline: textSettings.underline,
      textAlign: textSettings.align,
      shadow: shadow ?? undefined,
      cornerColor: '#00d2b4',
      cornerStrokeColor: '#ffffff',
      cornerSize: 8,
      transparentCorners: false,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    setHasSelectedText(true);
    pushHistory('Add text');
  }, [textSettings, pushHistory]);

  const handleDeleteText = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setHasSelectedText(false);
      pushHistory('Delete text');
    }
  }, [pushHistory]);

  // Sync text settings changes to active object if selected
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const active = canvas.getActiveObject();
    if (active && (active.type === 'i-text' || active.type === 'text')) {
      (async () => {
        const fabric = await import('fabric');
        const shadow = textSettings.shadow
          ? new fabric.Shadow({
              color: 'rgba(0,0,0,0.6)',
              blur: textSettings.shadowBlur,
              offsetX: 2,
              offsetY: 2,
            })
          : null;

        active.set({
          fontFamily: textSettings.fontFamily,
          fontSize: textSettings.fontSize,
          fill: textSettings.color,
          fontWeight: textSettings.bold ? 'bold' : 'normal',
          fontStyle: textSettings.italic ? 'italic' : 'normal',
          underline: textSettings.underline,
          textAlign: textSettings.align,
          shadow: shadow ?? undefined,
        });
        canvas.requestRenderAll();
      })();
    }
  }, [textSettings]);

  // Clear all drawings
  const handleClearDrawings = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    const paths = objects.filter((o) => o.type === 'path');
    paths.forEach((p) => canvas.remove(p));
    canvas.requestRenderAll();
    pushHistory('Clear drawings');
  }, [pushHistory]);

  // Apply Watermark Stamp
  const handleApplyWatermark = useCallback(async () => {
    if (!fabricRef.current || !watermarkOptions.text.trim()) return;
    const fabric = await import('fabric');
    const canvas = fabricRef.current;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();

    if (watermarkOptions.tiled) {
      const stepX = 180;
      const stepY = 120;
      for (let x = 40; x < cw; x += stepX) {
        for (let y = 40; y < ch; y += stepY) {
          const wm = new fabric.FabricText(watermarkOptions.text, {
            left: x,
            top: y,
            fontSize: watermarkOptions.fontSize * 0.75,
            fill: watermarkOptions.color,
            opacity: watermarkOptions.opacity * 0.7,
            angle: -25,
            selectable: true,
          });
          canvas.add(wm);
        }
      }
    } else {
      let left = 40;
      let top = 40;
      const margin = 30;

      if (watermarkOptions.position.includes('center')) {
        left = cw / 2 - 60;
      } else if (watermarkOptions.position.includes('right')) {
        left = cw - 160 - margin;
      } else {
        left = margin;
      }

      if (watermarkOptions.position.startsWith('center') || watermarkOptions.position === 'center') {
        top = ch / 2 - 20;
      } else if (watermarkOptions.position.startsWith('bottom')) {
        top = ch - 50 - margin;
      } else {
        top = margin;
      }

      const wm = new fabric.FabricText(watermarkOptions.text, {
        left,
        top,
        fontSize: watermarkOptions.fontSize,
        fill: watermarkOptions.color,
        opacity: watermarkOptions.opacity,
        selectable: true,
      });
      canvas.add(wm);
    }

    canvas.requestRenderAll();
    setShowWatermarkModal(false);
    pushHistory(`Watermark: ${watermarkOptions.text}`);
  }, [watermarkOptions, pushHistory]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    if (!entry) return;
    setAdjustments(entry.adjustments);
    setRotation(entry.rotation);
    setFlipX(entry.flipX);
    setFlipY(entry.flipY);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    if (!entry) return;
    setAdjustments(entry.adjustments);
    setRotation(entry.rotation);
    setFlipX(entry.flipX);
    setFlipY(entry.flipY);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex]);

  const handleResetAll = useCallback(() => {
    if (!originalDataUrl) return;
    setImageDataUrl(originalDataUrl);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActivePreset('none');
    setFilterIntensity(100);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setEnhancedUrl(null);
    setHistory([]);
    setHistoryIndex(-1);
  }, [originalDataUrl]);

  const handleFit = useCallback(() => setZoom(1), []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when typing inside input / textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExport('png', 0.95, 2);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFit();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom((z) => Math.min(5, z + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => Math.max(0.1, z - 0.25));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelectedText) {
          e.preventDefault();
          handleDeleteText();
        }
      } else if (e.key === 'Escape') {
        setMode('edit');
        setShowResizeModal(false);
        setShowWatermarkModal(false);
        setShowFramesModal(false);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleExport, handleFit, hasSelectedText, handleDeleteText]);

  if (!imageDataUrl) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">Professional Image Studio</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
              Edit, adjust, draw, design typography, and AI-enhance your images with full creative freedom.
            </p>
          </div>
          <UploadArea onUpload={handleUpload} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FeatureBadge icon={Sparkles} label="AI Super-Resolution" />
          <FeatureBadge icon={Palette} label="16 Filter Looks" />
          <FeatureBadge icon={Paintbrush} label="Brush & Paint" />
          <FeatureBadge icon={Type} label="Typography Studio" />
        </div>
      </div>
    );
  }

  const isDrawingTab = activeTab === 'draw';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3">
      {/* Top bar with quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card/60 backdrop-blur-md p-2.5 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2">
          <HistoryControls
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleResetAll}
          />
          <Button
            variant={mode === 'crop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(mode === 'crop' ? 'edit' : 'crop')}
            className="h-9 font-medium"
          >
            <Crop className="mr-1.5 h-4 w-4" />
            Crop
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompare(!showCompare)}
            disabled={!enhancedUrl}
            className="h-9"
          >
            <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
            Compare
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelOpen(!panelOpen)}
            className="h-9 md:hidden"
          >
            {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Mode: Crop Mode vs Studio Canvas */}
      {mode === 'crop' ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <CropTool
            imageDataUrl={imageDataUrl}
            onApply={handleCropApply}
            onCancel={() => setMode('edit')}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Canvas area */}
          <div className="flex-1 space-y-3">
            <div className="relative h-[460px] md:h-[540px] rounded-2xl border border-border/60 bg-card p-2 shadow-inner overflow-hidden flex flex-col justify-between">
              {showCompare && enhancedUrl && originalDataUrl ? (
                <BeforeAfter
                  beforeUrl={originalDataUrl}
                  afterUrl={imageDataUrl}
                  beforeLabel="Original"
                  afterLabel="Enhanced"
                />
              ) : (
                <EditorCanvas
                  imageDataUrl={imageDataUrl}
                  zoom={zoom}
                  drawingMode={isDrawingTab}
                  drawSettings={drawSettings}
                  onReady={handleCanvasReady}
                  onImageLoaded={handleImageLoaded}
                  onObjectSelected={(type) => setHasSelectedText(type === 'i-text' || type === 'text')}
                />
              )}

              {/* Bottom Canvas Info Bar */}
              {imageDimensions && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <CanvasInfoBar
                    zoom={zoom}
                    width={imageDimensions.width}
                    height={imageDimensions.height}
                  />
                </div>
              )}
            </div>

            {/* Bottom Toolbar */}
            <EditorToolbar
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(5, z + 0.25))}
              onZoomOut={() => setZoom((z) => Math.max(0.1, z - 0.25))}
              onFit={handleFit}
              onRotateLeft={() => handleRotate('left')}
              onRotateRight={() => handleRotate('right')}
              onFlipX={() => handleFlip('x')}
              onFlipY={() => handleFlip('y')}
              onResize={() => setShowResizeModal(true)}
              onWatermark={() => setShowWatermarkModal(true)}
              onFrame={() => setShowFramesModal(true)}
              onShortcuts={() => setShortcutsOpen(true)}
              resizeActive={showResizeModal}
              watermarkActive={showWatermarkModal}
              frameActive={showFramesModal}
              onReplace={() => document.getElementById('replace-input')?.click()}
              onRemove={handleRemove}
            />

            <input
              id="replace-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* Right Professional Studio Panel */}
          <div className={cn('lg:w-80 lg:shrink-0', !panelOpen && 'hidden lg:block')}>
            <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              {/* Tab Navigation: 5 Creative Tabs */}
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-muted/50 p-1">
                <TabButton
                  active={activeTab === 'adjust'}
                  onClick={() => setActiveTab('adjust')}
                  title="Adjustments & AI"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Adjust</span>
                </TabButton>

                <TabButton
                  active={activeTab === 'filters'}
                  onClick={() => setActiveTab('filters')}
                  title="Creative Filters"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Filters</span>
                </TabButton>

                <TabButton
                  active={activeTab === 'draw'}
                  onClick={() => setActiveTab('draw')}
                  title="Drawing & Paint"
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Draw</span>
                </TabButton>

                <TabButton
                  active={activeTab === 'text'}
                  onClick={() => setActiveTab('text')}
                  title="Typography & Text"
                >
                  <Type className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Text</span>
                </TabButton>

                <TabButton
                  active={activeTab === 'export'}
                  onClick={() => setActiveTab('export')}
                  title="Export & Download"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Export</span>
                </TabButton>
              </div>

              {/* Panel Content Area */}
              <div className="max-h-[500px] overflow-y-auto pr-1">
                {activeTab === 'adjust' && (
                  <div className="space-y-6">
                    <AdjustmentsPanel
                      values={adjustments}
                      onChange={handleAdjust}
                      onReset={handleResetAdjustments}
                    />

                    <div className="pt-2 border-t border-border/60">
                      <EnhancementPanel
                        state={enhanceState}
                        onEnhance={handleEnhance}
                        disabled={!imageDataUrl}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'filters' && (
                  <FiltersPanel
                    imageDataUrl={imageDataUrl}
                    activePreset={activePreset}
                    intensity={filterIntensity}
                    onPresetChange={setActivePreset}
                    onIntensityChange={setFilterIntensity}
                  />
                )}

                {activeTab === 'draw' && (
                  <DrawPanel
                    drawSettings={drawSettings}
                    onSettingsChange={setDrawSettings}
                    onClearDrawings={handleClearDrawings}
                    isActive={isDrawingTab}
                  />
                )}

                {activeTab === 'text' && (
                  <TextPanel
                    textSettings={textSettings}
                    onSettingsChange={setTextSettings}
                    onAddText={handleAddText}
                    onDeleteText={handleDeleteText}
                    hasSelectedText={hasSelectedText}
                  />
                )}

                {activeTab === 'export' && (
                  <ExportControls
                    onExport={handleExport}
                    onCopyToClipboard={handleCopyToClipboard}
                    disabled={!imageDataUrl}
                    imageDimensions={imageDimensions}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resize Modal Panel */}
      {showResizeModal && imageDimensions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <ResizePanel
            currentWidth={imageDimensions.width}
            currentHeight={imageDimensions.height}
            onResize={handleResizeApply}
            onClose={() => setShowResizeModal(false)}
          />
        </div>
      )}

      {/* Watermark Modal Panel */}
      {showWatermarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-card p-5 rounded-2xl border border-border/60 shadow-2xl space-y-4">
            <WatermarkPanel
              watermark={watermarkOptions}
              onChange={setWatermarkOptions}
              onApply={handleApplyWatermark}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWatermarkModal(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Frames Modal Panel */}
      {showFramesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-card p-5 rounded-2xl border border-border/60 shadow-2xl space-y-4">
            <FramesPanel
              frame={frameOptions}
              onChange={setFrameOptions}
            />
            <Button
              size="sm"
              onClick={() => setShowFramesModal(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Overlay Modal */}
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 shadow-sm hover:border-primary/40 transition-colors">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-semibold text-center text-foreground/80">{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 font-medium transition-all',
        active
          ? 'bg-background text-primary shadow-sm ring-1 ring-border/40 font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
      )}
    >
      {children}
    </button>
  );
}
