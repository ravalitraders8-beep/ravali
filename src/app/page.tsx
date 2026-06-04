"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneLogin } from "@/components/PhoneLogin";
import { SetupRequired } from "@/components/SetupRequired";
import { IntroSplash } from "@/components/IntroSplash";
import { UserPortalShell } from "@/components/UserPortalShell";
import { fetchContractorDashboard, fetchSetupStatus } from "@/lib/api-client";
import { clearContractorSession, getContractorSession } from "@/lib/session";
import { isPwaInstalled } from "@/lib/pwa-install-store";

const INTRO_MIN_MS = 2400;

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroDone(true), INTRO_MIN_MS);
    return () => window.clearTimeout(introTimer);
  }, []);

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

  if (checking || !introDone) {
    return <IntroSplash />;
  }

  if (!ready) return <SetupRequired />;

  return (
    <UserPortalShell>
      <PhoneLogin />
    </UserPortalShell>
  );
}
