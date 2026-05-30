"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getContractorSession } from "@/lib/session";

/** /dashboard → session dashboard or home QR scan */
export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getContractorSession();
    if (session?.token) {
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
