"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLangToggle } from "@/components/AdminLangToggle";
import { ShopLogo } from "@/components/ShopLogo";
import { adminLabels, ta } from "@/lib/admin-i18n";
import { useLang } from "@/context/LangContext";
import { getAdminPinSession, setAdminPinSession } from "@/lib/session";

export function AdminGate() {
  const { lang } = useLang();
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== "undefined" && Boolean(getAdminPinSession())
  );
  const [submitting, setSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = useCallback(async (pinValue?: string) => {
    const value = (pinValue ?? pin).trim();
    if (value.length !== 6) {
      setErrorMsg(ta(lang, "Enter 6-digit PIN", "6 అంకెల PIN నమోదు చేయండి"));
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
      } else if (res.status === 401) {
        setErrorMsg(ta(lang, "Wrong PIN", "తప్పు PIN"));
        setPin("");
      } else {
        setErrorMsg(String(data.message ?? ta(lang, "Login failed", "లాగిన్ విఫలమైంది")));
      }
    } catch {
      setErrorMsg(ta(lang, "Network error", "నెట్‌వర్క్ లోపం"));
    } finally {
      setSubmitting(false);
    }
  }, [lang, pin]);

  const onPinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setErrorMsg(null);
    if (digits.length === 6) void handleLogin(digits);
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fff8f0]">
        <div className="bg-[#1a2744] px-4 py-6 text-white">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <ShopLogo size="md" priority />
              <p className="mt-2 text-lg font-bold opacity-90">
                {ta(lang, adminLabels.admin.en, adminLabels.admin.te)}
              </p>
            </div>
            <AdminLangToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border-2 border-[#e85d00]/20 bg-white p-5 shadow-lg sm:p-8">
            <p className="mb-6 text-center text-xl font-black sm:text-2xl">
              {ta(lang, "Enter PIN", "PIN నమోదు చేయండి")}
            </p>

            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              placeholder="• • • • • •"
              aria-label="Admin PIN"
              className={`min-h-[64px] w-full rounded-2xl border-4 px-4 text-center text-3xl tracking-[0.4em] sm:text-4xl ${
                errorMsg ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#e85d00]"
              }`}
              disabled={submitting}
              autoFocus
            />

            {errorMsg && (
              <p className="mt-4 rounded-xl bg-red-100 p-3 text-center font-bold text-red-800">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={pin.length !== 6 || submitting}
              className="btn-big mt-6 w-full rounded-2xl bg-[#e85d00] text-white disabled:opacity-40"
            >
              {submitting
                ? ta(lang, adminLabels.loading.en, adminLabels.loading.te)
                : ta(lang, "Enter →", "లోపలికి →")}
            </button>

            <Link
              href="/"
              className="btn-big mt-3 flex items-center justify-center rounded-2xl border-2 border-gray-200 font-bold text-gray-700"
            >
              ← {ta(lang, "Home", "హోమ్")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
