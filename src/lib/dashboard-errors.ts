export type DashboardErrorKind = "setup" | "invalid" | "inactive" | "no_category";

export function parseDashboardError(error: unknown): DashboardErrorKind {
  if (!error || typeof error !== "object") return "invalid";
  const e = error as { status?: number; error?: string };
  if (e.status === 503 || e.error === "supabase_not_configured") return "setup";
  if (e.error === "inactive" || e.status === 403) return "inactive";
  if (e.error === "no_category" || e.status === 422) return "no_category";
  return "invalid";
}
