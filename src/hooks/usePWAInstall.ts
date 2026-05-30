"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getDeferredInstallPrompt,
  isAndroid,
  isIOS,
  isPromptReady,
  isPwaInstalled,
  subscribePwaInstall,
  triggerChromeInstall,
} from "@/lib/pwa-install-store";

export { PWA_PROMPT_READY_EVENT } from "@/lib/pwa-install-store";

export function usePWAInstall() {
  const installed = useSyncExternalStore(subscribePwaInstall, isPwaInstalled, () => false);
  const canInstall = useSyncExternalStore(
    subscribePwaInstall,
    () => isPromptReady() && Boolean(getDeferredInstallPrompt()),
    () => false
  );

  const install = useCallback(async () => triggerChromeInstall(), []);

  return {
    installed,
    canInstall,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    install,
  };
}
