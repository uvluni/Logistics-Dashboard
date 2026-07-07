import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'ROADNET',
  description: 'Distribution Planning Report',
  icons: {
    icon: '/favicon.svg',
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
