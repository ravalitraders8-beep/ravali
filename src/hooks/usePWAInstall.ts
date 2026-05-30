"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const PWA_INSTALLED_KEY = "ravali-pwa-installed";
const PWA_STATE_EVENT = "ravali-pwa-state";
export const PWA_PROMPT_READY_EVENT = "ravali-pwa-prompt-ready";

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

function readInstalled(): boolean {
  return isStandalone() || localStorage.getItem(PWA_INSTALLED_KEY) === "1";
}

function subscribePwaState(onChange: () => void) {
  window.addEventListener(PWA_STATE_EVENT, onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    window.removeEventListener(PWA_STATE_EVENT, onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function notifyPwaState() {
  window.dispatchEvent(new Event(PWA_STATE_EVENT));
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const installed = useSyncExternalStore(subscribePwaState, readInstalled, () => false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      window.dispatchEvent(new Event(PWA_PROMPT_READY_EVENT));
    };

    const onInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      localStorage.setItem(PWA_INSTALLED_KEY, "1");
      notifyPwaState();
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
      notifyPwaState();
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
