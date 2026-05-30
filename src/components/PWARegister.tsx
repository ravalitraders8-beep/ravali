"use client";

import { useEffect } from "react";

/** Backup SW registration (primary register runs in beforeInteractive script) */
export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
