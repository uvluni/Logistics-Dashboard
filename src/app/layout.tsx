import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import LanguageInitializer from '@/components/LanguageInitializer';

export const metadata: Metadata = {
  title: 'ROADNET',
  description: 'Distribution Planning Report',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-gray-50" suppressHydrationWarning>
        <LanguageProvider>
          <LanguageInitializer />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
