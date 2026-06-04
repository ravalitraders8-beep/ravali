"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractorDashboard } from "@/components/ContractorDashboard";
import { IntroSplash } from "@/components/IntroSplash";
import { SetupRequired } from "@/components/SetupRequired";
import { UserPortalShell } from "@/components/UserPortalShell";
import { useCachedApi } from "@/hooks/useCachedApi";
import { fetchContractorDashboard } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { labels, t } from "@/lib/i18n";
import { getContractorSession, setContractorSession } from "@/lib/session";
import { useLang } from "@/context/LangContext";

const INTRO_MIN_MS = 2200;

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLang();
  const token = decodeURIComponent(params.token as string);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroDone(true), INTRO_MIN_MS);
    return () => window.clearTimeout(introTimer);
  }, []);

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

  if (loading || !introDone) {
    return <IntroSplash />;
  }

  if (errorType === "setup") return <SetupRequired />;

  if (error || !data || !data.category) {
    return (
      <UserPortalShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#fff8f0] p-6 text-center">
          <span className="text-6xl">😔</span>
          <p className="text-xl font-black text-red-700 sm:text-2xl">
            {t(lang, labels.notMember.en, labels.notMember.te)}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-big rounded-2xl bg-[#e85d00] px-10 text-white"
          >
            ← {t(lang, labels.backToLogin.en, labels.backToLogin.te)}
          </button>
        </div>
      </UserPortalShell>
    );
  }

  return (
    <UserPortalShell>
      <ContractorDashboard data={data} />
    </UserPortalShell>
  );
}
