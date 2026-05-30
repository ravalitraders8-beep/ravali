import { jsonWithCache } from "@/lib/cache-headers";
import { getSupabaseProjectRef, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";
import { pingSupabaseRest } from "@/lib/server/supabase-connect";

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

  const ping = await pingSupabaseRest();
  const projectRef = getSupabaseProjectRef();

  if (!ping.ok) {
    return jsonWithCache(
      {
        connected: false,
        projectRef,
        message: ping.message,
        hint: "Vercel → Settings → Environment Variables — paste exact values from Supabase → Settings → API, then redeploy.",
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
          projectRef,
          message: error.message,
          hint: "Run supabase/migrations/001_schema.sql in your Supabase SQL Editor",
        },
        "public"
      );
    }

    return jsonWithCache(
      {
        connected: true,
        projectRef,
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
        projectRef,
        message: e instanceof Error ? e.message : "Connection failed",
      },
      "public"
    );
  }
}
