'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Command, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/tools', label: 'Tools' },
  { href: '/assistant', label: 'AI Assistant' },
];

export function Navbar({ onCommandOpen }: { onCommandOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glass">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
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
          <span className="font-display text-xl font-bold tracking-tight">
            SZ TOOLS
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                pathname?.startsWith(link.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCommandOpen}
            className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="max-w-[140px] truncate text-muted-foreground">
                  {user.email}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Get Started
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              {user ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/auth" onClick={() => setMobileOpen(false)}>Sign in</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/auth" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
