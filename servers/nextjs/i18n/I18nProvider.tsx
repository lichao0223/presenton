"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  Locale,
  isSupportedLocale,
  translateText,
} from "./translations";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: Locale) {
  window.localStorage.setItem(I18N_STORAGE_KEY, locale);
  document.cookie = `${I18N_STORAGE_KEY}=${encodeURIComponent(
    locale
  )}; path=/; max-age=31536000; SameSite=Lax`;
}

function getInitialLocale(initialLocale: Locale): Locale {
  if (typeof window === "undefined") return initialLocale;

  const savedLocale = window.localStorage.getItem(I18N_STORAGE_KEY);
  if (isSupportedLocale(savedLocale)) {
    return savedLocale;
  }

  const browserLocale = window.navigator.language;
  return browserLocale.toLowerCase().startsWith("zh") ? "zh-CN" : DEFAULT_LOCALE;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    getInitialLocale(initialLocale)
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (text) => translateText(locale, text),
    }),
    [locale, setLocale]
  );

  useEffect(() => {
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
    document.documentElement.dataset.uiLocale = locale;
    persistLocale(locale);
    document.documentElement.style.visibility = "";
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
