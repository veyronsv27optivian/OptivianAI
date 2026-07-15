import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { getLanguage, setLanguage, getAvailableLanguages } from '../../services/i18n';

const LANGUAGE_LABELS = {
  en: 'English',
  // Add more: es: 'Español', fr: 'Français', de: 'Deutsch', ja: '日本語', zh: '中文'
};

export default function LanguageSwitcher({ compact = false }) {
  const [open, setOpen] = useState(false);

  const available = getAvailableLanguages();
  const current = getLanguage();

  const handleChange = (lang) => {
    setLanguage(lang);
    setOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <Globe size={12} />
          {current.toUpperCase()}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[120px]">
            {available.map(lang => (
              <button key={lang} onClick={() => handleChange(lang)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  lang === current ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {LANGUAGE_LABELS[lang] || lang}
                {lang === current && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-all"
      >
        <Globe size={16} />
        {LANGUAGE_LABELS[current] || current}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[150px]">
          {available.map(lang => (
            <button key={lang} onClick={() => handleChange(lang)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                lang === current ? 'text-blue-600 bg-blue-50 font-medium' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang}
              {lang === current && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
