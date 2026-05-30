import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCurrentMonthYear } from "@/lib/currency";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  fetchLeaderboardFallback,
  friendlySupabaseError,
} from "@/lib/server/leaderboard-fallback";

async function fetchAdminStatsFromDb(monthYear: string) {
  const supabase = getAdminClient();

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id")
    .eq("is_active", true);

  const { data: monthTx } = await supabase
    .from("transactions")
    .select("amount, contractor_id")
    .eq("month_year", monthYear);

  let leaderboard: Awaited<ReturnType<typeof fetchLeaderboardFallback>> = [];
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_monthly_leaderboard", {
    p_month_year: monthYear,
  });

  if (rpcError) {
    leaderboard = await fetchLeaderboardFallback(supabase, monthYear);
  } else {
    leaderboard = rpcData ?? [];
  }

  const monthTotal = (monthTx ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const ranked = leaderboard.filter((e) => Number(e.total_amount) > 0);
  const top = ranked[0];
  const targetAchieved = leaderboard.filter(
    (e) => Number(e.achievement_percent) >= 100
  ).length;

  return {
    totalActive: contractors?.length ?? 0,
    monthTotalAmount: monthTotal,
    topContractor: top
      ? { name_telugu: top.name_telugu, amount: Number(top.total_amount) }
      : null,
    targetAchievedCount: targetAchieved,
    leaderboard,
    monthYear,
  };
}

async function fetchAdminDataFromDb() {
  const supabase = getAdminClient();
  const [contractors, transactions, rewards, categories, rewardLevels] = await Promise.all([
    supabase.from("contractors").select("*, categories(*)").order("name_telugu"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("rewards_delivered")
      .select("*, contractors(name_telugu), reward_levels(level_name_telugu, icon)")
      .order("delivered_date", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("reward_levels").select("*").order("min_amount"),
  ]);

  if (contractors.error) throw new Error(friendlySupabaseError(contractors.error.message));

  return {
    contractors: contractors.data ?? [],
    transactions: transactions.data ?? [],
    rewards: rewards.data ?? [],
    categories: categories.data ?? [],
    rewardLevels: rewardLevels.data ?? [],
  };
}

export function getAdminStats() {
  const monthYear = getCurrentMonthYear();
  return unstable_cache(
    () => fetchAdminStatsFromDb(monthYear),
    ["admin-stats", monthYear],
    { revalidate: 15, tags: [CACHE_TAGS.ADMIN] }
  )();
}

export function getAdminData() {
  return unstable_cache(
    () => fetchAdminDataFromDb(),
    ["admin-data"],
    { revalidate: 15, tags: [CACHE_TAGS.ADMIN] }
  )();
}
