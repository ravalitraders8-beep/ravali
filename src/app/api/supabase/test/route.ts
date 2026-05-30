import { jsonWithCache } from "@/lib/cache-headers";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return jsonWithCache(
      {
        connected: false,
        message: "Supabase keys missing in .env.local",
        steps: [
          "Open supabase.com → your project → Settings → API",
          "Copy Project URL → NEXT_PUBLIC_SUPABASE_URL",
          "Copy anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "Copy service_role key → SUPABASE_SERVICE_ROLE_KEY",
          "Run supabase/migrations/001_schema.sql in SQL Editor",
          "Restart: npm run dev",
        ],
      },
      "public"
    );
  }

  try {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    const supabase = getAdminClient();
    const { count, error } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    if (error) {
      return jsonWithCache(
        {
          connected: false,
          message: error.message,
          hint: "Run supabase/migrations/001_schema.sql in your Supabase SQL Editor",
        },
        "public"
      );
    }

    return jsonWithCache(
      {
        connected: true,
        url: getSupabaseUrl().replace(/https:\/\/([^.]+).*/, "https://$1.supabase.co"),
        categoriesCount: count ?? 0,
        message: count
          ? "Supabase connected successfully!"
          : "Connected but tables empty — run migration SQL",
      },
      "public"
    );
  } catch (e) {
    return jsonWithCache(
      {
        connected: false,
        message: e instanceof Error ? e.message : "Connection failed",
      },
      "public"
    );
  }
}
