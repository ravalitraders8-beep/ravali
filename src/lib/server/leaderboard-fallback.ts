import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlySupabaseError, isSupabaseConnectionError } from "@/lib/server/supabase-connect";

export { friendlySupabaseError, isSupabaseConnectionError };

/** Compute leaderboard in JS when RPC is missing or fails */
export async function fetchLeaderboardFallback(
  supabase: SupabaseClient,
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
    const cat = c.categories as {
      name_english?: string;
      name_telugu?: string;
      color_hex?: string;
      monthly_target_amount?: number;
    } | null;
    const total = totals.get(c.id) ?? 0;
    const target = Number(cat?.monthly_target_amount ?? 0);
    return {
      contractor_id: c.id,
      name_english: c.name_english,
      name_telugu: c.name_telugu,
      category_english: cat?.name_english ?? "",
      category_telugu: cat?.name_telugu ?? "",
      category_color: cat?.color_hex ?? "",
      village_telugu: c.village_telugu,
      total_amount: total,
      target_amount: target,
      achievement_percent: target > 0 ? Math.round((total / target) * 1000) / 10 : 0,
    };
  });

  entries.sort((a, b) => b.total_amount - a.total_amount);
  return entries.map((e, i) => ({ rank: i + 1, ...e }));
}
