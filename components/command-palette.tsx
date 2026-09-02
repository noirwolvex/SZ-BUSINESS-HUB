'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { tools, categories, type Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q) || q.includes(k)),
    );
  }, [search]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Tool[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [filtered]);

  const runTool = (slug: string) => {
    onOpenChange(false);
    setSearch('');
    router.push(`/tools/${slug}`);
  };

  const runCommand = (cmd: string) => {
    onOpenChange(false);
    setSearch('');
    router.push(cmd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-2xl">
        <CommandPrimitive className="flex flex-col" loop>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              placeholder="Type a command or search tools…"
              className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onValueChange={setSearch}
            />
            <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          <CommandPrimitive.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
            <CommandPrimitive.Empty>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No tools found for &ldquo;{search}&rdquo;
                </p>
              </div>
            </CommandPrimitive.Empty>

            {!search && (
              <CommandPrimitive.Group heading="Quick Actions" className="mb-2">
                <CommandPrimitive.Item
                  onSelect={() => runCommand('/dashboard')}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Go to Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      Your workspace and recent files
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CommandPrimitive.Item>
                <CommandPrimitive.Item
                  onSelect={() => runCommand('/assistant')}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
                    <Sparkles className="h-4 w-4 text-chart-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Ask AI Assistant</p>
                    <p className="text-xs text-muted-foreground">
                      Chat with your documents
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>
            )}

            {Array.from(grouped.entries()).map(([catId, catTools]) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat || catTools.length === 0) return null;
              const Icon = cat.icon;
              return (
                <CommandPrimitive.Group
                  key={catId}
                  heading={cat.label}
                  className="mb-1"
                >
                  {catTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <CommandPrimitive.Item
                        key={tool.slug}
                        onSelect={() => runTool(tool.slug)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-accent"
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg bg-muted',
                          )}
                        >
                          <ToolIcon className={cn('h-4 w-4', cat.accent)} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                        {tool.badge && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'shrink-0 text-[10px]',
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
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              );
            })}
          </CommandPrimitive.List>

          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              to navigate
              <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              <span>SZ TOOLS</span>
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

function Icon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
