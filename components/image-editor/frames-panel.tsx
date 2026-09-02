'use client';

import React from 'react';
import { Frame } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { FrameOptions, FrameStyle } from '@/lib/image/types';

interface FramesPanelProps {
  frame: FrameOptions;
  onChange: (frame: FrameOptions) => void;
}

const FRAME_STYLES: { id: FrameStyle; label: string; previewClass: string }[] = [
  { id: 'none', label: 'None', previewClass: 'border-0' },
  { id: 'thin', label: 'Thin', previewClass: 'border-[2px]' },
  { id: 'medium', label: 'Medium', previewClass: 'border-[4px]' },
  { id: 'thick', label: 'Thick', previewClass: 'border-[6px]' },
  { id: 'rounded', label: 'Rounded', previewClass: 'border-[3px] rounded-sm' },
  { id: 'shadow', label: 'Shadow', previewClass: 'border border-border/50 shadow-md' },
];

const PRESET_COLORS = ['#ffffff', '#000000', '#1e293b', '#f5f5f4', '#d4a76a', '#3b82f6'];

export function FramesPanel({ frame, onChange }: FramesPanelProps) {
  const isEnabled = frame.style !== 'none';

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Frame className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Frames</h3>
        </div>
        <p className="text-sm text-muted-foreground">Add borders and styling</p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Style</label>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onChange({ ...frame, style: style.id })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent",
                frame.style === style.id 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border/60 bg-card text-muted-foreground"
              )}
            >
              <div className={cn("w-6 h-6 border-current", style.previewClass)} />
              <span className="text-xs font-medium">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("space-y-6 transition-opacity", !isEnabled && "opacity-50 pointer-events-none")}>
        <div className="space-y-3">
          <label className="text-sm font-medium">Border Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ ...frame, color })}
                className={cn(
                  "w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110",
                  frame.color === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="flex-1 min-w-[100px]">
              <div className="flex items-center border border-border/60 rounded-md bg-background px-2 overflow-hidden h-8">
                <span className="text-muted-foreground text-xs mr-1">#</span>
                <input
                  type="text"
                  value={frame.color.replace('#', '')}
                  onChange={(e) => onChange({ ...frame, color: `#${e.target.value}` })}
                  className="bg-transparent border-none outline-none text-xs w-full h-full"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Padding</label>
            <span className="text-xs text-muted-foreground">{frame.padding}px</span>
          </div>
          <Slider
            value={[frame.padding]}
            min={0}
            max={80}
            step={1}
            onValueChange={([val]) => onChange({ ...frame, padding: val })}
          />
        </div>
      </div>
    </div>
  );
}
