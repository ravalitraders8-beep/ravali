"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { ShopLogo } from "./ShopLogo";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import {
  isAndroid,
  isAndroidChrome,
  isIOS,
  isPromptReady,
  isPwaInstalled,
  subscribePwaInstall,
  triggerChromeInstall,
} from "@/lib/pwa-install-store";

/** Mandatory install popup — blocks the portal until the app is installed on mobile */
export function MandatoryInstallScreen() {
  const { lang } = useLang();
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);

  const installed = useSyncExternalStore(subscribePwaInstall, isPwaInstalled, () => false);
  const promptReady = useSyncExternalStore(subscribePwaInstall, isPromptReady, () => false);

  const handleInstall = useCallback(async () => {
    if (!isPromptReady()) {
      setInstallError(true);
      return;
    }
    setInstalling(true);
    setInstallError(false);
    try {
      await triggerChromeInstall();
    } finally {
      setInstalling(false);
    }
  }, []);

  if (installed) return null;

  const android = isAndroid();
  const ios = isIOS();
  const androidChrome = isAndroidChrome();
  const showInstallButton = android && (promptReady || installError);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mandatory-install-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        style={{ animation: "slideUp 0.35s ease-out" }}
      >
        <div className="flex flex-col items-center text-center">
          <ShopLogo size="sm" />
          <span className="mt-3 text-5xl" aria-hidden>
            📲
          </span>
          <h1 id="mandatory-install-title" className="mt-3 text-2xl font-black text-[#1a2744]">
            {t(lang, labels.installRequiredTitle.en, labels.installRequiredTitle.te)}
          </h1>
          <p className="mt-2 text-base font-semibold leading-relaxed text-gray-600">
            {t(lang, labels.installRequiredBody.en, labels.installRequiredBody.te)}
          </p>
        </div>

        {ios && (
          <ol className="mt-5 space-y-2 rounded-2xl bg-[#fff8f0] p-4 text-left text-sm font-bold text-[#1a2744]">
            <li>{t(lang, labels.installIos1.en, labels.installIos1.te)}</li>
            <li>{t(lang, labels.installIos2.en, labels.installIos2.te)}</li>
            <li>{t(lang, labels.installIos3.en, labels.installIos3.te)}</li>
            <li>{t(lang, labels.installIosReopen.en, labels.installIosReopen.te)}</li>
          </ol>
        )}

        {android && (
          <>
            {!showInstallButton && !installError && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-900">
                {t(lang, labels.installAndroidWait.en, labels.installAndroidWait.te)}
              </p>
            )}
            {installError && !promptReady && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-900">
                {androidChrome
                  ? t(lang, labels.installChromeManual.en, labels.installChromeManual.te)
                  : t(lang, labels.installAndroidWait.en, labels.installAndroidWait.te)}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
              className={`btn-big mt-5 w-full rounded-2xl text-lg text-white disabled:opacity-70 ${
                promptReady ? "animate-pulse bg-[#e85d00]" : "bg-[#e85d00]/90"
              }`}
            >
              {installing
                ? t(lang, labels.installing.en, labels.installing.te)
                : promptReady
                  ? t(lang, labels.installNow.en, labels.installNow.te)
                  : t(lang, labels.installTryNow.en, labels.installTryNow.te)}
            </button>
          </>
        )}

        {!ios && !android && (
          <p className="mt-5 rounded-2xl bg-[#fff8f0] p-4 text-center text-sm font-bold text-gray-600">
            {t(lang, labels.installDesktopHint.en, labels.installDesktopHint.te)}
          </p>
        )}
      </div>
    </div>
  );
}
