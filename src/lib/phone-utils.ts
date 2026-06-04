/** Normalize Indian mobile to 10 digits (e.g. 9876543210) */
export function normalizePhoneInput(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

/** `tel:` link for one-tap call on mobile (India +91). */
export function phoneTelHref(raw: string): string | null {
  const n = normalizePhoneInput(raw);
  if (!n) return null;
  return `tel:+91${n}`;
}
