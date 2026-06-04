"use client";

import Image from "next/image";
import {
  formatBagsThreshold,
  getNextMasonGift,
  getHighestUnlockedMasonGift,
  MASON_BAG_GIFTS,
  type MasonBagGift,
} from "@/lib/mason-gifts";
import { isBagsCategory } from "@/lib/category-period";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

interface GiftsSectionProps {
  category: Category;
  monthlyAmount: number;
}

function MasonGiftCard({
  gift,
  monthlyBags,
}: {
  gift: MasonBagGift;
  monthlyBags: number;
}) {
  const { lang } = useLang();
  const unlocked = monthlyBags >= gift.minBags;
  const isCurrent =
    getHighestUnlockedMasonGift(monthlyBags)?.id === gift.id && unlocked;
  const remaining = Math.max(0, gift.minBags - monthlyBags);
  const progress =
    gift.minBags > 0 ? Math.min(100, Math.round((monthlyBags / gift.minBags) * 100)) : 0;

  return (
    <div
      className={`flex gap-4 rounded-2xl p-4 ${
        unlocked
          ? "border-2 border-[#e85d00] bg-orange-50"
          : "border border-gray-200 bg-gray-50"
      } ${isCurrent ? "ring-2 ring-[#e85d00] ring-offset-2" : ""}`}
    >
      <div
        className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-white p-2 ${
          unlocked ? "" : "opacity-60 grayscale"
        }`}
      >
        <Image
          src={gift.imageSrc}
          alt={lang === "te" ? gift.imageAltTe : gift.imageAltEn}
          width={72}
          height={72}
          className="h-full w-full object-contain"
        />
        {!unlocked && (
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/25 text-2xl"
            aria-hidden
          >
            🔒
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-lg font-black text-[#1a2744]">
          {lang === "te" ? gift.nameTe : gift.nameEn}
        </p>
        <p className="text-sm font-bold text-[#e85d00]">
          {formatBagsThreshold(lang, gift.minBags)}
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          {lang === "te" ? gift.descriptionTe : gift.descriptionEn}
        </p>

        {!unlocked && remaining > 0 && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#e85d00] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-bold text-gray-600">
              {t(lang, labels.bagsToGo.en, labels.bagsToGo.te).replace(
                "{n}",
                String(remaining)
              )}
            </p>
          </div>
        )}

        {unlocked && (
          <p className="mt-2 text-sm font-bold text-green-700">
            {t(lang, labels.giftUnlocked.en, labels.giftUnlocked.te)} ✅
          </p>
        )}
      </div>
    </div>
  );
}

/** Mason: bag-milestone gifts. Other trades: hidden (no gold/bronze tiers). */
export function GiftsSection({ category, monthlyAmount }: GiftsSectionProps) {
  const { lang } = useLang();

  if (!isBagsCategory(category)) {
    return null;
  }

  const monthlyBags = Math.round(monthlyAmount);
  const nextGift = getNextMasonGift(monthlyBags);

  return (
    <div className="user-card bg-white">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-3xl">
          🎁
        </span>
        <div>
          <h2 className="text-xl font-black text-[#1a2744]">
            {t(lang, labels.gifts.en, labels.gifts.te)}
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            {t(lang, labels.masonGiftsHint.en, labels.masonGiftsHint.te)}
          </p>
        </div>
      </div>

      {nextGift && (
        <p className="mb-4 rounded-xl bg-[#1a2744]/5 px-4 py-3 text-center text-sm font-bold text-[#1a2744]">
          {t(lang, labels.nextMasonGift.en, labels.nextMasonGift.te)
            .replace("{bags}", String(nextGift.minBags))
            .replace("{name}", lang === "te" ? nextGift.nameTe : nextGift.nameEn)}
        </p>
      )}

      <div className="space-y-3">
        {MASON_BAG_GIFTS.map((gift) => (
          <MasonGiftCard key={gift.id} gift={gift} monthlyBags={monthlyBags} />
        ))}
      </div>
    </div>
  );
}
