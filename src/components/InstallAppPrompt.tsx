"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { ShopLogo } from "./ShopLogo";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { INSTALL_PROMPT_EVENT } from "@/lib/constants";
import {
  isAndroidChrome,
  isPromptReady,
  subscribePwaInstall,
  triggerChromeInstall,
} from "@/lib/pwa-install-store";
import {
  dismissInstallPrompt,
  shouldShowInstallPrompt,
} from "@/lib/session";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function subscribeInstallPrompt(onChange: () => void) {
  const unsub = subscribePwaInstall(onChange);
  window.addEventListener(INSTALL_PROMPT_EVENT, onChange);
  return () => {
    unsub();
    window.removeEventListener(INSTALL_PROMPT_EVENT, onChange);
  };
}

/** Fixed bar — Chrome install when prompt is ready (backup if modal dismissed) */
export function PwaInstallBar({ className }: { className?: string }) {
  const { lang } = useLang();
  const { installed, canInstall, isAndroid } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  if (installed || !isAndroid || !canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await triggerChromeInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      className={
        className ??
        "fixed bottom-[4.25rem] left-0 right-0 z-40 px-3"
      }
    >
      <button
        type="button"
        onClick={() => void handleInstall()}
        disabled={installing}
        className="btn-big mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-2xl bg-[#1a2744] text-base text-white shadow-lg disabled:opacity-70"
      >
        <span className="text-2xl" aria-hidden>
          📲
        </span>
        <span>
          {installing
            ? t(lang, labels.installing.en, labels.installing.te)
            : t(lang, labels.installNow.en, labels.installNow.te)}
        </span>
      </button>
    </div>
  );
}

/** Popup after QR scan — tap Install to open Chrome native dialog */
export function InstallAppPrompt() {
  const { lang } = useLang();
  const { installed, canInstall, isAndroid, isIOS } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);

  const wantsPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    shouldShowInstallPrompt,
    () => false
  );
  const isMobile = useSyncExternalStore(
    () => () => {},
    isMobileDevice,
    () => false
  );
  const promptReady = useSyncExternalStore(
    subscribePwaInstall,
    isPromptReady,
    () => false
  );

  const open = wantsPrompt && !installed && isMobile;

  const handleInstall = useCallback(async () => {
    if (!isPromptReady()) {
      setInstallError(true);
      return;
    }
    setInstalling(true);
    setInstallError(false);
    try {
      const ok = await triggerChromeInstall();
      if (ok) dismissInstallPrompt();
    } finally {
      setInstalling(false);
    }
  }, []);

  const handleLater = () => {
    dismissInstallPrompt();
  };

  if (!open) return null;

  const androidChrome = isAndroidChrome();
  const showInstallButton = isAndroid && (canInstall || promptReady);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-app-title"
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
          <h2 id="install-app-title" className="mt-3 text-2xl font-black text-[#1a2744]">
            {t(lang, labels.installAppTitle.en, labels.installAppTitle.te)}
          </h2>
          <p className="mt-2 text-base font-semibold leading-relaxed text-gray-600">
            {t(lang, labels.installAppBody.en, labels.installAppBody.te)}
          </p>
        </div>

        {isIOS && (
          <ol className="mt-5 space-y-2 rounded-2xl bg-[#fff8f0] p-4 text-left text-sm font-bold text-[#1a2744]">
            <li>{t(lang, labels.installIos1.en, labels.installIos1.te)}</li>
            <li>{t(lang, labels.installIos2.en, labels.installIos2.te)}</li>
            <li>{t(lang, labels.installIos3.en, labels.installIos3.te)}</li>
          </ol>
        )}

        {isAndroid && (
          <>
            {!showInstallButton && !installError && (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-900">
                {t(lang, labels.installAndroidWait.en, labels.installAndroidWait.te)}
              </p>
            )}

            {installError && !canInstall && (
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
                showInstallButton ? "animate-pulse bg-[#e85d00]" : "bg-[#e85d00]/90"
              }`}
            >
              {installing
                ? t(lang, labels.installing.en, labels.installing.te)
                : showInstallButton
                  ? t(lang, labels.installNow.en, labels.installNow.te)
                  : t(lang, labels.installTryNow.en, labels.installTryNow.te)}
            </button>
          </>
        )}

        {!isIOS && !isAndroid && canInstall && (
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="btn-big mt-5 w-full rounded-2xl bg-[#e85d00] text-lg text-white"
          >
            {t(lang, labels.installNow.en, labels.installNow.te)}
          </button>
        )}

        <button
          type="button"
          onClick={handleLater}
          className="btn-big mt-3 w-full rounded-2xl border-2 border-gray-200 font-bold text-gray-600"
        >
          {t(lang, labels.installLater.en, labels.installLater.te)}
        </button>
      </div>
    </div>
  );
}
