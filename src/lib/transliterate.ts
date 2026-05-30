import Sanscript from "@indic-transliteration/sanscript";

/** Known place/name corrections for better Telugu output */
const KNOWN_TELUGU: Record<string, string> = {
  nalgonda: "నల్గొండ",
  miryalaguda: "మిర్యాలగూడ",
  nakrekal: "నాక్రేకల",
  chandampet: "చందంపేట",
  tirumalgiri: "తిరుమల్‌గిరి",
  palakurthy: "పాలకుర్తి",
  palakurthi: "పాలకుర్తి",
  warangal: "వరంగల్",
  hyderabad: "హైదరాబాద్",
  ramesh: "రమేష్",
  suresh: "సురేష్",
  rohith: "రోహిత్",
  rohit: "రోహిత్",
  venkat: "వెంకట్",
  krishna: "కృష్ణ",
  gopal: "గోపాల్",
  rajesh: "రాజేష్",
  raju: "రాజు",
  kumar: "కుమార్",
};

function normalizeKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Transliterate English/Roman text to Telugu script.
 * Uses dictionary for known words, then phonetic transliteration.
 */
export function englishToTelugu(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const key = normalizeKey(trimmed);
  if (KNOWN_TELUGU[key]) return KNOWN_TELUGU[key];

  // Multi-word: transliterate each word
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => englishToTelugu(w)).join(" ");
  }

  try {
    const roman = trimmed.toLowerCase();
    const result = Sanscript.t(roman, "itrans", "telugu");
    // Capitalize first letter visually (Telugu doesn't have case — return as-is)
    return result || trimmed;
  } catch {
    return trimmed;
  }
}

/** Format bilingual display: "English | Telugu" */
export function bilingualDisplay(english: string, telugu: string): string {
  if (!english && !telugu) return "";
  if (!telugu) return english;
  if (!english) return telugu;
  return `${english} | ${telugu}`;
}
