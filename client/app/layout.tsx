import { Navbar } from '@/components/navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/contexts/QueryProvider';
import { locales } from '@/lib/config';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { getLocaleCookie, getThemeCookie } from './action';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'DevBlog - Share Your Development Journey',
  description:
    'A modern blog platform for developers to share their knowledge, experiences, and insights with the community.',
  keywords: ['blog', 'development', 'programming', 'technology', 'coding'],
  authors: [{ name: 'DevBlog Team' }],
  openGraph: {
    title: 'DevBlog - Share Your Development Journey',
    description:
      'A modern blog platform for developers to share their knowledge, experiences, and insights with the community.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevBlog - Share Your Development Journey',
    description:
      'A modern blog platform for developers to share their knowledge, experiences, and insights with the community.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocaleCookie();
  const theme = await getThemeCookie();

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <Toaster />
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen bg-background">
                  <Navbar locale={locale} theme={theme} />
                  <main className="my-8 mx-auto container">{children}</main>
                </div>
              </ThemeProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
