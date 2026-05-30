"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { LoadingSpinner } from "./LoadingSpinner";
import { ShopLogo } from "./ShopLogo";
import { UserPageExtras } from "./UserPageExtras";
import { labels, t } from "@/lib/i18n";
import { parseQrToken } from "@/lib/qr-utils";
import { setContractorSession } from "@/lib/session";
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
      router.replace(`/dashboard/${encodeURIComponent(token)}`);
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

  const steps = [
    { icon: "📷", text: t(lang, labels.step1.en, labels.step1.te) },
    { icon: "🪪", text: t(lang, labels.step2.en, labels.step2.te) },
    { icon: "💰", text: t(lang, labels.step3.en, labels.step3.te) },
  ];

  if (redirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fff8f0] p-6">
        <span className="text-5xl">✅</span>
        <p className="mt-4 text-2xl font-black text-[#e85d00]">
          {t(lang, "Opening your dashboard...", "మీ డాష్‌బోర్డ్ తెరుస్తోంది...")}
        </p>
        <LoadingSpinner message="" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#fff8f0]">
      <UserPageExtras helpBottomOffset="bottom-6" />
      <header className="relative z-10 bg-[#1a2744] px-4 pb-10 pt-8 text-center text-white">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <ShopLogo size="xl" priority />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 -mt-6">
        <div className="card-visual bg-white p-6">
          <div className="mb-6 text-center">
            <span className="icon-xl">📷</span>
            <h2 className="mt-3 text-2xl font-black text-gray-900">
              {t(lang, labels.scanQR.en, labels.scanQR.te)}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {t(lang, labels.scanHint.en, labels.scanHint.te)}
            </p>
          </div>

          {starting && !cameraError && (
            <LoadingSpinner message={t(lang, "Opening camera...", "కెమెరా తెరుస్తోంది...")} />
          )}

          {cameraError && (
            <div className="mb-4 rounded-2xl bg-yellow-100 p-6 text-center">
              <span className="text-4xl">📷</span>
              <p className="mt-3 text-xl font-bold text-yellow-900">
                {lang === "te" ? "కెమెరా అనుమతి ఇవ్వండి" : "Allow camera access"}
              </p>
              <p className="mt-2 text-lg text-yellow-800">
                {lang === "te"
                  ? "సెట్టింగ్‌లలో కెమెరా ఆన్ చేయండి"
                  : "Turn on camera in phone settings"}
              </p>
            </div>
          )}

          <div
            id="qr-reader"
            className={`overflow-hidden rounded-2xl border-4 border-[#e85d00] ${cameraError ? "hidden" : ""}`}
          />

          {error && (
            <div className="mt-4 rounded-2xl bg-red-100 p-5 text-center">
              <span className="text-4xl">❌</span>
              <p className="mt-2 text-xl font-bold text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {steps.map((step) => (
            <div
              key={step.text}
              className="card-visual flex flex-col items-center bg-white p-4 text-center"
            >
              <span className="text-3xl">{step.icon}</span>
              <p className="mt-2 text-sm font-bold leading-tight text-gray-800">{step.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
