'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type EnhanceOperation, type EnhanceState } from '@/lib/image/types';

interface EnhancementPanelProps {
  state: EnhanceState;
  onEnhance: (operation: EnhanceOperation, scale?: 2 | 4) => void;
  disabled: boolean;
}

const OPERATIONS: { op: EnhanceOperation; label: string; desc: string; scale?: 2 | 4 }[] = [
  { op: 'auto', label: 'Auto Enhance', desc: 'Smart brightness, contrast & clarity' },
  { op: '2x', label: '2× Upscale', desc: 'Double resolution', scale: 2 },
  { op: '4x', label: '4× Upscale', desc: 'Quadruple resolution', scale: 4 },
  { op: 'sharpen', label: 'Sharpen', desc: 'Enhance edge detail' },
  { op: 'decompress', label: 'Remove Artifacts', desc: 'Clean compression noise' },
  { op: 'clarity', label: 'Improve Clarity', desc: 'Local contrast boost' },
];

const STATUS_MESSAGES: Record<string, string> = {
  preparing: 'Preparing image…',
  uploading: 'Uploading…',
  enhancing: 'Enhancing image…',
  finalizing: 'Finalizing…',
};

export function EnhancementPanel({ state, onEnhance, disabled }: EnhancementPanelProps) {
  const isProcessing = !['idle', 'done', 'error'].includes(state.status);
  const progress = isProcessing ? state.progress : state.status === 'done' ? 100 : 0;

  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-display text-sm font-semibold">AI Enhancement</h3>
      </div>

      {isProcessing && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium">{STATUS_MESSAGES[state.status] || 'Processing…'}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state.status === 'error' && state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {OPERATIONS.map((op) => (
          <button
            key={op.op}
            onClick={() => onEnhance(op.op, op.scale)}
            disabled={disabled || isProcessing}
            className={cn(
              'flex flex-col items-start rounded-lg border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            <span className="text-xs font-semibold">{op.label}</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">{op.desc}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Enhancement uses browser-native canvas processing with progressive upscaling and convolution sharpening. The architecture supports swapping in Real-ESRGAN or external AI APIs via the provider interface.
        </p>
      </div>
    </div>
  );
}
