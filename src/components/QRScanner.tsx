"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { IntroSplash } from "./IntroSplash";
import { LoadingSpinner } from "./LoadingSpinner";
import { ShopLogo } from "./ShopLogo";
import { UserPageExtras, MobileHeaderLangToggle } from "./UserPageExtras";
import { labels, t } from "@/lib/i18n";
import { parseQrToken } from "@/lib/qr-utils";
import { setContractorSession, markInstallPromptForSession } from "@/lib/session";
import { useLang } from "@/context/LangContext";

export function QRScanner() {
  const router = useRouter();
  const { lang } = useLang();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const redirectingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* camera may already be stopped */
      }
    }
  }, []);

  const goToDashboard = useCallback(
    async (raw: string) => {
      if (redirectingRef.current) return;

      const token = parseQrToken(raw);
      if (!token) {
        setError(t(lang, labels.invalidQR.en, labels.invalidQR.te));
        return;
      }

      redirectingRef.current = true;
      setRedirecting(true);
      setError(null);

      await stopScanner();
      setContractorSession(token);
      markInstallPromptForSession();
      router.replace(`/dashboard/${encodeURIComponent(token)}?from=qr`);
    },
    [lang, router, stopScanner]
  );

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            if (mounted && !redirectingRef.current) {
              void goToDashboard(decoded);
            }
          },
          () => {}
        );
        if (mounted) {
          setStarting(false);
          setCameraError(false);
        }
      } catch {
        if (mounted) {
          setStarting(false);
          setCameraError(true);
        }
      }
    };
    startScanner();
    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [goToDashboard, stopScanner]);

  if (redirecting) {
    return <IntroSplash />;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f4f6f9]">
      <UserPageExtras helpBottomOffset="bottom-6" />

      <header className="relative z-10 bg-[#1a2744] px-4 pb-6 pt-3 text-center">
        <MobileHeaderLangToggle />
        <ShopLogo size="lg" priority onDark />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 py-5">
        <div className="user-card bg-white p-5">
          <div className="mb-4 text-center">
            <span className="text-5xl" aria-hidden>
              📷
            </span>
            <h1 className="mt-2 text-2xl font-black text-[#1a2744]">
              {t(lang, labels.scanQR.en, labels.scanQR.te)}
            </h1>
          </div>

          {starting && !cameraError && (
            <LoadingSpinner message={t(lang, "Opening camera...", "కెమెరా తెరుస్తోంది...")} />
          )}

          {cameraError && (
            <div className="mb-4 rounded-2xl bg-amber-50 p-5 text-center">
              <span className="text-4xl">📷</span>
              <p className="mt-2 text-xl font-black text-amber-900">
                {t(lang, "Allow camera", "కెమెరా అనుమతి")}
              </p>
            </div>
          )}

          <div
            id="qr-reader"
            className={`overflow-hidden rounded-2xl border-4 border-[#1a2744] ${cameraError ? "hidden" : ""}`}
          />

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-center">
              <span className="text-3xl">❌</span>
              <p className="mt-2 text-lg font-bold text-red-800">{error}</p>
            </div>
          )}

          <p className="mt-4 text-center text-base font-semibold text-gray-600">
            {t(lang, labels.scanHint.en, labels.scanHint.te)}
          </p>
        </div>

        {/* Simple 3 icons — no extra text clutter */}
        <div className="mt-5 flex justify-center gap-6">
          <span className="text-4xl" title={t(lang, labels.step1.en, labels.step1.te)}>
            📷
          </span>
          <span className="text-4xl opacity-40">→</span>
          <span className="text-4xl" title={t(lang, labels.step2.en, labels.step2.te)}>
            🪪
          </span>
          <span className="text-4xl opacity-40">→</span>
          <span className="text-4xl" title={t(lang, labels.step3.en, labels.step3.te)}>
            💰
          </span>
        </div>
      </main>
    </div>
  );
}
