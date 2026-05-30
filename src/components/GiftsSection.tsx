"use client";

import { formatINR } from "@/lib/currency";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { RewardLevel } from "@/lib/types";

interface GiftsSectionProps {
  rewardLevels: RewardLevel[];
  monthlyAmount: number;
  currentLevel: RewardLevel | null;
}

export function GiftsSection({
  rewardLevels,
  monthlyAmount,
  currentLevel,
}: GiftsSectionProps) {
  const { lang } = useLang();

  return (
    <div className="card-visual bg-white p-5">
      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="text-3xl">🎁</span>
        <h2 className="text-2xl font-black text-gray-900">
          {t(lang, labels.gifts.en, labels.gifts.te)}
        </h2>
      </div>

      {rewardLevels.length === 0 ? (
        <p className="py-8 text-center text-lg text-gray-500">
          {t(lang, "No gifts set up yet", "ఇంకా బహుమతులు లేవు")}
        </p>
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {rewardLevels.map((gift) => {
          const unlocked = monthlyAmount >= gift.min_amount;
          const isCurrent = currentLevel?.id === gift.id;
          return (
            <div
              key={gift.id}
              className={`relative rounded-2xl p-5 text-center ${
                unlocked
                  ? "border-4 border-[#e85d00] bg-orange-50"
                  : "border-2 border-gray-200 bg-gray-100 opacity-70"
              } ${isCurrent ? "ring-4 ring-yellow-400" : ""}`}
            >
              {!unlocked && (
                <span className="absolute right-3 top-3 text-2xl">🔒</span>
              )}
              <span className={`text-5xl ${unlocked ? "" : "grayscale"}`}>
                {gift.icon}
              </span>
              <p className="mt-3 text-lg font-black">
                {lang === "te" ? gift.level_name_telugu : gift.level_name_english}
              </p>
              <p className="mt-1 text-base font-bold text-[#e85d00]">
                {formatINR(gift.min_amount)}+
              </p>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
