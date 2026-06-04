import Sanscript from "@indic-transliteration/sanscript";
import {
  LOCAL_SPOKEN,
  isNameOrPlace,
  normalizeLocalKey,
  shouldUseGoogleTranslation,
  simplifyTeluguToLocal,
} from "@/lib/local-telugu";

/** Roman → spoken Telugu phonetics (not Sanskrit book forms) */
const PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  [/ch/g, "c"],
  [/sh/g, "S"],
  [/th/g, "t"],
  [/dh/g, "d"],
  [/bh/g, "b"],
  [/ph/g, "ph"],
  [/kh/g, "kh"],
  [/gh/g, "g"],
  [/ee/g, "I"],
  [/oo/g, "U"],
  [/aa/g, "A"],
  [/ii/g, "I"],
  [/uu/g, "U"],
  [/au/g, "au"],
  [/ai/g, "ai"],
];

/** Keep Telugu script, digits, common punctuation; strip stray Latin */
export function sanitizeTeluguOutput(text: string): string {
  let s = text.trim();
  if (!s) return "";
  s = s.replace(/[a-zA-Z]+/g, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/([।.,])\1+/g, "$1");
  return dedupeTeluguWords(s).trim();
}

/** Remove repeated consecutive words (prevents duplication bugs) */
export function dedupeTeluguWords(text: string): string {
  const parts = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length === 0 || out[out.length - 1] !== p) out.push(p);
  }
  return out.join(" ");
}

function prepareRomanForItrans(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return "";
  for (const [re, rep] of PHONETIC_REPLACEMENTS) {
    w = w.replace(re, rep);
  }
  return w;
}

function romanToTeluguScript(word: string): string {
  const key = normalizeLocalKey(word);
  if (LOCAL_SPOKEN[key]) return LOCAL_SPOKEN[key];

  const roman = prepareRomanForItrans(word);
  if (!roman) return "";

  try {
    const viaHk = Sanscript.t(roman, "hk", "telugu");
    if (viaHk && /[\u0C00-\u0C7F]/.test(viaHk)) {
      return simplifyTeluguToLocal(sanitizeTeluguOutput(viaHk));
    }
  } catch {
    /* fall through */
  }

  try {
    const viaItrans = Sanscript.t(roman, "itrans", "telugu");
    if (viaItrans && /[\u0C00-\u0C7F]/.test(viaItrans)) {
      return simplifyTeluguToLocal(sanitizeTeluguOutput(viaItrans));
    }
  } catch {
    /* fall through */
  }

  return "";
}

function transliterateWord(word: string): string {
  return romanToTeluguScript(word) || word;
}

/**
 * English/Roman → simple local Telugu (spoken spelling, not dictionary translation).
 */
export function englishToTelugu(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const phraseKey = normalizeLocalKey(trimmed);
  if (LOCAL_SPOKEN[phraseKey]) {
    return simplifyTeluguToLocal(LOCAL_SPOKEN[phraseKey]);
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  if (words.length > 1) {
    const phrase = words.map((w) => transliterateWord(w)).join(" ");
    return simplifyTeluguToLocal(sanitizeTeluguOutput(phrase));
  }

  return simplifyTeluguToLocal(sanitizeTeluguOutput(transliterateWord(words[0])));
}

export type TeluguSource = "local" | "google";

function hasTeluguScript(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

/** Local spoken Telugu first; Google only for clear English phrases (never for names/villages) */
export async function toTeluguAccurate(
  text: string
): Promise<{ telugu: string; source: TeluguSource }> {
  const trimmed = text.trim();
  if (!trimmed) return { telugu: "", source: "local" };

  const local = englishToTelugu(trimmed);
  const cleanedLocal = sanitizeTeluguOutput(local);

  const useGoogle = shouldUseGoogleTranslation(trimmed);
  const nameOrPlace = isNameOrPlace(trimmed);

  if (!useGoogle || nameOrPlace) {
    return {
      telugu: hasTeluguScript(cleanedLocal) ? cleanedLocal : "",
      source: "local",
    };
  }

  const { translateEnglishToTeluguGoogle } = await import("@/lib/google-translate");
  const google = await translateEnglishToTeluguGoogle(trimmed);
  if (google) {
    const cleaned = simplifyTeluguToLocal(sanitizeTeluguOutput(google));
    if (cleaned && hasTeluguScript(cleaned)) {
      return { telugu: cleaned, source: "google" };
    }
  }

  return {
    telugu: hasTeluguScript(cleanedLocal) ? cleanedLocal : "",
    source: "local",
  };
}

/** Resolve English + optional Telugu for DB (sync — local only) */
export function resolveBilingualField(
  english: string,
  telugu?: string
): { english: string; telugu: string } {
  const en = english.trim();
  let te = telugu?.trim() ?? "";

  if (!en && te) {
    return { english: te, telugu: simplifyTeluguToLocal(sanitizeTeluguOutput(te)) };
  }
  if (!en) {
    return { english: "", telugu: "" };
  }
  if (!te || te === en) {
    te = englishToTelugu(en);
  } else {
    te = simplifyTeluguToLocal(sanitizeTeluguOutput(te));
  }
  return { english: en, telugu: te || englishToTelugu(en) };
}

/** Resolve with local / Google rules on server (use in API routes) */
export async function resolveBilingualFieldAsync(
  english: string,
  telugu?: string
): Promise<{ english: string; telugu: string }> {
  const en = english.trim();
  let te = telugu?.trim() ?? "";

  if (!en && te) {
    return { english: te, telugu: simplifyTeluguToLocal(sanitizeTeluguOutput(te)) };
  }
  if (!en) {
    return { english: "", telugu: "" };
  }

  if (!te || te === en) {
    const result = await toTeluguAccurate(en);
    te = result.telugu;
  } else {
    te = simplifyTeluguToLocal(sanitizeTeluguOutput(te));
  }
  return { english: en, telugu: te || (await toTeluguAccurate(en)).telugu };
}

/** Format bilingual display: "English | Telugu" */
export function bilingualDisplay(english: string, telugu: string): string {
  if (!english && !telugu) return "";
  if (!telugu) return english;
  if (!english) return telugu;
  return `${english} | ${telugu}`;
}
