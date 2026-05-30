import { getSupabaseProjectRef, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export function extractErrorCause(err: unknown): string {
  if (!(err instanceof Error)) return "";
  const cause = err.cause;
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "object" && cause && "code" in cause) {
    return String((cause as { code?: string }).code ?? "");
  }
  return "";
}

export function isSupabaseConnectionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("timeout") ||
    lower.includes("abort")
  );
}

export function friendlySupabaseError(message: string, cause = ""): string {
  const ref = getSupabaseProjectRef();
  const refHint = ref ? ` (project: ${ref})` : "";
  const combined = `${message} ${cause}`.toLowerCase();

  if (combined.includes("enotfound")) {
    return `Supabase URL not found${refHint}. In Vercel → Settings → Environment Variables, set NEXT_PUBLIC_SUPABASE_URL to your Project URL from Supabase → Settings → API, then redeploy.`;
  }

  if (isSupabaseConnectionError(message) || isSupabaseConnectionError(cause)) {
    return `Cannot reach Supabase${refHint}. Check Vercel env vars match Supabase → Settings → API (URL + anon + service_role keys), unpause project at supabase.com, then redeploy.`;
  }

  return message;
}

/** Direct REST ping — surfaces DNS errors more clearly than supabase-js */
export async function pingSupabaseRest(): Promise<{ ok: boolean; message: string }> {
  const url = getSupabaseUrl().replace(/\/$/, "");
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    return { ok: false, message: "Supabase keys missing" };
  }

  try {
    const res = await fetch(`${url}/rest/v1/categories?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.ok) {
      return { ok: true, message: "Connected" };
    }
    if (res.status === 401) {
      return {
        ok: false,
        message: `Supabase rejected the service key${getSupabaseProjectRef() ? ` (project: ${getSupabaseProjectRef()})` : ""}. Recopy SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API.`,
      };
    }
    if (res.status === 404) {
      return { ok: false, message: "Connected but tables missing — run SQL migrations in Supabase" };
    }
    const body = await res.text().catch(() => "");
    return { ok: false, message: body.slice(0, 200) || `HTTP ${res.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connection failed";
    const cause = extractErrorCause(e);
    return { ok: false, message: friendlySupabaseError(msg, cause) };
  }
}
