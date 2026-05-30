import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ready: false,
        error: "supabase_not_configured",
        message: "Database not connected. Shop owner must configure Supabase.",
      },
      { status: 503 }
    );
  }

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_telugu, icon, color_hex")
      .order("name_english");

    if (error) throw new Error(error.message);

    return NextResponse.json({ ready: true, categories: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load", ready: false },
      { status: 500 }
    );
  }
}
