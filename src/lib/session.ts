"use client";

import {
  CONTRACTOR_SESSION_KEY,
  SESSION_DURATION_MS,
  ADMIN_PIN_SESSION_KEY,
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
