import type { Category } from "./types";
import { userMotivation } from "@/lib/motivation";

export type CategoryKey = "painter" | "electrician" | "plumber" | "mason" | "carpenter";

export function getCategoryKey(nameEnglish: string): CategoryKey | null {
  const n = nameEnglish.toLowerCase();
  if (n.includes("paint")) return "painter";
  if (n.includes("electric")) return "electrician";
  if (n.includes("plumb")) return "plumber";
  if (n.includes("mason") || n.includes("mes")) return "mason";
  if (n.includes("carpent")) return "carpenter";
  return null;
}

export type CategoryAboutContent = {
  icon: string;
  title: { en: string; te: string };
  about: { en: string; te: string };
  products: { icon: string; en: string; te: string }[];
  shopPromise: { en: string; te: string };
};

const categoryAboutMap: Record<CategoryKey, CategoryAboutContent> = {
  painter: {
    icon: "🎨",
    title: { en: "Paints & Colours", te: "పెయింట్స్ & రంగులు" },
    about: {
      en: "RAVALI TRADERS has all paint colours, putty, brushes and rollers for your painting work. Good quality — walls look beautiful and last long.",
      te: "రవళి ట్రేడర్స్‌లో అన్ని రంగుల పెయింట్, putty, brush, roller ఉన్నాయి. మంచి నాణ్యత — గోడలు అందంగా, ఎక్కువ కాలం నిలుస్తాయి.",
    },
    products: [
      { icon: "🎨", en: "Wall Paints", te: "వాల్ పెయింట్" },
      { icon: "🖌️", en: "Brushes", te: "బ్రష్‌లు" },
      { icon: "🪣", en: "Putty & Primer", te: "putty & primer" },
      { icon: "🌈", en: "All Colours", te: "అన్ని రంగులు" },
    ],
    shopPromise: {
      en: "Best paints for painters — visit our shop!",
      te: "పెయింటర్లకు ఉత్తమ పెయింట్స్ — మా షాప్‌కు రండి!",
    },
  },
  electrician: {
    icon: "⚡",
    title: { en: "Electricals", te: "ఎలక్ట్రికల్స్" },
    about: {
      en: "Wires, switches, MCB, fans, lights — everything for electrical work. Safe and trusted brands at RAVALI TRADERS.",
      te: "వైర్లు, switches, MCB, fans, lights — electrical paniki anni. RAVALI TRADERS lo safe, namakamaina brands.",
    },
    products: [
      { icon: "💡", en: "Lights & Fans", te: "లైట్లు & fans" },
      { icon: "🔌", en: "Wires & Switches", te: "వైర్లు & switches" },
      { icon: "⚡", en: "MCB & Boards", te: "MCB & boards" },
      { icon: "🔋", en: "Fittings", te: "fittings" },
    ],
    shopPromise: {
      en: "Quality electricals for every electrician!",
      te: "prati electrician ki manchi electricals!",
    },
  },
  plumber: {
    icon: "🔧",
    title: { en: "Plumbing", te: "ప్లంబింగ్" },
    about: {
      en: "Pipes, taps, fittings, tanks — all plumbing needs in one shop. Strong pipes, no leaks, happy customers.",
      te: "pipes, taps, fittings, tanks — plumbing avasaramulu anni okate shop lo. strong pipes, leak ledu!",
    },
    products: [
      { icon: "🚿", en: "Taps & Showers", te: "taps & showers" },
      { icon: "🔗", en: "Pipes & Fittings", te: "pipes & fittings" },
      { icon: "🛁", en: "Tanks & Valves", te: "tanks & valves" },
      { icon: "🔧", en: "Tools", te: "tools" },
    ],
    shopPromise: {
      en: "Trusted plumbing supplies for plumbers!",
      te: "plumbers ki namakamaina samagri!",
    },
  },
  mason: {
    icon: "🧱",
    title: { en: "Cement & Building", te: "సిమెంట్ & నిర్మాణం" },
    about: {
      en: "Cement, sand, bricks, steel — strong building materials for mason work. Build homes that last generations.",
      te: "cement, sand, bricks, steel — mason paniki strong samagri. taralu niliche illu kattandi!",
    },
    products: [
      { icon: "🏗️", en: "Cement", te: "సిమెంట్" },
      { icon: "🧱", en: "Bricks & Blocks", te: "ఇటుకలు" },
      { icon: "🔩", en: "Steel & Iron", te: "ఇనుము" },
      { icon: "⛰️", en: "Sand & Chips", te: "isuka & chips" },
    ],
    shopPromise: {
      en: "Strong materials for strong buildings!",
      te: "strong illu — strong samagri!",
    },
  },
  carpenter: {
    icon: "🪚",
    title: { en: "Wood & Carpentry", te: "కార్పెంటర్ సామగ్రి" },
    about: {
      en: "Plywood, nails, hinges, tools — everything for carpentry and furniture work at RAVALI TRADERS.",
      te: "plywood, nails, hinges, tools — carpentry & furniture paniki anni RAVALI TRADERS lo.",
    },
    products: [
      { icon: "🪵", en: "Plywood & Wood", te: "plywood & wood" },
      { icon: "🔨", en: "Nails & Screws", te: "nails & screws" },
      { icon: "🚪", en: "Hinges & Locks", te: "hinges & locks" },
      { icon: "🪚", en: "Tools", te: "tools" },
    ],
    shopPromise: {
      en: "Quality wood supplies for carpenters!",
      te: "carpenters ki manchi wood samagri!",
    },
  },
};

export function getCategoryAbout(category: Category): CategoryAboutContent {
  const key = getCategoryKey(category.name_english);
  if (key) return categoryAboutMap[key];
  return {
    icon: category.icon,
    title: {
      en: category.name_english,
      te: category.name_telugu,
    },
    about: {
      en: "RAVALI TRADERS supplies quality building materials for your work. Visit us — we are here to help!",
      te: "RAVALI TRADERS mee paniki manchi building samagri istundi. randi — mee kosam unnamu!",
    },
    products: [{ icon: category.icon, en: category.name_english, te: category.name_telugu }],
    shopPromise: userMotivation.tagline,
  };
}

export function getCategoryWatermarkLines(category: Category, lang: "en" | "te"): string[] {
  const content = getCategoryAbout(category);
  if (lang === "te") {
    return [
      "రవళి ట్రేడర్స్",
      content.title.te,
      ...content.products.slice(0, 3).map((p) => p.te),
      content.shopPromise.te,
    ];
  }
  return [
    "RAVALI TRADERS",
    content.title.en,
    ...content.products.slice(0, 3).map((p) => p.en),
    content.shopPromise.en,
  ];
}

/** Rank in category leaderboard (1-based), or null if no amount yet */
export function getContractorCategoryRank(
  contractorId: string,
  category: Category,
  leaderboard: { contractor_id: string; category_telugu: string; total_amount: number }[]
): number | null {
  const inCategory = leaderboard
    .filter(
      (e) =>
        e.category_telugu === category.name_telugu && Number(e.total_amount) > 0
    )
    .sort((a, b) => b.total_amount - a.total_amount);

  const idx = inCategory.findIndex((e) => e.contractor_id === contractorId);
  if (idx < 0) return null;

  const entry = inCategory[idx];
  if (Number(entry.total_amount) <= 0) return null;

  return idx + 1;
}
