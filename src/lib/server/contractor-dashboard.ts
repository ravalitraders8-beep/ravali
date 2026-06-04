import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCurrentMonthYear, getRewardLevelForAmount } from "@/lib/currency";
import { fetchLeaderboardFallback } from "@/lib/server/leaderboard-fallback";
import { getAdminClient } from "@/lib/supabase/admin";

async function fetchContractorDashboardFromDb(qrToken: string, monthYear: string) {
  const supabase = getAdminClient();

  const { data: contractor, error: cErr } = await supabase
    .from("contractors")
    .select("*, categories(*)")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (cErr || !contractor) {
    return { error: "invalid_token" as const };
  }

  if (!contractor.is_active) {
    return { error: "inactive" as const };
  }

  const category = contractor.categories;
  if (!category) {
    return { error: "no_category" as const };
  }
  delete contractor.categories;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("contractor_id", contractor.id)
    .eq("month_year", monthYear)
    .order("transaction_date", { ascending: false });

  const { data: rewardLevels } = await supabase
    .from("reward_levels")
    .select("*")
    .order("min_amount", { ascending: true });

  let leaderboardRaw = null;
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_monthly_leaderboard", {
    p_month_year: monthYear,
  });
  if (rpcError) {
    leaderboardRaw = await fetchLeaderboardFallback(supabase, monthYear);
  } else {
    leaderboardRaw = rpcData;
  }

  const { data: allCategories } = await supabase.from("categories").select("*");

  const monthlyAmount = (transactions ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const rewardLevel =
    rewardLevels && rewardLevels.length > 0
      ? getRewardLevelForAmount(monthlyAmount, rewardLevels)
      : null;

  return {
    contractor,
    category,
    monthlyAmount,
    rewardLevel,
    transactions: transactions ?? [],
    rewardLevels: rewardLevels ?? [],
    leaderboard: leaderboardRaw ?? [],
    allCategories: allCategories ?? [],
  };
}

export function getContractorDashboardData(qrToken: string) {
  const monthYear = getCurrentMonthYear();
  return unstable_cache(
    () => fetchContractorDashboardFromDb(qrToken, monthYear),
    ["contractor-dashboard", qrToken, monthYear],
    { revalidate: 15, tags: [CACHE_TAGS.CONTRACTOR, CACHE_TAGS.ADMIN] }
  )();
}
