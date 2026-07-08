"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeCache } from "@/lib/api-cache";
import type { CacheTag } from "@/lib/cache-tags";

interface UseCachedApiOptions {
  watchTags?: CacheTag[];
  refreshOnFocus?: boolean;
  /** Poll for fresh data while the tab is visible (ms). */
  refreshIntervalMs?: number;
}

export function useCachedApi<T>(
  fetcher: (force?: boolean) => Promise<T>,
  options: UseCachedApiOptions = {}
) {
  const { watchTags = [], refreshOnFocus = true, refreshIntervalMs } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const result = await fetcher(force);
        setData(result);
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    // Always fetch fresh from Supabase on mount — never show stale cached rows
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial cached fetch on mount
    void load(true);
  }, [load]);

  useEffect(() => {
    return subscribeCache((invalidatedTags) => {
      if (watchTags.length === 0) return;
      if (invalidatedTags.some((t) => watchTags.includes(t))) {
        void load(true);
      }
    });
  }, [load, watchTags]);

  useEffect(() => {
    if (!refreshOnFocus) return;
    const onFocus = () => void load(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load, refreshOnFocus]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [load, refreshIntervalMs]);

  return { data, loading, error, refresh: () => load(true) };
}
