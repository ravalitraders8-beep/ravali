"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShopLogo } from "./ShopLogo";
import { UserPageExtras, MobileHeaderLangToggle } from "./UserPageExtras";
import { LoadingSpinner } from "./LoadingSpinner";
import { labels, t } from "@/lib/i18n";
import { invalidateByTags, loginContractorByPhone } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { normalizePhoneInput } from "@/lib/phone-utils";
import { setContractorSession } from "@/lib/session";
import { useLang } from "@/context/LangContext";

export function PhoneLogin() {
  const router = useRouter();
  const { lang } = useLang();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhoneInput(phone);
    if (!normalized) {
      setError(t(lang, labels.invalidPhone.en, labels.invalidPhone.te));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginContractorByPhone(normalized);
      if ("error" in result) {
        setError(result.message);
        return;
      }
      const token = result.token.trim().toUpperCase();
      invalidateByTags([CACHE_TAGS.CONTRACTOR]);
      setContractorSession(token);
      router.replace(`/dashboard/${encodeURIComponent(token)}`);
    } catch {
      setError(t(lang, labels.loginFailed.en, labels.loginFailed.te));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#fff8f0]">
      <UserPageExtras showLangToggle={false} />

      <header className="relative z-10 bg-[#1a2744] px-4 pb-10 pt-3 text-white">
        <MobileHeaderLangToggle />
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <ShopLogo size="md" priority onDark href="/" />
          <h1 className="mt-4 text-center text-2xl font-black sm:text-3xl">
            {t(lang, labels.phoneLoginTitle.en, labels.phoneLoginTitle.te)}
          </h1>
          <p className="mt-2 text-center text-sm font-semibold opacity-90">
            {t(lang, labels.phoneLoginHint.en, labels.phoneLoginHint.te)}
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pt-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="card-visual rounded-3xl bg-white p-6">
          <label className="block text-sm font-bold text-gray-700">
            {t(lang, labels.phoneNumber.en, labels.phoneNumber.te)}
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={14}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
                setError(null);
              }}
              placeholder="9876543210"
              className="mt-2 min-h-[56px] w-full rounded-2xl border-2 border-gray-200 px-4 text-center text-2xl font-black tracking-wide"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, "").length < 10}
            className="btn-big mt-6 w-full rounded-2xl bg-[#e85d00] text-lg text-white disabled:opacity-60"
          >
            {loading
              ? t(lang, labels.loading.en, labels.loading.te)
              : t(lang, labels.phoneLoginButton.en, labels.phoneLoginButton.te)}
          </button>
        </form>

        <ol className="mt-8 space-y-3 rounded-2xl bg-white/80 p-4 text-sm font-bold text-[#1a2744]">
          <li>{t(lang, labels.step1Phone.en, labels.step1Phone.te)}</li>
          <li>{t(lang, labels.step2Phone.en, labels.step2Phone.te)}</li>
          <li>{t(lang, labels.step3Phone.en, labels.step3Phone.te)}</li>
        </ol>
      </main>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <LoadingSpinner message={t(lang, labels.loading.en, labels.loading.te)} />
        </div>
      )}
    </div>
  );
}
