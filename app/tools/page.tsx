'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  categories,
  tools,
  getToolsByCategory,
  searchTools,
  type ToolCategory,
} from '@/lib/tools';
import { cn } from '@/lib/utils';

export default function ToolsPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>(
    'all',
  );

  const filtered = query
    ? searchTools(query)
    : activeCategory === 'all'
      ? tools
      : getToolsByCategory(activeCategory);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            All Tools
          </h1>
          <p className="mt-1 text-muted-foreground">
            {tools.length} tools across {categories.length} categories —
            everything you need to work with documents.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveCategory('all');
              setQuery('');
            }}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
              activeCategory === 'all' && !query
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            All ({tools.length})
          </button>
          {categories.map((cat) => {
            const count = getToolsByCategory(cat.id).length;
            const Icon = cat.icon;
            const active = activeCategory === cat.id && !query;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setQuery('');
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Tool grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-medium">No tools found</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool) => {
              const Icon = tool.icon;
              const cat = categories.find((c) => c.id === tool.category);
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                        <Icon className={cn('h-5.5 w-5.5', cat?.accent)} />
                      </div>
                      {tool.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px]',
                            tool.badge === 'ai' && 'bg-primary/10 text-primary',
                            tool.badge === 'new' &&
                              'bg-success/10 text-success',
                            tool.badge === 'beta' &&
                              'bg-chart-4/10 text-chart-4',
                          )}
                        >
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display font-bold">{tool.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {tool.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
