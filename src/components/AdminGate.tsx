"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SHOP_NAME } from "@/lib/constants";
import { getAdminPinSession, setAdminPinSession } from "@/lib/session";

interface SetupStatus {
  hasPin: boolean;
  hasSupabase: boolean;
  ready: boolean;
  message: string;
}

export function AdminGate() {
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== "undefined" && Boolean(getAdminPinSession())
  );
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupStatus | null>(null);

  useEffect(() => {
    fetch("/api/setup-status")
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => null)
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = useCallback(async (pinValue?: string) => {
    const value = (pinValue ?? pin).trim();
    if (value.length !== 6) {
      setErrorMsg("6 అంకెల PIN నమోదు చేయండి");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setAdminPinSession(value);
        setAuthenticated(true);
        setErrorMsg(null);
      } else if (res.status === 503) {
        setErrorMsg(data.message ?? "PIN not configured in .env.local");
      } else if (res.status === 401) {
        setErrorMsg("తప్పు PIN — మళ్ళీ ప్రయత్నించండి");
        setPin("");
      } else {
        setErrorMsg(data.message ?? "Something went wrong.");
      }
    } catch {
      setErrorMsg("నెట్‌వర్క్ లోపం — మళ్ళీ ప్రయత్నించండి");
    } finally {
      setSubmitting(false);
    }
  }, [pin]);

  const onPinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setErrorMsg(null);
    if (digits.length === 6) {
      void handleLogin(digits);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f0]">
        <LoadingSpinner message="వేచండి..." />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fff8f0]">
        <div className="bg-[#e85d00] px-4 py-8 text-center text-white">
          <span className="text-4xl">🔐</span>
          <h1 className="mt-3 text-3xl font-black">{SHOP_NAME}</h1>
          <p className="mt-2 text-xl">యజమాని ప్రవేశం</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          {!setup?.hasSupabase && (
            <div className="mb-6 w-full max-w-sm">
              <SupabaseSetupPanel />
            </div>
          )}

          <div className="w-full max-w-sm rounded-2xl border-4 border-[#e85d00]/20 bg-white p-6 shadow-lg">
            <p className="mb-6 text-center text-2xl font-black text-gray-900">
              PIN నమోదు చేయండి
            </p>

            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pin.length === 6 && handleLogin()}
              placeholder="• • • • • •"
              aria-label="Admin PIN"
              className={`min-h-[72px] w-full rounded-2xl border-4 px-4 text-center text-4xl tracking-[0.5em] transition-colors ${
                errorMsg ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#e85d00]"
              }`}
              disabled={submitting}
              autoFocus
            />

            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-red-100 p-4 text-center text-lg font-bold text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={pin.length !== 6 || submitting}
              className="btn-big mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e85d00] text-white disabled:opacity-40"
            >
              {submitting ? "వేచండి..." : "లోపలికి వెళ్ళండి →"}
            </button>

            <Link
              href="/"
              className="btn-big mt-4 flex items-center justify-center rounded-2xl border-2 border-gray-300 text-lg font-bold text-gray-700"
            >
              ← హోమ్
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard hasSupabase={setup?.hasSupabase ?? false} />;
}
