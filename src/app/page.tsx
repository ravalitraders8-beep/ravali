"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/QRScanner";
import { SetupRequired } from "@/components/SetupRequired";
import { IntroSplash } from "@/components/IntroSplash";
import { fetchSetupStatus } from "@/lib/api-client";
import { getContractorSession } from "@/lib/session";

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
    if (session?.token) {
      router.replace(`/dashboard/${encodeURIComponent(session.token)}`);
      return;
    }

    fetchSetupStatus()
      .then((d) => setReady(Boolean(d.ready && d.hasSupabase)))
      .catch(() => setReady(false))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking || !introDone) {
    return <IntroSplash />;
  }

  if (!ready) return <SetupRequired />;

  return <QRScanner />;
}
