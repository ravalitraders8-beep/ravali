import { NextResponse } from "next/server";
import { jsonWithCache } from "@/lib/cache-headers";
import { isSupabaseConfigured } from "@/lib/env";
import { getContractorDashboardData } from "@/lib/server/contractor-dashboard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const qrToken = decodeURIComponent(token).trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "supabase_not_configured", message: "Database not connected" },
      { status: 503 }
    );
  }

  try {
    const result = await getContractorDashboardData(qrToken);

    if ("error" in result && result.error === "invalid_token") {
      return NextResponse.json(
        { error: "invalid_token", message: "Member not found" },
        { status: 404 }
      );
    }

    if ("error" in result && result.error === "no_category") {
      return NextResponse.json(
        { error: "no_category", message: "Contractor has no category assigned" },
        { status: 422 }
      );
    }

    return jsonWithCache(result, "private-short");
  } catch (e) {
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 }
    );
  }
}
