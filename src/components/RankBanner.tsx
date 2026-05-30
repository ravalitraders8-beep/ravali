"use client";

import { getContractorCategoryRank } from "@/lib/category-about";
import { t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category, LeaderboardEntry } from "@/lib/types";

interface RankBannerProps {
  contractorId: string;
  category: Category;
  monthlyAmount: number;
  leaderboard: LeaderboardEntry[];
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
}

export function RankBanner({
  contractorId,
  category,
  monthlyAmount,
  leaderboard,
}: RankBannerProps) {
  const { lang } = useLang();
  const rank = getContractorCategoryRank(contractorId, category, leaderboard);
  const notStarted = monthlyAmount <= 0 || rank === null;

  if (notStarted) {
    return (
      <div
        className="card-visual overflow-hidden border-4 border-dashed border-[#e85d00]/40 bg-gradient-to-br from-orange-50 to-white p-6 text-center"
        style={{ borderColor: `${category.color_hex}66` }}
      >
        <span className="text-6xl" aria-hidden>
          🌱
        </span>
        <p className="mt-3 text-2xl font-black leading-snug text-[#1a2744] sm:text-3xl">
          {t(
            lang,
            "Your journey hasn't started yet!",
            "మీ ప్రయాణం ఇంకా ప్రారంభం కాలేదు!"
          )}
        </p>
        <p className="mt-3 text-xl font-bold leading-relaxed text-[#e85d00]">
          {t(
            lang,
            "Buy from RAVALI TRADERS — start today! 💪",
            "రవళి ట్రేడర్స్ నుండి కొనండి — ఈ రోజే మొదలు పెట్టండి! 💪"
          )}
        </p>
        <p className="mt-2 text-lg font-semibold text-gray-600">
          {t(
            lang,
            "Every purchase adds to your rank & gifts 🎁",
            "ప్రతి కొనుగోలు మీ rank & బహుమతికి చేరుతుంది 🎁"
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className="card-visual overflow-hidden p-0 text-center text-white shadow-lg"
      style={{ backgroundColor: category.color_hex }}
    >
      <div className="px-5 py-6">
        <p className="text-lg font-bold opacity-90">
          {t(lang, "Your Rank This Month", "ఈ నెల మీ rank")}
        </p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-6xl sm:text-7xl" aria-hidden>
            {rankEmoji(rank)}
          </span>
          <span className="text-7xl font-black leading-none sm:text-8xl">#{rank}</span>
        </div>
        <p className="mt-3 text-xl font-black">
          {category.icon}{" "}
          {lang === "te" ? category.name_telugu : category.name_english}
        </p>
        {rank === 1 ? (
          <p className="mt-2 text-lg font-bold">
            {t(lang, "You are #1! Keep it up! 🎉", "మీరు #1! అలాగే కొనసాగండి! 🎉")}
          </p>
        ) : rank <= 3 ? (
          <p className="mt-2 text-lg font-bold">
            {t(lang, "Almost at the top! Go go go! 🔥", "టాప్ దగ్గర! ముందుకు! 🔥")}
          </p>
        ) : (
          <p className="mt-2 text-lg font-bold">
            {t(
              lang,
              "Keep buying — rank will go up! ⬆️",
              "కొనుగోలు చేస్తూ ఉండండి — rank పెరుగుతుంది! ⬆️"
            )}
          </p>
        )}
      </div>
    </div>
  );
}
