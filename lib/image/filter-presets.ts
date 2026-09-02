import { type FilterPresetConfig, type FilterPresetName } from './types';

export const FILTER_PRESETS: FilterPresetConfig[] = [
  { name: 'none', label: 'Original', brightness: 0, contrast: 0, saturation: 0, hue: 0, sepia: 0, grayscale: 0 },
  { name: 'vivid', label: 'Vivid', brightness: 10, contrast: 25, saturation: 40, hue: 0, sepia: 0, grayscale: 0 },
  { name: 'matte', label: 'Matte', brightness: 10, contrast: -15, saturation: -10, hue: 0, sepia: 0, grayscale: 0, blendColor: '#f5f0e8', blendAlpha: 0.08 },
  { name: 'noir', label: 'Noir', brightness: -5, contrast: 35, saturation: 0, hue: 0, sepia: 0, grayscale: 100 },
  { name: 'warm-sunset', label: 'Warm Sunset', brightness: 8, contrast: 10, saturation: 15, hue: 15, sepia: 15, grayscale: 0, blendColor: '#ff9944', blendAlpha: 0.1 },
  { name: 'cool-breeze', label: 'Cool Breeze', brightness: 5, contrast: 5, saturation: -5, hue: 200, sepia: 0, grayscale: 0, blendColor: '#4488cc', blendAlpha: 0.08 },
  { name: 'vintage-film', label: 'Vintage', brightness: 5, contrast: 15, saturation: -20, hue: 15, sepia: 30, grayscale: 0, blendColor: '#d4a76a', blendAlpha: 0.12 },
  { name: 'faded', label: 'Faded', brightness: 15, contrast: -20, saturation: -25, hue: 0, sepia: 10, grayscale: 0 },
  { name: 'dramatic', label: 'Dramatic', brightness: -10, contrast: 45, saturation: 10, hue: 0, sepia: 0, grayscale: 0 },
  { name: 'cinematic', label: 'Cinematic', brightness: -5, contrast: 20, saturation: -10, hue: 195, sepia: 5, grayscale: 0, blendColor: '#2d4a5a', blendAlpha: 0.1 },
  { name: 'polaroid', label: 'Polaroid', brightness: 12, contrast: -5, saturation: -15, hue: 10, sepia: 15, grayscale: 0, blendColor: '#f0e6d3', blendAlpha: 0.1 },
  { name: 'lomo', label: 'Lomo', brightness: 5, contrast: 30, saturation: 35, hue: 0, sepia: 0, grayscale: 0 },
  { name: 'cross-process', label: 'Cross Process', brightness: 5, contrast: 20, saturation: 25, hue: 120, sepia: 0, grayscale: 0, blendColor: '#33cc66', blendAlpha: 0.06 },
  { name: 'sepia-dream', label: 'Sepia Dream', brightness: 10, contrast: 5, saturation: -30, hue: 30, sepia: 60, grayscale: 0 },
  { name: 'nordic', label: 'Nordic', brightness: 8, contrast: 10, saturation: -20, hue: 210, sepia: 0, grayscale: 0, blendColor: '#c0d8e8', blendAlpha: 0.1 },
  { name: 'desert', label: 'Desert', brightness: 10, contrast: 15, saturation: -10, hue: 25, sepia: 20, grayscale: 0, blendColor: '#d4a060', blendAlpha: 0.08 },
  { name: 'moonlight', label: 'Moonlight', brightness: -5, contrast: 15, saturation: -30, hue: 220, sepia: 0, grayscale: 0, blendColor: '#334466', blendAlpha: 0.15 },
];

export function getPreset(name: FilterPresetName): FilterPresetConfig {
  return FILTER_PRESETS.find((p) => p.name === name) || FILTER_PRESETS[0];
}

/**
 * Generate a small thumbnail with the filter applied using raw pixel manipulation.
 * Used for the filter gallery preview grid.
 */
export function generateThumbnail(
  imageDataUrl: string,
  preset: FilterPresetConfig,
  size: number = 64,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Center-crop to fill thumbnail
      const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);

      if (preset.name === 'none') {
        resolve(canvas.toDataURL('image/jpeg', 0.6));
        return;
      }

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      const brightnessAdj = preset.brightness * 2.55;
      const contrastFactor =
        (259 * (preset.contrast + 255)) / (255 * (259 - preset.contrast));
      const saturationAdj = 1 + preset.saturation / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness
        r += brightnessAdj;
        g += brightnessAdj;
        b += brightnessAdj;

        // Contrast
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;

        // Saturation
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + saturationAdj * (r - gray);
        g = gray + saturationAdj * (g - gray);
        b = gray + saturationAdj * (b - gray);

        // Grayscale
        if (preset.grayscale > 0) {
          const gs = preset.grayscale / 100;
          const grayVal = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = r * (1 - gs) + grayVal * gs;
          g = g * (1 - gs) + grayVal * gs;
          b = b * (1 - gs) + grayVal * gs;
        }

        // Sepia
        if (preset.sepia > 0) {
          const s = preset.sepia / 100;
          const sr = 0.393 * r + 0.769 * g + 0.189 * b;
          const sg = 0.349 * r + 0.686 * g + 0.168 * b;
          const sb = 0.272 * r + 0.534 * g + 0.131 * b;
          r = r * (1 - s) + sr * s;
          g = g * (1 - s) + sg * s;
          b = b * (1 - s) + sb * s;
        }

        // Blend
        if (preset.blendColor && preset.blendAlpha) {
          const hex = preset.blendColor;
          const br = parseInt(hex.slice(1, 3), 16);
          const bg = parseInt(hex.slice(3, 5), 16);
          const bb = parseInt(hex.slice(5, 7), 16);
          const a = preset.blendAlpha;
          r = r * (1 - a) + br * a;
          g = g * (1 - a) + bg * a;
          b = b * (1 - a) + bb * a;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve('');
    img.src = imageDataUrl;
  });
}
