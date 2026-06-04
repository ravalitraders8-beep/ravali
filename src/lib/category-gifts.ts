import { isBagsCategory, formatTargetValueBilingual } from "@/lib/category-period";
import {
  applyMasonGiftImages,
  isMasonCategory,
  MASON_GIFT_IMAGE_PRESETS,
} from "@/lib/mason-gift-images";
import { simplifyTeluguToLocal } from "@/lib/local-telugu";
import { sanitizeTeluguOutput } from "@/lib/transliterate";
import type { Category, CategoryGift, Lang } from "./types";

export type { CategoryGift };

export const MAX_GIFT_RANKS = 10;

/** Mason uses real photos; other trades can reuse these paths until custom assets exist. */
export const GIFT_IMAGE_PRESETS: { value: string; labelEn: string; labelTe: string }[] = [
  ...MASON_GIFT_IMAGE_PRESETS,
];

/** Legacy DB rows used bag counts (100, 200, …) in min_value; new rows use rank 1, 2, 3… */
const LEGACY_BAG_THRESHOLD_MIN = 21;

const FALLBACK_MASON: CategoryGift[] = [
  {
    id: "tv",
    min_value: 1,
    target_amount: 600,
    name_english: "TV Gift",
    name_telugu: "టీవీ బహుమతి",
    description_english: "1st place — after you reach target",
    description_telugu: "① స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-tv.jpg",
  },
  {
    id: "grinder",
    min_value: 2,
    target_amount: 300,
    name_english: "Mixer Grinder",
    name_telugu: "మిక్సీ గ్రైండర్",
    description_english: "2nd place — after you reach target",
    description_telugu: "② స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-grinder.jpg",
  },
  {
    id: "iron-box",
    min_value: 3,
    target_amount: 200,
    name_english: "Iron Box",
    name_telugu: "ఇనుము బాక్స్",
    description_english: "3rd place — after you reach target",
    description_telugu: "③ స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-iron-box.jpg",
  },
  {
    id: "design-kit",
    min_value: 4,
    target_amount: 100,
    name_english: "Design Kit",
    name_telugu: "డిజైన్ కిట్",
    description_english: "4th place — after you reach target",
    description_telugu: "④ స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-design-kit.jpg",
  },
];

function normalizeGift(raw: unknown): CategoryGift | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const min_value = Number(g.min_value);
  let name_english = String(g.name_english ?? "").trim();
  let name_telugu = String(g.name_telugu ?? "").trim();
  if (!name_english && name_telugu) name_english = name_telugu;
  if (!name_telugu && name_english) name_telugu = name_english;
  name_telugu = simplifyTeluguToLocal(sanitizeTeluguOutput(name_telugu));
  const image_src = String(g.image_src ?? "/gifts/mason-design-kit.jpg").trim();
  const targetRaw = Number(g.target_amount);
  const target_amount =
    Number.isFinite(targetRaw) && targetRaw > 0 ? Math.round(targetRaw) : undefined;
  if (!min_value || min_value < 1 || !name_english) return null;
  return {
    id: String(g.id ?? `gift-${min_value}-${name_english.slice(0, 8)}`),
    min_value,
    ...(target_amount ? { target_amount } : {}),
    name_english,
    name_telugu,
    description_english: String(g.description_english ?? "").trim() || undefined,
    description_telugu: String(g.description_telugu ?? "").trim() || undefined,
    image_src: image_src.startsWith("/") ? image_src : `/${image_src}`,
  };
}

export function parseCategoryRewards(raw: unknown): CategoryGift[] {
  if (!raw) return [];
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      return [];
    }
  }
  const parsed = list
    .map(normalizeGift)
    .filter((g): g is CategoryGift => g !== null);
  return sortGiftsByPosition(parsed);
}

/** True when DB has an explicit rewards list (including empty = user cleared all gifts) */
export function hasStoredCategoryRewards(category: Category): boolean {
  const raw = category.category_rewards;
  if (raw === undefined || raw === null) return false;
  if (Array.isArray(raw)) return true;
  if (typeof raw === "string") return raw.trim().length > 0;
  return typeof raw === "object";
}

export function getCategoryGifts(category: Category): CategoryGift[] {
  let gifts: CategoryGift[];
  if (hasStoredCategoryRewards(category)) {
    gifts = parseCategoryRewards(category.category_rewards);
  } else if (isMasonCategory(category)) {
    gifts = [...FALLBACK_MASON].sort((a, b) => a.min_value - b.min_value);
  } else {
    return [];
  }
  return applyMasonGiftImages(gifts, category);
}

