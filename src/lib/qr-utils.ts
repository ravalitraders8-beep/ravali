"use client";

import QRCode from "qrcode";
import { getAppUrl } from "@/lib/env";

/** Extract contractor QR token from scanned text or dashboard URL */
export function parseQrToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fromUrl = trimmed.match(/\/dashboard\/([^/?#\s]+)/i);
  if (fromUrl) {
    return decodeURIComponent(fromUrl[1]).trim().toUpperCase();
  }

  const tokenMatch = trimmed.match(/CTR-[A-Z]+-\d+/i);
  if (tokenMatch) return tokenMatch[0].toUpperCase();

  if (/^CTR-/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, "").toUpperCase();
  }

  const clean = trimmed.replace(/\s+/g, "").toUpperCase();
  return clean.length >= 6 ? clean : null;
}

/** QR payload — dashboard deep link so scan opens app directly */
export function getDashboardQrPayload(token: string): string {
  const normalized = token.trim().toUpperCase();
  const path = `/dashboard/${encodeURIComponent(normalized)}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }

  const appUrl = getAppUrl();
  return appUrl ? `${appUrl}${path}` : path;
}

export async function generateQRDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(getDashboardQrPayload(token), {
    width: 300,
    margin: 2,
    color: { dark: "#171717", light: "#FFFFFF" },
  });
}

export async function downloadQR(token: string, name: string): Promise<void> {
  const dataUrl = await generateQRDataUrl(token);
  const link = document.createElement("a");
  link.download = `${name}-${token}-qr.png`;
  link.href = dataUrl;
  link.click();
}

export async function downloadBulkQR(
  items: { token: string; name: string }[]
): Promise<void> {
  for (const item of items) {
    await downloadQR(item.token, item.name);
    await new Promise((r) => setTimeout(r, 300));
  }
}
