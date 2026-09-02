'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, AlertCircle, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 25 * 1024 * 1024;

interface UploadAreaProps {
  onUpload: (file: File) => void;
  compact?: boolean;
}

export function UploadArea({ onUpload, compact = false }: UploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported format. Please use PNG, JPG, or WebP.';
    }
    if (file.size > MAX_SIZE) {
      return 'File is too large. Maximum size is 25 MB.';
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onUpload(file);
    },
    [onUpload],
  );

  if (compact) {
    return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Upload className="h-4 w-4" />
        Replace Image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/60 hover:border-primary/40 hover:bg-primary/5',
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
          <ImageIcon className="h-8 w-8 text-primary" />
        </div>
        <p className="font-display text-lg font-semibold">Drop image here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse — PNG, JPG, WebP (max 25 MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
