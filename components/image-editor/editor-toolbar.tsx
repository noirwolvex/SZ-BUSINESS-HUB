'use client';

import {
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Maximize, Upload, Trash2,
  Scaling, Droplets, Frame, Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipX: () => void;
  onFlipY: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onResize?: () => void;
  onWatermark?: () => void;
  onFrame?: () => void;
  onShortcuts?: () => void;
  resizeActive?: boolean;
  watermarkActive?: boolean;
  frameActive?: boolean;
}

export function EditorToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onRotateLeft,
  onRotateRight,
  onFlipX,
  onFlipY,
  onReplace,
  onRemove,
  onResize,
  onWatermark,
  onFrame,
  onShortcuts,
  resizeActive,
  watermarkActive,
  frameActive,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card p-2">
      {/* Zoom controls */}
      <ToolButton onClick={onZoomOut} label="Zoom out" disabled={zoom <= 0.1}>
        <ZoomOut className="h-4 w-4" />
      </ToolButton>
      <span className="min-w-[3rem] text-center text-xs font-medium text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <ToolButton onClick={onZoomIn} label="Zoom in" disabled={zoom >= 5}>
        <ZoomIn className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onFit} label="Fit to screen">
        <Maximize className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Transform controls */}
      <ToolButton onClick={onRotateLeft} label="Rotate left">
        <RotateCcw className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onRotateRight} label="Rotate right">
        <RotateCw className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onFlipX} label="Flip horizontal">
        <FlipHorizontal className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onFlipY} label="Flip vertical">
        <FlipVertical className="h-4 w-4" />
      </ToolButton>

      <Divider />

      {/* Design tools */}
      {onResize && (
        <ToolButton onClick={onResize} label="Resize" active={resizeActive}>
          <Scaling className="h-4 w-4" />
        </ToolButton>
      )}
      {onWatermark && (
        <ToolButton onClick={onWatermark} label="Watermark" active={watermarkActive}>
          <Droplets className="h-4 w-4" />
        </ToolButton>
      )}
      {onFrame && (
        <ToolButton onClick={onFrame} label="Frames" active={frameActive}>
          <Frame className="h-4 w-4" />
        </ToolButton>
      )}

      <Divider />

      {/* File controls */}
      <ToolButton onClick={onReplace} label="Replace image">
        <Upload className="h-4 w-4" />
      </ToolButton>
      <ToolButton onClick={onRemove} label="Remove image" danger>
        <Trash2 className="h-4 w-4" />
      </ToolButton>

      {/* Spacer + shortcuts */}
      <div className="flex-1" />
      {onShortcuts && (
        <ToolButton onClick={onShortcuts} label="Keyboard shortcuts (?)">
          <Keyboard className="h-4 w-4" />
        </ToolButton>
      )}
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border/60" />;
}

function ToolButton({
  children,
  onClick,
  label,
  disabled,
  danger,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
        danger && 'hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive',
        active && 'border-primary/40 bg-primary/10 text-primary',
      )}
    >
      {children}
    </button>
  );
}
