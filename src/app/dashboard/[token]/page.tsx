"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractorDashboard } from "@/components/ContractorDashboard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SetupRequired } from "@/components/SetupRequired";
import { useCachedApi } from "@/hooks/useCachedApi";
import { fetchContractorDashboard } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { labels } from "@/lib/i18n";
import { getContractorSession, setContractorSession } from "@/lib/session";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const token = decodeURIComponent(params.token as string);

  useEffect(() => {
    const session = getContractorSession();
    if (!session || session.token.toUpperCase() !== token.toUpperCase()) {
      setContractorSession(token);
    }
  }, [token]);

  const fetcher = useCallback(
    (force?: boolean) => fetchContractorDashboard(token, force),
    [token]
  );

  const { data, loading, error } = useCachedApi(fetcher, {
    watchTags: [CACHE_TAGS.CONTRACTOR, CACHE_TAGS.ADMIN],
  });

  const errorType = useMemo(() => {
    if (!error || typeof error !== "object") return "invalid";
    const status = (error as { status?: number }).status;
    if (status === 503) return "setup";
    return "invalid";
  }, [error]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
        <LoadingSpinner message="వేచండి..." />
      </div>
    );
  }

  if (errorType === "setup") return <SetupRequired />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#fff8f0] p-6 text-center">
        <span className="text-6xl">😔</span>
        <p className="text-2xl font-black">{labels.invalidQR.te}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-big rounded-2xl bg-[#e85d00] px-10 text-white"
        >
          ← {labels.scanQR.te}
        </button>
      </div>
    );
  }

  return <ContractorDashboard data={data} />;
}
