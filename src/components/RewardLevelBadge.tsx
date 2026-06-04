"use client";

import { useLang } from "@/context/LangContext";
import { pickBilingual } from "@/lib/i18n";
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
          {pickBilingual(lang, level.level_name_english, level.level_name_telugu)}
        </p>
        <p className="mt-1 text-lg font-bold text-[#e85d00]">
          {pickBilingual(lang, level.reward_description_english, level.reward_description_telugu)}
        </p>
      </div>
    </div>
  );
}
