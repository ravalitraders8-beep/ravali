import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCurrentMonthYear, getRewardLevelForAmount } from "@/lib/currency";
import { getAdminClient } from "@/lib/supabase/admin";

async function fetchLeaderboardFallback(
  supabase: ReturnType<typeof getAdminClient>,
  monthYear: string
) {
  const { data: contractors } = await supabase
    .from("contractors")
    .select("*, categories(*)")
    .eq("is_active", true);

  const { data: txs } = await supabase
    .from("transactions")
    .select("contractor_id, amount")
    .eq("month_year", monthYear);

  const totals = new Map<string, number>();
  for (const tx of txs ?? []) {
    totals.set(tx.contractor_id, (totals.get(tx.contractor_id) ?? 0) + Number(tx.amount));
  }

  const entries = (contractors ?? []).map((c) => {
    const cat = c.categories;
    const total = totals.get(c.id) ?? 0;
    const target = Number(cat?.monthly_target_amount ?? 0);
    return {
      contractor_id: c.id,
      name_english: c.name_english,
      name_telugu: c.name_telugu,
      category_english: cat?.name_english,
      category_telugu: cat?.name_telugu,
      category_color: cat?.color_hex,
      village_telugu: c.village_telugu,
      total_amount: total,
      target_amount: target,
      achievement_percent: target > 0 ? Math.round((total / target) * 1000) / 10 : 0,
    };
  });

  entries.sort((a, b) => b.total_amount - a.total_amount);
  return entries.map((e, i) => ({ rank: i + 1, ...e }));
}

async function fetchContractorDashboardFromDb(qrToken: string, monthYear: string) {
  const supabase = getAdminClient();

  const { data: contractor, error: cErr } = await supabase
    .from("contractors")
    .select("*, categories(*)")
    .eq("qr_token", qrToken)
    .eq("is_active", true)
    .single();

  if (cErr || !contractor) {
    return { error: "invalid_token" as const };
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
