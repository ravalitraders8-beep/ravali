"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { MandatoryInstallScreen } from "./MandatoryInstallScreen";
import { markInstallPromptForSession } from "@/lib/session";
import { isPwaInstalled, subscribePwaInstall } from "@/lib/pwa-install-store";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function subscribeMobile(onChange: () => void) {
  return () => {};
}

/**
 * User (contractor) portal — PWA install required on phones before login or dashboard.
 */
export function UserPortalShell({ children }: { children: React.ReactNode }) {
  const installed = useSyncExternalStore(subscribePwaInstall, isPwaInstalled, () => false);
  const isMobile = useSyncExternalStore(subscribeMobile, isMobileDevice, () => false);

  useEffect(() => {
    markInstallPromptForSession();
  }, []);

  if (isMobile && !installed) {
    return <MandatoryInstallScreen />;
  }

  return <>{children}</>;
}
