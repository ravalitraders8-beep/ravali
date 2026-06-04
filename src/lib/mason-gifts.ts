import type { Lang } from "./types";

/** Hardcoded mason bag milestones — later: admin-configurable rewards */
export type MasonBagGift = {
  id: string;
  minBags: number;
  nameEn: string;
  nameTe: string;
  descriptionEn: string;
  descriptionTe: string;
  imageSrc: string;
  imageAltEn: string;
  imageAltTe: string;
};

export const MASON_BAG_GIFTS: MasonBagGift[] = [
  {
    id: "tv",
    minBags: 600,
    nameEn: "TV Gift",
    nameTe: "టీవీ బహుమతి",
    descriptionEn: "LED TV for top mason partners",
    descriptionTe: "అత్యుత్తమ మేస్త్రీలకు LED TV",
    imageSrc: "/gifts/mason-tv.svg",
    imageAltEn: "Television gift",
    imageAltTe: "టీవీ బహుమతి",
  },
  {
    id: "grinder",
    minBags: 300,
    nameEn: "Mixer Grinder",
    nameTe: "మిక్సీ గ్రైండర్",
    descriptionEn: "Mixer grinder for your home",
    descriptionTe: "మీ ఇంటికి మిక్సీ గ్రైండర్",
    imageSrc: "/gifts/mason-grinder.svg",
    imageAltEn: "Mixer grinder gift",
    imageAltTe: "మిక్సీ గ్రైండర్ బహుమతి",
  },
  {
    id: "iron-box",
    minBags: 200,
    nameEn: "Iron Box",
    nameTe: "ఇనుము బాక్స్",
    descriptionEn: "Electric iron box",
    descriptionTe: "ఎలక్ట్రిక్ ఇనుము బాక్స్",
    imageSrc: "/gifts/mason-iron-box.svg",
    imageAltEn: "Electric iron box gift",
    imageAltTe: "ఇనుము బాక్స్ బహుమతి",
  },
  {
    id: "design-kit",
    minBags: 100,
    nameEn: "Design Kit",
    nameTe: "డిజైన్ కిట్",
    descriptionEn: "Mason tool & design kit",
    descriptionTe: "మేస్త్రీ టూల్ & డిజైన్ కిట్",
    imageSrc: "/gifts/mason-design-kit.svg",
    imageAltEn: "Mason design tool kit",
    imageAltTe: "మేస్త్రీ డిజైన్ కిట్",
  },
].sort((a, b) => b.minBags - a.minBags);

export function isMasonCategory(nameEnglish: string): boolean {
  return nameEnglish.toLowerCase().includes("mason");
}

export function formatBagsThreshold(lang: Lang, bags: number): string {
  return lang === "te" ? `${bags}+ బ్యాగులు` : `${bags}+ bags`;
}

export function getHighestUnlockedMasonGift(
  monthlyBags: number
): MasonBagGift | null {
  return MASON_BAG_GIFTS.find((g) => monthlyBags >= g.minBags) ?? null;
}

export function getNextMasonGift(monthlyBags: number): MasonBagGift | null {
  const ascending = [...MASON_BAG_GIFTS].sort((a, b) => a.minBags - b.minBags);
  return ascending.find((g) => monthlyBags < g.minBags) ?? null;
}
