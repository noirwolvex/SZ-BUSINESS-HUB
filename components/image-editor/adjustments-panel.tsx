'use client';

import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { type AdjustmentValues, type AdjustKey, DEFAULT_ADJUSTMENTS } from '@/lib/image/types';
import { cn } from '@/lib/utils';

interface AdjustmentsPanelProps {
  values: AdjustmentValues;
  onChange: (key: AdjustKey, value: number) => void;
  onReset: () => void;
}

interface SliderConfig {
  key: AdjustKey;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  display?: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}` },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}` },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}` },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}` },
  { key: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1, defaultValue: 0, display: (v) => v.toFixed(1) },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 10, step: 0.1, defaultValue: 0, display: (v) => v.toFixed(1) },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}%` },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, step: 1, defaultValue: 0, display: (v) => `${v}%` },
  { key: 'hue', label: 'Hue', min: 0, max: 360, step: 1, defaultValue: 0, display: (v) => `${v}°` },
  { key: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1, defaultValue: 100, display: (v) => `${v}%` },
];

export function AdjustmentsPanel({ values, onChange, onReset }: AdjustmentsPanelProps) {
  const hasChanges = (Object.keys(values) as AdjustKey[]).some(
    (k) => values[k] !== DEFAULT_ADJUSTMENTS[k],
  );

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Adjustments</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasChanges}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset
        </Button>
      </div>
      <div className="space-y-3">
        {SLIDERS.map((cfg) => {
          const rawValue = values[cfg.key];
          const displayValue = cfg.key === 'opacity' ? Math.round(rawValue * 100) : rawValue;
          const isModified = cfg.key === 'opacity'
            ? rawValue !== DEFAULT_ADJUSTMENTS[cfg.key]
            : rawValue !== cfg.defaultValue;
          return (
            <div key={cfg.key} className={cn('rounded-lg px-2 py-1.5 transition-colors', isModified && 'bg-primary/5')}>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {cfg.label}
                </label>
                <span className={cn('font-mono text-xs', isModified ? 'text-primary' : 'text-muted-foreground')}>
                  {cfg.display ? cfg.display(rawValue) : `${rawValue}`}
                </span>
              </div>
              <Slider
                value={[displayValue]}
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                onValueChange={([v]) => {
                  const actualValue = cfg.key === 'opacity' ? v / 100 : v;
                  onChange(cfg.key, actualValue);
                }}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
