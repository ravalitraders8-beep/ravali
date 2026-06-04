"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { ShopLogo } from "./ShopLogo";
import { MobileHeaderLangToggle } from "./UserPageExtras";
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

/** Full-screen install gate — no skip; user cannot proceed until app is installed */
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
    <div className="flex min-h-screen flex-col bg-[#fff8f0]">
      <header className="bg-[#1a2744] px-4 pb-8 pt-3 text-white">
        <MobileHeaderLangToggle />
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <ShopLogo size="md" priority onDark />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <div className="card-visual flex flex-1 flex-col rounded-3xl bg-white p-6 text-center">
          <span className="text-5xl" aria-hidden>
            📲
          </span>
          <h1 className="mt-4 text-2xl font-black text-[#1a2744]">
            {t(lang, labels.installRequiredTitle.en, labels.installRequiredTitle.te)}
          </h1>
          <p className="mt-3 text-base font-semibold leading-relaxed text-gray-600">
            {t(lang, labels.installRequiredBody.en, labels.installRequiredBody.te)}
          </p>

          {ios && (
            <ol className="mt-6 space-y-2 rounded-2xl bg-[#fff8f0] p-4 text-left text-sm font-bold text-[#1a2744]">
              <li>{t(lang, labels.installIos1.en, labels.installIos1.te)}</li>
              <li>{t(lang, labels.installIos2.en, labels.installIos2.te)}</li>
              <li>{t(lang, labels.installIos3.en, labels.installIos3.te)}</li>
              <li>{t(lang, labels.installIosReopen.en, labels.installIosReopen.te)}</li>
            </ol>
          )}

          {android && (
            <>
              {!showInstallButton && !installError && (
                <p className="mt-6 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
                  {t(lang, labels.installAndroidWait.en, labels.installAndroidWait.te)}
                </p>
              )}
              {installError && !promptReady && (
                <p className="mt-6 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
                  {androidChrome
                    ? t(lang, labels.installChromeManual.en, labels.installChromeManual.te)
                    : t(lang, labels.installAndroidWait.en, labels.installAndroidWait.te)}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="btn-big mt-6 w-full rounded-2xl bg-[#e85d00] text-lg text-white disabled:opacity-70"
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
            <p className="mt-6 text-sm font-bold text-gray-600">
              {t(lang, labels.installDesktopHint.en, labels.installDesktopHint.te)}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
