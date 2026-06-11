"use client";

import { GiftImage } from "./GiftImage";
import { getContractorCategoryRank } from "@/lib/category-about";
import { formatTargetValueBilingual, isBagsCategory } from "@/lib/category-period";
import {
  bagsRemainingForGift,
  formatGiftThreshold,
  getAchievementPercentForGift,
  getCategoryGifts,
  getGiftForRank,
  getHighestReachedGift,
  getUnlockedGiftForContractor,
  isGiftSupersededByHigher,
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
  const superseded = isGiftSupersededByHigher(gift, category, monthlyAmount);
  const isYourRankGift = rank !== null && position === rank;
  const pct = Math.min(100, Math.round(getAchievementPercentForGift(monthlyAmount, gift, category)));
  const remaining = bagsRemainingForGift(monthlyAmount, gift, category);
  const bags = isBagsCategory(category);
  const showProgress =
    !unlocked && !superseded && monthlyAmount > 0 && !isMonthlyTargetReached(monthlyAmount, gift, category);

  let lockHint = "";
  if (!unlocked) {
    if (superseded) {
      lockHint = t(lang, labels.giftSuperseded.en, labels.giftSuperseded.te);
    } else if (monthlyAmount <= 0) {
      lockHint = t(lang, labels.giftNeedActivity.en, labels.giftNeedActivity.te);
    } else if (remaining > 0) {
      const needLabel = bags
        ? t(lang, labels.bagsToGo.en, labels.bagsToGo.te).replace("{n}", String(remaining))
        : t(lang, labels.amountToGo.en, labels.amountToGo.te).replace(
            "{n}",
            formatTargetValueBilingual(lang, category, remaining)
          );
      lockHint = `${t(lang, labels.giftNeedTarget.en, labels.giftNeedTarget.te)} — ${needLabel}`;
    }
  }

  return (
    <div
      className={`flex gap-4 rounded-2xl p-4 ${
        unlocked
          ? "border-2 border-[#e85d00] bg-orange-50"
          : isYourRankGift
            ? "border-2 border-[#1a2744]/20 bg-white"
            : "border border-gray-200 bg-gray-50"
      } ${unlocked ? "ring-2 ring-[#e85d00] ring-offset-2" : ""}`}
    >
      <div
        className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-white ${
          unlocked ? "" : "opacity-60 grayscale"
        }`}
      >
        <GiftImage
          src={gift.image_src}
          alt={pickBilingual(lang, gift.name_english, gift.name_telugu)}
          width={72}
          height={72}
          className="h-full w-full object-cover"
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
          {isYourRankGift && (
            <span className="ml-2 text-xs font-bold text-[#e85d00]">
              {t(lang, "Your rank", "మీ స్థానం")}
            </span>
          )}
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

        {showProgress && (
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

        {!unlocked && !showProgress && lockHint && (
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

/** Gifts unlock by amount — passing a higher target opens lower tiers too */
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
  const highestReached = getHighestReachedGift(category, monthlyAmount);
  const rankGiftUnlocked =
    yourGift &&
    highestReached &&
    yourGift.id === highestReached.id;

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

      {yourGift && rank !== null && !rankGiftUnlocked && (
        <p className="mb-4 rounded-xl bg-[#1a2744]/5 px-4 py-3 text-center text-sm font-bold text-[#1a2744]">
          {t(lang, labels.nextRankGift.en, labels.nextRankGift.te)
            .replace("{rank}", String(rank))
            .replace(
              "{name}",
              pickBilingual(lang, yourGift.name_english, yourGift.name_telugu)
            )}
          {bagsRemainingForGift(monthlyAmount, yourGift, category) > 0 && (
            <span className="mt-1 block text-[#e85d00]">
              {isBagsCategory(category)
                ? t(lang, labels.bagsToGo.en, labels.bagsToGo.te).replace(
                    "{n}",
                    String(bagsRemainingForGift(monthlyAmount, yourGift, category))
                  )
                : formatTargetValueBilingual(
                    lang,
                    category,
                    bagsRemainingForGift(monthlyAmount, yourGift, category)
                  )}
            </span>
          )}
        </p>
      )}

      {highestReached && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-800">
          {rankGiftUnlocked
            ? t(lang, labels.giftUnlockedRank.en, labels.giftUnlockedRank.te).replace(
                "{rank}",
                String(rank)
              )
            : t(lang, "Your current gift:", "మీ ప్రస్తుత బహుమతి:")}{" "}
          {pickBilingual(
            lang,
            highestReached.name_english,
            highestReached.name_telugu
          )}{" "}
          ✅
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
