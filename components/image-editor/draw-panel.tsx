'use client';

import React from 'react';
import { DrawSettings, DrawTool, DEFAULT_DRAW_SETTINGS } from '@/lib/image/types';
import { Paintbrush, Eraser, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DrawPanelProps {
  drawSettings: DrawSettings;
  onSettingsChange: (settings: DrawSettings) => void;
  onClearDrawings: () => void;
  isActive: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#ffffff', '#94a3b8', '#1e293b', '#000000'
];

export function DrawPanel({
  drawSettings,
  onSettingsChange,
  onClearDrawings,
  isActive
}: DrawPanelProps) {
  const updateSettings = (updates: Partial<DrawSettings>) => {
    onSettingsChange({ ...drawSettings, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-3 rounded-lg border border-border/60">
        <p className="text-sm text-muted-foreground text-center">
          {isActive 
            ? 'Select a drawing tool and paint on the canvas' 
            : 'Switch to Draw mode to start painting'}
        </p>
      </div>

      <div className={cn("space-y-6 transition-opacity", !isActive && "opacity-50 pointer-events-none")}>
        <div className="space-y-3">
          <Label>Tool</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={drawSettings.tool === 'brush' ? 'default' : 'outline'}
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => updateSettings({ tool: 'brush' })}
            >
              <Paintbrush className="w-5 h-5" />
              <span className="text-xs">Brush</span>
            </Button>
            <Button
              variant={drawSettings.tool === 'highlighter' ? 'default' : 'outline'}
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => updateSettings({ tool: 'highlighter' })}
            >
              <Highlighter className="w-5 h-5" />
              <span className="text-xs">Highlighter</span>
            </Button>
            <Button
              variant={drawSettings.tool === 'eraser' ? 'default' : 'outline'}
              className="w-full flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => updateSettings({ tool: 'eraser' })}
            >
              <Eraser className="w-5 h-5" />
              <span className="text-xs">Eraser</span>
            </Button>
          </div>
          {drawSettings.tool === 'highlighter' && (
            <p className="text-xs text-muted-foreground">Highlighter uses semi-transparent color.</p>
          )}
          {drawSettings.tool === 'eraser' && (
            <p className="text-xs text-muted-foreground">Eraser acts as a white brush.</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Color</Label>
          <div className="grid grid-cols-6 gap-2">
            {COLORS.map(color => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  drawSettings.color === color ? "border-primary" : "border-transparent",
                  color === '#ffffff' ? "border-border/60" : ""
                )}
                style={{ backgroundColor: color }}
                onClick={() => updateSettings({ color })}
                disabled={drawSettings.tool === 'eraser'}
                title={color}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Label className="text-xs">Hex</Label>
            <Input 
              value={drawSettings.color}
              onChange={(e) => updateSettings({ color: e.target.value })}
              className="h-8 font-mono text-xs"
              disabled={drawSettings.tool === 'eraser'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Brush Size</Label>
            <span className="text-xs text-muted-foreground">{drawSettings.size}px</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              value={[drawSettings.size]}
              min={1}
              max={80}
              step={1}
              onValueChange={([val]) => updateSettings({ size: val })}
              className="flex-1"
            />
            
            <div className="w-10 h-10 flex items-center justify-center border rounded-md bg-muted/30">
              <div 
                className="rounded-full bg-foreground"
                style={{
                  width: Math.min(drawSettings.size, 40),
                  height: Math.min(drawSettings.size, 40),
                  backgroundColor: drawSettings.tool === 'eraser' ? '#ffffff' : drawSettings.color,
                  opacity: drawSettings.tool === 'highlighter' ? 0.5 : 1
                }}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onClearDrawings}
          >
            Clear All Drawings
          </Button>
        </div>
      </div>
    </div>
  );
}
