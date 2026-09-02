'use client';

import { useState } from 'react';
import { Download, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ExportFormat } from '@/lib/image/types';

interface ExportControlsProps {
  onExport: (format: ExportFormat, quality: number, multiplier: number) => void;
  onCopyToClipboard?: () => Promise<boolean>;
  disabled: boolean;
  imageDimensions?: { width: number; height: number } | null;
}

const FORMATS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'png', label: 'PNG', desc: 'Lossless · High Quality' },
  { value: 'jpeg', label: 'JPEG', desc: 'Compact · Standard' },
  { value: 'webp', label: 'WebP', desc: 'Modern · Optimal' },
];

const MULTIPLIERS = [
  { value: 1, label: '1×', desc: 'Standard' },
  { value: 2, label: '2×', desc: 'Retina HD' },
  { value: 3, label: '3×', desc: 'Ultra HD' },
];

export function ExportControls({
  onExport,
  onCopyToClipboard,
  disabled,
  imageDimensions,
}: ExportControlsProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(92);
  const [multiplier, setMultiplier] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  const isLossy = format === 'jpeg' || format === 'webp';

  const handleCopy = async () => {
    if (!onCopyToClipboard || disabled) return;
    const success = await onCopyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const outputWidth = imageDimensions ? Math.round(imageDimensions.width * multiplier) : null;
  const outputHeight = imageDimensions ? Math.round(imageDimensions.height * multiplier) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold">Export Image</h3>
        <p className="text-[11px] text-muted-foreground">
          Choose output format, quality, and resolution.
        </p>
      </div>

      {/* Format Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              disabled={disabled}
              className={cn(
                'rounded-lg border p-2.5 text-center transition-all disabled:opacity-40',
                format === f.value
                  ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                  : 'border-border/60 hover:border-primary/40 bg-card',
              )}
            >
              <span className="block text-xs font-bold">{f.label}</span>
              <span className="mt-0.5 block text-[9px] text-muted-foreground line-clamp-1">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Multiplier */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Resolution Scaling</label>
          {outputWidth && outputHeight && (
            <span className="font-mono text-[11px] text-primary">
              {outputWidth} × {outputHeight} px
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MULTIPLIERS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMultiplier(m.value)}
              disabled={disabled}
              className={cn(
                'rounded-lg border py-1.5 px-2 text-center transition-all disabled:opacity-40',
                multiplier === m.value
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 hover:border-primary/40 text-muted-foreground bg-card text-xs',
              )}
            >
              <span className="text-xs">{m.label}</span>
              <span className="ml-1 text-[10px] opacity-70">({m.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider (for JPEG / WebP) */}
      {isLossy && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Quality Compression</label>
            <span className="font-mono text-xs font-semibold text-primary">{quality}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Smaller file</span>
            <span>Balanced</span>
            <span>Max clarity</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <Button
          onClick={() => onExport(format, quality / 100, multiplier)}
          disabled={disabled}
          className="w-full shadow-md hover:shadow-lg transition-all"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Download {format.toUpperCase()} ({multiplier}×)
        </Button>

        {onCopyToClipboard && (
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={disabled}
            className="w-full border-border/60"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-success" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
