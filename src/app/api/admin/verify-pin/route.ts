import { NextRequest, NextResponse } from "next/server";
import { getAdminPin } from "@/lib/env";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pin = String(body.pin ?? "").trim();
  const adminPin = getAdminPin();

  if (!adminPin) {
    return NextResponse.json(
      { error: "not_configured", message: "Admin PIN not set. Add ADMIN_PIN to .env.local and restart the server." },
      { status: 503 }
    );
  }

  if (pin !== adminPin) {
    return NextResponse.json(
      { error: "invalid_pin", message: "Wrong PIN. Please try again." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
