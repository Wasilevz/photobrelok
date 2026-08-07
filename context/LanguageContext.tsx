"use client";

import { createContext, useContext, useSyncExternalStore, useCallback, ReactNode } from "react";
import { translations, Locale, Dict } from "@/lib/i18n";

const STORAGE_KEY = "photobrelok_lang";
// Кастомное событие нужно, чтобы переключение языка отражалось в этой же вкладке —
// нативное 'storage' событие срабатывает только в ДРУГИХ вкладках.
const LANG_CHANGE_EVENT = "photobrelok_lang_change";

function getSnapshot(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "ro") return saved;
    if (navigator.language?.toLowerCase().startsWith("ro")) return "ro";
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — используем русский по умолчанию
  }
  return "ru";
}

// На сервере всегда отдаём "ru", чтобы не было расхождения с клиентским рендером при гидратации
function getServerSnapshot(): Locale {
  return "ru";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANG_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANG_CHANGE_EVENT, callback);
  };
}

interface LanguageContextValue {
  lang: Locale;
  setLang: (l: Locale) => void;
  dict: Dict;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // язык не сохранится между визитами, но переключение в этой сессии всё равно сработает
    }
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage должен использоваться внутри LanguageProvider");
  return ctx;
}
