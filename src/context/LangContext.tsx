"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Lang } from "@/lib/types";

const LANG_EVENT = "ravali-lang-change";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

function readLang(): Lang {
  if (typeof window === "undefined") return "te";
  const saved = localStorage.getItem("ravali-lang");
  return saved === "en" || saved === "te" ? saved : "te";
}

function subscribeLang(onChange: () => void) {
  window.addEventListener(LANG_EVENT, onChange);
  return () => window.removeEventListener(LANG_EVENT, onChange);
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "te" as Lang);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem("ravali-lang", l);
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(readLang() === "te" ? "en" : "te");
  }, [setLang]);

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

export function LangToggle({ onDark = false }: { onDark?: boolean }) {
  const { lang, setLang } = useLang();
  const shell = onDark
    ? "border-2 border-white/30 bg-white/10 shadow-md backdrop-blur-sm"
    : "border-2 border-[#1a2744]/20 bg-white shadow-sm";
  const active = onDark ? "bg-white text-[#1a2744]" : "bg-[#1a2744] text-white";
  const inactive = onDark ? "text-white" : "text-[#1a2744]";

  return (
    <div className={`flex overflow-hidden rounded-full ${shell}`}>
      <button
        type="button"
        onClick={() => setLang("te")}
        className={`min-h-[40px] px-3.5 text-sm font-black sm:min-h-[44px] sm:px-4 ${
          lang === "te" ? active : inactive
        }`}
      >
        తెలుగు
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-h-[40px] px-3.5 text-sm font-black sm:min-h-[44px] sm:px-4 ${
          lang === "en" ? active : inactive
        }`}
      >
        EN
      </button>
    </div>
  );
}
