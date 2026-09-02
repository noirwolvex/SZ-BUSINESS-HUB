'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Brain,
  Layers,
  FileStack,
  ScanText,
  GitCompare,
  Languages,
  Check,
  Star,
  Upload,
  FileText,
  ChevronRight,
  Lock,
  Eye,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navbar';
import { CommandPalette } from '@/components/command-palette';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { categories, tools, getToolsByCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const cmd = useCommandPalette();
  return (
    <>
      <Navbar onCommandOpen={cmd.toggle} />
      <CommandPalette open={cmd.open} onOpenChange={cmd.setOpen} />
      <main className="flex min-h-screen flex-col">
        <Hero />
        <TrustBar />
        <ToolCategories />
        <AISection />
        <Features />
        <WorkflowPreview />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}

/* ─── HERO ──────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-chart-4/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: copy */}
          <div className="flex flex-col items-start">
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-primary/20 bg-primary/5 py-1.5 pl-1.5 pr-3 text-primary"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-xs font-medium">
                The document operating system
              </span>
            </Badge>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Documents,
              <br />
              <span className="gradient-text">Reimagined.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
              Convert, edit, automate, and understand your documents with one
              intelligent workspace. Every tool you need — powered by AI.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="group h-12 px-7 text-base" asChild>
                <Link href="/auth">
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base"
                asChild
              >
                <Link href="/tools">
                  Explore Tools
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                Private &amp; secure
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                30+ tools
              </span>
            </div>
          </div>

          {/* Right: interactive workspace mockup */}
          <HeroWorkspace />
        </div>
      </div>
    </section>
  );
}

function HeroWorkspace() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { icon: Upload, label: 'Upload', color: 'text-primary' },
    { icon: ScanText, label: 'OCR', color: 'text-chart-2' },
    { icon: Sparkles, label: 'AI Summary', color: 'text-chart-4' },
    { icon: FileText, label: 'Download', color: 'text-success' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % (steps.length + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-chart-4/10 blur-2xl" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-border/60 bg-card/80 p-1 shadow-2xl backdrop-blur-sm">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <div className="ml-2 flex-1 truncate rounded-md bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            sztools.app/workspace
          </div>
        </div>

        {/* Workspace body */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {/* Thumbnails */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'aspect-[3/4] rounded-lg border bg-muted/40 p-2 transition-all',
                  i === 1 && 'border-primary/40 ring-1 ring-primary/20',
                )}
              >
                <div className="h-full w-full rounded bg-muted/60 p-1.5">
                  <div className="mb-1 h-1 w-3/4 rounded bg-muted-foreground/20" />
                  <div className="mb-1 h-1 w-full rounded bg-muted-foreground/15" />
                  <div className="mb-1 h-1 w-5/6 rounded bg-muted-foreground/15" />
                  <div className="mb-1 h-1 w-2/3 rounded bg-muted-foreground/10" />
                  <div className="mb-1 h-1 w-full rounded bg-muted-foreground/15" />
                  <div className="h-1 w-3/4 rounded bg-muted-foreground/10" />
                </div>
              </div>
            ))}
          </div>

          {/* Main preview */}
          <div className="col-span-2 space-y-3">
            <div className="aspect-[4/3] rounded-xl border border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 p-4">
              <div className="mb-3 h-2 w-1/3 rounded bg-muted-foreground/20" />
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded bg-muted-foreground/15" />
                <div className="h-1.5 w-5/6 rounded bg-muted-foreground/15" />
                <div className="h-1.5 w-full rounded bg-muted-foreground/15" />
                <div className="h-1.5 w-3/4 rounded bg-muted-foreground/10" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-8 rounded-lg bg-primary/10" />
                <div className="h-8 rounded-lg bg-chart-2/10" />
                <div className="h-8 rounded-lg bg-chart-4/10" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full rounded bg-muted-foreground/10" />
                <div className="h-1.5 w-2/3 rounded bg-muted-foreground/10" />
              </div>
            </div>

            {/* Workflow pipeline */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Active Workflow
                </span>
                <span className="flex items-center gap-1 text-xs text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Processing
                </span>
              </div>
              <div className="flex items-center gap-1">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i === activeStep;
                  const isDone = i < activeStep;
                  return (
                    <div key={i} className="flex items-center gap-1">
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg border transition-all',
                          isActive &&
                            'scale-110 border-primary/40 bg-primary/15 shadow-lg shadow-primary/20',
                          isDone &&
                            'border-success/30 bg-success/10',
                          !isActive &&
                            !isDone &&
                            'border-border/40 bg-muted/50',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 transition-colors',
                            isActive && step.color,
                            isDone && 'text-success',
                            !isActive && !isDone && 'text-muted-foreground/50',
                          )}
                        />
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={cn(
                            'h-px w-4 transition-all',
                            isDone ? 'bg-success/40' : 'bg-border/40',
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI badge */}
      <div className="absolute -bottom-4 -left-4 animate-float rounded-xl border border-border/60 bg-card p-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">AI Assistant</p>
            <p className="text-[10px] text-muted-foreground">
              &ldquo;Summarize this document&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Floating compression badge */}
      <div
        className="absolute -right-4 top-1/4 animate-float rounded-xl border border-border/60 bg-card p-3 shadow-xl"
        style={{ animationDelay: '1s' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
            <Zap className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-semibold">74% smaller</p>
            <p className="text-[10px] text-muted-foreground">12.4 MB → 3.2 MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TRUST BAR ──────────────────────────────────────────────────────── */

function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
          <span className="font-medium">Trusted by teams at</span>
          {['NORTHWIND', 'Acme Co', 'Lumen', 'Vertex', 'Cascade', 'Helix'].map(
            (name) => (
              <span
                key={name}
                className="font-display text-lg font-bold tracking-tight opacity-40 transition-opacity hover:opacity-70"
              >
                {name}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── TOOL CATEGORIES ───────────────────────────────────────────────── */

function ToolCategories() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Every tool you need"
          title="One workspace. Every document task."
          subtitle="Six intelligent categories covering everything from creating and converting to protecting and understanding your documents."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const catTools = getToolsByCategory(cat.id);
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                      <Icon className={cn('h-5.5 w-5.5', cat.accent)} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {catTools.slice(0, 5).map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.slug}
                          href={`/tools/${tool.slug}`}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                        >
                          <ToolIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 font-medium">
                            {tool.name}
                          </span>
                          {tool.badge && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'h-5 text-[10px]',
                                tool.badge === 'ai' &&
                                  'bg-primary/10 text-primary',
                                tool.badge === 'new' &&
                                  'bg-success/10 text-success',
                                tool.badge === 'beta' &&
                                  'bg-chart-4/10 text-chart-4',
                              )}
                            >
                              {tool.badge}
                            </Badge>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      );
                    })}
                  </div>

                  <Link
                    href={`/tools?category=${cat.id}`}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:gap-2"
                  >
                    View all {catTools.length} tools
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── AI SECTION ─────────────────────────────────────────────────────── */

