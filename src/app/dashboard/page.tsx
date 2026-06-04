"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getContractorSession } from "@/lib/session";
import { isPwaInstalled } from "@/lib/pwa-install-store";

/** /dashboard → session dashboard or home login */
export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getContractorSession();
    const mobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (session?.token && (!mobile || isPwaInstalled())) {
      router.replace(`/dashboard/${encodeURIComponent(session.token)}`);
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
      <LoadingSpinner message="వేచండి..." />
    </div>
  );
}
