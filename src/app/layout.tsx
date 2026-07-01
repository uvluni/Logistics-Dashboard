import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import LayoutClient from '@/components/LayoutClient';

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
    <html suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-gray-50" suppressHydrationWarning>
        <LanguageProvider>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}

function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  return <LayoutClient>{children}</LayoutClient>;
}
