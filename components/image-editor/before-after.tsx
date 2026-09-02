'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfter({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [showAfter, setShowAfter] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      if (e instanceof MouseEvent) updateSlider(e.clientX);
      else if (e.touches[0]) updateSlider(e.touches[0].clientX);
    };
    const handleUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [updateSlider]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Compare</h3>
        <button
          onClick={() => setShowAfter((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAfter ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showAfter ? afterLabel : beforeLabel}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full cursor-ew-resize overflow-hidden rounded-xl border border-border/60 bg-muted/20 select-none"
        onMouseDown={(e) => { draggingRef.current = true; updateSlider(e.clientX); }}
        onTouchStart={(e) => { draggingRef.current = true; if (e.touches[0]) updateSlider(e.touches[0].clientX); }}
      >
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ width: containerRef.current?.clientWidth ?? '100%' }}
            draggable={false}
          />
        </div>

        <div
          className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/60 shadow-lg backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
              <path d="M8 7L3 12l5 5V7zm8 0v10l5-5-5-5z" />
            </svg>
          </div>
        </div>

        <span className={cn(
          'absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm',
          sliderPos < 15 && 'opacity-0',
        )}>
          {beforeLabel}
        </span>
        <span className={cn(
          'absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm',
          sliderPos > 85 && 'opacity-0',
        )}>
          {afterLabel}
        </span>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        Drag the slider to compare
      </p>
    </div>
  );
}
