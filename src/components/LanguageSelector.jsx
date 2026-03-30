import React from 'react';
import { useLocale } from '../LocaleContext';
import { LOCALES } from '../i18n';

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="lang-selector" role="radiogroup" aria-label="Language">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          className={`lang-btn ${locale === code ? 'active' : ''}`}
          onClick={() => setLocale(code)}
          aria-checked={locale === code}
          role="radio"
          title={label}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
