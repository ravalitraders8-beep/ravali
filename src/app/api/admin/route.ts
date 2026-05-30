import { NextRequest, NextResponse } from "next/server";
import { jsonNoStore, jsonWithCache } from "@/lib/cache-headers";
import { getAdminPin, isSupabaseConfigured } from "@/lib/env";
import { getAdminData, getAdminStats } from "@/lib/server/admin-data";
import { friendlySupabaseError, extractErrorCause } from "@/lib/server/supabase-connect";
import { bustServerCache } from "@/lib/server/cache-sync";

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
    const result = await getAdminStats();
    return jsonWithCache(result, "private-short");
  } catch (e) {
    const message = friendlySupabaseError(
      e instanceof Error ? e.message : "Failed to load stats",
      extractErrorCause(e)
    );
    return NextResponse.json({ error: "server_error", message }, { status: 503 });
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

      const villageEn = String(village_english ?? "").trim();
      const villageTe = String(village_telugu ?? "").trim();
      if (!villageEn && !villageTe) {
        return NextResponse.json(
          { message: "Please fill village | గ్రామం నమోదు చేయండి" },
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
          village_english: villageEn || villageTe,
          village_telugu: villageTe || villageEn,
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
      bustServerCache();
      return jsonNoStore(data);
    }

    if (body.action === "update_contractor") {
      const { id, ...updates } = body;
      const { error } = await supabase.from("contractors").update(updates).eq("id", id);
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      bustServerCache();
      return jsonNoStore({ ok: true });
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
      bustServerCache();
      return jsonNoStore(data);
    }

    if (body.action === "update_transaction") {
      const { id, amount, reason_english, reason_telugu, transaction_date, contractor_id } =
        body;
      if (!id) return NextResponse.json({ message: "Transaction id required" }, { status: 400 });

      const dateStr = transaction_date ?? new Date().toISOString().slice(0, 10);
      const [y, m] = dateStr.split("-");
      const month_year = `${y}-${m}`;

      const { error } = await supabase
        .from("transactions")
        .update({
          contractor_id,
          amount,
          reason_english,
          reason_telugu,
          transaction_date: dateStr,
          month_year,
        })
        .eq("id", id);

      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      await supabase.from("admin_logs").insert({
        action: "update_transaction",
        target_contractor_id: contractor_id,
        details: `Updated ₹${amount}`,
      });
      bustServerCache();
      return jsonNoStore({ ok: true });
    }

    if (body.action === "delete_transaction") {
      const { id } = body;
      if (!id) return NextResponse.json({ message: "Transaction id required" }, { status: 400 });

      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      await supabase.from("admin_logs").insert({
        action: "delete_transaction",
        details: `Deleted transaction ${id}`,
      });
      bustServerCache();
      return jsonNoStore({ ok: true });
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
      bustServerCache();
      return jsonNoStore(data);
    }

    if (body.action === "update_target") {
      const { category_id, monthly_target_amount } = body;
      const { error } = await supabase
        .from("categories")
        .update({ monthly_target_amount })
        .eq("id", category_id);
      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      bustServerCache();
      return jsonNoStore({ ok: true });
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
    const data = await getAdminData();
    return jsonWithCache(data, "private-short");
  } catch (e) {
    const message = friendlySupabaseError(
      e instanceof Error ? e.message : "Failed to load admin data",
      extractErrorCause(e)
    );
    return NextResponse.json({ error: "server_error", message }, { status: 503 });
  }
}
