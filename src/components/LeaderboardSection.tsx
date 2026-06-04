"use client";

import { useState } from "react";
import { formatINR } from "@/lib/currency";
import { labels, t, pickBilingual } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category, LeaderboardEntry } from "@/lib/types";

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  categories: Category[];
  currentContractorId?: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-4xl">👑</span>;
  if (rank === 2) return <span className="text-4xl">🥈</span>;
  if (rank === 3) return <span className="text-4xl">🥉</span>;
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl font-black">
      {rank}
    </span>
  );
}

export function LeaderboardSection({
  entries,
  categories,
  currentContractorId,
}: LeaderboardSectionProps) {
  const { lang } = useLang();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? entries.filter((e) => {
        const cat = categories.find((c) => c.id === filter);
        return cat && e.category_telugu === cat.name_telugu;
      })
    : entries;

  const top10 = filtered.slice(0, 10);

  return (
    <div className="card-visual bg-white p-5">
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="text-3xl">🏆</span>
        <h2 className="text-2xl font-black text-gray-900">
          {t(lang, labels.leaderboard.en, labels.leaderboard.te)}
        </h2>
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`flex min-h-[56px] min-w-[56px] items-center justify-center rounded-2xl px-4 text-lg font-bold ${
            !filter ? "bg-[#e85d00] text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          🏠
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            aria-label={cat.name_telugu}
            className={`flex min-h-[56px] min-w-[56px] items-center justify-center rounded-2xl px-4 text-2xl ${
              filter === cat.id ? "border-4" : "bg-gray-100 border-4 border-transparent"
            }`}
            style={
              filter === cat.id
                ? { backgroundColor: cat.color_hex, borderColor: cat.color_hex }
                : undefined
            }
          >
            {cat.icon}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {top10.length === 0 ? (
          <p className="py-8 text-center text-xl text-gray-500">
            {t(lang, "No one yet", "ఇంకా ఎవరు లేరు")}
          </p>
        ) : (
          top10.map((entry) => {
            const isCurrent = entry.contractor_id === currentContractorId;
            return (
              <div
                key={entry.contractor_id}
                className={`flex min-h-[72px] items-center gap-3 rounded-2xl px-4 py-3 ${
                  isCurrent
                    ? "border-4 border-yellow-400 bg-yellow-50"
                    : "border-2 border-gray-100 bg-gray-50"
                }`}
              >
                <RankBadge rank={Number(entry.rank)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-black">
                    {pickBilingual(lang, entry.name_english, entry.name_telugu)}
                  </p>
                  {isCurrent && (
                    <span className="mt-1 inline-block rounded-full bg-yellow-400 px-3 py-0.5 text-sm font-bold">
                      ⭐ {t(lang, labels.you.en, labels.you.te)}
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black text-[#e85d00]">
                  {formatINR(Number(entry.total_amount))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
