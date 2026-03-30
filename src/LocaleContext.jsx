import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { defaultLocale, createT } from './i18n';

const STORAGE_KEY = 'alteliebe-locale';

function getInitialLocale() {
  // 1. Check localStorage (returning visitor)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['en', 'nl', 'de'].includes(stored)) return stored;
  } catch (e) { /* localStorage unavailable */ }

  // 2. Check browser language
  const browserLang = navigator.language?.slice(0, 2);
  if (['en', 'nl', 'de'].includes(browserLang)) return browserLang;

  // 3. Default
  return defaultLocale;
}

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (e) { /* ignore */ }
    // Update html lang attribute for accessibility and SEO
    document.documentElement.lang = newLocale;
  }, []);

  const t = useMemo(() => createT(locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
