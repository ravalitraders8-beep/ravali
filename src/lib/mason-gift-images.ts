import type { Category, CategoryGift } from "./types";

/** Hardcoded real photos for Mason gifts (public/gifts/*.jpg) */
export const MASON_GIFT_IMAGE_BY_ID: Record<string, string> = {
  tv: "/gifts/mason-tv.jpg",
  grinder: "/gifts/mason-grinder.jpg",
  "iron-box": "/gifts/mason-iron-box.jpg",
  "design-kit": "/gifts/mason-design-kit.jpg",
};

export const MASON_GIFT_IMAGE_PRESETS = [
  { value: MASON_GIFT_IMAGE_BY_ID.tv, labelEn: "TV", labelTe: "టీవీ" },
  { value: MASON_GIFT_IMAGE_BY_ID.grinder, labelEn: "Grinder", labelTe: "గ్రైండర్" },
  { value: MASON_GIFT_IMAGE_BY_ID["iron-box"], labelEn: "Iron box", labelTe: "ఇనుము బాక్స్" },
  { value: MASON_GIFT_IMAGE_BY_ID["design-kit"], labelEn: "Design kit", labelTe: "డిజైన్ కిట్" },
] as const;

export function isMasonCategory(category: Category): boolean {
  return category.name_english.toLowerCase().includes("mason");
}

function isCustomGiftImageSrc(src: string): boolean {
  const s = src.trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.endsWith(".svg")) return false;
  return true;
}

export function resolveMasonGiftImageSrc(gift: Pick<CategoryGift, "id" | "image_src">): string {
  const src = (gift.image_src ?? "").trim();
  if (isCustomGiftImageSrc(src)) {
    return src.startsWith("/") || /^https?:\/\//i.test(src) ? src : `/${src}`;
  }

  const id = gift.id.toLowerCase().trim();
  if (MASON_GIFT_IMAGE_BY_ID[id]) return MASON_GIFT_IMAGE_BY_ID[id];

  const lower = src.toLowerCase();
  if (lower.includes("tv")) return MASON_GIFT_IMAGE_BY_ID.tv;
  if (lower.includes("grinder")) return MASON_GIFT_IMAGE_BY_ID.grinder;
  if (lower.includes("iron")) return MASON_GIFT_IMAGE_BY_ID["iron-box"];
  if (lower.includes("design") || lower.includes("kit")) {
    return MASON_GIFT_IMAGE_BY_ID["design-kit"];
  }

  return MASON_GIFT_IMAGE_BY_ID.tv;
}

export function applyMasonGiftImages(
  gifts: CategoryGift[],
  category: Category
): CategoryGift[] {
  if (!isMasonCategory(category)) return gifts;
  return gifts.map((g) => ({
    ...g,
    image_src: resolveMasonGiftImageSrc(g),
  }));
}
