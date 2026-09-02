'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type CropPreset } from '@/lib/image/types';

interface CropToolProps {
  imageDataUrl: string;
  onApply: (rect: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

const PRESETS: { value: CropPreset; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: 'square', label: 'Square' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
];

const RATIOS: Record<CropPreset, number | null> = {
  free: null,
  square: 1,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
};

interface DragState {
  startX: number;
  startY: number;
  rect: { x: number; y: number; width: number; height: number } | null;
}

export function CropTool({ imageDataUrl, onApply, onCancel }: CropToolProps) {
  const [preset, setPreset] = useState<CropPreset>('free');
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0, dispW: 0, dispH: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight, 1);
      const dispW = img.naturalWidth * scale;
      const dispH = img.naturalHeight * scale;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight, dispW, dispH });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };
    const imgRect = imageRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(clientX - imgRect.left, imgRect.width)),
      y: Math.max(0, Math.min(clientY - imgRect.top, imgRect.height)),
    };
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    const pos = getRelativePos(clientX, clientY);
    dragRef.current = { startX: pos.x, startY: pos.y, rect: null };
  }, [getRelativePos]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const pos = getRelativePos(clientX, clientY);
    let w = pos.x - dragRef.current.startX;
    let h = pos.y - dragRef.current.startY;
    let x = dragRef.current.startX;
    let y = dragRef.current.startY;

    if (w < 0) { x = pos.x; w = Math.abs(w); }
    if (h < 0) { y = pos.y; h = Math.abs(h); }

    const ratio = RATIOS[preset];
    if (ratio) {
      if (w / h > ratio) {
        h = w / ratio;
      } else {
        w = h * ratio;
      }
    }

    const maxW = imgSize.dispW;
    const maxH = imgSize.dispH;
    if (x + w > maxW) w = maxW - x;
    if (y + h > maxH) h = maxH - y;

    setRect({ x, y, width: Math.max(10, w), height: Math.max(10, h) });
  }, [getRelativePos, preset, imgSize]);

  const handleEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    const mv = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const up = () => handleEnd();
    const tmv = (e: TouchEvent) => { if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const tup = () => handleEnd();
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', tmv);
    window.addEventListener('touchend', tup);
    return () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', tmv);
      window.removeEventListener('touchend', tup);
    };
  }, [handleMove, handleEnd]);

  const applyCrop = () => {
    if (!rect || !imageRef.current) return;
    const imgRect = imageRef.current.getBoundingClientRect();
    const scaleX = imgSize.w / imgRect.width;
    const scaleY = imgSize.h / imgRect.height;
    onApply({
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Crop</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="h-7 px-2 text-xs">
            <X className="mr-1 h-3 w-3" /> Cancel
          </Button>
          <Button size="sm" onClick={applyCrop} disabled={!rect} className="h-7 px-2 text-xs">
            <Check className="mr-1 h-3 w-3" /> Apply
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              preset === p.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative flex items-center justify-center rounded-xl border border-border/60 bg-muted/20"
        style={{ height: '300px' }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => { if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY); }}
      >
        <img
          ref={imageRef}
          src={imageDataUrl}
          alt="Crop preview"
          className="max-h-full max-w-full select-none"
          draggable={false}
          style={{ userSelect: 'none' }}
        />
        {rect && (
          <>
            <div
              className="absolute border-2 border-primary bg-primary/10"
              style={{
                left: `calc(50% - ${imgSize.dispW / 2}px + ${rect.x}px)`,
                top: `calc(50% - ${imgSize.dispH / 2}px + ${rect.y}px)`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
              }}
            />
            <div
              className="absolute border border-primary/40"
              style={{
                left: `calc(50% - ${imgSize.dispW / 2}px + ${rect.x}px)`,
                top: `calc(50% - ${imgSize.dispH / 2}px + ${rect.y + rect.height / 3}px)`,
                width: `${rect.width}px`,
                height: `${rect.height / 3}px`,
              }}
            />
            <div
              className="absolute border border-primary/40"
              style={{
                left: `calc(50% - ${imgSize.dispW / 2}px + ${rect.x + rect.width / 3}px)`,
                top: `calc(50% - ${imgSize.dispH / 2}px + ${rect.y}px)`,
                width: `${rect.width / 3}px`,
                height: `${rect.height}px`,
              }}
            />
          </>
        )}
        {!rect && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Drag to select crop area</p>
          </div>
        )}
      </div>
    </div>
  );
}
