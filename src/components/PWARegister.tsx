"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        reg.update().catch(() => {});
      } catch {
        /* offline or unsupported context */
      }
    };

    void register();
  }, []);

  return null;
}
