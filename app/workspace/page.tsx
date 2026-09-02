'use client';

import { useState } from 'react';
import {
  Upload,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Copy,
  Download,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Plus,
  FileText,
  GripVertical,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageThumb {
  id: number;
  label: number;
}

export default function WorkspacePage() {
  const [pages, setPages] = useState<PageThumb[]>(
    Array.from({ length: 8 }, (_, i) => ({ id: i + 1, label: i + 1 })),
  );
  const [selected, setSelected] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [hasFile, setHasFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!hasFile) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Document Workspace
          </h1>
          <p className="mt-2 max-w-md text-center text-muted-foreground">
            Upload a PDF to start editing. Reorder pages, rotate, delete,
            extract, and preview — all in one visual editor.
          </p>
          <Button className="mt-6 h-12 px-6" onClick={() => setHasFile(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-border/40" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-border/40" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-xs font-medium">
              {zoom}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative ml-auto hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search document…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border/60 bg-muted/30 pl-8 pr-3 text-xs outline-none focus:border-primary/40"
            />
          </div>

          <Button size="sm" className="ml-auto sm:ml-0">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnails sidebar */}
          <div className="hidden w-48 shrink-0 overflow-y-auto border-r border-border/40 bg-muted/20 p-3 lg:block">
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pages ({pages.length})
            </p>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelected(page.id)}
                  className={cn(
                    'group relative flex w-full flex-col items-center gap-1.5 rounded-lg border p-2 transition-all',
                    selected === page.id
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-border/40 hover:border-border/80',
                  )}
                >
                  <GripVertical className="absolute left-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="aspect-[3/4] w-full rounded bg-background p-2">
                    <div className="h-full space-y-1">
                      <div className="h-1 w-2/3 rounded bg-muted-foreground/20" />
                      <div className="h-1 w-full rounded bg-muted-foreground/15" />
                      <div className="h-1 w-5/6 rounded bg-muted-foreground/15" />
                      <div className="h-1 w-3/4 rounded bg-muted-foreground/10" />
                      <div className="h-1 w-full rounded bg-muted-foreground/15" />
                      <div className="h-1 w-2/3 rounded bg-muted-foreground/10" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {page.label}
                  </span>
                </button>
              ))}
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
                Add page
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/10 p-8">
            <div
              className="aspect-[1/1.3] w-full max-w-lg rounded-xl border border-border/40 bg-card shadow-xl"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="flex h-full flex-col p-10">
                <div className="mb-6 h-3 w-1/3 rounded bg-muted-foreground/20" />
                <div className="space-y-2.5">
                  <div className="h-2 w-full rounded bg-muted-foreground/15" />
                  <div className="h-2 w-5/6 rounded bg-muted-foreground/15" />
                  <div className="h-2 w-full rounded bg-muted-foreground/15" />
                  <div className="h-2 w-3/4 rounded bg-muted-foreground/10" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-lg bg-primary/5" />
                  <div className="h-16 rounded-lg bg-chart-2/5" />
                </div>
                <div className="mt-6 space-y-2.5">
                  <div className="h-2 w-full rounded bg-muted-foreground/15" />
                  <div className="h-2 w-5/6 rounded bg-muted-foreground/15" />
                  <div className="h-2 w-2/3 rounded bg-muted-foreground/10" />
                  <div className="h-2 w-full rounded bg-muted-foreground/15" />
                  <div className="h-2 w-3/4 rounded bg-muted-foreground/10" />
                </div>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="text-xs text-muted-foreground">
                    Page {selected} of {pages.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sample_Document.pdf
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
          <Button variant="ghost" size="sm" disabled={selected <= 1}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {selected} of {pages.length}
          </span>
          <Button variant="ghost" size="sm" disabled={selected >= pages.length}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
