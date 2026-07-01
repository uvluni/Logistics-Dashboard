'use client';

import { LanguageProvider } from '@/context/LanguageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

function LanguageUpdater() {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LanguageUpdater />
      {children}
    </LanguageProvider>
  );
}
