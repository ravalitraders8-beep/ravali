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

/** QR payload — dashboard deep link (from=qr triggers install popup) */
export function getDashboardQrPayload(token: string): string {
  const normalized = token.trim().toUpperCase();
  const path = `/dashboard/${encodeURIComponent(normalized)}?from=qr`;

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
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
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineHeight;
  }
  return cy;
}

/** Printable QR card — logo, name, QR, token & hint below (no overlap) */
export async function generateQRImageWithName(
  token: string,
  displayName: string,
  subtitle?: string
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(getDashboardQrPayload(token), {
    width: 320,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#FFFFFF" },
  });

  const w = 420;
  const pad = 24;
  const qrSize = 300;

  // Measure layout on a scratch canvas
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return qrDataUrl;

  const logoH = 76;
  let y = pad + logoH + 16;

  measure.font = "bold 26px 'Noto Sans Telugu', sans-serif";
  const nameLines = Math.ceil(measure.measureText(displayName).width / (w - pad * 2)) || 1;
  y += nameLines * 32 + 8;

  if (subtitle && subtitle !== displayName) {
    measure.font = "20px 'Noto Sans Telugu', sans-serif";
    const subLines = Math.ceil(measure.measureText(subtitle).width / (w - pad * 2)) || 1;
    y += subLines * 26 + 8;
  }

  const qrTop = y + 12;
  const qrBottom = qrTop + qrSize;
  const h = qrBottom + 94;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Card border
  ctx.strokeStyle = "#e8dcc8";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  try {
    const logoImg = await loadImage(LOGO_PATH);
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (w - logoW) / 2, pad, logoW, logoH);
  } catch {
    ctx.fillStyle = "#1a2744";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(SHOP_NAME, w / 2, pad + 48);
  }

  let textY = pad + logoH + 20;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 26px 'Noto Sans Telugu', sans-serif";
  textY = wrapText(ctx, displayName, w / 2, textY, w - pad * 2, 32);

  if (subtitle && subtitle !== displayName) {
    ctx.font = "20px 'Noto Sans Telugu', sans-serif";
    ctx.fillStyle = "#555";
    textY = wrapText(ctx, subtitle, w / 2, textY + 6, w - pad * 2, 26);
  }

  const qrX = (w - qrSize) / 2;
  const qrY = textY + 20;

  // QR frame
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  ctx.strokeStyle = "#1a2744";
  ctx.lineWidth = 3;
  ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  const bottomY = qrY + qrSize;

  // Token pill — below QR, not on top
  ctx.font = "15px monospace";
  const tokenW = ctx.measureText(token).width + 24;
  ctx.fillStyle = "#f0f0f0";
  roundRect(ctx, w / 2 - tokenW / 2, bottomY + 14, tokenW, 26, 8);
  ctx.fill();
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.fillText(token, w / 2, bottomY + 32);

  // Scan hint — clear space below token
  ctx.fillStyle = "#e85d00";
  ctx.font = "bold 14px 'Noto Sans Telugu', sans-serif";
  ctx.fillText("Scan to see your rewards | స్కాన్ చేయండి", w / 2, bottomY + 58);

  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
