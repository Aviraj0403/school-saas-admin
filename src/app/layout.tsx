import type { Metadata } from 'next';
import { Inter, Outfit, Geist_Mono } from 'next/font/google';
import 'primeicons/primeicons.css';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/toast-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EduNexus — School Management, Simplified',
  description:
    'Admissions, fees, attendance, exams, transport and parent communication — one platform for your whole school.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable}`}
    >
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
