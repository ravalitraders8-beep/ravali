"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneLogin } from "@/components/PhoneLogin";
import { SetupRequired } from "@/components/SetupRequired";
import { IntroSplash } from "@/components/IntroSplash";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserPortalShell } from "@/components/UserPortalShell";
import { fetchContractorDashboard, fetchSetupStatus } from "@/lib/api-client";
import { clearContractorSession, getContractorSession } from "@/lib/session";
import { isPwaInstalled } from "@/lib/pwa-install-store";
import { useIntroSplash } from "@/hooks/useIntroSplash";

const INTRO_MIN_MS = 2400;

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const introDone = useIntroSplash(INTRO_MIN_MS);

  useEffect(() => {
    const session = getContractorSession();
    const mobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const finishSetupCheck = () => {
      fetchSetupStatus()
        .then((d) => setReady(Boolean(d.ready && d.hasSupabase)))
        .catch(() => setReady(false))
        .finally(() => setChecking(false));
    };

    if (session?.token && (!mobile || isPwaInstalled())) {
      const normalized = session.token.trim().toUpperCase();
      fetchContractorDashboard(normalized, true)
        .then(() => {
          router.replace(`/dashboard/${encodeURIComponent(normalized)}`);
        })
        .catch(() => {
          clearContractorSession();
          finishSetupCheck();
        });
      return;
    }

    finishSetupCheck();
  }, [router]);

  return (
    <UserPortalShell>
      {!introDone ? (
        <IntroSplash />
      ) : checking ? (
        <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
          <LoadingSpinner />
        </div>
      ) : !ready ? (
        <SetupRequired />
      ) : (
        <PhoneLogin />
      )}
    </UserPortalShell>
  );
}
