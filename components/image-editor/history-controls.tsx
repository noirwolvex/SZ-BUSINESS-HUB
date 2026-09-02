'use client';

import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}

export function HistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
}: HistoryControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        aria-label="Undo"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        aria-label="Redo"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <Redo2 className="h-4 w-4" />
      </button>
      <button
        onClick={onReset}
        title="Reset all"
        aria-label="Reset all changes"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-accent',
        )}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
