import { NextRequest, NextResponse } from "next/server";
import { getAdminPin, isSupabaseConfigured } from "@/lib/env";

function verifyPin(request: NextRequest): boolean {
  const pin = request.headers.get("x-admin-pin")?.trim();
  const expected = getAdminPin();
  return Boolean(expected && pin === expected);
}

function notConfigured() {
  return NextResponse.json(
    {
      error: "supabase_not_configured",
      message: "Supabase is not configured. Add real keys to .env.local and run SQL migrations.",
    },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  if (!verifyPin(request)) {
    return NextResponse.json(
      { error: "unauthorized", message: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) return notConfigured();

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const { getCurrentMonthYear } = await import("@/lib/currency");
    const monthYear = getCurrentMonthYear();
    const supabase = getAdminClient();

    const { data: contractors } = await supabase
      .from("contractors")
      .select("id")
      .eq("is_active", true);

    const { data: monthTx } = await supabase
      .from("transactions")
      .select("amount, contractor_id")
      .eq("month_year", monthYear);

    const { data: leaderboard, error: rpcError } = await supabase.rpc(
      "get_monthly_leaderboard",
      { p_month_year: monthYear }
    );

    if (rpcError) {
      return NextResponse.json(
        {
          error: "rpc_error",
          message: "Leaderboard function missing — run 002_fix_leaderboard_functions.sql",
        },
        { status: 500 }
      );
    }

    const monthTotal = (monthTx ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const top = leaderboard?.[0];
    const targetAchieved = (leaderboard ?? []).filter(
      (e: { achievement_percent: number }) => Number(e.achievement_percent) >= 100
    ).length;

    return NextResponse.json({
      totalActive: contractors?.length ?? 0,
      monthTotalAmount: monthTotal,
      topContractor: top
        ? { name_telugu: top.name_telugu, amount: Number(top.total_amount) }
        : null,
      targetAchievedCount: targetAchieved,
      leaderboard: leaderboard ?? [],
      monthYear,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyPin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) return notConfigured();

  const body = await request.json();

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const { getCurrentMonthYear } = await import("@/lib/currency");
    const supabase = getAdminClient();

    if (body.action === "add_contractor") {
      const { name_english, name_telugu, phone, village_english, village_telugu, category_id } =
        body;

      if (!name_english?.trim() || !name_telugu?.trim() || !phone?.trim()) {
        return NextResponse.json(
          { message: "Please fill name (English + Telugu) and phone | పేరు మరియు ఫోన్ నమోదు చేయండి" },
          { status: 400 }
        );
      }

      const prefixMap: Record<string, string> = {
        Painter: "PAINT",
        Electrician: "ELEC",
        Plumber: "PLMB",
        Mason: "MASN",
        Carpenter: "CARP",
      };
      const { data: cat } = await supabase
        .from("categories")
        .select("name_english")
        .eq("id", category_id)
        .single();
      const prefix = prefixMap[cat?.name_english ?? ""] ?? "CTR";
      const { count } = await supabase
        .from("contractors")
        .select("*", { count: "exact", head: true })
        .ilike("qr_token", `CTR-${prefix}-%`);
      const qr_token = `CTR-${prefix}-${String((count ?? 0) + 1).padStart(3, "0")}`;

      const { data, error } = await supabase
        .from("contractors")
        .insert({
          name_english: name_english.trim(),
          name_telugu: name_telugu.trim(),
          phone: phone.trim(),
          village_english: (village_english || village_telugu || "Nalgonda").trim(),
          village_telugu: (village_telugu || village_english || "నల్గొండ").trim(),
          category_id,
          qr_token,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      await supabase.from("admin_logs").insert({
        action: "add_contractor",
        target_contractor_id: data.id,
        details: `Added ${name_telugu}`,
      });
      return NextResponse.json(data);
    }

    if (body.action === "update_contractor") {
      const { id, ...updates } = body;
      const { error } = await supabase.from("contractors").update(updates).eq("id", id);
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "add_transaction") {
      const monthYear = getCurrentMonthYear();
      const { contractor_id, amount, reason_english, reason_telugu, transaction_date } = body;
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          contractor_id,
          amount,
          reason_english,
          reason_telugu,
          transaction_date: transaction_date ?? new Date().toISOString().slice(0, 10),
          month_year: monthYear,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      await supabase.from("admin_logs").insert({
        action: "add_transaction",
        target_contractor_id: contractor_id,
        details: `${reason_english} ₹${amount}`,
      });
      return NextResponse.json(data);
    }

    if (body.action === "deliver_reward") {
      const { contractor_id, reward_level_id, notes } = body;
      const monthYear = getCurrentMonthYear();
      const { data, error } = await supabase
        .from("rewards_delivered")
        .insert({ contractor_id, reward_level_id, notes, month_year: monthYear })
        .select()
        .single();
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      return NextResponse.json(data);
    }

    if (body.action === "update_target") {
      const { category_id, monthly_target_amount } = body;
      const { error } = await supabase
        .from("categories")
        .update({ monthly_target_amount })
        .eq("id", category_id);
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyPin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) return notConfigured();

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
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

    if (contractors.error) throw new Error(contractors.error.message);

    return NextResponse.json({
      contractors: contractors.data ?? [],
      transactions: transactions.data ?? [],
      rewards: rewards.data ?? [],
      categories: categories.data ?? [],
      rewardLevels: rewardLevels.data ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load admin data" },
      { status: 500 }
    );
  }
}
