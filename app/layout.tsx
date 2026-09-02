import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import FabricImageSafety from '@/components/image-editor/fabric-image-safety';

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
    default: 'SZ BUSINESS HUB — One Platform, Many Business Worlds',
    template: '%s · SZ BUSINESS HUB',
  },
  description:
    'A business platform for independent applications, websites, AI systems, and operational tools — organized inside one scalable Hub.',
  keywords: [
    'business platform',
    'business apps',
    'business tools',
    'CRM',
    'business analytics',
    'AI business tools',
    'document workspace',
    'SZ BUSINESS HUB',
  ],
  authors: [{ name: 'SZ BUSINESS HUB' }],
  openGraph: {
    title: 'SZ BUSINESS HUB — One Platform, Many Business Worlds',
    description:
      'Discover business applications, websites, AI systems, and operational tools inside one scalable platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SZ BUSINESS HUB — One Platform, Many Business Worlds',
    description:
      'A growing platform for independent business products and digital experiences.',
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
            <FabricImageSafety />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
