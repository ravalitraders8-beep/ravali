"use client";

import { useSyncExternalStore } from "react";
import { MandatoryInstallScreen } from "./MandatoryInstallScreen";
import { isPwaInstalled, subscribePwaInstall } from "@/lib/pwa-install-store";

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function subscribeMobile(onChange: () => void) {
  return () => {};
}

/**
 * User (contractor) portal — mandatory PWA install popup on phones before any content.
 */
export function UserPortalShell({ children }: { children: React.ReactNode }) {
  const installed = useSyncExternalStore(subscribePwaInstall, isPwaInstalled, () => false);
  const isMobile = useSyncExternalStore(subscribeMobile, isMobileDevice, () => false);
  const needsInstall = isMobile && !installed;

  return (
    <>
      {needsInstall ? (
        <div className="min-h-screen bg-[#fff8f0]" aria-hidden />
      ) : (
        children
      )}
      {needsInstall && <MandatoryInstallScreen />}
    </>
  );
}
