"use client";

import { ShopLogo } from "./ShopLogo";
import { UserPageExtras, MobileHeaderLangToggle } from "./UserPageExtras";
import { DashboardSummary } from "./DashboardSummary";
import { labels, t, teluguLabel } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import { ContactShopButton } from "./ContactShopButton";
import { UserLeaderboard } from "./UserLeaderboard";
import { GiftsSection } from "./GiftsSection";
import type { ContractorDashboardData } from "@/lib/types";

interface ContractorDashboardProps {
  data: ContractorDashboardData;
}

export function ContractorDashboard({ data }: ContractorDashboardProps) {
  const { lang } = useLang();
  const { contractor, category, monthlyAmount, leaderboard } = data;

  const achievementPercent =
    category.monthly_target_amount > 0
      ? Math.round((monthlyAmount / Number(category.monthly_target_amount)) * 1000) / 10
      : 0;

  return (
    <div className="relative min-h-screen bg-[#f4f6f9] pb-36">
      <UserPageExtras helpBottomOffset="bottom-[7.5rem]" category={category} />

      {/* Simple top — name + trade only */}
      <header className="relative z-10 bg-[#1a2744] px-4 pb-8 pt-3 text-white">
        <MobileHeaderLangToggle />
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <ShopLogo
            size="sm"
            priority
            onDark
            href="/"
          />
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl"
            aria-hidden
          >
            {category.icon}
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-lg text-center">
          <p className="text-sm font-semibold opacity-80">
            {t(lang, labels.welcome.en, labels.welcome.te)} 👋
          </p>
          <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">
            {teluguLabel(contractor.name_telugu)}
          </h1>
          <p className="mt-1 text-base font-semibold opacity-90">
            📍 {teluguLabel(contractor.village_telugu)}
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-4 pt-4">
        <DashboardSummary
          contractorId={contractor.id}
          category={category}
          monthlyAmount={monthlyAmount}
          target={Number(category.monthly_target_amount)}
          achievementPercent={achievementPercent}
          leaderboard={leaderboard}
        />

        <UserLeaderboard
          entries={leaderboard}
          category={category}
          currentContractorId={contractor.id}
        />

        <GiftsSection category={category} monthlyAmount={monthlyAmount} />
      </main>

      <ContactShopButton />
    </div>
  );
}
