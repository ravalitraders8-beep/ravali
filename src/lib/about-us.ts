/** About RAVALI TRADERS — simple local Telugu in help panel */

import { userMotivation } from "./motivation";

export const aboutUs = {
  title: {
    en: "About RAVALI TRADERS",
    te: "రవళి ట్రేడర్స్",
  },
  tagline: userMotivation.tagline,
  intro: {
    en: "RAVALI TRADERS is your local building materials shop. We supply quality cement, steel, electricals, paints, and plumbing — everything contractors need for strong, lasting work.",
    te: "రవళి ట్రేడర్స్ మీ షాప్. సిమెంట్, ఇనుము, ఎలెక్ట్రికల్స్, పెయింట్, ప్లంబింగ్ — మంచి సామాను అందిస్తాం.",
  },
  services: [
    { icon: "🏗️", en: "Cement", te: "సిమెంట్" },
    { icon: "🔩", en: "Steel / Iron", te: "ఇనుము" },
    { icon: "💡", en: "Electricals", te: "ఎలెక్ట్రికల్స్" },
    { icon: "🎨", en: "Paints", te: "పెయింట్" },
    { icon: "🚿", en: "Plumbing", te: "ప్లంబింగ్" },
  ],
  promises: [
    { en: "Quality is our promise", te: "మంచి సామాను" },
    { en: "Service is our goal", te: "మంచి సర్వీస్" },
  ],
  rewards: {
    en: "Every purchase adds to your monthly total. Reach your target — your gift awaits with pride!",
    te: "కొనుగోలు చేస్తే మొత్తం పెరుగుతుంది. లక్ష్యం చేరితే — బహుమతి మీది!",
  },
  contact: {
    en: "Need help? Call the shop anytime.",
    te: "హెల్ప్ కావాలా? షాప్‌కు కాల్ చేయండి.",
  },
} as const;

export const aboutUsWatermarkLinesEn = [
  "RAVALI TRADERS",
  "Built on Trust",
  "Quality • Service",
  "Cement • Iron • Electricals",
  "Paints • Plumbing",
  "Your One Stop Building Solution",
];

export const aboutUsWatermarkLines = [
  "రవళి ట్రేడర్స్",
  "నమ్మకం మీద",
  "మంచి సామాను",
  "మంచి సర్వీస్",
  "సిమెంట్ • ఇనుము • ఎలెక్ట్రికల్స్",
  "పెయింట్ • ప్లంబింగ్",
];
