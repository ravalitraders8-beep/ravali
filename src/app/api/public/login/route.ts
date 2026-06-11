import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { normalizePhoneInput } from "@/lib/phone-utils";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "supabase_not_configured", message: "Database not connected" },
      { status: 503 }
    );
  }

  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "Invalid request" }, { status: 400 });
  }

  const phone = normalizePhoneInput(String(body.phone ?? ""));
  if (!phone) {
    return NextResponse.json(
      {
        error: "invalid_phone",
        message: "Enter a valid 10-digit mobile number. | సరైన 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి.",
      },
      { status: 400 }
    );
  }

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("contractors")
      .select("qr_token, is_active, name_telugu")
      .eq("phone", phone)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        {
          error: "not_member",
          message:
            "You are not a member of this company. | మీరు ఈ కంపెనీ సభ్యులు కాదు. షాప్‌కు సంప్రదించండి.",
        },
        { status: 404 }
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        {
          error: "inactive",
          message:
            "Your account is inactive. Contact the shop. | మీ ఖాతా నిలిపివేయబడింది. షాప్‌కు అడగండి.",
        },
        { status: 403 }
      );
    }

    const { data: updated } = await supabase
      .from("contractors")
      .update({ first_login_at: new Date().toISOString() })
      .eq("phone", phone)
      .is("first_login_at", null)
      .select("id");

    if (updated && updated.length > 0) {
      const { bustServerCache } = await import("@/lib/server/cache-sync");
      bustServerCache();
    }

    return NextResponse.json({
      token: data.qr_token,
      name: data.name_telugu,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Login failed" },
      { status: 500 }
    );
  }
}
