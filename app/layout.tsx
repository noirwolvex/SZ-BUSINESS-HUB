import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SZ TOOLS — Documents, Reimagined',
    template: '%s · SZ TOOLS',
  },
  description:
    'Convert, edit, automate, and understand your documents with one intelligent workspace. The future operating system for documents.',
  keywords: [
    'PDF tools',
    'merge PDF',
    'compress PDF',
    'PDF to Word',
    'OCR',
    'document AI',
    'split PDF',
    'PDF editor',
  ],
  authors: [{ name: 'SZ TOOLS' }],
  openGraph: {
    title: 'SZ TOOLS — Documents, Reimagined',
    description:
      'Convert, edit, automate, and understand your documents with one intelligent workspace.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SZ TOOLS — Documents, Reimagined',
    description:
      'Convert, edit, automate, and understand your documents with one intelligent workspace.',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
