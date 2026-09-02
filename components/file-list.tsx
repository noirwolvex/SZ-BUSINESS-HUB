'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type FileRecord } from '@/lib/supabase-client';
import {
  FileText,
  Star,
  Trash2,
  Download,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  FilePlus2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FileListProps {
  filter: 'all' | 'favorites' | 'history';
  title: string;
  emptyMessage: string;
  emptyIcon?: 'star' | 'file' | 'history';
}

export function FileList({ filter, title, emptyMessage, emptyIcon = 'file' }: FileListProps) {
  const [records, setRecords] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('file_records').select('*').order('created_at', { ascending: false });
      if (filter === 'favorites') {
        query = query.eq('is_favorite', true);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const toggleFavorite = async (id: string, current: boolean) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: !current } : r)),
    );
    await supabase.from('file_records').update({ is_favorite: !current }).eq('id', id);
    if (filter === 'favorites' && !current === false) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const deleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await supabase.from('file_records').delete().eq('id', id);
  };

  const filteredRecords = searchQuery
    ? records.filter(
        (r) =>
          r.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tool_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : records;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={loadRecords} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {records.length > 0 && (
        <input
          type="text"
          placeholder="Search by file name or tool..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-border/60 bg-card px-4 text-sm outline-none focus:border-primary/40"
        />
      )}

      {filteredRecords.length === 0 ? (
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {filteredRecords.map((record, i) => (
            <div
              key={record.id}
              className={cn(
                'flex items-center gap-4 p-4 transition-colors hover:bg-muted/40',
                i > 0 && 'border-t border-border/40',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{record.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {record.tool_name} · {formatRelativeTime(record.created_at)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{formatBytes(record.file_size)}</p>
                {record.status === 'completed' ? (
                  <p className="flex items-center justify-end gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </p>
                ) : (
                  <p className="flex items-center justify-end gap-1 text-xs text-destructive">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleFavorite(record.id, record.is_favorite)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  record.is_favorite
                    ? 'text-warning hover:bg-warning/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Star className={cn('h-4 w-4', record.is_favorite && 'fill-current')} />
              </button>
              <button
                onClick={() => deleteRecord(record.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link
                href={`/tools/${record.tool_slug}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: 'star' | 'file' | 'history' }) {
  const Icon = icon === 'star' ? Star : icon === 'history' ? FilePlus2 : FileText;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/tools">Browse Tools</Link>
      </Button>
    </div>
  );
}
