"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * Android PWA install — no blocking popup.
 * First screen tap → Chrome native install dialog.
 * Slim bar above Call button as backup.
 */
export function AndroidInstall() {
  const { lang } = useLang();
  const { installed, canInstall, isAndroid, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const triedAutoRef = useRef(false);

  const showBar = isAndroid && canInstall && !installed;

  useEffect(() => {
    if (installed || !isAndroid || !canInstall) return;
    if (triedAutoRef.current) return;

    const tryInstall = async () => {
      if (triedAutoRef.current) return;
      triedAutoRef.current = true;
      cleanup();
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    };

    const cleanup = () => {
      document.removeEventListener("touchstart", tryInstall, true);
      document.removeEventListener("click", tryInstall, true);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("touchstart", tryInstall, { capture: true, passive: true });
      document.addEventListener("click", tryInstall, { capture: true });
    }, 800);

    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [installed, isAndroid, canInstall, install]);

  const handleBarInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (installing || !canInstall) return;
    triedAutoRef.current = true;
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  if (!showBar) return null;

  return (
    <div className="fixed bottom-[4.25rem] left-0 right-0 z-30 px-3">
      <button
        type="button"
        onClick={(e) => void handleBarInstall(e)}
        disabled={installing}
        className="btn-big mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-2xl bg-[#1a2744] text-base text-white shadow-lg disabled:opacity-70"
      >
        <span className="text-2xl" aria-hidden>
          📲
        </span>
        <span>
          {installing
            ? t(lang, "Installing...", "వేచండి...")
            : t(lang, "Install App on Phone", "ఫోన్‌లో App జోడించండి")}
        </span>
      </button>
    </div>
  );
}
