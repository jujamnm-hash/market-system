import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lang, TranslationKey } from '../i18n';
import { getT } from '../i18n';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  setLang: () => {},
  t: getT('ar'),
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('app_lang') as Lang) ?? 'ar';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('app_lang', l);
    setLangState(l);
  };

  const t = getT(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
