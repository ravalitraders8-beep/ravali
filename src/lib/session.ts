"use client";

import {
  CONTRACTOR_SESSION_KEY,
  SESSION_DURATION_MS,
  ADMIN_PIN_SESSION_KEY,
  ADMIN_SESSION_EVENT,
  INSTALL_PROMPT_KEY,
  INSTALL_PROMPT_EVENT,
  INTRO_SPLASH_SEEN_KEY,
} from "./constants";
import type { ContractorSession } from "./types";

export function setContractorSession(token: string): void {
  const session: ContractorSession = {
    token,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(CONTRACTOR_SESSION_KEY, JSON.stringify(session));
}

export function getContractorSession(): ContractorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTRACTOR_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ContractorSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(CONTRACTOR_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearContractorSession(): void {
  localStorage.removeItem(CONTRACTOR_SESSION_KEY);
}

export function setAdminPinSession(pin: string): void {
  sessionStorage.setItem(
    ADMIN_PIN_SESSION_KEY,
    JSON.stringify({ pin, expiresAt: Date.now() + SESSION_DURATION_MS })
  );
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
}

export function getAdminPinSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_PIN_SESSION_KEY);
    if (!raw) return null;
    const { pin, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
      return null;
    }
    return pin;
  } catch {
    return null;
  }
}

export function clearAdminPinSession(): void {
  sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
}

export function markInstallPromptForSession(): void {
  sessionStorage.setItem(INSTALL_PROMPT_KEY, "1");
  window.dispatchEvent(new Event(INSTALL_PROMPT_EVENT));
}

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(INSTALL_PROMPT_KEY) === "1";
}

export function dismissInstallPrompt(): void {
  sessionStorage.removeItem(INSTALL_PROMPT_KEY);
  window.dispatchEvent(new Event(INSTALL_PROMPT_EVENT));
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const pin = getAdminPinSession();
  if (!pin) throw new Error("Not authenticated");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": pin,
      ...options.headers,
    },
  });
}

export function hasSeenIntroSplash(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(INTRO_SPLASH_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markIntroSplashSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SPLASH_SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
}
