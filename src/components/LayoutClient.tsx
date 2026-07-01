'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL ? 'rtl' : 'ltr';
    html.setAttribute('suppressHydrationWarning', '');
  }, [language, isRTL]);

  return <>{children}</>;
}
