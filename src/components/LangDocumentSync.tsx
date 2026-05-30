"use client";

import { useEffect } from "react";
import { useLang } from "@/context/LangContext";

/** Keep html lang in sync and block browser auto-translate prompts */
export function LangDocumentSync() {
  const { lang } = useLang();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.setAttribute("translate", "no");
    root.classList.add("notranslate");
    document.body?.classList.add("notranslate");
  }, [lang]);

  return null;
}
