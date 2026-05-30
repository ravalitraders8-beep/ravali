import { jsonWithCache } from "@/lib/cache-headers";
import {
  getAdminPin,
  getSupabaseAnonKey,
  getSupabaseProjectRef,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
import { pingSupabaseRest } from "@/lib/server/supabase-connect";

export async function GET() {
  const hasPin = Boolean(getAdminPin());
  const hasSupabase = isSupabaseConfigured();
  const projectRef = getSupabaseProjectRef();
  let connected = false;
  let connectionMessage = "";

  if (hasSupabase) {
    const ping = await pingSupabaseRest();
    connected = ping.ok;
    connectionMessage = ping.message;
  }

  const ready = hasPin && hasSupabase && connected;

  return jsonWithCache(
    {
      ready,
      hasPin,
      hasSupabase,
      connected,
      projectRef,
      hasUrl: Boolean(getSupabaseUrl()),
      hasAnonKey: Boolean(getSupabaseAnonKey()),
      message: !hasPin
        ? "Admin PIN missing — add ADMIN_PIN to Vercel env"
        : !hasSupabase
          ? "Supabase keys missing — add to Vercel env"
          : !connected
            ? connectionMessage
            : "Ready",
    },
    "public"
  );
}
