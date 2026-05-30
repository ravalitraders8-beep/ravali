"use client";

import { useEffect, useState } from "react";

interface SupabaseStatus {
  connected: boolean;
  message: string;
  steps?: string[];
  categoriesCount?: number;
  hint?: string;
}

export function SupabaseSetupPanel() {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/supabase/test");
      setStatus(await res.json());
    } catch {
      setStatus({ connected: false, message: "Could not reach server" });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/supabase/test")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ connected: false, message: "Could not reach server" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;
  if (status.connected) {
    return (
      <div className="rounded-2xl border-4 border-green-300 bg-green-50 p-5 text-lg text-green-900">
        <p className="text-xl font-black">✅ డేటాబేస్ కనెక్ట్ అయింది</p>
        <p className="mt-2">{status.message}</p>
        {status.categoriesCount !== undefined && (
          <p className="mt-2 font-bold">వర్గాలు: {status.categoriesCount}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-4 border-amber-300 bg-amber-50 p-5 text-lg text-amber-950">
      <p className="text-xl font-black">⚙️ Supabase కనెక్ట్ చేయండి</p>
      <p className="mt-2 font-bold">అసలు డేటా కోసం ఇది తప్పనిసరి</p>
      <p className="mt-1">{status.message}</p>
      {status.hint && <p className="mt-2">{status.hint}</p>}
      <ol className="mt-4 list-decimal space-y-2 pl-6 font-medium">
        {(status.steps ?? [
          "supabase.com → Project → Settings → API",
          ".env.local లో keys చేర్చండి",
          "001_schema.sql + 002 + 003 SQL run చేయండి",
          "npm run dev restart చేయండి",
          "/admin లో నిజమైన కాంట్రాక్టర్లు చేర్చండి",
        ]).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => void testConnection()}
        disabled={testing}
        className="btn-big mt-4 rounded-2xl bg-[#e85d00] px-6 text-white disabled:opacity-50"
      >
        {testing ? "తనిఖీ..." : "కనెక్షన్ తనిఖీ →"}
      </button>
    </div>
  );
}
