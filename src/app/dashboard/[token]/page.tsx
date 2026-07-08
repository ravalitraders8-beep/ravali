"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractorDashboard } from "@/components/ContractorDashboard";
import { IntroSplash } from "@/components/IntroSplash";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SetupRequired } from "@/components/SetupRequired";
import { UserPortalShell } from "@/components/UserPortalShell";
import { useCachedApi } from "@/hooks/useCachedApi";
import { fetchContractorDashboard } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { parseDashboardError } from "@/lib/dashboard-errors";
import { labels, t } from "@/lib/i18n";
import {
  clearContractorSession,
  getContractorSession,
  setContractorSession,
} from "@/lib/session";
import { useLang } from "@/context/LangContext";
import { useIntroSplash } from "@/hooks/useIntroSplash";

const INTRO_MIN_MS = 2200;

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLang();
  const token = decodeURIComponent(params.token as string).trim().toUpperCase();
  const introDone = useIntroSplash(INTRO_MIN_MS);

  const fetcher = useCallback(
    (force?: boolean) => fetchContractorDashboard(token, force),
    [token]
  );

  const { data, loading, error } = useCachedApi(fetcher, {
    watchTags: [CACHE_TAGS.CONTRACTOR, CACHE_TAGS.ADMIN],
    refreshIntervalMs: 30_000,
  });

  const errorKind = useMemo(() => parseDashboardError(error), [error]);

  useEffect(() => {
    if (loading || !data?.category) return;

    const session = getContractorSession();
    if (!session || session.token.toUpperCase() !== token) {
      setContractorSession(token);
    }
  }, [loading, data, token]);

  useEffect(() => {
    if (loading || data?.category) return;
    if (!error) return;
    clearContractorSession();
  }, [loading, data, error]);

  const errorMessage = useMemo(() => {
    switch (errorKind) {
      case "inactive":
        return t(lang, labels.dashboardInactive.en, labels.dashboardInactive.te);
      case "no_category":
        return t(lang, labels.dashboardNoCategory.en, labels.dashboardNoCategory.te);
      case "invalid":
      default:
        return t(lang, labels.dashboardSignInHint.en, labels.dashboardSignInHint.te);
    }
  }, [errorKind, lang]);

  return (
    <UserPortalShell>
      {!introDone ? (
        <IntroSplash />
      ) : loading ? (
        <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
          <LoadingSpinner />
        </div>
      ) : errorKind === "setup" ? (
        <SetupRequired />
      ) : error || !data || !data.category ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#fff8f0] p-6 text-center">
          <span className="text-6xl">😔</span>
          <p className="text-xl font-black text-red-700 sm:text-2xl">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              clearContractorSession();
              router.push("/");
            }}
            className="btn-big rounded-2xl bg-[#e85d00] px-10 text-white"
          >
            ← {t(lang, labels.backToLogin.en, labels.backToLogin.te)}
          </button>
        </div>
      ) : (
        <ContractorDashboard data={data} />
      )}
    </UserPortalShell>
  );
}