export function getGiftImagePresetsForCategory(
  category: Category
): { value: string; labelEn: string; labelTe: string }[] {
  if (isMasonCategory(category)) return [...MASON_GIFT_IMAGE_PRESETS];
  return GIFT_IMAGE_PRESETS;
}

/** Old saves used bag/amount thresholds in min_value; new saves use rank 1, 2, 3… */
export function usesLegacyBagThresholds(gifts: CategoryGift[]): boolean {
  return gifts.some((g) => g.min_value >= LEGACY_BAG_THRESHOLD_MIN);
}

/** Leaderboard position this gift row belongs to (1 = 1st in category). */
export function resolveGiftPosition(gift: CategoryGift, gifts: CategoryGift[]): number {
  if (gifts.length === 0) return 0;
  if (!usesLegacyBagThresholds(gifts)) {
    return Math.max(1, Math.round(gift.min_value));
  }
  const sorted = [...gifts].sort((a, b) => b.min_value - a.min_value);
  const idx = sorted.findIndex((g) => g.id === gift.id);
  return idx >= 0 ? idx + 1 : 0;
}

export function sortGiftsByPosition(gifts: CategoryGift[]): CategoryGift[] {
  return [...gifts].sort(
    (a, b) => resolveGiftPosition(a, gifts) - resolveGiftPosition(b, gifts)
  );
}

/** Bags or ₹ required for this gift row. */
export function getGiftTargetAmount(gift: CategoryGift, category: Category): number {
  const gifts = getCategoryGifts(category);
  if (usesLegacyBagThresholds(gifts)) {
    return Math.max(1, Math.round(gift.min_value));
  }
  const stored = Number(gift.target_amount);
  if (stored > 0) return Math.round(stored);
  return Math.max(0, Math.round(Number(category.monthly_target_amount) || 0));
}

export function getAchievementPercent(monthlyAmount: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((monthlyAmount / target) * 1000) / 10;
}

export function getAchievementPercentForGift(
  monthlyAmount: number,
  gift: CategoryGift,
  category: Category
): number {
  return getAchievementPercent(monthlyAmount, getGiftTargetAmount(gift, category));
}

/** Target for member's rank gift, else category default. */
export function getTargetForRank(
  category: Category,
  rank: number | null
): number {
  const gift = getGiftForRank(category, rank);
  if (gift) return getGiftTargetAmount(gift, category);
  return Math.max(0, Math.round(Number(category.monthly_target_amount) || 0));
}

/** Max gift target — stored on category for leaderboard SQL fallback. */
export function deriveCategoryMonthlyTarget(
  rewards: CategoryGift[],
  category: Category
): number {
  if (rewards.length === 0) {
    return Math.max(0, Math.round(Number(category.monthly_target_amount) || 0));
  }
  return Math.max(
    ...rewards.map((g) => getGiftTargetAmount(g, category)),
    0
  );
}

export function isTargetReached(achievementPercent: number): boolean {
  return achievementPercent >= 100;
}

export function isMonthlyTargetReached(
  monthlyAmount: number,
  gift: CategoryGift,
  category: Category
): boolean {
  const target = getGiftTargetAmount(gift, category);
  return target > 0 && monthlyAmount >= target;
}

/** Highest target row the member has reached this month (only one gift stays unlocked). */
export function getHighestReachedGift(
  category: Category,
  monthlyAmount: number
): CategoryGift | null {
  const gifts = getCategoryGifts(category);
  if (gifts.length === 0 || monthlyAmount <= 0) return null;

  const byTargetDesc = [...gifts].sort(
    (a, b) => getGiftTargetAmount(b, category) - getGiftTargetAmount(a, category)
  );
  for (const g of byTargetDesc) {
    if (isMonthlyTargetReached(monthlyAmount, g, category)) return g;
  }
  return null;
}

/** True when amount passed this row but a higher-target gift is the active unlock. */
export function isGiftSupersededByHigher(
  gift: CategoryGift,
  category: Category,
  monthlyAmount: number
): boolean {
  const highest = getHighestReachedGift(category, monthlyAmount);
  if (!highest || highest.id === gift.id) return false;
  if (!isMonthlyTargetReached(monthlyAmount, gift, category)) return false;
  return (
    getGiftTargetAmount(gift, category) < getGiftTargetAmount(highest, category)
  );
}

