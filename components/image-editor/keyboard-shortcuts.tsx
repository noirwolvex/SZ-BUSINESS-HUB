'use client';

import React, { useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!open) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'Z'], action: 'Undo' },
    { keys: ['Ctrl', 'Y'], action: 'Redo' },
    { keys: ['Ctrl', 'S'], action: 'Quick Export' },
    { keys: ['Ctrl', '0'], action: 'Fit to Screen' },
    { keys: ['+'], action: 'Zoom In' },
    { keys: ['-'], action: 'Zoom Out' },
    { keys: ['Delete'], action: 'Remove Selected' },
    { keys: ['Escape'], action: 'Exit Mode' },
    { keys: ['?'], action: 'Show Shortcuts' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-card border border-border/60 rounded-lg shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 gap-1">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-muted-foreground font-medium">{shortcut.action}</span>
                <div className="flex items-center space-x-1">
                  {shortcut.keys.map((key, kIndex) => (
                    <React.Fragment key={kIndex}>
                      {kIndex > 0 && <span className="text-xs text-muted-foreground mx-0.5">+</span>}
                      <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground bg-muted border border-border/80 rounded shadow-sm">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/60 bg-muted/30 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
