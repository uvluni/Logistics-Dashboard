import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROADNET - דוח תכנון הפצה',
  description: 'מערכת בקרה ממשית של תכנון מסלולי הפצה עם KPIs',
  charset: 'utf-8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
