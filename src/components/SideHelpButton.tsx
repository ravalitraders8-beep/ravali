"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HelpPanelBackground } from "./HelpPanelBackground";
import { ShopLogo } from "./ShopLogo";
import { getCategoryAbout } from "@/lib/category-about";
import { isBagsCategory } from "@/lib/category-period";
import { formatBagsThreshold, MASON_BAG_GIFTS } from "@/lib/mason-gifts";
import { aboutUs } from "@/lib/about-us";
import { SHOP_PHONE, LOGO_EN_PATH, LOGO_TE_PATH } from "@/lib/constants";
import { userMotivation } from "@/lib/motivation";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type SideHelpButtonProps = {
  bottomOffset?: string;
  /** When set, help shows only this trade (e.g. paints for painters) */
  category?: Category;
};

export function SideHelpButton({ bottomOffset = "bottom-24", category }: SideHelpButtonProps) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const trade = category ? getCategoryAbout(category) : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(lang, "Help", "సహాయం")}
        className={`fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a2744] text-2xl font-black text-white shadow-lg active:scale-95 ${bottomOffset}`}
      >
        <span className="leading-none" aria-hidden>
          ?
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label={t(lang, "Close", "మూసివేయండి")}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-us-title"
            className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl"
          >
            <HelpPanelBackground category={category} />

            <div className="relative z-10 sticky top-0 bg-[#1a2744] px-4 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {t(lang, "About Us", "మా గురించి")}
                  </p>
                  <h2 id="about-us-title" className="mt-1 text-xl font-black">
                    {trade
                      ? t(lang, trade.title.en, trade.title.te)
                      : t(lang, aboutUs.title.en, aboutUs.title.te)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl font-bold"
                  aria-label={t(lang, "Close", "మూసివేయండి")}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
              <div className="mb-5 flex justify-center">
                <ShopLogo size="md" />
              </div>

              {trade ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl" aria-hidden>
                      {trade.icon}
                    </span>
                    <p
                      className="text-xl font-black"
                      style={{ color: category?.color_hex ?? "#e85d00" }}
                    >
                      {lang === "te" ? category?.name_telugu : category?.name_english}
                    </p>
                  </div>

                  <p className="mt-4 text-base leading-relaxed text-gray-700">
                    {t(lang, trade.about.en, trade.about.te)}
                  </p>

                  <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-[#1a2744]">
                    {t(lang, "What We Have", "మా దగ్గర ఏమి ఉంది")}
                  </h3>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {trade.products.map((p) => (
                      <li
                        key={p.en}
                        className="flex flex-col items-center rounded-xl border border-[#1a2744]/10 bg-white p-3 text-center shadow-sm"
                      >
                        <span className="text-2xl" aria-hidden>
                          {p.icon}
                        </span>
                        <span className="mt-1 text-sm font-bold text-gray-800">
                          {t(lang, p.en, p.te)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 rounded-xl bg-[#1a2744]/5 p-3 text-center text-base font-bold text-[#1a2744]">
                    ★ {t(lang, trade.shopPromise.en, trade.shopPromise.te)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-lg font-black text-[#e85d00]">
                    {t(lang, aboutUs.tagline.en, aboutUs.tagline.te)}
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-gray-700">
                    {t(lang, aboutUs.intro.en, aboutUs.intro.te)}
                  </p>
                </>
              )}

              <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-[#1a2744]">
                {t(lang, "Your Gifts", "మీ బహుమతులు")}
              </h3>
              {category && isBagsCategory(category) ? (
                <ul className="mt-2 space-y-2 text-base font-semibold text-gray-700">
                  {[...MASON_BAG_GIFTS]
                    .sort((a, b) => a.minBags - b.minBags)
                    .map((g) => (
                      <li key={g.id} className="flex items-center gap-2">
                        <span className="font-black text-[#e85d00]">
                          {formatBagsThreshold(lang, g.minBags)}
                        </span>
                        <span>{lang === "te" ? g.nameTe : g.nameEn}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {t(lang, aboutUs.rewards.en, aboutUs.rewards.te)}
                </p>
              )}

              <p className="mt-4 text-sm text-gray-600">
                {t(lang, aboutUs.contact.en, aboutUs.contact.te)}
              </p>

              <a
                href={`tel:+${SHOP_PHONE}`}
                className="btn-big mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] text-white"
              >
                <span aria-hidden>📞</span>
                {t(lang, labels.contactShop.en, labels.contactShop.te)}
              </a>

              {/* Language-specific logo at bottom of help section */}
              <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-[#1a2744]/10 bg-white/90 p-5 shadow-sm">
                <Image
                  src={lang === "te" ? LOGO_TE_PATH : LOGO_EN_PATH}
                  alt="RAVALI TRADERS"
                  width={280}
                  height={320}
                  className="h-auto w-full max-w-[260px] object-contain"
                />
                <p className="mt-3 text-center text-sm font-bold text-[#1a2744]">
                  {t(lang, userMotivation.footer.en, userMotivation.footer.te)}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
