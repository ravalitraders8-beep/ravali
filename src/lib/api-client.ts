import { cachedFetch, invalidateByTags, syncAfterMutation } from "./api-cache";
import { CACHE_TAGS, CACHE_TTL } from "./cache-tags";
import { adminFetch } from "./session";
import type { ContractorDashboardData } from "./types";

export interface SetupStatus {
  ready: boolean;
  hasPin: boolean;
  hasSupabase: boolean;
  hasUrl?: boolean;
  hasAnonKey?: boolean;
  message: string;
}

export interface SupabaseTestStatus {
  connected: boolean;
  message: string;
  steps?: string[];
  categoriesCount?: number;
  hint?: string;
}

export interface AdminStats {
  totalActive: number;
  monthTotalAmount: number;
  topContractor: { name_telugu: string; amount: number } | null;
  targetAchievedCount: number;
  leaderboard: Array<{ name_telugu: string; total_amount: number; category_telugu: string }>;
  monthYear: string;
}

export interface AdminData {
  contractors: unknown[];
  transactions: unknown[];
  rewards: unknown[];
  categories: unknown[];
  rewardLevels: unknown[];
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export function fetchSetupStatus(force = false) {
  return cachedFetch(
    "api:setup-status",
    async () => {
      const res = await fetch("/api/setup-status", { cache: "no-store" });
      return parseJson<SetupStatus>(res);
    },
    { ttl: CACHE_TTL.setup, tags: [CACHE_TAGS.SETUP], force }
  );
}

export function fetchSupabaseTest(force = false) {
  return cachedFetch(
    "api:supabase-test",
    async () => {
      const res = await fetch("/api/supabase/test", { cache: "no-store" });
      return parseJson<SupabaseTestStatus>(res);
    },
    { ttl: CACHE_TTL.supabaseTest, tags: [CACHE_TAGS.SUPABASE_TEST], force }
  );
}

export function fetchContractorDashboard(token: string, force = false) {
  const normalized = token.trim().toUpperCase();
  const key = `api:contractor:${normalized}`;

  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`/api/contractor/${encodeURIComponent(normalized)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw { status: res.status, ...body };
      }
      return parseJson<ContractorDashboardData>(res);
    },
    { ttl: CACHE_TTL.contractor, tags: [CACHE_TAGS.CONTRACTOR], force }
  );
}

export function fetchAdminStats(force = false) {
  return cachedFetch(
    "api:admin:stats",
    async () => {
      const res = await adminFetch("/api/admin", { cache: "no-store" });
      if (!res.ok) throw { status: res.status, ...(await res.json().catch(() => ({}))) };
      return parseJson<AdminStats>(res);
    },
    { ttl: CACHE_TTL.adminStats, tags: [CACHE_TAGS.ADMIN], force }
  );
}

export function fetchAdminData(force = false) {
  return cachedFetch(
    "api:admin:data",
    async () => {
      const res = await adminFetch("/api/admin", { method: "PATCH", cache: "no-store" });
      if (!res.ok) throw { status: res.status, ...(await res.json().catch(() => ({}))) };
      return parseJson<AdminData>(res);
    },
    { ttl: CACHE_TTL.adminData, tags: [CACHE_TAGS.ADMIN], force }
  );
}

export async function fetchAdminBundle(force = false) {
  const [stats, data] = await Promise.all([
    fetchAdminStats(force),
    fetchAdminData(force),
  ]);
  return { stats, data };
}

export async function adminPostAction(body: Record<string, unknown>) {
  const res = await adminFetch("/api/admin", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    syncAfterMutation();
  }
  return { ok: res.ok, status: res.status, data };
}

export function invalidateSetupCache() {
  invalidateByTags([CACHE_TAGS.SETUP, CACHE_TAGS.SUPABASE_TEST]);
}

export { syncAfterMutation, invalidateByTags };
