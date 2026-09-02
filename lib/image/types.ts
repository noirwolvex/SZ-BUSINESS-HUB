export interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  blur: number;
  sharpen: number;
  grayscale: number;
  sepia: number;
  hue: number;
  opacity: number;
}

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  blur: 0,
  sharpen: 0,
  grayscale: 0,
  sepia: 0,
  hue: 0,
  opacity: 1,
};

export type AdjustKey = keyof AdjustmentValues;

export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type CropPreset = 'free' | 'square' | '16:9' | '4:3' | '3:2' | '1:1';

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export type EnhanceOperation = 'auto' | '2x' | '4x' | 'sharpen' | 'decompress' | 'clarity';

export interface EnhanceOptions {
  operation: EnhanceOperation;
  scale?: 2 | 4;
}

export interface EnhanceResult {
  dataUrl: string;
  width: number;
  height: number;
}

export type EnhanceStatus = 'idle' | 'preparing' | 'uploading' | 'enhancing' | 'finalizing' | 'done' | 'error';

export interface EnhanceState {
  status: EnhanceStatus;
  progress: number;
  error: string | null;
  result: EnhanceResult | null;
}

export interface HistoryEntry {
  adjustments: AdjustmentValues;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  cropRect: CropRect | null;
  label: string;
}

/* ──────────────────────────────────────
   Drawing Tools
   ────────────────────────────────────── */

export type DrawTool = 'brush' | 'eraser' | 'highlighter';

export interface DrawSettings {
  tool: DrawTool;
  color: string;
  size: number;
}

export const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  tool: 'brush',
  color: '#ef4444',
  size: 4,
};

/* ──────────────────────────────────────
   Text Overlay
   ────────────────────────────────────── */

export interface TextSettings {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
  shadowBlur: number;
  background: boolean;
  backgroundColor: string;
}

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  fontFamily: 'Inter',
  fontSize: 32,
  color: '#ffffff',
  bold: false,
  italic: false,
  underline: false,
  align: 'center',
  shadow: false,
  shadowBlur: 4,
  background: false,
  backgroundColor: 'rgba(0,0,0,0.5)',
};

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Space Mono', label: 'Space Mono' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Lora', label: 'Lora' },
] as const;

/* ──────────────────────────────────────
   Filter Presets
   ────────────────────────────────────── */

export type FilterPresetName =
  | 'none' | 'vivid' | 'matte' | 'noir' | 'warm-sunset' | 'cool-breeze'
  | 'vintage-film' | 'faded' | 'dramatic' | 'cinematic' | 'polaroid'
  | 'lomo' | 'cross-process' | 'sepia-dream' | 'nordic' | 'desert' | 'moonlight';

export interface FilterPresetConfig {
  name: FilterPresetName;
  label: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  grayscale: number;
  blendColor?: string;
  blendAlpha?: number;
}

/* ──────────────────────────────────────
   Frames & Borders
   ────────────────────────────────────── */

export type FrameStyle = 'none' | 'thin' | 'medium' | 'thick' | 'rounded' | 'shadow';

export interface FrameOptions {
  style: FrameStyle;
  color: string;
  padding: number;
}

export const DEFAULT_FRAME: FrameOptions = {
  style: 'none',
  color: '#ffffff',
  padding: 0,
};

/* ──────────────────────────────────────
   Watermark
   ────────────────────────────────────── */

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  position: WatermarkPosition;
  tiled: boolean;
  color: string;
}

export const DEFAULT_WATERMARK: WatermarkOptions = {
  text: '',
  opacity: 0.3,
  fontSize: 24,
  position: 'bottom-right',
  tiled: false,
  color: '#ffffff',
};

/* ──────────────────────────────────────
   Resize
   ────────────────────────────────────── */

export interface ResizePreset {
  label: string;
  width: number;
  height: number;
  category: string;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { label: 'Instagram Story', width: 1080, height: 1920, category: 'Social' },
  { label: 'Twitter Post', width: 1200, height: 675, category: 'Social' },
  { label: 'Facebook Cover', width: 820, height: 312, category: 'Social' },
  { label: 'YouTube Thumb', width: 1280, height: 720, category: 'Social' },
  { label: 'LinkedIn Banner', width: 1584, height: 396, category: 'Social' },
  { label: 'HD 1080p', width: 1920, height: 1080, category: 'Display' },
  { label: '4K UHD', width: 3840, height: 2160, category: 'Display' },
  { label: 'A4 300dpi', width: 2480, height: 3508, category: 'Print' },
  { label: 'Letter 300dpi', width: 2550, height: 3300, category: 'Print' },
];

/* ──────────────────────────────────────
   Editor Layout
   ────────────────────────────────────── */

export type PanelTab = 'adjust' | 'filters' | 'draw' | 'text' | 'export';
export type EditorMode = 'edit' | 'crop' | 'draw' | 'resize' | 'watermark';
