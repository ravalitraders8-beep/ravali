"use client";

import { useLang } from "@/context/LangContext";
import type { RewardLevel } from "@/lib/types";

interface RewardLevelBadgeProps {
  level: RewardLevel;
}

export function RewardLevelBadge({ level }: RewardLevelBadgeProps) {
  const { lang } = useLang();

  return (
    <div
      className="card-visual flex items-center gap-4 p-5"
      style={{ borderColor: level.color_hex, backgroundColor: `${level.color_hex}18`, borderWidth: 4 }}
    >
      <span className="text-6xl">{level.icon}</span>
      <div>
        <p className="text-2xl font-black text-gray-900">
          {lang === "te" ? level.level_name_telugu : level.level_name_english}
        </p>
        <p className="mt-1 text-lg font-bold text-[#e85d00]">
          {lang === "te" ? level.reward_description_telugu : level.reward_description_english}
        </p>
      </div>
    </div>
  );
}
