"use client";

import Link from "next/link";
import { ShopLogo } from "./ShopLogo";
import { SHOP_PHONE } from "@/lib/constants";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";

export function SetupRequired() {
  const { lang } = useLang();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fff8f0] p-6 text-center">
      <ShopLogo size="lg" priority />
      <p className="mt-6 text-xl font-bold text-gray-800">
        {t(lang, labels.setupTitle.en, labels.setupTitle.te)}
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <a
          href={`tel:+${SHOP_PHONE}`}
          className="btn-big flex w-full items-center justify-center gap-3 rounded-2xl bg-[#15803d] text-white"
        >
          <span className="text-2xl">📞</span>
          {t(lang, labels.contactShop.en, labels.contactShop.te)}
        </a>
        <Link
          href="/admin"
          className="btn-big flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#e85d00] text-[#e85d00]"
        >
          🔐 {lang === "te" ? "యజమాని" : "Admin"}
        </Link>
      </div>
    </div>
  );
}
