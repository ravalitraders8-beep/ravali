import type { Lang } from "./types";

/** Telugu-first labels — short, simple words for low-literacy users */
export function t(lang: Lang, en: string, te: string): string {
  return lang === "te" ? te : en;
}

export const labels = {
  shopName: { en: "RAVALI TRADERS", te: "RAVALI TRADERS" },
  loading: { en: "Loading...", te: "వేచండి..." },
  thisMonthAmount: { en: "This Month", te: "ఈ నెల" },
  monthlyTarget: { en: "Target", te: "లక్ష్యం" },
  leaderboard: { en: "Winners", te: "విజేతలు" },
  myHistory: { en: "My Work", te: "మీ పని" },
  gifts: { en: "Gifts", te: "బహుమతులు" },
  contactShop: { en: "Call Shop", te: "షాప్‌కు కాల్" },
  scanQR: { en: "Show Your Card", te: "మీ కార్డ్ చూపండి" },
  scanHint: { en: "Point camera at QR on your card", te: "కార్డ్‌పై QR కు కెమెరా పట్టండి" },
  invalidQR: {
    en: "Wrong card. Ask shop for help.",
    te: "కార్డ్ సరైనది కాదు. షాప్‌కు అడగండి.",
  },
  welcome: { en: "Hello", te: "నమస్కారం" },
  you: { en: "You", te: "మీరు" },
  allCategories: { en: "All", te: "అందరు" },
  noHistory: { en: "Nothing yet this month", te: "ఈ నెల ఇంకా లేదు" },
  setupTitle: { en: "Shop Not Ready", te: "షాప్ ఇంకా సిద్ధం కాలేదు" },
  setupHint: {
    en: "Please contact the shop",
    te: "దయచేసి షాప్‌కు సంప్రదించండి",
  },
  step1: { en: "1. Open camera", te: "① కెమెరా తెరవండి" },
  step2: { en: "2. Show QR card", te: "② QR కార్డ్ చూపండి" },
  step3: { en: "3. See your money", te: "③ మీ డబ్బు చూడండి" },
  achieved: { en: "Target reached!", te: "లక్ష్యం చేరుకున్నారు!" },
  almostThere: { en: "Almost there!", te: "దగ్గరగా ఉన్నారు!" },
  keepGoing: { en: "Keep going!", te: "ముందుకు సాగండి!" },
  startNow: { en: "Start now!", te: "ఇప్పుడు ప్రారంభించండి!" },
};

export function progressMessage(lang: Lang, percent: number): string {
  if (percent >= 100) return t(lang, labels.achieved.en, labels.achieved.te);
  if (percent >= 75) return t(lang, labels.almostThere.en, labels.almostThere.te);
  if (percent >= 40) return t(lang, labels.keepGoing.en, labels.keepGoing.te);
  return t(lang, labels.startNow.en, labels.startNow.te);
}
