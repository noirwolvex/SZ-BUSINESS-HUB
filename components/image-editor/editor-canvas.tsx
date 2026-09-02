'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFabricCanvas } from '@/lib/image/use-fabric-canvas';
import type { DrawSettings } from '@/lib/image/types';

type FabricCanvas = import('fabric').Canvas;
type FabricImage = import('fabric').FabricImage;

interface EditorCanvasProps {
  imageDataUrl: string | null;
  zoom: number;
  drawingMode?: boolean;
  drawSettings?: DrawSettings;
  onReady: (canvas: FabricCanvas) => void;
  onImageLoaded: (img: FabricImage) => void;
  onObjectSelected?: (type: string | null) => void;
}

export function EditorCanvas({
  imageDataUrl,
  zoom,
  drawingMode = false,
  drawSettings,
  onReady,
  onImageLoaded,
  onObjectSelected,
}: EditorCanvasProps) {
  const { canvasRef, fabricRef, ready } = useFabricCanvas({ onReady });
  const imageObjRef = useRef<FabricImage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadImage = useCallback(async () => {
    if (!imageDataUrl || !fabricRef.current) return;
    const fabric = await import('fabric');
    const canvas = fabricRef.current;

    // Remove only the base image, preserve drawn objects
    const objects = canvas.getObjects();
    const baseImg = objects.find(
      (o) => o.type === 'image' && !(o as any)._isOverlay,
    );
    if (baseImg) canvas.remove(baseImg);

    const img = await fabric.FabricImage.fromURL(imageDataUrl, {
      crossOrigin: 'anonymous',
    });
    img.set({
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });

    // Insert image at bottom so drawn objects stay on top
    canvas.insertAt(0, img);
    imageObjRef.current = img;
    onImageLoaded(img);

    fitToScreen(canvas, img);
  }, [imageDataUrl, onImageLoaded]);

  useEffect(() => {
    if (ready) loadImage();
  }, [ready, loadImage]);

  // Drawing mode
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.isDrawingMode = drawingMode;

    if (drawingMode && drawSettings) {
      (async () => {
        const fabric = await import('fabric');
        const brush = new fabric.PencilBrush(canvas);

        if (drawSettings.tool === 'eraser') {
          brush.color = '#0a0f1a'; // match canvas bg
          brush.width = drawSettings.size;
        } else if (drawSettings.tool === 'highlighter') {
          // Semi-transparent highlight
          const hex = drawSettings.color;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          brush.color = `rgba(${r},${g},${b},0.35)`;
          brush.width = drawSettings.size * 3;
        } else {
          brush.color = drawSettings.color;
          brush.width = drawSettings.size;
        }

        canvas.freeDrawingBrush = brush;
      })();
    }
  }, [drawingMode, drawSettings]);

  // Object selection events
  useEffect(() => {
    if (!fabricRef.current || !onObjectSelected) return;
    const canvas = fabricRef.current;
    const handleSelection = () => {
      const active = canvas.getActiveObject();
      if (active) {
        onObjectSelected(active.type || null);
      }
    };
    const handleDeselection = () => {
      onObjectSelected(null);
    };
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleDeselection);
    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleDeselection);
    };
  }, [onObjectSelected, ready]);

  // Zoom
  useEffect(() => {
    if (!fabricRef.current || !imageObjRef.current) return;
    const canvas = fabricRef.current;
    const img = imageObjRef.current;
    const containerW = containerRef.current?.clientWidth || 600;
    const containerH = containerRef.current?.clientHeight || 400;
    const baseScale = Math.min(
      (containerW - 40) / (img.width || 1),
      (containerH - 40) / (img.height || 1),
      1,
    );
    const vpt = canvas.viewportTransform;
    if (!vpt) return;
    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;
    vpt[0] = baseScale * zoom;
    vpt[3] = baseScale * zoom;
    vpt[4] = centerX - ((img.width || 0) * baseScale * zoom) / 2;
    vpt[5] = centerY - ((img.height || 0) * baseScale * zoom) / 2;
    canvas.requestRenderAll();
  }, [zoom]);

  // Resize observer
  const handleResize = useCallback(() => {
    if (!fabricRef.current || !containerRef.current) return;
    const canvas = fabricRef.current;
    canvas.setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    canvas.requestRenderAll();
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [handleResize]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-xl">
      <canvas ref={canvasRef} />
    </div>
  );
}

function fitToScreen(canvas: FabricCanvas, img: FabricImage) {
  const containerW = canvas.getWidth();
  const containerH = canvas.getHeight();
  const scale = Math.min(
    (containerW - 40) / (img.width || 1),
    (containerH - 40) / (img.height || 1),
    1,
  );
  const vpt = canvas.viewportTransform;
  if (!vpt) return;
  vpt[0] = scale;
  vpt[3] = scale;
  vpt[4] = (containerW - (img.width || 0) * scale) / 2;
  vpt[5] = (containerH - (img.height || 0) * scale) / 2;
  canvas.requestRenderAll();
}
