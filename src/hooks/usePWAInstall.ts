"use client";

import { useCallback, useEffect, useState } from "react";

const PWA_INSTALLED_KEY = "ravali-pwa-installed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isStandalone() || localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  });
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      localStorage.setItem(PWA_INSTALLED_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(PWA_INSTALLED_KEY, "1");
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return {
    installed,
    canInstall: canInstall && Boolean(deferredPrompt),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    install,
  };
}
