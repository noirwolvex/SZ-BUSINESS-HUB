'use client';

import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { FileList } from '@/components/file-list';

export default function FavoritesPage() {
  return (
    <AppShell>
      <RequireAuth>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">Favorites</h1>
            <p className="mt-1 text-muted-foreground">
              Your starred files for quick access.
            </p>
          </div>
          <FileList
            filter="favorites"
            title="Favorites"
            emptyMessage="No favorites yet. Tap the star icon on any file to save it here."
            emptyIcon="star"
          />
        </div>
      </RequireAuth>
    </AppShell>
  );
}
