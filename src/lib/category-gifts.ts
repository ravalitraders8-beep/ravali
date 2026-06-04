import { isBagsCategory, formatTargetValueBilingual } from "@/lib/category-period";
import { simplifyTeluguToLocal } from "@/lib/local-telugu";
import { sanitizeTeluguOutput } from "@/lib/transliterate";
import type { Category, CategoryGift, Lang } from "./types";

export type { CategoryGift };

export const GIFT_IMAGE_PRESETS: { value: string; labelEn: string; labelTe: string }[] = [
  { value: "/gifts/mason-tv.svg", labelEn: "TV", labelTe: "టీవీ" },
  { value: "/gifts/mason-grinder.svg", labelEn: "Grinder", labelTe: "గ్రైండర్" },
  { value: "/gifts/mason-iron-box.svg", labelEn: "Iron box", labelTe: "ఇనుము బాక్స్" },
  { value: "/gifts/mason-design-kit.svg", labelEn: "Design kit", labelTe: "డిజైన్ కిట్" },
];

/** Legacy DB rows used bag counts (100, 200, …) in min_value; new rows use rank 1, 2, 3… */
const LEGACY_BAG_THRESHOLD_MIN = 21;

const FALLBACK_MASON: CategoryGift[] = [
  {
    id: "tv",
    min_value: 1,
    name_english: "TV Gift",
    name_telugu: "టీవీ బహుమతి",
    description_english: "1st place — after you reach target",
    description_telugu: "① స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-tv.svg",
  },
  {
    id: "grinder",
    min_value: 2,
    name_english: "Mixer Grinder",
    name_telugu: "మిక్సీ గ్రైండర్",
    description_english: "2nd place — after you reach target",
    description_telugu: "② స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-grinder.svg",
  },
  {
    id: "iron-box",
    min_value: 3,
    name_english: "Iron Box",
    name_telugu: "ఇనుము బాక్స్",
    description_english: "3rd place — after you reach target",
    description_telugu: "③ స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-iron-box.svg",
  },
  {
    id: "design-kit",
    min_value: 4,
    name_english: "Design Kit",
    name_telugu: "డిజైన్ కిట్",
    description_english: "4th place — after you reach target",
    description_telugu: "④ స్థానం — లక్ష్యం చేరిన తర్వాత",
    image_src: "/gifts/mason-design-kit.svg",
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
  const image_src = String(g.image_src ?? "/gifts/mason-design-kit.svg").trim();
  if (!min_value || min_value < 1 || !name_english) return null;
  return {
    id: String(g.id ?? `gift-${min_value}-${name_english.slice(0, 8)}`),
    min_value,
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
  if (hasStoredCategoryRewards(category)) {
    return parseCategoryRewards(category.category_rewards);
  }
  if (category.name_english.toLowerCase().includes("mason")) {
    return [...FALLBACK_MASON].sort((a, b) => a.min_value - b.min_value);
  }
  return [];
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

export function isTargetReached(achievementPercent: number): boolean {
  return achievementPercent >= 100;
}

/** Only the gift for this rank unlocks — not every lower tier. */
export function isGiftUnlockedForContractor(
  gift: CategoryGift,
  category: Category,
  rank: number | null,
  achievementPercent: number
): boolean {
  if (rank === null || !isTargetReached(achievementPercent)) return false;
  const gifts = getCategoryGifts(category);
  return resolveGiftPosition(gift, gifts) === rank;
}

export function getUnlockedGiftForContractor(
  category: Category,
  rank: number | null,
  achievementPercent: number
): CategoryGift | null {
  const gifts = getCategoryGifts(category);
  return (
    gifts.find((g) => isGiftUnlockedForContractor(g, category, rank, achievementPercent)) ??
    null
  );
}

/** Gift tied to the member's current rank (shown as next goal before target is met). */
export function getGiftForRank(category: Category, rank: number | null): CategoryGift | null {
  if (rank === null) return null;
  const gifts = getCategoryGifts(category);
  return gifts.find((g) => resolveGiftPosition(g, gifts) === rank) ?? null;
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

export function formatGiftThreshold(lang: Lang, category: Category, minValue: number): string {
  const gifts = getCategoryGifts(category);
  if (!usesLegacyBagThresholds(gifts)) {
    return formatGiftPosition(lang, minValue);
  }
  const n = Math.round(minValue);
  if (isBagsCategory(category)) {
    return lang === "te" ? `${n}+ బ్యాగులు` : `${n}+ bags`;
  }
  return lang === "te" ? `${formatTargetValueBilingual(lang, category, n)}+` : `${n}+ (target)`;
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

export function sanitizeRewardsForSave(rewards: CategoryGift[]): CategoryGift[] {
  const cleaned = rewards
    .map((g) => normalizeGift(g))
    .filter((g): g is CategoryGift => g !== null);
  return sortGiftsByPosition(cleaned);
}

export function validateRewardsDraft(
  rewards: CategoryGift[],
  _targetAmount?: number
): { ok: true; cleaned: CategoryGift[] } | { ok: false; message: string } {
  const cleaned = sanitizeRewardsForSave(rewards);
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

export function newEmptyGiftRow(nextPosition = 1): CategoryGift {
  return {
    id: `gift-${Date.now()}`,
    min_value: nextPosition,
    name_english: "",
    name_telugu: "",
    description_english: "",
    description_telugu: "",
    image_src: GIFT_IMAGE_PRESETS[0].value,
  };
}
