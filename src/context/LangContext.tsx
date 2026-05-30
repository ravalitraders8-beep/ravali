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
  const { lang, setLang } = useLang();
  return (
    <div className="flex overflow-hidden rounded-full border-2 border-[#1a2744]/20 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setLang("te")}
        className={`min-h-[44px] px-4 text-sm font-black ${
          lang === "te" ? "bg-[#1a2744] text-white" : "text-[#1a2744]"
        }`}
      >
        తెలుగు
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-h-[44px] px-4 text-sm font-black ${
          lang === "en" ? "bg-[#1a2744] text-white" : "text-[#1a2744]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
