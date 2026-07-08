/** PWA capture runs from /public/pwa-capture.js (beforeInteractive in root layout). */

export const PWA_INSTALLED_KEY = "ravali-pwa-installed";
export const PWA_STATE_EVENT = "ravali-pwa-state";
export const PWA_PROMPT_READY_EVENT = "ravali-pwa-prompt-ready";

export interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type RavaliPwaWindow = Window & {
  __ravaliPwa?: {
    prompt: DeferredInstallPrompt | null;
    ready: boolean;
  };
};

function getStore() {
  if (typeof window === "undefined") return null;
  const w = window as RavaliPwaWindow;
  if (!w.__ravaliPwa) {
    w.__ravaliPwa = { prompt: null, ready: false };
  }
  return w.__ravaliPwa;
}

export function getDeferredInstallPrompt(): DeferredInstallPrompt | null {
  return getStore()?.prompt ?? null;
}

export function isPromptReady(): boolean {
  return Boolean(getStore()?.ready && getStore()?.prompt);
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return isStandaloneMode() || localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  } catch {
    return isStandaloneMode();
  }
}

export function subscribePwaInstall(onChange: () => void): () => void {
  window.addEventListener(PWA_PROMPT_READY_EVENT, onChange);
  window.addEventListener(PWA_STATE_EVENT, onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    window.removeEventListener(PWA_PROMPT_READY_EVENT, onChange);
    window.removeEventListener(PWA_STATE_EVENT, onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

/** Call from a user click — opens Chrome native install dialog */
export async function triggerChromeInstall(): Promise<boolean> {
  const prompt = getDeferredInstallPrompt();
  if (!prompt) return false;

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;

  const store = getStore();
  if (store) {
    store.prompt = null;
    store.ready = false;
  }

  if (outcome === "accepted") {
    try {
      localStorage.setItem(PWA_INSTALLED_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(PWA_STATE_EVENT));
    return true;
  }

  window.dispatchEvent(new Event(PWA_STATE_EVENT));
  return false;
}

export function isAndroidChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}
