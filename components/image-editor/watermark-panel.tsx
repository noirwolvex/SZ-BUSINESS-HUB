'use client';

import React from 'react';
import { Droplets } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WatermarkOptions, WatermarkPosition } from '@/lib/image/types';

interface WatermarkPanelProps {
  watermark: WatermarkOptions;
  onChange: (options: WatermarkOptions) => void;
  onApply: () => void;
}

const PRESET_COLORS = ['#ffffff', '#000000', '#94a3b8', '#ef4444', '#3b82f6'];

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center-left', label: 'Center Left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Center Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function WatermarkPanel({ watermark, onChange, onApply }: WatermarkPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Watermark Overlay</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Protect or brand your image with subtle custom watermark stamps.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Watermark Text</label>
        <Input
          value={watermark.text}
          onChange={(e) => onChange({ ...watermark, text: e.target.value })}
          placeholder="e.g. © 2026 My Brand"
          className="h-8 text-xs bg-card"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Opacity</label>
          <span className="font-mono text-xs text-primary">{Math.round(watermark.opacity * 100)}%</span>
        </div>
        <Slider
          value={[watermark.opacity]}
          min={0.05}
          max={1}
          step={0.05}
          onValueChange={([val]) => onChange({ ...watermark, opacity: val })}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Font Size</label>
          <span className="font-mono text-xs text-primary">{watermark.fontSize}px</span>
        </div>
        <Slider
          value={[watermark.fontSize]}
          min={12}
          max={96}
          step={1}
          onValueChange={([val]) => onChange({ ...watermark, fontSize: val })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...watermark, color })}
              className={cn(
                'w-7 h-7 rounded-md border shadow-sm transition-transform hover:scale-105',
                watermark.color.toLowerCase() === color.toLowerCase()
                  ? 'border-primary ring-2 ring-primary ring-offset-1'
                  : 'border-border/60',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="flex-1 min-w-[80px]">
            <Input
              value={watermark.color}
              onChange={(e) => onChange({ ...watermark, color: e.target.value })}
              className="h-7 text-xs font-mono px-2"
            />
          </div>
        </div>
      </div>

      {!watermark.tiled && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Stamp Position</label>
          <div className="grid grid-cols-3 gap-1.5 w-28 mx-auto p-1.5 bg-muted/40 rounded-xl border border-border/60">
            {POSITIONS.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange({ ...watermark, position: pos.id })}
                title={pos.label}
                className={cn(
                  'h-7 w-7 rounded-md border transition-all',
                  watermark.position === pos.id
                    ? 'bg-primary border-primary shadow-sm ring-1 ring-primary/40'
                    : 'bg-card border-border/60 hover:border-primary/40',
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-2.5 border border-border/60 rounded-xl bg-card">
        <div>
          <span className="text-xs font-semibold block">Diagonal Tiling</span>
          <span className="text-[10px] text-muted-foreground">Repeat across entire canvas</span>
        </div>
        <input
          type="checkbox"
          checked={watermark.tiled}
          onChange={(e) => onChange({ ...watermark, tiled: e.target.checked })}
          className="accent-primary w-4 h-4 cursor-pointer"
        />
      </div>

      <div className="pt-1">
        <Button
          onClick={onApply}
          disabled={!watermark.text.trim()}
          className="w-full shadow-sm"
          size="sm"
        >
          Stamp Watermark
        </Button>
      </div>
    </div>
  );
}
