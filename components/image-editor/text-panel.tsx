'use client';

import React from 'react';
import { TextSettings, FONT_OPTIONS } from '@/lib/image/types';
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TextPanelProps {
  textSettings: TextSettings;
  onSettingsChange: (settings: TextSettings) => void;
  onAddText: () => void;
  onDeleteText: () => void;
  hasSelectedText: boolean;
}

const TEXT_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#94a3b8', '#1e293b'
];

export function TextPanel({
  textSettings,
  onSettingsChange,
  onAddText,
  onDeleteText,
  hasSelectedText,
}: TextPanelProps) {
  const update = (updates: Partial<TextSettings>) => {
    onSettingsChange({ ...textSettings, ...updates });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold">Typography & Text</h3>
        <p className="text-[11px] text-muted-foreground">
          Add custom titles, captions, and quotes with full styling.
        </p>
      </div>

      <Button onClick={onAddText} className="w-full shadow-sm" size="sm">
        <Type className="w-4 h-4 mr-2" />
        Add Text Layer
      </Button>

      {/* Font Family */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Font Family</label>
        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => update({ fontFamily: f.value })}
              style={{ fontFamily: f.value }}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs text-center transition-all truncate',
                textSettings.fontFamily === f.value
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'border-border/60 hover:border-primary/40 bg-card',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted-foreground">Size</label>
          <span className="font-mono text-xs text-primary">{textSettings.fontSize}px</span>
        </div>
        <Slider
          value={[textSettings.fontSize]}
          min={12}
          max={160}
          step={1}
          onValueChange={([val]) => update({ fontSize: val })}
        />
      </div>

      {/* Text Color Swatches */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <div className="grid grid-cols-6 gap-1.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                'h-6 w-full rounded-md border transition-transform hover:scale-105',
                textSettings.color.toLowerCase() === c.toLowerCase()
                  ? 'border-primary ring-2 ring-primary ring-offset-1 scale-105'
                  : 'border-border/60',
              )}
              style={{ backgroundColor: c }}
              onClick={() => update({ color: c })}
              title={c}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center pt-1">
          <span className="text-[10px] text-muted-foreground font-mono">HEX</span>
          <Input
            value={textSettings.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-7 font-mono text-xs px-2"
          />
        </div>
      </div>

      {/* Formatting & Alignment */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Style & Alignment</label>
        <div className="flex gap-2">
          <div className="flex bg-muted/50 rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.bold ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ bold: !textSettings.bold })}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.italic ? 'bg-primary text-primary-foreground italic' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ italic: !textSettings.italic })}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.underline ? 'bg-primary text-primary-foreground underline' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ underline: !textSettings.underline })}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex bg-muted/50 rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.align === 'left' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ align: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.align === 'center' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ align: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={cn(
                'h-7 w-7 rounded flex items-center justify-center transition-colors',
                textSettings.align === 'right' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground',
              )}
              onClick={() => update({ align: 'right' })}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Shadow Effect */}
      <div className="space-y-2 p-2.5 bg-muted/20 rounded-xl border border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground cursor-pointer" onClick={() => update({ shadow: !textSettings.shadow })}>
            Drop Shadow
          </label>
          <input
            type="checkbox"
            checked={textSettings.shadow}
            onChange={(e) => update({ shadow: e.target.checked })}
            className="accent-primary w-4 h-4 cursor-pointer"
          />
        </div>
        {textSettings.shadow && (
          <div className="pt-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">Blur Radius</span>
              <span className="font-mono text-[10px] text-primary">{textSettings.shadowBlur}px</span>
            </div>
            <Slider
              value={[textSettings.shadowBlur]}
              min={1}
              max={30}
              step={1}
              onValueChange={([val]) => update({ shadowBlur: val })}
            />
          </div>
        )}
      </div>

      {/* Delete selected text */}
      <div className="pt-2 border-t border-border/60">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive text-xs h-8"
          onClick={onDeleteText}
          disabled={!hasSelectedText}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete Selected Text
        </Button>
      </div>
    </div>
  );
}
