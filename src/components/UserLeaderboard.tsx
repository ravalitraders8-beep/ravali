"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/currency";
import { labels, t, pickBilingual } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category, LeaderboardEntry } from "@/lib/types";

interface UserLeaderboardProps {
  entries: LeaderboardEntry[];
  category: Category;
  currentContractorId: string;
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

/** Winners list for the contractor's trade only — simple rows */
export function UserLeaderboard({
  entries,
  category,
  currentContractorId,
}: UserLeaderboardProps) {
  const { lang } = useLang();

  const ranked = useMemo(() => {
    return entries
      .filter(
        (e) =>
          e.category_telugu === category.name_telugu && Number(e.total_amount) > 0
      )
      .sort((a, b) => Number(b.total_amount) - Number(a.total_amount))
      .slice(0, 10)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, category.name_telugu]);

  return (
    <div className="user-card bg-white">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-3xl">
          🏆
        </span>
        <div>
          <h2 className="text-xl font-black text-[#1a2744]">
            {t(lang, labels.leaderboard.en, labels.leaderboard.te)}
          </h2>
          <p className="text-sm font-bold text-gray-500">
            {category.icon}{" "}
            {pickBilingual(lang, category.name_english, category.name_telugu)}
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="py-6 text-center text-base font-semibold text-gray-500">
          {t(lang, "No winners yet this month", "ఈ నెల ఇంకా ఎవరు లేరు")}
        </p>
      ) : (
        <ul className="space-y-2">
          {ranked.map((entry) => {
            const isYou = entry.contractor_id === currentContractorId;
            return (
              <li
                key={entry.contractor_id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                  isYou
                    ? "border-2 border-yellow-400 bg-yellow-50"
                    : "border border-gray-100 bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                    entry.rank <= 3 ? "text-2xl" : "bg-gray-200 text-[#1a2744]"
                  }`}
                >
                  {rankEmoji(entry.rank)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black text-[#1a2744]">
                    {pickBilingual(lang, entry.name_english, entry.name_telugu)}
                  </p>
                  {isYou && (
                    <span className="text-sm font-bold text-yellow-700">
                      ⭐ {t(lang, labels.you.en, labels.you.te)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-lg font-black text-[#e85d00]">
                  {formatINR(Number(entry.total_amount))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
