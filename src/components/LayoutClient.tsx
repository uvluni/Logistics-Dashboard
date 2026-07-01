'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

export default function LanguageInitializer() {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  return null;
}
