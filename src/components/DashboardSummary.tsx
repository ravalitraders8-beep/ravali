"use client";

import { useEffect, useState } from "react";
import { getContractorCategoryRank } from "@/lib/category-about";
import {
  formatTargetValueBilingual,
  formatQuantityAdded,
  isBagsCategory,
} from "@/lib/category-period";
import { getProgressStatus } from "@/lib/currency";
import { labels, progressMessage, t } from "@/lib/i18n";
import { userMotivation } from "@/lib/motivation";
import { useLang } from "@/context/LangContext";
import type { Category, LeaderboardEntry } from "@/lib/types";

interface DashboardSummaryProps {
  contractorId: string;
  category: Category;
  monthlyAmount: number;
  target: number;
  achievementPercent: number;
  leaderboard: LeaderboardEntry[];
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
}

/** One simple card — rank + progress (bags for mason, ₹ for others) */
export function DashboardSummary({
  contractorId,
  category,
  monthlyAmount,
  target,
  achievementPercent,
  leaderboard,
}: DashboardSummaryProps) {
  const { lang } = useLang();
  const [display, setDisplay] = useState(0);
  const rank = getContractorCategoryRank(contractorId, category, leaderboard);
  const notStarted = monthlyAmount <= 0 || rank === null;
  const pct = Math.min(100, achievementPercent);
  const status = getProgressStatus(achievementPercent);
  const bags = isBagsCategory(category);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(monthlyAmount * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [monthlyAmount]);

  return (
    <div className="user-card overflow-hidden bg-white">
      <div
        className="flex items-center gap-4 rounded-2xl p-4"
        style={{ backgroundColor: `${category.color_hex}18` }}
      >
        <span className="text-5xl leading-none" aria-hidden>
          {notStarted ? "🌱" : rankEmoji(rank!)}
        </span>
        <div className="min-w-0 flex-1">
          {notStarted ? (
            <>
              <p className="text-xl font-black text-[#1a2744]">
                {t(lang, "Start your journey!", "మొదలు పెట్టండి!")}
              </p>
              <p className="mt-0.5 text-base font-semibold text-gray-600">
                {t(lang, userMotivation.journey.en, userMotivation.journey.te)}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {t(lang, "Your rank", "మీ rank")}
              </p>
              <p className="text-4xl font-black leading-none text-[#1a2744]">#{rank}</p>
              <p className="mt-1 text-base font-bold" style={{ color: category.color_hex }}>
                {category.icon}{" "}
                {lang === "te" ? category.name_telugu : category.name_english}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-base font-bold text-gray-500">
          {bags
            ? t(lang, labels.thisMonthBags.en, labels.thisMonthBags.te)
            : t(lang, labels.thisMonthAmount.en, labels.thisMonthAmount.te)}{" "}
          {bags ? "🧱" : "💰"}
        </p>
        <p className="mt-1 text-5xl font-black tracking-tight text-[#e85d00] sm:text-6xl">
          {formatQuantityAdded(lang, category, display).replace("+", "")}
        </p>
      </div>

      <div className="mt-5">
        <div className="h-5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: status.color }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-base font-bold text-gray-700">
          <span>
            🎯 {t(lang, labels.monthlyTarget.en, labels.monthlyTarget.te)}{" "}
            {formatTargetValueBilingual(lang, category, target)}
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <p className="mt-3 text-center text-lg font-bold text-[#1a2744]">
          {progressMessage(lang, achievementPercent)}
        </p>
      </div>
    </div>
  );
}
