"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserPortalShell } from "@/components/UserPortalShell";
import { fetchContractorDashboard } from "@/lib/api-client";
import { clearContractorSession, getContractorSession } from "@/lib/session";
import { isPwaInstalled } from "@/lib/pwa-install-store";

/** /dashboard → session dashboard or home login */
export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getContractorSession();
    const mobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!session?.token || (mobile && !isPwaInstalled())) {
      router.replace("/");
      return;
    }

    const normalized = session.token.trim().toUpperCase();
    fetchContractorDashboard(normalized, true)
      .then(() => {
        router.replace(`/dashboard/${encodeURIComponent(normalized)}`);
      })
      .catch(() => {
        clearContractorSession();
        router.replace("/");
      });
  }, [router]);

  return (
    <UserPortalShell>
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
        <LoadingSpinner message="వేచండి..." />
      </div>
    </UserPortalShell>
  );
}