/** Only the highest reached tier stays unlocked; lower tiers lock after you move up. */
export function isGiftUnlockedForContractor(
  gift: CategoryGift,
  category: Category,
  _rank: number | null,
  monthlyAmount: number
): boolean {
  const highest = getHighestReachedGift(category, monthlyAmount);
  return highest?.id === gift.id;
}

export function bagsRemainingForGift(
  monthlyAmount: number,
  gift: CategoryGift,
  category: Category
): number {
  const target = getGiftTargetAmount(gift, category);
  return Math.max(0, Math.round(target - monthlyAmount));
}

/** Member's rank gift when it is the highest tier they have reached. */
export function getUnlockedGiftForContractor(
  category: Category,
  rank: number | null,
  monthlyAmount: number
): CategoryGift | null {
  const highest = getHighestReachedGift(category, monthlyAmount);
  if (!highest) return null;
  const rankGift = getGiftForRank(category, rank);
  if (rankGift && rankGift.id === highest.id) return rankGift;
  return highest;
}

/** Gift tied to the member's current rank (shown as next goal before target is met). */
export function getGiftForRank(category: Category, rank: number | null): CategoryGift | null {
  if (rank === null) return null;
  const gifts = getCategoryGifts(category);
  return gifts.find((g) => resolveGiftPosition(g, gifts) === rank) ?? null;
}

export function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
}

