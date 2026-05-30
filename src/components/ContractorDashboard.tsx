"use client";

import { SHOP_NAME } from "@/lib/constants";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import { AmountCard } from "./AmountCard";
import { ContactShopButton } from "./ContactShopButton";
import { GiftsSection } from "./GiftsSection";
import { LeaderboardSection } from "./LeaderboardSection";
import { RewardLevelBadge } from "./RewardLevelBadge";
import { TransactionHistory } from "./TransactionHistory";
import type { ContractorDashboardData } from "@/lib/types";

interface ContractorDashboardProps {
  data: ContractorDashboardData;
}

export function ContractorDashboard({ data }: ContractorDashboardProps) {
  const { lang } = useLang();
  const { contractor, category, monthlyAmount, rewardLevel, transactions, rewardLevels, leaderboard, allCategories } =
    data;

  const achievementPercent =
    category.monthly_target_amount > 0
      ? Math.round((monthlyAmount / Number(category.monthly_target_amount)) * 1000) / 10
      : 0;

  return (
    <div className="min-h-screen bg-[#fff8f0] pb-28">
      {/* Top bar — compact shop branding */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#c44d00] via-[#e85d00] to-[#f5923d] px-4 pb-16 pt-4 text-white">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 h-20 w-20 rounded-full bg-white/5"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-lg items-center justify-center gap-2">
          <span className="text-xl" aria-hidden>
            🏗️
          </span>
          <p className="text-sm font-bold uppercase tracking-widest opacity-95">{SHOP_NAME}</p>
        </div>

        {/* Profile card — name, trade, village in one row */}
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

        {/* Smooth curve into page body */}
        <div
          className="absolute -bottom-px left-0 right-0 h-8 bg-[#fff8f0]"
          style={{ borderRadius: "24px 24px 0 0" }}
          aria-hidden
        />
      </header>

      <main className="relative mx-auto max-w-lg space-y-4 px-4 -mt-10">
        <AmountCard
          amount={monthlyAmount}
          target={Number(category.monthly_target_amount)}
          achievementPercent={achievementPercent}
        />
        {rewardLevel && <RewardLevelBadge level={rewardLevel} />}
        <LeaderboardSection
          entries={leaderboard}
          categories={allCategories}
          currentContractorId={contractor.id}
        />
        <TransactionHistory transactions={transactions} />
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
