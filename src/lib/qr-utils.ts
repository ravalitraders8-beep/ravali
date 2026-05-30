"use client";

import QRCode from "qrcode";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";
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

/** QR payload — dashboard deep link */
export function getDashboardQrPayload(token: string): string {
  const normalized = token.trim().toUpperCase();
  const path = `/dashboard/${encodeURIComponent(normalized)}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }

  const appUrl = getAppUrl();
  return appUrl ? `${appUrl}${path}` : path;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Printable QR card with shop name + contractor name on image */
export async function generateQRImageWithName(
  token: string,
  displayName: string,
  subtitle?: string
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(getDashboardQrPayload(token), {
    width: 360,
    margin: 1,
    color: { dark: "#1a1a1a", light: "#FFFFFF" },
  });

  const canvas = document.createElement("canvas");
  const w = 420;
  const h = 560;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  ctx.fillStyle = "#fff8f0";
  ctx.fillRect(0, 0, w, h);

  try {
    const logoImg = await loadImage(LOGO_PATH);
    const logoH = 88;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (w - logoW) / 2, 16, logoW, logoH);
  } catch {
    ctx.fillStyle = "#1a2744";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(SHOP_NAME, w / 2, 56);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 26px 'Noto Sans Telugu', sans-serif";
  const nameY = 130;
  wrapText(ctx, displayName, w / 2, nameY, w - 40, 32);

  if (subtitle && subtitle !== displayName) {
    ctx.font = "20px 'Noto Sans Telugu', sans-serif";
    ctx.fillStyle = "#555";
    wrapText(ctx, subtitle, w / 2, nameY + 44, w - 40, 26);
  }

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, 30, 210, 360, 360);

  ctx.fillStyle = "#888";
  ctx.font = "16px monospace";
  ctx.fillText(token, w / 2, 530);

  ctx.fillStyle = "#e85d00";
  ctx.font = "14px 'Noto Sans Telugu', sans-serif";
  ctx.fillText("Scan to see your rewards | స్కాన్ చేయండి", w / 2, 552);

  return canvas.toDataURL("image/png");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

export async function generateQRDataUrl(token: string): Promise<string> {
  return generateQRImageWithName(token, token);
}

export async function downloadQR(
  token: string,
  name: string,
  subtitle?: string
): Promise<void> {
  const dataUrl = await generateQRImageWithName(token, name, subtitle);
  const safeName = name.replace(/[^\w\u0C00-\u0C7F\s-]/g, "").trim() || "contractor";
  const link = document.createElement("a");
  link.download = `${safeName}-${token}.png`;
  link.href = dataUrl;
  link.click();
}

export async function downloadBulkQR(
  items: { token: string; name: string; subtitle?: string }[]
): Promise<void> {
  for (const item of items) {
    await downloadQR(item.token, item.name, item.subtitle);
    await new Promise((r) => setTimeout(r, 400));
  }
}
