import { jsonWithCache } from "@/lib/cache-headers";
import { getAdminPin, getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  const hasPin = Boolean(getAdminPin());
  const hasSupabase = isSupabaseConfigured();

  return jsonWithCache(
    {
      ready: hasPin && hasSupabase,
      hasPin,
      hasSupabase,
      hasUrl: Boolean(getSupabaseUrl()),
      hasAnonKey: Boolean(getSupabaseAnonKey()),
      message: !hasPin
        ? "Admin PIN missing — add ADMIN_PIN to .env.local"
        : !hasSupabase
          ? "Supabase not configured — add real keys to .env.local and run SQL migrations"
          : "All set — live database connected",
    },
    "public"
  );
}
