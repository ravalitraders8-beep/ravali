import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentMonthYear } from "@/lib/currency";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const monthYear =
    request.nextUrl.searchParams.get("month") ?? getCurrentMonthYear();
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const supabase = getAdminClient();

  if (categoryId) {
    const { data, error } = await supabase.rpc("get_category_leaderboard", {
      p_month_year: monthYear,
      p_category_id: categoryId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  const { data, error } = await supabase.rpc("get_monthly_leaderboard", {
    p_month_year: monthYear,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
