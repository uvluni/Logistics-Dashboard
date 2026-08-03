'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations, Language } from '@/i18n/translations';

function t(key: string, language: Language): string {
  return translations[language]?.[key] || key;
}

const Navbar: React.FC = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '60px',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Logo and Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
        }}
      >
        {/* Three Arrow Logo */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          {/* Three arrows pointing right with overlapping effect */}
          <path
            d="M6 8L20 8M16 4L24 12L16 20"
            stroke="var(--color-blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 16L20 16M16 12L24 20L16 28"
            stroke="var(--color-blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          <path
            d="M4 24L18 24M14 20L22 28L14 36"
            stroke="var(--color-blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>

        {/* Title */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Integration Layer
        </h1>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: isRTL ? 'auto' : 0,
          marginRight: isRTL ? 0 : 'auto',
        }}
      >
        {/* Language Switcher */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setLanguage('he')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor:
                language === 'he'
                  ? 'var(--color-blue)'
                  : 'transparent',
              color:
                language === 'he'
                  ? 'white'
                  : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="עברית"
          >
            עב
          </button>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor:
                language === 'en'
                  ? 'var(--color-blue)'
                  : 'transparent',
              color:
                language === 'en'
                  ? 'white'
                  : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('es')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor:
                language === 'es'
                  ? 'var(--color-blue)'
                  : 'transparent',
              color:
                language === 'es'
                  ? 'white'
                  : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Español"
          >
            ES
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: '1',
            transition: 'all 0.2s',
          }}
          title={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
