import Sanscript from "@indic-transliteration/sanscript";

/**
 * Curated Telugu — names, trades, gifts, places (checked spelling).
 * Full phrase match runs before word-by-word transliteration.
 */
const KNOWN_TELUGU: Record<string, string> = {
  // Places
  nalgonda: "నల్గొండ",
  miryalaguda: "మిర్యాలగూడ",
  nakrekal: "నాక్రేకల",
  chandampet: "చందంపేట",
  tirumalgiri: "తిరుమలగిరి",
  palakurthy: "పాలకుర్తి",
  palakurthi: "పాలకుర్తి",
  warangal: "వరంగల్",
  hyderabad: "హైదరాబాద్",
  secunderabad: "సికింద్రాబాద్",
  karimnagar: "కరీంనగర్",
  khammam: "ఖమ్మం",
  suryapet: "సూర్యాపేట",
  // Trades
  painter: "పెయింటర్",
  electrician: "ఎలక్ట్రీషియన్",
  plumber: "ప్లంబర్",
  mason: "మేస్త్రి",
  carpenter: "వడ్రంగి",
  contractor: "కాంట్రాక్టర్",
  // Names
  ramesh: "రమేష్",
  suresh: "సురేష్",
  rohith: "రోహిత్",
  rohit: "రోహిత్",
  venkat: "వెంకట్",
  krishna: "కృష్ణ",
  gopal: "గోపాల్",
  rajesh: "రాజేష్",
  raju: "రాజు",
  nagaraju: "నాగరాజు",
  nagarjuna: "నాగార్జున",
  kumar: "కుమార్",
  kavya: "కావ్య",
  shekar: "శేకర్",
  sekhar: "శేకర్",
  saketh: "సాకేత్",
  sriman: "శ్రీమాన్",
  // Gifts & items
  tv: "టీవీ",
  "tv gift": "టీవీ బహుమతి",
  television: "టీవీ",
  grinder: "గ్రైండర్",
  "mixer grinder": "మిక్సీ గ్రైండర్",
  mixer: "మిక్సీ",
  "iron box": "ఇనుము బాక్స్",
  iron: "ఇనుము",
  design: "డిజైన్",
  kit: "కిట్",
  "design kit": "డిజైన్ కిట్",
  gift: "బహుమతి",
  // Common words
  shop: "షాప్",
  village: "గ్రామం",
  target: "లక్ష్యం",
  amount: "మొత్తం",
  bags: "బ్యాగులు",
  cement: "సిమెంట్",
};

/** Roman → ITRANS hints for clearer Telugu phonetics */
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

function normalizeKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ");
}

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

function transliterateWord(word: string): string {
  const key = normalizeKey(word);
  if (KNOWN_TELUGU[key]) return KNOWN_TELUGU[key];

  const roman = prepareRomanForItrans(word);
  if (!roman) return word;

  try {
    const viaItrans = Sanscript.t(roman, "itrans", "telugu");
    if (viaItrans && /[\u0C00-\u0C7F]/.test(viaItrans)) {
      return sanitizeTeluguOutput(viaItrans);
    }
  } catch {
    /* fall through */
  }

  try {
    const viaHk = Sanscript.t(roman, "hk", "telugu");
    if (viaHk && /[\u0C00-\u0C7F]/.test(viaHk)) {
      return sanitizeTeluguOutput(viaHk);
    }
  } catch {
    /* fall through */
  }

  return word;
}

/**
 * Transliterate English/Roman text to Telugu script.
 * Dictionary → phrase → word (no duplicate joins).
 */
export function englishToTelugu(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const phraseKey = normalizeKey(trimmed);
  if (KNOWN_TELUGU[phraseKey]) return KNOWN_TELUGU[phraseKey];

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  if (words.length > 1) {
    const phrase = words.map((w) => transliterateWord(w)).join(" ");
    return sanitizeTeluguOutput(phrase);
  }

  return sanitizeTeluguOutput(transliterateWord(words[0]));
}

export type TeluguSource = "google" | "local";

/** Server: Google Translate first, then local fallback */
function hasTeluguScript(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

export async function toTeluguAccurate(
  text: string
): Promise<{ telugu: string; source: TeluguSource }> {
  const trimmed = text.trim();
  if (!trimmed) return { telugu: "", source: "local" };

  const { translateEnglishToTeluguGoogle } = await import("@/lib/google-translate");
  const google = await translateEnglishToTeluguGoogle(trimmed);
  if (google) {
    const cleaned = sanitizeTeluguOutput(google);
    if (cleaned && hasTeluguScript(cleaned)) {
      return { telugu: cleaned, source: "google" };
    }
  }
  const local = englishToTelugu(trimmed);
  const cleanedLocal = sanitizeTeluguOutput(local);
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
    return { english: te, telugu: sanitizeTeluguOutput(te) };
  }
  if (!en) {
    return { english: "", telugu: "" };
  }
  if (!te || te === en) {
    te = englishToTelugu(en);
  } else {
    te = sanitizeTeluguOutput(te);
  }
  return { english: en, telugu: te || englishToTelugu(en) };
}

/** Resolve with Google Translate on server (use in API routes) */
export async function resolveBilingualFieldAsync(
  english: string,
  telugu?: string
): Promise<{ english: string; telugu: string }> {
  const en = english.trim();
  let te = telugu?.trim() ?? "";

  if (!en && te) {
    return { english: te, telugu: sanitizeTeluguOutput(te) };
  }
  if (!en) {
    return { english: "", telugu: "" };
  }

  if (!te || te === en) {
    const result = await toTeluguAccurate(en);
    te = result.telugu;
  } else {
    te = sanitizeTeluguOutput(te);
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
