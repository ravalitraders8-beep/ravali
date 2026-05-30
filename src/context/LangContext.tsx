"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/lib/types";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "te";
    const saved = localStorage.getItem("ravali-lang") as Lang | null;
    return saved === "en" || saved === "te" ? saved : "te";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("ravali-lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "te" ? "en" : "te");
  }, [lang, setLang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className="min-h-[44px] rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm"
    >
      {lang === "te" ? "English" : "తెలుగు"}
    </button>
  );
}
