'use client';

import { useEffect, useRef, useState } from 'react';
import { Pen, Type, Upload, Trash2, Check, X } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { trimCanvas, type SignatureImage } from '@/lib/pdf/sign-pdf';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signature: SignatureImage) => void;
}

const DRAW_W = 500;
const DRAW_H = 220;
const FONT_OPTIONS = [
  { label: 'Cursive', value: "'Brush Script MT', 'Segoe Script', cursive" },
  { label: 'Formal', value: "'Times New Roman', Georgia, serif" },
  { label: 'Modern', value: "'Segoe UI', Roboto, sans-serif" },
  { label: 'Handwritten', value: "'Comic Sans MS', 'Segoe Print', cursive" },
];

export function SignatureModal({ open, onClose, onSave }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);
  const [typedName, setTypedName] = useState('');
  const [fontValue, setFontValue] = useState(FONT_OPTIONS[0].value);
  const [uploadedImage, setUploadedImage] = useState<SignatureImage | null>(null);
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');

  useEffect(() => {
    if (!open || tab !== 'draw' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = DRAW_W * ratio;
    canvas.height = DRAW_H * ratio;
    canvas.style.width = `${DRAW_W}px`;
    canvas.style.height = `${DRAW_H}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      penColor: '#0f172a',
      backgroundColor: 'rgba(0,0,0,0)',
      minWidth: 1.5,
      maxWidth: 3,
    });
    sigPadRef.current = pad;

    return () => {
      pad.off();
      sigPadRef.current = null;
    };
  }, [open, tab]);

  const clearDraw = () => {
    sigPadRef.current?.clear();
  };

  const handleSave = () => {
    if (tab === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
      const canvas = canvasRef.current!;
      const trimmed = trimCanvas(canvas);
      onSave({
        dataUrl: trimmed.toDataURL('image/png'),
        width: trimmed.width,
        height: trimmed.height,
      });
    } else if (tab === 'type') {
      if (!typedName.trim()) return;
      const canvas = renderTypedSignature(typedName.trim(), fontValue);
      onSave({
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    } else if (tab === 'upload') {
      if (uploadedImage) onSave(uploadedImage);
    }
  };

  const handleUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setUploadedImage({ dataUrl, width: img.width, height: img.height });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const canSave =
    (tab === 'draw' && !!sigPadRef.current && !sigPadRef.current.isEmpty()) ||
    (tab === 'type' && typedName.trim().length > 0) ||
    (tab === 'upload' && !!uploadedImage);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create your signature</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="gap-1.5">
              <Pen className="h-4 w-4" /> Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-1.5">
              <Type className="h-4 w-4" /> Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="h-4 w-4" /> Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-1">
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg bg-white"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Draw your signature above</p>
              <Button size="sm" variant="outline" onClick={clearDraw}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-3">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your full name"
              className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
            />
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFontValue(f.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    fontValue === f.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                  style={{ fontFamily: f.value }}
                >
                  {typedName || f.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border/60 bg-white p-4 text-center">
              <span
                className="text-3xl text-slate-900"
                style={{ fontFamily: fontValue }}
              >
                {typedName || 'Your signature'}
              </span>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            {uploadedImage ? (
              <div className="relative rounded-xl border border-border/60 bg-white p-4">
                <img
                  src={uploadedImage.dataUrl}
                  alt="Uploaded signature"
                  className="mx-auto max-h-32"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Upload signature image</span>
                <span className="mt-1 text-xs text-muted-foreground">PNG or JPG with transparent or white background</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Check className="mr-1.5 h-4 w-4" /> Use Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderTypedSignature(name: string, font: string): HTMLCanvasElement {
  const fontSize = 48;
  const padding = 16;
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = `${fontSize}px ${font}`;
  const textWidth = measureCtx.measureText(name).width;
  const width = Math.ceil(textWidth + padding * 2);
  const height = Math.ceil(fontSize + padding * 2);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, padding, height / 2);
  return canvas;
}