function AISection() {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-muted/20 py-20 sm:py-28">
      <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: AI chat mockup */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-2.5 border-b border-border/40 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Document Assistant</p>
                  <p className="text-xs text-success">● Online</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    What is this contract about?
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
                    This is a 12-month service agreement between Acme Co and
                    Northwind Inc, effective January 2025. Key terms include a
                    monthly fee of $4,500, a 30-day termination clause, and
                    mutual confidentiality obligations.
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        Contract
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        12 pages
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        98% confidence
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User follow-up */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    Find all dates and amounts
                  </div>
                </div>

                {/* AI extraction */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
                    <div className="space-y-1.5">
                      {[
                        ['Jan 1, 2025', 'Effective date'],
                        ['Dec 31, 2025', 'Expiration'],
                        ['$4,500/mo', 'Monthly fee'],
                        ['$54,000', 'Annual total'],
                      ].map(([val, label]) => (
                        <div
                          key={val}
                          className="flex items-center justify-between gap-4 rounded-lg bg-background/60 px-2.5 py-1.5"
                        >
                          <span className="font-mono text-xs font-semibold">
                            {val}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2.5">
                <Wand2 className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm text-muted-foreground">
                  Ask anything about your document…
                </span>
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ↵
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div className="order-1 lg:order-2">
            <Badge
              variant="outline"
              className="mb-4 gap-1.5 border-chart-4/20 bg-chart-4/5 text-chart-4"
            >
              <Brain className="h-3 w-3" />
              AI-Powered
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Just ask.
              <br />
              <span className="gradient-text">Your documents answer.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty">
              No more hunting for the right tool. Tell SZ TOOLS what you want in
              plain language — it understands the intent and builds the workflow
              for you.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Sparkles,
                  title: 'Summarize',
                  desc: '"Give me a 5-point summary of this report."',
                },
                {
                  icon: GitCompare,
                  title: 'Compare',
                  desc: '"What changed between these two versions?"',
                },
                {
                  icon: Languages,
                  title: 'Translate',
                  desc: '"Translate this contract into Arabic."',
                },
                {
                  icon: ScanText,
                  title: 'Extract',
                  desc: '"Find all names, dates, prices and emails."',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button className="mt-8 h-12 px-6" size="lg" asChild>
              <Link href="/assistant">
                Try the AI Assistant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ───────────────────────────────────────────────────────── */

function Features() {
  const features = [
    {
      icon: Layers,
      title: 'Visual Document Workspace',
      desc: 'Page thumbnails, drag-to-reorder, rotate, delete, and duplicate — a real editor, not just an upload-result screen.',
    },
    {
      icon: Zap,
      title: 'Multi-Step Workflows',
      desc: 'Chain tools into pipelines: upload → OCR → compress → watermark → protect → download. Save and reuse them.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-First Architecture',
      desc: 'Private encrypted storage, signed URLs, automatic cleanup, and a clear &ldquo;delete now&rdquo; — your documents stay yours.',
    },
    {
      icon: Brain,
      title: 'AI Document Intelligence',
      desc: 'Summarize, ask questions, extract entities, translate, and analyze — all grounded in your actual document content.',
    },
    {
      icon: FileStack,
      title: 'Batch Processing',
      desc: 'Upload 50 files, apply one operation, and download as a ZIP. Individual progress, retry, and download-all.',
    },
    {
      icon: Eye,
      title: 'Document Comparison',
      desc: 'Visually diff two documents — added text, removed text, and changed sections with a clear summary.',
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Built for professionals"
          title="More than a PDF converter"
          subtitle="SZ TOOLS is a complete document platform — built for speed, privacy, and the way modern teams actually work."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── WORKFLOW PREVIEW ───────────────────────────────────────────────── */

function WorkflowPreview() {
  const steps = [
    { icon: Upload, label: 'Upload', desc: 'Drag & drop your files' },
    { icon: ScanText, label: 'OCR', desc: 'Recognize text in scans' },
    { icon: Sparkles, label: 'Remove Blanks', desc: 'Auto-detect empty pages' },
    { icon: Zap, label: 'Compress', desc: '74% size reduction' },
    { icon: Lock, label: 'Protect', desc: 'Add password encryption' },
    { icon: FileText, label: 'Download', desc: 'Get your result' },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Automation"
          title="Build pipelines, not just files"
          subtitle="Combine tools into visual multi-step workflows. Configure each step, preview, and execute — then save it for next time."
        />

        <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-1 items-center gap-2">
                  <div className="group flex-1 rounded-xl border border-border/40 bg-muted/30 p-4 text-center transition-all hover:border-primary/30 hover:bg-primary/5">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground/30 lg:block" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl bg-muted/30 p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold">Workflow ready</p>
                <p className="text-xs text-muted-foreground">
                  6 steps · Estimated time: ~45s
                </p>
              </div>
            </div>
            <Button className="h-10">
              <Zap className="mr-1.5 h-4 w-4" />
              Execute Workflow
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA SECTION ────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Ready to rethink how you
          <br />
          <span className="gradient-text">work with documents?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
          Join thousands of professionals using SZ TOOLS to convert, edit, and
          understand their documents — all in one intelligent workspace.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-12 px-7 text-base" asChild>
            <Link href="/auth">
              Start Creating — Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-7 text-base"
            asChild
          >
            <Link href="/tools">Browse all tools</Link>
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-warning text-warning"
            />
          ))}
          <span className="ml-2">Rated 4.9/5 by 12,000+ users</span>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────── */

function Footer() {
  const footerLinks = {
    Product: ['Tools', 'Pricing', 'AI Assistant', 'Workflows', 'Templates'],
    Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
    Resources: ['Help Center', 'API Docs', 'Guides', 'Community', 'Status'],
    Legal: ['Privacy', 'Terms', 'Security', 'GDPR', 'Cookies'],
  };

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 2h7l5 5v15a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0V2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 2v5h5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 13h6M9 17h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-display text-xl font-bold">SZ TOOLS</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The future operating system for documents. Convert, edit,
              automate, and understand — all in one intelligent workspace.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 text-sm font-semibold">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 SZ TOOLS. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── SHARED ─────────────────────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-lg text-muted-foreground text-pretty">
        {subtitle}
      </p>
    </div>
  );
}
