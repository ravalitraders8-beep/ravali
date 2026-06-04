/**
 * Simple spoken Telugu (Telangana shop / street language) — NOT educational or dictionary Telugu.
 * Every Telugu string shown when user toggles language should pass through displayLocalTelugu().
 */

export const LOCAL_SPOKEN: Record<string, string> = {
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
  jangaon: "జనగాం",
  bhongir: "భువనగిరి",
  painter: "పెయింటర్",
  electrician: "ఎలెక్ట్రీషియన్",
  plumber: "ప్లంబర్",
  mason: "మేస్త్రి",
  carpenter: "వడ్రంగి",
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
  bonus: "బోనస్",
  order: "ఆర్డర్",
  customer: "కస్టమర్",
  "new customer": "కొత్త కస్టమర్",
  "large order": "పెద్ద ఆర్డర్",
  "special bonus": "స్పెషల్ బోనస్",
  "festival gift": "పండుగ బహుమతి",
  "target bonus": "లక్ష్యం బోనస్",
  cement: "సిమెంట్",
  bags: "బ్యాగులు",
  target: "లక్ష్యం",
  amount: "మొత్తం",
  shop: "షాప్",
};

/**
 * Educational / literary / dictionary Telugu → simple local Telugu.
 * Longer phrases first so partial replacements do not break words.
 */
const FORMAL_TO_LOCAL: [string, string][] = [
  ["అత్యుత్తమమైన", "మంచి"],
  ["అత్యుత్తమ", "మంచి"],
  ["ఎలక్ట్రీషియన్", "ఎలెక్ట్రీషియన్"],
  ["కార్పెంటర్", "వడ్రంగి"],
  ["కాంట్రాక్టర్లు", "సభ్యులు"],
  ["కాంట్రాక్టర్", "సభ్యుడు"],
  ["నిలిపివేయబడింది", "ఆఫ్ చేశారు"],
  ["నిలిపివేయండి", "ఆఫ్ చేయండి"],
  ["సక్రియం చేయబడింది", "ఆన్ చేశారు"],
  ["సక్రియం చేయండి", "ఆన్ చేయండి"],
  ["సక్రియ", "ఆన్"],
  ["అవలోకనం", "హోమ్"],
  ["ప్రయత్నించండి", "మళ్ళీ చూడండి"],
  ["విఫలమైంది", "కాలేదు"],
  ["సంప్రదించండి", "కాల్ చేయండి"],
  ["దయచేసి", ""],
  ["నమోదు చేయండి", "పెట్టండి"],
  ["చేరుకున్నారు", "చేరారు"],
  ["చేరండి", "చేరండి"],
  ["పొందండి", "తీసుకోండి"],
  ["విజేతలు", "టాప్"],
  ["ఇటీవలి చరిత్ర", "ఇటీవలవి"],
  ["చరిత్ర", "లిస్టు"],
  ["బహుమతి చరిత్ర", "బహుమతి లిస్టు"],
  ["తొలగించబడింది", "తొలగించారు"],
  ["కనుగొనబడింది", "దొరికింది"],
  ["శోధన", "వెతకడం"],
  ["వర్గం వారీ", "పని వారీ"],
  ["వర్గం", "పని"],
  ["ఈ వర్గం", "ఈ పని"],
  ["ప్రారంభ తేదీ", "మొదలు తేదీ"],
  ["ముగింపు తేదీ", "ఆఖరి తేదీ"],
  ["తేదీలు", "తేదీలు"],
  ["లక్ష్యాలు", "లక్ష్యాలు"],
  ["డేటాబేస్", "డేటా"],
  ["స్వాగత బహుమతి", "స్వాగతం బహుమతి"],
  ["పండుగ గిఫ్ట్", "పండుగ బహుమతి"],
  ["గిఫ్ట్", "బహుమతి"],
  ["మొబైల్ రీచార్జ్", "మొబైల్ రీచార్జ్"],
  ["బహుమతి + ట్రోఫీ", "బహుమతి + ట్రోఫీ"],
  ["నాణ్యత", "క్వాలిటీ"],
  ["వృత్తి", "పని"],
  ["నిలకడగా", "బాగా"],
  ["నిలకడ", "స్థిరం"],
  ["నిర్మించాం", "చేశాం"],
  ["అందిస్తున్నాం", "ఇస్తాం"],
  ["వాగ్దానం", "వాగ్దానం"],
  ["నమస్కారం", "నమస్తే"],
  ["సిద్ధం కాలేదు", "రెడీ కాలేదు"],
  ["సిద్ధం", "రెడీ"],
  ["కంపెనీ", "షాప్"],
  ["సభ్యుల లాగిన్", "లాగిన్"],
  ["గ్రామం నమోదు", "ఊరు పెట్టండి"],
  ["గ్రామం", "ఊరు"],
  ["అర్హత", "అవసరం"],
  ["కారణం", "కారణం"],
  ["మొదలు పెట్టండి", "స్టార్ట్ చేయండి"],
  ["ప్రారంభించండి", "స్టార్ట్ చేయండి"],
  ["ముందుకు సాగండి", "ముందుకు పోండి"],
  ["ఖాళీ", ""],
];

const ENGLISH_PHRASE_WORDS = new Set([
  "new", "large", "special", "festival", "target", "customer", "order", "bonus",
  "gift", "mixer", "design", "iron", "tv", "the", "and", "for",
]);

export function normalizeLocalKey(text: string): string {
  return text.trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
}

export function isNameOrPlace(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || !/^[a-zA-Z\s.-]+$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const lowerWords = words.map((w) => w.toLowerCase());
  if (lowerWords.every((w) => ENGLISH_PHRASE_WORDS.has(w))) return false;
  if (lowerWords.some((w) => ENGLISH_PHRASE_WORDS.has(w)) && words.length > 1) return false;
  return true;
}

export function shouldUseGoogleTranslation(text: string): boolean {
  const key = normalizeLocalKey(text);
  if (LOCAL_SPOKEN[key]) return false;
  if (isNameOrPlace(text)) return false;
  const words = key.split(" ").filter(Boolean);
  if (words.length <= 1) return false;
  return words.some((w) => ENGLISH_PHRASE_WORDS.has(w));
}

/** All UI + DB Telugu text when language toggle is Telugu */
export function simplifyTeluguToLocal(text: string): string {
  let s = text.trim();
  if (!s) return "";

  const sorted = [...FORMAL_TO_LOCAL].sort((a, b) => b[0].length - a[0].length);
  for (const [formal, local] of sorted) {
    if (formal) s = s.split(formal).join(local);
  }

  return s.replace(/\s{2,}/g, " ").trim();
}

export function displayLocalTelugu(text: string): string {
  if (!text?.trim()) return "";
  return simplifyTeluguToLocal(text.trim());
}
