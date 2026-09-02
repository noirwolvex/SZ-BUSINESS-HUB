'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Loader2,
  Download,
  ArrowLeft,
  ArrowRight,
  FileText,
  Receipt,
  ClipboardList,
  ShieldCheck,
  Presentation,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  defaultValue?: string;
  placeholder?: string;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  page_size: string;
  fields: TemplateField[];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'cover-letter': FileText,
  'invoice': Receipt,
  'meeting-notes': ClipboardList,
  'nda': ShieldCheck,
  'project-proposal': Presentation,
  'resume': User,
};

const TEMPLATE_ACCENTS: Record<string, string> = {
  'cover-letter': 'bg-primary/30',
  'invoice': 'bg-chart-2/30',
  'meeting-notes': 'bg-chart-3/40',
  'nda': 'bg-muted-foreground/30',
  'project-proposal': 'bg-success/30',
  'resume': 'bg-warning/30',
};

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
  a3: { width: 842, height: 1191 },
};

export function TemplatesUI() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('pdf_templates')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        setTemplates(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    const defaults: Record<string, string> = {};
    template.fields.forEach((f) => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    setFieldValues(defaults);
  };

  const backToList = () => {
    setSelectedTemplate(null);
    setFieldValues({});
  };

  const generatePdf = useCallback(async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setError(null);
    try {
      const dims = PAGE_SIZES[selectedTemplate.page_size] || PAGE_SIZES.a4;
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage([dims.width, dims.height]);

      for (const field of selectedTemplate.fields) {
        const value = fieldValues[field.key] || '';
        if (!value) continue;

        if (field.type === 'text') {
          const lines = value.split('\n');
          lines.forEach((line, i) => {
            page.drawText(line, {
              x: field.x,
              y: field.y - i * (field.fontSize + 2),
              size: field.fontSize,
              font,
              color: rgb(0, 0, 0),
            });
          });
        } else if (field.type === 'image') {
          const base64 = value.split(',')[1] || value;
          const mimeType = value.startsWith('data:image/png') ? 'png' : 'jpg';
          const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          let img;
          if (mimeType === 'png') {
            img = await pdfDoc.embedPng(imageBytes);
          } else {
            img = await pdfDoc.embedJpg(imageBytes);
          }
          page.drawImage(img, {
            x: field.x,
            y: field.y - field.height,
            width: field.width,
            height: field.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, fieldValues]);

  const handleImageField = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFieldValues((prev) => ({ ...prev, [key]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Template list view
  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const Icon = TEMPLATE_ICONS[tpl.slug] || FileText;
            const accent = TEMPLATE_ACCENTS[tpl.slug] || 'bg-primary/30';
            return (
              <div
                key={tpl.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                {/* Document preview */}
                <div className="relative h-36 overflow-hidden border-b border-border/40 bg-muted/20">
                  <div className={`absolute left-0 right-0 top-0 h-1 ${accent}`} />
                  {/* Mini document */}
                  <div className="absolute left-1/2 top-1/2 h-24 w-20 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                    <div className="space-y-1.5 p-2.5">
                      <div className="h-2 w-2/3 rounded-sm bg-primary/20" />
                      <div className="h-1 w-full rounded-full bg-muted" />
                      <div className="h-1 w-full rounded-full bg-muted" />
                      <div className="h-1 w-3/4 rounded-full bg-muted" />
                      <div className="h-1 w-full rounded-full bg-muted" />
                      <div className="h-1 w-1/2 rounded-full bg-muted" />
                    </div>
                  </div>
                  {/* Icon badge */}
                  <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                </div>

                {/* Card content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-base font-semibold leading-snug">
                    {tpl.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {tpl.description}
                  </p>
                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => selectTemplate(tpl)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      Use Template
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {error && (
          <p className="text-xs text-muted-foreground">{error}</p>
        )}
      </div>
    );
  }

  // Template fill view
  const dims = PAGE_SIZES[selectedTemplate.page_size] || PAGE_SIZES.a4;
  const SCALE = 0.65;

  return (
    <div className="space-y-4">
      <button
        onClick={backToList}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to templates
      </button>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="font-display text-lg font-semibold">{selectedTemplate.name}</p>
        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Form fields */}
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Fill in the fields</p>
          {selectedTemplate.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {field.label}
              </label>
              {field.type === 'text' ? (
                <input
                  type="text"
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder || ''}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40"
                />
              ) : (
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageField(field.key, file);
                  }}
                  className="w-full text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border file:border-border/60 file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium"
                />
              )}
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="flex justify-center rounded-xl border border-border/60 bg-muted/20 p-4">
          <div
            className="relative bg-white shadow-lg"
            style={{
              width: dims.width * SCALE,
              height: dims.height * SCALE,
            }}
          >
            {selectedTemplate.fields.map((field) => {
              const value = fieldValues[field.key] || '';
              if (!value) return null;
              if (field.type === 'image' && value.startsWith('data:image')) {
                return (
                  <img
                    key={field.key}
                    src={value}
                    alt=""
                    className="absolute object-contain"
                    style={{
                      left: field.x * SCALE,
                      top: (dims.height - field.y) * SCALE,
                      width: field.width * SCALE,
                      height: field.height * SCALE,
                    }}
                  />
                );
              }
              return (
                <div
                  key={field.key}
                  className="absolute whitespace-pre-wrap break-words"
                  style={{
                    left: field.x * SCALE,
                    top: (dims.height - field.y) * SCALE,
                    fontSize: field.fontSize * SCALE,
                    lineHeight: 1.3,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    color: '#000',
                    width: field.width * SCALE,
                  }}
                >
                  {value}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={generatePdf} disabled={generating} size="lg" className="w-full">
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating PDF…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </>
        )}
      </Button>
    </div>
  );
}
