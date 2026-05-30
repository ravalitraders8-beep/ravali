"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContractorDashboard } from "@/components/ContractorDashboard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SetupRequired } from "@/components/SetupRequired";
import { getContractorSession, setContractorSession } from "@/lib/session";
import { labels } from "@/lib/i18n";
import type { ContractorDashboardData } from "@/lib/types";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const token = decodeURIComponent(params.token as string);
  const [data, setData] = useState<ContractorDashboardData | null>(null);
  const [error, setError] = useState<"invalid" | "setup" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getContractorSession();
    if (!session || session.token.toUpperCase() !== token.toUpperCase()) {
      setContractorSession(token);
    }

    fetch(`/api/contractor/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 503) {
          setError("setup");
          return;
        }
        if (!res.ok) {
          setError("invalid");
          return;
        }
        setData(await res.json());
      })
      .catch(() => setError("invalid"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
        <LoadingSpinner message="వేచండి..." />
      </div>
    );
  }

  if (error === "setup") return <SetupRequired />;

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