export function descriptionsForRank(rank: number): {
  description_english: string;
  description_telugu: string;
} {
  const n = Math.max(1, Math.round(rank));
  return {
    description_english: `${n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`} place — after monthly target`,
    description_telugu:
      n === 1
        ? "① స్థానం — లక్ష్యం చేరిన తర్వాత"
        : n === 2
          ? "② స్థానం — లక్ష్యం చేరిన తర్వాత"
          : n === 3
            ? "③ స్థానం — లక్ష్యం చేరిన తర్వాత"
            : `${n} స్థానం — లక్ష్యం చేరిన తర్వాత`,
  };
}

/** Next leaderboard rank slot not used yet (1, 2, 3…). */
export function nextUnusedRank(gifts: CategoryGift[]): number {
  const used = new Set(
    gifts.map((g) =>
      usesLegacyBagThresholds(gifts)
        ? resolveGiftPosition(g, gifts)
        : Math.max(1, Math.round(g.min_value))
    )
  );
  for (let i = 1; i <= MAX_GIFT_RANKS; i++) {
    if (!used.has(i)) return i;
  }
  return MAX_GIFT_RANKS;
}

export function presetGiftNames(preset: (typeof GIFT_IMAGE_PRESETS)[number]): {
  name_english: string;
  name_telugu: string;
} {
  const map: Record<string, { name_english: string; name_telugu: string }> = {
    "/gifts/mason-tv.jpg": { name_english: "TV Gift", name_telugu: "టీవీ బహుమతి" },
    "/gifts/mason-grinder.jpg": {
      name_english: "Mixer Grinder",
      name_telugu: "మిక్సీ గ్రైండర్",
    },
    "/gifts/mason-iron-box.jpg": {
      name_english: "Iron Box",
      name_telugu: "ఇనుము బాక్స్",
    },
    "/gifts/mason-design-kit.jpg": {
      name_english: "Design Kit",
      name_telugu: "డిజైన్ కిట్",
    },
    "/gifts/mason-tv.svg": { name_english: "TV Gift", name_telugu: "టీవీ బహుమతి" },
    "/gifts/mason-grinder.svg": {
      name_english: "Mixer Grinder",
      name_telugu: "మిక్సీ గ్రైండర్",
    },
    "/gifts/mason-iron-box.svg": {
      name_english: "Iron Box",
      name_telugu: "ఇనుము బాక్స్",
    },
    "/gifts/mason-design-kit.svg": {
      name_english: "Design Kit",
      name_telugu: "డిజైన్ కిట్",
    },
  };
  return (
    map[preset.value] ?? {
      name_english: preset.labelEn,
      name_telugu: preset.labelTe,
    }
  );
}

export function formatGiftPosition(lang: Lang, position: number): string {
  const n = Math.max(1, Math.round(position));
  if (lang === "te") {
    if (n === 1) return "① స్థానం";
    if (n === 2) return "② స్థానం";
    if (n === 3) return "③ స్థానం";
    if (n === 4) return "④ స్థానం";
    return `${n} స్థానం`;
  }
  if (n === 1) return "1st place";
  if (n === 2) return "2nd place";
  if (n === 3) return "3rd place";
  return `${n}th place`;
}

export function formatGiftThreshold(lang: Lang, category: Category, gift: CategoryGift): string {
  const gifts = getCategoryGifts(category);
  const target = getGiftTargetAmount(gift, category);
  const targetLabel = formatTargetValueBilingual(lang, category, target);
  if (usesLegacyBagThresholds(gifts)) {
    return lang === "te" ? `${targetLabel}+` : `${targetLabel}+`;
  }
  const position = resolveGiftPosition(gift, gifts);
  return `${formatGiftPosition(lang, position)} · ${targetLabel}`;
}

/** @deprecated Use getUnlockedGiftForContractor — rank + target, not cumulative tiers */
export function getHighestUnlockedGift(
  category: Category,
  _monthlyValue: number
): CategoryGift | null {
  return null;
}

/** @deprecated Use getGiftForRank */
export function getNextCategoryGift(
  category: Category,
  _monthlyValue: number
): CategoryGift | null {
  return null;
}

export function sanitizeRewardsForSave(
  rewards: CategoryGift[],
  category?: Category
): CategoryGift[] {
  const cleaned = rewards
    .map((g) => normalizeGift(g))
    .filter((g): g is CategoryGift => g !== null);
  const sorted = sortGiftsByPosition(cleaned);
  if (!category || usesLegacyBagThresholds(sorted)) return sorted;
  const fallback = Math.max(1, Math.round(Number(category.monthly_target_amount) || 0) || 1);
  return sorted.map((g) => {
    const ta = Number(g.target_amount);
    return {
      ...g,
      target_amount: ta > 0 ? Math.round(ta) : fallback,
    };
  });
}

export function validateRewardsDraft(
  rewards: CategoryGift[],
  category?: Category
): { ok: true; cleaned: CategoryGift[] } | { ok: false; message: string } {
  const cleaned = sanitizeRewardsForSave(rewards, category);
  if (rewards.length > 0 && cleaned.length === 0) {
    return {
      ok: false,
      message:
        "Each gift needs a name and position | ప్రతి బహుమతికి పేరు, స్థానం కావాలి",
    };
  }
  for (const g of rewards) {
    if (!g.name_english?.trim() && !g.name_telugu?.trim()) {
      return {
        ok: false,
        message: "Gift name is required | బహుమతి పేరు పెట్టండి",
      };
    }
    if (!g.min_value || g.min_value < 1) {
      return {
        ok: false,
        message: "Position must be at least 1 | స్థానం కనీసం 1",
      };
    }
  }
  if (
    category &&
    cleaned.length > 0 &&
    !usesLegacyBagThresholds(cleaned) &&
    cleaned.some((g) => !g.target_amount || g.target_amount < 1)
  ) {
    return {
      ok: false,
      message: "Each card needs a target amount | ప్రతి కార్డ్ కి లక్ష్యం పెట్టండి",
    };
  }
  if (cleaned.length > 0 && !usesLegacyBagThresholds(cleaned)) {
    const positions = cleaned.map((g) => Math.round(g.min_value));
    if (positions.some((p) => p > 50)) {
      return {
        ok: false,
        message:
          "Use position 1, 2, 3… (1 = 1st place) | స్థానం 1, 2, 3… పెట్టండి (1 = మొదటి)",
      };
    }
    if (new Set(positions).size !== positions.length) {
      return {
        ok: false,
        message: "Each position must be unique | ప్రతి స్థానం వేరుగా ఉండాలి",
      };
    }
  }
  return { ok: true, cleaned };
}

export function newEmptyGiftRow(category: Category, nextPosition = 1): CategoryGift {
  const rank = Math.max(1, Math.round(nextPosition));
  const preset = GIFT_IMAGE_PRESETS[0];
  const names = presetGiftNames(preset);
  const desc = descriptionsForRank(rank);
  const defaultTarget = Math.max(
    1,
    Math.round(Number(category.monthly_target_amount) || 0) || 100
  );
  return {
    id: `gift-${Date.now()}`,
    min_value: rank,
    target_amount: defaultTarget,
    name_english: names.name_english,
    name_telugu: names.name_telugu,
    description_english: desc.description_english,
    description_telugu: desc.description_telugu,
    image_src: preset.value,
  };
}
