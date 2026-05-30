/** About RAVALI TRADERS — shown in side help panel & Telugu watermark background */

import { userMotivation } from "./motivation";

export const aboutUs = {
  title: {
    en: "About RAVALI TRADERS",
    te: "రవళి ట్రేడర్స్ గురించి",
  },
  tagline: userMotivation.tagline,
  intro: {
    en: "RAVALI TRADERS is your local building materials shop. We supply quality cement, steel, electricals, paints, and plumbing — everything contractors need for strong, lasting work.",
    te: "రవళి ట్రేడర్స్ మీ స్థానిక నిర్మాణ సామగ్రి షాప్. సిమెంట్, ఇనుము, ఎలక్ట్రికల్స్, పెయింట్స్, ప్లంబింగ్ — కాంట్రాక్టర్లకు అవసరమైన నాణ్యమైన సామగ్రి మేము అందిస్తాము.",
  },
  services: [
    { icon: "🏗️", en: "Cement", te: "సిమెంట్" },
    { icon: "🔩", en: "Steel / Iron", te: "ఇనుము" },
    { icon: "💡", en: "Electricals", te: "ఎలక్ట్రికల్స్" },
    { icon: "🎨", en: "Paints", te: "పెయింట్స్" },
    { icon: "🚿", en: "Plumbing", te: "ప్లంబింగ్" },
  ],
  promises: [
    { en: "Quality is our promise", te: "నాణ్యత మా వాగ్దానం" },
    { en: "Service is our goal", te: "సేవ మా లక్ష్యం" },
  ],
  rewards: {
    en: "Every purchase you make adds to your monthly total. Reach your target and win gifts! Scan your QR card anytime to see your amount and rank.",
    te: "మీరు కొనుగోలు చేసిన ప్రతి మొత్తం మీ నెలవారీ మొత్తంలో చేరుతుంది. లక్ష్యం చేరితే బహుమతులు! మీ QR కార్డ్ స్కాన్ చేసి మొత్తం, ర్యాంక్ చూడండి.",
  },
  contact: {
    en: "Need help? Call the shop anytime.",
    te: "సహాయం కావాలా? షాప్‌కు ఎప్పుడైనా కాల్ చేయండి.",
  },
} as const;

/** Short lines for faint English background watermark in help panel */
export const aboutUsWatermarkLinesEn = [
  "RAVALI TRADERS",
  "Buy • Rank up • Win!",
  userMotivation.quote.en.split("—")[0]?.trim() ?? "Keep going!",
  "Cement • Iron • Electricals",
  "Paints • Plumbing",
  "Your One Stop Building Solution",
];

/** Short lines for faint Telugu background watermark */
export const aboutUsWatermarkLines = [
  "రవళి ట్రేడర్స్",
  "కొనండి • Rank పెంచుకోండి",
  "బహుమతి గెలుచుకోండి",
  "నాణ్యత మా వాగ్దానం",
  "సిమెంట్ • ఇనుము • ఎలక్ట్రికల్స్",
  "పెయింట్స్ • ప్లంబింగ్",
];
