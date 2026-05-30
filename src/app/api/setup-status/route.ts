import { jsonWithCache } from "@/lib/cache-headers";
import { getAdminPin, getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";
import { friendlySupabaseError } from "@/lib/server/leaderboard-fallback";

export async function GET() {
  const hasPin = Boolean(getAdminPin());
  const hasSupabase = isSupabaseConfigured();
  let connected = false;
  let connectionMessage = "";

  if (hasSupabase) {
    try {
      const { getAdminClient } = await import("@/lib/supabase/admin");
      const supabase = getAdminClient();
      const { error } = await supabase
        .from("categories")
        .select("id", { count: "exact", head: true });
      connected = !error;
      connectionMessage = error ? friendlySupabaseError(error.message) : "Connected";
    } catch (e) {
      connectionMessage = friendlySupabaseError(
        e instanceof Error ? e.message : "Connection failed"
      );
    }
  }

  const ready = hasPin && hasSupabase && connected;

  return jsonWithCache(
    {
      ready,
      hasPin,
      hasSupabase,
      connected,
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
