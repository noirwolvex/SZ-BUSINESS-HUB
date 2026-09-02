'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

type FabricCanvas = import('fabric').Canvas;
type FabricImage = import('fabric').FabricImage;
type FabricObject = import('fabric').FabricObject;

interface UseFabricOptions {
  onReady?: (canvas: FabricCanvas) => void;
}

export function useFabricCanvas(opts: UseFabricOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;
    (async () => {
      const { Canvas } = await import('fabric');
      if (disposed || !canvasRef.current) return;
      const fabricCanvas = new Canvas(canvasRef.current, {
        backgroundColor: '#0a0f1a',
        preserveObjectStacking: true,
        selection: false,
      });
      fabricRef.current = fabricCanvas;
      setReady(true);
      opts.onReady?.(fabricCanvas);
    })();

    return () => {
      disposed = true;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCanvas = useCallback(() => fabricRef.current, []);

  return { canvasRef, fabricRef, getCanvas, ready };
}
