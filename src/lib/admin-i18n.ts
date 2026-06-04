import type { Lang } from "./types";
import { displayLocalTelugu } from "./local-telugu";

/** Admin UI — Telugu toggle shows simple local Telugu only */
export function ta(lang: Lang, en: string, te?: string): string {
  if (lang !== "te") return en;
  const teText = te ?? en;
  return displayLocalTelugu(teText) || teText;
}

export const adminLabels = {
  admin: { en: "Admin", te: "అడ్మిన్" },
  logout: { en: "Logout", te: "బయట" },
  overview: { en: "Overview", te: "హోమ్" },
  contractors: { en: "Member", te: "సభ్యుడు" },
  amounts: { en: "Amounts", te: "మొత్తం" },
  leaderboard: { en: "Winners", te: "టాప్" },
  rewards: { en: "Rewards", te: "బహుమతులు" },
  targets: { en: "Targets", te: "లక్ష్యం" },
  activeContractors: { en: "Active", te: "ఆన్" },
  monthTotal: { en: "This Month", te: "ఈ నెల" },
  topContractor: { en: "Top Contractor", te: "టాప్ సభ్యుడు" },
  targetAchieved: { en: "Target Met", te: "లక్ష్యం చేరారు" },
  addContractor: { en: "Add Contractor", te: "సభ్యుడిని జోడించు" },
  contractorsList: { en: "All Contractors", te: "అందరు సభ్యులు" },
  addAmount: { en: "Add Amount", te: "మొత్తం జోడించు" },
  recentTx: { en: "Recent Transactions", te: "ఇటీవలవి" },
  markReward: { en: "Mark Reward Delivered", te: "బహుమతి ఇచ్చారు" },
  rewardHistory: { en: "Reward History", te: "బహుమతి లిస్టు" },
  categoryTargets: { en: "Targets & Gifts", te: "లక్ష్యం & బహుమతులు" },
  rewardsColumn: { en: "Gifts for this category", te: "ఈ పని బహుమతులు" },
  minToUnlock: { en: "Position (1 = 1st)", te: "స్థానం (1 = మొదటి)" },
  selectRank: { en: "Leaderboard rank", te: "స్థానం ఎంచుకోండి" },
  giftDesign: { en: "Gift design", te: "బహుమతి డిజైన్" },
  giftPreview: { en: "App preview", te: "App లో ఇలా కనిపిస్తుంది" },
  giftPlanHint: {
    en: "Each card can have a different target. Members unlock only their rank's gift after reaching that card's target.",
    te: "ప్రతి కార్డ్ లో వేరే లక్ష్యం పెట్టవచ్చు. ఆ లక్ష్యం చేరితే మీ స్థానం బహుమతి మాత్రమే.",
  },
  duplicateRank: {
    en: "This rank is already used — choose another",
    te: "ఈ స్థానం ఇప్పటికే ఉంది — వేరే స్థానం ఎంచుకోండి",
  },
  rankUsed: { en: "taken", te: "ఇప్పటికే" },
  noGiftsYet: {
    en: "No gifts yet — add a rank below",
    te: "ఇంకా బహుమతులు లేవు — కింద జోడించండి",
  },
  giftCardTarget: { en: "Monthly target", te: "లక్ష్యం" },
  giftCardUnlock: {
    en: "{rank} — unlocks after {target}",
    te: "{rank} — {target} చేరితే బహుమతి",
  },
  targetPeriodSummary: {
    en: "Period target: {target}",
    te: "ఈ కాలం లక్ష్యం: {target}",
  },
  giftNameEn: { en: "Gift name (English)", te: "బహుమతి పేరు (English)" },
  giftNameTe: { en: "Gift name (Telugu)", te: "బహుమతి పేరు (తెలుగు)" },
  giftPlanEn: {
    en: "Plan note (English) — type freely",
    te: "ప్లాన్ (English) — మీరు రాయండి",
  },
  giftPlanTe: {
    en: "Plan note (Telugu)",
    te: "ప్లాన్ (తెలుగు)",
  },
  saveCard: { en: "Save", te: "సేవ్" },
  selectGiftDeliver: { en: "Gift to deliver", te: "ఇచ్చే బహుమతి" },
  giftImage: { en: "Image", te: "ఫోటో" },
  addGiftRow: { en: "Add gift", te: "బహుమతి జోడించు" },
  addTargetAndGift: {
    en: "Add target & gift",
    te: "లక్ష్యం & బహుమతి జోడించు",
  },
  giftCardTitle: {
    en: "Target & gift",
    te: "లక్ష్యం & బహుమతి",
  },
  savePlan: { en: "Save target & gifts", te: "లక్ష్యం & బహుమతులు సేవ్" },
  giftRemoved: { en: "Gift removed and saved", te: "బహుమతి తీసి సేవ్ చేశారు" },
  confirmRemoveGift: {
    en: "Remove this gift and save to the database?",
    te: "ఈ బహుమతి తీసి సేవ్ చేయాలా?",
  },
  deliverRewards: { en: "Mark gift delivered", te: "బహుమతి ఇచ్చారు" },
  save: { en: "Save", te: "సేవ్" },
  add: { en: "Add", te: "జోడించు" },
  download: { en: "Download Card", te: "కార్డ్ డౌన్‌లోడ్" },
  deactivate: { en: "Deactivate", te: "ఆఫ్ చేయి" },
  phone: { en: "Phone", te: "ఫోన్" },
  callMember: { en: "Call", te: "కాల్ చేయి" },
  category: { en: "Category", te: "పని" },
  amount: { en: "Amount (₹)", te: "మొత్తం (₹)" },
  reason: { en: "Reason", te: "కారణం" },
  date: { en: "Date", te: "తేదీ" },
  name: { en: "Name", te: "పేరు" },
  village: { en: "Village", te: "ఊరు" },
  saved: { en: "Saved!", te: "సేవ్ అయింది!" },
  failed: { en: "Failed. Try again.", te: "కాలేదు. మళ్ళీ చూడండి." },
  loading: { en: "Loading...", te: "వేస్తోంది..." },
  noContractors: { en: "No contractors yet. Add one above.", te: "ఇంకా ఎవరు లేరు. పైన జోడించు." },
  noMembers: { en: "No members in this list yet.", te: "ఇంకా సభ్యులు లేరు." },
  exportWhatsapp: { en: "Share Winners Image", te: "టాప్ ఫోటో షేర్" },
  typeEnglishHint: {
    en: "Type in English — simple local Telugu fills automatically",
    te: "ఇంగ్లీష్ రాయండి — సాధారణ తెలుగు ఆటో",
  },
  sessionExpired: { en: "Session expired. Log in again.", te: "సెషన్ అయిపోయింది. మళ్ళీ లాగిన్." },
  tryAgain: { en: "Try Again", te: "మళ్ళీ చూడండి" },
  markDelivered: { en: "Mark Delivered", te: "ఇచ్చారు ✅" },
  saveTransaction: { en: "Save Transaction", te: "మొత్తం సేవ్" },
  addContractorBtn: { en: "Add Contractor", te: "సభ్యుడిని జోడించు" },
  registry: { en: "Members", te: "సభ్యులు" },
  registrationCounts: { en: "Members by Trade", te: "పని వారీ సభ్యులు" },
  contractorsByCategory: { en: "All Members", te: "అందరు సభ్యులు" },
  totalRegistered: { en: "Total Members", te: "మొత్తం సభ్యులు" },
  filterAll: { en: "All", te: "అన్ని" },
  edit: { en: "Edit", te: "మార్చు" },
  delete: { en: "Delete", te: "తీసేయి" },
  updateTransaction: { en: "Update Transaction", te: "మొత్తం మార్చు" },
  cancelEdit: { en: "Cancel", te: "రద్దు" },
  confirmDeleteTx: {
    en: "Delete this transaction?",
    te: "ఈ మొత్తం తీసేయాలా?",
  },
  deleted: { en: "Deleted!", te: "తీసేశారు!" },
  inactive: { en: "Inactive", te: "ఆఫ్" },
  searchContractor: { en: "Search name or phone", te: "పేరు లేదా ఫోన్" },
  selectMember: { en: "Select Member", te: "సభ్యుడిని ఎంచుకోండి" },
  pickMember: { en: "Tap to choose member", te: "సభ్యుడిని ఎంచుకోడానికి ట్యాప్ చేయండి" },
  searchMemberPicker: {
    en: "Search name, phone, or village",
    te: "పేరు, ఫోన్, ఊరు వెతకండి",
  },
  filterByTrade: { en: "Filter by trade", te: "పని వారీ" },
  filterByVillage: { en: "Filter by village", te: "ఊరు వారీ" },
  browseAllMembers: { en: "Browse all members", te: "అందరు సభ్యులు చూడండి" },
  changeMember: { en: "Change", te: "మార్చు" },
  searchRegistry: { en: "Search members", te: "సభ్యులు వెతకండి" },
  noSearchResults: { en: "No members match your search", te: "మీ వెతకడానికి ఎవరు లేరు" },
  searchFound: { en: "found", te: "దొరికింది" },
  loginHint: {
    en: "Contractors sign in with this phone number on the app",
    te: "ఈ ఫోన్ నంబర్ తో App లో లాగిన్ అవుతారు",
  },
  back: { en: "Back", te: "వెనక్కి" },
  noContractorsInCategory: {
    en: "No contractors in this category",
    te: "ఈ పనిలో ఎవరు లేరు",
  },
  menu: { en: "Menu", te: "మెనూ" },
  closeMenu: { en: "Close menu", te: "మెనూ మూసు" },
  mobileNavOverview: { en: "Home", te: "హోమ్" },
  mobileNavAmounts: { en: "Amount", te: "మొత్తం" },
  mobileNavContractors: { en: "Add", te: "జోడించు" },
  mobileNavRegister: { en: "Members", te: "సభ్యులు" },
  targetBags: { en: "Target (bags)", te: "లక్ష్యం (బ్యాగులు)" },
  targetAmount: { en: "Target (₹)", te: "లక్ష్యం (₹)" },
  periodStart: { en: "Start date", te: "మొదలు తేదీ" },
  periodEnd: { en: "End date", te: "ఆఖరి తేదీ" },
  periodOver: {
    en: "Period over — last target month has ended. Set new dates in Targets.",
    te: "కాలం అయిపోయింది. లక్ష్యం ట్యాబ్ లో కొత్త తేదీలు పెట్టండి.",
  },
  periodNotStarted: {
    en: "Period not started yet — check start date in Targets.",
    te: "ఇంకా మొదలు కాలేదు. లక్ష్యం ట్యాబ్ చూడండి.",
  },
  bags: { en: "Bags", te: "బ్యాగులు" },
  deactivated: { en: "Deactivated!", te: "ఆఫ్ చేశారు!" },
  reactivated: { en: "Activated again!", te: "మళ్ళీ ఆన్ చేశారు!" },
  activate: { en: "Activate", te: "ఆన్ చేయి" },
  active: { en: "Active", te: "ఆన్" },
  editContractor: { en: "Edit Contractor", te: "సభ్యుడిని మార్చు" },
  saveContractor: { en: "Save Changes", te: "మార్పులు సేవ్" },
  confirmDeleteContractor: {
    en: "Delete this contractor permanently? All their amounts will be removed.",
    te: "ఈ సభ్యుడిని పూర్తిగా తీసేయాలా? వాళ్ళ మొత్తం కూడా పోతుంది.",
  },
  confirmDeactivate: {
    en: "Mark this contractor inactive? They cannot log in until activated again.",
    te: "ఈ సభ్యుడిని ఆఫ్ చేయాలా? మళ్ళీ ఆన్ చేసే వరకు లాగిన్ కాదు.",
  },
  confirmActivate: {
    en: "Activate this contractor again? They can log in with their phone number.",
    te: "మళ్ళీ ఆన్ చేయాలా? ఫోన్ తో లాగిన్ అవుతారు.",
  },
  defaultCategory: { en: "Default when adding", te: "జోడించేటప్పుడు ఇదే" },
  setDefaultCategory: { en: "Set as default", te: "డిఫాల్ట్ గా పెట్టు" },
  defaultCategoryHint: {
    en: "New contractors start with this category until you change it.",
    te: "మీరు మార్చే వరకు కొత్త సభ్యులకు ఈ పని డిఫాల్ట్.",
  },
  defaultCategoryActive: { en: "Default for new members", te: "కొత్త సభ్యులకు డిఫాల్ట్" },
};

/** Safe label lookup — defined after adminLabels for stable client bundles */
export function adminLabel(lang: Lang, key: keyof typeof adminLabels): string {
  const entry = adminLabels[key];
  if (!entry?.en) return String(key);
  return ta(lang, entry.en, entry.te ?? entry.en);
}
