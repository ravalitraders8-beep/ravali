"use client";

import { SHOP_PHONE } from "@/lib/constants";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";

export function ContactShopButton() {
  const { lang } = useLang();
  const telUrl = `tel:+${SHOP_PHONE}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#15803d]/30 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <a
        href={telUrl}
        className="btn-big mx-auto flex max-w-lg items-center justify-center gap-3 rounded-xl bg-[#15803d] text-white"
      >
        <span className="text-2xl" aria-hidden>
          📞
        </span>
        <span>{t(lang, labels.contactShop.en, labels.contactShop.te)}</span>
      </a>
    </div>
  );
}
