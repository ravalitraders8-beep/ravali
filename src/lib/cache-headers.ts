import { NextResponse } from "next/server";

type CacheProfile = "public" | "private-short" | "no-store";

const PROFILES: Record<CacheProfile, string> = {
  public: "public, s-maxage=60, stale-while-revalidate=120",
  "private-short": "private, max-age=15, stale-while-revalidate=30",
  "no-store": "private, no-cache, no-store, must-revalidate",
};

export function jsonWithCache<T>(data: T, profile: CacheProfile, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": PROFILES[profile],
      "Content-Type": "application/json",
    },
  });
}

export function jsonNoStore<T>(data: T, status = 200) {
  return jsonWithCache(data, "no-store", status);
}
