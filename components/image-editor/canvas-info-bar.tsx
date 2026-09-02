'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasInfoBarProps {
  zoom: number;
  width: number;
  height: number;
}

export function CanvasInfoBar({ zoom, width, height }: CanvasInfoBarProps) {
  // Rough calculation: width * height * 4 bytes (RGBA)
  const bytes = width * height * 4;
  
  let formattedSize = '';
  if (bytes < 1024 * 1024) {
    formattedSize = `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    formattedSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="flex items-center justify-center space-x-3 px-4 py-1.5 bg-muted/40 border border-border/60 rounded-full text-[11px] text-muted-foreground shadow-sm backdrop-blur-sm">
      <div className="flex items-center">
        Zoom: {Math.round(zoom * 100)}%
      </div>
      
      <div className="w-1 h-1 rounded-full bg-border/80" />
      
      <div className="flex items-center space-x-1.5 text-foreground/80 font-medium">
        <ImageIcon className="w-3.5 h-3.5" />
        <span>{width} × {height} px</span>
      </div>
      
      <div className="w-1 h-1 rounded-full bg-border/80" />
      
      <div className="flex items-center">
        Est: {formattedSize}
      </div>
    </div>
  );
}
