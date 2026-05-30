"use client";

import Link from "next/link";
import { SHOP_NAME, SHOP_PHONE } from "@/lib/constants";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";

export function SetupRequired() {
  const { lang } = useLang();
  const telUrl = `tel:+${SHOP_PHONE}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fff8f0] p-6 text-center">
      <span className="icon-huge">🏪</span>
      <h1 className="mt-4 text-3xl font-black text-[#e85d00]">{SHOP_NAME}</h1>
      <p className="mt-6 text-2xl font-bold text-gray-900">
        {t(lang, labels.setupTitle.en, labels.setupTitle.te)}
      </p>
      <p className="mt-3 max-w-sm text-xl text-gray-600">
        {t(lang, labels.setupHint.en, labels.setupHint.te)}
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <a
          href={telUrl}
          className="btn-big flex w-full items-center justify-center gap-3 rounded-2xl bg-[#15803d] text-white"
        >
          <span className="text-3xl">📞</span>
          {t(lang, labels.contactShop.en, labels.contactShop.te)}
        </a>
        <Link
          href="/admin"
          className="btn-big flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#e85d00] bg-white text-[#e85d00]"
        >
          🔐 {lang === "te" ? "యజమాని ప్రవేశం" : "Shop Owner Login"}
        </Link>
      </div>
    </div>
  );
}
