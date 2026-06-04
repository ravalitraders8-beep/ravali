"use client";

import Image from "next/image";
import { getContractorCategoryRank } from "@/lib/category-about";
import {
  formatGiftThreshold,
  getAchievementPercentForGift,
  getCategoryGifts,
  getGiftForRank,
  getUnlockedGiftForContractor,
  isGiftUnlockedForContractor,
  isMonthlyTargetReached,
  resolveGiftPosition,
  sortGiftsByPosition,
  type CategoryGift,
} from "@/lib/category-gifts";
import { labels, t, pickBilingual } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category, LeaderboardEntry } from "@/lib/types";

interface GiftsSectionProps {
  category: Category;
  monthlyAmount: number;
  contractorId: string;
  leaderboard: LeaderboardEntry[];
}

function CategoryGiftCard({
  gift,
  category,
  gifts,
  rank,
  monthlyAmount,
}: {
  gift: CategoryGift;
  category: Category;
  gifts: CategoryGift[];
  rank: number | null;
  monthlyAmount: number;
}) {
  const { lang } = useLang();
  const position = resolveGiftPosition(gift, gifts);
  const unlocked = isGiftUnlockedForContractor(gift, category, rank, monthlyAmount);
  const isYourSlot = rank !== null && position === rank;
  const targetReached = isMonthlyTargetReached(monthlyAmount, gift, category);
  const pct = Math.min(100, Math.round(getAchievementPercentForGift(monthlyAmount, gift, category)));

  let lockHint = "";
  if (!unlocked) {
    if (rank === null) {
      lockHint = t(lang, labels.giftNeedActivity.en, labels.giftNeedActivity.te);
    } else if (!isYourSlot) {
      lockHint = t(lang, labels.giftWrongRank.en, labels.giftWrongRank.te).replace(
        "{n}",
        String(position)
      );
    } else if (!targetReached) {
      lockHint = t(lang, labels.giftNeedTarget.en, labels.giftNeedTarget.te);
    }
  }

  return (
    <div
      className={`flex gap-4 rounded-2xl p-4 ${
        unlocked
          ? "border-2 border-[#e85d00] bg-orange-50"
          : "border border-gray-200 bg-gray-50"
      } ${unlocked ? "ring-2 ring-[#e85d00] ring-offset-2" : ""}`}
    >
      <div
        className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-white p-2 ${
          unlocked ? "" : "opacity-60 grayscale"
        }`}
      >
        <Image
          src={gift.image_src}
          alt={pickBilingual(lang, gift.name_english, gift.name_telugu)}
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
          {pickBilingual(lang, gift.name_english, gift.name_telugu)}
        </p>
        <p className="text-sm font-bold text-[#e85d00]">
          {formatGiftThreshold(lang, category, gift)}
        </p>
        {(gift.description_english || gift.description_telugu) && (
          <p className="mt-0.5 text-sm text-gray-600">
            {pickBilingual(
              lang,
              gift.description_english ?? "",
              gift.description_telugu ?? gift.description_english ?? ""
            )}
          </p>
        )}

        {!unlocked && isYourSlot && !targetReached && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#e85d00] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-bold text-gray-600">{lockHint}</p>
          </div>
        )}

        {!unlocked && (!isYourSlot || targetReached) && lockHint && (
          <p className="mt-2 text-xs font-bold text-gray-600">{lockHint}</p>
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

/** One gift per leaderboard position — unlocks when that row's target is met at that rank */
export function GiftsSection({
  category,
  monthlyAmount,
  contractorId,
  leaderboard,
}: GiftsSectionProps) {
  const { lang } = useLang();
  const gifts = sortGiftsByPosition(getCategoryGifts(category));
  const rank = getContractorCategoryRank(contractorId, category, leaderboard);
  const yourGift = getGiftForRank(category, rank);
  const unlockedGift = getUnlockedGiftForContractor(category, rank, monthlyAmount);

  if (gifts.length === 0) {
    return null;
  }

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
            {t(lang, labels.giftRankHint.en, labels.giftRankHint.te)}
          </p>
        </div>
      </div>

      {yourGift && rank !== null && !unlockedGift && (
        <p className="mb-4 rounded-xl bg-[#1a2744]/5 px-4 py-3 text-center text-sm font-bold text-[#1a2744]">
          {t(lang, labels.nextRankGift.en, labels.nextRankGift.te)
            .replace("{rank}", String(rank))
            .replace(
              "{name}",
              pickBilingual(lang, yourGift.name_english, yourGift.name_telugu)
            )}
        </p>
      )}

      {unlockedGift && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
          {t(lang, labels.giftUnlockedRank.en, labels.giftUnlockedRank.te).replace(
            "{rank}",
            String(rank)
          )}
        </p>
      )}

      <div className="space-y-3">
        {gifts.map((gift) => (
          <CategoryGiftCard
            key={gift.id}
            gift={gift}
            category={category}
            gifts={gifts}
            rank={rank}
            monthlyAmount={monthlyAmount}
          />
        ))}
      </div>
    </div>
  );
}
