'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  FileText,
  Zap,
  Brain,
  HardDrive,
  FileStack,
  Wand2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { categories, getToolsByCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { supabase, type FileRecord } from '@/lib/supabase-client';

export default function DashboardPage() {
  return (
    <AppShell>
    <RequireAuth>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-muted-foreground">
            What would you like to do with your documents today?
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Upload}
            title="Upload File"
            desc="Drag & drop to start"
            href="/tools"
            color="text-primary"
          />
          <QuickAction
            icon={Brain}
            title="Ask AI"
            desc="Chat with documents"
            href="/assistant"
            color="text-chart-4"
          />
          <QuickAction
            icon={Wand2}
            title="AI Generate"
            desc="Create from a prompt"
            href="/tools/ai-document-generator"
            color="text-chart-2"
          />
          <QuickAction
            icon={FileStack}
            title="Merge PDFs"
            desc="Combine files"
            href="/tools/merge-pdf"
            color="text-chart-3"
          />
        </div>

        {/* Upload dropzone */}
        <Dropzone />

        {/* Tool categories */}
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">All Tools</h2>
            <Link
              href="/tools"
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const catTools = getToolsByCategory(cat.id);
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className={cn('h-5 w-5', cat.accent)} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {catTools.length} tools
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {catTools.slice(0, 6).map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link
                          key={tool.slug}
                          href={`/tools/${tool.slug}`}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          <ToolIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{tool.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent files + Stats */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Recent files */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Recent Files</h2>
              <Link
                href="/dashboard/history"
                className="text-sm font-medium text-primary"
              >
                View all
              </Link>
            </div>
            <RecentFiles />
          </div>

          {/* Stats */}
          <div>
            <h2 className="mb-4 font-display text-xl font-bold">Usage</h2>
            <UsageStats />
          </div>
        </div>
      </div>
    </RequireAuth>
    </AppShell>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  href,
  color,
}: {
  icon: typeof Upload;
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-transform group-hover:scale-110">
        <Icon className={cn('h-6 w-6', color)} />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Dropzone() {
  return (
    <Link
      href="/tools"
      className="group relative block overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="absolute left-1/2 top-1/2 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <p className="font-display text-lg font-semibold">
          Drop your files here
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or{' '}
          <span className="font-medium text-primary underline-offset-2 group-hover:underline">
            browse your device
          </span>{' '}
          — PDF, Word, Excel, images
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-success" /> Up to 25 MB
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-success" /> Private &amp; secure
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-success" /> Auto-deleted
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecentFiles() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('file_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        setFiles(data || []);
      } catch {
        // silently fail — dashboard shouldn't crash
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Link
        href="/tools"
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 py-12 text-center transition-colors hover:border-primary/40"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No recent files. Process a document to get started.
        </p>
        <span className="mt-2 text-sm font-medium text-primary">Browse tools</span>
      </Link>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      {files.map((file, i) => (
        <Link
          key={file.id}
          href={`/tools/${file.tool_slug}`}
          className={cn(
            'flex items-center gap-4 p-4 transition-colors hover:bg-muted/40',
            i > 0 && 'border-t border-border/40',
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {file.tool_name} · {formatRelativeTime(file.created_at)}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{formatBytes(file.file_size)}</p>
            <p className="flex items-center justify-end gap-1 text-xs text-success">
              <Check className="h-3 w-3" />
              Done
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

function UsageStats() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { count } = await supabase
          .from('file_records')
          .select('*', { count: 'exact', head: true });
        const { data } = await supabase
          .from('file_records')
          .select('file_size');
        const totalSize = data?.reduce((sum, r) => sum + (r.file_size || 0), 0) || 0;
        const { count: favCount } = await supabase
          .from('file_records')
          .select('*', { count: 'exact', head: true })
          .eq('is_favorite', true);
        setStats({
          totalFiles: count || 0,
          totalSize,
          favorites: favCount || 0,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const fileSizeMB = stats.totalSize / (1024 * 1024);
  const storageProgress = Math.min(100, (fileSizeMB / 5120) * 100);

  return (
    <div className="space-y-4">
      <StatCard
        icon={Zap}
        label="Files processed"
        value={loading ? '—' : String(stats.totalFiles)}
        sub="All time"
        progress={Math.min(100, (stats.totalFiles / 100) * 100)}
      />
      <StatCard
        icon={HardDrive}
        label="Storage used"
        value={loading ? '—' : formatBytes(stats.totalSize)}
        sub="of 5 GB"
        progress={loading ? 0 : storageProgress}
      />
      <StatCard
        icon={Brain}
        label="Favorites"
        value={loading ? '—' : String(stats.favorites)}
        sub="Starred files"
        progress={Math.min(100, (stats.favorites / 20) * 100)}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub: string;
  progress: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-display text-xl font-bold">{value}</span>
      </div>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
