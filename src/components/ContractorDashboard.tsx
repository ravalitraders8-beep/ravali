"use client";

import { ShopLogo } from "./ShopLogo";
import { UserPageExtras } from "./UserPageExtras";
import { RankBanner } from "./RankBanner";
import { CategoryAboutCard } from "./CategoryAboutCard";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import { AmountCard } from "./AmountCard";
import { ContactShopButton } from "./ContactShopButton";
import { GiftsSection } from "./GiftsSection";
import type { ContractorDashboardData } from "@/lib/types";

interface ContractorDashboardProps {
  data: ContractorDashboardData;
}

export function ContractorDashboard({ data }: ContractorDashboardProps) {
  const { lang } = useLang();
  const { contractor, category, monthlyAmount, rewardLevel, rewardLevels, leaderboard } =
    data;

  const achievementPercent =
    category.monthly_target_amount > 0
      ? Math.round((monthlyAmount / Number(category.monthly_target_amount)) * 1000) / 10
      : 0;

  return (
    <div className="relative min-h-screen bg-[#fff8f0] pb-28">
      <UserPageExtras helpBottomOffset="bottom-24" category={category} />

      <header className="relative z-10 overflow-hidden bg-gradient-to-br from-[#c44d00] via-[#e85d00] to-[#f5923d] px-4 pb-16 pt-4 text-white">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 h-20 w-20 rounded-full bg-white/5"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-lg items-center justify-center">
          <ShopLogo size="sm" priority />
        </div>

        <div className="relative mx-auto mt-4 max-w-lg">
          <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/15 p-3 shadow-lg backdrop-blur-sm">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-md"
              style={{ color: category.color_hex }}
              aria-hidden
            >
              {category.icon}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-lg font-black leading-snug">
                {t(lang, labels.welcome.en, labels.welcome.te)}, {contractor.name_telugu}! 👋
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: category.color_hex }}
                >
                  {category.icon}{" "}
                  {lang === "te" ? category.name_telugu : category.name_english}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                  <span aria-hidden>📍</span>
                  {contractor.village_telugu}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute -bottom-px left-0 right-0 h-8 bg-[#fff8f0]"
          style={{ borderRadius: "24px 24px 0 0" }}
          aria-hidden
        />
      </header>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 -mt-10">
        <RankBanner
          contractorId={contractor.id}
          category={category}
          monthlyAmount={monthlyAmount}
          leaderboard={leaderboard}
        />
        <AmountCard
          amount={monthlyAmount}
          target={Number(category.monthly_target_amount)}
          achievementPercent={achievementPercent}
        />
        <CategoryAboutCard category={category} />
        <GiftsSection
          rewardLevels={rewardLevels}
          monthlyAmount={monthlyAmount}
          currentLevel={rewardLevel}
        />
      </main>

      <ContactShopButton />
    </div>
  );
}
