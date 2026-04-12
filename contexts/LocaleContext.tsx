"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import psMessages from "@/messages/ps.json";
import faMessages from "@/messages/fa.json";

export type Locale = "en" | "ps" | "fa";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ps", label: "پښتو", dir: "rtl" },
  { code: "fa", label: "دری", dir: "rtl" },
];

const MESSAGES: Record<Locale, any> = {
  en: enMessages,
  ps: psMessages,
  fa: faMessages,
};

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = "app_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Lazy initializer reads localStorage synchronously on first render
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && ["en", "ps", "fa"].includes(stored) ? stored : "en";
  });

  useEffect(() => {
    const info = LOCALES.find((l) => l.code === locale) || LOCALES[0];
    document.documentElement.lang = locale;
    document.documentElement.dir = info.dir;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  };

  const dir = LOCALES.find((l) => l.code === locale)?.dir || "ltr";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone="Asia/Kabul"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
