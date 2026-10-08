import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/toast-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EduNexus OS — School SaaS Admin',
  description: 'Enterprise School Management SaaS Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <QueryProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
