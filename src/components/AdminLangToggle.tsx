"use client";

import { useLang } from "@/context/LangContext";

/** Prominent language switch for admin panel */
export function AdminLangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex rounded-xl border-2 border-white/40 bg-white/15 p-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setLang("te")}
        className={`min-h-[40px] rounded-lg px-3 text-sm font-bold transition-colors sm:px-4 sm:text-base ${
          lang === "te" ? "bg-white text-[#e85d00]" : "text-white"
        }`}
      >
        తెలుగు
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-h-[40px] rounded-lg px-3 text-sm font-bold transition-colors sm:px-4 sm:text-base ${
          lang === "en" ? "bg-white text-[#e85d00]" : "text-white"
        }`}
      >
        English
      </button>
    </div>
  );
}
