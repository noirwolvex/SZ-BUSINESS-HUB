'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { FilterPresetName } from '@/lib/image/types';
import { FILTER_PRESETS, generateThumbnail } from '@/lib/image/filter-presets';

interface FiltersPanelProps {
  imageDataUrl: string | null;
  activePreset: FilterPresetName;
  intensity: number;
  onPresetChange: (preset: FilterPresetName) => void;
  onIntensityChange: (value: number) => void;
}

export function FiltersPanel({
  imageDataUrl,
  activePreset,
  intensity,
  onPresetChange,
  onIntensityChange,
}: FiltersPanelProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    async function loadThumbnails() {
      if (!imageDataUrl) return;

      for (const preset of FILTER_PRESETS) {
        try {
          const thumb = await generateThumbnail(imageDataUrl, preset, 64);
          if (mounted && thumb) {
            setThumbnails((prev) => ({ ...prev, [preset.name]: thumb }));
          }
        } catch (err) {
          console.error('Failed to generate thumbnail for', preset.name, err);
        }
      }
    }

    loadThumbnails();

    return () => {
      mounted = false;
    };
  }, [imageDataUrl]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Filter Presets</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Instant creative looks inspired by film, retro & modern aesthetics.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {FILTER_PRESETS.map((preset) => {
          const isActive = activePreset === preset.name;

          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onPresetChange(preset.name)}
              className={cn(
                'relative group flex flex-col items-center gap-1 rounded-xl border bg-card p-1.5 transition-all text-left',
                isActive
                  ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-sm'
                  : 'border-border/60 hover:border-primary/40 hover:bg-accent/40',
              )}
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted">
                {thumbnails[preset.name] ? (
                  <img
                    src={thumbnails[preset.name]}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse bg-muted-foreground/15" />
                )}

                {isActive && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold truncate w-full text-center',
                  isActive ? 'text-primary' : 'text-foreground',
                )}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {activePreset !== 'none' && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Filter Intensity</label>
            <span className="font-mono text-xs font-semibold text-primary">{intensity}%</span>
          </div>
          <Slider
            value={[intensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => onIntensityChange(val)}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
