"use client";

import Image from "next/image";
import {
  formatGiftThreshold,
  getCategoryGifts,
  getHighestUnlockedGift,
  getNextCategoryGift,
  type CategoryGift,
} from "@/lib/category-gifts";
import { isBagsCategory } from "@/lib/category-period";
import { formatINR } from "@/lib/currency";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

interface GiftsSectionProps {
  category: Category;
  monthlyAmount: number;
}

function CategoryGiftCard({
  gift,
  category,
  monthlyValue,
}: {
  gift: CategoryGift;
  category: Category;
  monthlyValue: number;
}) {
  const { lang } = useLang();
  const unlocked = monthlyValue >= gift.min_value;
  const isCurrent =
    getHighestUnlockedGift(category, monthlyValue)?.id === gift.id && unlocked;
  const remaining = Math.max(0, gift.min_value - monthlyValue);
  const progress =
    gift.min_value > 0
      ? Math.min(100, Math.round((monthlyValue / gift.min_value) * 100))
      : 0;
  const bags = isBagsCategory(category);

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
          src={gift.image_src}
          alt={lang === "te" ? gift.name_telugu : gift.name_english}
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
          {lang === "te" ? gift.name_telugu : gift.name_english}
        </p>
        <p className="text-sm font-bold text-[#e85d00]">
          {formatGiftThreshold(lang, category, gift.min_value)}
        </p>
        {(gift.description_english || gift.description_telugu) && (
          <p className="mt-0.5 text-sm text-gray-600">
            {lang === "te"
              ? gift.description_telugu ?? gift.description_english
              : gift.description_english}
          </p>
        )}

        {!unlocked && remaining > 0 && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#e85d00] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-bold text-gray-600">
              {bags
                ? t(lang, labels.bagsToGo.en, labels.bagsToGo.te).replace(
                    "{n}",
                    String(remaining)
                  )
                : t(lang, labels.amountToGo.en, labels.amountToGo.te).replace(
                    "{n}",
                    formatINR(remaining)
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

/** Gifts from admin Targets & Gifts plan for this category */
export function GiftsSection({ category, monthlyAmount }: GiftsSectionProps) {
  const { lang } = useLang();
  const gifts = getCategoryGifts(category);
  const monthlyValue = Math.round(monthlyAmount);

  if (gifts.length === 0) {
    return null;
  }

  const nextGift = getNextCategoryGift(category, monthlyValue);
  const bags = isBagsCategory(category);

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
            {bags
              ? t(lang, labels.masonGiftsHint.en, labels.masonGiftsHint.te)
              : t(lang, labels.categoryGiftsHint.en, labels.categoryGiftsHint.te)}
          </p>
        </div>
      </div>

      {nextGift && (
        <p className="mb-4 rounded-xl bg-[#1a2744]/5 px-4 py-3 text-center text-sm font-bold text-[#1a2744]">
          {t(lang, labels.nextCategoryGift.en, labels.nextCategoryGift.te)
            .replace("{value}", formatGiftThreshold(lang, category, nextGift.min_value))
            .replace("{name}", lang === "te" ? nextGift.name_telugu : nextGift.name_english)}
        </p>
      )}

      <div className="space-y-3">
        {gifts.map((gift) => (
          <CategoryGiftCard
            key={gift.id}
            gift={gift}
            category={category}
            monthlyValue={monthlyValue}
          />
        ))}
      </div>
    </div>
  );
}
