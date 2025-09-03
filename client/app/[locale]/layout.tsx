import { Navbar } from '@/components/navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

import { locales } from '@/lib/config';

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
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params before using them
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
