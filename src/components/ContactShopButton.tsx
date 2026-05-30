"use client";

import { SHOP_PHONE } from "@/lib/constants";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";

export function ContactShopButton() {
  const { lang } = useLang();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
      <a
        href={`tel:+${SHOP_PHONE}`}
        className="btn-big mx-auto flex max-w-lg items-center justify-center gap-3 rounded-2xl bg-[#15803d] text-lg text-white"
      >
        <span className="text-3xl" aria-hidden>
          📞
        </span>
        <span>{t(lang, labels.contactShop.en, labels.contactShop.te)}</span>
      </a>
    </div>
  );
}
