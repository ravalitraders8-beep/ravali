import { isBagsCategory, formatTargetValueBilingual } from "@/lib/category-period";
import { resolveBilingualField } from "@/lib/transliterate";
import type { Category, CategoryGift, Lang } from "./types";

export type { CategoryGift };

export const GIFT_IMAGE_PRESETS: { value: string; labelEn: string; labelTe: string }[] = [
  { value: "/gifts/mason-tv.svg", labelEn: "TV", labelTe: "టీవీ" },
  { value: "/gifts/mason-grinder.svg", labelEn: "Grinder", labelTe: "గ్రైండర్" },
  { value: "/gifts/mason-iron-box.svg", labelEn: "Iron box", labelTe: "ఇనుము బాక్స్" },
  { value: "/gifts/mason-design-kit.svg", labelEn: "Design kit", labelTe: "డిజైన్ కిట్" },
];

const FALLBACK_MASON: CategoryGift[] = [
  {
    id: "tv",
    min_value: 600,
    name_english: "TV Gift",
    name_telugu: "టీవీ బహుమతి",
    description_english: "LED TV for top mason partners",
    description_telugu: "అత్యుత్తమ మేస్త్రీలకు LED TV",
    image_src: "/gifts/mason-tv.svg",
  },
  {
    id: "grinder",
    min_value: 300,
    name_english: "Mixer Grinder",
    name_telugu: "మిక్సీ గ్రైండర్",
    description_english: "Mixer grinder for your home",
    description_telugu: "మీ ఇంటికి మిక్సీ గ్రైండర్",
    image_src: "/gifts/mason-grinder.svg",
  },
  {
    id: "iron-box",
    min_value: 200,
    name_english: "Iron Box",
    name_telugu: "ఇనుము బాక్స్",
    description_english: "Electric iron box",
    description_telugu: "ఎలక్ట్రిక్ ఇనుము బాక్స్",
    image_src: "/gifts/mason-iron-box.svg",
  },
  {
    id: "design-kit",
    min_value: 100,
    name_english: "Design Kit",
    name_telugu: "డిజైన్ కిట్",
    description_english: "Mason tool & design kit",
    description_telugu: "మేస్త్రీ టూల్ & డిజైన్ కిట్",
    image_src: "/gifts/mason-design-kit.svg",
  },
];

function normalizeGift(raw: unknown): CategoryGift | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const min_value = Number(g.min_value);
  const names = resolveBilingualField(
    String(g.name_english ?? ""),
    String(g.name_telugu ?? "")
  );
  const name_english = names.english;
  const name_telugu = names.telugu;
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
  return list
    .map(normalizeGift)
    .filter((g): g is CategoryGift => g !== null)
    .sort((a, b) => b.min_value - a.min_value);
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
    return [...FALLBACK_MASON].sort((a, b) => b.min_value - a.min_value);
  }
  return [];
}

export function formatGiftThreshold(lang: Lang, category: Category, minValue: number): string {
  const n = Math.round(minValue);
  if (isBagsCategory(category)) {
    return lang === "te" ? `${n}+ బ్యాగులు` : `${n}+ bags`;
  }
  return lang === "te" ? `${formatTargetValueBilingual(lang, category, n)}+` : `${n}+ (target)`;
}

export function getHighestUnlockedGift(
  category: Category,
  monthlyValue: number
): CategoryGift | null {
  return getCategoryGifts(category).find((g) => monthlyValue >= g.min_value) ?? null;
}

export function getNextCategoryGift(
  category: Category,
  monthlyValue: number
): CategoryGift | null {
  const ascending = [...getCategoryGifts(category)].sort((a, b) => a.min_value - b.min_value);
  return ascending.find((g) => monthlyValue < g.min_value) ?? null;
}

export function sanitizeRewardsForSave(rewards: CategoryGift[]): CategoryGift[] {
  return rewards
    .map((g) => normalizeGift(g))
    .filter((g): g is CategoryGift => g !== null)
    .sort((a, b) => b.min_value - a.min_value);
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
        "Each gift needs a name and min value | ప్రతి బహుమతికి పేరు మరియు కనీస మొత్తం కావాలి",
    };
  }
  for (const g of rewards) {
    if (!g.name_english?.trim() && !g.name_telugu?.trim()) {
      return {
        ok: false,
        message: "Gift name is required | బహుమతి పేరు నమోదు చేయండి",
      };
    }
    if (!g.min_value || g.min_value < 1) {
      return {
        ok: false,
        message: "Min to unlock must be at least 1 | కనీసం 1 ఉండాలి",
      };
    }
  }
  return { ok: true, cleaned };
}

export function newEmptyGiftRow(): CategoryGift {
  return {
    id: `gift-${Date.now()}`,
    min_value: 100,
    name_english: "",
    name_telugu: "",
    description_english: "",
    description_telugu: "",
    image_src: GIFT_IMAGE_PRESETS[0].value,
  };
}
