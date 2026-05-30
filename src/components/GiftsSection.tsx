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
    <div className="user-card bg-white">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-3xl">
          🎁
        </span>
        <h2 className="text-xl font-black text-[#1a2744]">
          {t(lang, labels.gifts.en, labels.gifts.te)}
        </h2>
      </div>

      {rewardLevels.length === 0 ? (
        <p className="py-6 text-center text-base text-gray-500">
          {t(lang, "No gifts yet", "ఇంకా బహుమతులు లేవు")}
        </p>
      ) : (
        <div className="space-y-3">
          {rewardLevels.map((gift) => {
            const unlocked = monthlyAmount >= gift.min_amount;
            const isCurrent = currentLevel?.id === gift.id;
            return (
              <div
                key={gift.id}
                className={`flex items-center gap-4 rounded-2xl p-4 ${
                  unlocked
                    ? "border-2 border-[#e85d00] bg-orange-50"
                    : "border border-gray-200 bg-gray-50 opacity-80"
                } ${isCurrent ? "ring-2 ring-yellow-400 ring-offset-2" : ""}`}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${
                    unlocked ? "bg-white" : "bg-gray-200 grayscale"
                  }`}
                >
                  {unlocked ? gift.icon : "🔒"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black text-[#1a2744]">
                    {lang === "te" ? gift.level_name_telugu : gift.level_name_english}
                  </p>
                  <p className="text-base font-bold text-[#e85d00]">
                    {formatINR(gift.min_amount)}+
                  </p>
                </div>
                {unlocked && (
                  <span className="text-2xl" aria-hidden>
                    ✅
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
