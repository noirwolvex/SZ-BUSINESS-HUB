'use client';

import React, { useState, useEffect } from 'react';
import { Maximize, Link as LinkIcon, Unlink } from 'lucide-react';
import { RESIZE_PRESETS } from '@/lib/image/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ResizePanelProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
  onClose: () => void;
}

// Assuming RESIZE_PRESETS has shape: { id: string, category: string, label: string, width: number, height: number }
// If it's different, this might need adjustment, but standardizing based on description.

export function ResizePanel({ currentWidth, currentHeight, onResize, onClose }: ResizePanelProps) {
  const [width, setWidth] = useState<number>(currentWidth);
  const [height, setHeight] = useState<number>(currentHeight);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  
  const aspectRatio = currentWidth / currentHeight;

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    if (lockAspect && newWidth > 0) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    if (lockAspect && newHeight > 0) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const applyPreset = (presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
  };

  const handleApply = () => {
    if (width > 0 && height > 0) {
      onResize(width, height);
    }
  };

  // Group presets by category
  const presetsByCategory = RESIZE_PRESETS.reduce((acc: Record<string, typeof RESIZE_PRESETS>, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {});

  return (
    <div className="flex flex-col space-y-6 p-4 w-full max-w-sm bg-card border border-border/60 rounded-lg">
      <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
        <Maximize className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-semibold">Resize Image</h2>
      </div>

      <div className="text-sm text-muted-foreground">
        Current: {currentWidth}x{currentHeight} px
      </div>

      <div className="flex items-end space-x-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={handleWidthChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLockAspect(!lockAspect)}
          className={cn("h-9 w-9 shrink-0", lockAspect ? "text-primary bg-primary/10 border-primary border" : "text-muted-foreground")}
          title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
        >
          {lockAspect ? <LinkIcon className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
        </Button>

        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={handleHeightChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Presets</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {Object.entries(presetsByCategory).map(([category, presets]) => (
            <div key={category} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => applyPreset(preset.width, preset.height)}
                  >
                    {preset.label} ({preset.width}x{preset.height})
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2 border-t border-border/60">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply}>
          Apply Resize
        </Button>
      </div>
    </div>
  );
}
