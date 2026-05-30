/** Shared cache tags — server (revalidateTag) + client (invalidateByTag) */
export const CACHE_TAGS = {
  ADMIN: "admin-data",
  CONTRACTOR: "contractor-data",
  SETUP: "setup-status",
  PUBLIC: "public-data",
  SUPABASE_TEST: "supabase-test",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const CACHE_TTL = {
  setup: 60_000,
  supabaseTest: 30_000,
  public: 60_000,
  contractor: 20_000,
  adminStats: 15_000,
  adminData: 15_000,
} as const;
