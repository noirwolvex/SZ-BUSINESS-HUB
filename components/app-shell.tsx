'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  Brain,
  FileText,
  Crown,
  ChevronLeft,
  Menu,
  X,
  History,
  Star,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Navbar } from '@/components/navbar';
import { CommandPalette } from '@/components/command-palette';
import { useCommandPalette } from '@/hooks/use-command-palette';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tools', label: 'All Tools', icon: Wrench },
  { href: '/assistant', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { href: '/dashboard/files', label: 'My Files', icon: FolderOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cmd = useCommandPalette();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar onCommandOpen={cmd.toggle} />
      <CommandPalette open={cmd.open} onOpenChange={cmd.setOpen} />

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-border/40 bg-muted/20 md:block">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-2xl">
              <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
                <span className="font-display text-lg font-bold">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
          {/* Mobile sidebar trigger */}
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {navItems.find((n) => pathname?.startsWith(n.href))?.label ??
                'SZ TOOLS'}
            </span>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Upgrade to Pro</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Unlock AI tools, batch processing, and larger file limits.
        </p>
        <Button size="sm" className="w-full" asChild>
          <Link href="/auth">Get started</Link>
        </Button>
      </div>

    </div>
  );
}
