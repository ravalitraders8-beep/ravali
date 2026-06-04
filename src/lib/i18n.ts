import type { Lang } from "./types";
import { userMotivation } from "./motivation";

/** Telugu-first labels — short, simple words for low-literacy users */
export function t(lang: Lang, en: string, te: string): string {
  return lang === "te" ? te : en;
}

export const labels = {
  shopName: { en: "RAVALI TRADERS", te: "RAVALI TRADERS" },
  loading: { en: "Loading...", te: "వేచండి..." },
  thisMonthAmount: { en: "This Month", te: "ఈ నెల" },
  thisMonthBags: { en: "Bags This Month", te: "ఈ నెల బ్యాగులు" },
  monthlyTarget: { en: "Target", te: "లక్ష్యం" },
  leaderboard: { en: "Winners", te: "విజేతలు" },
  myHistory: { en: "My Work", te: "మీ పని" },
  gifts: { en: "Gifts", te: "బహుమతులు" },
  masonGiftsHint: {
    en: "Earn cement bags — unlock gifts from the shop",
    te: "సిమెంట్ బ్యాగులు — షాప్ బహుమతులు పొందండి",
  },
  giftUnlocked: { en: "You reached this gift!", te: "ఈ బహుమతి మీది!" },
  bagsToGo: { en: "{n} more bags to unlock", te: "ఇంకా {n} బ్యాగులు" },
  nextMasonGift: {
    en: "Next: {name} at {bags} bags",
    te: "తర్వాత: {bags} బ్యాగులకు {name}",
  },
  contactShop: { en: "Call Shop", te: "షాప్‌కు కాల్" },
  phoneLoginTitle: { en: "Member Login", te: "సభ్యుల లాగిన్" },
  phoneLoginHint: {
    en: "Enter the mobile number registered with the shop",
    te: "షాప్‌లో నమోదు చేసిన ఫోన్ నంబర్ నమోదు చేయండి",
  },
  phoneNumber: { en: "Mobile Number", te: "ఫోన్ నంబర్" },
  phoneLoginButton: { en: "View My Rewards", te: "నా బహుమతులు చూడండి" },
  invalidPhone: {
    en: "Enter a valid 10-digit mobile number",
    te: "సరైన 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి",
  },
  notMember: {
    en: "You are not a member of this company. Contact the shop.",
    te: "మీరు ఈ కంపెనీ సభ్యులు కాదు. షాప్‌కు సంప్రదించండి.",
  },
  loginFailed: {
    en: "Could not sign in. Try again.",
    te: "లాగిన్ కాలేదు. మళ్ళీ ప్రయత్నించండి.",
  },
  step1Phone: { en: "1. Install app on your phone", te: "① ఫోన్‌లో App జోడించండి" },
  step2Phone: { en: "2. Enter your registered number", te: "② నమోదు ఫోన్ నంబర్ నమోదు చేయండి" },
  step3Phone: { en: "3. See your rewards", te: "③ మీ బహుమతులు చూడండి" },
  installRequiredTitle: { en: "Install App First", te: "ముందు App జోడించండి" },
  installRequiredBody: {
    en: "You must add this app to your phone before you can sign in. No skip.",
    te: "లాగిన్ కావాలంటే ముందు ఫోన్‌లో App జోడించాలి. దాటవెండి.",
  },
  installIosReopen: {
    en: "4. Open the app from your home screen",
    te: "④ హోమ్ స్క్రీన్ నుండి App తెరవండి",
  },
  installDesktopHint: {
    en: "Please open this site on your mobile phone to install and sign in.",
    te: "దయచేసి మొబైల్ ఫోన్‌లో తెరిచి App జోడించండి.",
  },
  backToLogin: { en: "Back to login", te: "లాగిన్‌కు వెనుక" },
  welcome: { en: "Hello", te: "నమస్కారం" },
  you: { en: "You", te: "మీరు" },
  allCategories: { en: "All", te: "అందరు" },
  noHistory: { en: "Nothing yet this month", te: "ఈ నెల ఇంకా లేదు" },
  setupTitle: { en: "Shop Not Ready", te: "షాప్ ఇంకా సిద్ధం కాలేదు" },
  setupHint: {
    en: "Please contact the shop",
    te: "దయచేసి షాప్‌కు సంప్రదించండి",
  },
  installAppTitle: { en: "Add App to Phone", te: "ఫోన్‌లో App జోడించండి" },
  installAppBody: {
    en: "Install once — open your rewards anytime from your home screen!",
    te: "ఒక్కసారి జోడించండి — హోమ్ స్క్రీన్ నుండి మీ బహుమతులు చూడండి!",
  },
  installNow: { en: "Install App", te: "App జోడించండి" },
  installLater: { en: "Later", te: "తర్వాత" },
  installing: { en: "Installing...", te: "వేచండి..." },
  installAndroidWait: {
    en: "Waiting for Chrome… Install button appears in a moment",
    te: "Chrome కోసం వేచండి… Install బటన్ వస్తుంది",
  },
  installTryNow: { en: "Install App (Tap)", te: "App జోడించండి (ట్యాప్)" },
  installChromeManual: {
    en: "Chrome: tap ⋮ menu (top right) → “Install app” or “Add to Home screen”",
    te: "Chrome: ⋮ మెనూ → “Install app” లేదా “Add to Home screen”",
  },
  installIos1: { en: "1. Tap Share ⎙ at bottom of Safari", te: "① Safari కింద Share ⎙ ను ట్యాప్ చేయండి" },
  installIos2: { en: "2. Tap “Add to Home Screen”", te: "② “Add to Home Screen” ట్యాప్ చేయండి" },
  installIos3: { en: "3. Tap Add — done! ✅", te: "③ Add ట్యాప్ — అయిపోయింది! ✅" },
  achieved: { en: "Target reached!", te: "లక్ష్యం చేరుకున్నారు!" },
  almostThere: { en: "Almost there!", te: "దగ్గరగా ఉన్నారు!" },
  keepGoing: { en: "Keep going!", te: "ముందుకు సాగండి!" },
  startNow: { en: "Start now!", te: "ఇప్పుడు ప్రారంభించండి!" },
  motivationQuote: userMotivation.quote,
  motivationTagline: userMotivation.tagline,
  motivationJourney: userMotivation.journey,
};

export function progressMessage(lang: Lang, percent: number): string {
  if (percent >= 100) return t(lang, labels.achieved.en, labels.achieved.te);
  if (percent >= 75) return t(lang, labels.almostThere.en, labels.almostThere.te);
  if (percent >= 40) return t(lang, labels.keepGoing.en, labels.keepGoing.te);
  return t(lang, labels.startNow.en, labels.startNow.te);
}
