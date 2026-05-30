"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/QRScanner";
import { SetupRequired } from "@/components/SetupRequired";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getContractorSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getContractorSession();
    if (session?.token) {
      router.replace(`/dashboard/${encodeURIComponent(session.token)}`);
      return;
    }

    fetch("/api/setup-status")
      .then((r) => r.json())
      .then((d) => setReady(Boolean(d.ready && d.hasSupabase)))
      .catch(() => setReady(false))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!ready) return <SetupRequired />;

  return <QRScanner />;
}
