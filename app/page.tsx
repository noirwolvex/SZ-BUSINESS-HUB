'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Cloud,
  FileText,
  Layers3,
  LockKeyhole,
  Network,
  Plus,
  Rocket,
  Sparkles,
  Store,
  Workflow,
  Zap,
} from 'lucide-react';

const products = [
  {
    name: 'SZ TOOLS',
    label: 'Document Workspace',
    description:
      'A complete business document workspace with PDF tools, AI document intelligence, editing, workflows, files, and team-ready utilities.',
    href: '/tools',
    icon: FileText,
    accent: 'from-primary/90 via-primary/70 to-chart-2/80',
    badge: 'Live now',
    live: true,
    meta: ['30+ tools', 'AI powered', 'Workspace'],
  },
  {
    name: 'CRM PLATFORM',
    label: 'Customer Operations',
    description:
      'A dedicated customer platform for leads, relationships, pipelines, follow-ups, and business visibility.',
    href: '#',
    icon: Network,
    accent: 'from-chart-2/80 via-chart-4/70 to-primary/70',
    badge: 'Coming soon',
    live: false,
    meta: ['Leads', 'Pipeline', 'Customers'],
  },
  {
    name: 'BUSINESS ANALYTICS',
    label: 'Insights & Reporting',
    description:
      'A future analytics product for dashboards, KPIs, reporting, trends, and decision-ready business intelligence.',
    href: '#',
    icon: BarChart3,
    accent: 'from-chart-4/80 via-chart-1/70 to-chart-2/75',
    badge: 'Coming soon',
    live: false,
    meta: ['KPIs', 'Reports', 'Insights'],
  },
  {
    name: 'OPERATIONS HUB',
    label: 'Business Workflows',
    description:
      'A future operations app for processes, approvals, internal workflows, task orchestration, and automation.',
    href: '#',
    icon: Workflow,
    accent: 'from-chart-5/80 via-chart-4/70 to-primary/75',
    badge: 'Coming soon',
    live: false,
    meta: ['Processes', 'Automation', 'Teams'],
  },
];

const platformAreas = [
  { icon: BriefcaseBusiness, title: 'Business Apps', text: 'Purpose-built products for everyday operations.' },
  { icon: Store, title: 'Business Websites', text: 'Independent sites and customer-facing experiences.' },
  { icon: Sparkles, title: 'AI Systems', text: 'Intelligent tools that augment real workflows.' },
  { icon: Layers3, title: 'Connected Platform', text: 'One hub with room for many independent products.' },
];

export default function BusinessHubPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-chart-4/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-chart-2/10 blur-[120px]" />

      <header className="relative z-20 border-b border-border/40 bg-background/45 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
              <Rocket className="h-5 w-5" />
              <span className="absolute -inset-1 -z-10 rounded-3xl bg-primary/15 blur-md transition-opacity group-hover:opacity-100" />
            </div>
            <div className="min-w-0">
              <div className="font-display truncate text-lg font-bold tracking-tight sm:text-xl">SZ BUSINESS HUB</div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">One platform · many business worlds</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              Business platform
            </span>
            <Link
              href="/tools"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
            >
              Open SZ TOOLS
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                The business platform
              </div>

              <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                One hub.
                <br />
                <span className="gradient-text">Many business worlds.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Discover independent business applications, websites, AI systems, and operational tools — all organized inside one scalable platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#products"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                >
                  Explore platform
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent"
                >
                  Launch SZ TOOLS
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success)/.6)]" />
                  1 product live
                </span>
                <span className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4" />
                  Designed for expansion
                </span>
                <span className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" />
                  Business-ready foundation
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-4/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/55 p-2 shadow-2xl backdrop-blur-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-primary/[0.05]" />
                <div className="relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-gradient-to-br from-primary/15 via-background/60 to-chart-4/10 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Platform overview</div>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Your business operating space</h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Layers3 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {platformAreas.map((area, index) => {
                      const Icon = area.icon;
                      return (
                        <div
                          key={area.title}
                          className="group rounded-2xl border border-border/40 bg-background/35 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-primary/5"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/70 transition-transform duration-300 group-hover:scale-110">
                            <Icon className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <p className="mt-3 text-xs font-bold">{area.title}</p>
                          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{area.text}</p>
                          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-2/3 rounded-full bg-primary/60 transition-all duration-500 group-hover:w-full" />
                          </div>
                          <span className="mt-2 block text-[9px] font-semibold text-muted-foreground">Layer {index + 1}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Built to add the next product without rebuilding the platform.</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Each new app can remain independent while living inside the same Hub.</p>
                    </div>
                    <div className="hidden h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/.7)] sm:block" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 hidden animate-float rounded-2xl border border-border/60 bg-card/90 p-3 shadow-xl backdrop-blur-xl sm:block">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Cloud className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Architecture</p>
                    <p className="text-xs font-semibold">Independent products</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 top-1/4 hidden animate-float rounded-2xl border border-border/60 bg-card/90 p-3 shadow-xl backdrop-blur-xl sm:block" style={{ animationDelay: '1.2s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Platform</p>
                    <p className="text-xs font-semibold">Ready to expand</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="relative z-10 border-t border-border/40 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Platform catalog</div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Products inside the Hub</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Every card is a doorway to its own business product. The first one is already live; the others are structured as future expansion slots.</p>
            </div>
            <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">01 live · 03 planned</div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {products.map((product, index) => {
              const Icon = product.icon;
              const card = (
                <div className="group relative h-full overflow-hidden rounded-[1.7rem] border border-border/60 bg-card/55 p-2 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/25 hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-primary/[0.03]" />
                  <div className={`relative min-h-[270px] overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${product.accent} p-6 text-white sm:min-h-[295px] sm:p-7`}>
                    <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/15 transition-transform duration-700 group-hover:scale-125" />
                    <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute right-8 top-8 h-2 w-2 rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,.8)] animate-pulse" />

                    <div className="relative z-10 flex items-start justify-between gap-5">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${product.live ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,.8)]' : 'bg-white/50'}`} />
                          {product.badge}
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-md">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">{product.label}</div>
                            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="hidden rounded-2xl bg-white/10 p-2.5 backdrop-blur-md sm:block">
                        {product.live ? <Zap className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </div>
                    </div>

                    <p className="relative z-10 mt-5 max-w-lg text-sm leading-6 text-white/80">{product.description}</p>

                    <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                      {product.meta.map((meta) => (
                        <span key={meta} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-sm">{meta}</span>
                      ))}
                    </div>

                    <div className="relative z-10 mt-7 flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-foreground shadow-lg transition-all duration-300 group-hover:gap-3">
                        {product.live ? 'Open product' : 'Planned product'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Product {String(index + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              );

              return product.live ? (
                <Link key={product.name} href={product.href} aria-label={`Open ${product.name}`}>
                  {card}
                </Link>
              ) : (
                <div key={product.name} aria-disabled="true" className="cursor-default opacity-80">{card}</div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/40 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">The Hub is the platform. Each product is its own world.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">This architecture gives SZ BUSINESS HUB room to grow into a family of independent business applications and websites without turning every product into one giant codebase.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/tools" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl">
              Launch SZ TOOLS
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#products" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/50 px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent">
              View all products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="font-semibold">SZ BUSINESS HUB · Business products under one platform</span>
          <span>Built to expand one independent product at a time.</span>
        </div>
      </footer>
    </main>
  );
}
